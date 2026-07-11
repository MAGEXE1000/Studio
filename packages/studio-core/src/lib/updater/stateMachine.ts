export type OtaUpdateState =
  | 'INITIALIZING'
  | 'FETCH_REMOTE_METADATA'
  | 'VALIDATE_METADATA'
  | 'COMPARE_VERSION'
  | 'NO_UPDATE_AVAILABLE'
  | 'UPDATE_AVAILABLE'
  | 'FETCH_APK_INFORMATION'
  | 'DOWNLOAD_APK'
  | 'VERIFY_SHA256'
  | 'PREPARING_INSTALL'
  | 'WAITING_USER_CONFIRMATION'
  | 'PACKAGEINSTALLER_VISIBLE'
  | 'INSTALLING'
  | 'INSTALL_SUCCESS'
  | 'INSTALL_CANCELLED'
  | 'INSTALL_FAILED'
  | 'RECOVERY'
  | 'IDLE';

import { parseSemver, APP_VERSION, compareSemver } from '../appVersion';
import { releaseMetadataInspector } from './versionLogger';

export interface StructuredReleaseNotes {
  added?: string[];
  improved?: string[];
  fixed?: string[];
  changed?: string[];
}

export interface CentralizedOtaState {
  updateState: OtaUpdateState;
  loading: boolean;
  progress: number;
  error: string | null;
  statusText: string | null;
  remoteVersion: string | null;
  updateAvailable: boolean;
  mandatory: boolean;
  changelog: string | null;
  releaseNotes: string[] | StructuredReleaseNotes | null;
  packageName: string | null;
  apkUrl: string | null;
  apkSha256: string | null;
  manualApkUrl: string | null;
  fallbackApkUrl: string | null;
  downloadUrl: string | null;
  apkSizeBytes: number | null;
  decisionExplanation: string | null;
  // Recovery Mode fields
  consecutiveFailures: number;
  activeFallback: string | null;
  recoveryMode: boolean;
  // Version comparison fields
  updateType: 'ota' | 'apk' | 'both' | 'none';
  reinstallRequired: boolean;
  requiredVersionCode: number;
  apkUpdateRequired: boolean;
  validApkExists: boolean;
  sessionId: number | null;
}

export interface ActiveUpdateSession {
  sessionId: string;
  creationTimestamp: number;
  pipelineId: number | null;
  currentState: OtaUpdateState;
  previousState: OtaUpdateState | null;
  startedBy: string;
  progress: number;
  packageInstallerState: string | null;
  targetVersion: string | null;
  apkUrl: string | null;
  apkSha256: string | null;
  apkSizeBytes?: number | null;
  mandatory: boolean;
  updateType: 'ota' | 'apk' | 'both' | 'none';
  changelog: string | null;
  releaseNotes: string[] | StructuredReleaseNotes | null;
}

