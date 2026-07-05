import { isNative } from '../capgoUpdater';
import { APP_VERSION } from '../appVersion';
import { globalOtaState } from './stateMachine';

export interface OtaDiagnostics {
  exceptionMessage: string | null;
  failureReason: string | null;
  downloadUrl: string | null;
  apkPath: string | null;
  fileSize: string | null;
  shaExpected: string | null;
  shaCalculated: string | null;
  installerResult: string | null;
  permissionState: string | null;
  androidVersion: string | null;
  deviceModel: string | null;
  timestamp: string | null;
  architecture?: string | null;
  deviceLocale?: string | null;
  storageAvailable?: string | null;
  networkState?: string | null;
  statusCode?: number | null;
  statusText?: string | null;

  // Pipeline details
  pipelineId?: number | null;
  triggerSource?: string | null;
  pipelineOwner?: string | null;
  queueDepth?: number | null;
  coalescedEventCount?: number | null;
  cancelledPipelineCount?: number | null;
  ignoredStaleCallbacksCount?: number | null;
  activeAsyncStage?: string | null;
  pipelineDuration?: number | null;
}

export let otaDiagnostics: OtaDiagnostics = {
  exceptionMessage: null,
  failureReason: null,
  downloadUrl: null,
  apkPath: null,
  fileSize: null,
  shaExpected: null,
  shaCalculated: null,
  installerResult: null,
  permissionState: null,
  androidVersion: null,
  deviceModel: null,
  timestamp: null,
  architecture: null,
  deviceLocale: null,
  storageAvailable: null,
  networkState: null,
  statusCode: null,
  statusText: null,

  pipelineId: null,
  triggerSource: null,
  pipelineOwner: null,
  queueDepth: null,
  coalescedEventCount: null,
  cancelledPipelineCount: null,
  ignoredStaleCallbacksCount: null,
  activeAsyncStage: null,
  pipelineDuration: null,
};

export const otaDebugLogs: {
  appVersion: string;
  nativeApkVersion: string | null;
  currentOtaVersion: string | null;
  fetchedVersionJson: string | null;
  fetchedAppReleaseJson: string | null;
  compareResult: number | null;
  updateType: string | null;
  remoteUpdateType: string | null;
  otaBlockedBecauseApkRequired: boolean;
  apkEligibilityResult: string;
  finalDecision: string | null;
  downloadStatus: string | null;
  installError: string | null;
  shaVerification: string | null;
  fileDetails: string | null;
  installerLaunchStatus: string | null;
  lastExceptionStackTrace: string | null;
  appInstallerAvailable: boolean;
  registeredPlugins: string;
  pluginMethodCheck: string;
  finalUpdatePath: string;
  downloadApkAvailable: boolean;
  verifyApkSha256Available: boolean;
  installApkAvailable: boolean;
  openInstallPermissionSettingsAvailable: boolean;
  installedVersionCode: number | null;
  requiredApkVersion: string | null;
  requiredVersionCode: number | null;
  nativeApkBehind: boolean;
  apkUpdateRequired: boolean;
  pendingOtaBundleId: string | null;
  staleOtaCleared: boolean;
  capgoSetBlocked: boolean;
  triggerComponent: string | null;
  finalPathExecuted: 'OTA applied' | 'APK installer launched' | 'blocked due to APK required' | 'N/A';
  installedPackageName: string | null;
  installedVersionName: string | null;
  installedSigningSha256: string | null;
  installedDebuggable: boolean | null;
  downloadedPackageName: string | null;
  downloadedVersionName: string | null;
  downloadedVersionCode: number | null;
  downloadedSigningSha256: string | null;
  downloadedDebuggable: boolean | null;
  downloadedApkPath: string | null;
  downloadedApkSize: string | null;
  downloadedApkSha256: string | null;
  downloadedIsValidApk: boolean | null;
  downloadedIsUniversalApk: boolean | null;
  eligibilityPackageNameMatch: boolean | null;
  eligibilitySigningMatch: boolean | null;
  eligibilityVersionCodeHigher: boolean | null;
  eligibilityReleaseBuild: boolean | null;
  eligibilityValidApk: boolean | null;
  eligibilityFinalInstall: string | null;
  eligibilityReason: string | null;
  updateDecision: string | null;
  updateDecisionReason: string | null;
  remoteVersionCode: number | null;
  versionComparisonResult: string | null;
  nativePlatformDetected: boolean | null;
  platformDetected: string | null;
  apkMetadataValid: boolean | null;
  apkUrlPresent: boolean | null;
  apkShaPresent: boolean | null;
  skippedDismissedState: string | null;
  releaseChannel: string | null;
  rolloutEligibility: string | null;
  magicHeaderCheck: string | null;
  downloadSourcesConfigured: string | null;
  currentDownloadSource: string | null;
  recoveryAttemptsPerformed: string[];
  signatureMismatchDetectedCause: string | null;
  expectedSigningSha256: string | null;
  certificateSubject: string | null;
  certificateIssuer: string | null;
  validationStage: string | null;
  exactFailingStage: string | null;
  rootCause: string | null;
  suggestedFix: string | null;
  magicHeaderCheckResult?: string | null;
  renderCount?: number;
  paintCount?: number;
  layoutCount?: number;
} = {
  appVersion: APP_VERSION,
  nativeApkVersion: null,
  currentOtaVersion: null,
  fetchedVersionJson: null,
  fetchedAppReleaseJson: null,
  compareResult: null,
  updateType: null,
  remoteUpdateType: null,
  otaBlockedBecauseApkRequired: false,
  apkEligibilityResult: 'N/A',
  finalDecision: null,
  downloadStatus: null,
  installError: null,
  shaVerification: null,
  fileDetails: null,
  installerLaunchStatus: null,
  lastExceptionStackTrace: null,
  appInstallerAvailable: false,
  registeredPlugins: '[]',
  pluginMethodCheck: 'N/A',
  finalUpdatePath: 'N/A',
  downloadApkAvailable: false,
  verifyApkSha256Available: false,
  installApkAvailable: false,
  openInstallPermissionSettingsAvailable: false,
  installedVersionCode: null,
  requiredApkVersion: null,
  requiredVersionCode: null,
  nativeApkBehind: false,
  apkUpdateRequired: false,
  pendingOtaBundleId: null,
  staleOtaCleared: false,
  capgoSetBlocked: false,
  triggerComponent: null,
  finalPathExecuted: 'N/A',
  installedPackageName: null,
  installedVersionName: null,
  installedSigningSha256: null,
  installedDebuggable: null,
  downloadedPackageName: null,
  downloadedVersionName: null,
  downloadedVersionCode: null,
  downloadedSigningSha256: null,
  downloadedDebuggable: null,
  downloadedApkPath: null,
  downloadedApkSize: null,
  downloadedApkSha256: null,
  downloadedIsValidApk: null,
  downloadedIsUniversalApk: null,
  eligibilityPackageNameMatch: null,
  eligibilitySigningMatch: null,
  eligibilityVersionCodeHigher: null,
  eligibilityReleaseBuild: null,
  eligibilityValidApk: null,
  eligibilityFinalInstall: null,
  eligibilityReason: null,
  updateDecision: null,
  updateDecisionReason: null,
  remoteVersionCode: null,
  versionComparisonResult: null,
  nativePlatformDetected: null,
  platformDetected: null,
  apkMetadataValid: null,
  apkUrlPresent: null,
  apkShaPresent: null,
  skippedDismissedState: null,
  releaseChannel: null,
  rolloutEligibility: null,
  magicHeaderCheck: null,
  downloadSourcesConfigured: null,
  currentDownloadSource: null,
  recoveryAttemptsPerformed: [],
  signatureMismatchDetectedCause: null,
  expectedSigningSha256: null,
  certificateSubject: null,
  certificateIssuer: null,
  validationStage: null,
  exactFailingStage: null,
  rootCause: null,
  suggestedFix: null,
  renderCount: 0,
  paintCount: 0,
  layoutCount: 0,
};

