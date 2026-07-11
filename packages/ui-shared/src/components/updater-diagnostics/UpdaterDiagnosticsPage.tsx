import React, { useState, useEffect, useRef } from 'react';
import { 
  isNative, 
  AppInstaller, 
  addJsLog, 
  useChordStore,
  ACCENT_COLORS,
  getLogs,
  useScrollHide,
  getUpdateSessions,
  deleteAllUpdateSessions,
  deleteUpdateSession,
  getActiveSession,
  exportSessionSubset,
  type UpdateSession,
  otaDebugLogs,
  isUpdateSessionActive,
  loadPersistedSession,
  activeUpdateSession,
  globalOtaState,
  releaseMetadataInspector,
  activityLifecycleTimeline,
  transitionHistory,
  rejectedTransitions,
  updaterSimulation,
  triggerSimulatedStatus,
  resetOtaUpdateState,
  applyUpdate,
  checkForUpdate,
  stateListeners,
  UpdaterFlightRecorder
} from '@workspace/studio-core';
import TelemetryGrid from './TelemetryGrid';
import ProductionActions from './ProductionActions';
import LiveConsole from './LiveConsole';
import DiagnosticsStack from './DiagnosticsStack';
import SimulationLab from './SimulationLab';
import StateMachineVisualizer from './StateMachineVisualizer';
import ReportPreview from './ReportPreview';
import { copyToClipboard } from './centralizedClipboard';

interface Props {
  onBack: () => void;
}