export function verifyAndCleanCaches() {
  try {
    if (typeof localStorage === 'undefined') return;
    
    console.log('[Cache Verification] Running verification check on all update caches...');

    // 1. Verify session cache
    const sessionStr = localStorage.getItem('studio:active_update_session');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        const ver = parsed?.targetVersion;
        const sem = ver ? parseSemver(ver) : null;
        if (!sem || ver === 'V' || ver === 'v') {
          console.warn('[Cache Verification] Invalidation: Corrupted session version detected:', ver);
          localStorage.removeItem('studio:active_update_session');
          releaseMetadataInspector.cacheSource = 'invalidated_session';
        } else if (compareSemver(APP_VERSION, ver) >= 0) {
          console.log(`[Cache Verification] Update to v${ver} already completed successfully (Current: v${APP_VERSION}). Clearing session.`);
          localStorage.removeItem('studio:active_update_session');
          localStorage.removeItem('studio:install_in_progress');
          localStorage.removeItem('studio:is_simulation_active');
          releaseMetadataInspector.cacheSource = 'completed_session';
        } else {
          releaseMetadataInspector.cacheSource = 'valid_session';
        }
      } catch (_) {
        localStorage.removeItem('studio:active_update_session');
      }
    }

    // 2. Verify downloaded APK version cache
    const downloadedVer = localStorage.getItem('studio:downloadedApkVersion');
    if (downloadedVer) {
      const sem = parseSemver(downloadedVer);
      if (!sem || downloadedVer === 'V' || downloadedVer === 'v') {
        console.warn('[Cache Verification] Invalidation: Corrupted downloaded APK version detected:', downloadedVer);
        localStorage.removeItem('studio:downloadedApkVersion');
        localStorage.removeItem('studio:downloadedApkPath');
        releaseMetadataInspector.cacheSource = (releaseMetadataInspector.cacheSource || '') + ' | invalidated_apk';
      } else {
        releaseMetadataInspector.cacheSource = (releaseMetadataInspector.cacheSource || '') + ' | valid_apk';
      }
    }

    // 3. Verify dismissedVersions cache
    const dismissed = localStorage.getItem('studio:dismissedVersions');
    if (dismissed) {
      try {
        const list = JSON.parse(dismissed);
        if (Array.isArray(list)) {
          const cleanList = list.filter(v => typeof v === 'string' && parseSemver(v) !== null && v !== 'V' && v !== 'v');
          if (cleanList.length !== list.length) {
            localStorage.setItem('studio:dismissedVersions', JSON.stringify(cleanList));
            console.warn('[Cache Verification] Cleaned invalid dismissedVersions list');
          }
        } else {
          localStorage.removeItem('studio:dismissedVersions');
        }
      } catch (_) {
        localStorage.removeItem('studio:dismissedVersions');
      }
    }

    // 4. Verify recovery versions
    const lastDismissedRecoveryVer = localStorage.getItem('studio:lastDismissedRecoveryVersion');
    if (lastDismissedRecoveryVer && (!parseSemver(lastDismissedRecoveryVer) || lastDismissedRecoveryVer === 'V' || lastDismissedRecoveryVer === 'v')) {
      console.warn('[Cache Verification] Invalidation: Corrupted recovery version:', lastDismissedRecoveryVer);
      localStorage.removeItem('studio:lastDismissedRecoveryVersion');
      localStorage.removeItem('studio:lastDismissedRecoveryTimestamp');
    }

    // 5. Verify later version
    const laterUpdateVer = localStorage.getItem('studio:laterUpdateVersion');
    if (laterUpdateVer && (!parseSemver(laterUpdateVer) || laterUpdateVer === 'V' || laterUpdateVer === 'v')) {
      console.warn('[Cache Verification] Invalidation: Corrupted laterUpdateVersion:', laterUpdateVer);
      localStorage.removeItem('studio:laterUpdateVersion');
    }
  } catch (e) {
    console.error('[Cache Verification] Error validating caches:', e);
  }
}

// Perform initial validation on stateMachine import
verifyAndCleanCaches();

export let activeUpdateSession: ActiveUpdateSession | null = null;

export function loadPersistedSession(): ActiveUpdateSession | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const sessionStr = localStorage.getItem('studio:active_update_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        const ver = parsed?.targetVersion;
        if (ver && compareSemver(APP_VERSION, ver) >= 0) {
          console.log(`[Session Recovery] Session target version v${ver} is already met by current version v${APP_VERSION}. Wiping.`);
          localStorage.removeItem('studio:active_update_session');
          localStorage.removeItem('studio:install_in_progress');
          activeUpdateSession = null;
          return null;
        }
        activeUpdateSession = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Session Recovery] Failed to load persisted session:', e);
  }
  return null;
}

function saveSession() {
  if (activeUpdateSession) {
    try {
      localStorage.setItem('studio:active_update_session', JSON.stringify(activeUpdateSession));
    } catch (_) {}
  }
}

/**
 * Tracks whether an installation just completed successfully.
 * Remains `true` from INSTALL_SUCCESS until the UI explicitly clears it
 * (or a 60-second safety timeout fires), preventing any automatic update
 * check from running and transitioning to "Studio is up to date" before
 * the installation completion screen has been seen by the user.
 */