let checkCallIdCounter = 0;
export function nextJsCallId(): number {
  return ++checkCallIdCounter;
}

export function isAppInstallerAvailable(): boolean {
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function' && !cap.isNativePlatform()) {
    return false;
  }
  const isPluginAvail = cap.isPluginAvailable?.('AppInstaller') ?? false;
  if (!isPluginAvail) return false;
  const plugin = cap.Plugins?.AppInstaller;
  if (!plugin) return false;

  return (
    typeof plugin.downloadApk === 'function' &&
    (typeof plugin.verifyApkSha256 === 'function' || typeof plugin.verifySha256 === 'function') &&
    typeof plugin.installApk === 'function' &&
    (typeof plugin.openInstallPermissionSettings === 'function' || typeof plugin.openUnknownAppSourcesSettings === 'function')
  );
}

export async function logProgressStage(stage: string, message?: string, exceptionStack?: string) {
  if (isNative() && isAppInstallerAvailable()) {
    try {
      const { AppInstaller } = await import('../apkDownloader');
      await AppInstaller.appendLog({
        stage,
        status: 0,
        message: message || '',
        exceptionStack: exceptionStack || '',
        packageName: globalOtaState.packageName || 'com.chordex.app'
      });
    } catch (e) {
      console.warn('[OTA] Failed to write progress stage log:', e);
    }
  }
}

