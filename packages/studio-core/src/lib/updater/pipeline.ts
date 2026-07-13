/**
 * updater/pipeline.ts
 *
 * Core OTA update pipeline:
 *   - UpdatePipelineCoordinatorClass / UpdatePipelineCoordinator (queue + cancel)
 *   - PipelineCancelledError
 *   - resetOtaUpdateState, enforceStartupRecovery
 *   - checkForUpdate / executeCheckForUpdateInternal
 *   - downloadUpdate / downloadUpdateInternal
 *   - applyUpdate / applyUpdateInternal
 *   - initializeGlobalOtaListeners
 *   - checkAndCleanCache
 *   - triggerDowngrade
 */

import { useCallback } from 'react';
import { APP_VERSION, compareSemver, parseAndNormalizeVersion } from '../appVersion';
import { AppInstaller } from '../apkDownloader';
import { releaseMetadataInspector } from './versionLogger';
import { isNative, shouldUseAndroidApkUpdater } from '../capgoUpdater';
import { isAppInstallerAvailable } from './diagnostics';
import { nativeSet, NATIVE_PREFS } from '../nativePrefs';
import { useNavigationStore } from '../../store/useNavigationStore';
import { logActivity } from '../activityLogger';
import { PerformanceProfiler } from '../performanceProfiler';
import { UpdaterFlightRecorder } from './flightRecorder';

import {
  globalOtaState,
  updateGlobalState,
  transitionToState,
  stopWatchdog,
  stateListeners,
  setActivePipelineContext,
  activePipelineContext,
  type CentralizedOtaState,
  type OtaUpdateState,
  isUpdateSessionActive,
  isInstallationLocked,
  isPostInstallSessionActive,
  getPostInstallSessionInfo,
  startUpdateSession,
  activeUpdateSession,
  verifyAndCleanCaches,
} from './stateMachine';

import {
  type RemoteVersionInfo,
  fetchRemoteVersion,
  versionJsonUrls,
  validateRemoteMetadata,
  logPipelineTrace,
} from './releaseMetadata';
import { compareVersions } from './versionComparison';
import { downloadUpdateApk, downloadAndInstallGitHubApk } from './downloadManager';
import { verifyFileIntegrity } from './integrityVerification';
import { runEligibilityCheck } from './eligibilityVerification';
import { triggerNativeInstall, processLastInstallResult } from './installer';
import { runSignatureMismatchRecovery, isRecovering, setIsRecovering } from './recovery';
import {
  updaterSimulation,
  setSimulateStatusCallback,
  simulateStatusCallback,
  addJsLog,
  triggerSimulatedStatus,
  isSimulationActive,
} from './updaterSimulation';
import {
  validateLocalApk,
  deleteLocalApk,
  getLocalApkPath,
  recordDismissal,
  shouldShowRecoveryReminder,
} from './cacheManager';
import {
  otaDebugLogs,
  otaDiagnostics,
  logProgressStage,
  populateDiagnostics,
  nextJsCallId,
  runUpdaterHealthCheck,
  getDiagnosticsReport,
  type HealthStatus,
  logTimelineEvent,
  interceptIllegalCall,
  startDiagnosticsSession,
  resetOtaTimeline,
  otaTimeline,
  getTimelineReport,
  recordCloseEvent,
  recordUpToDatePopup,
  logInstallLockEvent,
} from './diagnostics';

import { logDiagnosticEvent, logDetailedJsTrace } from './telemetry';
import { getStoredList, addToStoredList, getSessionItem, setSessionItem, removeSessionItem, getNativeVersion, getNativeVersionCode } from './sessionStorage';
import { getPackageInstallerStatusName } from './packageInstallerStatus';
import { getUpdateHistory, logUpdateTransition } from './updateHistory';

// ─── Pipeline Error ────────────────────────────────────────────────────────

export class PipelineCancelledError extends Error {
  constructor(message = 'Update pipeline cancelled') {
    super(message);
    this.name = 'PipelineCancelledError';
  }
}

// ─── Pipeline Coordinator ─────────────────────────────────────────────────

interface PipelineRequest {
  id: number;
  isManual: boolean;
  trigger: string;
  reason: string;
  resolve: (value: CentralizedOtaState) => void;
  reject: (reason: any) => void;
  promise: Promise<CentralizedOtaState>;
}

export class UpdatePipelineCoordinatorClass {
  private activePipelineId: number = 0;
  private currentPromise: Promise<CentralizedOtaState> | null = null;
  private currentRequest: PipelineRequest | null = null;
  private requestQueue: PipelineRequest[] = [];

  // Diagnostics & Telemetry
  public coalescedEventCount: number = 0;
  public cancelledPipelineCount: number = 0;
  public ignoredStaleCallbacksCount: number = 0;
  public activeAsyncStage: string = 'IDLE';

  public getDiagnostics() {
    return {
      activePipelineId: this.activePipelineId,
      queueDepth: this.requestQueue.length,
      coalescedEventCount: this.coalescedEventCount,
      cancelledPipelineCount: this.cancelledPipelineCount,
      ignoredStaleCallbacksCount: this.ignoredStaleCallbacksCount,
      activeAsyncStage: this.activeAsyncStage,
      currentOwner: this.currentRequest?.isManual ? 'manual' : 'automatic',
      currentTrigger: this.currentRequest?.trigger || 'N/A',
      currentReason: this.currentRequest?.reason || 'N/A',
    };
  }

  public dispatch(isManual: boolean, trigger: string, reason: string): Promise<CentralizedOtaState> {
    const pipelineId = ++this.activePipelineId;
    console.log(`[UpdatePipelineCoordinator] Dispatched pipeline #${pipelineId} (isManual=${isManual}, trigger=${trigger}, reason=${reason})`);

    if (this.currentPromise && this.currentRequest) {
      if (!isManual || this.currentRequest.isManual) {
        console.log(`[UpdatePipelineCoordinator] Coalescing pipeline #${pipelineId} into running pipeline #${this.currentRequest.id}`);
        this.coalescedEventCount++;
        return this.currentPromise;
      } else {
        console.log(`[UpdatePipelineCoordinator] Superseding active background pipeline #${this.currentRequest.id} with manual pipeline #${pipelineId}`);
        this.cancelledPipelineCount++;
      }
    }

    let resolveFn!: (value: CentralizedOtaState) => void;
    let rejectFn!: (reason: any) => void;
    const promise = new Promise<CentralizedOtaState>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const request: PipelineRequest = {
      id: pipelineId,
      isManual,
      trigger,
      reason,
      resolve: resolveFn,
      reject: rejectFn,
      promise,
    };

    if (this.currentPromise) {
      if (isManual) {
        this.requestQueue = this.requestQueue.filter(r => {
          if (!r.isManual) {
            console.log(`[UpdatePipelineCoordinator] Discarding obsolete queued background pipeline #${r.id}`);
            r.resolve(globalOtaState);
            return false;
          }
          return true;
        });
      }
      this.requestQueue.push(request);
      return promise;
    }

    void this.executeRequest(request);
    return promise;
  }

  private async executeRequest(request: PipelineRequest) {
    this.currentRequest = request;
    this.currentPromise = request.promise;
    const startTime = Date.now();

    try {
      this.activeAsyncStage = 'AWAIT_STARTUP_RECOVERY';
      if (startupRecoveryPromise) {
        await startupRecoveryPromise;
      }

      if (request.id !== this.activePipelineId) {
        throw new PipelineCancelledError(`Pipeline #${request.id} cancelled during startup recovery block`);
      }

      const result = await executeCheckForUpdateInternal(request.id, request.isManual, request.trigger, request.reason);
      request.resolve(result);
    } catch (err) {
      if (err instanceof PipelineCancelledError) {
        console.log(`[UpdatePipelineCoordinator] Pipeline #${request.id} aborted: ${(err as Error).message}`);
        request.resolve(globalOtaState);
      } else {
        request.reject(err);
      }
    } finally {
      this.activeAsyncStage = 'IDLE';
      const duration = Date.now() - startTime;
      console.log(`[UpdatePipelineCoordinator] Pipeline #${request.id} finished in ${duration}ms`);

      this.currentRequest = null;
      this.currentPromise = null;

      const diagnostics = this.getDiagnostics();
      otaDiagnostics.pipelineId = diagnostics.activePipelineId;
      otaDiagnostics.triggerSource = diagnostics.currentTrigger;
      otaDiagnostics.pipelineOwner = diagnostics.currentOwner;
      otaDiagnostics.queueDepth = diagnostics.queueDepth;
      otaDiagnostics.coalescedEventCount = diagnostics.coalescedEventCount;
      otaDiagnostics.cancelledPipelineCount = diagnostics.cancelledPipelineCount;
      otaDiagnostics.ignoredStaleCallbacksCount = diagnostics.ignoredStaleCallbacksCount;
      otaDiagnostics.activeAsyncStage = diagnostics.activeAsyncStage;
      otaDiagnostics.pipelineDuration = duration;

      if (this.requestQueue.length > 0) {
        const nextReq = this.requestQueue.shift()!;
        void this.executeRequest(nextReq);
      }
    }
  }

  public getActivePipelineId() {
    return this.activePipelineId;
  }

  public setStage(stage: string) {
    this.activeAsyncStage = stage;
  }
}

export const UpdatePipelineCoordinator = new UpdatePipelineCoordinatorClass();

// ─── Private helpers ──────────────────────────────────────────────────────

function checkCancellation(pipelineId: number, stage: string) {
  UpdatePipelineCoordinator.setStage(stage);
  if (pipelineId !== UpdatePipelineCoordinator.getActivePipelineId()) {
    UpdatePipelineCoordinator.cancelledPipelineCount++;
    throw new PipelineCancelledError(`Pipeline #${pipelineId} superseded/cancelled at stage: ${stage}`);
  }
}

function safeTransition(expectedState: OtaUpdateState, nextState: OtaUpdateState, reason: string, failureReason?: string): boolean {
  if (globalOtaState.updateState !== expectedState) {
    console.warn(`[OTA] Aborting transition to ${nextState} because expected state ${expectedState} does not match current state ${globalOtaState.updateState}.`);
    return false;
  }
  transitionToState(nextState, reason, failureReason);
  return true;
}

