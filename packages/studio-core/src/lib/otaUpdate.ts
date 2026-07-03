import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION, compareSemver, normalizeSemver } from './appVersion';
import { AppInstaller } from './apkDownloader';
import { isNative, shouldUseAndroidApkUpdater } from './capgoUpdater';
import { nativeSet, NATIVE_PREFS } from './nativePrefs';
import { useChordStore } from '../store/useChordStore';
import { logActivity } from './activityLogger';

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
  HealthStatus
} from './updater/diagnostics';

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
  getDiagnosticsReport
};

export type { CentralizedOtaState, OtaUpdateState, StructuredReleaseNotes, RemoteVersionInfo, HealthStatus };

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
  transitionToState('IDLE', 'Reset update state');
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

export async function enforceStartupRecovery() {
  console.log('[OTA DEBUG] enforceStartupRecovery starting...');
  
  if (!isNative() || !isAppInstallerAvailable()) {
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
      });
      transitionToState('INSTALLING', 'Active PackageInstaller session detected on startup');
      return;
    }

    const result = await AppInstaller.getLastInstallResult();
    if (result.statusCode !== -999) {
      console.log('[OTA DEBUG] enforceStartupRecovery: Pending install result exists (code ' + result.statusCode + ').');
      const processed = processLastInstallResult(result);
      if (processed) {
        const finalState: OtaUpdateState = processed.category === 'signature_mismatch' ? 'RECOVERY' : 'INSTALL_FAILED';
        updateGlobalState({
          error: processed.errMsg,
          statusText: processed.errMsg
        });
        transitionToState(finalState, `Startup recovery: pending install result (code ${result.statusCode})`, processed.errMsg);
      }
      return;
    }

    console.log('[OTA DEBUG] No active session and no pending result. Resetting state to IDLE.');
    stopWatchdog();

    // Only clear promise guards if no operations are actually in flight
    if (!activeCheckPromise) activeCheckPromise = null;
    if (!activeApplyPromise) activeApplyPromise = null;
    if (!activeDownloadPromise) activeDownloadPromise = null;

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
}

// Queue / Check variables
let latestCheckId = 0;
let activeCheckIsManual = false;
let activeCheckPromise: Promise<CentralizedOtaState> | null = null;
let activeDownloadPromise: Promise<void> | null = null;
let activeApplyPromise: Promise<void> | null = null;