export async function populateDiagnostics(err: any, reason: string) {
  try {
    const timestamp = new Date().toISOString();
    let manufacturer = 'Web Browser';
    let model = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';
    let androidVersion = 'N/A';
    let permissionState = 'N/A';

    if (isNative()) {
      try {
        const { AppInstaller } = await import('../apkDownloader');
        const deviceInfo = await AppInstaller.getDeviceInfo();
        manufacturer = deviceInfo.manufacturer;
        model = deviceInfo.model;
        androidVersion = `${deviceInfo.androidVersion} (API ${deviceInfo.sdkInt})`;
        permissionState = `canRequestPackageInstalls: ${deviceInfo.canRequestPackageInstalls}`;
        
        otaDiagnostics.architecture = deviceInfo.architecture || 'N/A';
        otaDiagnostics.deviceLocale = deviceInfo.deviceLocale || 'N/A';
        otaDiagnostics.storageAvailable = deviceInfo.storageAvailable || 'N/A';
        otaDiagnostics.networkState = deviceInfo.networkState || 'N/A';
      } catch (e) {
        console.warn('[OTA] Failed to get native device info for diagnostics:', e);
        permissionState = 'Error querying permission';
      }
    }

    const apkPath = otaDebugLogs.downloadedApkPath || localStorage.getItem('studio:downloadedApkPath') || 'N/A';
    let fileSize = 'N/A';
    let magicHeader = 'N/A';

    if (isNative() && apkPath && apkPath !== 'N/A') {
      try {
        const { Filesystem } = await import('@capacitor/filesystem');
        const info = await Filesystem.stat({ path: apkPath });
        fileSize = `${(info.size / (1024 * 1024)).toFixed(2)} MB (${info.size} bytes)`;

        try {
          const { AppInstaller } = await import('../apkDownloader');
          const firstBytes = await AppInstaller.readFirstBytes({ filePath: apkPath, count: 4 });
          const matchesPK = firstBytes.hex.toLowerCase().startsWith('504b');
          magicHeader = `Hex: ${firstBytes.hex}, ASCII: ${firstBytes.ascii} (Matches PK/ZIP: ${matchesPK})`;
          otaDebugLogs.magicHeaderCheck = magicHeader;
        } catch (hErr) {
          console.warn('[OTA] Failed to read magic bytes:', hErr);
          magicHeader = `Failed to read: ${hErr instanceof Error ? hErr.message : String(hErr)}`;
          otaDebugLogs.magicHeaderCheck = magicHeader;
        }
      } catch (statErr) {
        console.warn('[OTA] Failed to read file stats:', statErr);
      }
    }

    let shaCalculated = otaDebugLogs.shaVerification || 'N/A';

    otaDiagnostics.exceptionMessage = err instanceof Error ? err.message : String(err);
    otaDiagnostics.failureReason = reason + (err instanceof Error && err.stack ? `\nStack: ${err.stack}` : '');
    otaDiagnostics.downloadUrl = globalOtaState.apkUrl || globalOtaState.downloadUrl || 'N/A';
    otaDiagnostics.apkPath = apkPath;
    otaDiagnostics.fileSize = fileSize;
    otaDiagnostics.shaExpected = globalOtaState.apkSha256 || 'N/A';
    otaDiagnostics.shaCalculated = shaCalculated;
    otaDiagnostics.installerResult = otaDebugLogs.installError || 'N/A';
    otaDiagnostics.permissionState = permissionState;
    otaDiagnostics.androidVersion = androidVersion;
    otaDiagnostics.deviceModel = `${manufacturer} ${model}`;
    otaDiagnostics.timestamp = timestamp;
  } catch (diagErr) {
    console.error('[OTA] Failed to populate diagnostics:', diagErr);
  }
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'unhealthy';
  metadataReachable: boolean;
  githubReachable: boolean;
  firebaseReachable: boolean;
  installerAvailable: boolean;
  packageInstallerAvailable: boolean;
  certificateValid: boolean;
  details: string[];
}

export async function runUpdaterHealthCheck(): Promise<HealthStatus> {
  const details: string[] = [];
  let metadataReachable = false;
  let githubReachable = false;
  let firebaseReachable = false;
  let installerAvailable = false;
  let packageInstallerAvailable = false;
  let certificateValid = false;

  try {
    const res = await fetch('https://studio-30f44.web.app/app-release.json', { method: 'HEAD' });
    metadataReachable = res.ok;
    firebaseReachable = res.ok;
    details.push(res.ok ? 'Firebase metadata server reachable.' : `Firebase metadata unreachable (HTTP ${res.status}).`);
  } catch (err: any) {
    details.push(`Firebase metadata unreachable: ${err.message || String(err)}`);
  }

  try {
    const res = await fetch('https://api.github.com/repos/MAGEXE1000/Studio/releases', { method: 'HEAD' });
    githubReachable = res.ok;
    details.push(res.ok ? 'GitHub API reachable.' : `GitHub API unreachable (HTTP ${res.status}).`);
  } catch (err: any) {
    details.push(`GitHub API unreachable: ${err.message || String(err)}`);
  }

  if (isNative()) {
    try {
      const { AppInstaller } = await import('../apkDownloader');
      installerAvailable = typeof AppInstaller.installApk === 'function';
      packageInstallerAvailable = true;
      details.push('AppInstaller native plugin loaded.');
      
      const appInfo = await AppInstaller.getInstalledAppInfo();
      const expectedFingerprint = '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
      const cleanFingerprint = appInfo.signingSha256.replace(/:/g, '').toLowerCase();
      certificateValid = (cleanFingerprint === expectedFingerprint);
      if (certificateValid) {
        details.push('App signing certificate matches official production key.');
      } else {
        details.push(`Warning: App certificate mismatch! Current: ${cleanFingerprint}, Expected: ${expectedFingerprint}`);
      }
    } catch (err: any) {
      details.push(`Native installer check failed: ${err.message || String(err)}`);
    }
  } else {
    details.push('Running on Web platform. Native installer not required.');
    installerAvailable = true;
    packageInstallerAvailable = true;
    certificateValid = true;
  }

  const isHealthy = metadataReachable && githubReachable && installerAvailable && certificateValid;
  const status = isHealthy ? 'healthy' : (installerAvailable && certificateValid ? 'warning' : 'unhealthy');

  return {
    status,
    metadataReachable,
    githubReachable,
    firebaseReachable,
    installerAvailable,
    packageInstallerAvailable,
    certificateValid,
    details
  };
}

