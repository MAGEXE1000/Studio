import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION, compareSemver, normalizeSemver } from './appVersion';
import { AppInstaller } from './apkDownloader';
import { isNative, shouldUseAndroidApkUpdater } from './capgoUpdater';
import { nativeSet, NATIVE_PREFS } from './nativePrefs';
import { useChordStore } from '../store/useChordStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { logActivity } from './activityLogger';

export function logDiagnosticEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString();
  const sessionId = globalOtaState.sessionId || 'N/A';
  const installState = globalOtaState.updateState;
  
  let navState = 'unknown';
  try {
    const navStore = useNavigationStore.getState();
    if (navStore && navStore.history) {
      navState = JSON.stringify(navStore.history[navStore.history.length - 1] || { app: 'hub' });
    }
  } catch (_) {}

  const activityState = (window as any).__studioActivityState || 'active';

  let currentScreen = 'unknown';
  try {
    const chordStore = useChordStore.getState();
    if (chordStore && chordStore.settings) {
      currentScreen = chordStore.settings.appMode || 'hub';
    }
  } catch (_) {}

  const visibleModal = (window as any).__studioVisibleModal || 'none';
  const installerStatus = (window as any).__studioInstallerStatus || 'idle';

  const logMsg = `[DIAGNOSTIC] [${timestamp}] Event: ${event} | SessionID: ${sessionId} | InstallState: ${installState} | NavState: ${navState} | ActivityState: ${activityState} | MountedScreen: ${currentScreen} | VisibleModal: ${visibleModal} | PackageInstallerStatus: ${installerStatus} | Details: ${details ? JSON.stringify(details) : ''}`;
  console.log(logMsg);
  addJsLog(logMsg);
}

if (typeof window !== 'undefined') {
  (window as any).logDiagnosticEvent = logDiagnosticEvent;
}

// Import modular subcomponents
import {
  globalOtaState,
  updateGlobalState,
  transitionToState,
  stopWatchdog,
  stateListeners,
  setActivePipelineContext,
  CentralizedOtaState,
  OtaUpdateState,
  StructuredReleaseNotes
} from './updater/stateMachine';

import {
  RemoteVersionInfo,
  fetchRemoteVersion,
  versionJsonUrls
} from './updater/releaseMetadata';
import { compareVersions } from './updater/versionComparison';
import { downloadUpdateApk, downloadAndInstallGitHubApk } from './updater/downloadManager';
import { verifyFileIntegrity } from './updater/integrityVerification';
import { runEligibilityCheck } from './updater/eligibilityVerification';
import { triggerNativeInstall, processLastInstallResult } from './updater/installer';
import { runSignatureMismatchRecovery, isRecovering, setIsRecovering } from './updater/recovery';
import { updaterSimulation, setSimulateStatusCallback, simulateStatusCallback, addJsLog, triggerSimulatedStatus } from './updater/updaterSimulation';
import { validateLocalApk, deleteLocalApk, getLocalApkPath, recordDismissal, shouldShowRecoveryReminder } from './updater/cacheManager';
import {
  otaDebugLogs,
  otaDiagnostics,
  logProgressStage,
  populateDiagnostics,
  nextJsCallId,
  isAppInstallerAvailable,
  runUpdaterHealthCheck,
  getDiagnosticsReport,
  HealthStatus,
  logTimelineEvent,
  interceptIllegalCall,
  startDiagnosticsSession,
  resetOtaTimeline,
  otaTimeline,
  getTimelineReport,
  startUpdateSession,
  recordCloseEvent,
  recordUpToDatePopup
} from './updater/diagnostics';
import { PerformanceProfiler } from './performanceProfiler';

import { detectJustUpdated, writeLastSeen } from './updater/versionManager';

export function logDetailedJsTrace(
  functionName: string,
  fileName: string,
  line: number,
  details: string,
  extra?: {
    durationMs?: number;
    sessionId?: number | string;
    prevState?: string;
    nextState?: string;
    reason?: string;
  }
) {
  const timestamp = Date.now();
  const thread = "Main JS Thread";
  let stackTrace = "N/A";
  let caller = "Unknown";
  try {
    const err = new Error();
    if (err.stack) {
      stackTrace = err.stack;
      const lines = err.stack.split('\n');
      if (lines.length > 2) {
        caller = lines[2].trim();
      }
    }
  } catch {}

  const logObj = {
    timestamp,
    thread,
    caller,
    function: functionName,
    file: fileName,
    line,
    stackTrace,
    durationMs: extra?.durationMs ?? null,
    sessionId: extra?.sessionId ?? globalOtaState.sessionId ?? localStorage.getItem('studio:installer_session_id') ?? 'N/A',
    prevState: extra?.prevState ?? globalOtaState.updateState,
    nextState: extra?.nextState ?? null,
    reason: extra?.reason ?? null,
    details
  };

  console.log(`[INSTRUMENTATION] [JS_TRACE] ${JSON.stringify(logObj, null, 2)}`);
  void logProgressStage(`[JS_TRACE] ${functionName}`, `${details} | State: ${globalOtaState.updateState}`);
}

export {
  globalOtaState,
  otaDebugLogs,
  otaDiagnostics,
  logProgressStage,
  populateDiagnostics,
  nextJsCallId,
  isAppInstallerAvailable,
  runEligibilityCheck,
  runSignatureMismatchRecovery,
  detectJustUpdated,
  resetLastCheckedTime,
  downloadAndInstallGitHubApk,
  runUpdaterHealthCheck,
  getDiagnosticsReport,
  logTimelineEvent,
  interceptIllegalCall,
  startDiagnosticsSession,
  resetOtaTimeline,
  otaTimeline,
  getTimelineReport
};

