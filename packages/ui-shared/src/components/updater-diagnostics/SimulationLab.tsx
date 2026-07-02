import React, { useState } from 'react';
import { 
  updaterSimulation, 
  triggerSimulatedStatus, 
  resetOtaUpdateState, 
  isNative, 
  AppInstaller,
  checkForUpdate,
  globalOtaState,
  resetOtaDiagnostics,
  addJsLog
} from '@workspace/studio-core';
import { copyToClipboard } from './centralizedClipboard';

interface SimulationLabProps {
  showToast: (msg: string) => void;
  triggerRefresh: () => void;
  nativeDeviceInfo: any;
  nativeInstallerDetails: any;
  localApkDetails: any;
  nativeLogsList: any[];
}

export default function SimulationLab({
  showToast,
  triggerRefresh,
  nativeDeviceInfo,
  nativeInstallerDetails,
  localApkDetails,
  nativeLogsList
}: SimulationLabProps) {
  const [throttled, setThrottled] = useState(false);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [auditResults, setAuditResults] = useState<Array<{ name: string; status: 'success' | 'failed'; message: string }>>([]);

  const toggleThrottling = () => {
    const next = !throttled;
    setThrottled(next);
    updaterSimulation.simulateDownloadThrottling = next;
    showToast(next ? 'Network Throttling: ENABLED' : 'Network Throttling: DISABLED');
    triggerRefresh();
  };

  const simulateUpdateAvailable = async () => {
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.forceNoUpdate = false;
    updaterSimulation.forceDowngrade = false;
    await checkForUpdate(true, 'dev_tools', 'Simulation: Force Update Available');
    showToast('Simulating: Update Available');
    triggerRefresh();
  };

  const simulateFailure = () => {
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = true;
    updaterSimulation.forceUserCancel = false;
    updaterSimulation.forcePendingUserAction = false;
    triggerSimulatedStatus(1, 'STATUS_FAILURE');
    showToast('Simulating: Installation Failure');
    triggerRefresh();
  };

  const resetStateMachine = () => {
    resetOtaUpdateState();
    showToast('State machine reset to IDLE');
    triggerRefresh();
  };

  const clearSimulations = () => {
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
    updaterSimulation.simulateDownloadThrottling = false;
    setThrottled(false);
    showToast('Simulation overrides cleared');
    triggerRefresh();
  };

  const runAutomatedAudit = async () => {
    setAuditStatus('running');
    setAuditResults([]);
    addJsLog('=== STARTING AUTOMATED BUTTON AUDIT ===');
    
    const results: typeof auditResults = [];
    const addResult = (name: string, status: 'success' | 'failed', message: string) => {
      results.push({ name, status, message });
      setAuditResults([...results]);
      addJsLog(`[Audit] ${name}: ${status.toUpperCase()} - ${message}`);
    };

    const waitForCondition = async (predicate: () => boolean, timeoutMs = 1500) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (predicate()) return true;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return false;
    };

    const originalWriteText = navigator.clipboard.writeText;
    let lastWrittenClipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      lastWrittenClipboardText = text;
      return Promise.resolve();
    };

    try {
      resetOtaUpdateState();
      resetOtaDiagnostics();
      
      // Clean overridden properties
      updaterSimulation.forceUpdateAvailable = false;
      updaterSimulation.forceNoUpdate = false;
      updaterSimulation.forceDowngrade = false;
      updaterSimulation.forceMetadataFailure = false;

      // 1. Force Available Check
      updaterSimulation.forceUpdateAvailable = true;
      await checkForUpdate(true, 'dev_tools', 'Audit Check');
      if (await waitForCondition(() => globalOtaState.updateState === 'update_available')) {
        addResult('Force Update Available', 'success', 'State transitioned to update_available.');
      } else {
        addResult('Force Update Available', 'failed', `State remained: ${globalOtaState.updateState}`);
      }
      updaterSimulation.forceUpdateAvailable = false;

      // 2. Force No Update Check
      updaterSimulation.forceNoUpdate = true;
      await checkForUpdate(true, 'dev_tools', 'Audit Check');
      if (await waitForCondition(() => globalOtaState.updateState === 'idle')) {
        addResult('Force No Update', 'success', 'State transitioned to idle.');
      } else {
        addResult('Force No Update', 'failed', `State: ${globalOtaState.updateState}`);
      }
      updaterSimulation.forceNoUpdate = false;

      // 3. Simulated status change trigger
      triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');
      if (await waitForCondition(() => globalOtaState.updateState === 'pending_user_action' || globalOtaState.updateState === 'waiting_for_confirmation')) {
        addResult('Status Pending User Action', 'success', 'Simulated callback triggered successfully.');
      } else {
        addResult('Status Pending User Action', 'failed', `State: ${globalOtaState.updateState}`);
      }

      // 4. Test Clipboard writes
      try {
        await copyToClipboard('TEST_PAYLOAD', 'Audit Clipboard');
        if (lastWrittenClipboardText === 'TEST_PAYLOAD') {
          addResult('Clipboard Copy API', 'success', 'Text written to clipboard successfully.');
        } else {
          addResult('Clipboard Copy API', 'failed', 'Clipboard write succeeded, but content mismatch.');
        }
      } catch (err: any) {
        addResult('Clipboard Copy API', 'failed', err?.message || String(err));
      }

      const hasFailures = results.some(r => r.status === 'failed');
      setAuditStatus(hasFailures ? 'failed' : 'success');
      showToast(hasFailures ? 'QA Audit Failed!' : 'QA Audit Passed Successfully!');
    } catch (err: any) {
      setAuditStatus('failed');
      showToast(`Audit crashed: ${err.message || String(err)}`);
    } finally {
      navigator.clipboard.writeText = originalWriteText;
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Simulate Update Available */}
        <button 
          onClick={simulateUpdateAvailable}
          className="flex items-center justify-between bg-surface-container p-4 rounded-xl hover:bg-surface-bright transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98]"
        >
          <span className="text-sm font-semibold text-on-surface">Simulate Update Available</span>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        {/* Simulate Failure */}
        <button 
          onClick={simulateFailure}
          className="flex items-center justify-between bg-surface-container p-4 rounded-xl hover:bg-surface-bright transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98]"
        >
          <span className="text-sm font-semibold text-error">Simulate Failure</span>
          <span className="material-symbols-outlined text-error/50">warning</span>
        </button>

        {/* Toggle Network Throttling */}
        <button 
          onClick={toggleThrottling}
          className="flex items-center justify-between bg-surface-container p-4 rounded-xl hover:bg-surface-bright transition-all text-left outline-none border border-outline-variant/10 w-full active:scale-[0.98]"
        >
          <span className="text-sm font-semibold text-on-surface">Toggle Network Throttling</span>
          <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${
            throttled ? 'bg-tertiary' : 'bg-surface-container-highest'
          }`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
              throttled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </div>
        </button>

        {/* Reset State Machine */}
        <button 
          onClick={resetStateMachine}
          className="flex items-center justify-between bg-surface-container p-4 rounded-xl hover:bg-surface-bright transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98]"
        >
          <span className="text-sm font-semibold text-on-surface">Reset State Machine</span>
          <span className="material-symbols-outlined text-on-surface-variant">restart_alt</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
        <button 
          onClick={clearSimulations}
          className="flex-1 min-w-[120px] py-2.5 rounded-lg bg-tertiary text-on-tertiary font-bold text-xs hover:brightness-110 active:scale-95 transition-all outline-none"
        >
          Clear Overrides
        </button>

        {isNative() && (
          <button 
            onClick={() => AppInstaller.openUnknownAppSourcesSettings()}
            className="flex-1 min-w-[120px] py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/10 text-on-surface font-bold text-xs hover:bg-surface-bright active:scale-95 transition-all outline-none"
          >
            Unknown Apps Permission
          </button>
        )}
      </div>

      {/* Automated QA Functional Audit */}
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">QA Functional Audit</span>
          <button
            onClick={runAutomatedAudit}
            disabled={auditStatus === 'running'}
            className="px-3 py-1.5 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary font-bold text-xs hover:brightness-110 active:scale-95 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {auditStatus === 'running' ? 'Running Audit...' : 'Execute Audit'}
          </button>
        </div>

        {auditStatus !== 'idle' && (
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 font-mono text-[10px] max-h-32 overflow-y-auto space-y-1.5 mt-3">
            {auditResults.map((res, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-[#e7e5e4]">{res.name}</span>
                <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${
                  res.status === 'success' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {res.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