export async function getDiagnosticsReport(): Promise<string> {
  const health = await runUpdaterHealthCheck();
  let info: any = null;
  let dev: any = null;
  if (isNative()) {
    try {
      const { AppInstaller } = await import('../apkDownloader');
      info = await AppInstaller.getInstalledAppInfo();
      dev = await AppInstaller.getDeviceInfo();
    } catch {}
  }
  
  return `=== STUDIO UPDATER HEALTH & DIAGNOSTICS REPORT ===
Timestamp: ${new Date().toISOString()}
Current State: ${globalOtaState.updateState}
Update Available: ${globalOtaState.updateAvailable}
Remote Version: ${globalOtaState.remoteVersion}
Download Source: ${otaDebugLogs.currentDownloadSource || 'None'}
SHA Status: ${otaDebugLogs.shaVerification || 'N/A'}
Consecutive Failures: ${globalOtaState.consecutiveFailures}
Active Fallback: ${globalOtaState.activeFallback || 'None'}
Recovery Mode Active: ${globalOtaState.recoveryMode}

--- Platform Health ---
Overall Status: ${health.status.toUpperCase()}
Metadata Reachable: ${health.metadataReachable}
GitHub Reachable: ${health.githubReachable}
Firebase Reachable: ${health.firebaseReachable}
Installer Available: ${health.installerAvailable}
PackageInstaller Available: ${health.packageInstallerAvailable}
Signing Certificate Valid: ${health.certificateValid}

--- Device & Package Info ---
App Version: ${APP_VERSION}
Package Name: ${info?.packageName || 'com.chordex.app'}
Installed Version Code: ${info?.versionCode || 'N/A'}
Installed Sign SHA256: ${info?.signingSha256 || 'N/A'}
Android Version: ${dev?.androidVersion || 'N/A'}
Device Model: ${dev?.model || 'N/A'}
Storage Available: ${dev?.storageAvailable || 'N/A'}

--- Health Check Logs ---
${health.details.join('\n')}
==================================================`;
}

export function resetOtaDiagnostics() {
  // Reset all keys in otaDiagnostics
  Object.keys(otaDiagnostics).forEach(key => {
    (otaDiagnostics as any)[key] = null;
  });

  // Reset keys in otaDebugLogs
  Object.keys(otaDebugLogs).forEach(key => {
    if (key === 'appVersion') {
      otaDebugLogs.appVersion = APP_VERSION;
    } else if (key === 'apkEligibilityResult' || key === 'pluginMethodCheck' || key === 'finalUpdatePath') {
      (otaDebugLogs as any)[key] = 'N/A';
    } else if (key === 'registeredPlugins') {
      otaDebugLogs.registeredPlugins = '[]';
    } else if (key === 'otaBlockedBecauseApkRequired' || key === 'nativeApkBehind' || key === 'apkUpdateRequired' || key === 'staleOtaCleared' || key === 'capgoSetBlocked') {
      (otaDebugLogs as any)[key] = false;
    } else if (key === 'appInstallerAvailable' || key === 'downloadApkAvailable' || key === 'verifyApkSha256Available' || key === 'installApkAvailable' || key === 'openInstallPermissionSettingsAvailable') {
      (otaDebugLogs as any)[key] = false;
    } else if (key === 'recoveryAttemptsPerformed') {
      otaDebugLogs.recoveryAttemptsPerformed = [];
    } else {
      (otaDebugLogs as any)[key] = null;
    }
  });

  resetOtaTimeline();
}

export interface TimelineEvent {
  timestamp: string; // HH:MM:SS
  absoluteTimestamp: number;
  offset: string; // MM:SS.mmm
  offsetMs: number;
  module: string;
  event: string;
  state: string;
  reason: string;
  durationMs?: number;
}

export interface WorkflowTransition {
  timestamp: string; // HH:MM:SS
  absoluteTimestamp: number;
  previousState: string;
  nextState: string;
  caller: string;
  file: string;
  functionName: string;
  reason: string;
  thread: string;
  elapsedTimeMs: number;
}

export interface CloseEvent {
  timestamp: string;
  functionName: string;
  file: string;
  caller: string;
  reason: string;
  stackTrace: string;
  currentState: string;
  previousState: string;
  sessionId: string;
}

export interface UpToDateEvent {
  timestamp: string;
  functionName: string;
  file: string;
  caller: string;
  stackTrace: string;
  previousState: string;
  currentState: string;
  sessionId: string;
  reason: string;
  triggerType: 'AUTOMATIC' | 'USER ACTION';
}

export interface UpdateSession {
  id: string;
  sessionNumber: number;
  startTime: string; // ISO String
  startTimestamp: number;
  endTime: string | null;
  durationMs: number | null;
  result: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'IN_PROGRESS' | 'FINISHED' | 'ABORTED';
  version: string | null;
  buildType: string;
  deviceModel: string;
  androidVersion: string;
  timeline: TimelineEvent[];
  transitions: WorkflowTransition[];
  closeEvent: CloseEvent | null;
  upToDateEvent: UpToDateEvent | null;
}