export type { CentralizedOtaState, OtaUpdateState, StructuredReleaseNotes, RemoteVersionInfo, HealthStatus };

function safeTransition(expectedState: OtaUpdateState, nextState: OtaUpdateState, reason: string, failureReason?: string): boolean {
  if (globalOtaState.updateState !== expectedState) {
    console.warn(`[OTA] Aborting transition to ${nextState} because expected state ${expectedState} does not match current state ${globalOtaState.updateState}.`);
    return false;
  }
  transitionToState(nextState, reason, failureReason);
  return true;
}

// Storage utilities
export function getStoredList(key: string): string[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToStoredList(key: string, val: string): void {
  try {
    const list = getStoredList(key);
    if (!list.includes(val)) {
      list.push(val);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
}

export function removeFromStoredList(key: string, val: string): void {
  try {
    const list = getStoredList(key);
    const filtered = list.filter((v) => v !== val);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

export function getSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionItem(key: string, val: string): void {
  try {
    sessionStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function getNativeVersion(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { AppInstaller } = await import('./apkDownloader');
    const info = await AppInstaller.getInstalledAppInfo();
    return info.versionName;
  } catch (e) {
    console.warn('[OTA] Failed to query native app version:', e);
    return null;
  }
}

let currentSessionStartTime = 0;

async function delayForSim(ms: number) {
  if (updaterSimulation.simulateDownloadThrottling) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export async function getNativeVersionCode(): Promise<number | null> {
  if (!isNative()) return null;
  try {
    const { AppInstaller } = await import('./apkDownloader');
    const info = await AppInstaller.getInstalledAppInfo();
    return info.versionCode;
  } catch (e) {
    console.warn('[OTA] Failed to query native app version code:', e);
    return null;
  }
}


export function resetOtaUpdateState() {
  const isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node;
  if (!isNode && (globalOtaState.updateState === 'INSTALLING' || globalOtaState.updateState === 'WAIT_PACKAGE_INSTALLER')) {
    console.warn('[OTA] Rejecting resetOtaUpdateState: PackageInstaller is currently active.');
    return;
  }
  if (activeCheckPromise || activeDownloadPromise || activeApplyPromise || UpdatePipelineCoordinator.activeAsyncStage !== 'IDLE') {
    console.warn('[OTA] Rejecting resetOtaUpdateState: an update operation is currently active.');
    return;
  }
  transitionToState('IDLE', 'Reset update state');
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
    
    if (typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true') {
      console.log('[OTA Startup] Simulated update detected on startup. Destroying simulation completely.');
      logTimelineEvent('AppLifecycle', 'APP_REOPEN_DESTROY_SIMULATION', 'Destroying simulated installation session');
      
      // Reset simulation overrides
      updaterSimulation.forceUpdateAvailable = false;
      updaterSimulation.forceNoUpdate = false;
      updaterSimulation.forceDowngrade = false;
      updaterSimulation.forceMetadataFailure = false;
      updaterSimulation.forceShaFailure = false;
      updaterSimulation.forceSignatureMismatch = false;
      updaterSimulation.forceInvalidApk = false;
      updaterSimulation.forceDownloadFailure = false;
      updaterSimulation.forceDownloadTimeout = false;
      updaterSimulation.forceRecoveryMode = false;
      updaterSimulation.forceCachedApk = false;
      updaterSimulation.forceResumeDownload = false;
      updaterSimulation.forceInstallSuccess = false;
      updaterSimulation.forceInstallFailure = false;
      updaterSimulation.forceUserCancel = false;
      updaterSimulation.forcePendingUserAction = false;
      updaterSimulation.simulateDownload = false;
      updaterSimulation.simulateDownloadThrottling = false;

      try {
        localStorage.removeItem('studio:is_simulation_active');
        localStorage.removeItem('studio:install_in_progress');
      } catch (_) {}

      transitionToState('IDLE', 'Simulation destroyed on app reopen');
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
      stopWatchdog();
      return;
    }

    if (!isNative() || !isAppInstallerAvailable()) {
      logDiagnosticEvent('RECOVERY_ABORTED', 'Not native or AppInstaller unavailable');
      return;
    }

    try {
      const { AppInstaller } = await import('./apkDownloader');
      const check = await AppInstaller.isInstallActive();
      
      if (check.active) {
        console.log('[OTA DEBUG] enforceStartupRecovery: Active PackageInstaller session detected. Setting state to INSTALLING.');
        const result = await AppInstaller.getLastInstallResult();
        const expectedName = result.expectedVersionName || null;
        const expectedCode = result.expectedVersionCode || null;
        
        updateGlobalState({
          remoteVersion: expectedName,
          requiredVersionCode: expectedCode ? Number(expectedCode) : 0,
          statusText: 'Installing update...',
          sessionId: typeof check.sessionId === 'number' ? check.sessionId : null,
        });
        transitionToState('INSTALLING', 'Active PackageInstaller session detected on startup');
        return;
      }

      const result = await AppInstaller.getLastInstallResult();
      if (result.statusCode !== -999) {
        console.log('[OTA DEBUG] enforceStartupRecovery: Pending install result exists (code ' + result.statusCode + ').');
        
        // Immediately return to IDLE and close the updater UI
        resetOtaUpdateState();
        await AppInstaller.clearInstallerLogHistory().catch(() => {});

        if (result.statusCode === 0) {
          console.log('[OTA Startup] Success result detected on startup recovery. UI closed, returned to IDLE.');
          logTimelineEvent('RecoveryManager', 'RECOVERY_SUCCESS_DETECTED', `Version: ${result.expectedVersionName} | Code: ${result.expectedVersionCode}`);
        } else {
          console.log('[OTA Startup] Failure result detected on startup recovery. UI closed, showing error.');
          logTimelineEvent('RecoveryManager', 'RECOVERY_FAILURE_DETECTED', `StatusCode: ${result.statusCode} | Msg: ${result.statusMessage}`);
          const processed = processLastInstallResult(result);
          if (processed) {
            updateGlobalState({
              error: processed.errMsg,
              statusText: processed.errMsg
            });
          }
        }
        return;
      } else {
        const inProgress = typeof localStorage !== 'undefined' && localStorage.getItem('studio:install_in_progress') === 'true';
        if (inProgress) {
          console.log('[OTA Startup] Session committed natively but in progress in background. Transitioning to INSTALLING.');
          logTimelineEvent('RecoveryManager', 'RECOVERY_IN_PROGRESS_DETECTED', 'Session committed natively but not completed yet on startup');
          const expectedName = result.expectedVersionName || null;
          const expectedCode = result.expectedVersionCode || null;
          updateGlobalState({
            remoteVersion: expectedName,
            requiredVersionCode: expectedCode ? Number(expectedCode) : 0,
            statusText: 'Installing update...',
            sessionId: typeof check.sessionId === 'number' ? check.sessionId : null,
          });
          transitionToState('INSTALLING', 'Active background installation on startup');
          return;
        }
      }

      console.log('[OTA DEBUG] No active session and no pending result. Resetting state to IDLE.');
      stopWatchdog();

      // Only clear promise guards if no operations are actually in flight
      if (!activeCheckPromise) activeCheckPromise = null;
      if (!activeApplyPromise) activeApplyPromise = null;
      if (!activeDownloadPromise) activeDownloadPromise = null;

      if (activeCheckPromise || activeApplyPromise || activeDownloadPromise) {
        console.log('[OTA DEBUG] enforceStartupRecovery: active operation in flight, skipping reset.');
        logDiagnosticEvent('RECOVERY_ABORTED', 'Active operation in flight');
        return;
      }

      resetOtaUpdateState();

      const downloadedPath = localStorage.getItem('studio:downloadedApkPath');
      if (downloadedPath) {
        const { Filesystem } = await import('@capacitor/filesystem');
        await Filesystem.deleteFile({ path: downloadedPath }).catch(() => {});
        localStorage.removeItem('studio:downloadedApkPath');
      }
    } catch (err) {
      console.warn('[OTA] enforceStartupRecovery error:', err);
    }
  })();

  return startupRecoveryPromise;
}

export class PipelineCancelledError extends Error {
  constructor(message = 'Update pipeline cancelled') {
    super(message);
    this.name = 'PipelineCancelledError';
  }
}

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

    // Coalesce / Merge requests
    if (this.currentPromise && this.currentRequest) {
      if (!isManual || this.currentRequest.isManual) {
        console.log(`[UpdatePipelineCoordinator] Coalescing pipeline #${pipelineId} into running pipeline #${this.currentRequest.id}`);
        this.coalescedEventCount++;
        return this.currentPromise;
      } else {
        console.log(`[UpdatePipelineCoordinator] Superseding active background pipeline #${this.currentRequest.id} with manual pipeline #${pipelineId}`);
        this.cancelledPipelineCount++;
        // Pipeline ID changed; active running execution will abort on its next async boundary
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
        // Discard any queued background checks
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
        console.log(`[UpdatePipelineCoordinator] Pipeline #${request.id} aborted: ${err.message}`);
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

      // Populate pipeline metrics to otaDiagnostics directly
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

function checkCancellation(pipelineId: number, stage: string) {
  UpdatePipelineCoordinator.setStage(stage);
  if (pipelineId !== UpdatePipelineCoordinator.getActivePipelineId()) {
    UpdatePipelineCoordinator.cancelledPipelineCount++;
    throw new PipelineCancelledError(`Pipeline #${pipelineId} superseded/cancelled at stage: ${stage}`);
  }
}

// Queue / Check variables
let latestCheckId = 0;
let activeCheckIsManual = false;
let activeCheckPromise: Promise<CentralizedOtaState> | null = null;
let activeDownloadPromise: Promise<void> | null = null;
let activeApplyPromise: Promise<void> | null = null;
let startupRecoveryPromise: Promise<void> | null = null;
let isDownloading = false;
let isApplying = false;

let lastCheckedTime = 0;
function resetLastCheckedTime() {
  lastCheckedTime = 0;
}
const MIN_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;

async function executeCheckForUpdateInternal(pipelineId: number, isManual = false, trigger = 'unknown', reason = 'unknown'): Promise<CentralizedOtaState> {
  const current = globalOtaState.updateState;
  
  // Do NOT run a check if we are in the middle of downloading, verifying, or installing.
  const isBusy = [
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARE_INSTALL',
    'WAIT_PACKAGE_INSTALLER',
    'INSTALLING',
    'INSTALL_SUCCESS',
  ].includes(current);

  if (isBusy) {
    console.log(`[OTA] Skipping executeCheckForUpdateInternal: installer is currently busy (state: ${current})`);
    return globalOtaState;
  }

  // If it's a background/automatic check (not manual), and we already have an update available
  // or a failed state, do NOT run the check to avoid wiping out the user-facing state.
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

  logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 326, `Entering executeCheckForUpdateInternal Call #${callId} for pipeline #${pipelineId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger} | Reason: ${reason}` });

  const startTime = Date.now();
  const currentStatus = globalOtaState.updateState;
  const isTransient = [
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARE_INSTALL',
    'WAIT_PACKAGE_INSTALLER',
    'INSTALLING',
    'INSTALL_SUCCESS'
  ].includes(currentStatus);

  if (isTransient) {
    console.log(`[OTA] checkForUpdate check ignored because update/install is already in progress (state: ${currentStatus})`);
    const duration = Date.now() - startTime;
    logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 584, `Exiting checkForUpdate Call #${callId} early (active operation in progress)`, { durationMs: duration, prevState: currentStatus, nextState: currentStatus });
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
    logTimelineEvent('UpdateCore', 'MANIFEST_FETCHED', realRemote ? `Version: ${realRemote.version} (Code: ${realRemote.versionCode})` : 'Failed');
    checkCancellation(pipelineId, 'AWAIT_METADATA_VALIDATION');

    let remote;
    if (updaterSimulation.forceUpdateAvailable) {
      remote = {
        version: '3.7.99',
        versionCode: 999,
        mandatory: updaterSimulation.forceMandatoryUpdate,
        apkUrl: realRemote?.apkUrl || 'https://github.com/MAGEXE1000/Studio/releases/download/v3.7.54/studio-3.7.54.apk',
        apkSha256: realRemote?.apkSha256 || '456b5d19cf42cafb29d14da71885a7601d8fef566ff8f4dd756ed2d196cfe8d3',
        changelog: 'Simulated update release notes.',
        releaseNotes: { added: ['Feature A'], improved: ['Performance B'], fixed: ['Bug C'] }
      };
      addJsLog(`Simulation override: Forcing Update Available (v3.7.99)`);
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
      updateGlobalState({
        decisionExplanation: 'Remote metadata is missing or unreachable.',
        updateAvailable: false,
      });
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
    const updateAvailable = comp.updateAvailable || (isManual && comp.isDowngrade);
    logTimelineEvent('UpdateCore', 'VERSION_COMPARISON_COMPLETED', `Update available: ${updateAvailable} | Reason: ${comp.explanation}`);
    otaDebugLogs.updateDecision = updateAvailable ? 'UPDATE_AVAILABLE' : 'NO_UPDATE_AVAILABLE';
    otaDebugLogs.updateDecisionReason = comp.explanation;
    updateGlobalState({ decisionExplanation: comp.explanation });

    if (updateAvailable) {
      const dismissedList = getStoredList('studio:dismissedVersions');
      const isDismissed = dismissedList.includes(remote.version);
      const isLater = laterVersion === remote.version;

      if (!isManual && (isDismissed || isLater)) {
        console.log(`[OTA] Skipping auto-prompt for version ${remote.version} (user dismissed/later).`);
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
      });

      checkCancellation(pipelineId, 'AWAIT_CACHE_CLEANUP');
      await checkAndCleanCache();

      if (!safeTransition('COMPARE_VERSION', 'UPDATE_AVAILABLE', 'New update found')) {
        return globalOtaState;
      }
      void logProgressStage('Update detected', `Version: ${remote.version}`);
    } else {
      updateGlobalState({
        remoteVersion: remote.version,
        updateAvailable: false,
      });
      otaDebugLogs.updateDecision = 'NO_UPDATE_AVAILABLE';
      otaDebugLogs.updateDecisionReason = `Local ${APP_VERSION} >= Remote ${remote.version} (isUpToDate=${comp.isUpToDate}, isDowngrade=${comp.isDowngrade})`;
      if (!safeTransition('COMPARE_VERSION', 'NO_UPDATE_AVAILABLE', `App is up to date (local=${APP_VERSION}, remote=${remote.version})`)) {
        return globalOtaState;
      }
    }

    const duration = Date.now() - startTime;
    logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 584, `Exiting checkForUpdate Call #${callId} successfully`, { durationMs: duration, prevState: 'COMPARE_VERSION', nextState: globalOtaState.updateState });
    return globalOtaState;
  } catch (err) {
    if (err instanceof PipelineCancelledError) {
      throw err;
    }
    const duration = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 589, `Exiting checkForUpdate Call #${callId} with error`, { durationMs: duration, prevState: 'INITIALIZING', nextState: globalOtaState.updateState, reason: errMsg });
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
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARE_INSTALL',
    'WAIT_PACKAGE_INSTALLER',
    'INSTALLING',
    'INSTALL_SUCCESS',
  ].includes(current);

  if (isBusy) {
    console.log(`[OTA] Rejecting checkForUpdate (isManual=${isManual}): installer is currently busy (state: ${current})`);
    logTimelineEvent('UpdateCore', 'CHECK_REJECTED_BUSY', `state: ${current}`);
    return Promise.resolve(globalOtaState);
  }

  startUpdateSession(trigger, `checkForUpdate: isManual=${isManual}, reason=${reason}`);
  return UpdatePipelineCoordinator.dispatch(isManual, trigger, reason);
}

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

function isSimulationActive(): boolean {
  return !!(
    updaterSimulation.simulateDownload ||
    updaterSimulation.forceInstallSuccess ||
    updaterSimulation.forceInstallFailure ||
    updaterSimulation.forceUserCancel ||
    updaterSimulation.forcePendingUserAction ||
    updaterSimulation.forceUpdateAvailable ||
    updaterSimulation.forceNoUpdate ||
    updaterSimulation.forceDowngrade ||
    updaterSimulation.forceMetadataFailure ||
    updaterSimulation.forceDownloadFailure ||
    updaterSimulation.forceDownloadTimeout ||
    updaterSimulation.forceShaFailure ||
    updaterSimulation.forceSignatureMismatch ||
    updaterSimulation.forceInvalidApk
  );
}

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
  logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 634, `Entering downloadUpdate Call #${callId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger}` });

  if (activeDownloadPromise) {
    logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 639, `Exiting downloadUpdate Call #${callId} early (activeDownloadPromise running)`, { prevState: globalOtaState.updateState });
    return activeDownloadPromise;
  }

  const ver = globalOtaState.remoteVersion;
  if (!ver) {
    logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 645, `Exiting downloadUpdate Call #${callId} early (missing remoteVersion)`, { prevState: globalOtaState.updateState });
    return Promise.resolve();
  }

  const apkUrl = globalOtaState.updateAvailable ? (globalOtaState as any).apkUrl : null;
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
      
      if (!safeTransition('VERIFY_SHA256', 'PREPARE_INSTALL', 'Checking cached APK eligibility')) {
        return;
      }
      const isEligible = await runEligibilityCheck(filePath, isDowngrade);
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        if (globalOtaState.updateState === 'PREPARE_INSTALL') {
          transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        }
        throw new Error(`[Eligibility Check] Validation failed: ${otaDebugLogs.eligibilityReason || 'unknown'}`);
      }
      
      if (!safeTransition('PREPARE_INSTALL', 'WAIT_PACKAGE_INSTALLER', 'Valid cached APK verified')) {
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
          logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 749, 'Starting APK download from URL: ' + apkUrl);
          filePath = await downloadUpdateApk({
            url: apkUrl,
            version: ver,
            manualApkUrl: (globalOtaState as any).manualApkUrl,
            fallbackApkUrl: (globalOtaState as any).fallbackApkUrl,
          });
          logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 755, 'APK download completed successfully. File path: ' + filePath);
        } catch (dlErr) {
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
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 764, 'Starting SHA-256 integrity verification. Expected: ' + (globalOtaState as any).apkSha256);
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
        if (expectedHash) {
          try {
            await verifyFileIntegrity(filePath, expectedHash);
            logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 783, 'SHA-256 integrity verification passed');
            logDiagnosticEvent('APK_VERIFIED', { filePath });
          } catch (shaErr) {
            if (globalOtaState.updateState === 'VERIFY_SHA256') {
              transitionToState('INSTALL_FAILED', 'SHA integrity check failed');
            }
            throw shaErr;
          }
        } else {
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
      if (!safeTransition('VERIFY_SHA256', 'PREPARE_INSTALL', 'Checking eligibility')) {
        return;
      }
      updateGlobalState({ statusText: 'Checking eligibility...' });
      logTimelineEvent('UpdateCore', 'ELIGIBILITY_CHECK_STARTED');
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 806, 'Starting pre-install eligibility check');

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
        return await runEligibilityCheck(filePath, isDowngrade);
      })();
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 820, 'Pre-install eligibility check completed. Result: ' + isEligible);
      logTimelineEvent('UpdateCore', 'ELIGIBILITY_CHECK_COMPLETED', isEligible ? 'Passed' : `Failed: ${otaDebugLogs.eligibilityReason}`);

      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        if (globalOtaState.updateState === 'PREPARE_INSTALL') {
          transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        }
        throw new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
      }

      void logProgressStage('Eligibility check passed', 'APK is eligible for installation');
      void logProgressStage('Installer prepared', 'Installer prepared and files verified');

      if (!safeTransition('PREPARE_INSTALL', 'WAIT_PACKAGE_INSTALLER', 'APK download & verify complete')) {
        return;
      }
      updateGlobalState({ statusText: 'Ready to install' });
      localStorage.setItem('studio:downloadedApkPath', filePath);
      localStorage.setItem('studio:downloadedApkVersion', ver);
      localStorage.removeItem('studio:downloadedBundleId');
      addToStoredList('studio:downloadedVersions', ver);

      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 797, `Exiting downloadUpdate Call #${callId} successfully (ready_to_install)`, { prevState: 'PREPARE_INSTALL', nextState: globalOtaState.updateState });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = (err instanceof Error && err.stack ? err.stack : null);
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 800, `Exiting downloadUpdate Call #${callId} with error`, { prevState: globalOtaState.updateState, reason: errMsg });
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
  logDetailedJsTrace('applyUpdate', 'otaUpdate.ts', 867, `Entering applyUpdate Call #${callId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger}` });

  if (activeApplyPromise) {
    logDetailedJsTrace('applyUpdate', 'otaUpdate.ts', 872, `Exiting applyUpdate Call #${callId} early (activeApplyPromise running)`, { prevState: globalOtaState.updateState });
    return activeApplyPromise;
  }

  const remoteVersion = globalOtaState.remoteVersion;
  if (!remoteVersion) {
    logDetailedJsTrace('applyUpdate', 'otaUpdate.ts', 879, `Exiting applyUpdate Call #${callId} early (missing remoteVersion)`, { prevState: globalOtaState.updateState });
    return Promise.resolve();
  }

  logDiagnosticEvent('INSTALL_REQUESTED', { version: remoteVersion });

  if ((!isNative() || !isAppInstallerAvailable()) && !isSimulationActive()) {
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

  if (globalOtaState.updateState !== 'WAIT_PACKAGE_INSTALLER') {
    console.warn(`[OTA] Rejecting applyUpdate. State is ${globalOtaState.updateState}, expected 'WAIT_PACKAGE_INSTALLER'.`);
    const err = new Error(`Cannot apply update. State is ${globalOtaState.updateState}, expected 'WAIT_PACKAGE_INSTALLER'.`);
    void logProgressStage('[INSTRUMENTATION] applyUpdate EXIT', `Call #${callId} rejected (invalid state)`);
    return Promise.reject(err);
  }

  if (!safeTransition('WAIT_PACKAGE_INSTALLER', 'INSTALLING', 'applyUpdate start')) {
    const err = new Error(`Cannot apply update. Expected WAIT_PACKAGE_INSTALLER, found ${globalOtaState.updateState}.`);
    void logProgressStage('[INSTRUMENTATION] applyUpdate EXIT', `Call #${callId} rejected (invalid state)`);
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
      const isEligible = await (async () => {
        if (shouldSimulateInstall) {
          return true;
        }
        return await runEligibilityCheck(filePath);
      })();
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        throw new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
      }

      // Register global promise hooks for status tracking
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
        addJsLog('[Simulate Install] Simulation active. Setting simulation handler.');
        setSimulateStatusCallback((eventData: any) => {
          if (typeof (window as any).triggerOtaInstallStatus === 'function') {
            (window as any).triggerOtaInstallStatus(eventData);
          }
        });
        
        // Timed sequence simulation
        (async () => {
          const mockSessionId = 9999;
          updateGlobalState({ sessionId: mockSessionId });
          logDiagnosticEvent('SESSION_CREATED', { sessionId: mockSessionId, simulated: true });

          await delayForSim(10);
          triggerSimulatedStatus(-2, 'installing_start');
          
          for (let p = 0.1; p <= 0.5; p += 0.1) {
            await delayForSim(10);
            triggerSimulatedStatus(-3, 'Installing package...', p);
          }

          await delayForSim(10);
          triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');
          
          if (updaterSimulation.forcePendingUserAction) {
            addJsLog('[Simulate Install] Pausing in STATUS_PENDING_USER_ACTION.');
            return;
          }
          
          await delayForSim(50);
          if (updaterSimulation.forceUserCancel) {
            triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
            return;
          }
          if (updaterSimulation.forceInstallFailure) {
            triggerSimulatedStatus(1, 'STATUS_FAILURE');
            return;
          }
          
          for (let p = 0.6; p <= 1.0; p += 0.1) {
            await delayForSim(10);
            triggerSimulatedStatus(-3, p > 0.9 ? 'Finalizing installation...' : 'Optimizing application...', p);
          }

          await delayForSim(10);
          triggerSimulatedStatus(0, 'STATUS_SUCCESS');
        })();
      } else {
        void logProgressStage('Session committed', 'Handing over to PackageInstaller');
        UpdatePipelineCoordinator.setStage('AWAIT_INSTALLER_LAUNCH');
        const res = await triggerNativeInstall(filePath);
        if (res && typeof res.sessionId === 'number') {
          updateGlobalState({ sessionId: res.sessionId });
          logDiagnosticEvent('SESSION_CREATED', { sessionId: res.sessionId });
          logTimelineEvent('UpdateCore', 'SESSION_CREATED', `SessionID: ${res.sessionId}`);
        }
        updateGlobalState({ statusText: 'Waiting for installer...' });
        logTimelineEvent('UpdateCore', 'NATIVE_INSTALLER_LAUNCHED', 'System PackageInstaller intent triggered');
        void logProgressStage('Waiting for Android confirmation', 'Waiting for system confirmation dialog to overlay');
      }

      otaDebugLogs.installError += `\nAPK installer intent launched successfully!`;
      otaDebugLogs.installerLaunchStatus = 'SUCCESS';
      otaDebugLogs.lastExceptionStackTrace = 'None';
      otaDebugLogs.finalPathExecuted = 'APK installer launched';

      // Await statusPromise to resolve, reject, or be killed on update reload
      UpdatePipelineCoordinator.setStage('AWAIT_PACKAGE_INSTALLER_CALLBACKS');
      await statusPromise;

      logDetailedJsTrace('applyUpdate', 'otaUpdate.ts', 987, `Exiting applyUpdate Call #${callId} successfully (Installer completed)`, { prevState: globalOtaState.updateState });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = (err instanceof Error && err.stack ? err.stack : null);
      logDetailedJsTrace('applyUpdate', 'otaUpdate.ts', 990, `Exiting applyUpdate Call #${callId} with error`, { prevState: globalOtaState.updateState, reason: errMsg });
      otaDebugLogs.installError = `Native Install Exception: ${errMsg}\nStack: ${errStack || ''}`;
      otaDebugLogs.lastExceptionStackTrace = errStack;
      otaDebugLogs.installerLaunchStatus = 'FAILED';
      await populateDiagnostics(err, 'APK installation failed');

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