let lastCheckedTime = 0;
function resetLastCheckedTime() {
  lastCheckedTime = 0;
}
const MIN_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function checkForUpdate(isManual = false, trigger = 'unknown', reason = 'unknown'): Promise<CentralizedOtaState> {
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
    console.log(`[OTA] Skipping checkForUpdate: installer is currently busy (state: ${current})`);
    return Promise.resolve(globalOtaState);
  }

  // If it's a background/automatic check (not manual), and we already have an update available
  // or a failed state, do NOT run the check to avoid wiping out the user-facing state.
  if (!isManual && current !== 'IDLE') {
    console.log(`[OTA] Skipping background checkForUpdate: current state is ${current}`);
    return Promise.resolve(globalOtaState);
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

  logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 326, `Entering checkForUpdate Call #${callId}`, { prevState: globalOtaState.updateState, reason: `Trigger: ${trigger} | Reason: ${reason}` });

  if (activeCheckPromise) {
    if (!activeCheckIsManual && isManual) {
      logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 330, `Obsoleting background check in favor of manual check Call #${callId}`, { prevState: globalOtaState.updateState });
      activeCheckPromise = null;
      activeCheckIsManual = true;
    } else {
      logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 333, `Exiting checkForUpdate Call #${callId} early (reusing activeCheckPromise)`, { prevState: globalOtaState.updateState });
      return activeCheckPromise;
    }
  }

  const checkId = ++latestCheckId;
  logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 338, `Starting new update check (checkId=${checkId})`, { prevState: globalOtaState.updateState });

  if (!isManual) {
    const now = Date.now();
    if (now - lastCheckedTime < MIN_AUTO_CHECK_INTERVAL_MS) {
      console.log('[OTA] Skipping auto-check, checked recently (rate limited).');
      return Promise.resolve(globalOtaState);
    }
  }

  if (isManual) {
    removeSessionItem('studio:laterUpdateVersion');
    removeSessionItem('studio:autoOpenedUpdateVersion');
  }


  activeCheckPromise = (async () => {
    const startTime = Date.now();
    setActivePipelineContext({ checkId, trigger, pipelineStartTime: startTime });
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

      const natVer = await getNativeVersion();
      const natVerCode = await getNativeVersionCode();

      transitionToState('FETCH_REMOTE_METADATA', 'Fetching remote manifest');
      const realRemote = await fetchRemoteVersion();

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

      if (checkId !== latestCheckId) {
        console.log(`[OTA] Check request checkId=${checkId} was superseded by checkId=${latestCheckId}. Exiting silently.`);
        return globalOtaState;
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

      if (isNative() && isAppInstallerAvailable()) {
        try {
          const { AppInstaller } = await import('./apkDownloader');
          const result = await AppInstaller.getLastInstallResult();
          console.log('[OTA DEBUG] Last install result status:', result);
          
          const processed = processLastInstallResult(result);
          if (processed) {
            otaDiagnostics.statusCode = result.statusCode;
            otaDiagnostics.statusText = processed.errMsg;
            otaDiagnostics.exceptionMessage = processed.errMsg;
            otaDiagnostics.failureReason = `PackageInstaller code ${result.statusCode}\nMessage: ${result.statusMessage}\nPackage: ${result.packageName}`;
            otaDiagnostics.installerResult = `Code: ${result.statusCode}\nMessage: ${result.statusMessage}\nPackage: ${result.packageName}\nTimestamp: ${new Date(result.timestamp).toISOString()}`;
            otaDiagnostics.timestamp = new Date(result.timestamp).toISOString();

            await populateDiagnostics(null, 'PackageInstaller failure detected');

            const finalState: OtaUpdateState = processed.category === 'signature_mismatch' ? 'RECOVERY' : 'INSTALL_FAILED';
            updateGlobalState({
              error: processed.errMsg
            });
            transitionToState(finalState, `Install result during check: ${processed.category}`, processed.errMsg);
            const duration = Date.now() - startTime;
            console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
            return globalOtaState;
          }
        } catch (err) {
          console.warn('[OTA] Failed to fetch last native install result:', err);
        }
      }

      transitionToState('VALIDATE_METADATA', 'Validating fetched manifest integrity');
      if (!remote) {
        otaDebugLogs.updateDecision = 'metadata_unavailable';
        otaDebugLogs.updateDecisionReason = 'Remote metadata is missing or unreachable.';
        updateGlobalState({
          decisionExplanation: 'Remote metadata is missing or unreachable.',
          updateAvailable: false,
        });
        if (isManual) {
          updateGlobalState({ error: 'Unable to contact the update server.' });
          transitionToState('RECOVERY', 'Manual check failed: no remote metadata', 'Unable to contact update server');
        } else {
          updateGlobalState({ error: 'Update check failed: remote metadata unavailable.' });
          transitionToState('RECOVERY', 'Auto-check failed: no remote metadata', 'Remote metadata unavailable');
        }
        const duration = Date.now() - startTime;
        console.log(`[INSTRUMENTATION] checkForUpdate EXIT Call #${callId} duration=${duration}ms resolvedState=${globalOtaState.updateState}`);
        return globalOtaState;
      }

      transitionToState('COMPARE_VERSION', 'Comparing version names and codes');
      const comp = compareVersions(remote, APP_VERSION, natVerCode ?? undefined);
      const updateAvailable = comp.updateAvailable || (isManual && comp.isDowngrade);
      otaDebugLogs.updateDecision = updateAvailable ? 'UPDATE_AVAILABLE' : 'NO_UPDATE_AVAILABLE';
      otaDebugLogs.updateDecisionReason = comp.explanation;
      updateGlobalState({ decisionExplanation: comp.explanation });

      if (updateAvailable) {
        const dismissedList = getStoredList('studio:dismissedVersions');
        const isDismissed = dismissedList.includes(remote.version);
        const isLater = laterVersion === remote.version;

        if (!isManual && (isDismissed || isLater)) {
          console.log(`[OTA] Skipping auto-prompt for version ${remote.version} (user dismissed/later).`);
          // Store version info for reference, but updateAvailable must be false
          // when state is NO_UPDATE_AVAILABLE to prevent split-brain.
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
          await checkAndCleanCache();
          transitionToState('NO_UPDATE_AVAILABLE', 'User dismissed/later');
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

        await checkAndCleanCache();
        transitionToState('UPDATE_AVAILABLE', 'New update found');
        void logProgressStage('Update detected', `Version: ${remote.version}`);
      } else {
        updateGlobalState({
          remoteVersion: remote.version,
          updateAvailable: false,
        });
        otaDebugLogs.updateDecision = 'NO_UPDATE_AVAILABLE';
        otaDebugLogs.updateDecisionReason = `Local ${APP_VERSION} >= Remote ${remote.version} (isUpToDate=${comp.isUpToDate}, isDowngrade=${comp.isDowngrade})`;
        transitionToState('NO_UPDATE_AVAILABLE', `App is up to date (local=${APP_VERSION}, remote=${remote.version})`);
      }

      const duration = Date.now() - startTime;
      logDetailedJsTrace('checkForUpdate', 'otaUpdate.ts', 584, `Exiting checkForUpdate Call #${callId} successfully`, { durationMs: duration, prevState: 'COMPARE_VERSION', nextState: globalOtaState.updateState });
      return globalOtaState;
    } catch (err) {
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
      transitionToState('RECOVERY', isManual ? 'Manual check exception' : `Auto-check exception: ${errMsg}`, errMsg);
      return globalOtaState;
    } finally {
      if (checkId === latestCheckId) {
        activeCheckPromise = null;
        activeCheckIsManual = false;
        lastCheckedTime = Date.now();
        setActivePipelineContext(null);
      }
    }
  })();

  return activeCheckPromise;
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

export function downloadUpdate(trigger?: string): Promise<void> {
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

  transitionToState('FETCH_APK_INFORMATION', 'downloadUpdate start');
  updateGlobalState({ progress: 0, statusText: 'Preparing update...', error: null });

  activeDownloadPromise = (async () => {
    const downloadedPath = localStorage.getItem('studio:downloadedApkPath');
    if (downloadedPath && !downloadedPath.includes(`studio-update-${ver}.apk`)) {
      localStorage.removeItem('studio:downloadedApkPath');
    }
    
    const hasValid = await checkAndCleanCache();
    if (hasValid) {
      console.log('[Smart Recovery] Valid APK already exists. Skipping download.');
      transitionToState('VERIFY_SHA256', 'Valid cached APK exists');
      updateGlobalState({ progress: 1.0, statusText: 'Verifying update...' });
      const filePath = await getLocalApkPath(ver);
      
      transitionToState('PREPARE_INSTALL', 'Checking cached APK eligibility');
      const isEligible = await runEligibilityCheck(filePath, isDowngrade);
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        throw new Error(`[Eligibility Check] Validation failed: ${otaDebugLogs.eligibilityReason || 'unknown'}`);
      }
      
      transitionToState('WAIT_PACKAGE_INSTALLER', 'Valid cached APK verified');
      return;
    }

    transitionToState('DOWNLOAD_APK', 'Starting APK package download');
    otaDebugLogs.downloadStatus = `Update started: apk\nAPK URL: ${apkUrl}`;
    updateGlobalState({ progress: 0.0, statusText: 'Entering progress screen...' });
    
    try {
      let filePath: string;
      const shouldSimulate = !isNative() || !isAppInstallerAvailable() || updaterSimulation.simulateDownload;
      if (shouldSimulate) {
        addJsLog('[Simulate Download] Starting simulated download loop...');
        for (let i = 1; i <= 10; i++) {
          if (updaterSimulation.injectNetworkTimeout) {
            addJsLog('[Simulate Download] Injecting network timeout!');
            transitionToState('INSTALL_FAILED', 'Simulated network timeout');
            throw new Error('Simulated network timeout');
          }
          if (updaterSimulation.injectDownloadFailure) {
            addJsLog('[Simulate Download] Injecting download failure!');
            transitionToState('INSTALL_FAILED', 'Simulated download failure');
            throw new Error('Simulated download failure');
          }
          updateGlobalState({ progress: i / 10, statusText: `Simulating download... (${i * 10}%)` });
          await new Promise((resolve) => setTimeout(resolve, 300));
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
          transitionToState('INSTALL_FAILED', 'APK download execution failed');
          throw dlErr;
        }
      }

      otaDebugLogs.downloadStatus += `\nAPK download completed. Path: ${filePath}`;
      void logProgressStage('Download completed', 'Path: ' + filePath);

      transitionToState('VERIFY_SHA256', 'Verifying checksum');
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 764, 'Starting SHA-256 integrity verification. Expected: ' + (globalOtaState as any).apkSha256);
      if (updaterSimulation.forceShaFailure) {
        addJsLog('Simulation override: Injecting SHA checksum failure!');
        transitionToState('INSTALL_FAILED', 'Simulated checksum failure');
        throw new Error('Simulated SHA-256 checksum mismatch');
      }

      if (shouldSimulate) {
        if (updaterSimulation.injectChecksumFailure) {
          addJsLog('[Simulate Download] Injecting checksum failure!');
          transitionToState('INSTALL_FAILED', 'Simulated checksum failure');
          throw new Error('Simulated checksum failure');
        }
        otaDebugLogs.shaVerification = 'PASSED (Simulated)';
      } else {
        const expectedHash = (globalOtaState as any).apkSha256;
        if (expectedHash) {
          try {
            await verifyFileIntegrity(filePath, expectedHash);
            logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 783, 'SHA-256 integrity verification passed');
          } catch (shaErr) {
            transitionToState('INSTALL_FAILED', 'SHA integrity check failed');
            throw shaErr;
          }
        } else {
          otaDebugLogs.shaVerification = 'SKIPPED (No expected hash)';
        }
      }

      try {
        const { Filesystem } = await import('@capacitor/filesystem');
        const info = await Filesystem.stat({ path: filePath });
        otaDebugLogs.fileDetails = `Size: ${info.size} bytes\nURI: ${info.uri}`;
      } catch (statErr) {
        otaDebugLogs.fileDetails = `Error reading file stats: ${statErr instanceof Error ? statErr.message : String(statErr)}`;
      }

      updateGlobalState({ progress: 1.0, statusText: 'Verifying update' });
      await new Promise((resolve) => setTimeout(resolve, 300));

      otaDebugLogs.downloadStatus += `\nRunning pre-install eligibility check...`;
      transitionToState('PREPARE_INSTALL', 'Checking eligibility');
      updateGlobalState({ statusText: 'Checking eligibility...' });
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
        return await runEligibilityCheck(filePath, isDowngrade);
      })();
      logDetailedJsTrace('downloadUpdate', 'otaUpdate.ts', 820, 'Pre-install eligibility check completed. Result: ' + isEligible);

      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        transitionToState('INSTALL_FAILED', `Eligibility check failed: ${otaDebugLogs.eligibilityReason}`);
        throw new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
      }

      void logProgressStage('Eligibility check passed', 'APK is eligible for installation');
      void logProgressStage('Installer prepared', 'Installer prepared and files verified');

      transitionToState('WAIT_PACKAGE_INSTALLER', 'APK download & verify complete');
      updateGlobalState({ statusText: 'Ready to install' });
      localStorage.setItem('studio:downloadedApkPath', filePath);
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
    }
  })();

  return activeDownloadPromise;
}