export let updateSessions: UpdateSession[] = [];
export let activeSessionId: string | null = null;

// Initialize from storage on reload
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('studio:update_sessions_history');
    if (stored) {
      updateSessions = JSON.parse(stored);
    }
    const active = localStorage.getItem('studio:active_update_session_id');
    if (active) {
      activeSessionId = active;
    }
  }
} catch (_) {}

export const MAX_HISTORY_SIZE = 25;

export function saveSessions() {
  if (updateSessions.length > MAX_HISTORY_SIZE) {
    updateSessions = updateSessions.slice(-MAX_HISTORY_SIZE);
  }
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studio:update_sessions_history', JSON.stringify(updateSessions));
      if (activeSessionId) {
        localStorage.setItem('studio:active_update_session_id', activeSessionId);
      } else {
        localStorage.removeItem('studio:active_update_session_id');
      }
    }
  } catch (_) {}
}

export interface CallerInfo {
  file: string;
  functionName: string;
  callerLine: string;
  stackTrace: string;
}

export function parseStackTrace(error = new Error()): CallerInfo {
  const stack = error.stack || '';
  const lines = stack.split('\n');
  
  let functionName = 'unknown';
  let file = 'unknown';
  let callerLine = 'unknown';

  let callerIndex = 2;
  while (callerIndex < lines.length) {
    const line = lines[callerIndex];
    if (line && 
        !line.includes('parseStackTrace') && 
        !line.includes('logTimelineEvent') && 
        !line.includes('transitionToState') && 
        !line.includes('safeTransition') && 
        !line.includes('commitTransition') &&
        !line.includes('recordStateTransition') &&
        !line.includes('recordCloseEvent') &&
        !line.includes('recordUpToDatePopup')
    ) {
      break;
    }
    callerIndex++;
  }

  const targetLine = lines[callerIndex] || lines[2] || '';
  callerLine = targetLine.trim();

  try {
    const match = targetLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      functionName = match[1];
      const filePath = match[2];
      file = filePath.substring(filePath.lastIndexOf('/') + 1);
    } else {
      const matchNoFunc = targetLine.match(/at\s+(.+?):(\d+):(\d+)/);
      if (matchNoFunc) {
        const filePath = matchNoFunc[1];
        file = filePath.substring(filePath.lastIndexOf('/') + 1);
      }
    }
  } catch (_) {}

  return {
    file,
    functionName,
    callerLine,
    stackTrace: stack
  };
}

export function startUpdateSession(trigger = 'unknown', reason = 'unknown') {
  let devMode = false;
  try {
    const storeStr = localStorage.getItem('chord-explorer-storage-v3');
    if (storeStr) {
      const parsed = JSON.parse(storeStr);
      devMode = parsed.state?.settings?.developerMode ?? false;
    }
  } catch (_) {}

  if (!devMode) return;

  let nextNum = 1;
  try {
    const lastNumStr = localStorage.getItem('studio:diagnostics_last_session_number');
    if (lastNumStr) {
      nextNum = Number(lastNumStr) + 1;
    }
  } catch (_) {}
  try {
    localStorage.setItem('studio:diagnostics_last_session_number', String(nextNum));
  } catch (_) {}

  const sessionId = `Session #${nextNum}`;
  activeSessionId = sessionId;

  let model = 'Web Browser';
  let osVer = 'N/A';
  if (isNative()) {
    model = 'Android Device';
    osVer = 'Android OS';
  }

  const newSession: UpdateSession = {
    id: sessionId,
    sessionNumber: nextNum,
    startTime: new Date().toISOString(),
    startTimestamp: Date.now(),
    endTime: null,
    durationMs: null,
    result: 'IN_PROGRESS',
    version: globalOtaState.remoteVersion,
    buildType: isNative() ? 'Native Android' : 'Web',
    deviceModel: model,
    androidVersion: osVer,
    timeline: [],
    transitions: [],
    closeEvent: null,
    upToDateEvent: null
  };

  updateSessions.push(newSession);
  saveSessions();

  logTimelineEvent('Session', 'SESSION_STARTED', `Trigger: ${trigger} | Reason: ${reason}`);
}

export function logTimelineEvent(module: string, event: string, reason = '', durationMs?: number) {
  let devMode = false;
  try {
    const storeStr = localStorage.getItem('chord-explorer-storage-v3');
    if (storeStr) {
      const parsed = JSON.parse(storeStr);
      devMode = parsed.state?.settings?.developerMode ?? false;
    }
  } catch (_) {}
  if (!devMode) return;

  const now = Date.now();
  let offsetMs = 0;
  let startTimestamp = now;

  let session = updateSessions.find(s => s.id === activeSessionId);
  if (!session && updateSessions.length > 0) {
    session = updateSessions[updateSessions.length - 1];
  }
  
  if (session) {
    startTimestamp = session.startTimestamp;
    offsetMs = now - startTimestamp;
  }

  const formatTime = new Date(now).toTimeString().split(' ')[0];
  const min = Math.floor(offsetMs / 60000);
  const sec = Math.floor((offsetMs % 60000) / 1000);
  const ms = offsetMs % 1000;
  const formatOffset = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(ms).padStart(3, '0');

  const ev: TimelineEvent = {
    timestamp: formatTime,
    absoluteTimestamp: now,
    offset: formatOffset,
    offsetMs,
    module,
    event,
    state: globalOtaState.updateState,
    reason,
    durationMs
  };

  if (session) {
    session.timeline.push(ev);
    if (globalOtaState.remoteVersion) {
      session.version = globalOtaState.remoteVersion;
    }
    saveSessions();
  }

  console.log(`[OTA Diagnostics] [${formatOffset}] [${module}] ${event} (${globalOtaState.updateState}) - ${reason}`);
}