export function dismissUpdate(): void {
  logTimelineEvent('UpdateCore', 'UPDATE_SESSION_CLOSED', 'dismissUpdate called');
  recordCloseEvent('dismissUpdate called');
  const ver = globalOtaState.remoteVersion;
  if (ver) {
    addToStoredList('studio:dismissedVersions', ver);
  }
  if (globalOtaState.updateState === 'INSTALL_SUCCESS') {
    localStorage.setItem('studio:lastShownDoneVersion', APP_VERSION);
  }
  resetOtaUpdateState();
  if (isNative() && isAppInstallerAvailable()) {
    import('./apkDownloader').then(({ AppInstaller }) => {
      AppInstaller.clearInstallerLogHistory().catch(() => {});
    });
  }
}

export function markUpdateSeen(): void {
  const ver = globalOtaState.remoteVersion;
  if (ver) {
    addToStoredList('studio:notifiedVersions', ver);
  }
}

let activeInstallPromiseResolver: (() => void) | null = null;
let activeInstallPromiseRejecter: ((err: Error) => void) | null = null;

async function checkAndRecoverInstallState() {
  const currentState = globalOtaState.updateState;
  if (currentState !== 'WAIT_PACKAGE_INSTALLER' && currentState !== 'INSTALLING') {
    return;
  }

  logTimelineEvent('RecoveryManager', 'RECOVERY_CHECK_START', `currentState=${currentState}`);

  // Introduce a 1000ms delay to let the queued Capacitor/native listener callbacks execute first.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Re-verify state after the delay (in case native callback already finished the install)
  const stateAfterDelay = globalOtaState.updateState;
  if (stateAfterDelay !== 'WAIT_PACKAGE_INSTALLER' && stateAfterDelay !== 'INSTALLING') {
    logTimelineEvent('RecoveryManager', 'RECOVERY_ABORTED_STATE_CHANGED', `State transitioned during delay to: ${stateAfterDelay}`);
    return;
  }

  try {
    const { AppInstaller } = await import('./apkDownloader');
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

    // Install is not active. Check the last result.
    const result = await AppInstaller.getLastInstallResult();
    console.log('[OTA Recovery] checkAndRecoverInstallState getLastInstallResult:', result);

    if (result.statusCode !== -999) {
      const isStale = (result.timestamp && result.timestamp < currentSessionStartTime) ||
                      (globalOtaState.remoteVersion && result.expectedVersionName !== globalOtaState.remoteVersion);
      if (isStale) {
        console.log('[OTA Recovery] Ignoring stale or mismatching install result on resume:', result);
        return;
      }
    }

    if (result.statusCode === 0) {
      logTimelineEvent('RecoveryManager', 'RECOVERY_SUCCESS_DETECTED', `Version: ${result.expectedVersionName} | Code: ${result.expectedVersionCode}`);
      console.log('[OTA Recovery] Success result detected on resume. Returning to IDLE.');
      resetOtaUpdateState();
      await AppInstaller.clearInstallerLogHistory().catch(() => {});
      if (activeInstallPromiseResolver) {
        activeInstallPromiseResolver();
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    } else if (result.statusCode === -999) {
      logTimelineEvent('RecoveryManager', 'RECOVERY_IN_PROGRESS_DETECTED', 'Session committed natively but not completed yet');
      // No result registered, but session is no longer active in getMySessions().
      // This happens when the user presses "Update" in the PackageInstaller confirmation dialog:
      // the session is committed/closed natively, and the OS starts installing.
      // Transition to INSTALLING state to show the installation progress screen.
      if (currentState === 'WAIT_PACKAGE_INSTALLER') {
        transitionToState('INSTALLING', 'Installation started by user confirmation');
      }
      updateGlobalState({ statusText: 'Installing update...' });
      return;
    } else {
      logTimelineEvent('RecoveryManager', 'RECOVERY_FAILURE_DETECTED', `StatusCode: ${result.statusCode} | Msg: ${result.statusMessage}`);
      resetOtaUpdateState();
      await AppInstaller.clearInstallerLogHistory().catch(() => {});
      const processed = processLastInstallResult(result);
      if (processed) {
        updateGlobalState({
          error: processed.errMsg,
          statusText: processed.errMsg
        });
      }
      if (activeInstallPromiseRejecter) {
        activeInstallPromiseRejecter(new Error(processed?.errMsg || 'Installation failed'));
        activeInstallPromiseResolver = null;
        activeInstallPromiseRejecter = null;
      }
    }
  } catch (err) {
    console.warn('[OTA Recovery] Failed to check/recover install state:', err);
  }
}

let isOtaInitialized = false;
let lastInstallProgressTime = 0;

export function initializeGlobalOtaListeners() {
  if (isOtaInitialized) return;
  isOtaInitialized = true;
  console.log('[OTA] Initializing global PackageInstaller listeners...');

  // Global PackageInstaller event handler
  const handleInstallStatusChange = (eventData: any) => {
    const { status, message, progress, timestamp } = eventData;
    if (timestamp) {
      const latency = Date.now() - timestamp;
      PerformanceProfiler.getInstance().recordCallbackLatency(latency, true);
    }
    console.log(`[OTA Global Listener] Received status ${status}: ${message} (progress ${progress}%)`);
    addJsLog(`[Global Listener Event] Received status ${status}: ${message} (progress ${progress}%)`);
    
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

    // Log to installer database
    if (isNative() && typeof (AppInstaller as any).logInstallerEvent === 'function') {
      void (AppInstaller as any).logInstallerEvent({ stage: `Status ${status}`, status: String(status), message: message || '' });
    }

    const statusName = getPackageInstallerStatusName(status);
    logTimelineEvent('NativeInstaller', 'NATIVE_CALLBACK_RECEIVED', `Status: ${status} (${statusName}) | Msg: ${message || 'none'} | Progress: ${progress || 0}`);

    // Ignore events if not in an active installation state
    if (globalOtaState.updateState !== 'WAIT_PACKAGE_INSTALLER' && globalOtaState.updateState !== 'INSTALLING') {
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
      transitionToState('WAIT_PACKAGE_INSTALLER', 'PackageInstaller requires user interaction');
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
    } else if (status === 3) {
      logTimelineEvent('NativeInstaller', 'INSTALL_CANCELLED', 'User cancelled installation');
      transitionToState('INSTALL_FAILED', 'User cancelled installation');
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
        if (prev !== current) {
          (window as any).__studioActivityState = current;
          logDiagnosticEvent(current === 'active' ? 'ACTIVITY_RESUMED' : 'ACTIVITY_PAUSED');
          logTimelineEvent('AppLifecycle', current === 'active' ? 'ACTIVITY_RESUMED' : 'ACTIVITY_PAUSED');
        }
        if (state.isActive) {
          console.log('[OTA Lifecycle] App returned to foreground. Recovering updater state...');
          logTimelineEvent('AppLifecycle', 'RECOVERY_TRIGGERED_ON_RESUME');
          await checkAndRecoverInstallState();
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
    });
  }
}

export function useOtaUpdate() {
  const [state, setState] = useState<CentralizedOtaState>(globalOtaState);

  useEffect(() => {
    const listener = (newState: CentralizedOtaState) => {
      setState(newState);
    };
    stateListeners.add(listener);

    initializeGlobalOtaListeners();

    void nativeSet(NATIVE_PREFS.OTA_INSTALLED, APP_VERSION);

    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  const checkNow = async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studio:open-update-dialog'));
    }
    const res = await checkForUpdate(true, 'settings_manual', 'user manual checkNow');
    return res;
  };

  return {
    ...state,
    checkNow,
    downloadUpdate: async (trigger?: string) => {
      await downloadUpdate(trigger);
    },
    applyUpdate: async (trigger?: string) => {
      await applyUpdate(trigger);
    },
    dismissUpdate,
    markUpdateSeen,
    downloadAndInstallGitHubApk,
    runSignatureMismatchRecovery: async () => {
      return await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
    },
    runUpdaterHealthCheck,
    getDiagnosticsReport,
    applyUpdateDirect,
    shareDownloadedApk,
    getUpdateHistory,
    triggerDowngrade,
    checkAndCleanCache,
    deleteLocalApk,
    recordDismissal,
    shouldShowRecoveryReminder,
  };
}

const FOREGROUND_POLL_MS = 60 * 60 * 1000;

export interface UpdateHistoryEntry {
  timestamp: number;
  fromVersion: string;
  toVersion: string;
  type: 'upgrade' | 'downgrade';
  trigger: 'user' | 'auto';
  status: 'success' | 'failed';
  error?: string;
}

export function getUpdateHistory(): UpdateHistoryEntry[] {
  try {
    const raw = localStorage.getItem('studio:updaterHistory');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logUpdateTransition(
  fromVersion: string,
  toVersion: string,
  type: 'upgrade' | 'downgrade',
  trigger: 'user' | 'auto',
  status: 'success' | 'failed',
  error?: string
): void {
  try {
    const history = getUpdateHistory();
    if (history.length > 0) {
      const lastEntry = history[0];
      if (
        lastEntry.fromVersion === fromVersion &&
        lastEntry.toVersion === toVersion &&
        lastEntry.status === status &&
        lastEntry.type === type &&
        Date.now() - lastEntry.timestamp < 5000
      ) {
        return;
      }
    }
    const entry: UpdateHistoryEntry = {
      timestamp: Date.now(),
      fromVersion,
      toVersion,
      type,
      trigger,
      status,
      error,
    };
    history.unshift(entry);
    localStorage.setItem('studio:updaterHistory', JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.warn('[OTA] Failed to write update history:', err);
  }
}

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

export function usePostUpdateChangelog(): {
  show: boolean;
  fromVersion: string | null;
  toVersion: string;
  dismiss: () => void;
} {
  const [show, setShow] = useState(false);
  const [fromVersion, setFromVersion] = useState<string | null>(null);
  const showChangelog = useChordStore((s) => s.settings.otaShowChangelog ?? true);

  useEffect(() => {
    const { justUpdated, from } = detectJustUpdated();
    if (justUpdated && from) {
      const cmp = compareSemver(APP_VERSION, from);
      if (cmp !== 0) {
        const type = cmp > 0 ? 'upgrade' : 'downgrade';
        logUpdateTransition(from, APP_VERSION, type, 'user', 'success');
        
        localStorage.setItem('studio:consecutiveInstallFailures', '0');
        updateGlobalState({ consecutiveFailures: 0, recoveryMode: false, activeFallback: null });

        if (type === 'upgrade' && showChangelog) {
          setFromVersion(from);
          setShow(true);
        } else {
          writeLastSeen(APP_VERSION);
        }
      }
    } else if (from === null) {
      writeLastSeen(APP_VERSION);
    }
  }, [showChangelog]);

  const dismiss = () => {
    writeLastSeen(APP_VERSION);
    setShow(false);
  };

  return { show, fromVersion, toVersion: APP_VERSION, dismiss };
}

export async function applyUpdateDirect(): Promise<void> {
  const filePath = localStorage.getItem('studio:downloadedApkPath');
  if (!filePath) {
    throw new Error('No downloaded APK path found.');
  }
  const { openApkInstallerDirect } = await import('./apkDownloader');
  await openApkInstallerDirect(filePath);
}

export async function shareDownloadedApk(): Promise<void> {
  const filePath = localStorage.getItem('studio:downloadedApkPath');
  if (!filePath) {
    throw new Error('No downloaded APK found to share.');
  }
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: 'Studio Update APK',
      text: 'Here is the latest update APK for Studio.',
      url: filePath,
      dialogTitle: 'Share Studio Update'
    });
  } catch (err: any) {
    console.error('Failed to share APK:', err);
    throw err;
  }
}

export function getPackageInstallerStatusName(status: number): string {
  switch (status) {
    case -2:
      return 'STATUS_PENDING_INSTALL (Installer Started)';
    case -1:
      return 'STATUS_PENDING_USER_ACTION (Requires confirmation)';
    case -3:
      return 'STATUS_PROGRESS_UPDATE';
    case 0:
      return 'STATUS_SUCCESS';
    case 1:
      return 'STATUS_FAILURE';
    case 2:
      return 'STATUS_FAILURE_BLOCKED';
    case 3:
      return 'STATUS_FAILURE_ABORTED (User cancelled)';
    case 4:
      return 'STATUS_FAILURE_INVALID';
    case 5:
      return 'STATUS_FAILURE_CONFLICT (Signature mismatch)';
    case 6:
      return 'STATUS_FAILURE_STORAGE (Insufficient storage)';
    case 7:
      return 'STATUS_FAILURE_INCOMPATIBLE (Version Code low)';
    default:
      return `STATUS_UNKNOWN (${status})`;
  }
}


