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
  type UpdateSession
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

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[sessions.length - 1];

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
          {selectedSession && (
            <button
              onClick={() => handleCopySubset('all', 'md')}
              className="flex items-center gap-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#484848]/20 text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              <span>Copy Session</span>
            </button>
          )}
          <button
            onClick={handleDeleteAll}
            className="flex items-center justify-center bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-400 w-10 h-10 rounded-full transition-all cursor-pointer"
            title="Delete All Sessions"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>
      </header>

      {/* Main Content viewport */}
      <main className="px-6 max-w-4xl w-full mx-auto space-y-4 pt-6 pb-[calc(var(--content-bottom-pad,96px)+20px)] flex-1 select-none">
        
        {/* Session Selector & Details Accordion */}
        <AccordionSection
          title="Update Sessions History"
          icon="history"
          isOpen={accordions.sessionSelector}
          onToggle={() => toggleAccordion('sessionSelector')}
        >
          <div className="space-y-4 bg-black">
            <div className="flex flex-col sm:flex-row gap-3 bg-black">
              <div className="flex-1">
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
              
              <div className="flex items-end gap-2 bg-black">
                {selectedSession && (
                  <>
                    <button
                      onClick={handleDeleteSession}
                      className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      Delete Session
                    </button>
                    <div className="relative group">
                      <button
                        className="py-3 px-4 rounded-xl bg-[#1c1c1e] border border-[#484848]/30 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-xs">file_download</span>
                        <span>Export</span>
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col bg-[#1c1c1e] border border-[#484848]/20 rounded-xl p-1 shadow-xl min-w-[120px] z-[50]">
                        <button onClick={() => handleExportFile('json')} className="bg-transparent border-none rounded-lg text-white hover:bg-white/5 py-2 px-3 text-left text-xs font-semibold cursor-pointer">JSON</button>
                        <button onClick={() => handleExportFile('txt')} className="bg-transparent border-none rounded-lg text-white hover:bg-white/5 py-2 px-3 text-left text-xs font-semibold cursor-pointer">Plain TXT</button>
                        <button onClick={() => handleExportFile('md')} className="bg-transparent border-none rounded-lg text-white hover:bg-white/5 py-2 px-3 text-left text-xs font-semibold cursor-pointer">Markdown</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                No active or persistent diagnostic update sessions found.
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Update Session Timeline Accordion */}
        {selectedSession && (
          <AccordionSection
            title="Update Session Timeline"
            icon="event_note"
            isOpen={accordions.timeline}
            onToggle={() => toggleAccordion('timeline')}
          >
            <div className="space-y-3 bg-black">
              {selectedSession.timeline.length > 0 ? (
                <div className="border border-[#484848]/10 rounded-2xl overflow-hidden bg-[#1c1c1e]/30 flex flex-col divide-y divide-[#484848]/10 font-mono text-xs max-h-[480px] overflow-y-auto">
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
          </AccordionSection>
        )}

        {/* Update Workflow Transitions Accordion */}
        {selectedSession && (
          <AccordionSection
            title="Update Workflow Transitions"
            icon="alt_route"
            isOpen={accordions.workflow}
            onToggle={() => toggleAccordion('workflow')}
          >
            <div className="space-y-4 bg-black">
              {selectedSession.transitions.length > 0 ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {selectedSession.transitions.map((trans, idx) => (
                    <div key={idx} className="border border-[#484848]/15 rounded-2xl p-4 bg-[#1c1c1e]/40 space-y-3 font-mono text-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
                      
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap font-bold text-white">
                          <span className="px-1.5 py-0.5 bg-[#484848]/20 rounded text-on-surface-variant">{trans.previousState}</span>
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_forward</span>
                          <span className="px-1.5 py-0.5 bg-tertiary/20 text-tertiary rounded border border-tertiary/10">{trans.nextState}</span>
                        </div>
                        <div className="text-on-surface-variant text-[10px] font-bold">
                          {trans.timestamp} | Elapsed: {(trans.elapsedTimeMs / 1000).toFixed(3)}s
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant text-[11px] border-t border-[#484848]/10 pt-2.5">
                        <div><span className="text-white font-bold">Function:</span> `{trans.functionName}`</div>
                        <div><span className="text-white font-bold">File:</span> `{trans.file}`</div>
                        <div className="sm:col-span-2 break-all"><span className="text-white font-bold">Caller:</span> `{trans.caller}`</div>
                        <div className="sm:col-span-2"><span className="text-white font-bold">Reason:</span> {trans.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1c1c1e]/40 border border-[#484848]/10 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
                  No workflow state transitions recorded for this session.
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Closing Stack Trace & UpToDate Triggers inside Selected Session */}
        {selectedSession && (selectedSession.closeEvent || selectedSession.upToDateEvent) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black">
            {selectedSession.closeEvent && (
              <div className="border border-red-500/15 rounded-2xl p-5 bg-red-950/10 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-headline font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">cancel_presentation</span>
                  <span>Updater Close Handler</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-[#e7e5e4]">
                  <div><span className="text-red-400/80 font-bold">Function:</span> `{selectedSession.closeEvent.functionName}`</div>
                  <div><span className="text-red-400/80 font-bold">File:</span> `{selectedSession.closeEvent.file}`</div>
                  <div><span className="text-red-400/80 font-bold">Reason:</span> {selectedSession.closeEvent.reason}</div>
                  <div><span className="text-red-400/80 font-bold">Closed State:</span> `{selectedSession.closeEvent.currentState}`</div>
                  <div className="pt-2 border-t border-red-500/10">
                    <span className="block text-[9px] text-red-400/70 font-bold uppercase mb-1">Stack Trace</span>
                    <pre className="p-2.5 rounded bg-black/60 border border-red-500/5 overflow-auto max-h-32 text-[10px] text-red-300 no-scrollbar whitespace-pre-wrap break-all font-mono">
                      {selectedSession.closeEvent.stackTrace}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {selectedSession.upToDateEvent && (
              <div className="border border-[#484848]/20 rounded-2xl p-5 bg-[#1c1c1e]/40 space-y-3">
                <div className="flex items-center gap-2 text-tertiary font-headline font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                  <span>"Up to date" Popup Trigger</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-[#e7e5e4]">
                  <div><span className="text-tertiary font-bold">Trigger Type:</span> <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[9px] font-bold border border-tertiary/10">{selectedSession.upToDateEvent.triggerType}</span></div>
                  <div><span className="text-tertiary font-bold">Function:</span> `{selectedSession.upToDateEvent.functionName}`</div>
                  <div><span className="text-tertiary font-bold">File:</span> `{selectedSession.upToDateEvent.file}`</div>
                  <div><span className="text-tertiary font-bold">Reason:</span> {selectedSession.upToDateEvent.reason}</div>
                  <div className="pt-2 border-t border-[#484848]/10">
                    <span className="block text-[9px] text-[#8c8c8c] font-bold uppercase mb-1">Stack Trace</span>
                    <pre className="p-2.5 rounded bg-black/60 border border-[#484848]/10 overflow-auto max-h-32 text-[10px] text-on-surface-variant no-scrollbar whitespace-pre-wrap break-all font-mono">
                      {selectedSession.upToDateEvent.stackTrace}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing System Telemetry Accordion */}
        <AccordionSection 
          title="Native Telemetry & Environment" 
          icon="analytics" 
          isOpen={accordions.telemetry} 
          onToggle={() => toggleAccordion('telemetry')}
        >
          <TelemetryGrid 
            nativeDeviceInfo={nativeDeviceInfo}
            nativeInstallerDetails={nativeInstallerDetails}
          />
        </AccordionSection>

        {/* Action Controls Accordion */}
        <AccordionSection 
          title="Production Actions" 
          icon="settings_remote" 
          isOpen={accordions.actions} 
          onToggle={() => toggleAccordion('actions')}
        >
          <ProductionActions 
            showToast={showToast} 
            triggerRefresh={triggerRefresh}
            addJsLog={addJsLog}
          />
        </AccordionSection>

        {/* Live Console Accordion */}
        <AccordionSection 
          title="Live Debug Console" 
          icon="terminal" 
          isOpen={accordions.logs} 
          onToggle={() => toggleAccordion('logs')}
        >
          <LiveConsole 
            nativeLogsList={nativeLogsList}
            clearNativeLogsList={() => setNativeLogsList([])}
            showToast={showToast}
            addJsLog={addJsLog}
          />
        </AccordionSection>

        {/* Simulation Lab Accordion */}
        <AccordionSection 
          title="Simulation Laboratory" 
          icon="science" 
          isOpen={accordions.simulation} 
          onToggle={() => toggleAccordion('simulation')}
        >
          <SimulationLab 
            showToast={showToast}
            triggerRefresh={triggerRefresh}
            nativeDeviceInfo={nativeDeviceInfo}
            nativeInstallerDetails={nativeInstallerDetails}
            localApkDetails={localApkDetails}
            nativeLogsList={nativeLogsList}
          />
        </AccordionSection>

        {/* State Machine Transition Diagram Accordion */}
        <AccordionSection 
          title="Update State Diagram" 
          icon="insights" 
          isOpen={accordions.stateMachine} 
          onToggle={() => toggleAccordion('stateMachine')}
        >
          <StateMachineVisualizer />
        </AccordionSection>

        {/* Engineering Report Preview Accordion */}
        <AccordionSection 
          title="Unified Report Preview" 
          icon="description" 
          isOpen={accordions.report} 
          onToggle={() => toggleAccordion('report')}
        >
          <ReportPreview 
            nativeDeviceInfo={nativeDeviceInfo}
            nativeInstallerDetails={nativeInstallerDetails}
            localApkDetails={localApkDetails}
            nativeLogsList={nativeLogsList}
          />
        </AccordionSection>

      </main>

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/10 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-[9999] text-white flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-green-400">done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
