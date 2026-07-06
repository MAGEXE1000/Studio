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
  globalOtaState
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

interface AccordionSectionProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="bg-black border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left outline-none border-none bg-transparent cursor-pointer select-none active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{icon}</span>
          <span className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide">{title}</span>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-300 ${
          isOpen ? 'rotate-180 text-tertiary' : 'rotate-0'
        }`}>
          expand_more
        </span>
      </button>
      
      {/* Animated panel container */}
      <div className={`transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[1600px] opacity-100 p-5 pt-0 border-t border-outline-variant/5' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
      }`}>
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
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

  // Accordion collapsed state list
  const [accordions, setAccordions] = useState({
    sessionSelector: true,
    timeline: true,
    workflow: true,
    telemetry: false,
    actions: false,
    logs: false,
    diagnostics: false,
    simulation: false,
    stateMachine: false,
    report: false
  });

  const toggleAccordion = (key: keyof typeof accordions) => {
    setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
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

  const [activeTab, setActiveTab] = useState<'overview' | 'session' | 'timeline' | 'history' | 'diagnostics' | 'performance' | 'simulation'>('overview');
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
            <p className="text-xs text-on-surface-variant font-medium">Session History &amp; Debug Tools</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopyEverything}
            className="flex items-center gap-1.5 bg-tertiary hover:brightness-110 text-on-tertiary px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
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
          { id: 'session', label: 'Current Session', icon: 'settings_backup_restore' },
          { id: 'timeline', label: 'Workflow Timeline', icon: 'event_note' },
          { id: 'history', label: 'Update History', icon: 'history' },
          { id: 'diagnostics', label: 'Diagnostics', icon: 'analytics' },
          { id: 'performance', label: 'Performance', icon: 'insights' },
          { id: 'simulation', label: 'Simulation', icon: 'science' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-4 border-b-2 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors outline-none bg-transparent ${
              activeTab === tab.id
                ? 'border-tertiary text-tertiary'
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
        
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">info</span>
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
            <TelemetryGrid 
              nativeDeviceInfo={nativeDeviceInfo}
              nativeInstallerDetails={nativeInstallerDetails}
            />
          </div>
        )}

        {activeTab === 'session' && (
          <div className="space-y-4 animate-fadeIn">
            {curSession ? (
              <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">settings_backup_restore</span>
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
                      <div className="bg-tertiary h-full rounded-full transition-all duration-300" style={{ width: `${curSession.progress * 100}%` }} />
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
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4 animate-fadeIn">
            {selectedSession && selectedSession.timeline.length > 0 ? (
              <div className="border border-[#484848]/10 rounded-2xl overflow-hidden bg-[#1c1c1e]/30 flex flex-col divide-y divide-[#484848]/10 font-mono text-xs max-h-[640px] overflow-y-auto">
                {selectedSession.timeline.map((event, idx) => (
                  <div key={idx} className="p-3 flex items-start gap-4 hover:bg-white/2 transition-colors">
                    <div className="text-on-surface-variant min-w-[70px] font-bold">{event.timestamp}</div>
                    <div className="text-[#a8a29e] min-w-[80px] font-bold">{event.offset}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-tertiary font-bold uppercase text-[10px] bg-tertiary/10 border border-tertiary/20 px-1.5 rounded">{event.module}</span>
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
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Select Diagnostic Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#484848]/35 rounded-xl px-4 py-3 text-sm text-[#e7e5e4] font-semibold outline-none focus:border-tertiary transition-colors"
                >
                  <option value="current">-- Active/Latest Session --</option>
                  {sessions.slice().reverse().map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.result} - {s.version || 'unknown'} - {new Date(s.startTime).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* History Management Operations Panel */}
              <div className="flex flex-wrap gap-2 pt-2 pb-2 border-t border-[#484848]/10">
                <button
                  onClick={handleCopySelectedSession}
                  className="flex items-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copy Selected Session</span>
                </button>
                <button
                  onClick={handleCopyEntireHistory}
                  className="flex items-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">library_books</span>
                  <span>Copy Entire History</span>
                </button>
                <div className="relative group">
                  <button
                    className="flex items-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Export History</span>
                  </button>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex flex-col bg-[#1d1d1f] border border-[#484848]/20 rounded-xl p-1 shadow-xl min-w-[140px] z-[50]">
                    <button onClick={() => handleExportHistory('json')} className="bg-transparent border-none rounded-lg text-white hover:bg-white/5 py-2 px-3 text-left text-xs font-semibold cursor-pointer">JSON Format</button>
                    <button onClick={() => handleExportHistory('md')} className="bg-transparent border-none rounded-lg text-white hover:bg-white/5 py-2 px-3 text-left text-xs font-semibold cursor-pointer">Markdown Format</button>
                  </div>
                </div>
                {selectedSession && (
                  <button
                    onClick={handleDeleteSession}
                    className="flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/30 border border-red-500/10 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete Selected Session</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer sm:ml-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Delete All Sessions</span>
                </button>
              </div>

              {selectedSession ? (
                <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Session ID</span>
                      <span className="text-sm font-bold text-white">{selectedSession.id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Result State</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold inline-block border ${
                        selectedSession.result === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border-green-500/25' :
                        selectedSession.result === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                        selectedSession.result === 'CANCELLED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                        selectedSession.result === 'FINISHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/25'
                      }`}>{selectedSession.result}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Target Version</span>
                      <span className="text-sm font-bold text-white">{selectedSession.version || 'Checking...'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Duration</span>
                      <span className="text-sm font-bold text-white">
                        {selectedSession.durationMs ? `${(selectedSession.durationMs / 1000).toFixed(2)}s` : 'In progress'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#484848]/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-on-surface-variant">
                    <div><span className="font-semibold text-[#e7e5e4]">Started:</span> {new Date(selectedSession.startTime).toLocaleString()}</div>
                    <div><span className="font-semibold text-[#e7e5e4]">Finished:</span> {selectedSession.endTime ? new Date(selectedSession.endTime).toLocaleString() : 'N/A'}</div>
                    <div><span className="font-semibold text-[#e7e5e4]">Build type:</span> {selectedSession.buildType}</div>
                    <div><span className="font-semibold text-[#e7e5e4]">Device:</span> {selectedSession.deviceModel} ({selectedSession.androidVersion})</div>
                  </div>

                  {/* Subsets Copy Toolbar */}
                  <div className="border-t border-[#484848]/10 pt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-[#e7e5e4] flex items-center mr-1">Copy Subset:</span>
                    <button onClick={() => handleCopySubset('workflow', 'txt')} className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-white/5 border border-outline-variant/10 text-[10px] font-bold text-white cursor-pointer">Workflow</button>
                    <button onClick={() => handleCopySubset('timeline', 'txt')} className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-white/5 border border-outline-variant/10 text-[10px] font-bold text-white cursor-pointer">Timeline</button>
                    <button onClick={() => handleCopySubset('native', 'txt')} className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-white/5 border border-outline-variant/10 text-[10px] font-bold text-white cursor-pointer">Native Logs</button>
                    <button onClick={() => handleCopySubset('js', 'txt')} className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-white/5 border border-outline-variant/10 text-[10px] font-bold text-white cursor-pointer">JS Logs</button>
                    <button onClick={() => handleCopySubset('all', 'json')} className="px-2.5 py-1.5 rounded-lg bg-black hover:bg-white/5 border border-outline-variant/10 text-[10px] font-bold text-white cursor-pointer">Raw JSON</button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-6 text-center text-sm text-on-surface-variant font-medium">
                  No persistent diagnostic update sessions found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-4 animate-fadeIn">
            <DiagnosticsStack 
              nativeDeviceInfo={nativeDeviceInfo}
              nativeInstallerDetails={nativeInstallerDetails}
              localApkDetails={localApkDetails}
              nativeLogsList={nativeLogsList}
              showToast={showToast}
            />
            <ProductionActions 
              showToast={showToast} 
              triggerRefresh={triggerRefresh}
              addJsLog={addJsLog}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1c1c1e]/60 border border-[#484848]/15 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-[#e7e5e4] font-headline tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">insights</span>
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
            <StateMachineVisualizer />
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