export function recordStateTransition(fromState: string, toState: string, reason: string) {
  let devMode = false;
  try {
    const storeStr = localStorage.getItem('chord-explorer-storage-v3');
    if (storeStr) {
      const parsed = JSON.parse(storeStr);
      devMode = parsed.state?.settings?.developerMode ?? false;
    }
  } catch (_) {}
  if (!devMode) return;

  const now = Date.now();
  let session = updateSessions.find(s => s.id === activeSessionId);
  if (!session && updateSessions.length > 0) {
    session = updateSessions[updateSessions.length - 1];
  }

  const caller = parseStackTrace();
  const elapsedTimeMs = session ? now - session.startTimestamp : 0;
  const formatTime = new Date(now).toTimeString().split(' ')[0];

  const trans: WorkflowTransition = {
    timestamp: formatTime,
    absoluteTimestamp: now,
    previousState: fromState,
    nextState: toState,
    caller: caller.callerLine,
    file: caller.file,
    functionName: caller.functionName,
    reason: reason,
    thread: 'JS Main Thread',
    elapsedTimeMs
  };

  if (session) {
    session.transitions.push(trans);
    
    if (toState === 'INSTALL_SUCCESS') {
      session.result = 'SUCCESS';
      session.endTime = new Date().toISOString();
      session.durationMs = now - session.startTimestamp;
    } else if (toState === 'NO_UPDATE_AVAILABLE') {
      session.result = 'FINISHED';
      session.endTime = new Date().toISOString();
      session.durationMs = now - session.startTimestamp;
    } else if (toState === 'INSTALL_FAILED') {
      session.result = reason.toLowerCase().includes('cancel') ? 'CANCELLED' : 'FAILED';
      session.endTime = new Date().toISOString();
      session.durationMs = now - session.startTimestamp;
    } else if (toState === 'IDLE' && ['INSTALLING', 'WAIT_PACKAGE_INSTALLER'].includes(fromState)) {
      session.result = 'ABORTED';
      session.endTime = new Date().toISOString();
      session.durationMs = now - session.startTimestamp;
    }

    saveSessions();
  }
}

export function recordCloseEvent(reason: string) {
  let devMode = false;
  try {
    const storeStr = localStorage.getItem('chord-explorer-storage-v3');
    if (storeStr) {
      const parsed = JSON.parse(storeStr);
      devMode = parsed.state?.settings?.developerMode ?? false;
    }
  } catch (_) {}
  if (!devMode) return;

  const now = Date.now();
  let session = updateSessions.find(s => s.id === activeSessionId);
  if (!session && updateSessions.length > 0) {
    session = updateSessions[updateSessions.length - 1];
  }

  const caller = parseStackTrace();
  const current = globalOtaState.updateState;
  
  let prev: string = current;
  if (session && session.transitions.length > 0) {
    prev = session.transitions[session.transitions.length - 1].previousState;
  }

  const closeEv: CloseEvent = {
    timestamp: new Date(now).toISOString(),
    functionName: caller.functionName,
    file: caller.file,
    caller: caller.callerLine,
    reason: reason,
    stackTrace: caller.stackTrace,
    currentState: current,
    previousState: prev,
    sessionId: session ? session.id : 'N/A'
  };

  if (session) {
    session.closeEvent = closeEv;
    session.timeline.push({
      timestamp: new Date(now).toTimeString().split(' ')[0],
      absoluteTimestamp: now,
      offset: formatOffsetTime(now - session.startTimestamp),
      offsetMs: now - session.startTimestamp,
      module: 'UI',
      event: 'UPDATER_CLOSED',
      state: current,
      reason: `Closed by ${caller.functionName} (${caller.file}) - Reason: ${reason}`
    });
    saveSessions();
  }
}