async function delayForSim(ms: number) {
  if (updaterSimulation.runWorkflowActive) {
    // High-fidelity slow simulation for visual inspection (e.g. 200ms per download step)
    await new Promise((resolve) => setTimeout(resolve, ms * 20));
  } else if (updaterSimulation.simulateDownloadThrottling) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

// ─── Queue/State variables ────────────────────────────────────────────────

let currentSessionStartTime = 0;
let latestCheckId = 0;
let activeCheckIsManual = false;
let activeCheckPromise: Promise<CentralizedOtaState> | null = null;
let activeDownloadPromise: Promise<void> | null = null;
let activeApplyPromise: Promise<void> | null = null;
let startupRecoveryPromise: Promise<void> | null = null;
let isDownloading = false;
let isApplying = false;
let lastCheckedTime = 0;
let activeInstallPromiseResolver: (() => void) | null = null;
let activeInstallPromiseRejecter: ((err: Error) => void) | null = null;
let isOtaInitialized = false;
let lastInstallProgressTime = 0;

/**
 * Holds the in-flight promise for checkAndRecoverInstallState() while the app
 * is resuming from background. This is the sequencing gate that prevents
 * triggerOtaUpdateCheck from reading isInstallationLocked() before the native
 * IPC query (getLastInstallResult) has resolved and set installationJustCompleted.
 *
 * The window where this is non-null is typically 100–500ms on real devices.
 * On a normal resume with no active session it resolves in < 10ms.
 */
let installRecoveryPromise: Promise<void> | null = null;

/**
 * Returns the current in-flight install-state recovery promise, or null if
 * no recovery is running. Consumed by startupCoordinator.triggerOtaUpdateCheck
 * to sequence update checks AFTER native install-result IPC resolves.
 */
export function getInstallRecoveryPromise(): Promise<void> | null {
  return installRecoveryPromise;
}

const MIN_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function resetLastCheckedTime() {
  lastCheckedTime = 0;
}

// ─── Reset / Startup Recovery ─────────────────────────────────────────────

export function resetOtaUpdateState() {
  const isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node;
  const isBusy = ['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'].includes(globalOtaState.updateState);
  if (!isNode && isBusy) {
    console.warn('[OTA] Rejecting resetOtaUpdateState: PackageInstaller is currently active.');
    return;
  }
  if (activeCheckPromise || activeDownloadPromise || activeApplyPromise || UpdatePipelineCoordinator.activeAsyncStage !== 'IDLE') {
    console.warn('[OTA] Rejecting resetOtaUpdateState: an update operation is currently active.');
    return;
  }
  transitionToState('IDLE', 'Reset update state');
  try {
    localStorage.removeItem('studio:is_simulation_active');
  } catch (_) {}
  recordCloseEvent('resetOtaUpdateState called');
  updateGlobalState({
    progress: 0,
    error: null,
    statusText: null,
    remoteVersion: null,
    updateAvailable: false,
    mandatory: false,
    changelog: null,
    releaseNotes: null,
    decisionExplanation: null,
  });
}

export function enforceStartupRecovery(): Promise<void> {
  if (startupRecoveryPromise) {
    return startupRecoveryPromise;
  }

  logTimelineEvent('UpdateCore', 'STARTUP_RECOVERY_TRIGGERED');
  logDiagnosticEvent('RECOVERY_STARTED');

  startupRecoveryPromise = (async () => {
    console.log('[OTA DEBUG] enforceStartupRecovery starting...');

    const session = activeUpdateSession;
    if (!session) {
      console.log('[OTA Startup] No active session. Cleaning up storage.');
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('studio:is_simulation_active');
          localStorage.removeItem('studio:install_in_progress');
        }
      } catch (_) {}

      // P3: On cold start, always check native SharedPreferences for a
      // pending install result — even without an active session. This covers
      // the case where the old process was killed during installation and
      // the session was lost, but the install actually completed.
      if (isPostInstallSessionActive()) {
        console.log('[OTA Startup] Post-install session is active (version matched). Checking native install result...');
        try {
          const { AppInstaller: NativeInstaller } = await import('../apkDownloader');

          // First check if an installation is still actively running
          const activeCheck = await NativeInstaller.isInstallActive();
          if (activeCheck.active) {
            console.log('[OTA Startup] Active PackageInstaller session detected on cold start. Setting state to INSTALLING.');
            updateGlobalState({
              statusText: 'Installing update...',
              sessionId: typeof activeCheck.sessionId === 'number' ? activeCheck.sessionId : null,
            });
            transitionToState('INSTALLING', 'Active PackageInstaller session detected on cold start (no session)');
            return;
          }

          // No active session — check SharedPreferences for a completed result
          const result = await NativeInstaller.getLastInstallResult();
          console.log('[OTA Startup] Cold start install result:', result);

          if (result.statusCode === 0) {
            console.log('[OTA Startup] SUCCESS result detected on cold start (no session). Showing completion screen.');
            transitionToState('INSTALL_SUCCESS', 'Native install completed (cold start, no session)');
            await NativeInstaller.clearInstallerLogHistory().catch(() => {});
            return;
          } else if (result.statusCode > 0 && result.statusCode !== -999) {
            console.log(`[OTA Startup] FAILURE result detected on cold start (no session): ${result.statusMessage}`);
            const processed = processLastInstallResult(result);
            updateGlobalState({ error: processed?.errMsg || 'Install failed' });
            transitionToState('INSTALL_FAILED', 'Native install failed on cold start (no session)');
            return;
          } else if (result.statusCode === -999) {
            // Installation may still be in progress (committed but not completed)
            console.log('[OTA Startup] Install in progress on cold start (no session). Setting state to INSTALLING.');
            transitionToState('INSTALLING', 'Installation in progress on cold start (no session)');
            updateGlobalState({ statusText: 'Installing update...' });
            return;
          }
        } catch (err) {
          console.warn('[OTA Startup] Error checking native install result on cold start:', err);
        }
      }

      // Never reset OTA state if an installation just completed — the
      // PackageInstaller callback may have already transitioned to INSTALL_SUCCESS
      // and the UI needs to show the completion screen before we clear state.
      if (isInstallationLocked()) {
        console.log('[OTA Startup] enforceStartupRecovery: skipping resetOtaUpdateState — installation is locked.');
        logInstallLockEvent('RECOVERY_SKIPPED', 'enforceStartupRecovery: resetOtaUpdateState skipped — installation is locked');
        return;
      }
      resetOtaUpdateState();
      return;
    }

    console.log(`[OTA Startup] Active session found: ${session.sessionId} (state: ${session.currentState})`);
    const shouldSimulate = !isNative() || !isAppInstallerAvailable() || isSimulationActive();

    if (session.currentState === 'DOWNLOAD_APK') {
      console.log('[OTA Startup] Resuming interrupted download session...');
      void downloadUpdate('recovery_on_startup');
      return;
    }

    if (['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'].includes(session.currentState)) {
      console.log('[OTA Startup] Resuming active install session...');
      if (shouldSimulate) {
        transitionToState('WAITING_USER_CONFIRMATION', 'Resuming simulated install session');
        updateGlobalState({ statusText: 'Ready to install (Simulated)' });
        return;
      }

      try {
        const { AppInstaller } = await import('../apkDownloader');
        const check = await AppInstaller.isInstallActive();

        if (check.active) {
          console.log('[OTA Startup] Active PackageInstaller session detected. Setting state to INSTALLING.');
          updateGlobalState({
            statusText: 'Installing update...',
            sessionId: typeof check.sessionId === 'number' ? check.sessionId : null,
          });
          transitionToState('INSTALLING', 'Active PackageInstaller session detected on startup');
          return;
        }

        const result = await AppInstaller.getLastInstallResult();
        if (result.statusCode !== -999) {
          const isStale = (result.timestamp && result.timestamp < session.creationTimestamp) ||
                          (session.targetVersion && result.expectedVersionName !== session.targetVersion);

          if (!isStale) {
            if (result.statusCode === 0) {
              console.log('[OTA Startup] Success result detected on resume.');
              transitionToState('INSTALL_SUCCESS', 'Native install completed');
              await AppInstaller.clearInstallerLogHistory().catch(() => {});
            } else {
              console.log('[OTA Startup] Failure result detected on resume:', result.statusMessage);
              const processed = processLastInstallResult(result);
              updateGlobalState({ error: processed?.errMsg || 'Install failed' });
              transitionToState('INSTALL_FAILED', 'Native install failed on resume');
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[OTA Startup] Error checking active session:', err);
      }

      transitionToState('WAITING_USER_CONFIRMATION', 'Install session lost, ready for retry');
    }
  })();

  return startupRecoveryPromise;
}

// ─── Cache Cleanup ────────────────────────────────────────────────────────

export async function checkAndCleanCache(): Promise<boolean> {
  const ver = globalOtaState.remoteVersion;
  if (!ver) {
    updateGlobalState({ validApkExists: false });
    return false;
  }

  if (updaterSimulation.forceCachedApk) {
    addJsLog('[Simulation] Forcing valid cached APK check to true');
    updateGlobalState({ validApkExists: true });
    return true;
  }

  const expectedHash = globalOtaState.apkSha256 ?? undefined;
  const { valid, filePath } = await validateLocalApk(ver, expectedHash);

  updateGlobalState({ validApkExists: valid });

  if (!valid && filePath) {
    await deleteLocalApk(ver);
  }

  return valid;
}

// ─── Check Pipeline ───────────────────────────────────────────────────────

async function executeCheckForUpdateInternal(pipelineId: number, isManual = false, trigger = 'unknown', reason = 'unknown'): Promise<CentralizedOtaState> {
  const current = globalOtaState.updateState;

  const isBusy = [
    'FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'VERIFY_SHA256',
    'PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE', 'INSTALLING', 'INSTALL_SUCCESS',
  ].includes(current);

  if (isBusy) {
    console.log(`[OTA] Skipping executeCheckForUpdateInternal: installer is currently busy (state: ${current})`);
    return globalOtaState;
  }

  if (!isManual && current !== 'IDLE') {
    console.log(`[OTA] Skipping background executeCheckForUpdateInternal: current state is ${current}`);
    return globalOtaState;
  }

  if (!isManual) {
    const now = Date.now();
    if (now - lastCheckedTime < MIN_AUTO_CHECK_INTERVAL_MS) {
      console.log('[OTA] Skipping auto-check, checked recently (rate limited).');
      return globalOtaState;
    }
  }

  if (isManual) {
    removeSessionItem('studio:laterUpdateVersion');
    removeSessionItem('studio:autoOpenedUpdateVersion');
  }

  const callId = nextJsCallId();

  let callerInfo = 'Unknown';
  try {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      if (lines.length > 2) {
        callerInfo = lines[2].trim();
      }
    }
  } catch {
    /* ignore */
  }

  logDetailedJsTrace('checkForUpdate', 'pipeline.ts', 326, `Entering executeCheckForUpdateInternal Call #${callId} for pipeline #${pipelineId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger} | Reason: ${reason}` });

  verifyAndCleanCaches();

  const startTime = Date.now();
  const currentStatus = globalOtaState.updateState;
  const isTransient = [
    'FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'VERIFY_SHA256',
    'PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE', 'INSTALLING', 'INSTALL_SUCCESS'
  ].includes(currentStatus);

  if (isTransient) {
    console.log(`[OTA] checkForUpdate check ignored because update/install is already in progress (state: ${currentStatus})`);
    const duration = Date.now() - startTime;
    logDetailedJsTrace('checkForUpdate', 'pipeline.ts', 584, `Exiting checkForUpdate Call #${callId} early (active operation in progress)`, { durationMs: duration, prevState: currentStatus, nextState: currentStatus });
    return Promise.resolve(globalOtaState);
  }

  setActivePipelineContext({ checkId: pipelineId, trigger, pipelineStartTime: startTime });
  if (globalOtaState.updateState !== 'IDLE') {
    transitionToState('IDLE', 'Resetting to IDLE before starting check');
  }
  transitionToState('INITIALIZING', 'checkForUpdate start');
  try {
    if (updaterSimulation.forceMetadataFailure) {
      addJsLog('Simulation override: Injecting Metadata Fetch Failure');
      throw new Error('[Metadata Failure] Simulated network metadata fetch failure.');
    }

    if (updaterSimulation.forceRecoveryMode) {
      addJsLog('Simulation override: Forcing Recovery Mode');
      updateGlobalState({ consecutiveFailures: 5, recoveryMode: true });
    }

    UpdatePipelineCoordinator.setStage('AWAIT_NATIVE_VERSION_QUERY');
    const natVer = await getNativeVersion();
    const natVerCode = await getNativeVersionCode();
    logTimelineEvent('UpdateCore', 'NATIVE_VERSION_QUERIED', `v${natVer} (Code: ${natVerCode})`);

    if (!safeTransition('INITIALIZING', 'FETCH_REMOTE_METADATA', 'Fetching remote manifest')) {
      const duration = Date.now() - startTime;
      console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
      return globalOtaState;
    }

    UpdatePipelineCoordinator.setStage('AWAIT_FETCH_METADATA');
    const realRemote = await fetchRemoteVersion();
    console.log(`[OTA DIAGNOSTICS] fetchRemoteVersion returned:`, realRemote);
      
    logTimelineEvent('UpdateCore', 'MANIFEST_FETCHED', realRemote ? `Version: ${realRemote.version} (Code: ${realRemote.versionCode})` : 'Failed');
    checkCancellation(pipelineId, 'AWAIT_METADATA_VALIDATION');

    let remote;
    if (updaterSimulation.forceUpdateAvailable) {
      let targetVersion = '5.0.0';
      if (natVer) {
        const parts = natVer.split('.');
        if (parts.length >= 3) {
          const patch = parseInt(parts[2], 10);
          if (!isNaN(patch)) {
            parts[2] = String(patch + 1);
            targetVersion = parts.join('.');
          }
        }
      }
      const targetCode = (natVerCode ?? 0) + 1;
      remote = {
        version: targetVersion,
        versionCode: targetCode,
        mandatory: updaterSimulation.forceMandatoryUpdate,
        apkUrl: realRemote?.apkUrl || 'https://github.com/MAGEXE1000/Studio/releases/download/v4.0.16/studio-4.0.16.apk',
        apkSha256: realRemote?.apkSha256 || '53d281dcd9f32c58d5035dd7e5424e651c24859b0ec47dded97557ac029bea17',
        changelog: 'Simulated update release notes.',
        releaseNotes: { added: ['Simulated Feature A'], improved: ['Simulated Performance B'], fixed: ['Simulated Bug C'] }
      };
      addJsLog(`Simulation override: Forcing Update Available (v${targetVersion}, code ${targetCode})`);
    } else if (updaterSimulation.forceNoUpdate) {
      remote = {
        version: APP_VERSION,
        versionCode: natVerCode ?? 1,
        mandatory: false,
        apkUrl: '',
        apkSha256: ''
      };
      addJsLog(`Simulation override: Forcing No Update (matching current version ${APP_VERSION})`);
    } else if (updaterSimulation.forceDowngrade) {
      remote = {
        version: '3.7.10',
        versionCode: 10,
        mandatory: false,
        apkUrl: realRemote?.apkUrl || 'https://github.com/MAGEXE1000/Studio/releases/download/v3.7.54/studio-3.7.54.apk',
        apkSha256: realRemote?.apkSha256 || '456b5d19cf42cafb29d14da71885a7601d8fef566ff8f4dd756ed2d196cfe8d3'
      };
      addJsLog(`Simulation override: Forcing Downgrade (v3.7.10)`);
    } else {
      remote = realRemote;
    }

    if (remote) {
      if (updaterSimulation.forceMandatoryUpdate) {
        addJsLog('Simulation override: Forcing Mandatory Update');
        remote.mandatory = true;
      } else if (updaterSimulation.forceOptionalUpdate) {
        addJsLog('Simulation override: Forcing Optional Update');
        remote.mandatory = false;
      }
    }

    const mockOta = getSessionItem('studio:mockOtaResponse');
    if (mockOta && !updaterSimulation.forceUpdateAvailable && !updaterSimulation.forceNoUpdate && !updaterSimulation.forceDowngrade) {
      try {
        remote = JSON.parse(mockOta);
        console.log('[OTA DEBUG] Using mock remote response:', remote);
      } catch (e) {
        console.warn('[OTA] Failed to parse mock response:', e);
      }
    }

    if (remote && !validateRemoteMetadata(remote)) {
      console.error('[AppUpdater] Rejecting remote metadata (simulation or fetched/mock) due to validation failure.');
      remote = null;
    }

    const dismissedList = getStoredList('studio:dismissedVersions');
    const laterVersion = getSessionItem('studio:laterUpdateVersion');

    otaDebugLogs.appVersion = APP_VERSION;
    otaDebugLogs.nativeApkVersion = natVer || 'N/A';
    (otaDebugLogs as any).nativeApkVersionCode = natVerCode !== null ? natVerCode.toString() : 'N/A';
    otaDebugLogs.pendingOtaBundleId = localStorage.getItem('studio:downloadedBundleId') || 'None';

    otaDebugLogs.staleOtaCleared = false;
    otaDebugLogs.capgoSetBlocked = false;
    otaDebugLogs.triggerComponent = isManual ? 'Developer Options (Manual Check)' : 'Auto Poll / System';
    otaDebugLogs.finalPathExecuted = 'N/A';

    if (isNative()) {
      otaDebugLogs.currentOtaVersion = 'disabled';
      try {
        const cap = (window as any).Capacitor;
        const isNativePlat = cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
        const registry = cap?.Plugins ? Object.keys(cap.Plugins) : [];
        otaDebugLogs.registeredPlugins = JSON.stringify(registry);

        const appInstallerExists = cap ? cap.isPluginAvailable?.('AppInstaller') ?? false : false;
        otaDebugLogs.appInstallerAvailable = appInstallerExists;

        if (appInstallerExists) {
          const plugin = cap.Plugins.AppInstaller;
          otaDebugLogs.downloadApkAvailable = typeof plugin?.downloadApk === 'function';
          otaDebugLogs.verifyApkSha256Available = typeof plugin?.verifyApkSha256 === 'function' || typeof plugin?.verifySha256 === 'function';
          otaDebugLogs.installApkAvailable = typeof plugin?.installApk === 'function';
          otaDebugLogs.openInstallPermissionSettingsAvailable = typeof plugin?.openInstallPermissionSettings === 'function' || typeof plugin?.openUnknownAppSourcesSettings === 'function';

          const methods = {
            downloadApk: otaDebugLogs.downloadApkAvailable,
            verifyApkSha256: otaDebugLogs.verifyApkSha256Available,
            installApk: otaDebugLogs.installApkAvailable,
            openInstallPermissionSettings: otaDebugLogs.openInstallPermissionSettingsAvailable,
          };
          otaDebugLogs.pluginMethodCheck = Object.entries(methods)
            .map(([name, exists]) => `${name}: ${exists ? 'YES' : 'NO'}`)
            .join(', ');
          otaDebugLogs.installerLaunchStatus = `REGISTERED: AppInstaller is present in registry. Methods match.`;
        } else {
          otaDebugLogs.downloadApkAvailable = false;
          otaDebugLogs.verifyApkSha256Available = false;
          otaDebugLogs.installApkAvailable = false;
          otaDebugLogs.openInstallPermissionSettingsAvailable = false;
          otaDebugLogs.pluginMethodCheck = isNativePlat ? 'Plugin not found' : 'N/A (Web)';
          otaDebugLogs.installerLaunchStatus = `MISSING: AppInstaller not registered. Plugins: ${registry.join(', ')}`;
        }
      } catch (e) {
        console.warn('[OTA] AppInstaller diagnostics failed:', e);
      }
    }

    checkCancellation(pipelineId, 'AWAIT_METADATA_VALIDATION');
    if (!safeTransition('FETCH_REMOTE_METADATA', 'VALIDATE_METADATA', 'Validating fetched manifest integrity')) {
      const duration = Date.now() - startTime;
      console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
      return globalOtaState;
    }
    if (!remote) {
      otaDebugLogs.updateDecision = 'metadata_unavailable';
      otaDebugLogs.updateDecisionReason = 'Remote metadata is missing or unreachable.';
      updateGlobalState({ decisionExplanation: 'Remote metadata is missing or unreachable.', updateAvailable: false });
      if (isManual) {
        updateGlobalState({ error: 'Unable to contact the update server.' });
        if (!safeTransition('VALIDATE_METADATA', 'RECOVERY', 'Manual check failed: no remote metadata', 'Unable to contact update server')) {
          return globalOtaState;
        }
      } else {
        updateGlobalState({ error: 'Update check failed: remote metadata unavailable.' });
        if (!safeTransition('VALIDATE_METADATA', 'RECOVERY', 'Auto-check failed: no remote metadata', 'Remote metadata unavailable')) {
          return globalOtaState;
        }
      }
      const duration = Date.now() - startTime;
      console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
      return globalOtaState;
    }

    checkCancellation(pipelineId, 'COMPARE_VERSION');
    if (!safeTransition('VALIDATE_METADATA', 'COMPARE_VERSION', 'Comparing version names and codes')) {
      const duration = Date.now() - startTime;
      console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
      return globalOtaState;
    }
        const comp = compareVersions(remote, APP_VERSION, natVerCode ?? undefined);
    logPipelineTrace('executeCheckForUpdateInternal', 'version comparison', { remote: remote.version, remoteCode: remote.versionCode, local: APP_VERSION, localCode: natVerCode }, comp);
    const updateAvailable = comp.updateAvailable || (isManual && comp.isDowngrade);
    logTimelineEvent('UpdateCore', 'VERSION_COMPARISON_COMPLETED', `Update available: ${updateAvailable} | Reason: ${comp.explanation}`);
    otaDebugLogs.updateDecision = updateAvailable ? 'UPDATE_AVAILABLE' : 'NO_UPDATE_AVAILABLE';
    otaDebugLogs.updateDecisionReason = comp.explanation;
    updateGlobalState({ decisionExplanation: comp.explanation });

    const norm = parseAndNormalizeVersion(remote.version);
    releaseMetadataInspector.finalVersionShownByUi = remote.version;
    releaseMetadataInspector.normalizedVersion = norm;
    releaseMetadataInspector.sourceUsed = shouldUseAndroidApkUpdater() ? 'app-release.json' : 'version.json';

    if (updateAvailable) {
      const dismissedList = getStoredList('studio:dismissedVersions');
      const isDismissed = dismissedList.includes(remote.version);
      const isLater = laterVersion === remote.version;

      if (!isManual && (isDismissed || isLater)) {
        console.log(`[OTA] Skipping auto-prompt for version ${remote.version} (user dismissed/later).`);
        logPipelineTrace('executeCheckForUpdateInternal', 'remoteVersion assignment', remote.version, remote.version);
        logPipelineTrace('executeCheckForUpdateInternal', 'remoteVersion updates', remote.version, remote.version);
        updateGlobalState({
          remoteVersion: remote.version,
          updateAvailable: false,
          mandatory: remote.mandatory ?? false,
          changelog: remote.changelog ?? null,
          releaseNotes: remote.releaseNotes ?? null,
          apkUrl: remote.apkUrl ?? null,
          apkSha256: remote.apkSha256 ?? null,
          manualApkUrl: remote.manualApkUrl ?? null,
          fallbackApkUrl: remote.fallbackApkUrl ?? null,
        });

        checkCancellation(pipelineId, 'AWAIT_CACHE_CLEANUP');
        await checkAndCleanCache();

        if (!safeTransition('COMPARE_VERSION', 'NO_UPDATE_AVAILABLE', 'User dismissed/later')) {
          return globalOtaState;
        }
        const duration = Date.now() - startTime;
        console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
        return globalOtaState;
      }

      logPipelineTrace('executeCheckForUpdateInternal', 'remoteVersion assignment', remote.version, remote.version);
      logPipelineTrace('executeCheckForUpdateInternal', 'remoteVersion updates', remote.version, remote.version);
      updateGlobalState({
        remoteVersion: remote.version,
        updateAvailable: true,
        mandatory: remote.mandatory ?? false,
        changelog: remote.changelog ?? null,
        releaseNotes: remote.releaseNotes ?? null,
        apkUrl: remote.apkUrl ?? null,
        apkSha256: remote.apkSha256 ?? null,
        manualApkUrl: remote.manualApkUrl ?? null,
        fallbackApkUrl: remote.fallbackApkUrl ?? null,
        apkSizeBytes: remote.apkSizeBytes ?? null,
      });

      checkCancellation(pipelineId, 'AWAIT_CACHE_CLEANUP');
      await checkAndCleanCache();

      if (!safeTransition('COMPARE_VERSION', 'UPDATE_AVAILABLE', 'New update found')) {
        return globalOtaState;
      }
      void logProgressStage('Update detected', `Version: ${remote.version}`);
    } else {
      updateGlobalState({ remoteVersion: remote.version, updateAvailable: false });
      otaDebugLogs.updateDecision = 'NO_UPDATE_AVAILABLE';
      otaDebugLogs.updateDecisionReason = `Local ${APP_VERSION} >= Remote ${remote.version} (isUpToDate=${comp.isUpToDate}, isDowngrade=${comp.isDowngrade})`;
      if (!safeTransition('COMPARE_VERSION', 'NO_UPDATE_AVAILABLE', `App is up to date (local=${APP_VERSION}, remote=${remote.version})`)) {
        return globalOtaState;
      }
    }

    const duration = Date.now() - startTime;
    logDetailedJsTrace('checkForUpdate', 'pipeline.ts', 584, `Exiting checkForUpdate Call #${callId} successfully`, { durationMs: duration, prevState: 'COMPARE_VERSION', nextState: globalOtaState.updateState });
    return globalOtaState;
  } catch (err) {
    if (err instanceof PipelineCancelledError) {
      throw err;
    }
    const duration = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    logDetailedJsTrace('checkForUpdate', 'pipeline.ts', 589, `Exiting checkForUpdate Call #${callId} with error`, { durationMs: duration, prevState: 'INITIALIZING', nextState: globalOtaState.updateState, reason: errMsg });
    otaDebugLogs.updateDecision = 'check_failed';
    otaDebugLogs.updateDecisionReason = `Exception during update check: ${errMsg}`;
    otaDebugLogs.lastExceptionStackTrace = errStack ?? null;
    updateGlobalState({
      error: isManual ? 'Unable to contact the update server.' : `Update check failed: ${errMsg}`,
      updateAvailable: false,
    });
    if (globalOtaState.updateState !== 'IDLE') {
      transitionToState('RECOVERY', isManual ? 'Manual check exception' : `Auto-check exception: ${errMsg}`, errMsg);
    }
    return globalOtaState;
  } finally {
    lastCheckedTime = Date.now();
    setActivePipelineContext(null);
  }
}

