/**
 * updater/telemetry.ts
 *
 * Structured diagnostic + instrumentation logging for the OTA updater.
 * Exports: logDiagnosticEvent, logDetailedJsTrace
 */

import { useNavigationStore } from '../../store/useNavigationStore';
import { useChordStore } from '../../store/useChordStore';
import { addJsLog } from './updaterSimulation';
import { logProgressStage } from './diagnostics';
import { globalOtaState } from './stateMachine';

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