export function recordUpToDatePopup(reason: string, isAutomatic: boolean) {
  let devMode = false;
  try {
    const storeStr = localStorage.getItem('chord-explorer-storage-v3');
    if (storeStr) {
      const parsed = JSON.parse(storeStr);
      devMode = parsed.state?.settings?.developerMode ?? false;
    }
  } catch (_) {}
  if (!devMode) return;

  const now = Date.now();
  let session = updateSessions.find(s => s.id === activeSessionId);
  if (!session && updateSessions.length > 0) {
    session = updateSessions[updateSessions.length - 1];
  }

  const caller = parseStackTrace();
  const current = globalOtaState.updateState;
  let prev: string = current;
  if (session && session.transitions.length > 0) {
    prev = session.transitions[session.transitions.length - 1].previousState;
  }

  const upToDateEv: UpToDateEvent = {
    timestamp: new Date(now).toISOString(),
    functionName: caller.functionName,
    file: caller.file,
    caller: caller.callerLine,
    stackTrace: caller.stackTrace,
    previousState: prev,
    currentState: current,
    sessionId: session ? session.id : 'N/A',
    reason: reason,
    triggerType: isAutomatic ? 'AUTOMATIC' : 'USER ACTION'
  };

  if (session) {
    session.upToDateEvent = upToDateEv;
    session.timeline.push({
      timestamp: new Date(now).toTimeString().split(' ')[0],
      absoluteTimestamp: now,
      offset: formatOffsetTime(now - session.startTimestamp),
      offsetMs: now - session.startTimestamp,
      module: 'UI',
      event: 'UP_TO_DATE_POPUP_SHOWN',
      state: current,
      reason: `Shown via: ${isAutomatic ? 'AUTOMATIC' : 'USER ACTION'} (${caller.functionName} in ${caller.file}) - Reason: ${reason}`
    });
    saveSessions();
  }
}

function formatOffsetTime(offsetMs: number): string {
  const min = Math.floor(offsetMs / 60000);
  const sec = Math.floor((offsetMs % 60000) / 1000);
  const ms = offsetMs % 1000;
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(ms).padStart(3, '0');
}

export function deleteUpdateSession(id: string) {
  updateSessions = updateSessions.filter(s => s.id !== id);
  if (activeSessionId === id) {
    activeSessionId = null;
  }
  saveSessions();
}

export function deleteAllUpdateSessions() {
  updateSessions = [];
  activeSessionId = null;
  saveSessions();
}

export function getUpdateSessions(): UpdateSession[] {
  return updateSessions;
}

export function getActiveSession(): UpdateSession | null {
  return updateSessions.find(s => s.id === activeSessionId) || updateSessions[updateSessions.length - 1] || null;
}