let installationJustCompleted = false;
let installationJustCompletedTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Marks the installation as just completed. Called automatically when
 * transitioning to INSTALL_SUCCESS. Starts a 60-second safety timeout
 * to auto-clear in case the UI never calls clearInstallationJustCompleted().
 */
function setInstallationJustCompleted() {
  installationJustCompleted = true;
  if (installationJustCompletedTimer) {
    clearTimeout(installationJustCompletedTimer);
  }
  installationJustCompletedTimer = setTimeout(() => {
    console.log('[InstallationLock] Safety timeout (60s) reached — clearing installationJustCompleted flag.');
    installationJustCompleted = false;
    installationJustCompletedTimer = null;
  }, 60000);
  console.log('[InstallationLock] installationJustCompleted set to TRUE. No automatic update checks until cleared.');
}

/**
 * Clears the post-installation lock. Must be called by the UI when
 * the user dismisses the INSTALL_SUCCESS screen, or when the app
 * restarts into the new version and the changelog screen is shown.
 */
export function clearInstallationJustCompleted() {
  if (installationJustCompleted) {
    console.log('[InstallationLock] installationJustCompleted cleared by UI/caller.');
  }
  installationJustCompleted = false;
  if (installationJustCompletedTimer) {
    clearTimeout(installationJustCompletedTimer);
    installationJustCompletedTimer = null;
  }
}

// ─── Post-Install Session ─────────────────────────────────────────────────
// A lifecycle-synchronized session that stays active after INSTALL_SUCCESS
// until the Android process is genuinely replaced or the user explicitly
// dismisses. This is the authoritative lock that prevents ALL automatic
// update checks, lifecycle triggers, and state resets in the zombie
// process window after APK installation.

/**
 * Process boot marker. Set to a unique value on each cold start via
 * sessionStorage (which is cleared when the process dies). If this value
 * differs from the value stored when the post-install session was created,
 * the current process is a NEW process (the APK install completed and
 * Android relaunched the app).
 */
