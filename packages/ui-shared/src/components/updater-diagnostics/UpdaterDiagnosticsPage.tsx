import React, { useState, useEffect, useRef } from 'react';
import { 
  isNative, 
  AppInstaller, 
  addJsLog, 
  useChordStore,
  ACCENT_COLORS,
  getLogs
} from '@workspace/studio-core';
import TelemetryGrid from './TelemetryGrid';
import ProductionActions from './ProductionActions';
import LiveConsole from './LiveConsole';
import DiagnosticsStack from './DiagnosticsStack';
import SimulationLab from './SimulationLab';
import StateMachineVisualizer from './StateMachineVisualizer';
import ReportPreview from './ReportPreview';
import { copyToClipboard } from './centralizedClipboard';
import { generateFullEngineeringReport } from './diagnosticsGenerator';

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
    <div className="bg-surface-container/60 backdrop-blur-md border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left outline-none border-none bg-transparent cursor-pointer select-none active:bg-surface-container-high/40 transition-colors"
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
        isOpen ? 'max-h-[1200px] opacity-100 p-5 pt-0 border-t border-outline-variant/5' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
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
  const accentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'blue';
  const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Native platform diagnostics states
  const [nativeDeviceInfo, setNativeDeviceInfo] = useState<any>(null);
  const [nativeInstallerDetails, setNativeInstallerDetails] = useState<any>(null);
  const [localApkDetails, setLocalApkDetails] = useState<any>(null);
  const [nativeLogsList, setNativeLogsList] = useState<any[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => setRefreshCount(prev => prev + 1);

  // Accordion collapsed state list
  const [accordions, setAccordions] = useState({
    telemetry: true,
    actions: true,
    logs: true,
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

  const clearNativeLogsList = () => {
    setNativeLogsList([]);
    if (isNative() && typeof AppInstaller.clearInstallerLogHistory === 'function') {
      void AppInstaller.clearInstallerLogHistory();
    }
  };

  // Sync data loop on native platform
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        if (isNative() && typeof AppInstaller !== 'undefined') {
          // 1. Device Info
          const dev = await AppInstaller.getDeviceInfo();
          if (active) setNativeDeviceInfo(dev);

          // 2. Extended diagnostics session
          if (typeof AppInstaller.getExtendedDiagnostics === 'function') {
            const det = await AppInstaller.getExtendedDiagnostics();
            if (active) setNativeInstallerDetails(det);
          } else if (typeof (AppInstaller as any).getPackageInstallerDetails === 'function') {
            const det = await (AppInstaller as any).getPackageInstallerDetails();
            if (active) setNativeInstallerDetails(det);
          }

          // 3. Log history
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

          // 4. Local APK details
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

  const handleCopyReport = async () => {
    const reportText = generateFullEngineeringReport(
      nativeDeviceInfo,
      nativeInstallerDetails,
      localApkDetails,
      nativeLogsList
    );
    try {
      const msg = await copyToClipboard(reportText, 'Full Diagnostics Report');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const handleShareApk = async () => {
    if (!isNative()) {
      showToast('Share options are only available on Android platform.');
      return;
    }
    const cachedPath = localStorage.getItem('studio:downloadedApkPath') || '';
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

  return (
    <div className="bg-[#0e0e0e] text-[#e7e5e4] min-h-screen overflow-x-hidden relative flex flex-col font-body">
      {/* Top sticky app bar */}
      <header className="w-full sticky top-0 z-50 bg-[#0e0e0e] flex items-center justify-between px-6 py-4 border-b border-[#484848]/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#e7e5e4] tracking-tight">Technical Rider</h1>
            <p className="text-xs text-on-surface-variant font-medium">OTA Diagnostics &amp; Debug Tools</p>
          </div>
        </div>
        <button 
          onClick={handleCopyReport}
          className="flex items-center gap-2 bg-tertiary text-on-tertiary px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all outline-none"
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
          <span>Copy Report</span>
        </button>
      </header>

      {/* Main Content viewport */}
      <main className="px-6 max-w-4xl w-full mx-auto space-y-4 pt-6 pb-28 flex-1 select-none">
        
        {/* Telemetry Accordion */}
        <AccordionSection 
          title="Telemetry & Live Status" 
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

        {/* Live Logs Accordion */}
        <AccordionSection 
          title="Live Execution Console" 
          icon="terminal" 
          isOpen={accordions.logs} 
          onToggle={() => toggleAccordion('logs')}
        >
          <LiveConsole 
            nativeLogsList={nativeLogsList}
            clearNativeLogsList={clearNativeLogsList}
            showToast={showToast}
            addJsLog={addJsLog}
          />
        </AccordionSection>

        {/* Diagnostics Copy Blocks Accordion */}
        <AccordionSection 
          title="Diagnostic Exports" 
          icon="content_copy" 
          isOpen={accordions.diagnostics} 
          onToggle={() => toggleAccordion('diagnostics')}
        >
          <DiagnosticsStack 
            nativeLogsList={nativeLogsList}
            nativeInstallerDetails={nativeInstallerDetails}
            showToast={showToast}
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

        {/* State Machine Transition Accordion */}
        <AccordionSection 
          title="Update State Transitions" 
          icon="insights" 
          isOpen={accordions.stateMachine} 
          onToggle={() => toggleAccordion('stateMachine')}
        >
          <StateMachineVisualizer />
        </AccordionSection>

        {/* Report Preview Accordion */}
        <AccordionSection 
          title="Engineering Report Snapshot" 
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

      {/* Sticky Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-around items-center h-16 pb-safe border-t border-[#484848]/15">
        {/* Copy Report */}
        <button 
          onClick={handleCopyReport}
          className="p-3 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center transition-transform active:scale-90 outline-none"
          title="Copy Report"
        >
          <span className="material-symbols-outlined">save</span>
        </button>

        {/* Share APK */}
        <button 
          onClick={handleShareApk}
          className="p-3 text-[#acabaa] hover:text-[#e7e5e4] transition-colors active:scale-90 outline-none"
          title="Share APK"
        >
          <span className="material-symbols-outlined">share</span>
        </button>

        {/* Print Timeline */}
        <button 
          onClick={handlePrintLogs}
          className="p-3 text-[#acabaa] hover:text-[#e7e5e4] transition-colors active:scale-90 outline-none"
          title="Print Timeline"
        >
          <span className="material-symbols-outlined">print</span>
        </button>

        {/* Toggle Simulation Tab */}
        <button 
          onClick={() => {
            setAccordions(prev => ({ ...prev, simulation: true }));
            showToast('Simulation Laboratory expanded');
          }}
          className="p-3 text-[#acabaa] hover:text-[#e7e5e4] transition-colors active:scale-90 outline-none"
          title="Configure Simulations"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </nav>

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/10 px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-[9999] text-white flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-green-400">done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