export function checkForUpdate(isManual = false, trigger = 'unknown', reason = 'unknown'): Promise<CentralizedOtaState> {
  interceptIllegalCall('checkForUpdate', `isManual=${isManual}, trigger=${trigger}, reason=${reason}`);

  let callerInfo = 'Unknown';
  let stackTrace = 'N/A';
  try {
    const stack = new Error().stack;
    if (stack) {
      stackTrace = stack;
      const lines = stack.split('\n');
      if (lines.length > 2) {
        callerInfo = lines[2].trim();
      }
    }
  } catch {}

  let screen = 'unknown';
  try {
    const navStore = useNavigationStore.getState();
    if (navStore && navStore.history && navStore.history.length > 0) {
      const lastRoute = navStore.history[navStore.history.length - 1];
      screen = lastRoute.page || lastRoute.tab || lastRoute.app || 'unknown';
    }
  } catch (_) {}

  const traceMsg = `Check requested: isManual=${isManual} | Trigger: ${trigger} | Reason: ${reason} | Screen: ${screen} | Caller: ${callerInfo}`;
  console.log(`[OTA CHECK_FOR_UPDATE_CALLER_TRACE] ${traceMsg}\nStack: ${stackTrace}`);

  logTimelineEvent('UpdateCore', 'CHECK_REQUESTED', `${traceMsg} | Stack: ${stackTrace.slice(0, 300)}`);

  const current = globalOtaState.updateState;
  const isBusy = [
    'FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'VERIFY_SHA256',
    'PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE', 'INSTALLING', 'INSTALL_SUCCESS',
  ].includes(current);

  // Post-install session guard — blocks ALL update checks (even manual) while
  // the post-install session is active.
  if (isPostInstallSessionActive()) {
    const info = getPostInstallSessionInfo();
    console.log(`[OTA] Rejecting checkForUpdate (trigger=${trigger}): post-install session is active. storedVersion=${info.storedVersion}, elapsed=${info.elapsed}ms`);
    logTimelineEvent('UpdateCore', 'CHECK_REJECTED_POST_INSTALL_SESSION', `trigger=${trigger}, storedVersion=${info.storedVersion}, elapsed=${info.elapsed}ms`);
    logInstallLockEvent('CHECK_BLOCKED', `checkForUpdate rejected: post-install session active`, { trigger, caller: `storedVersion=${info.storedVersion}` });
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: null,
      workflowId: null,
      eventType: 'checkForUpdateRejected',
      caller: callerInfo,
      reason: `Blocked check (post-install session active). Trigger: ${trigger}, Reason: ${reason}, Screen: ${screen}`,
      warning: 'CHECK_BLOCKED_POST_INSTALL_SESSION',
      stack: stackTrace
    });
    return Promise.resolve(globalOtaState);
  }

  // isInstallationLocked() is the authoritative guard
  if (!isManual && isInstallationLocked()) {
    console.log(`[OTA] Rejecting automatic checkForUpdate (trigger=${trigger}): installation is locked (state: ${current}, installationJustCompleted may be true)`);
    logTimelineEvent('UpdateCore', 'CHECK_REJECTED_INSTALLATION_LOCKED', `state: ${current}`);
    logInstallLockEvent('CHECK_BLOCKED', `Automatic checkForUpdate rejected: state=${current}`, { trigger });
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: null,
      workflowId: null,
      eventType: 'checkForUpdateRejected',
      caller: callerInfo,
      reason: `Blocked automatic check (installation locked in state ${current}). Trigger: ${trigger}, Reason: ${reason}, Screen: ${screen}`,
      warning: 'CHECK_BLOCKED_INSTALLATION_LOCKED',
      stack: stackTrace
    });
    return Promise.resolve(globalOtaState);
  }

  if (isUpdateSessionActive() || current !== 'IDLE') {
    if (!isManual) {
      console.log(`[OTA] Rejecting automatic/background checkForUpdate (trigger=${trigger}): Update session or state is active (state: ${current})`);
      logTimelineEvent('UpdateCore', 'CHECK_REJECTED_ACTIVE_SESSION', `state: ${current}`);
      
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: null,
        workflowId: null,
        eventType: 'checkForUpdateRejected',
        caller: callerInfo,
        reason: `Blocked automatic check (update session active, state: ${current}). Trigger: ${trigger}, Reason: ${reason}, Screen: ${screen}`,
        warning: 'CHECK_BLOCKED_ACTIVE_SESSION',
        stack: stackTrace
      });
      return Promise.resolve(globalOtaState);
    }
  }

  if (isBusy) {
    console.log(`[OTA] Rejecting checkForUpdate (isManual=${isManual}): installer is currently busy (state: ${current})`);
    logTimelineEvent('UpdateCore', 'CHECK_REJECTED_BUSY', `state: ${current}`);
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: null,
      workflowId: null,
      eventType: 'checkForUpdateRejected',
      caller: callerInfo,
      reason: `Blocked check (installer busy in state ${current}). isManual: ${isManual}, Trigger: ${trigger}, Reason: ${reason}, Screen: ${screen}`,
      warning: 'CHECK_BLOCKED_INSTALLER_BUSY',
      stack: stackTrace
    });
    return Promise.resolve(globalOtaState);
  }

  UpdaterFlightRecorder.record({
    thread: 'js',
    sessionId: null,
    workflowId: null,
    eventType: 'checkForUpdateAllowed',
    caller: callerInfo,
    reason: `Starting update check. isManual: ${isManual}, Trigger: ${trigger}, Reason: ${reason}, Screen: ${screen}`,
    stack: stackTrace
  });

  startUpdateSession(isManual ? 'manual' : 'automatic', trigger);
  return UpdatePipelineCoordinator.dispatch(isManual, trigger, reason);
}

