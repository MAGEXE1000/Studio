import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  isNative, 
  globalUpdateState, 
  updaterSimulation, 
  triggerSimulatedStatus, 
  resetAppUpdateState, 
  applyUpdate, 
  downloadUpdate, 
  checkForUpdate, 
  stateListeners, 
  UpdaterFlightRecorder, 
  isInstallationLocked, 
  isPostInstallSessionActive, 
  shouldUseAndroidApkUpdater, 
  useIsWebDesktop,
  getLogs,
  getErrors,
  activeUpdateSession,
  activePipelineContext,
  updateDiagnostics,
  PerformanceProfiler,
  getTransitionHistory,
  getRejectedTransitions,
  clearSimulationLogs,
  addJsLog,
  getUpdateSessions,
  getActiveSession,
  updateDebugLogs,
  useChordStore,
  useNavigationStore,
  APP_VERSION
} from '@workspace/studio-core';
import { CopyDropdown } from '../devtools/DevToolsDashboard';
import { copyToClipboard } from './centralizedClipboard';
import { generateCopyEverythingReport } from './diagnosticsGenerator';

interface Props {
  onBack: () => void;
}

export default function UpdaterDiagnosticsPage({ onBack }: Props) {
  const settings = useChordStore(s => s.settings);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isWebDesktop = useIsWebDesktop();

  // Increment render count
  if (updateDebugLogs) {
    updateDebugLogs.renderCount = (updateDebugLogs.renderCount || 0) + 1;
    if (typeof window !== 'undefined') {
      updateDebugLogs.paintCount = performance.getEntriesByType('paint').length;
    }
  }

  React.useLayoutEffect(() => {
    if (updateDebugLogs) {
      updateDebugLogs.layoutCount = (updateDebugLogs.layoutCount || 0) + 1;
    }
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshCount(prev => prev + 1), []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  // Persistent collapse states
  const [secOverviewOpen, setSecOverviewOpen] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('studio:diag_sec_overview') !== 'false' : true;
  });
  const [secTestingOpen, setSecTestingOpen] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('studio:diag_sec_testing') !== 'false' : true;
  });
  const [secTimelineOpen, setSecTimelineOpen] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('studio:diag_sec_timeline') !== 'false' : true;
  });
  const [secDiagnosticsOpen, setSecDiagnosticsOpen] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('studio:diag_sec_diagnostics') !== 'false' : true;
  });

  const toggleSection = (key: string, current: boolean, setter: (val: boolean) => void) => {
    const next = !current;
    setter(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`studio:diag_sec_${key}`, String(next));
    }
  };

  const [simActive, setSimActive] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true';
  });

  const [otaState, setOtaState] = useState(globalUpdateState);
  const [fps, setFps] = useState(60);

  // FPS tracker
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animFrameId: number;

    const tick = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      animFrameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Global update execution scenario status
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioDurations, setScenarioDurations] = useState<Record<string, number>>({});
  const scenarioTimerRef = useRef<any>(null);

  // Subscribe to state machine transitions to drive simulation
  useEffect(() => {
    const listener = (newState: any) => {
      setOtaState(newState);
      const isSim = typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true';
      setSimActive(isSim);
      triggerRefresh();

      if (newState.updateState === 'INSTALL_SUCCESS' || newState.updateState === 'INSTALL_FAILED') {
        setActiveScenarioId(null);
        if (scenarioTimerRef.current) {
          clearInterval(scenarioTimerRef.current);
        }
      }

      // Auto-progress simulation workflow steps
      if (updaterSimulation.runWorkflowActive && newState.updateState === 'UPDATE_AVAILABLE') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalUpdateState.updateState === 'UPDATE_AVAILABLE') {
            addJsLog('[Simulate Workflow] Auto-triggering downloadUpdate...');
            downloadUpdate('Simulation: Run Workflow').catch((e) => {
              console.error('Simulated downloadUpdate failed:', e);
            });
          }
        }, 1200);
      }

      if (updaterSimulation.runWorkflowActive && newState.updateState === 'WAITING_USER_CONFIRMATION') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalUpdateState.updateState === 'WAITING_USER_CONFIRMATION') {
            addJsLog('[Simulate Workflow] Auto-triggering applyUpdate...');
            applyUpdate('Simulation: Run Workflow').catch((e) => {
              console.error('Simulated applyUpdate failed:', e);
            });
          }
        }, 1200);
      }

      if (updaterSimulation.runWorkflowActive && newState.updateState === 'PACKAGEINSTALLER_VISIBLE') {
        setTimeout(() => {
          if (updaterSimulation.runWorkflowActive && globalUpdateState.updateState === 'PACKAGEINSTALLER_VISIBLE') {
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
        }, 1200);
      }
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
      if (scenarioTimerRef.current) {
        clearInterval(scenarioTimerRef.current);
      }
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

  const startScenario = (id: string, workflowAction: () => Promise<void>) => {
    setActiveScenarioId(id);
    setScenarioDurations(prev => ({ ...prev, [id]: 0 }));
    if (scenarioTimerRef.current) {
      clearInterval(scenarioTimerRef.current);
    }
    const startTime = Date.now();
    scenarioTimerRef.current = setInterval(() => {
      setScenarioDurations(prev => ({ ...prev, [id]: Date.now() - startTime }));
    }, 100);

    workflowAction().catch(err => {
      console.error(`Workflow scenario ${id} failed:`, err);
      showToast(`Scenario failed: ${err.message || String(err)}`);
      setActiveScenarioId(null);
      clearInterval(scenarioTimerRef.current);
    });
  };

  const runSuccessfulUpdateWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forceInstallSuccess = true;
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
    await checkForUpdate(true, 'dev_tools', 'Simulation: Verification Mismatch');
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
    await checkForUpdate(true, 'dev_tools', 'Simulation: PackageInstaller Dialog');
    triggerRefresh();
  };

  const runRecoveryWorkflow = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forceSignatureMismatch = true;
    await checkForUpdate(true, 'dev_tools', 'Simulation: Signature Mismatch Recovery');
    triggerRefresh();
  };

  const runResetWorkflow = () => {
    localStorage.removeItem('studio:is_simulation_active');
    setSimActive(false);
    clearOverrides();
    resetAppUpdateState();
    setActiveScenarioId(null);
    if (scenarioTimerRef.current) {
      clearInterval(scenarioTimerRef.current);
    }
    showToast('Workflow simulation stopped & reset to IDLE');
    triggerRefresh();
  };

  const simulateSuccessInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = true;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = false;
    
    // Simulate installer states
    setTimeout(() => triggerSimulatedStatus(-2, 'installing_start'), 100);
    for (let i = 1; i <= 10; i++) {
      const progress = i / 10;
      setTimeout(() => {
        triggerSimulatedStatus(-3, progress > 0.9 ? 'Finalizing installation...' : 'Optimizing system packages...', progress);
      }, 100 + i * 150);
    }
    setTimeout(() => {
      triggerSimulatedStatus(0, 'STATUS_SUCCESS');
      showToast('Simulated Success Installation Complete');
      triggerRefresh();
    }, 1800);
  };

  const simulateFailedInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = true;
    updaterSimulation.forceUserCancel = false;
    triggerSimulatedStatus(1, 'STATUS_FAILURE');
    showToast('Simulated Installation Failed');
    triggerRefresh();
  };

  const simulateCancelledInstall = () => {
    updaterSimulation.forcePendingUserAction = false;
    updaterSimulation.forceInstallSuccess = false;
    updaterSimulation.forceInstallFailure = false;
    updaterSimulation.forceUserCancel = true;
    triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
    showToast('Simulated Installation Cancelled');
    triggerRefresh();
  };

  // Section 3: Live Timeline States
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'transitions' | 'errors' | 'native' | 'lifecycle'>('all');
  const [timelinePaused, setTimelinePaused] = useState(false);
  const [timelineAutoScroll, setTimelineAutoScroll] = useState(true);
  const timelineViewportRef = useRef<HTMLDivElement>(null);

  // Group events by session ID and capture logs
  const rawFlightEvents = UpdaterFlightRecorder.getEvents();
  const cachedTimelineLogs = useMemo(() => {
    const list: Array<{ timestamp: number; sessionId: string | null; type: 'transition' | 'error' | 'native' | 'lifecycle'; text: string; details?: string; severity?: string; count?: number }> = [];

    getTransitionHistory().forEach(t => {
      list.push({
        timestamp: t.timestamp,
        sessionId: otaState.sessionId ? String(otaState.sessionId) : null,
        type: 'transition',
        text: `State: ${t.from} → ${t.to}`,
        details: `Caller: ${t.caller} | Reason: ${t.reason} ${t.invalid ? '(INVALID)' : ''}`
      });
    });

    getRejectedTransitions().forEach(t => {
      list.push({
        timestamp: t.timestamp,
        sessionId: otaState.sessionId ? String(otaState.sessionId) : null,
        type: 'error',
        text: `FSM Invariant Violation: Transition Rejected`,
        details: `From: ${t.from} → Attempted: ${t.attempted} | Reason: ${t.reason}`
      });
    });

    rawFlightEvents.forEach(e => {
      if (e.eventType === 'transitionToState') return; // Skip duplicate transition logs
      let type: 'transition' | 'error' | 'native' | 'lifecycle' = 'lifecycle';
      if (e.severity === 'ERROR' || e.severity === 'FATAL' || e.error) type = 'error';
      else if (e.thread === 'native' || e.eventType.toLowerCase().includes('installer')) type = 'native';

      list.push({
        timestamp: e.timestamp,
        sessionId: e.sessionId,
        type,
        text: e.eventType,
        details: e.reason || e.details,
        severity: e.severity,
        count: e.count
      });
    });

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [otaState.sessionId, rawFlightEvents]);

  // Keep a frozen snapshot of timeline if paused
  const [frozenTimeline, setFrozenTimeline] = useState<typeof cachedTimelineLogs>([]);
  const activeTimelineList = timelinePaused ? frozenTimeline : cachedTimelineLogs;

  useEffect(() => {
    if (!timelinePaused) {
      setFrozenTimeline(cachedTimelineLogs);
    }
  }, [cachedTimelineLogs, timelinePaused]);

  // Apply filters and searches to active timeline list
  const filteredTimeline = useMemo(() => {
    let list = activeTimelineList;

    if (timelineFilter === 'transitions') {
      list = list.filter(e => e.type === 'transition');
    } else if (timelineFilter === 'errors') {
      list = list.filter(e => e.type === 'error' || e.severity === 'ERROR' || e.severity === 'FATAL');
    } else if (timelineFilter === 'native') {
      list = list.filter(e => e.type === 'native');
    } else if (timelineFilter === 'lifecycle') {
      list = list.filter(e => e.type === 'lifecycle');
    }

    if (timelineSearch.trim() !== '') {
      const q = timelineSearch.toLowerCase();
      list = list.filter(e => e.text.toLowerCase().includes(q) || (e.details && e.details.toLowerCase().includes(q)));
    }

    return list;
  }, [activeTimelineList, timelineFilter, timelineSearch]);

  // Group filtered timeline events by sessionId
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof filteredTimeline> = {};
    filteredTimeline.forEach(e => {
      const sId = e.sessionId || 'Global / Startup';
      if (!groups[sId]) groups[sId] = [];
      groups[sId].push(e);
    });
    return groups;
  }, [filteredTimeline]);

  // Scroll to bottom of timeline viewport
  useEffect(() => {
    if (timelineAutoScroll && timelineViewportRef.current && !timelinePaused) {
      timelineViewportRef.current.scrollTop = timelineViewportRef.current.scrollHeight;
    }
  }, [filteredTimeline, timelineAutoScroll, timelinePaused]);

  const copyTimelineMarkdown = () => {
    if (filteredTimeline.length === 0) {
      showToast('Timeline is empty');
      return;
    }
    let md = `# Updater Diagnostics Live Timeline\n*Generated: ${new Date().toLocaleString()}*\n\n`;
    Object.entries(groupedSessions).forEach(([sId, events]) => {
      md += `## Session: ${sId}\n\n`;
      md += `| Timestamp | Type | Event | Description |\n`;
      md += `|---|---|---|---|\n`;
      events.forEach(e => {
        const timeStr = new Date(e.timestamp).toLocaleTimeString();
        md += `| ${timeStr} | ${e.type.toUpperCase()} | ${e.text} | ${e.details || ''} |\n`;
      });
      md += `\n`;
    });

    copyToClipboard(md, 'Timeline Markdown').then(msg => showToast(msg));
  };

  const exportTimelineJson = () => {
    try {
      const data = JSON.stringify(filteredTimeline, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `updater-diagnostics-timeline-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Timeline exported successfully');
    } catch (err: any) {
      showToast('Export failed: ' + err.message);
    }
  };

  const handleCopyEverything = async () => {
    try {
      const report = generateCopyEverythingReport(null, null, null, getLogs() || []);
      await navigator.clipboard.writeText(report);
      showToast('Comprehensive report copied to clipboard!');
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  return (
    <div 
      ref={scrollRef} 
      style={{ background: '#000', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }} 
      className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-none selection:bg-[#8b5cf6]/30 selection:text-white"
    >
      {/* Sticky Premium Toolbar Header */}
      <header
        style={{
          padding: isWebDesktop ? '16px 24px' : '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(10, 10, 12, 0.85)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isWebDesktop ? 16 : 10 }}>
          <button
            onClick={onBack}
            className="btn-smooth hover:bg-white/5 active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '999px',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8b5cf6',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: isWebDesktop ? '20px' : '16px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }} className="font-headline">
              Updater Diagnostics
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: isWebDesktop ? '11px' : '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }}>
              OTA Operations, Pipeline Verification &amp; Simulation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleCopyEverything}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.15s ease'
            }}
            className="hover:scale-[1.03] active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
            <span>Copy Everything</span>
          </button>
        </div>
      </header>

      {/* Main 자연스럽게 스크롤되는 Container */}
      <main className="flex-1 p-5 md:p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* 1. OVERVIEW COLLAPSIBLE SECTION */}
        <section className="border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('overview', secOverviewOpen, setSecOverviewOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${secOverviewOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Section 1: Overview
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${simActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                {simActive ? 'Simulated Pipeline' : 'Production Active'}
              </span>
            </div>
          </div>

          {secOverviewOpen && (
            <div className="p-6 border-t border-white/5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Updater Status</span>
                  <span className="text-sm font-bold text-white block">
                    {isInstallationLocked() ? '🔒 Blocked (Locked)' : '🔓 Available'}
                  </span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Current Version</span>
                  <span className="text-sm font-bold text-white block font-mono">v{APP_VERSION}</span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Remote Version Target</span>
                  <span className="text-sm font-bold text-[#8b5cf6] block font-mono">{otaState.remoteVersion || 'Check Pending'}</span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">FSM State Machine</span>
                  <span className="text-sm font-bold text-white block font-mono">{otaState.updateState}</span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Installation Lock</span>
                  <span className="text-sm font-bold text-white block">
                    {isPostInstallSessionActive() ? 'Holding Session' : 'Released'}
                  </span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Current Session ID</span>
                  <span className="text-sm font-bold text-white block font-mono truncate">{otaState.sessionId || 'None'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => checkForUpdate(false, 'dev_tools', 'Manual Check')}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition-all outline-none"
                >
                  Check Update
                </button>
                <button
                  onClick={() => {
                    toggleSection('testing', false, setSecTestingOpen);
                    setTimeout(() => {
                      const el = document.getElementById('workflow-testing-anchor');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="px-4 py-2.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-xl hover:bg-[#8b5cf6]/20 text-xs font-bold text-[#a78bfa] transition-all outline-none"
                >
                  Configure Workflow Testing
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Anchor for scroll focusing */}
        <div id="workflow-testing-anchor" />

        {/* 2. WORKFLOW TESTING COLLAPSIBLE SECTION */}
        <section className="border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('testing', secTestingOpen, setSecTestingOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${secTestingOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Section 2: Workflow Testing
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Simulation Sandbox</span>
          </div>

          {secTestingOpen && (
            <div className="p-6 border-t border-white/5 space-y-6">
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Execute automated, deterministic updates through the **REAL** production state machine. All external platform side-effects (APK downloading, native installer broadcasts, shell commands) are safely mocked.
              </p>

              {/* Simulation Mode Toggle Card */}
              <div className="flex items-center justify-between bg-white/2 border border-white/5 p-4 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white font-headline">Simulated Test Mode</span>
                  <span className="text-[10px] text-zinc-500">Enable to route state steps through simulation safety adapters.</span>
                </div>
                <div className="flex gap-2">
                  {!simActive ? (
                    <button 
                      onClick={() => {
                        localStorage.setItem('studio:is_simulation_active', 'true');
                        setSimActive(true);
                        resetAppUpdateState();
                        showToast('Simulation state guard armed.');
                      }}
                      className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/25 text-xs font-bold transition-all outline-none"
                    >
                      Enable Simulation
                    </button>
                  ) : (
                    <button 
                      onClick={runResetWorkflow}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/25 text-xs font-bold transition-all outline-none"
                    >
                      Disable Simulation
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Simulation Workflows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <ScenarioCard 
                  id="successful_update"
                  title="Run Complete Workflow"
                  description="Starts checking, discovers update available, downloads APK chunks, verifies checksum, and triggers simulated installer confirmation success."
                  icon="check_circle"
                  colorClass="text-green-400"
                  action={() => startScenario('successful_update', runSuccessfulUpdateWorkflow)}
                  isActive={activeScenarioId === 'successful_update'}
                  duration={scenarioDurations.successful_update}
                />

                <ScenarioCard 
                  id="download_failure"
                  title="Run Download Test"
                  description="Triggers the pipeline but intercepts the download manager to reject downloads with an HTTP connection timeout failure."
                  icon="cloud_off"
                  colorClass="text-red-400"
                  action={() => startScenario('download_failure', runDownloadFailureWorkflow)}
                  isActive={activeScenarioId === 'download_failure'}
                  duration={scenarioDurations.download_failure}
                />

                <ScenarioCard 
                  id="verification_failure"
                  title="Run Verification Test"
                  description="Completes download successfully but triggers a checksum hashing verification signature mismatch, blocking install."
                  icon="gpp_bad"
                  colorClass="text-red-400"
                  action={() => startScenario('verification_failure', runVerificationFailureWorkflow)}
                  isActive={activeScenarioId === 'verification_failure'}
                  duration={scenarioDurations.verification_failure}
                />

                <ScenarioCard 
                  id="package_installer"
                  title="Run Installation Test"
                  description="Brings the state to the PackageInstaller visible phase, holding for simulated success, fail, or user cancellations."
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
                        Simulate Install Failure
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
                  id="recovery_mismatch"
                  title="Run Recovery Test"
                  description="Forces update checking to fail signature requirements, running cleanup and re-initiating auto-recovery checking loop."
                  icon="healing"
                  colorClass="text-amber-400"
                  action={() => startScenario('recovery_mismatch', runRecoveryWorkflow)}
                  isActive={activeScenarioId === 'recovery_mismatch'}
                  duration={scenarioDurations.recovery_mismatch}
                />

                <ScenarioCard 
                  id="reset_workflow"
                  title="Reset Workflow"
                  description="Clear active variables, wipe memory buffers, reset OTA updates, and restore to IDLE state."
                  icon="restart_alt"
                  colorClass="text-zinc-400"
                  action={runResetWorkflow}
                  isActive={false}
                />
              </div>

              {/* Throttling and Cleanup Controls */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    updaterSimulation.simulateDownloadThrottling = !updaterSimulation.simulateDownloadThrottling;
                    showToast(updaterSimulation.simulateDownloadThrottling ? 'Download Throttling Active' : 'Download Throttling Disabled');
                    triggerRefresh();
                  }}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all outline-none ${
                    updaterSimulation.simulateDownloadThrottling 
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                      : 'bg-black border-white/10 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {updaterSimulation.simulateDownloadThrottling ? 'Speed: Throttled (2G/3G)' : 'Speed: Full Downloader'}
                </button>
                <button 
                  onClick={clearOverrides}
                  className="px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white font-bold text-xs hover:bg-white/5 transition-all outline-none"
                >
                  Clear Scenario Overrides
                </button>
                <button 
                  onClick={() => {
                    clearSimulationLogs();
                    showToast('Timeline simulation history wiped');
                    triggerRefresh();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-black border border-white/10 text-red-400 font-bold text-xs hover:bg-red-500/10 hover:border-red-500/20 transition-all outline-none"
                >
                  Clear Timelines Cache
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. LIVE TIMELINE COLLAPSIBLE SECTION */}
        <section className="border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('timeline', secTimelineOpen, setSecTimelineOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${secTimelineOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Section 3: Live Timeline
              </h3>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400" onClick={e => e.stopPropagation()}>
              <span>LOGS: <strong className="text-white">{filteredTimeline.length}</strong></span>
              <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                <button 
                  onClick={copyTimelineMarkdown}
                  className="bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-[#c084fc] px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer outline-none"
                >
                  Copy
                </button>
                <button 
                  onClick={exportTimelineJson}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer outline-none"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {secTimelineOpen && (
            <div className="p-6 border-t border-white/5 space-y-4">
              
              {/* Toolbar: Search & Filter Mode */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-black px-3 py-2 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-sm text-zinc-500">search</span>
                  <input 
                    className="bg-transparent border-none text-xs text-white placeholder:text-zinc-600 focus:ring-0 w-full font-mono outline-none" 
                    placeholder="Search transition details, caller stack, errors..." 
                    type="text"
                    value={timelineSearch}
                    onChange={e => setTimelineSearch(e.target.value)}
                  />
                  {timelineSearch && (
                    <button onClick={() => setTimelineSearch('')} className="text-zinc-500 hover:text-white">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {(['all', 'transitions', 'errors', 'native', 'lifecycle'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTimelineFilter(mode)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors outline-none whitespace-nowrap ${
                        timelineFilter === mode 
                          ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-white/2 border border-white/5 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport Control Panel */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimelinePaused(!timelinePaused)}
                    className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1 border outline-none ${
                      timelinePaused 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-zinc-800 border-white/5 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[10px]">{timelinePaused ? 'play_arrow' : 'pause'}</span>
                    {timelinePaused ? 'Resume Updates' : 'Pause Timeline'}
                  </button>
                  {timelinePaused && (
                    <span className="text-[10px] text-amber-400 font-mono animate-pulse">Updates Frozen</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Auto Scroll</span>
                  <button 
                    onClick={() => setTimelineAutoScroll(prev => !prev)}
                    className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors outline-none ${
                      timelineAutoScroll ? 'bg-[#8b5cf6]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      timelineAutoScroll ? 'translate-x-3' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Grouped Timelines View */}
              <div 
                ref={timelineViewportRef}
                className="bg-black border border-white/5 rounded-xl h-96 overflow-y-auto p-4 space-y-6 shadow-inner"
              >
                {Object.keys(groupedSessions).length === 0 ? (
                  <div className="text-zinc-600 text-center py-24 italic text-xs font-mono">
                    No timeline records available matching query filters.
                  </div>
                ) : (
                  Object.entries(groupedSessions).map(([sId, events]) => (
                    <div key={sId} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span className="text-[10px] font-mono text-[#8b5cf6] font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs">database</span>
                          Session ID: {sId}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 font-bold">
                          {events.length} events
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {events.map((e, idx) => {
                          const isErr = e.type === 'error' || e.severity === 'ERROR' || e.severity === 'FATAL';
                          const isTrans = e.type === 'transition';
                          const timeStr = new Date(e.timestamp).toLocaleTimeString();
                          
                          return (
                            <TimelineEventRow 
                              key={idx}
                              time={timeStr}
                              type={e.type}
                              text={e.text}
                              details={e.details}
                              isError={isErr}
                              isTransition={isTrans}
                              count={e.count}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* 4. ADVANCED DIAGNOSTICS & TELEMETRY COLLAPSIBLE SECTION */}
        <section className="border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300">
          <div 
            onClick={() => toggleSection('diagnostics', secDiagnosticsOpen, setSecDiagnosticsOpen)}
            className="flex items-center justify-between px-6 py-4.5 cursor-pointer hover:bg-white/3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[#8b5cf6] transition-transform duration-300 ${secDiagnosticsOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
              <h3 className="font-bold text-sm text-[#e7e5e4] tracking-wide font-headline">
                Section 4: Diagnostics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Hardware &amp; Engine Stats</span>
          </div>

          {secDiagnosticsOpen && (
            <div className="p-6 border-t border-white/5 space-y-6">
              
              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Device & OS */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                  <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-headline">
                    <span className="material-symbols-outlined text-xs">phone_android</span>
                    Environment
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Platform Target</span>
                      <span className="text-white font-bold">{isNative() ? 'Native Android' : 'Web Browser'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Network state</span>
                      <span className="text-white font-bold">{updateDiagnostics?.networkState || 'CONNECTED'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Storage available</span>
                      <span className="text-white font-bold">{updateDiagnostics?.storageAvailable || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* State Machine Variables */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                  <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-headline">
                    <span className="material-symbols-outlined text-xs">timeline</span>
                    OTA Engine
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">FSM Lock Status</span>
                      <span className={`font-bold ${isInstallationLocked() ? 'text-red-400' : 'text-green-400'}`}>
                        {isInstallationLocked() ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Post Install state</span>
                      <span className="text-white font-bold">{isPostInstallSessionActive() ? 'HOLDING' : 'RELEASED'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Consecutive Failures</span>
                      <span className="text-white font-bold">{globalUpdateState.consecutiveFailures}</span>
                    </div>
                  </div>
                </div>

                {/* Storage & Caches */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                  <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-headline">
                    <span className="material-symbols-outlined text-xs">database</span>
                    Storage &amp; Cache
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Cached APK Status</span>
                      <span className="text-white font-bold">{localStorage.getItem('studio:downloadedApkPath') ? 'PRESENT' : 'ABSENT'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">APK URL Endpoint</span>
                      <span className="text-white font-bold truncate block max-w-full" title={otaState.apkUrl || 'N/A'}>
                        {otaState.apkUrl ? 'Resolved' : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Recovery Mode</span>
                      <span className={`font-bold ${otaState.recoveryMode ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {otaState.recoveryMode ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance profile */}
                <div className="bg-white/2 border border-white/5 rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                  <h4 className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-headline">
                    <span className="material-symbols-outlined text-xs">insights</span>
                    Performance
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">JS Thread Delay</span>
                      <span className="text-white font-bold">{PerformanceProfiler.getInstance().getMetrics().jsThreadAverage} ms</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">UI Thread Delay</span>
                      <span className="text-white font-bold">{PerformanceProfiler.getInstance().getMetrics().uiThreadAverage} ms</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase font-bold block mb-0.5">Frame rate (FPS)</span>
                      <span className={`font-bold ${fps > 50 ? 'text-green-400' : fps > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                        {fps} FPS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logger configuration dropdown */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4.5 bg-white/2 border border-white/5 rounded-xl">
                <div className="flex flex-col gap-0.5 self-start">
                  <span className="text-xs font-bold text-white font-headline">Flight Recorder Logging Severity</span>
                  <span className="text-[10px] text-zinc-500">Filters events captured in storage and copy logs.</span>
                </div>
                <div className="flex gap-1.5 mt-3 sm:mt-0">
                  {(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => {
                        UpdaterFlightRecorder.setSeverityLevel(lvl);
                        triggerRefresh();
                        showToast(`Log filter severity set to ${lvl}`);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all border outline-none ${
                        UpdaterFlightRecorder.getSeverityLevel() === lvl
                          ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-[#c084fc] scale-105'
                          : 'bg-black border-white/5 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Floating toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border border-white/10 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] text-white flex items-center gap-2.5 animate-bounce font-mono">
          <span className="material-symbols-outlined text-[16px] text-[#8b5cf6]">done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// Collapsible scenario helper card declared locally to avoid duplicated imports
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
      className={`relative flex flex-col justify-between bg-white/2 border border-white/5 hover:border-[#8b5cf6]/30 p-4.5 rounded-xl transition-all text-left outline-none min-h-[155px] select-none ${
        isActive ? 'ring-1 ring-[#8b5cf6]/80 bg-white/4' : 'cursor-pointer active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start justify-between w-full">
        <div className={`flex items-center gap-2 ${colorClass}`}>
          <span className="material-symbols-outlined style={{ fontSize: 18 }}">{icon}</span>
          <span className="text-xs font-bold font-headline">{title}</span>
        </div>
        {isActive && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        )}
      </div>
      <p className="text-[10px] text-zinc-400 mt-2.5 leading-relaxed flex-1">
        {description}
      </p>
      
      <div className="mt-3.5 flex items-center justify-between text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-2.5 w-full">
        <div>
          <span>STATE: </span>
          <span className={isActive ? 'text-green-400 font-bold animate-pulse' : 'text-zinc-500'}>
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

// Collapsible row item helper for the timeline viewport
function TimelineEventRow({
  time,
  type,
  text,
  details,
  isError,
  isTransition,
  count
}: {
  time: string;
  type: string;
  text: string;
  details?: string;
  isError: boolean;
  isTransition: boolean;
  count?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  let icon = 'info';
  let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700/30';
  if (isError) {
    icon = 'error';
    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (isTransition) {
    icon = 'sync';
    badgeColor = 'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/20';
  } else if (type === 'native') {
    icon = 'settings_ethernet';
    badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
  }

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="bg-white/1 border border-white/5 hover:bg-white/3 rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`material-symbols-outlined text-[15px] shrink-0 ${isError ? 'text-red-400 animate-pulse' : isTransition ? 'text-[#8b5cf6]' : 'text-zinc-500'}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">{text}</span>
            {count && count > 1 && (
              <span className="inline-block mt-0.5 bg-[#8b5cf6]/10 text-[#c084fc] px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase">
                Aggregated {count} events
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${badgeColor}`}>
            {type.toUpperCase()}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">{time}</span>
          {details && (
            <span className={`material-symbols-outlined text-[14px] text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          )}
        </div>
      </div>

      {expanded && details && (
        <div className="pl-6.5 text-[10px] text-zinc-400 font-mono leading-relaxed border-t border-white/5 pt-2 select-text word-break-all">
          {details}
        </div>
      )}
    </div>
  );
}