export default function UpdaterDiagnosticsPage({ onBack }: Props) {
  const { settings } = useChordStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useScrollHide(scrollRef);

  // Increment render and paint counts
  if (otaDebugLogs) {
    otaDebugLogs.renderCount = (otaDebugLogs.renderCount || 0) + 1;
    if (typeof window !== 'undefined') {
      otaDebugLogs.paintCount = performance.getEntriesByType('paint').length;
    }
  }

  React.useLayoutEffect(() => {
    if (otaDebugLogs) {
      otaDebugLogs.layoutCount = (otaDebugLogs.layoutCount || 0) + 1;
    }
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Persistent Diagnostics Session History
  const [sessions, setSessions] = useState<UpdateSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('current');
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => setRefreshCount(prev => prev + 1);

  // Native platform diagnostics states
  const [nativeDeviceInfo, setNativeDeviceInfo] = useState<any>(null);
  const [nativeInstallerDetails, setNativeInstallerDetails] = useState<any>(null);
  const [localApkDetails, setLocalApkDetails] = useState<any>(null);
  const [nativeLogsList, setNativeLogsList] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const [simActive, setSimActive] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true';
  });

  const [otaState, setOtaState] = useState(globalOtaState);

  // Subscribe to state machine listeners to update UI live and run auto-progress simulation workflows
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

      if (updaterSimulation.runWorkflowActive && newState.updateState === 'PACKAGEINSTALLER_VISIBLE') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalOtaState.updateState === 'PACKAGEINSTALLER_VISIBLE') {
            if (updaterSimulation.forceInstallSuccess) {
              addJsLog('[Simulate Workflow] Auto-triggering simulated success installation...');
              simulateSuccessInstall();
            } else if (updaterSimulation.forceInstallFailure) {
              addJsLog('[Simulate Workflow] Auto-triggering simulated failed installation...');
              simulateFailedInstall();
            } else if (updaterSimulation.forceUserCancel) {
              addJsLog('[Simulate Workflow] Auto-triggering simulated cancelled installation...');
              simulateCancelledInstall();
            }
          }
        }, 1500);
      }
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, [triggerRefresh]);

  const clearOverrides = () => {
    updaterSimulation.runWorkflowActive = false;
    updaterSimulation.forceUpdateAvailable = false;
    updaterSimulation.forceNoUpdate = false;
    updaterSimulation.forceDowngrade = false;
    updaterSimulation.forceMandatoryUpdate = false;
    updaterSimulation.forceOptionalUpdate = false;
    
    updaterSimulation.forceSignatureMismatch = false;
    updaterSimulation.forceShaFailure = false;
    updaterSimulation.forceMetadataFailure = false;
    updaterSimulation.forceInvalidApk = false;
    updaterSimulation.forceDownloadFailure = false;
    updaterSimulation.forceDownloadTimeout = false;
    updaterSimulation.forceRecoveryMode = false;
    updaterSimulation.forceResumeDownload = false;
    updaterSimulation.forceCachedApk = false;
    
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = false;
    updaterSimulation.forcePendingUserAction = false;

    updaterSimulation.simulateDownload = false;
    updaterSimulation.injectDownloadFailure = false;
    updaterSimulation.injectChecksumFailure = false;
    updaterSimulation.injectNetworkTimeout = false;
    updaterSimulation.simulateDownloadThrottling = false;
  };

  const runSuccessfulUpdateWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forceInstallSuccess = true;
    showToast('Successful Update Workflow started');
    await checkForUpdate(true, 'dev_tools', 'Simulation: Successful Update');
    triggerRefresh();
  };

  const runDownloadFailureWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.injectDownloadFailure = true;
    updaterSimulation.forceDownloadFailure = true;
    showToast('Download Failure Workflow started');
    await checkForUpdate(true, 'dev_tools', 'Simulation: Download Failure');
    triggerRefresh();
  };

  const runVerificationFailureWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.injectChecksumFailure = true;
    updaterSimulation.forceShaFailure = true;
    showToast('Verification Failure Workflow started');
    await checkForUpdate(true, 'dev_tools', 'Simulation: Verification Failure');
    triggerRefresh();
  };

  const runPackageInstallerWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forcePendingUserAction = true;
    showToast('PackageInstaller Workflow started');
    await checkForUpdate(true, 'dev_tools', 'Simulation: PackageInstaller');
    triggerRefresh();
  };

  const runInstallationFailureWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forceInstallFailure = true;
    showToast('Installation Failure Workflow started');
    await checkForUpdate(true, 'dev_tools', 'Simulation: Installation Failure');
    triggerRefresh();
  };

  const runResetWorkflow = () => {
    localStorage.removeItem('studio:is_simulation_active');
    setSimActive(false);
    clearOverrides();
    resetOtaUpdateState();
    showToast('Simulation overrides cleared and updater reset');
    triggerRefresh();
  };

  const simulateSuccessInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = true;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = false;
    
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
    
    setTimeout(() => triggerSimulatedStatus(-2, 'installing_start'), 100);
    setTimeout(() => {
      triggerSimulatedStatus(1, 'STATUS_FAILURE');
      showToast('Simulating: Installation Failure');
      triggerRefresh();
    }, 1000);
  };

  const simulateCancelledInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = true;
    
    setTimeout(() => {
      triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
      showToast('Simulating: User Cancelled Installation');
      triggerRefresh();
    }, 500);
  };

  const refreshSessionsList = () => {
    const list = getUpdateSessions();
    setSessions(list);
    if (list.length > 0 && selectedSessionId === 'current') {
      const active = getActiveSession();
      if (active) {
        setSelectedSessionId(active.id);
      } else {
        setSelectedSessionId(list[list.length - 1].id);
      }
    }
  };

  // Sync data loop on native platform
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        refreshSessionsList();

        if (isNative() && typeof AppInstaller !== 'undefined') {
          const dev = await AppInstaller.getDeviceInfo();
          if (active) setNativeDeviceInfo(dev);

          if (typeof AppInstaller.getExtendedDiagnostics === 'function') {
            const det = await AppInstaller.getExtendedDiagnostics();
            if (active) setNativeInstallerDetails(det);
          } else if (typeof (AppInstaller as any).getPackageInstallerDetails === 'function') {
            const det = await (AppInstaller as any).getPackageInstallerDetails();
            if (active) setNativeInstallerDetails(det);
          }

          if (typeof AppInstaller.getInstallerLogHistory === 'function') {
            const historyRes = await AppInstaller.getInstallerLogHistory();
            if (active && historyRes && historyRes.logs) {
              try {
                const parsed = JSON.parse(historyRes.logs);
                setNativeLogsList(Array.isArray(parsed) ? parsed : []);
              } catch (e) {
                console.warn('Failed to parse history logs:', e);
              }
            }
          }

          const cachedPath = localStorage.getItem('studio:downloadedApkPath');
          if (cachedPath) {
            try {
              if (typeof AppInstaller.inspectApk === 'function') {
                const apkDet = await AppInstaller.inspectApk({ filePath: cachedPath });
                if (active) setLocalApkDetails(apkDet);
              }
            } catch (err) {
              console.warn('Failed to inspect cached APK:', err);
            }
          } else {
            if (active) setLocalApkDetails(null);
          }
        }
      } catch (err) {
        console.warn('Diagnostics background refresh failed:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshCount]);

  const handleCopySubset = async (subset: 'all' | 'workflow' | 'timeline' | 'native' | 'js', format: 'txt' | 'json' | 'md') => {
    const text = exportSessionSubset(selectedSessionId, subset, format);
    try {
      await copyToClipboard(text, `${subset.toUpperCase()} (${format.toUpperCase()})`);
      showToast('Trace copied to clipboard!');
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const handleExportFile = (format: 'json' | 'txt' | 'md') => {
    const text = exportSessionSubset(selectedSessionId, 'all', format);
    const mimeMap = {
      json: 'application/json',
      txt: 'text/plain',
      md: 'text/markdown'
    };
    const extMap = {
      json: 'json',
      txt: 'txt',
      md: 'md'
    };
    const blob = new Blob([text], { type: mimeMap[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-updater-diagnostics-${selectedSessionId.replace(/\s+/g, '_')}-${Date.now()}.${extMap[format]}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(`Session diagnostics exported as ${format.toUpperCase()}`);
  };

  const handleDeleteSession = () => {
    if (!window.confirm(`Delete persistent logs for ${selectedSessionId}?`)) return;
    deleteUpdateSession(selectedSessionId);
    showToast('Session logs deleted');
    setSelectedSessionId('current');
    triggerRefresh();
  };

  const handleDeleteAll = () => {
    if (!window.confirm('WARNING: This will permanently delete all update session history logs. Continue?')) return;
    deleteAllUpdateSessions();
    showToast('All diagnostics session logs deleted');
    setSelectedSessionId('current');
    triggerRefresh();
  };

  const handleCopyEverything = async () => {
    try {
      const { generateCopyEverythingReport } = await import('./diagnosticsGenerator');
      const text = generateCopyEverythingReport(nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
      await copyToClipboard(text, 'Full Diagnostics Center Export');
      showToast('Trace copied to clipboard!');
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const handleCopySelectedSession = () => {
    handleCopySubset('all', 'md');
  };

  const handleCopyEntireHistory = async () => {
    const allSess = getUpdateSessions();
    const text = allSess.map(s => exportSessionSubset(s.id, 'all', 'md')).join('\n\n---\n\n');
    try {
      await copyToClipboard(text, 'Full Update History');
      showToast('Full update history copied to clipboard!');
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const handleExportHistory = (format: 'json' | 'md') => {
    const allSess = getUpdateSessions();
    let text = '';
    if (format === 'json') {
      text = JSON.stringify(allSess, null, 2);
    } else {
      text = allSess.map(s => exportSessionSubset(s.id, 'all', 'md')).join('\n\n---\n\n');
    }
    const mimeMap = {
      json: 'application/json',
      md: 'text/markdown'
    };
    const extMap = {
      json: 'json',
      md: 'md'
    };
    const blob = new Blob([text], { type: mimeMap[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-updater-full-history-${Date.now()}.${extMap[format]}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(`Full history exported as ${format.toUpperCase()}`);
  };

  const handleShareApk = async () => {
    const cachedPath = localStorage.getItem('studio:downloadedApkPath');
    if (!cachedPath) {
      showToast('No cached APK package exists on disk.');
      return;
    }
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: 'Studio Cached APK',
        url: cachedPath.startsWith('file://') ? cachedPath : `file://${cachedPath}`
      });
    } catch (err: any) {
      showToast(`Share failed: ${err.message || String(err)}`);
    }
  };

  const handlePrintLogs = async () => {
    let txt = `=== CHRONOLOGICAL SYSTEM EVENT TIMELINE ===\n`;
    const logs = getLogs() || [];
    const timeline = [
      ...logs.map(l => ({ time: l.timestamp, type: 'JS', text: l.message })),
      ...nativeLogsList.map(l => ({ time: l.timestamp || Date.now(), type: 'NATIVE', text: `${l.stage}: ${l.message}` }))
    ].sort((a, b) => a.time - b.time);
    
    timeline.forEach(e => {
      txt += `[${new Date(e.time).toLocaleTimeString()}] [${e.type}] ${e.text}\n`;
    });

    try {
      const msg = await copyToClipboard(txt, 'System Timeline');
      showToast(msg);
    } catch (err: any) {
      showToast(`Print failed: ${err.message || String(err)}`);
    }
  };

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'livestate'
    | 'workflow'
    | 'session'
    | 'performance'
    | 'installer'
    | 'logs'
    | 'simulation'
    | 'history'
    | 'export'
    | 'devtools'
  >('overview');

  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[sessions.length - 1];
  const curSession = loadPersistedSession();

  const accent = settings.accentColor || 'purple';
  const cFrom = ACCENT_COLORS[accent]?.from || ACCENT_COLORS.purple.from;
  const cTo = ACCENT_COLORS[accent]?.to || ACCENT_COLORS.purple.to;

  return (
    <div ref={scrollRef} className="bg-[#000000] text-[#e7e5e4] h-full overflow-y-auto overflow-x-hidden relative flex flex-col font-body">
      {/* Top sticky app bar */}
      <header className="w-full sticky top-0 z-50 bg-[#000000] flex items-center justify-between px-6 pt-4 pb-4 border-b border-[#484848]/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors outline-none cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#e7e5e4] tracking-tight font-headline">Updater Diagnostics</h1>
            <p className="text-xs text-on-surface-variant font-medium">OTA Diagnostics &amp; Developer Control Dashboard</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopyEverything}
            className="flex items-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            <span>Copy Everything</span>
          </button>
        </div>
      </header>

      {/* Horizontal scrolling tab list */}
      <div className="flex border-b border-[#484848]/10 overflow-x-auto no-scrollbar bg-black sticky top-[72px] z-40 px-6">
        {[
          { id: 'overview', label: 'Overview', icon: 'info' },
          { id: 'livestate', label: 'Live State', icon: 'sync' },
          { id: 'workflow', label: 'Workflow Timeline', icon: 'event_note' },
          { id: 'session', label: 'Session Timeline', icon: 'timeline' },
          { id: 'performance', label: 'Performance', icon: 'insights' },
          { id: 'installer', label: 'PackageInstaller', icon: 'install_mobile' },
          { id: 'logs', label: 'Logs', icon: 'terminal' },
          { id: 'simulation', label: 'Simulation', icon: 'science' },
          { id: 'history', label: 'History', icon: 'history' },
          { id: 'export', label: 'Export', icon: 'download' },
          { id: 'devtools', label: 'Developer Tools', icon: 'build' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors outline-none bg-transparent ${
              activeTab === tab.id
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content viewport */}
      <main className="px-6 max-w-4xl w-full mx-auto space-y-4 pt-6 pb-[calc(var(--content-bottom-pad,96px)+20px)] flex-1 select-none">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">info</span>
                System Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Update State</span>
                  <span className="text-sm font-bold text-white font-mono">{globalOtaState.updateState}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Session Active</span>
                  <span className="text-sm font-bold text-white">{isUpdateSessionActive() ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Consecutive Failures</span>
                  <span className="text-sm font-bold text-white">{globalOtaState.consecutiveFailures}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Active Fallback</span>
                  <span className="text-sm font-bold text-white font-mono">{globalOtaState.activeFallback || 'None'}</span>
                </div>
              </div>
            </div>

            {/* WORKFLOW TESTING SCENARIOS */}
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">science</span>
                Production Workflow Testing Scenarios
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Execute complete scenarios using the **REAL** production updater pipeline and state machine. Simulated external providers are used.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button 
                  onClick={runSuccessfulUpdateWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/10 p-4 rounded-xl transition-all text-left outline-none border border-green-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="text-xs font-bold">Successful Update</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Check &rarr; Download &rarr; Verify &rarr; Success</span>
                </button>

                <button 
                  onClick={runDownloadFailureWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/10 p-4 rounded-xl transition-all text-left outline-none border border-red-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="material-symbols-outlined text-[18px]">cloud_off</span>
                    <span className="text-xs font-bold">Download Failure</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Check &rarr; Download Fail</span>
                </button>

                <button 
                  onClick={runVerificationFailureWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/10 p-4 rounded-xl transition-all text-left outline-none border border-red-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                    <span className="text-xs font-bold">Verification Failure</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Check &rarr; Download &rarr; Verify Fail</span>
                </button>

                <button 
                  onClick={runPackageInstallerWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/10 p-4 rounded-xl transition-all text-left outline-none border border-purple-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-purple-400">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span className="text-xs font-bold">PackageInstaller Dialog</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Check &rarr; Download &rarr; Verify &rarr; Pauses at Dialog</span>
                </button>

                <button 
                  onClick={runInstallationFailureWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/10 p-4 rounded-xl transition-all text-left outline-none border border-red-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span className="text-xs font-bold">Installation Failure</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Check &rarr; Download &rarr; Verify &rarr; Install Fail</span>
                </button>

                <button 
                  onClick={runResetWorkflow}
                  className="flex flex-col justify-between bg-black/40 hover:bg-[#8b5cf6]/20 p-4 rounded-xl transition-all text-left outline-none border border-zinc-500/30 active:scale-[0.98] min-h-[82px] cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    <span className="text-xs font-bold">Reset Workflow</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1.5">Clear simulator overrides &amp; Reset FSM</span>
                </button>
              </div>
            </div>

            {/* FLIGHT RECORDER LIVE TIMELINE */}
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6]">flight_takeoff</span>
                  Flight Recorder Live Timeline (Survives Restarts)
                </h3>
                <button 
                  onClick={() => { UpdaterFlightRecorder.clear(); triggerRefresh(); showToast('Flight Recorder cleared'); }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase cursor-pointer outline-none bg-transparent border-none"
                >
                  Clear Logs
                </button>
              </div>
              
              {UpdaterFlightRecorder.getEvents().length > 0 ? (
                <div className="border border-[#484848]/10 rounded-xl overflow-hidden font-mono text-[10px] bg-black/40 max-h-[300px] overflow-y-auto p-4 space-y-3 divide-y divide-[#484848]/15">
                  {UpdaterFlightRecorder.getEvents().slice().reverse().map((e, idx) => {
                    const isErr = !!e.error || e.warning === 'INSTALL_FAILED' || e.warning === 'CHECK_BLOCKED_INSTALLATION_LOCKED';
                    const isWarn = !!e.warning && !isErr;
                    const isSuccess = e.eventType === 'checkForUpdateAllowed' || e.newState === 'INSTALL_SUCCESS';
                    
                    const timeStr = new Date(e.timestamp).toLocaleTimeString();
                    const durationStr = e.duration ? `${e.duration}ms` : '—';
                    
                    return (
                      <div key={idx} className="pt-3 first:pt-0 flex flex-col gap-1.5 border-t border-[#484848]/15">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isErr ? 'bg-red-500 animate-pulse' : isWarn ? 'bg-yellow-500' : isSuccess ? 'bg-green-500' : 'bg-purple-500'
                            }`} />
                            <span className="font-bold text-[#e7e5e4] text-xs">
                              {e.eventType}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[9px] font-bold bg-[#1c1c1e] px-2 py-0.5 rounded border border-outline-variant/10">
                            {timeStr} ({durationStr})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9px] text-zinc-400 pl-4.5 leading-relaxed">
                          <div>
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Source/Thread:</span>{' '}
                            <span className="text-purple-300">{e.caller} ({e.thread})</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Reason:</span>{' '}
                            <span className="text-zinc-300">{e.reason}</span>
                          </div>
                          {e.previousState && (
                            <div className="sm:col-span-2">
                              <span className="text-zinc-500 font-bold uppercase tracking-wider">Transition:</span>{' '}
                              <span className="text-zinc-300">{e.previousState} &rarr; {e.newState}</span>
                            </div>
                          )}
                          {e.error && (
                            <div className="sm:col-span-2 text-red-400">
                              <span className="text-red-500 font-bold uppercase tracking-wider">Error:</span>{' '}
                              <span>{e.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                  No Flight Recorder events recorded.
                </div>
              )}
            </div>

            <TelemetryGrid 
              nativeDeviceInfo={nativeDeviceInfo}
              nativeInstallerDetails={nativeInstallerDetails}
            />
          </div>
        )}

        {/* TAB 2: LIVE STATE */}
        {activeTab === 'livestate' && (
          <div className="space-y-4 animate-fadeIn">
            <StateMachineVisualizer />
            
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">history</span>
                Live State Transition History
              </h3>
              {transitionHistory && transitionHistory.length > 0 ? (
                <div className="border border-[#484848]/10 rounded-xl overflow-hidden divide-y divide-[#484848]/10 font-mono text-[11px] bg-black/40 p-4 space-y-1">
                  {transitionHistory.map((t, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="text-[#8b5cf6] font-bold">{t.from} → {t.to}</span>
                      <span className="text-on-surface-variant text-[10px] max-w-[50%] truncate">{t.reason}</span>
                      <span className="text-on-surface-variant">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                  No state transitions recorded this session.
                </div>
              )}
            </div>

            {rejectedTransitions && rejectedTransitions.length > 0 && (
              <div className="bg-[#1c1c1e]/60 border border-red-500/15 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-[#ef4444] font-headline tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ef4444]">warning</span>
                  Rejected Transitions
                </h3>
                <div className="border border-red-500/10 rounded-xl overflow-hidden divide-y divide-red-950/20 font-mono text-[11px] bg-red-950/5 p-4 space-y-1">
                  {rejectedTransitions.map((t, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-red-300">
                      <span>{t.from} ↛ {t.attempted}</span>
                      <span className="text-red-400/75 text-[10px] max-w-[50%] truncate">{t.reason}</span>
                      <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WORKFLOW TIMELINE */}
        {activeTab === 'workflow' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">event_note</span>
                Workflow Timeline Events
              </h3>
              {activityLifecycleTimeline && activityLifecycleTimeline.length > 0 ? (
                <div className="border border-[#484848]/10 rounded-xl bg-black/20 p-4 divide-y divide-[#484848]/10 space-y-1">
                  {activityLifecycleTimeline.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white font-bold">{item.stage}</span>
                      <span className="text-on-surface-variant">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                  No workflow timeline events logged in this session.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SESSION TIMELINE */}
        {activeTab === 'session' && (
          <div className="space-y-4 animate-fadeIn">
            {curSession ? (
              <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6]">settings_backup_restore</span>
                  Active Update Session Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Session ID</span>
                    <span className="text-sm font-bold text-white font-mono">{curSession.sessionId}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Created At</span>
                    <span className="text-sm font-bold text-white">{new Date(curSession.creationTimestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Pipeline ID</span>
                    <span className="text-sm font-bold text-white font-mono">{curSession.pipelineId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Current State</span>
                    <span className="text-sm font-bold text-white font-mono">{curSession.currentState}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Previous State</span>
                    <span className="text-sm font-bold text-white font-mono">{curSession.previousState || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Started By</span>
                    <span className="text-sm font-bold text-white">{curSession.startedBy}</span>
                  </div>
                </div>
                <div className="border-t border-[#484848]/10 pt-4">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase mb-1">Session Progress</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#2c2c2e] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#8b5cf6] h-full rounded-full transition-all duration-300" style={{ width: `${curSession.progress * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white">{Math.round(curSession.progress * 100)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-6 text-center text-sm text-on-surface-variant font-medium">
                No active updater session currently running.
              </div>
            )}

            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">timeline</span>
                Timeline Viewer
              </h3>
              <div className="mb-4">
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Select Diagnostic Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#484848]/35 rounded-xl px-4 py-3 text-sm text-[#e7e5e4] font-semibold outline-none focus:border-[#8b5cf6] transition-colors"
                >
                  <option value="current">-- Active/Latest Session --</option>
                  {sessions.slice().reverse().map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.result} - {s.version || 'unknown'} - {new Date(s.startTime).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSession && selectedSession.timeline.length > 0 ? (
                <div className="border border-[#484848]/10 rounded-2xl overflow-hidden bg-[#1c1c1e]/30 flex flex-col divide-y divide-[#484848]/10 font-mono text-xs max-h-[480px] overflow-y-auto">
                  {selectedSession.timeline.map((event, idx) => (
                    <div key={idx} className="p-3 flex items-start gap-4 hover:bg-white/2 transition-colors">
                      <div className="text-on-surface-variant min-w-[70px] font-bold">{event.timestamp}</div>
                      <div className="text-[#a8a29e] min-w-[80px] font-bold">{event.offset}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#8b5cf6] font-bold uppercase text-[10px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-1.5 rounded">{event.module}</span>
                          <span className="text-white font-bold">{event.event}</span>
                          <span className="text-on-surface-variant text-[10px]">State: {event.state}</span>
                        </div>
                        {event.reason && <div className="text-on-surface-variant text-[11px] break-words">{event.reason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                  No timeline logs recorded for this session.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">insights</span>
                Real-Time Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">UI Thread Performance</span>
                  <span className="text-xl font-bold text-green-400 font-mono">{fps} FPS</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">React Commit Count</span>
                  <span className="text-xl font-bold text-white font-mono">{otaDebugLogs?.renderCount ?? 0}</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">React Layout Cycles</span>
                  <span className="text-xl font-bold text-white font-mono">{otaDebugLogs?.layoutCount ?? 0}</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Frame Paints</span>
                  <span className="text-xl font-bold text-white font-mono">{otaDebugLogs?.paintCount ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PACKAGEINSTALLER */}
        {activeTab === 'installer' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">install_mobile</span>
                PackageInstaller Native Check Status
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">AppInstaller Available</span>
                  <span className="font-mono text-white text-sm">{otaDebugLogs.appInstallerAvailable ? 'YES' : 'NO'}</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Download Apk Hook</span>
                  <span className="font-mono text-white text-sm">{otaDebugLogs.downloadApkAvailable ? 'YES' : 'NO'}</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Verify Apk Sha256</span>
                  <span className="font-mono text-white text-sm">{otaDebugLogs.verifyApkSha256Available ? 'YES' : 'NO'}</span>
                </div>
                <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl space-y-1">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Install Apk Hook</span>
                  <span className="font-mono text-white text-sm">{otaDebugLogs.installApkAvailable ? 'YES' : 'NO'}</span>
                </div>
              </div>
              <div className="bg-black/40 border border-outline-variant/5 p-4 rounded-xl space-y-1 text-xs">
                <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Installer Launch Logs</span>
                <span className="font-mono text-white text-sm">{otaDebugLogs.installerLaunchStatus || 'N/A'}</span>
              </div>
            </div>

            {nativeInstallerDetails && (
              <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6]">description</span>
                  Extended PackageInstaller Telemetry
                </h3>
                <pre className="bg-black/60 border border-outline-variant/10 rounded-xl p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-72">
                  {JSON.stringify(nativeInstallerDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-fadeIn">
            <LiveConsole 
              nativeLogsList={nativeLogsList}
              clearNativeLogsList={() => setNativeLogsList([])}
              showToast={showToast}
              addJsLog={addJsLog}
            />
          </div>
        )}

        {/* TAB 8: SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="space-y-4 animate-fadeIn">
            <SimulationLab 
              showToast={showToast}
              triggerRefresh={triggerRefresh}
              nativeDeviceInfo={nativeDeviceInfo}
              nativeInstallerDetails={nativeInstallerDetails}
              localApkDetails={localApkDetails}
              nativeLogsList={nativeLogsList}
            />
          </div>
        )}

        {/* TAB 9: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">history</span>
                Persistent Session History logs
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessions.length > 0 ? (
                  sessions.slice().reverse().map(s => (
                    <div key={s.id} className="border border-outline-variant/10 rounded-xl p-4 bg-black/40 flex flex-col gap-2 relative">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs text-white font-bold">{s.id.substring(0, 18)}...</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          s.result === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border-green-500/25' :
                          s.result === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                          s.result === 'CANCELLED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                          s.result === 'FINISHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/25'
                        }`}>{s.result}</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        <div><span className="font-semibold text-[#e7e5e4]">Target:</span> {s.version || 'unknown'}</div>
                        <div><span className="font-semibold text-[#e7e5e4]">Date:</span> {new Date(s.startTime).toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => {
                          deleteUpdateSession(s.id);
                          showToast('Session deleted');
                          refreshSessionsList();
                        }}
                        className="absolute right-3 bottom-3 text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer outline-none"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                    No persistent diagnostic sessions recorded yet.
                  </div>
                )}
              </div>

              {sessions.length > 0 && (
                <div className="pt-4 border-t border-[#484848]/10 flex justify-end">
                  <button
                    onClick={handleDeleteAll}
                    className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Wipe All Sessions</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">download</span>
                Diagnostics &amp; Session Clipboard Exporters
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCopySelectedSession}
                  className="flex items-center justify-between bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Copy Selected Session</span>
                    <span className="text-[10px] text-on-surface-variant">Copy current selected history session as MD</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">content_copy</span>
                </button>

                <button
                  onClick={handleCopyEntireHistory}
                  className="flex items-center justify-between bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Copy Entire History</span>
                    <span className="text-[10px] text-on-surface-variant">Copy all recorded history logs together</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">library_books</span>
                </button>

                <button
                  onClick={() => handleExportHistory('json')}
                  className="flex items-center justify-between bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Export History (JSON)</span>
                    <span className="text-[10px] text-on-surface-variant">Download all session histories in JSON</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">download</span>
                </button>

                <button
                  onClick={() => handleExportHistory('md')}
                  className="flex items-center justify-between bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Export History (Markdown)</span>
                    <span className="text-[10px] text-on-surface-variant">Download all session histories in Markdown</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">download</span>
                </button>
              </div>

              <div className="pt-4 border-t border-[#484848]/10 space-y-3">
                <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Generate report Subsets</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleCopySubset('workflow', 'txt')} className="px-3 py-2 rounded-xl bg-black hover:bg-white/5 border border-outline-variant/10 text-xs font-bold text-white cursor-pointer">Workflow</button>
                  <button onClick={() => handleCopySubset('timeline', 'txt')} className="px-3 py-2 rounded-xl bg-black hover:bg-white/5 border border-outline-variant/10 text-xs font-bold text-white cursor-pointer">Timeline</button>
                  <button onClick={() => handleCopySubset('native', 'txt')} className="px-3 py-2 rounded-xl bg-black hover:bg-white/5 border border-outline-variant/10 text-xs font-bold text-white cursor-pointer">Native Logs</button>
                  <button onClick={() => handleCopySubset('js', 'txt')} className="px-3 py-2 rounded-xl bg-black hover:bg-white/5 border border-outline-variant/10 text-xs font-bold text-white cursor-pointer">JS Logs</button>
                  <button onClick={() => handleCopySubset('all', 'json')} className="px-3 py-2 rounded-xl bg-black hover:bg-white/5 border border-outline-variant/10 text-xs font-bold text-white cursor-pointer">Raw JSON</button>
                </div>
              </div>

              <DiagnosticsStack 
                nativeDeviceInfo={nativeDeviceInfo}
                nativeInstallerDetails={nativeInstallerDetails}
                localApkDetails={localApkDetails}
                nativeLogsList={nativeLogsList}
                showToast={showToast}
              />
            </div>
          </div>
        )}

        {/* TAB 11: DEVELOPER TOOLS */}
        {activeTab === 'devtools' && (
          <div className="space-y-4 animate-fadeIn">
            <ProductionActions 
              showToast={showToast} 
              triggerRefresh={triggerRefresh}
              addJsLog={addJsLog}
            />

            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6]">build</span>
                Additional Verification Actions
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Share APK */}
                <button
                  onClick={handleShareApk}
                  className="flex items-center justify-between bg-black hover:bg-white/5 border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none active:scale-[0.98]"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Share Downloaded APK</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Send target binary package via standard share dialog</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">share</span>
                </button>

                {/* Print Timeline */}
                <button
                  onClick={handlePrintLogs}
                  className="flex items-center justify-between bg-black hover:bg-white/5 border border-[#484848]/20 text-white p-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-left outline-none active:scale-[0.98]"
                >
                  <div>
                    <span className="block font-bold text-sm text-tertiary">Print System Timeline</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">Export full chronological timeline of native/JS events</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary">print</span>
                </button>
              </div>
            </div>
            
            <ReportPreview 
              nativeDeviceInfo={nativeDeviceInfo}
              nativeInstallerDetails={nativeInstallerDetails}
              localApkDetails={localApkDetails}
              nativeLogsList={nativeLogsList}
            />
          </div>
        )}

      </main>

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border border-outline-variant/10 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-[9999] text-white flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-green-400">done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