// ─── Download Pipeline ────────────────────────────────────────────────────

export async function downloadUpdate(trigger?: string): Promise<void> {
  if (isDownloading) {
    console.warn('[OTA] Rejecting downloadUpdate: download already in progress.');
    return activeDownloadPromise || Promise.resolve();
  }
  isDownloading = true;
  try {
    return await downloadUpdateInternal(trigger);
  } finally {
    isDownloading = false;
  }
}

async function downloadUpdateInternal(trigger?: string): Promise<void> {
  currentSessionStartTime = Date.now();
  if (startupRecoveryPromise) {
    await startupRecoveryPromise;
  }
  const callId = nextJsCallId();
  logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 634, `Entering downloadUpdate Call #${callId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger}` });

  if (activeDownloadPromise) {
    logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 639, `Exiting downloadUpdate Call #${callId} early (activeDownloadPromise running)`, { prevState: globalOtaState.updateState });
    return activeDownloadPromise;
  }

  const ver = globalOtaState.remoteVersion;
  if (!ver) {
    logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 645, `Exiting downloadUpdate Call #${callId} early (missing remoteVersion)`, { prevState: globalOtaState.updateState });
    return Promise.resolve();
  }

  const apkUrl = globalOtaState.updateAvailable ? (globalOtaState as any).apkUrl : null;
  logPipelineTrace('downloadUpdateInternal', 'download URL generation', { version: ver }, { apkUrl });
  logDiagnosticEvent('DOWNLOAD_STARTED', { version: ver, url: apkUrl });
  const isDowngrade = globalOtaState.updateAvailable && compareSemver(ver, APP_VERSION) < 0;

  if ((!isNative() || !isAppInstallerAvailable()) && !isSimulationActive()) {
    console.log('[OTA] Non-Android / Web platform detected. Falling back to web-reload update path.');
    (async () => {
      try {
        const { Filesystem } = await import('@capacitor/filesystem');
        console.log('[OTA] Clearing ServiceWorker caches...');
      } catch (e) {
        console.warn('Failed to clear caches:', e);
      } finally {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('upd', Date.now().toString());
          window.location.href = url.toString();
        } catch {
          window.location.reload();
        }
      }
    })();
    console.log(`[INSTRUMENTATION] downloadUpdate EXIT Call #${callId} (Resolved: web fallback)`);
    void logProgressStage('[INSTRUMENTATION] downloadUpdate EXIT', `Call #${callId} resolved (web fallback)`);
    return Promise.resolve();
  }

  if (!apkUrl) {
    otaDebugLogs.downloadStatus = 'Error: Missing APK URL';
    transitionToState('INSTALL_FAILED', 'Missing APK download URL', 'No APK download URL available');
    console.log(`[INSTRUMENTATION] downloadUpdate EXIT Call #${callId} (Rejected: missing apkUrl)`);
    void logProgressStage('[INSTRUMENTATION] downloadUpdate EXIT', `Call #${callId} rejected (missing apkUrl)`);
    return Promise.reject(new Error('No APK download URL available'));
  }

  if (!safeTransition('UPDATE_AVAILABLE', 'FETCH_APK_INFORMATION', 'downloadUpdate start')) {
    return Promise.reject(new Error('Invalid state for downloadUpdate'));
  }
  updateGlobalState({ progress: 0, statusText: 'Preparing update...', error: null });

  activeDownloadPromise = (async () => {
    const downloadedPath = localStorage.getItem('studio:downloadedApkPath');
    if (downloadedPath && !downloadedPath.includes(`studio-update-${ver}.apk`)) {
      localStorage.removeItem('studio:downloadedApkPath');
    }

    const hasValid = await checkAndCleanCache();
    if (hasValid) {
      console.log('[Smart Recovery] Valid APK already exists. Skipping download.');
      if (!safeTransition('FETCH_APK_INFORMATION', 'VERIFY_SHA256', 'Valid cached APK exists')) {
        return;
      }
      updateGlobalState({ progress: 1.0, statusText: 'Verifying update...' });
      const filePath = await getLocalApkPath(ver);

      if (!safeTransition('VERIFY_SHA256', 'PREPARING_INSTALL', 'Checking cached APK eligibility')) {
        return;
      }
      const isEligible = await runEligibilityCheck(filePath, isDowngrade);
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        if (globalOtaState.updateState === 'PREPARING_INSTALL') {
          transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        }
        throw new Error(`[Eligibility Check] Validation failed: ${otaDebugLogs.eligibilityReason || 'unknown'}`);
      }

      if (!safeTransition('PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION', 'Valid cached APK verified')) {
        return;
      }
      return;
    }

    if (!safeTransition('FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'Starting APK package download')) {
      return;
    }
    otaDebugLogs.downloadStatus = `Update started: apk\nAPK URL: ${apkUrl}`;
    updateGlobalState({ progress: 0.0, statusText: 'Entering progress screen...' });
    logTimelineEvent('UpdateCore', 'DOWNLOAD_STARTED', `Version: ${ver}`);

    try {
      let filePath: string;
      const shouldSimulate = !isNative() || !isAppInstallerAvailable() || isSimulationActive();
      if (shouldSimulate) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('studio:is_simulation_active', 'true');
          }
        } catch (_) {}
        addJsLog('[Simulate Download] Starting simulated download loop...');
        for (let i = 1; i <= 10; i++) {
          if (updaterSimulation.injectNetworkTimeout) {
            addJsLog('[Simulate Download] Injecting network timeout!');
            if (globalOtaState.updateState === 'DOWNLOAD_APK') {
              transitionToState('INSTALL_FAILED', 'Simulated network timeout');
            }
            throw new Error('Simulated network timeout');
          }
          if (updaterSimulation.injectDownloadFailure) {
            addJsLog('[Simulate Download] Injecting download failure!');
            if (globalOtaState.updateState === 'DOWNLOAD_APK') {
              transitionToState('INSTALL_FAILED', 'Simulated download failure');
            }
            throw new Error('Simulated download failure');
          }
          updateGlobalState({ progress: i / 10, statusText: `Simulating download... (${i * 10}%)` });
          await delayForSim(10);
        }
        filePath = '/mock/path/to/simulated_download.apk';
        addJsLog(`[Simulate Download] Completed. Mock Path: ${filePath}`);
      } else {
        try {
          if (updaterSimulation.forceDownloadFailure) {
            addJsLog('Simulation override: Injecting Download Failure');
            throw new Error('[Simulated Download Failure] Failed to download APK from server.');
          }
          if (updaterSimulation.forceDownloadTimeout) {
            addJsLog('Simulation override: Injecting Download Timeout');
            throw new Error('[Simulated Download Timeout] Network connection timed out.');
          }
          if (updaterSimulation.forceResumeDownload) {
            addJsLog('Simulation override: Forcing download resumption mode');
          }
          logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 749, 'Starting APK download from URL: ' + apkUrl);
          logPipelineTrace('downloadUpdateInternal', 'download', { url: apkUrl, version: ver }, 'download started');
          filePath = await downloadUpdateApk({
            url: apkUrl,
            version: ver,
            manualApkUrl: (globalOtaState as any).manualApkUrl,
            fallbackApkUrl: (globalOtaState as any).fallbackApkUrl,
          });
          logPipelineTrace('downloadUpdateInternal', 'download', { url: apkUrl, version: ver }, { filePath, status: 'complete' });
          logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 755, 'APK download completed successfully. File path: ' + filePath);
        } catch (dlErr) {
          logPipelineTrace('downloadUpdateInternal', 'download', { url: apkUrl, version: ver }, { error: dlErr instanceof Error ? dlErr.message : String(dlErr) });
          if (globalOtaState.updateState === 'DOWNLOAD_APK') {
            transitionToState('INSTALL_FAILED', 'APK download execution failed');
          }
          throw dlErr;
        }
      }

      otaDebugLogs.downloadStatus += `\nAPK download completed. Path: ${filePath}`;
      void logProgressStage('Download completed', 'Path: ' + filePath);
      logDiagnosticEvent('DOWNLOAD_FINISHED', { filePath });
      logTimelineEvent('UpdateCore', 'DOWNLOAD_COMPLETED', `Path: ${filePath}`);

      if (!safeTransition('DOWNLOAD_APK', 'VERIFY_SHA256', 'Verifying checksum')) {
        return;
      }
      logTimelineEvent('UpdateCore', 'SHA_VERIFICATION_STARTED');
      logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 764, 'Starting SHA-256 integrity verification. Expected: ' + (globalOtaState as any).apkSha256);
      if (updaterSimulation.forceShaFailure) {
        addJsLog('Simulation override: Injecting SHA checksum failure!');
        if (globalOtaState.updateState === 'VERIFY_SHA256') {
          transitionToState('INSTALL_FAILED', 'Simulated checksum failure');
        }
        throw new Error('Simulated SHA-256 checksum mismatch');
      }

      if (shouldSimulate) {
        if (updaterSimulation.injectChecksumFailure) {
          addJsLog('[Simulate Download] Injecting checksum failure!');
          if (globalOtaState.updateState === 'VERIFY_SHA256') {
            transitionToState('INSTALL_FAILED', 'Simulated checksum failure');
          }
          throw new Error('Simulated checksum failure');
        }
        otaDebugLogs.shaVerification = 'PASSED (Simulated)';
        logDiagnosticEvent('APK_VERIFIED', { filePath, simulated: true });
      } else {
        const expectedHash = (globalOtaState as any).apkSha256;
        logPipelineTrace('downloadUpdateInternal', 'verification', { filePath, expectedHash }, 'SHA-256 verification started');
        if (expectedHash) {
          try {
            await verifyFileIntegrity(filePath, expectedHash);
            logPipelineTrace('downloadUpdateInternal', 'verification', { filePath, expectedHash }, { verified: true });
            logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 783, 'SHA-256 integrity verification passed');
            logDiagnosticEvent('APK_VERIFIED', { filePath });
          } catch (shaErr) {
            logPipelineTrace('downloadUpdateInternal', 'verification', { filePath, expectedHash }, { verified: false, error: shaErr instanceof Error ? shaErr.message : String(shaErr) });
            if (globalOtaState.updateState === 'VERIFY_SHA256') {
              transitionToState('INSTALL_FAILED', 'SHA integrity check failed');
            }
            throw shaErr;
          }
        } else {
          logPipelineTrace('downloadUpdateInternal', 'verification', { filePath }, { verified: 'skipped (no expected hash)' });
          otaDebugLogs.shaVerification = 'SKIPPED (No expected hash)';
          logDiagnosticEvent('APK_VERIFIED', { filePath, warning: 'SHA skipped' });
        }
      }
      logTimelineEvent('UpdateCore', 'SHA_VERIFICATION_COMPLETED');

      if (shouldSimulate) {
        otaDebugLogs.fileDetails = 'Size: 24586128 bytes\nURI: file:///mock/path/to/simulated_download.apk';
      } else {
        try {
          const { Filesystem } = await import('@capacitor/filesystem');
          const info = await Filesystem.stat({ path: filePath });
          otaDebugLogs.fileDetails = `Size: ${info.size} bytes\nURI: ${info.uri}`;
        } catch (statErr) {
          otaDebugLogs.fileDetails = `Error reading file stats: ${statErr instanceof Error ? statErr.message : String(statErr)}`;
        }
      }

      updateGlobalState({ progress: 1.0, statusText: 'Verifying update' });
      if (shouldSimulate) {
        await delayForSim(10);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      otaDebugLogs.downloadStatus += `\nRunning pre-install eligibility check...`;
      if (!safeTransition('VERIFY_SHA256', 'PREPARING_INSTALL', 'Checking eligibility')) {
        return;
      }
      updateGlobalState({ statusText: 'Checking eligibility...' });
      logTimelineEvent('UpdateCore', 'ELIGIBILITY_CHECK_STARTED');
      logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 806, 'Starting pre-install eligibility check');

      const isEligible = await (async () => {
        if (updaterSimulation.forceSignatureMismatch) {
          addJsLog('Simulation override: Injecting Signature Mismatch');
          otaDebugLogs.eligibilityReason = 'signature_mismatch';
          return false;
        }
        if (updaterSimulation.forceInvalidApk) {
          addJsLog('Simulation override: Injecting Invalid APK');
          otaDebugLogs.eligibilityReason = 'invalid_apk';
          return false;
        }
        if (shouldSimulate) {
          addJsLog('[Simulate Install] Bypassing native eligibility check in simulation mode.');
          return true;
        }
        logPipelineTrace('downloadUpdateInternal', 'verification', { filePath, isDowngrade }, 'eligibility check started');
        return await runEligibilityCheck(filePath, isDowngrade);
      })();
      logPipelineTrace('downloadUpdateInternal', 'verification', { filePath, isDowngrade }, { isEligible, reason: otaDebugLogs.eligibilityReason });
      logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 820, 'Pre-install eligibility check completed. Result: ' + isEligible);
      logTimelineEvent('UpdateCore', 'ELIGIBILITY_CHECK_COMPLETED', isEligible ? 'Passed' : `Failed: ${otaDebugLogs.eligibilityReason}`);

      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        if (globalOtaState.updateState === 'PREPARING_INSTALL') {
          transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        }
        throw new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
      }

      void logProgressStage('Eligibility check passed', 'APK is eligible for installation');
      void logProgressStage('Installer prepared', 'Installer prepared and files verified');

      if (!safeTransition('PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION', 'APK download & verify complete')) {
        return;
      }
      updateGlobalState({ statusText: 'Ready to install' });
      localStorage.setItem('studio:downloadedApkPath', filePath);
      localStorage.setItem('studio:downloadedApkVersion', ver);
      localStorage.removeItem('studio:downloadedBundleId');
      addToStoredList('studio:downloadedVersions', ver);

      logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 797, `Exiting downloadUpdate Call #${callId} successfully (ready_to_install)`, { prevState: 'PREPARING_INSTALL', nextState: globalOtaState.updateState });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = (err instanceof Error && err.stack ? err.stack : null);
      logDetailedJsTrace('downloadUpdate', 'pipeline.ts', 800, `Exiting downloadUpdate Call #${callId} with error`, { prevState: globalOtaState.updateState, reason: errMsg });
      otaDebugLogs.installError = `Download/Verify Exception: ${errMsg}\nStack: ${errStack || ''}`;
      otaDebugLogs.lastExceptionStackTrace = errStack;
      otaDebugLogs.installerLaunchStatus = 'FAILED';
      await populateDiagnostics(err, 'APK download or verification failed');

      if (globalOtaState.updateState !== 'RECOVERY') {
        transitionToState('INSTALL_FAILED', 'Download/Verify exception', errMsg);
        updateGlobalState({ error: errMsg });
      }
      throw err;
    } finally {
      activeDownloadPromise = null;
      UpdatePipelineCoordinator.setStage('IDLE');
    }
  })();

  return activeDownloadPromise;
}