const PROCESS_BOOT_ID = (() => {
  const key = 'studio:processBootId';
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `boot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `boot_${Date.now()}_fallback`;
  }
})();

let postInstallSessionActive = false;
let postInstallSessionBootId: string | null = null;
let postInstallSessionTimestamp: number | null = null;
let postInstallSessionTimer: ReturnType<typeof setTimeout> | null = null;
const POST_INSTALL_SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes safety

/**
 * Activates the post-install session. Called on INSTALL_SUCCESS.
 * The session blocks ALL automatic update checks until one of:
 * 1. A cold start is detected (new PROCESS_BOOT_ID)
 * 2. The user explicitly calls endPostInstallSession() via Done button
 * 3. A 5-minute safety timeout expires
 */
function activatePostInstallSession() {
  postInstallSessionActive = true;
  postInstallSessionBootId = PROCESS_BOOT_ID;
  postInstallSessionTimestamp = Date.now();
  if (postInstallSessionTimer) clearTimeout(postInstallSessionTimer);
  postInstallSessionTimer = setTimeout(() => {
    console.log('[PostInstallSession] Safety timeout (5min) reached — ending post-install session.');
    postInstallSessionActive = false;
    postInstallSessionBootId = null;
    postInstallSessionTimestamp = null;
    postInstallSessionTimer = null;
  }, POST_INSTALL_SESSION_TIMEOUT_MS);
  console.log(`[PostInstallSession] ACTIVATED. bootId=${PROCESS_BOOT_ID}. All automatic checks blocked until session ends.`);
}

/**
 * Returns true if a post-install session is active AND we are still in the
 * same process that started it. If the process has been replaced (different
 * PROCESS_BOOT_ID), the session is automatically cleared.
 */
export function isPostInstallSessionActive(): boolean {
  if (!postInstallSessionActive) return false;
  // Cold start detection: if the current process boot ID differs from the
  // one that activated the session, the process was replaced by Android.
  if (postInstallSessionBootId !== null && postInstallSessionBootId !== PROCESS_BOOT_ID) {
    console.log(`[PostInstallSession] Cold start detected — bootId changed from ${postInstallSessionBootId} to ${PROCESS_BOOT_ID}. Ending session.`);
    endPostInstallSessionInternal('cold_start_detected');
    return false;
  }
  return true;
}

/**
 * Ends the post-install session. Called explicitly by the user (Done button)
 * or by cold start detection.
 */
export function endPostInstallSession(reason: string) {
  endPostInstallSessionInternal(reason);
}

function endPostInstallSessionInternal(reason: string) {
  if (postInstallSessionActive) {
    const duration = postInstallSessionTimestamp ? Date.now() - postInstallSessionTimestamp : 0;
    console.log(`[PostInstallSession] ENDED. Reason: ${reason}. Duration: ${duration}ms. bootId=${postInstallSessionBootId}`);
  }
  postInstallSessionActive = false;
  postInstallSessionBootId = null;
  postInstallSessionTimestamp = null;
  if (postInstallSessionTimer) {
    clearTimeout(postInstallSessionTimer);
    postInstallSessionTimer = null;
  }
}

/** Returns instrumentation data for the post-install session. */
export function getPostInstallSessionInfo(): {
  active: boolean;
  bootId: string;
  sessionBootId: string | null;
  timestamp: number | null;
  elapsed: number | null;
} {
  return {
    active: postInstallSessionActive,
    bootId: PROCESS_BOOT_ID,
    sessionBootId: postInstallSessionBootId,
    timestamp: postInstallSessionTimestamp,
    elapsed: postInstallSessionTimestamp ? Date.now() - postInstallSessionTimestamp : null,
  };
}

/**
 * Returns true if any form of installation is currently active or
 * just completed and the UI has not yet acknowledged it.
 *
 * This is a superset of isUpdateSessionActive() — it covers:
 * - An in-progress session (download, verify, install stages)
 * - The post-success window where the session has been cleared but
 *   the user has not yet seen the completion screen
 *
 * Use this as the authoritative guard for blocking automatic update
 * checks, StartupCoordinator lifecycle triggers, and startup recovery.
 */
export function isInstallationLocked(): boolean {
  if (activeUpdateSession !== null) return true;
  if (installationJustCompleted) return true;
  if (isPostInstallSessionActive()) return true;
  const lockedStates: OtaUpdateState[] = [
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARING_INSTALL',
    'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE',
    'INSTALLING',
    'INSTALL_SUCCESS',
  ];
  return lockedStates.includes(globalOtaState.updateState);
}

export function isUpdateSessionActive(): boolean {
  return isInstallationLocked();
}

export function startUpdateSession(startedBy: string, trigger: string) {
  if (activeUpdateSession) {
    if (startedBy === 'manual' && activeUpdateSession.startedBy.startsWith('automatic')) {
      activeUpdateSession.startedBy = `manual (${trigger})`;
      saveSession();
    }
    console.log(`[UpdateSession] Reusing active session: ${activeUpdateSession.sessionId}`);
    return activeUpdateSession;
  }
  
  const sId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  activeUpdateSession = {
    sessionId: sId,
    creationTimestamp: Date.now(),
    pipelineId: activePipelineContext?.checkId ?? null,
    currentState: 'INITIALIZING',
    previousState: null,
    startedBy: `${startedBy} (${trigger})`,
    progress: 0,
    packageInstallerState: null,
    targetVersion: globalOtaState.remoteVersion,
    apkUrl: globalOtaState.apkUrl,
    apkSha256: globalOtaState.apkSha256,
    apkSizeBytes: globalOtaState.apkSizeBytes,
    mandatory: globalOtaState.mandatory,
    updateType: globalOtaState.updateType,
    changelog: globalOtaState.changelog,
    releaseNotes: globalOtaState.releaseNotes,
  };
  
  saveSession();
  console.log(`[UpdateSession] Created new session: ${sId}`);
  return activeUpdateSession;
}

const getInitialState = (): OtaUpdateState => {
  try {
    if (typeof localStorage !== 'undefined') {
      const session = loadPersistedSession();
      if (session) {
        return session.currentState;
      }
    }
  } catch (_) {}
  return 'IDLE';
};

const getInitialRemoteVersion = (): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      const session = loadPersistedSession();
      if (session) {
        return session.targetVersion;
      }
      return localStorage.getItem('studio:downloadedApkVersion');
    }
  } catch (_) {}
  return null;
};

const initialUpdateState = getInitialState();

const savedSession = loadPersistedSession();

export let globalOtaState: CentralizedOtaState = {
  updateState: initialUpdateState,
  loading: false,
  progress: savedSession ? savedSession.progress : 0,
  error: null,
  statusText: initialUpdateState === 'INSTALLING' ? 'Installing update...' : null,
  remoteVersion: getInitialRemoteVersion(),
  updateAvailable: savedSession !== null,
  mandatory: savedSession ? savedSession.mandatory : false,
  changelog: savedSession ? savedSession.changelog : null,
  releaseNotes: savedSession ? savedSession.releaseNotes : null,
  packageName: null,
  apkUrl: savedSession ? savedSession.apkUrl : null,
  apkSha256: savedSession ? savedSession.apkSha256 : null,
  apkSizeBytes: savedSession ? (savedSession.apkSizeBytes ?? null) : null,
  manualApkUrl: null,
  fallbackApkUrl: null,
  downloadUrl: null,
  decisionExplanation: null,
  consecutiveFailures: 0,
  activeFallback: null,
  recoveryMode: false,
  updateType: savedSession ? savedSession.updateType : 'none',
  reinstallRequired: false,
  requiredVersionCode: 0,
  apkUpdateRequired: false,
  validApkExists: savedSession !== null,
  sessionId: null,
};

export const stateListeners = new Set<(state: CentralizedOtaState) => void>();

/**
 * Maximum consecutive recovery failures before the updater gives up
 * and transitions to IDLE instead of RECOVERY.
 */
export const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * Update non-state fields of the global OTA state.
 *
 * IMPORTANT: This function intentionally strips `updateState` from the patch.
 * All state transitions MUST go through `transitionToState()` to ensure
 * transition validation, watchdog management, and history recording.
 */
export function updateGlobalState(patch: Partial<CentralizedOtaState>) {
  if (patch.progress !== undefined && globalOtaState.updateState === 'DOWNLOAD_APK') {
    const prevPct = Math.round(globalOtaState.progress * 10);
    const currPct = Math.round(patch.progress * 10);
    if (prevPct !== currPct) {
      if (typeof (window as any).logDiagnosticEvent === 'function') {
        (window as any).logDiagnosticEvent('DOWNLOAD_PROGRESS', { progress: patch.progress });
      }
    }
  }

  // Strip updateState — only transitionToState may change it
  if ('updateState' in patch) {
    const { updateState: _stripped, ...safePatch } = patch;
    if (Object.keys(safePatch).length === 0) return;
    globalOtaState = { ...globalOtaState, ...safePatch };
  } else {
    globalOtaState = { ...globalOtaState, ...patch };
  }
  stateListeners.forEach((l) => l(globalOtaState));
}

let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

export function stopWatchdog() {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

import { addJsLog, transitionHistory, rejectedTransitions } from './updaterSimulation';
import { recordStateTransition } from './diagnostics';

/**
 * Transition lock prevents recursive or concurrent transitions.
 * While a transition is being committed, no other transition can start.
 */
let transitionLock = false;

/**
 * Active pipeline context — set by the orchestration layer to enrich
 * transition history with diagnostic metadata.
 */
export let activePipelineContext: {
  checkId: number;
  trigger: string;
  pipelineStartTime: number;
} | null = null;

export function setActivePipelineContext(ctx: typeof activePipelineContext) {
  activePipelineContext = ctx;
}

export function transitionToState(state: OtaUpdateState, reason: string, failureReason?: string) {
  // Never allow transitioning to INSTALL_FAILED from IDLE or INSTALL_SUCCESS
  if (state === 'INSTALL_FAILED') {
    const current = globalOtaState.updateState;
    if (current === 'IDLE' || current === 'INSTALL_SUCCESS') {
      console.warn(`[UPDATE STATE WARNING] Blocking invalid transition: ${current} -> INSTALL_FAILED (Reason: ${reason})`);
      return;
    }
  }

  // Prevent recursive transitions
  if (transitionLock) {
    console.warn(`[UPDATE STATE WARNING] Recursive transition blocked: attempted ${globalOtaState.updateState} -> ${state} (Reason: ${reason}) while another transition is committing.`);
    rejectedTransitions.push({
      from: globalOtaState.updateState,
      attempted: state,
      reason: `RECURSIVE_BLOCKED: ${reason}`,
      timestamp: Date.now()
    });
    return;
  }

  transitionLock = true;
  try {
    commitTransition(state, reason, failureReason);
  } finally {
    transitionLock = false;
  }
}

function commitTransition(state: OtaUpdateState, reason: string, failureReason?: string) {
  const current = globalOtaState.updateState;
  addJsLog(`Transition Trigger: ${current} -> ${state}. Reason: ${reason}`);
  recordStateTransition(current, state, reason);
  stopWatchdog();

  const now = Date.now();
  let isValid = false;

  // Strict transition validation matrix
  if (current === state) {
    isValid = true; // self-transitions allowed for progress/status updates
  } else if (state === 'IDLE' || state === 'RECOVERY') {
    isValid = true; // safe resets always allowed from any state
  } else {
    switch (current) {
      case 'IDLE':
        isValid = state === 'INITIALIZING';
        break;
      case 'INITIALIZING':
        isValid = ['FETCH_REMOTE_METADATA', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'FETCH_REMOTE_METADATA':
        isValid = ['VALIDATE_METADATA', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'VALIDATE_METADATA':
        isValid = ['COMPARE_VERSION', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'COMPARE_VERSION':
        isValid = ['NO_UPDATE_AVAILABLE', 'UPDATE_AVAILABLE', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'NO_UPDATE_AVAILABLE':
        isValid = ['IDLE', 'INITIALIZING'].includes(state);
        break;
      case 'UPDATE_AVAILABLE':
        isValid = ['FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'FETCH_APK_INFORMATION':
        isValid = ['DOWNLOAD_APK', 'VERIFY_SHA256', 'PREPARING_INSTALL', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'DOWNLOAD_APK':
        isValid = ['VERIFY_SHA256', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'VERIFY_SHA256':
        isValid = ['PREPARING_INSTALL', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'PREPARING_INSTALL':
        isValid = ['WAITING_USER_CONFIRMATION', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'WAITING_USER_CONFIRMATION':
        isValid = ['PACKAGEINSTALLER_VISIBLE', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'PACKAGEINSTALLER_VISIBLE':
        isValid = ['INSTALLING', 'INSTALL_CANCELLED', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'INSTALLING':
        isValid = ['INSTALL_SUCCESS', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'INSTALL_CANCELLED':
        isValid = ['RECOVERY', 'IDLE'].includes(state);
        break;
      case 'INSTALL_SUCCESS':
        isValid = ['IDLE', 'INITIALIZING'].includes(state);
        break;
      case 'INSTALL_FAILED':
        isValid = ['RECOVERY', 'IDLE'].includes(state);
        break;
      case 'RECOVERY':
        isValid = ['INITIALIZING', 'FETCH_REMOTE_METADATA', 'DOWNLOAD_APK', 'WAITING_USER_CONFIRMATION', 'IDLE'].includes(state);
        break;
      default:
        isValid = false;
    }
  }

  const downloadInstallStates = [
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARING_INSTALL',
    'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE',
    'INSTALLING'
  ];
  const checkInitStates = [
    'INITIALIZING',
    'CHECKING',
    'FETCH_REMOTE_METADATA',
    'VALIDATE_METADATA',
    'COMPARE_VERSION',
    'NO_UPDATE_AVAILABLE'
  ];

  if (!isValid) {
    if (downloadInstallStates.includes(current) && checkInitStates.includes(state)) {
      console.error(`[HIGH SEVERITY UPDATE STATE BLOCK] Illegal transition blocked: ${current} -> ${state} (Reason: ${reason}). Keeping current state.`);
      rejectedTransitions.push({
        from: current,
        attempted: state,
        reason: `ILLEGAL_INSTALL_TO_CHECK: ${reason}`,
        timestamp: now
      });
      state = current;
    } else {
      console.warn(`[UPDATE STATE WARNING] Invalid transition: ${current} -> ${state} (Reason: ${reason}). Resetting to IDLE.`);
      rejectedTransitions.push({
        from: current,
        attempted: state,
        reason: reason,
        timestamp: now
      });
      state = 'IDLE';
    }
  }

  let caller = 'Unknown';
  let stackTrace = 'N/A';
  try {
    const stack = new Error().stack;
    if (stack) {
      stackTrace = stack;
      const lines = stack.split('\n');
      if (lines.length > 2) {
        caller = lines[2].trim();
      }
    }
  } catch {
    /* ignore */
  }

  if (typeof window !== 'undefined') {
    (window as any).__lastOtaTransition = `${current} -> ${state} (${reason})`;
  }
  console.log(`[INSTRUMENTATION] [JS_STATE] Transition: ${current} -> ${state} | Reason: ${reason} | Caller: ${caller} | Thread: Main JS Thread`);

  // Calculate duration of previous state
  const prevEntry = transitionHistory[transitionHistory.length - 1];
  if (prevEntry) {
    prevEntry.durationMs = now - prevEntry.timestamp;
  }

  transitionHistory.push({
    from: current,
    to: state,
    reason: reason,
    timestamp: now,
    durationMs: 0,
    invalid: !isValid,
    caller: caller,
    stackTrace: stackTrace,
    thread: 'Main JS Thread',
    checkId: activePipelineContext?.checkId ?? null,
    trigger: activePipelineContext?.trigger ?? null,
    elapsedMs: activePipelineContext ? now - activePipelineContext.pipelineStartTime : null,
  });

  // Setup watchdog timers for transient states
  if (state === 'INITIALIZING' || state === 'FETCH_REMOTE_METADATA' || state === 'VALIDATE_METADATA') {
    watchdogTimer = setTimeout(() => {
      if (globalOtaState.updateState === state) {
        handleWatchdogTimeout(`App Update initialization/fetch timed out (15s) at state ${state}.`);
      }
    }, 15000);
  } else if (state === 'DOWNLOAD_APK') {
    resetDownloadWatchdog();
  } else if (['VERIFY_SHA256', 'PREPARING_INSTALL'].includes(state)) {
    watchdogTimer = setTimeout(() => {
      if (globalOtaState.updateState === state) {
        handleWatchdogTimeout(`Update package verification timed out (20s) at state ${state}.`);
      }
    }, 20000);
  } else if (state === 'INSTALLING') {
    watchdogTimer = setTimeout(async () => {
      if (globalOtaState.updateState === 'INSTALLING') {
        try {
          const { AppInstaller } = await import('../apkDownloader');
          const check = await AppInstaller.isInstallActive();
          if (check.active) {
            console.log('[Watchdog] PackageInstaller session is still active. Extending watchdog timer...');
            watchdogTimer = setTimeout(() => {
              if (globalOtaState.updateState === 'INSTALLING') {
                handleWatchdogTimeout('PackageInstaller installation confirmation timed out (120s).');
              }
            }, 120000);
            return;
          }
        } catch (err) {
          console.warn('[Watchdog] Failed to check active installer session during timeout check:', err);
        }
        handleWatchdogTimeout('PackageInstaller installation confirmation timed out (120s).');
      }
    }, 120000);
  }

  // Update active session details
  if (activeUpdateSession) {
    activeUpdateSession.previousState = current;
    activeUpdateSession.currentState = state;
    if (['INSTALL_SUCCESS', 'INSTALL_FAILED', 'INSTALL_CANCELLED', 'RECOVERY', 'IDLE'].includes(state)) {
      console.log(`[UpdateSession] Ending update session: ${activeUpdateSession.sessionId}`);
      activeUpdateSession = null;
      try {
        localStorage.removeItem('studio:active_update_session');
      } catch (_) {}
    } else {
      saveSession();
    }
  }

  // Set the post-install lock when transitioning to INSTALL_SUCCESS.
  // This prevents automatic update checks from firing and showing
  // "Studio is up to date" before the completion screen is acknowledged.
  if (state === 'INSTALL_SUCCESS') {
    setInstallationJustCompleted();
    activatePostInstallSession();
    try {
      if (globalOtaState.releaseNotes) {
        localStorage.setItem('studio:last_installed_release_notes', JSON.stringify(globalOtaState.releaseNotes));
      }
    } catch (_) {}
  }

  // Clear the post-install lock when transitioning to terminal/reset states
  // that are NOT INSTALL_SUCCESS (failures, cancellations, or IDLE resets).
  // IMPORTANT: When transitioning INSTALL_SUCCESS → IDLE, we intentionally
  // KEEP the installationJustCompleted flag. On Android, the old app process
  // may still be alive after APK installation — the flag prevents automatic
  // checkForUpdate from running in this zombie window and showing
  // "Studio is up to date" prematurely. The flag auto-clears via its
  // 60-second safety timer, or on the next cold start.
  if (['INSTALL_FAILED', 'INSTALL_CANCELLED'].includes(state)) {
    clearInstallationJustCompleted();
  } else if (state === 'IDLE' && current !== 'INSTALL_SUCCESS') {
    clearInstallationJustCompleted();
  }

  // Apply the state change — this is the ONLY place updateState is written
  globalOtaState = {
    ...globalOtaState,
    updateState: state,
    loading: ['INITIALIZING', 'FETCH_REMOTE_METADATA', 'VALIDATE_METADATA', 'COMPARE_VERSION', 'FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'VERIFY_SHA256', 'PREPARING_INSTALL', 'INSTALLING'].includes(state),
    error: ['INSTALL_FAILED', 'RECOVERY'].includes(state)
      ? (failureReason || globalOtaState.error)
      : (state === 'IDLE'
          ? (failureReason || null)
          : (failureReason || globalOtaState.error)),
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const isActive = ['DOWNLOAD_APK', 'VERIFY_SHA256', 'PREPARING_INSTALL', 'WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'].includes(state);
      if (isActive) {
        localStorage.setItem('studio:install_in_progress', 'true');
      } else if (['INSTALL_SUCCESS', 'INSTALL_FAILED', 'INSTALL_CANCELLED', 'RECOVERY', 'IDLE'].includes(state)) {
        localStorage.removeItem('studio:install_in_progress');
      }
    }
  } catch (_) {}

  stateListeners.forEach((l) => l(globalOtaState));
}

export function resetDownloadWatchdog() {
  stopWatchdog();
  if (globalOtaState.updateState === 'DOWNLOAD_APK') {
    watchdogTimer = setTimeout(() => {
      if (globalOtaState.updateState === 'DOWNLOAD_APK') {
        handleWatchdogTimeout('Download stalled. No progress received for 30 seconds.');
      }
    }, 30000);
  }
}

export function handleWatchdogTimeout(errorMsg: string) {
  console.warn(`[Watchdog Timeout] ${errorMsg}. Resetting to RECOVERY.`);
  stopWatchdog();

  const newFailureCount = globalOtaState.consecutiveFailures + 1;

  // Bound recovery loops: after MAX_CONSECUTIVE_FAILURES, stop retrying
  if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
    console.warn(`[Watchdog] Maximum consecutive failures reached (${MAX_CONSECUTIVE_FAILURES}). Giving up.`);
    updateGlobalState({
      error: `${errorMsg} Maximum recovery attempts (${MAX_CONSECUTIVE_FAILURES}) reached.`,
      consecutiveFailures: newFailureCount,
      recoveryMode: false,
    });
    transitionToState('IDLE', 'Maximum recovery attempts reached', errorMsg);
    return;
  }

  updateGlobalState({
    error: errorMsg,
    consecutiveFailures: newFailureCount,
    recoveryMode: true
  });
  transitionToState('RECOVERY', 'Watchdog timeout', errorMsg);
}
