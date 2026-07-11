import React, { useState, useEffect } from 'react';
import { 
  updaterSimulation, 
  triggerSimulatedStatus, 
  resetOtaUpdateState, 
  isNative, 
  AppInstaller,
  checkForUpdate,
  applyUpdate,
  globalOtaState,
  stateListeners,
  activeUpdateSession,
  transitionHistory,
  clearSimulationLogs,
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
  const [simActive, setSimActive] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true';
  });

  // Subscribe to state machine listeners to update UI live during simulation
  const [otaState, setOtaState] = useState(globalOtaState);
  useEffect(() => {
    const listener = (newState: any) => {
      setOtaState(newState);
      setSimActive(typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true');
      triggerRefresh();

      // Auto-progress simulation workflow if runWorkflowActive is true
      if (updaterSimulation.runWorkflowActive && newState.updateState === 'UPDATE_AVAILABLE') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalOtaState.updateState === 'UPDATE_AVAILABLE') {
            addJsLog('[Simulate Workflow] Auto-triggering applyUpdate...');
            applyUpdate('Simulation: Run Workflow').catch((e) => {
              console.error('Simulated applyUpdate failed:', e);
            });
          }
        }, 1500);
      }
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, [triggerRefresh]);

  const toggleThrottling = () => {
    const next = !throttled;
    setThrottled(next);
    updaterSimulation.simulateDownloadThrottling = next;
    showToast(next ? 'Network Throttling: ENABLED' : 'Network Throttling: DISABLED');
    triggerRefresh();
  };

  const startSimulation = () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    resetOtaUpdateState();
    showToast('Workflow simulation started');
    triggerRefresh();
  };

  const stopSimulation = () => {
    localStorage.removeItem('studio:is_simulation_active');
    setSimActive(false);
    clearOverrides();
    resetOtaUpdateState();
    showToast('Workflow simulation stopped');
    triggerRefresh();
  };

  const runWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.simulateDownloadThrottling = true;
    showToast('Starting automated workflow simulation...');
    await checkForUpdate(true, 'dev_tools', 'Simulation: Run Workflow');
    triggerRefresh();
  };

  const simulateUpdateAvailable = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.forceNoUpdate = false;
    updaterSimulation.forceDowngrade = false;
    await checkForUpdate(true, 'dev_tools', 'Simulation: Force Update Available');
    showToast('Simulating: Update Available');
    triggerRefresh();
  };

  const simulateDownload = () => {
    updaterSimulation.simulateDownload = true;
    showToast('Simulating: Download Mock active');
    triggerRefresh();
  };

  const simulateVerification = () => {
    updaterSimulation.forceShaFailure = false;
    updaterSimulation.forceSignatureMismatch = false;
    updaterSimulation.forceInvalidApk = false;
    showToast('Simulating: Integrity check passed');
    triggerRefresh();
  };

  const simulatePackageInstaller = () => {
    updaterSimulation.forcePendingUserAction = true;
    showToast('Simulating: PackageInstaller Visibility');
    triggerRefresh();
  };

  const simulateSuccessInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = true;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = false;
    
    // Simulate active, progress, success statuses
    setTimeout(() => triggerSimulatedStatus(-2, 'installing_start'), 100);
    for (let i = 1; i <= 10; i++) {
      const progress = i / 10;
      setTimeout(() => {
        triggerSimulatedStatus(-3, progress > 0.9 ? 'Finalizing installation...' : 'Optimizing application...', progress);
      }, 100 + i * 150);
    }
    setTimeout(() => {
      triggerSimulatedStatus(0, 'STATUS_SUCCESS');
      showToast('Simulating: Successful Installation');
      triggerRefresh();
    }, 1800);
  };

  const simulateFailedInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = true;
    updaterSimulation.forceUserCancel = false;
    triggerSimulatedStatus(1, 'STATUS_FAILURE');
    showToast('Simulating: Failed Installation');
    triggerRefresh();
  };

  const simulateCancelledInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = true;
    triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
    showToast('Simulating: Cancelled Installation');
    triggerRefresh();
  };

  const resetStateMachine = () => {
    resetOtaUpdateState();
    showToast('State machine reset to IDLE');
    triggerRefresh();
  };

  const clearOverrides = () => {
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
    updaterSimulation.injectDownloadFailure = false;
    updaterSimulation.injectChecksumFailure = false;
    updaterSimulation.injectNetworkTimeout = false;
    updaterSimulation.simulateDownloadThrottling = false;
    updaterSimulation.runWorkflowActive = false;
    setThrottled(false);
    showToast('Simulation overrides cleared');
    triggerRefresh();
  };

  const exportTimeline = () => {
    try {
      const data = JSON.stringify(transitionHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studio-updater-workflow-timeline-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Workflow timeline exported as JSON file');
    } catch (err: any) {
      showToast('Export failed: ' + err.message);
    }
  };

  const copyTimeline = () => {
    try {
      if (transitionHistory.length === 0) {
        showToast('Timeline is empty');
        return;
      }
      let md = `## Updater State Transition Timeline\n\n`;
      md += `| Step | Transition | Duration | Caller | Reason | Timestamp |\n`;
      md += `| --- | --- | --- | --- | --- | --- |\n`;
      transitionHistory.forEach((t, idx) => {
        const timeStr = new Date(t.timestamp).toLocaleTimeString();
        md += `| ${idx + 1} | \`${t.from} → ${t.to}\` | ${t.durationMs ? `${t.durationMs}ms` : '—'} | ${t.caller} | ${t.reason} | ${timeStr} |\n`;
      });
      copyToClipboard(md, 'Workflow Timeline');
      showToast('Timeline copied to clipboard as Markdown');
    } catch (err: any) {
      showToast('Copy failed: ' + err.message);
    }
  };

  const clearHistory = () => {
    clearSimulationLogs();
    showToast('Workflow history cleared');
    triggerRefresh();
  };

  // Get last transition info for display
  const lastTransition = transitionHistory[transitionHistory.length - 1];

  return (
    <div className="space-y-6 bg-black">
      {/* Simulation Active Indicator */}
      <div className="flex items-center justify-between bg-[#1c1c1e]/60 border border-outline-variant/10 p-5 rounded-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Simulation Mode</span>
          <span className={`text-sm font-bold ${simActive ? 'text-green-400' : 'text-zinc-500'}`}>
            {simActive ? 'ACTIVE (Production overridden)' : 'INACTIVE (Running production code)'}
          </span>
        </div>
        <div className="flex gap-2">
          {!simActive ? (
            <button 
              onClick={startSimulation}
              className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 text-xs font-bold transition-all"
            >
              Start Simulation
            </button>
          ) : (
            <button 
              onClick={stopSimulation}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 text-xs font-bold transition-all"
            >
              Stop Simulation
            </button>
          )}
        </div>
      </div>

      {/* Main Simulation Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Run Workflow (Simulate Everything) */}
        <button 
          onClick={runWorkflow}
          className="flex flex-col justify-between bg-[#1c1c1e] hover:bg-[#2c2c2e] p-4 rounded-xl transition-all text-left outline-none border border-green-500/30 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-green-400">
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span className="text-xs font-bold">Run Workflow</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Automates entire OTA update sequence</span>
        </button>

        {/* Simulate Update Available */}
        <button 
          onClick={simulateUpdateAvailable}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[18px]">system_update</span>
            <span className="text-xs font-bold">Simulate Update Available</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Forces comparison state update</span>
        </button>

        {/* Simulate Download */}
        <button 
          onClick={simulateDownload}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="text-xs font-bold">Simulate Download</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Toggles download progress mock</span>
        </button>

        {/* Simulate Verification */}
        <button 
          onClick={simulateVerification}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span className="text-xs font-bold">Simulate Verification</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Fakes validation integrity check</span>
        </button>

        {/* Simulate PackageInstaller */}
        <button 
          onClick={simulatePackageInstaller}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[18px]">security</span>
            <span className="text-xs font-bold">Simulate PackageInstaller</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Pauses state at prompt dialogue</span>
        </button>

        {/* Simulate Successful Installation */}
        <button 
          onClick={simulateSuccessInstall}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-green-400">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span className="text-xs font-bold">Simulate Success Install</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Completes update installation</span>
        </button>

        {/* Simulate Failed Installation */}
        <button 
          onClick={simulateFailedInstall}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="text-xs font-bold">Simulate Failed Install</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Triggers status failure event</span>
        </button>

        {/* Simulate Cancelled Installation */}
        <button 
          onClick={simulateCancelledInstall}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-amber-500">
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            <span className="text-xs font-bold">Simulate Cancel Install</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Triggers user abort status event</span>
        </button>

        {/* Toggle Network Throttling */}
        <button 
          onClick={toggleThrottling}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center justify-between w-full text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">speed</span>
              <span className="text-xs font-bold">Network Throttling</span>
            </div>
            <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${
              throttled ? 'bg-tertiary' : 'bg-[#161616]'
            }`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                throttled ? 'translate-x-3.5' : 'translate-x-0'
              }`} />
            </div>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Throttles download loop updates</span>
        </button>

        {/* Reset State Machine */}
        <button 
          onClick={resetStateMachine}
          className="flex flex-col justify-between bg-black hover:bg-white/5 p-4 rounded-xl transition-all text-left outline-none border border-outline-variant/10 active:scale-[0.98] min-h-[82px]"
        >
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span className="text-xs font-bold">Reset Workflow</span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1.5">Resets state to IDLE</span>
        </button>
      </div>

      {/* Control Utility Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
        <button 
          onClick={clearOverrides}
          className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-black border border-outline-variant/15 text-on-surface font-bold text-xs hover:bg-white/5 active:scale-95 transition-all outline-none"
        >
          Clear Overrides
        </button>

        <button 
          onClick={clearHistory}
          className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-black border border-outline-variant/15 text-on-surface font-bold text-xs hover:bg-white/5 active:scale-95 transition-all outline-none"
        >
          Clear Workflow History
        </button>

        <button 
          onClick={copyTimeline}
          className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-black border border-outline-variant/15 text-on-surface font-bold text-xs hover:bg-white/5 active:scale-95 transition-all outline-none"
        >
          Copy Workflow Timeline
        </button>

        <button 
          onClick={exportTimeline}
          className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-tertiary text-on-tertiary font-bold text-xs hover:brightness-110 active:scale-95 transition-all outline-none"
        >
          Export Workflow Timeline
        </button>
      </div>

      {/* Live Workflow Timeline Diagnostics */}
      <div className="bg-[#1c1c1e]/60 border border-outline-variant/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8b5cf6]">timeline</span>
          Live Workflow Timeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 p-4 border border-outline-variant/10 rounded-xl font-mono text-[11px]">
          <div>
            <div className="text-on-surface-variant text-[10px] uppercase font-bold">Current State</div>
            <div className="text-white font-bold mt-1 text-sm">{otaState.updateState}</div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[10px] uppercase font-bold">Previous State</div>
            <div className="text-white mt-1 text-sm">{lastTransition?.from || 'None'}</div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[10px] uppercase font-bold">Active Session ID</div>
            <div className="text-[#8b5cf6] font-bold mt-1 text-sm truncate">
              {otaState.sessionId ? String(otaState.sessionId).substring(0, 12) : 'None'}
            </div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[10px] uppercase font-bold">Last Trans Duration</div>
            <div className="text-white mt-1 text-sm">{lastTransition?.durationMs ? `${lastTransition.durationMs}ms` : '—'}</div>
          </div>
        </div>

        {lastTransition && (
          <div className="bg-black/20 p-4 border border-outline-variant/10 rounded-xl space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Caller:</span>
              <span className="text-[#e7e5e4]">{lastTransition.caller}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Reason:</span>
              <span className="text-[#e7e5e4]">{lastTransition.reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Timestamp:</span>
              <span className="text-[#e7e5e4]">{new Date(lastTransition.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Transition History</span>
          {transitionHistory.length > 0 ? (
            <div className="border border-outline-variant/10 rounded-xl overflow-hidden divide-y divide-[#484848]/10 font-mono text-[10px] bg-black/40 max-h-48 overflow-y-auto p-3.5 space-y-1">
              {transitionHistory.slice().reverse().map((t, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="text-[#8b5cf6] font-bold">{t.from} → {t.to}</span>
                  <span className="text-on-surface-variant text-[9px] max-w-[45%] truncate">{t.reason}</span>
                  <span className="text-on-surface-variant">{new Date(t.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1c1c1e]/40 border border-outline-variant/10 rounded-xl p-6 text-center text-xs text-on-surface-variant">
              No workflow history transitions recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