// ─── Apply Pipeline ───────────────────────────────────────────────────────

export async function applyUpdate(trigger?: string): Promise<void> {
  if (isApplying) {
    console.warn('[OTA] Rejecting applyUpdate: installation already in progress.');
    return activeApplyPromise || Promise.resolve();
  }
  isApplying = true;
  try {
    return await applyUpdateInternal(trigger);
  } finally {
    isApplying = false;
  }
}

async function applyUpdateInternal(trigger?: string): Promise<void> {
  currentSessionStartTime = Date.now();
  if (startupRecoveryPromise) {
    await startupRecoveryPromise;
  }
  const callId = nextJsCallId();
  logTimelineEvent('UpdateCore', 'INSTALL_REQUESTED', `Trigger: ${trigger}`);
  logDetailedJsTrace('applyUpdate', 'pipeline.ts', 867, `Entering applyUpdate Call #${callId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger}` });

  UpdaterFlightRecorder.record({
    thread: 'js',
    sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
    workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
    eventType: 'applyUpdateRequested',
    caller: 'applyUpdate',
    reason: `applyUpdate called. Trigger: ${trigger}, State: ${globalOtaState.updateState}`
  });

  if (activeApplyPromise) {
    logDetailedJsTrace('applyUpdate', 'pipeline.ts', 872, `Exiting applyUpdate Call #${callId} early (activeApplyPromise running)`, { prevState: globalOtaState.updateState });
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
      workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
      eventType: 'applyUpdateRejected',
      caller: 'applyUpdate',
      reason: `applyUpdate rejected because activeApplyPromise is already running`,
      warning: 'APPLY_REJECTED_ALREADY_RUNNING'
    });
    return activeApplyPromise;
  }

  const remoteVersion = globalOtaState.remoteVersion;
  if (!remoteVersion) {
    logDetailedJsTrace('applyUpdate', 'pipeline.ts', 879, `Exiting applyUpdate Call #${callId} early (missing remoteVersion)`, { prevState: globalOtaState.updateState });
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: null,
      workflowId: null,
      eventType: 'applyUpdateRejected',
      caller: 'applyUpdate',
      reason: `applyUpdate rejected because remoteVersion is missing`,
      warning: 'APPLY_REJECTED_MISSING_VERSION'
    });
    return Promise.resolve();
  }

  logDiagnosticEvent('INSTALL_REQUESTED', { version: remoteVersion });

  if ((!isNative() || !isAppInstallerAvailable()) && !isSimulationActive()) {
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: null,
      workflowId: null,
      eventType: 'applyUpdateWebReload',
      caller: 'applyUpdate',
      reason: `Applying update in non-native / simulated environment. Triggering web reload.`
    });

    (async () => {
      try {
        const { Filesystem } = await import('@capacitor/filesystem');
        console.log('[OTA] Clearing ServiceWorker caches...');
      } catch (e) {
        console.warn('Failed to clear cache/sw before reload:', e);
      } finally {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('upd', Date.now().toString());
          window.location.href = url.toString();
        } catch {
          window.location.reload();
        }
      }
    })();
    console.log(`[INSTRUMENTATION] applyUpdate EXIT Call #${callId} (Resolved: web reload completed)`);
    void logProgressStage('[INSTRUMENTATION] applyUpdate EXIT', `Call #${callId} resolved (web reload completed)`);
    return Promise.resolve();
  }

  if (globalOtaState.updateState !== 'WAITING_USER_CONFIRMATION') {
    console.warn(`[OTA] Rejecting applyUpdate. State is ${globalOtaState.updateState}, expected 'WAITING_USER_CONFIRMATION'.`);
    const err = new Error(`Cannot apply update. State is ${globalOtaState.updateState}, expected 'WAITING_USER_CONFIRMATION'.`);
    void logProgressStage('[INSTRUMENTATION] applyUpdate EXIT', `Call #${callId} rejected (invalid state)`);
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
      workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
      eventType: 'applyUpdateRejected',
      caller: 'applyUpdate',
      reason: `applyUpdate rejected because state is not WAITING_USER_CONFIRMATION (State: ${globalOtaState.updateState})`,
      warning: 'APPLY_REJECTED_INVALID_STATE',
      error: err.message
    });
    return Promise.reject(err);
  }

  if (!safeTransition('WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'applyUpdate start')) {
    const err = new Error(`Cannot apply update. Expected WAITING_USER_CONFIRMATION, found ${globalOtaState.updateState}.`);
    void logProgressStage('[INSTRUMENTATION] applyUpdate EXIT', `Call #${callId} rejected (invalid state)`);
    
    UpdaterFlightRecorder.record({
      thread: 'js',
      sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
      workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
      eventType: 'applyUpdateRejected',
      caller: 'applyUpdate',
      reason: `applyUpdate rejected because safeTransition to PACKAGEINSTALLER_VISIBLE failed`,
      warning: 'APPLY_REJECTED_TRANSITION_FAILED',
      error: err.message
    });
    return Promise.reject(err);
  }
  logActivity('apk_install', `Installing APK system update (v${remoteVersion})`, 'Studio');

  activeApplyPromise = (async () => {
    let nativeListener: any = null;
    try {
      const filePath = localStorage.getItem('studio:downloadedApkPath');
      if (!filePath) {
        throw new Error('No downloaded APK path found.');
      }

      const shouldSimulateInstall = !isNative() || !isAppInstallerAvailable() || isSimulationActive();

      UpdatePipelineCoordinator.setStage('AWAIT_ELIGIBILITY_VERIFICATION');
      updateGlobalState({ statusText: 'Preparing package...' });
      
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
        workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
        eventType: 'eligibilityCheckStarted',
        caller: 'applyUpdate',
        reason: `Verifying APK file eligibility: ${filePath}`
      });

      const isEligible = await (async () => {
        if (shouldSimulateInstall) {
          return true;
        }
        return await runEligibilityCheck(filePath);
      })();
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          UpdaterFlightRecorder.record({
            thread: 'js',
            sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
            workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
            eventType: 'eligibilityCheckSignatureMismatch',
            caller: 'applyUpdate',
            reason: `Signature mismatch eligibility failure detected. Triggering recovery...`,
            warning: 'SIGNATURE_MISMATCH_RECOVERY_TRIGGERED'
          });

          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        const err = new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
        
        UpdaterFlightRecorder.record({
          thread: 'js',
          sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
          workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
          eventType: 'eligibilityCheckFailed',
          caller: 'applyUpdate',
          reason: `Eligibility check validation failed`,
          error: err.message
        });
        throw err;
      }

      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
        workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
        eventType: 'eligibilityCheckSuccess',
        caller: 'applyUpdate',
        reason: `APK is eligible for installation`
      });

      const statusPromise = new Promise<void>((resolvePromise, rejectPromise) => {
        activeInstallPromiseResolver = resolvePromise;
        activeInstallPromiseRejecter = rejectPromise;
      });

      otaDebugLogs.installError += `\nAPK is eligible. Launching APK installer intent for file: ${filePath}`;
      updateGlobalState({ statusText: 'Launching PackageInstaller...' });

      if (shouldSimulateInstall) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('studio:is_simulation_active', 'true');
          }
        } catch (_) {}
        
        UpdaterFlightRecorder.record({
          thread: 'js',
          sessionId: null,
          workflowId: null,
          eventType: 'simulatedInstallLaunch',
          caller: 'applyUpdate',
          reason: `Launching simulated install sequence`
        });

        addJsLog('[Simulate Install] Simulation active. Setting simulation handler.');
        setSimulateStatusCallback((eventData: any) => {
          if (typeof (window as any).triggerOtaInstallStatus === 'function') {
            (window as any).triggerOtaInstallStatus(eventData);
          }
        });

        (async () => {
          const mockSessionId = 9999;
          updateGlobalState({ sessionId: mockSessionId });
          logDiagnosticEvent('SESSION_CREATED', { sessionId: mockSessionId, simulated: true });

          await delayForSim(10);
          triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');

          if (updaterSimulation.runWorkflowActive) {
            addJsLog('[Simulate Install] runWorkflowActive is true. Simulating user action delay (1.5s)...');
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } else if (updaterSimulation.forcePendingUserAction) {
            // S1: Instead of returning early and leaving statusPromise unresolved
            // forever, add a 30-second timeout. This prevents infinite hangs while
            // still allowing developers to observe the PACKAGEINSTALLER_VISIBLE state.
            addJsLog('[Simulate Install] forcePendingUserAction active. Pausing for 30s before auto-continuing...');
            await new Promise((resolve) => setTimeout(resolve, 30000));
            // After timeout, check if state was changed externally (e.g., by dismiss)
            if (globalOtaState.updateState !== 'PACKAGEINSTALLER_VISIBLE') {
              addJsLog(`[Simulate Install] State changed during forcePendingUserAction pause (now: ${globalOtaState.updateState}). Stopping simulation.`);
              return;
            }
            addJsLog('[Simulate Install] forcePendingUserAction timeout reached. Auto-continuing simulation...');
          }

          await delayForSim(10);
          triggerSimulatedStatus(-2, 'installing_start');

          if (updaterSimulation.forceUserCancel) {
            await delayForSim(10);
            triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
            return;
          }
          if (updaterSimulation.forceInstallFailure) {
            await delayForSim(10);
            triggerSimulatedStatus(1, 'STATUS_FAILURE');
            return;
          }

          for (let p = 0.1; p <= 1.0; p += 0.1) {
            await delayForSim(5);
            triggerSimulatedStatus(-3, p > 0.9 ? 'Finalizing installation...' : 'Optimizing application...', p);
          }

          await delayForSim(5);
          triggerSimulatedStatus(0, 'STATUS_SUCCESS');
        })();
      } else {
        void logProgressStage('Session committed', 'Handing over to PackageInstaller');
        UpdatePipelineCoordinator.setStage('AWAIT_INSTALLER_LAUNCH');
        
        UpdaterFlightRecorder.record({
          thread: 'js',
          sessionId: null,
          workflowId: null,
          eventType: 'nativeInstallLaunch',
          caller: 'applyUpdate',
          reason: `Triggering native APK installer intent: ${filePath}`
        });

        const res = await triggerNativeInstall(filePath);
        if (res && typeof res.sessionId === 'number') {
          updateGlobalState({ sessionId: res.sessionId });
          logDiagnosticEvent('SESSION_CREATED', { sessionId: res.sessionId });
          logTimelineEvent('UpdateCore', 'SESSION_CREATED', `SessionID: ${res.sessionId}`);
          
          UpdaterFlightRecorder.record({
            thread: 'js',
            sessionId: res.sessionId,
            workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
            eventType: 'nativeSessionCreated',
            caller: 'applyUpdate',
            reason: `Native PackageInstaller session created successfully. SessionID: ${res.sessionId}`
          });
        }
        updateGlobalState({ statusText: 'Waiting for installer...' });
        logTimelineEvent('UpdateCore', 'NATIVE_INSTALLER_LAUNCHED', 'System PackageInstaller intent triggered');
        void logProgressStage('Waiting for Android confirmation', 'Waiting for system confirmation dialog to overlay');
      }

      otaDebugLogs.installError += `\nAPK installer intent launched successfully!`;
      otaDebugLogs.installerLaunchStatus = 'SUCCESS';
      otaDebugLogs.lastExceptionStackTrace = 'None';
      otaDebugLogs.finalPathExecuted = 'APK installer launched';

      UpdatePipelineCoordinator.setStage('AWAIT_PACKAGE_INSTALLER_CALLBACKS');
      await statusPromise;

      logDetailedJsTrace('applyUpdate', 'pipeline.ts', 987, `Exiting applyUpdate Call #${callId} successfully (Installer completed)`, { prevState: globalOtaState.updateState });
      
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
        workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
        eventType: 'applyUpdateSuccess',
        caller: 'applyUpdate',
        reason: `applyUpdate finished successfully (state: ${globalOtaState.updateState})`
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = (err instanceof Error && err.stack ? err.stack : null);
      logDetailedJsTrace('applyUpdate', 'pipeline.ts', 990, `Exiting applyUpdate Call #${callId} with error`, { prevState: globalOtaState.updateState, reason: errMsg });
      otaDebugLogs.installError = `Native Install Exception: ${errMsg}\nStack: ${errStack || ''}`;
      otaDebugLogs.lastExceptionStackTrace = errStack;
      otaDebugLogs.installerLaunchStatus = 'FAILED';
      await populateDiagnostics(err, 'APK installation failed');

      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
        workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
        eventType: 'applyUpdateError',
        caller: 'applyUpdate',
        reason: `applyUpdate failed with exception`,
        error: errMsg,
        warning: 'INSTALL_FAILED'
      });

      if (globalOtaState.updateState !== 'RECOVERY') {
        transitionToState('INSTALL_FAILED', 'PackageInstaller exception', errMsg);
        updateGlobalState({ error: errMsg });
      }
      throw err;
    } finally {
      if (nativeListener) {
        try {
          await nativeListener.remove();
        } catch (_) {}
      }
      setSimulateStatusCallback(null);
      activeApplyPromise = null;
      UpdatePipelineCoordinator.setStage('IDLE');
    }
  })();

  return activeApplyPromise;
}

