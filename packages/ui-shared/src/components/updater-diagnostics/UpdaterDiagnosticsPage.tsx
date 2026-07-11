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
  downloadUpdate,
  checkForUpdate,
  stateListeners,
  UpdaterFlightRecorder,
  getErrors,
  APP_VERSION,
  activePipelineContext,
  otaDiagnostics,
  PerformanceProfiler,
  isInstallationLocked,
  isPostInstallSessionActive,
  shouldUseAndroidApkUpdater,
  useIsWebDesktop
} from '@workspace/studio-core';
import TelemetryGrid from './TelemetryGrid';
import ProductionActions from './ProductionActions';
import LiveConsole from './LiveConsole';
import DiagnosticsStack from './DiagnosticsStack';
import { CopyDropdown } from '../devtools/DevToolsDashboard';
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
            addJsLog('[Simulate Workflow] Auto-triggering downloadUpdate...');
            downloadUpdate('Simulation: Run Workflow').catch((e) => {
              console.error('Simulated downloadUpdate failed:', e);
            });
          }
        }, 1500);
      }

      if (updaterSimulation.runWorkflowActive && newState.updateState === 'WAITING_USER_CONFIRMATION') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalOtaState.updateState === 'WAITING_USER_CONFIRMATION') {
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

  const [isWorkflowTestingOpen, setIsWorkflowTestingOpen] = useState(true);
  const [isFlightRecorderOpen, setIsFlightRecorderOpen] = useState(false);
  const [isRuntimeSessionOpen, setIsRuntimeSessionOpen] = useState(false);
  const [isAdvancedDiagnosticsOpen, setIsAdvancedDiagnosticsOpen] = useState(false);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioDurations, setScenarioDurations] = useState<Record<string, number>>({});
  const [advTab, setAdvTab] = useState<'fsm' | 'native' | 'config'>('fsm');
  const [fps, setFps] = useState(60);

  // Live Scenario Timer
  useEffect(() => {
    if (!activeScenarioId) return;
    const start = Date.now();
    setScenarioDurations(prev => ({ ...prev, [activeScenarioId]: 0 }));
    const timer = setInterval(() => {
      setScenarioDurations(prev => ({
        ...prev,
        [activeScenarioId]: Date.now() - start
      }));
    }, 100);
    return () => clearInterval(timer);
  }, [activeScenarioId]);

  // Terminal state listener to stop scenario timer
  useEffect(() => {
    const listener = (state: any) => {
      if (!activeScenarioId) return;
      const isTerminal = 
        state.updateState === 'INSTALL_SUCCESS' || 
        state.updateState === 'INSTALL_FAILED' || 
        state.updateState === 'INSTALL_CANCELLED' || 
        state.updateState === 'RECOVERY' || 
        state.updateState === 'IDLE' || 
        state.updateState === 'NO_UPDATE_AVAILABLE';
      if (isTerminal) {
        setActiveScenarioId(null);
      }
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, [activeScenarioId]);

  // FPS Tracker
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

  const handleCopyFlightRecorderLogs = async () => {
    const events = UpdaterFlightRecorder.getEvents();
    const text = events.map(e => {
      return `[${new Date(e.timestamp).toISOString()}] [${e.thread.toUpperCase()}] ${e.eventType}
  Caller: ${e.caller} | Func: ${e.funcName || 'none'} | File: ${e.fileName || 'none'}
  Transition: ${e.previousState || 'none'} -> ${e.newState || 'none'} (Duration: ${e.duration ? e.duration + 'ms' : 'N/A'})
  Reason: ${e.reason || 'none'}
  Warning: ${e.warning || 'none'} | Error: ${e.error || 'none'}
  Details: ${e.details || 'none'}
--------------------------------------------------`;
    }).join('\n');
    
    try {
      await copyToClipboard(text, 'Flight Recorder Logs');
      showToast('Flight recorder logs copied to clipboard!');
    } catch (err: any) {
      showToast(`Copy failed: ${err.message}`);
    }
  };

  const errorCount = getErrors()?.length || 0;
  const warningCount = getLogs()?.filter(l => l.level === 'warn').length || 0;

  const isWebDesktop = useIsWebDesktop();

  return (
    <div ref={scrollRef} style={{ background: '#000', color: 'var(--c-text-primary, #fff)', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }} className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
      <style>{`
        @media (min-width: 768px) {
          .dev-grid-4col {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      {/* Reused SubView Header styling from DevToolsDashboard */}
      <header
        style={{
          padding: isWebDesktop ? '16px 24px' : '12px 16px',
          borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--app-surface-low, #131313)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isWebDesktop ? 16 : 10 }}>
          <button
            onClick={() => {
              console.log("BUTTON PRESSED:\nBack to Developer Panel");
              addJsLog("BUTTON PRESSED:\nBack to Developer Panel");
              onBack();
            }}
            className="btn-smooth"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: 'none',
              borderRadius: '999px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--studio-accent-from, #679cff)',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: isWebDesktop ? '20px' : '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Updater Diagnostics</h1>
            <p style={{ margin: '2px 0 0', fontSize: isWebDesktop ? '12px' : '10px', color: 'rgba(255,255,255,0.4)' }}>OTA Updates &amp; Diagnostics</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CopyDropdown
            moduleName="Updater"
            activeTab="overview"
            onCopySuccess={(msg) => showToast(msg)}
            nativeDeviceInfo={nativeDeviceInfo}
            nativeInstallerDetails={nativeInstallerDetails}
            localApkDetails={localApkDetails}
            nativeLogsList={nativeLogsList}
            title="Copy Everything"
          />
          {isWebDesktop && (
            <button
              onClick={() => {
                console.log("BUTTON PRESSED:\nBack to Developer Panel");
                addJsLog("BUTTON PRESSED:\nBack to Developer Panel");
                onBack();
              }}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}
            >
              Back
            </button>
          )}
        </div>
      </header>

      {/* Main Collapsible Sections */}
      <main className="max-w-4xl w-full mx-auto space-y-4 pt-6 pb-[calc(var(--content-bottom-pad,96px)+20px)] flex-1 flex flex-col">
        
        {/* System Health Dashboard Cards Section */}
        <div style={{ padding: '0 20px', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-secondary, rgba(255,255,255,0.6))', margin: 0, fontFamily: "'Outfit', 'Inter', sans-serif" }}>System Health</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }} className="dev-grid-4col">
            {/* App Version */}
            <div style={{
              background: 'var(--app-surface-high, #1c1c1e)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-secondary, rgba(255,255,255,0.6))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>terminal</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', 'Inter', sans-serif" }}>App Version</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary, #fff)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>v{APP_VERSION}</div>
            </div>

            {/* Android */}
            <div style={{
              background: 'var(--app-surface-high, #1c1c1e)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-secondary, rgba(255,255,255,0.6))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>android</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', 'Inter', sans-serif" }}>Android</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary, #fff)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>{otaDiagnostics?.androidVersion || '14.0'}</div>
            </div>

            {/* Alerts */}
            <div style={{
              background: 'var(--app-surface-high, #1c1c1e)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-secondary, rgba(255,255,255,0.6))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>report_problem</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', 'Inter', sans-serif" }}>Alerts</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', gap: 6, fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                <span style={{ color: errorCount > 0 ? 'var(--studio-error, #ee7d77)' : 'var(--c-text-primary, #fff)' }}>{errorCount} E</span>
                <span style={{ color: 'var(--c-text-secondary, rgba(255,255,255,0.6))', opacity: 0.5 }}>/</span>
                <span style={{ color: warningCount > 0 ? '#fb923c' : 'var(--c-text-primary, #fff)' }}>{warningCount} W</span>
              </div>
            </div>

            {/* Status */}
            <div style={{
              background: 'var(--app-surface-high, #1c1c1e)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-secondary, rgba(255,255,255,0.6))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>published_with_changes</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', 'Inter', sans-serif" }}>Status</span>
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--studio-accent-from, #679cff)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}>{otaState.updateState}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px' }} className="space-y-4">
        
        {/* 1. WORKFLOW TESTING COLLAPSIBLE */}
        <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsWorkflowTestingOpen(!isWorkflowTestingOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${isWorkflowTestingOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Workflow Testing
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Simulator Panel</span>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isWorkflowTestingOpen ? 'max-h-[8000px] opacity-100 border-t border-[#484848]/10' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            {isWorkflowTestingOpen && (
              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Trigger isolated, deterministic scenarios that execute the <strong>REAL</strong> production state machine by overriding local metadata providers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <ScenarioCard 
                    id="successful_update"
                    title="Successful Update"
                    description="Run a full mock updater sequence: Check -> Available -> Auto-confirm Apply -> Mock Download -> Verify -> Mock Success."
                    icon="check_circle"
                    colorClass="text-green-400"
                    action={() => startScenario('successful_update', runSuccessfulUpdateWorkflow)}
                    isActive={activeScenarioId === 'successful_update'}
                    duration={scenarioDurations.successful_update}
                  />

                  <ScenarioCard 
                    id="download_failure"
                    title="Download Failure"
                    description="Trigger an update check and force the download stage to fail with an HTTP retrieval connection exception."
                    icon="cloud_off"
                    colorClass="text-red-400"
                    action={() => startScenario('download_failure', runDownloadFailureWorkflow)}
                    isActive={activeScenarioId === 'download_failure'}
                    duration={scenarioDurations.download_failure}
                  />

                  <ScenarioCard 
                    id="verification_failure"
                    title="Verification Failure"
                    description="Simulate an update package with a checksum mismatch that fails verification before native installation."
                    icon="gpp_bad"
                    colorClass="text-red-400"
                    action={() => startScenario('verification_failure', runVerificationFailureWorkflow)}
                    isActive={activeScenarioId === 'verification_failure'}
                    duration={scenarioDurations.verification_failure}
                  />

                  <ScenarioCard 
                    id="package_installer"
                    title="PackageInstaller Dialog"
                    description="Pause the installation sequence at the dialog confirmation screen to test custom native listener state transitions."
                    icon="visibility"
                    colorClass="text-purple-400"
                    action={() => startScenario('package_installer', runPackageInstallerWorkflow)}
                    isActive={activeScenarioId === 'package_installer'}
                    duration={scenarioDurations.package_installer}
                    inlineActions={
                      <div className="flex flex-col gap-1 w-full pt-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); simulateSuccessInstall(); }}
                          className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-1 rounded text-[9px] font-bold font-mono transition-all cursor-pointer outline-none w-full"
                        >
                          Simulate Install Success
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); simulateFailedInstall(); }}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 rounded text-[9px] font-bold font-mono transition-all cursor-pointer outline-none w-full"
                        >
                          Simulate Install Fail
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); simulateCancelledInstall(); }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-1 rounded text-[9px] font-bold font-mono transition-all cursor-pointer outline-none w-full"
                        >
                          Simulate User Cancel
                        </button>
                      </div>
                    }
                  />

                  <ScenarioCard 
                    id="installation_failure"
                    title="Installation Failure"
                    description="Simulate a transaction error during native PackageInstaller execution, triggering recovery pathways."
                    icon="cancel"
                    colorClass="text-red-400"
                    action={() => startScenario('installation_failure', runInstallationFailureWorkflow)}
                    isActive={activeScenarioId === 'installation_failure'}
                    duration={scenarioDurations.installation_failure}
                  />

                  <ScenarioCard 
                    id="reset_workflow"
                    title="Reset Workflow"
                    description="Clear all simulator overrides, wipe active session cache configurations, and reset update status to IDLE."
                    icon="restart_alt"
                    colorClass="text-zinc-400"
                    action={runResetWorkflow}
                    isActive={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. FLIGHT RECORDER COLLAPSIBLE */}
        <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsFlightRecorderOpen(!isFlightRecorderOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${isFlightRecorderOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Flight Recorder
              </h3>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400" onClick={e => e.stopPropagation()}>
              <span>LOGS: <strong className="text-white">{UpdaterFlightRecorder.getEvents().length}</strong></span>
              <span className="hidden sm:inline border-l border-[#484848]/20 pl-3">NEWEST: <strong className="text-[#8b5cf6]">{UpdaterFlightRecorder.getEvents().slice(-1)[0]?.eventType || 'NONE'}</strong></span>
              <div className="flex items-center gap-2 border-l border-[#484848]/20 pl-3">
                <button 
                  onClick={handleCopyFlightRecorderLogs}
                  className="bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-[#c084fc] px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer outline-none"
                >
                  Copy Logs
                </button>
                <button 
                  onClick={() => { UpdaterFlightRecorder.clear(); triggerRefresh(); showToast('Logs wiped'); }}
                  className="bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer outline-none"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>

          {/* Collapsed view: Only show latest event */}
          {!isFlightRecorderOpen && UpdaterFlightRecorder.getEvents().length > 0 && (
            <div className="px-6 pb-4 pt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-[#484848]/5">
              <div className="flex items-center gap-2 truncate">
                <span className="text-zinc-500">LATEST EVENT:</span>
                <span className="text-[#c084fc] font-bold">{UpdaterFlightRecorder.getEvents().slice(-1)[0]?.eventType}</span>
                <span className="text-zinc-500 truncate">({UpdaterFlightRecorder.getEvents().slice(-1)[0]?.reason})</span>
              </div>
              <span className="text-zinc-500 shrink-0">{new Date(UpdaterFlightRecorder.getEvents().slice(-1)[0]?.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFlightRecorderOpen ? 'max-h-[8000px] opacity-100 border-t border-[#484848]/10' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            {isFlightRecorderOpen && (
              <div className="p-6 space-y-4">
                {UpdaterFlightRecorder.getEvents().length > 0 ? (
                  <div className="border border-[#484848]/10 rounded-xl overflow-hidden font-mono text-[10px] bg-black/40 max-h-[450px] overflow-y-auto p-4 space-y-3 divide-y divide-[#484848]/15">
                    {UpdaterFlightRecorder.getEvents().slice().reverse().map((e, idx) => {
                      const isErr = !!e.error || e.warning === 'INSTALL_FAILED' || e.warning === 'CHECK_BLOCKED_INSTALLATION_LOCKED';
                      const isWarn = !!e.warning && !isErr;
                      const isSuccess = e.eventType === 'checkForUpdateAllowed' || e.newState === 'INSTALL_SUCCESS';
                      
                      return (
                        <div key={idx} className="pt-3 first:pt-0 flex flex-col gap-1.5 border-t border-[#484848]/15">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                isErr ? 'bg-red-500 animate-pulse' : isWarn ? 'bg-yellow-500' : isSuccess ? 'bg-green-500' : 'bg-purple-500'
                              }`} />
                              <span className="font-bold text-[#e7e5e4] text-xs">
                                {e.eventType}
                              </span>
                            </div>
                            <span className="text-on-surface-variant text-[9px] font-bold bg-[#1c1c1e] px-2 py-0.5 rounded border border-outline-variant/10">
                              {new Date(e.timestamp).toLocaleTimeString()} {e.duration ? `(${e.duration}ms)` : ''}
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
                  <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant font-mono">
                    No Flight Recorder logs in storage buffer.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. RUNTIME & SESSION COLLAPSIBLE */}
        <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsRuntimeSessionOpen(!isRuntimeSessionOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${isRuntimeSessionOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Runtime &amp; Session
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Telemetry stats</span>
          </div>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isRuntimeSessionOpen ? 'max-h-[8000px] opacity-100 border-t border-[#484848]/10' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            {isRuntimeSessionOpen && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Group 1: Session */}
                  <div className="bg-black/35 border border-[#484848]/15 rounded-xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-[#484848]/10 pb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">timeline</span>
                      Session
                    </h4>
                    <div className="space-y-2.5 text-[11px] font-mono">
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Session ID</span>
                        <span className="text-white font-bold break-all leading-relaxed block">{activeUpdateSession?.sessionId || 'None'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Current State</span>
                        <span className="text-white font-bold">{otaState.updateState}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Previous State</span>
                        <span className="text-white font-bold">{transitionHistory.slice(-1)[0]?.from || 'None'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Current Transition</span>
                        <span className="text-white font-bold leading-relaxed block">{transitionHistory.slice(-1)[0] ? `${transitionHistory.slice(-1)[0].from} -> ${transitionHistory.slice(-1)[0].to}` : 'None'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Pipeline Duration</span>
                        <span className="text-white font-bold">
                          {activePipelineContext?.pipelineStartTime ? `${Math.round((Date.now() - activePipelineContext.pipelineStartTime) / 1000)}s` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Update */}
                  <div className="bg-black/35 border border-[#484848]/15 rounded-xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-[#484848]/10 pb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">download</span>
                      Update
                    </h4>
                    <div className="space-y-2.5 text-[11px] font-mono">
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Download Progress</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#8b5cf6] h-full rounded-full transition-all" style={{ width: `${(otaState.progress * 100).toFixed(0)}%` }} />
                          </div>
                          <span className="text-white font-bold text-[10px]">{(otaState.progress * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Verification Status</span>
                        <span className={`font-bold ${localApkDetails?.isValidApk ? 'text-green-400' : 'text-zinc-400'}`}>
                          {localApkDetails?.isValidApk ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">PackageInstaller Status</span>
                        <span className="text-white font-bold">{nativeInstallerDetails?.sessionState || 'IDLE'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Recovery Status</span>
                        <span className={`font-bold ${otaState.recoveryMode ? 'text-yellow-400' : 'text-zinc-400'}`}>
                          {otaState.recoveryMode ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Update Status</span>
                        <span className="text-white font-bold">{otaState.updateState}</span>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Device */}
                  <div className="bg-black/35 border border-[#484848]/15 rounded-xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-[#484848]/10 pb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">phone_android</span>
                      Device
                    </h4>
                    <div className="space-y-2.5 text-[11px] font-mono">
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Network Connection</span>
                        <span className="text-white font-bold">{nativeDeviceInfo?.networkState || otaDiagnostics?.networkState || 'CONNECTED'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Storage Capacity</span>
                        <span className="text-white font-bold leading-normal block">{nativeDeviceInfo?.storageAvailable || otaDiagnostics?.storageAvailable || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Battery Status</span>
                        <span className="text-white font-bold">{nativeDeviceInfo?.battery !== undefined ? `${nativeDeviceInfo.battery}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Group 4: Performance */}
                  <div className="bg-black/35 border border-[#484848]/15 rounded-xl p-4.5 space-y-3.5">
                    <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-[#484848]/10 pb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">insights</span>
                      Performance
                    </h4>
                    <div className="space-y-2.5 text-[11px] font-mono">
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">CPU Usage</span>
                        <span className="text-white font-bold">AVG: {PerformanceProfiler.getInstance().getMetrics().cpuAverage}% | PEAK: {PerformanceProfiler.getInstance().getMetrics().cpuPeak}%</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Memory Overhead</span>
                        <span className="text-white font-bold">{PerformanceProfiler.getInstance().getMetrics().memoryAverage}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">JS Thread Delay</span>
                        <span className="text-white font-bold">{PerformanceProfiler.getInstance().getMetrics().jsThreadAverage} ms</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">UI Thread Paint</span>
                        <span className="text-white font-bold">{PerformanceProfiler.getInstance().getMetrics().uiThreadAverage} ms</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[8px] uppercase font-bold leading-none mb-1">Frame Pacing (FPS)</span>
                        <span className={`text-xs font-bold ${fps > 55 ? 'text-green-400' : fps > 40 ? 'text-yellow-400' : 'text-red-400'}`}>{fps} FPS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. ADVANCED DIAGNOSTICS COLLAPSIBLE */}
        <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsAdvancedDiagnosticsOpen(!isAdvancedDiagnosticsOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${isAdvancedDiagnosticsOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Advanced Diagnostics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Engineering logs</span>
          </div>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isAdvancedDiagnosticsOpen ? 'max-h-[8000px] opacity-100 border-t border-[#484848]/10' : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            {isAdvancedDiagnosticsOpen && (
              <div className="p-6 space-y-4">
                
                {/* Advanced mini-tab select */}
                <div className="flex border-b border-[#484848]/10 font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
                  <button 
                    onClick={() => setAdvTab('fsm')}
                    className={`px-4 py-2 border-b-2 transition-all cursor-pointer bg-transparent outline-none ${advTab === 'fsm' ? 'border-[#8b5cf6] text-[#c084fc]' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    FSM &amp; Locks
                  </button>
                  <button 
                    onClick={() => setAdvTab('native')}
                    className={`px-4 py-2 border-b-2 transition-all cursor-pointer bg-transparent outline-none ${advTab === 'native' ? 'border-[#8b5cf6] text-[#c084fc]' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    Callbacks Console
                  </button>
                  <button 
                    onClick={() => setAdvTab('config')}
                    className={`px-4 py-2 border-b-2 transition-all cursor-pointer bg-transparent outline-none ${advTab === 'config' ? 'border-[#8b5cf6] text-[#c084fc]' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    Config &amp; Cache
                  </button>
                </div>

                {/* Sub Tab Contents */}
                {advTab === 'fsm' && (
                  <div className="space-y-4 animate-fadeIn">
                    <StateMachineVisualizer />
                    
                    <div className="bg-black/40 border border-[#484848]/15 rounded-xl p-4 space-y-3 font-mono text-[10px]">
                      <h5 className="font-bold text-xs text-[#e7e5e4]">Locks &amp; Safety Guards</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                        <div>INSTALLATION LOCK: <strong className="text-white">{isInstallationLocked() ? 'LOCKED' : 'UNLOCKED'}</strong></div>
                        <div>POST-INSTALL ACTIVE: <strong className="text-white">{isPostInstallSessionActive() ? 'ACTIVE' : 'INACTIVE'}</strong></div>
                        <div>PROCESS BOOT KEY: <strong className="text-white">{localStorage.getItem('studio:processBootId') || 'N/A'}</strong></div>
                        <div>RECOVERY IN_PROGRESS: <strong className="text-white">{otaState.recoveryMode ? 'YES' : 'NO'}</strong></div>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-[#484848]/15 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-xs text-[#e7e5e4] font-headline">Transition Attempts Log</h5>
                      {transitionHistory.length > 0 ? (
                        <div className="font-mono text-[10px] text-zinc-300 space-y-1 divide-y divide-[#484848]/10 max-h-48 overflow-y-auto">
                          {transitionHistory.slice().reverse().map((t, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between items-center">
                              <span className="text-[#a855f7] font-bold">{t.from} &rarr; {t.to}</span>
                              <span className="text-zinc-500 truncate max-w-[60%]">{t.reason}</span>
                              <span className="text-zinc-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 font-mono">No transition events logged this session.</p>
                      )}
                    </div>
                  </div>
                )}

                {advTab === 'native' && (
                  <div className="space-y-4 animate-fadeIn">
                    <LiveConsole 
                      nativeLogsList={nativeLogsList}
                      clearNativeLogsList={() => setNativeLogsList([])}
                      showToast={showToast}
                      addJsLog={addJsLog}
                    />

                    {nativeInstallerDetails && (
                      <div className="bg-black/40 border border-[#484848]/15 rounded-xl p-4 space-y-3">
                        <h5 className="font-bold text-xs text-[#e7e5e4] font-headline">Extended PackageInstaller Telemetry</h5>
                        <pre className="bg-black/60 border border-[#484848]/15 rounded-xl p-4 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-56">
                          {JSON.stringify(nativeInstallerDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {advTab === 'config' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-black/40 border border-[#484848]/15 rounded-xl p-4 space-y-3 font-mono text-[10px] text-zinc-300">
                      <h5 className="font-bold text-xs text-[#e7e5e4]">Capacitor Updater Configuration</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>IS NATIVE SHELL: <strong className="text-white">{isNative() ? 'TRUE' : 'FALSE'}</strong></div>
                        <div>ANDROID APK CHANNEL: <strong className="text-white">{shouldUseAndroidApkUpdater() ? 'ENABLED' : 'DISABLED'}</strong></div>
                        <div>DOWNLOADER API: <strong className="text-white">CapacitorHttp (Fetch)</strong></div>
                        <div>OTA LISTENERS BINDING: <strong className="text-white">Active</strong></div>
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      </main>

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border border-[#484848]/25 px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xl z-[9999] text-white flex items-center gap-2 animate-bounce font-mono">
          <span className="material-symbols-outlined text-[16px] text-green-400">done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// Compact helper components declared outside the main view to keep code clean and performant

function ScenarioCard({
  id,
  title,
  description,
  icon,
  colorClass,
  action,
  isActive,
  duration,
  currentState,
  inlineActions
}: {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  action: () => void;
  isActive: boolean;
  duration?: number;
  currentState?: string;
  inlineActions?: React.ReactNode;
}) {
  return (
    <div 
      onClick={!isActive ? action : undefined}
      className={`relative flex flex-col justify-between bg-black/40 border border-[#484848]/15 hover:border-[#8b5cf6]/40 p-4 rounded-xl transition-all text-left outline-none min-h-[145px] select-none ${
        isActive ? 'ring-1 ring-[#8b5cf6]' : 'cursor-pointer active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start justify-between w-full">
        <div className={`flex items-center gap-2 ${colorClass}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          <span className="text-xs font-bold font-headline">{title}</span>
        </div>
        {isActive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </div>
      <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed flex-1">
        {description}
      </p>
      
      <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-zinc-500 border-t border-[#484848]/10 pt-2 w-full">
        <div>
          <span>STATE: </span>
          <span className={isActive ? 'text-green-400 font-bold animate-pulse' : 'text-zinc-400'}>
            {isActive ? 'RUNNING' : (currentState || 'IDLE')}
          </span>
        </div>
        {duration !== undefined && duration > 0 && (
          <div>
            <span>TIME: </span>
            <span className="text-[#8b5cf6] font-bold">{(duration / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
      {isActive && inlineActions && (
        <div className="mt-3.5 space-y-1.5 w-full">
          {inlineActions}
        </div>
      )}
    </div>
  );
}

// Start deterministic scenario workflow
async function startScenario(id: string, workflowAction: () => Promise<void> | void) {
  try {
    await workflowAction();
  } catch (err) {
    console.error(`Workflow scenario ${id} failed:`, err);
  }
}