export function exportSessionSubset(
  sessionSelector: 'current' | 'previous' | 'all' | string,
  subset: 'all' | 'workflow' | 'timeline' | 'native' | 'js',
  format: 'txt' | 'json' | 'md'
): string {
  let targets: UpdateSession[] = [];
  if (sessionSelector === 'current') {
    const s = updateSessions.find(x => x.id === activeSessionId) || updateSessions[updateSessions.length - 1];
    if (s) targets = [s];
  } else if (sessionSelector === 'previous') {
    if (updateSessions.length >= 2) {
      targets = [updateSessions[updateSessions.length - 2]];
    }
  } else if (sessionSelector === 'all') {
    targets = updateSessions;
  } else {
    const s = updateSessions.find(x => x.id === sessionSelector);
    if (s) targets = [s];
  }

  if (targets.length === 0) return 'No matching update sessions found.';

  const filtered = targets.map(session => {
    const sCopy = { ...session };
    
    if (subset === 'timeline') {
      sCopy.transitions = [];
      sCopy.closeEvent = null;
      sCopy.upToDateEvent = null;
    } else if (subset === 'workflow') {
      sCopy.timeline = [];
      sCopy.closeEvent = null;
      sCopy.upToDateEvent = null;
    } else if (subset === 'native') {
      sCopy.timeline = sCopy.timeline.filter(e => e.module === 'NativeInstaller' || e.module === 'RecoveryManager');
      sCopy.transitions = [];
    } else if (subset === 'js') {
      sCopy.timeline = sCopy.timeline.filter(e => e.module !== 'NativeInstaller' && e.module !== 'RecoveryManager');
    }
    
    return sCopy;
  });

  if (format === 'json') {
    return JSON.stringify(filtered.length === 1 ? filtered[0] : filtered, null, 2);
  }

  let output = '';
  filtered.forEach((session) => {
    const startIso = session.startTime;
    const durSec = session.durationMs !== null ? (session.durationMs / 1000).toFixed(2) + 's' : 'N/A';
    
    if (format === 'md') {
      output += `# Session: ${session.id}\n`;
      output += `- **Started**: ${startIso}\n`;
      output += `- **Finished**: ${session.endTime || 'N/A'}\n`;
      output += `- **Duration**: ${durSec}\n`;
      output += `- **Result**: ${session.result}\n`;
      output += `- **Target Version**: ${session.version || 'N/A'}\n`;
      output += `- **Platform**: ${session.buildType} \| Device: ${session.deviceModel} \| OS: ${session.androidVersion}\n\n`;

      if (subset !== 'workflow' && session.timeline.length > 0) {
        output += `### Timeline\n\n`;
        output += `| Timestamp | Offset | State | Module | Event | Reason |\n`;
        output += `|---|---|---|---|---|---|\n`;
        session.timeline.forEach(e => {
          output += `| ${e.timestamp} | ${e.offset} | ${e.state} | ${e.module} | ${e.event} | ${e.reason.replace(/\|/g, '\\|')} |\n`;
        });
        output += `\n`;
      }

      if (subset !== 'timeline' && session.transitions.length > 0) {
        output += `### Workflow Transitions\n\n`;
        output += `| Timestamp | Elapsed | Prev | Next | Function | File | Reason |\n`;
        output += `|---|---|---|---|---|---|---|\n`;
        session.transitions.forEach(t => {
          output += `| ${t.timestamp} | ${(t.elapsedTimeMs / 1000).toFixed(3)}s | ${t.previousState} | ${t.nextState} | ${t.functionName} | ${t.file} | ${t.reason.replace(/\|/g, '\\|')} |\n`;
        });
        output += `\n`;
      }

      if (session.closeEvent) {
        output += `### Close Event Details\n`;
        output += `- **Closed At**: ${session.closeEvent.timestamp}\n`;
        output += `- **By Function**: \`${session.closeEvent.functionName}\` in \`${session.closeEvent.file}\`\n`;
        output += `- **Reason**: ${session.closeEvent.reason}\n`;
        output += `- **Caller**: \`${session.closeEvent.caller}\`\n`;
        output += `- **State before close**: ${session.closeEvent.previousState} -> ${session.closeEvent.currentState}\n\n`;
      }

      if (session.upToDateEvent) {
        output += `### "Studio is up to date" Popup Event\n`;
        output += `- **Trigger Type**: ${session.upToDateEvent.triggerType}\n`;
        output += `- **Timestamp**: ${session.upToDateEvent.timestamp}\n`;
        output += `- **By Function**: \`${session.upToDateEvent.functionName}\` in \`${session.upToDateEvent.file}\`\n`;
        output += `- **Reason**: ${session.upToDateEvent.reason}\n`;
        output += `- **State**: ${session.upToDateEvent.previousState} -> ${session.upToDateEvent.currentState}\n\n`;
      }
      
      output += `---\n\n`;
    } else {
      output += `=========================================\n`;
      output += `SESSION: ${session.id}\n`;
      output += `=========================================\n`;
      output += `Started: ${startIso}\n`;
      output += `Finished: ${session.endTime || 'N/A'}\n`;
      output += `Duration: ${durSec}\n`;
      output += `Result: ${session.result}\n`;
      output += `Target Version: ${session.version || 'N/A'}\n`;
      output += `Platform: ${session.buildType}\n`;
      output += `Device: ${session.deviceModel}\n`;
      output += `OS Version: ${session.androidVersion}\n\n`;

      if (subset !== 'workflow' && session.timeline.length > 0) {
        output += `Timeline:\n`;
        session.timeline.forEach(e => {
          output += `${e.timestamp} [${e.offset}] [${e.module}] ${e.event} (${e.state}) - ${e.reason}\n`;
        });
        output += `\n`;
      }

      if (subset !== 'timeline' && session.transitions.length > 0) {
        output += `Workflow Transitions:\n`;
        session.transitions.forEach(t => {
          output += `${t.timestamp} [${(t.elapsedTimeMs / 1000).toFixed(3)}s] ${t.previousState} -> ${t.nextState} | Caller: ${t.functionName} (${t.file}) | Reason: ${t.reason}\n`;
        });
        output += `\n`;
      }

      if (session.closeEvent) {
        output += `Close Event Details:\n`;
        output += `  Timestamp: ${session.closeEvent.timestamp}\n`;
        output += `  Function: ${session.closeEvent.functionName} in ${session.closeEvent.file}\n`;
        output += `  Reason: ${session.closeEvent.reason}\n`;
        output += `  Caller: ${session.closeEvent.caller}\n`;
        output += `  State transition: ${session.closeEvent.previousState} -> ${session.closeEvent.currentState}\n\n`;
      }

      if (session.upToDateEvent) {
        output += `"Studio is up to date" Popup Event:\n`;
        output += `  Trigger Type: ${session.upToDateEvent.triggerType}\n`;
        output += `  Timestamp: ${session.upToDateEvent.timestamp}\n`;
        output += `  Function: ${session.upToDateEvent.functionName} in ${session.upToDateEvent.file}\n`;
        output += `  Reason: ${session.upToDateEvent.reason}\n`;
        output += `  State transition: ${session.upToDateEvent.previousState} -> ${session.upToDateEvent.currentState}\n\n`;
      }
      
      output += `\n\n`;
    }
  });

  return output;
}

export function interceptIllegalCall(functionName: string, reason: string) {
  const current = globalOtaState.updateState;
  const isInstalling = ['WAIT_PACKAGE_INSTALLER', 'INSTALLING'].includes(current);
  if (!isInstalling) return;

  const caller = parseStackTrace();
  const alertMsg = `ILLEGAL CALL DETECTED: ${functionName} called by ${caller.callerLine}. Reason: ${reason}`;
  console.error(`[OTA SECURITY] ${alertMsg}`);
  
  logTimelineEvent('SecurityGuard', 'ILLEGAL_CALL_DETECTED', alertMsg);
}

// Keep legacy interfaces for compatibility if needed
export let otaTimeline: TimelineEvent[] = [];
export function startDiagnosticsSession() {
  startUpdateSession('manual', 'Manual diagnostics session trigger');
}
export function resetOtaTimeline() {
  deleteAllUpdateSessions();
}
export function getTimelineReport(): string {
  const active = getActiveSession();
  if (!active || active.timeline.length === 0) return 'No events recorded.';
  return active.timeline
    .map(e => `[${e.offset}] [${e.module}] ${e.event} (State: ${e.state})${e.reason ? ` - ${e.reason}` : ''}${e.durationMs !== undefined ? ` [${e.durationMs}ms]` : ''}`)
    .join('\n');
}

