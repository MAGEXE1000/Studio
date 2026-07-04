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
  | 'PREPARE_INSTALL'
  | 'WAIT_PACKAGE_INSTALLER'
  | 'INSTALLING'
  | 'INSTALL_SUCCESS'
  | 'INSTALL_FAILED'
  | 'RECOVERY'
  | 'IDLE';

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

export let globalOtaState: CentralizedOtaState = {
  updateState: 'IDLE',
  loading: false,
  progress: 0,
  error: null,
  statusText: null,
  remoteVersion: null,
  updateAvailable: false,
  mandatory: false,
  changelog: null,
  releaseNotes: null,
  packageName: null,
  apkUrl: null,
  apkSha256: null,
  manualApkUrl: null,
  fallbackApkUrl: null,
  downloadUrl: null,
  decisionExplanation: null,
  consecutiveFailures: 0,
  activeFallback: null,
  recoveryMode: false,
  updateType: 'none',
  reinstallRequired: false,
  requiredVersionCode: 0,
  apkUpdateRequired: false,
  validApkExists: false,
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

import { recordStateTransition, addJsLog, transitionHistory, rejectedTransitions } from './updaterSimulation';

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
  recordStateTransition(state, reason);
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
        isValid = ['DOWNLOAD_APK', 'PREPARE_INSTALL', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'DOWNLOAD_APK':
        isValid = ['VERIFY_SHA256', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'VERIFY_SHA256':
        isValid = ['PREPARE_INSTALL', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'PREPARE_INSTALL':
        isValid = ['WAIT_PACKAGE_INSTALLER', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'WAIT_PACKAGE_INSTALLER':
        isValid = ['INSTALLING', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'INSTALLING':
        isValid = ['INSTALL_SUCCESS', 'INSTALL_FAILED', 'RECOVERY', 'IDLE'].includes(state);
        break;
      case 'INSTALL_SUCCESS':
        isValid = ['IDLE', 'INITIALIZING'].includes(state);
        break;
      case 'INSTALL_FAILED':
        isValid = ['RECOVERY', 'IDLE'].includes(state);
        break;
      case 'RECOVERY':
        isValid = ['INITIALIZING', 'FETCH_REMOTE_METADATA', 'DOWNLOAD_APK', 'WAIT_PACKAGE_INSTALLER', 'IDLE'].includes(state);
        break;
      default:
        isValid = false;
    }
  }

  if (!isValid) {
    console.warn(`[UPDATE STATE WARNING] Invalid transition: ${current} -> ${state} (Reason: ${reason}). Resetting to IDLE.`);
    rejectedTransitions.push({
      from: current,
      attempted: state,
      reason: reason,
      timestamp: now
    });
    state = 'IDLE';
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
  } else if (['VERIFY_SHA256', 'PREPARE_INSTALL'].includes(state)) {
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

  // Apply the state change — this is the ONLY place updateState is written
  globalOtaState = {
    ...globalOtaState,
    updateState: state,
    loading: ['INITIALIZING', 'FETCH_REMOTE_METADATA', 'VALIDATE_METADATA', 'COMPARE_VERSION', 'FETCH_APK_INFORMATION', 'DOWNLOAD_APK', 'VERIFY_SHA256', 'PREPARE_INSTALL', 'INSTALLING'].includes(state),
    error: ['INSTALL_FAILED', 'RECOVERY'].includes(state)
      ? (failureReason || globalOtaState.error)
      : (state === 'IDLE'
          ? (failureReason || null)
          : (failureReason || globalOtaState.error)),
  };
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