export function applyUpdate(trigger?: string): Promise<void> {
  const callId = nextJsCallId();
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

  transitionToState('INSTALLING', 'applyUpdate start');
  logActivity('apk_install', `Installing APK system update (v${remoteVersion})`, 'Studio');

  activeApplyPromise = (async () => {
    let nativeListener: any = null;
    try {
      const filePath = localStorage.getItem('studio:downloadedApkPath');
      if (!filePath) {
        throw new Error('No downloaded APK path found.');
      }

      updateGlobalState({ statusText: 'Preparing installation...' });
      const isEligible = await runEligibilityCheck(filePath);
      if (!isEligible) {
        if (otaDebugLogs.eligibilityReason === 'signature_mismatch' && !isRecovering) {
          const recovered = await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
          if (recovered) return;
        }
        throw new Error('[Eligibility Check] Validation failed: ' + (otaDebugLogs.eligibilityReason || 'unknown'));
      }

      // Register listener to monitor native PackageInstaller status events
      const { AppInstaller } = await import('./apkDownloader');
      const statusPromise = new Promise<void>(async (resolvePromise, rejectPromise) => {
        try {
          console.log('[INSTRUMENTATION] [JS] Registering native status listener for onInstallStatusChanged');
          const onStatusEvent = (eventData: any) => {
            const status = eventData.status;
            const message = eventData.message;
            console.log('[INSTRUMENTATION] [JS] onInstallStatusChanged received:', eventData);
            addJsLog(`Install Status Received: status=${status}, message=${message}, progress=${eventData.progress || 0}`);

            if (status === -1) { // STATUS_PENDING_USER_ACTION
              console.log('[INSTRUMENTATION] [JS] STATUS_PENDING_USER_ACTION received. Showing confirmation dialog.');
              transitionToState('WAIT_PACKAGE_INSTALLER', 'Native prompt displayed');
              updateGlobalState({ statusText: 'System confirmation dialog is showing...' });
            } else if (status === -2) { // installing_start
              console.log('[INSTRUMENTATION] [JS] Session active. Installation started.');
              transitionToState('INSTALLING', 'PackageInstaller session active');
              updateGlobalState({ statusText: 'Installing update...' });
            } else if (status === -3) { // installing_progress
              const progressPct = Math.round((eventData.progress || 0) * 100);
              console.log(`[INSTRUMENTATION] [JS] Installation progress: ${progressPct}%`);
              updateGlobalState({ statusText: `Installing... (${progressPct}%)` });
            } else if (status === 0) { // STATUS_SUCCESS
              console.log('[INSTRUMENTATION] [JS] STATUS_SUCCESS received. Installation completed successfully.');
              transitionToState('INSTALL_SUCCESS', 'PackageInstaller success');
              resolvePromise();
            } else if (status === 3) { // STATUS_FAILURE_ABORTED (User cancelled)
              console.log('[INSTRUMENTATION] [JS] STATUS_FAILURE_ABORTED received. User cancelled.');
              transitionToState('INSTALL_FAILED', 'User cancelled installation');
              rejectPromise(new Error('Installation cancelled by user.'));
            } else {
              console.log(`[INSTRUMENTATION] [JS] Installation failed with status ${status}: ${message}`);
              transitionToState('INSTALL_FAILED', `Install failed: ${message || `code ${status}`}`);
              rejectPromise(new Error(message || `PackageInstaller error code ${status}`));
            }
          };

          setSimulateStatusCallback(onStatusEvent);
          if (isNative() && isAppInstallerAvailable()) {
            nativeListener = await (AppInstaller as any).addListener('onInstallStatusChanged', onStatusEvent);
          }
        } catch (e) {
          console.warn('Failed to register native status listener:', e);
        }
      });

      otaDebugLogs.installError += `\nAPK is eligible. Launching APK installer intent for file: ${filePath}`;
      updateGlobalState({ statusText: 'Waiting for Android...' });

      const shouldSimulateInstall = !isNative() || !isAppInstallerAvailable() ||
          updaterSimulation.simulateDownload || 
          updaterSimulation.forceInstallSuccess || 
          updaterSimulation.forceInstallFailure || 
          updaterSimulation.forceUserCancel || 
          updaterSimulation.forcePendingUserAction;

      if (shouldSimulateInstall) {
        addJsLog('[Simulate Install] Simulation active. Skipping native install trigger.');
        void logProgressStage('Simulation committed', 'Simulation mode active');
        
        // Timed sequence simulation
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          triggerSimulatedStatus(-2, 'installing_start');
          
          await new Promise((resolve) => setTimeout(resolve, 1500));
          triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');
          
          if (updaterSimulation.forcePendingUserAction) {
            addJsLog('[Simulate Install] Pausing in STATUS_PENDING_USER_ACTION.');
            return;
          }
          
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (updaterSimulation.forceUserCancel) {
            triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
          } else if (updaterSimulation.forceInstallFailure) {
            triggerSimulatedStatus(1, 'STATUS_FAILURE');
          } else {
            triggerSimulatedStatus(0, 'STATUS_SUCCESS');
          }
        })();
      } else {
        void logProgressStage('Session committed', 'Handing over to PackageInstaller');
        await triggerNativeInstall(filePath);
        void logProgressStage('Waiting for Android confirmation', 'Waiting for system confirmation dialog to overlay');
      }

      otaDebugLogs.installError += `\nAPK installer intent launched successfully!`;
      otaDebugLogs.installerLaunchStatus = 'SUCCESS';
      otaDebugLogs.lastExceptionStackTrace = 'None';
      otaDebugLogs.finalPathExecuted = 'APK installer launched';

      // Await statusPromise to resolve, reject, or be killed on update reload
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
    }
  })();

  return activeApplyPromise;
}