// ─── Recovery check ───────────────────────────────────────────────────────

async function checkAndRecoverInstallState() {
  const currentState = globalOtaState.updateState;
  const allowedStates = ['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'];
  if (!allowedStates.includes(currentState)) {
    return;
  }

  logTimelineEvent('RecoveryManager', 'RECOVERY_CHECK_START', `currentState=${currentState}`);

  const shouldSimulate = !isNative() || !isAppInstallerAvailable() || isSimulationActive();
  if (!shouldSimulate) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const stateAfterDelay = globalOtaState.updateState;
  if (!allowedStates.includes(stateAfterDelay)) {
    logTimelineEvent('RecoveryManager', 'RECOVERY_ABORTED_STATE_CHANGED', `State transitioned during delay to: ${stateAfterDelay}`);
    return;
  }

  try {
    const { AppInstaller } = await import('../apkDownloader');
    const check = await AppInstaller.isInstallActive();
    console.log('[OTA Recovery] checkAndRecoverInstallState check.active:', check.active);

    if (check.active) {
      logTimelineEvent('RecoveryManager', 'RECOVERY_ACTIVE_DETECTED', `activeSessionId=${check.sessionId}`);
      if (stateAfterDelay !== 'INSTALLING') {
        transitionToState('INSTALLING', 'Active installation confirmed on resume');
      }
      updateGlobalState({ statusText: 'Installing update...' });
      return;
    }

    const result = await AppInstaller.getLastInstallResult();
    console.log('[OTA Recovery] checkAndRecoverInstallState getLastInstallResult:', result);

    if (result.statusCode !== -999) {
      const sessionTime = activeUpdateSession ? activeUpdateSession.creationTimestamp : 0;
      const targetVersion = activeUpdateSession ? activeUpdateSession.targetVersion : globalOtaState.remoteVersion;
      const isStale = (result.timestamp && result.timestamp < sessionTime) ||
                      (targetVersion && result.expectedVersionName !== targetVersion);
      if (isStale) {
        console.log('[OTA Recovery] Ignoring stale or mismatching install result on resume:', result);
        return;
      }
    }

    if (result.statusCode === 0) {
      logTimelineEvent('RecoveryManager', 'RECOVERY_SUCCESS_DETECTED', `Version: ${result.expectedVersionName} | Code: ${result.expectedVersionCode}`);
      console.log('[OTA Recovery] Success result detected on resume.');
      transitionToState('INSTALL_SUCCESS', 'Native install completed');
      await AppInstaller.clearInstallerLogHistory().catch(() => {});
      if (activeInstallPromiseResolver) {
        activeInstallPromiseResolver();
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    } else if (result.statusCode === -999) {
      logTimelineEvent('RecoveryManager', 'RECOVERY_IN_PROGRESS_DETECTED', 'Session committed natively but not completed yet');
      if (currentState === 'WAITING_USER_CONFIRMATION' || currentState === 'PACKAGEINSTALLER_VISIBLE') {
        transitionToState('INSTALLING', 'Installation started by user confirmation');
      }
      updateGlobalState({ statusText: 'Installing update...' });
      return;
    } else {
      logTimelineEvent('RecoveryManager', 'RECOVERY_FAILURE_DETECTED', `StatusCode: ${result.statusCode} | Msg: ${result.statusMessage}`);
      const processed = processLastInstallResult(result);
      const errText = processed?.errMsg || result.statusMessage || 'Installation failed';
      updateGlobalState({ error: errText, statusText: errText });
      transitionToState('INSTALL_FAILED', `Native install failed: ${errText}`);
      await AppInstaller.clearInstallerLogHistory().catch(() => {});
      if (activeInstallPromiseRejecter) {
        activeInstallPromiseRejecter(new Error(errText));
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    }
  } catch (err) {
    console.warn('[OTA Recovery] Failed to check/recover install state:', err);
  }
}

// ─── Global Listeners ─────────────────────────────────────────────────────

export function initializeGlobalOtaListeners() {
  if (isOtaInitialized) return;
  isOtaInitialized = true;
  console.log('[OTA] Initializing global PackageInstaller listeners...');

  if (isNative()) {
    (AppInstaller as any).addListener('onNativeInstrumentation', (ev: any) => {
      // The event from Java should already have timestamp, thread, caller, action, details, stack, category.
      UpdaterFlightRecorder.record({
        category: ev.category || 'NATIVE',
        thread: 'native',
        sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
        workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
        eventType: ev.action || 'NativeEvent',
        caller: ev.caller || 'AppInstallerPlugin',
        details: ev.details,
        stack: ev.stack,
        timestamp: ev.timestamp
      });
    }).catch((e: any) => console.warn('[OTA] Failed to add onNativeInstrumentation listener', e));
  }

  const handleInstallStatusChange = (eventData: any) => {
    const { status, message, progress, timestamp } = eventData;
    if (timestamp) {
      const latency = Date.now() - timestamp;
      PerformanceProfiler.getInstance().recordCallbackLatency(latency, true);
    }
    console.log(`[OTA Global Listener] Received status ${status}: ${message} (progress ${progress}%)`);
    addJsLog(`[Global Listener Event] Received status ${status}: ${message} (progress ${progress}%)`);

    const statusName = getPackageInstallerStatusName(status);
    UpdaterFlightRecorder.record({
      category: 'NATIVE',
      thread: 'native',
      sessionId: activeUpdateSession ? activeUpdateSession.sessionId : null,
      workflowId: activePipelineContext ? String(activePipelineContext.checkId) : null,
      eventType: 'PackageInstallerCallback',
      caller: 'PackageInstallerReceiver',
      reason: `Status: ${status} (${statusName}) | Msg: ${message || 'none'} | Progress: ${progress || 0}`,
      warning: (status > 0 || status === 3) ? (status === 3 ? 'INSTALL_CANCELLED' : 'INSTALL_FAILED') : null,
      error: status > 0 ? (message || `PackageInstaller error code ${status}`) : null,
      details: JSON.stringify(eventData)
    });

    (window as any).__studioInstallerStatus = String(status);
    logDiagnosticEvent('PACKAGEINSTALLER_CALLBACK', { status, message, progress });

    if (status === -1) {
      logDiagnosticEvent('PACKAGEINSTALLER_OPENED');
    } else if (status === 0) {
      logDiagnosticEvent('INSTALL_SUCCESS');
    } else if (status === 3) {
      logDiagnosticEvent('INSTALL_CANCELLED');
    } else if (status > 0) {
      logDiagnosticEvent('INSTALL_FAILED', { status, message });
    }

    if (isNative() && typeof (AppInstaller as any).logInstallerEvent === 'function') {
      void (AppInstaller as any).logInstallerEvent({ stage: `Status ${status}`, status: String(status), message: message || '' });
    }

    logTimelineEvent('NativeInstaller', 'NATIVE_CALLBACK_RECEIVED', `Status: ${status} (${statusName}) | Msg: ${message || 'none'} | Progress: ${progress || 0}`);

    const allowedStates = ['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'];
    if (!allowedStates.includes(globalOtaState.updateState)) {
      console.log('[OTA] Ignoring native status event since state is:', globalOtaState.updateState);
      return;
    }

    if (status === -2) {
      logTimelineEvent('NativeInstaller', 'INSTALL_SESSION_ACTIVE', 'PackageInstaller session active');
      transitionToState('INSTALLING', 'PackageInstaller session active');
      updateGlobalState({ statusText: 'Installing package...' });
    } else if (status === -3) {
      const progressFraction = typeof progress === 'number' ? progress : 0;
      const now = Date.now();
      let label = 'Installing package...';
      if (progressFraction > 0.5 && progressFraction <= 0.9) {
        label = 'Optimizing application...';
      } else if (progressFraction > 0.9) {
        label = 'Finalizing installation...';
      }

      if (now - lastInstallProgressTime >= 100 || progressFraction === 1 || progressFraction === 0) {
        lastInstallProgressTime = now;
        logTimelineEvent('NativeInstaller', 'INSTALL_PROGRESS', `Progress: ${Math.round(progressFraction * 100)}% (${label})`);
        updateGlobalState({
          progress: progressFraction,
          statusText: `${label} (${Math.round(progressFraction * 100)}%)`
        });
      }
      if (globalOtaState.updateState !== 'INSTALLING') {
        transitionToState('INSTALLING', 'PackageInstaller progress received');
      }
    } else if (status === -1) {
      logTimelineEvent('NativeInstaller', 'INSTALL_USER_ACTION_REQUIRED', 'PackageInstaller requires user interaction');
      transitionToState('PACKAGEINSTALLER_VISIBLE', 'PackageInstaller requires user interaction');
      updateGlobalState({ statusText: 'Tap Install to confirm...' });
    } else if (status === 0) {
      logTimelineEvent('NativeInstaller', 'INSTALL_SUCCESS', 'PackageInstaller status SUCCESS');
      transitionToState('INSTALL_SUCCESS', 'PackageInstaller status SUCCESS');
      updateGlobalState({ statusText: 'Install succeeded!' });
      if (activeInstallPromiseResolver) {
        activeInstallPromiseResolver();
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
      
      if (isSimulationActive()) {
        setTimeout(() => {
          transitionToState('IDLE', 'Simulation completed successfully');
          updateGlobalState({
            statusText: 'Pipeline completed',
            remoteVersion: APP_VERSION,
            updateAvailable: false
          });
          try {
            localStorage.removeItem('studio:is_simulation_active');
          } catch (_) {}
        }, 2000);
      }
    } else if (status === 3) {
      logTimelineEvent('NativeInstaller', 'INSTALL_CANCELLED', 'User cancelled installation');
      transitionToState('INSTALL_CANCELLED', 'User cancelled installation');
      if (activeInstallPromiseRejecter) {
        activeInstallPromiseRejecter(new Error('Installation cancelled by user.'));
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    } else {
      const errMsg = message || `PackageInstaller error code ${status}`;
      logTimelineEvent('NativeInstaller', 'INSTALL_FAILED', errMsg);
      transitionToState('INSTALL_FAILED', `Install failed: ${errMsg}`);
      if (activeInstallPromiseRejecter) {
        activeInstallPromiseRejecter(new Error(errMsg));
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    }
  };

  if (typeof window !== 'undefined') {
    (window as any).triggerOtaInstallStatus = (eventData: any) => {
      handleInstallStatusChange(eventData);
      if (simulateStatusCallback) {
        try {
          simulateStatusCallback(eventData);
        } catch (_) {}
      }
    };
  }

  if (isNative() && isAppInstallerAvailable()) {
    void (async () => {
      try {
        await (AppInstaller as any).addListener('onInstallStatusChanged', (eventData: any) => {
          if (typeof (window as any).triggerOtaInstallStatus === 'function') {
            (window as any).triggerOtaInstallStatus(eventData);
          }
        });
      } catch (e) {
        console.warn('[OTA] Failed to register global native status listener:', e);
      }
    })();
  }

  if (isNative()) {
    import('@capacitor/app').then(async ({ App }) => {
      (window as any).__studioActivityState = 'active';
      await App.addListener('appStateChange', async (state) => {
        const prev = (window as any).__studioActivityState;
        const current = state.isActive ? 'active' : 'background';
        
        UpdaterFlightRecorder.record({
          thread: 'js',
          sessionId: null,
          workflowId: null,
          eventType: 'appStateChange',
          caller: 'AppLifecycle',
          reason: `App state transitioned from ${prev} to ${current} (isActive: ${state.isActive})`
        });

        if (prev !== current) {
          (window as any).__studioActivityState = current;
          logDiagnosticEvent(current === 'active' ? 'ACTIVITY_RESUMED' : 'ACTIVITY_PAUSED');
          logTimelineEvent('AppLifecycle', current === 'active' ? 'ACTIVITY_RESUMED' : 'ACTIVITY_PAUSED');
        }
        if (state.isActive) {
          // Block all recovery during post-install session
          if (isPostInstallSessionActive()) {
            const info = getPostInstallSessionInfo();
            console.log(`[OTA Lifecycle] App resumed but post-install session is active. Skipping recovery. storedVersion=${info.storedVersion}, elapsed=${info.elapsed}ms`);
            logTimelineEvent('AppLifecycle', 'RECOVERY_SKIPPED_POST_INSTALL', `storedVersion=${info.storedVersion}, elapsed=${info.elapsed}ms`);
            
            UpdaterFlightRecorder.record({
              thread: 'js',
              sessionId: null,
              workflowId: null,
              eventType: 'appResumeRecoverySkipped',
              caller: 'AppLifecycle',
              reason: `Skipped recovery on resume (post-install session active). storedVersion=${info.storedVersion}`
            });
            return;
          }
          console.log('[OTA Lifecycle] App returned to foreground. Recovering updater state...');
          logTimelineEvent('AppLifecycle', 'RECOVERY_TRIGGERED_ON_RESUME');
          
          UpdaterFlightRecorder.record({
            thread: 'js',
            sessionId: null,
            workflowId: null,
            eventType: 'appResumeRecoveryTriggered',
            caller: 'AppLifecycle',
            reason: `Triggered install state recovery check on app resume`
          });

          installRecoveryPromise = checkAndRecoverInstallState();
          try {
            await installRecoveryPromise;
          } finally {
            installRecoveryPromise = null;
          }
        }
      });
    }).catch((e) => {
      console.warn('[OTA Lifecycle] Failed to register appStateChange listener:', e);
    });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState === 'visible' ? 'VISIBLE' : 'HIDDEN';
      logTimelineEvent('AppLifecycle', `VISIBILITY_CHANGE_${state}`, `Document visibility state changed to ${state}`);
      
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: null,
        workflowId: null,
        eventType: 'visibilitychange',
        caller: 'DocumentLifecycle',
        reason: `Visibility changed to ${state}`
      });
    });

    window.addEventListener('focus', () => {
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: null,
        workflowId: null,
        eventType: 'focus',
        caller: 'WindowLifecycle',
        reason: `Window gained focus`
      });
    });

    window.addEventListener('blur', () => {
      UpdaterFlightRecorder.record({
        thread: 'js',
        sessionId: null,
        workflowId: null,
        eventType: 'blur',
        caller: 'WindowLifecycle',
        reason: `Window lost focus`
      });
    });
  }
}

// ─── Downgrade ────────────────────────────────────────────────────────────

export async function triggerDowngrade(targetVersion: string, apkUrl: string, sha256: string): Promise<void> {
  logUpdateTransition(APP_VERSION, targetVersion, 'downgrade', 'user', 'failed', 'Initiated downgrade download');

  updateGlobalState({
    remoteVersion: targetVersion,
    apkUrl,
    apkSha256: sha256,
    updateType: 'apk',
    updateAvailable: false,
    progress: 0,
    error: null,
    statusText: 'Preparing downgrade...'
  });
  transitionToState('DOWNLOAD_APK', 'User-initiated downgrade');

  if (isNative()) {
    window.dispatchEvent(new CustomEvent('studio:open-update-dialog'));
  }

  try {
    await downloadUpdate('user_downgrade');
  } catch (err) {
    console.error('[Downgrade] Downgrade download failed:', err);
    logUpdateTransition(
      APP_VERSION,
      targetVersion,
      'downgrade',
      'user',
      'failed',
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
}