export function dismissUpdate(): void {
  const ver = globalOtaState.remoteVersion;
  if (ver) {
    addToStoredList('studio:dismissedVersions', ver);
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

let isOtaInitialized = false;

export function initializeGlobalOtaListeners() {
  if (isOtaInitialized) return;
  isOtaInitialized = true;
  console.log('[OTA] Initializing global listeners and background polling...');

  const getAutoCheck = () => {
    try {
      return useChordStore.getState().settings.otaAutoCheck ?? true;
    } catch {
      return true;
    }
  };

  const runCheck = (trigger: string, reason: string) => {
    if (!getAutoCheck()) return;
    if (typeof window !== 'undefined' && !(window as any).__studioStartupComplete) {
      console.log(`[OTA] Bypassing lifecycle check (${trigger}) because startup is not complete.`);
      return;
    }
    void checkForUpdate(false, trigger, reason);
  };

  const initUpdater = () => {
    console.log('[OTA] Running delayed updater startup (Phase 3)...');
    void checkAndCleanCache();
    if (globalOtaState.updateState === 'IDLE') {
      void checkForUpdate(false, 'startup', 'App init check');
    }
  };

  let introTimer: any = null;
  if (typeof window !== 'undefined') {
    if ((window as any).__introDone || sessionStorage.getItem('studio-intro-shown') === 'true') {
      initUpdater();
    } else {
      const handleIntroDone = () => {
        if (introTimer) clearTimeout(introTimer);
        window.removeEventListener('studio-intro-done', handleIntroDone);
        setTimeout(initUpdater, 1000);
      };
      window.addEventListener('studio-intro-done', handleIntroDone);
      introTimer = setTimeout(handleIntroDone, 3000);
    }
  } else {
    initUpdater();
  }



  // Global PackageInstaller event handler
  const handleInstallStatusChange = (eventData: any) => {
    const { status, message, progress } = eventData;
    console.log(`[OTA Global Listener] Received status ${status}: ${message} (progress ${progress}%)`);
    addJsLog(`[Global Listener Event] Received status ${status}: ${message} (progress ${progress}%)`);
    
    // Log to installer database
    if (isNative() && typeof (AppInstaller as any).logInstallerEvent === 'function') {
      void (AppInstaller as any).logInstallerEvent({ stage: `Status ${status}`, status: String(status), message: message || '' });
    }

    if (status === -2) {
      transitionToState('INSTALLING', 'PackageInstaller session active');
      updateGlobalState({ statusText: `Installing...` });
    } else if (status === -1) {
      transitionToState('WAIT_PACKAGE_INSTALLER', 'PackageInstaller requires user interaction');
      updateGlobalState({ statusText: 'Tap Install to confirm...' });
    } else if (status === 0) {
      transitionToState('INSTALL_SUCCESS', 'PackageInstaller status SUCCESS');
      updateGlobalState({ statusText: 'Install succeeded!' });
    } else if (status === 3) {
      transitionToState('INSTALL_FAILED', 'User cancelled installation');
    } else {
      transitionToState('INSTALL_FAILED', `Install failed: ${message || `code ${status}`}`);
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



  const schedulePoll = () => {
    setTimeout(async () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        runCheck('polling', 'periodic foreground poll');
      }
      schedulePoll();
    }, FOREGROUND_POLL_MS);
  };
  schedulePoll();
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


