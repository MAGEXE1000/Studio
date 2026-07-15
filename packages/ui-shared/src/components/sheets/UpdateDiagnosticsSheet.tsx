import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { 
  useChordStore, 
  ACCENT_COLORS, 
  updateDiagnostics, 
  updateDebugLogs, 
  useBackHandler, 
  APP_VERSION, 
  useAppUpdate,
  UpdaterFlightRecorder,
  updaterSimulation,
  transitionToState,
  checkForUpdate,
  downloadUpdate,
  applyUpdate,
  applyUpdateDirect,
  checkAndCleanCache,
  runSignatureMismatchRecovery,
  deleteLocalApk
} from '@workspace/studio-core';

type Props = {
  open: boolean;
  onClose: () => void;
};

interface DiagnosticEntry {
  category: 'Performance' | 'Updater' | 'Downloads' | 'Installation' | 'Version Manager' | 'Android' | 'Storage' | 'Network' | 'Firebase' | 'GitHub' | 'PackageInstaller';
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Error';
  subsystem: string;
  summary: string;
  technicalExplanation: string;
  humanExplanation: string;
  suggestedSolution: string;
}

// Generate real diagnostics from memory
export function getStructuredDiagnostics(developerMode: boolean): DiagnosticEntry[] {
  const list: DiagnosticEntry[] = [];
  const nowStr = new Date().toISOString();

  // 1. PERFORMANCE
  const boot = (typeof window !== 'undefined' ? (window as any).__bootTimings : null) || { introStart: 0, hubVisible: 0 };
  const natBoot = (typeof window !== 'undefined' ? (window as any).__nativeBootTimings : null) || { processStart: 0, onCreate: 0, webViewInit: 0 };
  
  const toSec = (ms: number) => ms > 0 ? `${(ms / 1000).toFixed(2)}s` : 'N/A';
  const jsInitMs = (natBoot.webViewInit && natBoot.onCreate) ? (natBoot.webViewInit - natBoot.onCreate) : 0;
  
  list.push({
    category: 'Performance',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'JS Engine',
    summary: 'JavaScript engine initialization time',
    technicalExplanation: `JS bundle load & execution: ${jsInitMs}ms.`,
    humanExplanation: 'The time taken for the app\'s JavaScript code to load and run.',
    suggestedSolution: 'Keep JS bundle sizes small and avoid heavy startup execution.'
  });

  list.push({
    category: 'Performance',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Android Native',
    summary: 'Native application bootstrap time',
    technicalExplanation: `Process launch to onCreate: ${natBoot.onCreate && natBoot.processStart ? natBoot.onCreate - natBoot.processStart : 0}ms.`,
    humanExplanation: 'The time taken by the Android operating system to initialize the app process.',
    suggestedSolution: 'Optimize native application onCreate and plugin registration.'
  });

  list.push({
    category: 'Performance',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Renderer',
    summary: 'Time to first frame (planets intro)',
    technicalExplanation: `First paint frame timing: ${toSec(boot.introStart)}.`,
    humanExplanation: 'How quickly the application renders its first visual pixel (the planets intro).',
    suggestedSolution: 'Keep CSS and HTML footprint minimal before first mount.'
  });

  if (developerMode) {
    let memText = 'N/A';
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      memText = `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`;
    }
    list.push({
      category: 'Performance',
      timestamp: nowStr,
      severity: 'Info',
      subsystem: 'Memory Profile',
      summary: 'Heap memory usage profiling',
      technicalExplanation: `JS Heap: ${memText}.`,
      humanExplanation: 'Current memory footprint used by the app\'s Javascript runtime.',
      suggestedSolution: 'Perform garbage collection checks and profiling if leaks occur.'
    });
  }

  // 2. UPDATER
  list.push({
    category: 'Updater',
    timestamp: updateDiagnostics.timestamp || nowStr,
    severity: updateDiagnostics.exceptionMessage ? 'Error' : 'Info',
    subsystem: 'Update Manager',
    summary: 'Update engine status',
    technicalExplanation: `Current state: ${updateDebugLogs.updateDecisionReason || 'idle'}.`,
    humanExplanation: 'The status of the background update checker engine.',
    suggestedSolution: 'Verify internet connection and server status if updates fail.'
  });

  // 3. DOWNLOADS
  list.push({
    category: 'Downloads',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Network Fetcher',
    summary: 'APK size and path configuration',
    technicalExplanation: `File size: ${updateDiagnostics.fileSize || 'N/A'}. Path: ${updateDiagnostics.apkPath || 'N/A'}.`,
    humanExplanation: 'Information about the downloaded installation package details.',
    suggestedSolution: 'Ensure local storage has enough space to hold the package.'
  });

  // 4. INSTALLATION
  list.push({
    category: 'Installation',
    timestamp: nowStr,
    severity: updateDebugLogs.eligibilityReason ? 'Error' : 'Info',
    subsystem: 'Verify Manager',
    summary: 'Signature and packageName verification status',
    technicalExplanation: `Package: ${updateDebugLogs.downloadedPackageName || 'N/A'}. Signature Match: ${updateDebugLogs.eligibilitySigningMatch !== null ? updateDebugLogs.eligibilitySigningMatch : 'N/A'}.`,
    humanExplanation: 'Results of the pre-installation security checks.',
    suggestedSolution: 'Uninstall any conflicting builds if signature mismatches are reported.'
  });

  // 5. VERSION MANAGER
  list.push({
    category: 'Version Manager',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Version Comparer',
    summary: 'Version comparison check',
    technicalExplanation: `Installed: ${APP_VERSION} (code ${updateDebugLogs.installedVersionCode || '131'}). Target: ${updateDebugLogs.remoteVersionCode || 'N/A'}.`,
    humanExplanation: 'How the installed version compares to the target version.',
    suggestedSolution: 'Ensure the versionCode is newer for successful installation.'
  });

  // 6. ANDROID OS
  list.push({
    category: 'Android',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Device OS',
    summary: 'Android system details',
    technicalExplanation: `Model: ${updateDiagnostics.deviceModel || 'N/A'}. OS Version: Android ${updateDiagnostics.androidVersion || 'N/A'}.`,
    humanExplanation: 'Basic hardware and operating system details reported by the device.',
    suggestedSolution: 'Check for any Android system updates.'
  });

  // 7. STORAGE
  list.push({
    category: 'Storage',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Filesystem',
    summary: 'Device storage space details',
    technicalExplanation: `Available: ${updateDiagnostics.storageAvailable || 'N/A'}.`,
    humanExplanation: 'Remaining disk space available for downloading and installing updates.',
    suggestedSolution: 'Free up storage if space falls below 150MB.'
  });

  // 8. NETWORK
  list.push({
    category: 'Network',
    timestamp: nowStr,
    severity: updateDiagnostics.networkState === 'disconnected' ? 'Warning' : 'Info',
    subsystem: 'Connectivity',
    summary: 'Device network state details',
    technicalExplanation: `State: ${updateDiagnostics.networkState || 'N/A'}.`,
    humanExplanation: 'Status of the device\'s internet connection.',
    suggestedSolution: 'Connect to Wi-Fi or enable cellular data.'
  });

  // 9. FIREBASE
  list.push({
    category: 'Firebase',
    timestamp: nowStr,
    severity: updateDebugLogs.fetchedAppReleaseJson ? 'Info' : 'Warning',
    subsystem: 'Hosting Metadata',
    summary: 'Firebase release metadata fetch status',
    technicalExplanation: `version.json status: ${updateDebugLogs.fetchedVersionJson || 'N/A'}. app-release.json status: ${updateDebugLogs.fetchedAppReleaseJson || 'N/A'}.`,
    humanExplanation: 'Connection state with the secondary update metadata server.',
    suggestedSolution: 'Verify Firebase hosting deployment is active.'
  });

  // 10. GITHUB
  list.push({
    category: 'GitHub',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Releases API',
    summary: 'GitHub releases source status',
    technicalExplanation: `Download URL: ${updateDiagnostics.downloadUrl || 'N/A'}.`,
    humanExplanation: 'Status of the primary release storage hosted on GitHub.',
    suggestedSolution: 'Check if the repository releases are public and accessible.'
  });

  // 11. PACKAGEINSTALLER
  list.push({
    category: 'PackageInstaller',
    timestamp: nowStr,
    severity: updateDiagnostics.statusCode && updateDiagnostics.statusCode > 1 ? 'Error' : 'Info',
    subsystem: 'Android PackageInstaller',
    summary: 'Android system installer response log',
    technicalExplanation: `Status: ${updateDiagnostics.statusCode || 'N/A'}. Detail: ${updateDiagnostics.installerResult || 'N/A'}.`,
    humanExplanation: 'The response returned by the Android system package installer.',
    suggestedSolution: 'Check settings permissions and clear conflicting packages.'
  });

  return list;
}

export default function UpdateDiagnosticsSheet({ open, onClose }: Props) {
  const ota = useAppUpdate();
  const settings = useChordStore(s => s.settings);
  const accentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'blue';
  const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;

  const [mounted, setMounted] = useState(open);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedEntryIdx, setExpandedEntryIdx] = useState<number | null>(null);

  // Flight Recorder Live Logs State
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');
  const [logEntries, setLogEntries] = useState<any[]>([]);

  // Simulated properties
  const [simulationList, setSimulationList] = useState({
    forceUpdateAvailable: updaterSimulation.forceUpdateAvailable,
    forceSignatureMismatch: updaterSimulation.forceSignatureMismatch,
    forceShaFailure: updaterSimulation.forceShaFailure,
    forceMetadataFailure: updaterSimulation.forceMetadataFailure,
    forceDownloadFailure: updaterSimulation.forceDownloadFailure,
    simulateDownloadThrottling: updaterSimulation.simulateDownloadThrottling,
  });

  // Collapsed sections
  const [collapsed, setCollapsed] = useState({
    actions: false,
    logs: false,
    diagnostics: true,
    simulation: true,
    timeline: false,
    report: true
  });

  // Load and refresh logs
  const refreshLogs = useCallback(() => {
    try {
      const events = UpdaterFlightRecorder.getEvents();
      setLogEntries([...events].reverse());
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      refreshLogs();
      // Periodically refresh logs while open
      const interval = setInterval(refreshLogs, 1500);
      return () => clearInterval(interval);
    } else {
      const id = setTimeout(() => setMounted(false), 2500);
      return () => clearTimeout(id);
    }
  }, [open, refreshLogs]);

  // Window scroll locking
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Hardware Back Button
  useBackHandler('sheet', () => {
    if (open) {
      onClose();
      return true;
    }
    return false;
  }, [open, onClose]);

  // Filtered logs computed
  const filteredLogs = useMemo(() => {
    return logEntries.filter(log => {
      const severity = log.severity || 'INFO';
      const matchesFilter = logFilter === 'ALL' || severity === logFilter;
      const searchLower = logSearch.toLowerCase();
      const matchesSearch = !logSearch || 
        (log.caller || '').toLowerCase().includes(searchLower) ||
        (log.eventType || '').toLowerCase().includes(searchLower) ||
        (log.reason || '').toLowerCase().includes(searchLower) ||
        (log.details || '').toLowerCase().includes(searchLower) ||
        (log.error || '').toLowerCase().includes(searchLower) ||
        (log.warning || '').toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });
  }, [logEntries, logFilter, logSearch]);

  // Filtered diagnostics compiled
  const diagnosticsList = useMemo(() => getStructuredDiagnostics(settings.developerMode ?? false), [settings.developerMode]);
  const filteredDiagnostics = useMemo(() => {
    return diagnosticsList.filter(entry => {
      const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        entry.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.technicalExplanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.humanExplanation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [diagnosticsList, selectedCategory, searchTerm]);

  // Compile full technical text report
  const getDiagnosticsText = () => {
    return [
      '=== STUDIO UPDATE DIAGNOSTICS REPORT ===',
      `Timestamp: ${new Date().toISOString()}`,
      `App Version: ${APP_VERSION}`,
      `State: ${ota.updateState}`,
      `Progress: ${ota.progress}%`,
      `Error Code/Message: ${ota.error || 'None'}`,
      `Device Model: ${updateDiagnostics.deviceModel || 'N/A'}`,
      `OS Version: Android ${updateDiagnostics.androidVersion || 'N/A'}`,
      `Network: ${updateDiagnostics.networkState || 'N/A'}`,
      `Storage Available: ${updateDiagnostics.storageAvailable || 'N/A'}`,
      `Download Endpoint: ${updateDiagnostics.downloadUrl || 'N/A'}`,
      `SHA Expected: ${updateDiagnostics.shaExpected || 'N/A'}`,
      `SHA Calculated: ${updateDiagnostics.shaCalculated || 'N/A'}`,
      `Eligibility Status: ${updateDebugLogs.apkEligibilityResult || 'N/A'}`,
      `Signature Fingerprint Match: ${updateDebugLogs.eligibilitySigningMatch !== null ? updateDebugLogs.eligibilitySigningMatch : 'N/A'}`,
      `Package Name Match: ${updateDebugLogs.eligibilityPackageNameMatch !== null ? updateDebugLogs.eligibilityPackageNameMatch : 'N/A'}`,
      `Target versionCode: ${updateDebugLogs.remoteVersionCode || 'N/A'}`,
      `Download Progress: ${updateDebugLogs.downloadStatus || 'N/A'}`,
      `Firebase version.json: ${updateDebugLogs.fetchedVersionJson || 'N/A'}`,
      `Firebase app-release.json: ${updateDebugLogs.fetchedAppReleaseJson || 'N/A'}`,
      `Simulation active: ${JSON.stringify(simulationList)}`,
      '',
      '=== FLIGHT RECORDER LOG HISTORY ===',
      UpdaterFlightRecorder.compileFullReport()
    ].join('\n');
  };

  const handleCopyReport = () => {
    const text = getDiagnosticsText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // State Timeline Tree Config
  const timelineStates = [
    { id: 'INITIALIZING', label: 'Initializing', desc: 'Starting update pipeline' },
    { id: 'FETCH_REMOTE_METADATA', label: 'Fetch Manifest', desc: 'Querying remote registries' },
    { id: 'VALIDATE_METADATA', label: 'Validate Manifest', desc: 'Parsing remote JSON metadata' },
    { id: 'COMPARE_VERSION', label: 'Compare Version', desc: 'Evaluating installed vs target version' },
    { id: 'DOWNLOAD_APK', label: 'Downloading APK', desc: 'Fetching binary stream' },
    { id: 'VERIFY_SHA256', label: 'Checksum Verify', desc: 'Validating SHA-256 package signature' },
    { id: 'PREPARING_INSTALL', label: 'Preparing Install', desc: 'Verifying certificate signing match' },
    { id: 'WAITING_USER_CONFIRMATION', label: 'Awaiting User', desc: 'Awaiting install user action prompt' },
    { id: 'PACKAGEINSTALLER_VISIBLE', label: 'Installer Active', desc: 'PackageInstaller activity in foreground' },
    { id: 'INSTALLING', label: 'Installing', desc: 'Applying system package updates' }
  ];

  const getTimelineStepStatus = (stepId: string) => {
    const activeState = ota.updateState;
    const activeIndex = timelineStates.findIndex(s => s.id === activeState);
    const stepIndex = timelineStates.findIndex(s => s.id === stepId);

    if (activeIndex === -1) {
      if (activeState === 'NO_UPDATE_AVAILABLE' && stepId === 'COMPARE_VERSION') return 'COMPLETED';
      if (activeState === 'INSTALL_SUCCESS') return 'COMPLETED';
      if (activeState === 'INSTALL_FAILED' && stepIndex < 9) return 'COMPLETED';
      return 'PENDING';
    }

    if (stepIndex < activeIndex) return 'COMPLETED';
    if (stepIndex === activeIndex) return 'ACTIVE';
    return 'PENDING';
  };

  // Toggle Simulations Lab Helper
  const toggleSimulation = (key: keyof typeof simulationList) => {
    const next = !simulationList[key];
    (updaterSimulation as any)[key] = next;
    setSimulationList(prev => ({ ...prev, [key]: next }));
    refreshLogs();
  };

  // Button Action handlers
  const handleCheckUpdates = async () => {
    try {
      await ota.checkNow();
    } catch (_) {}
  };

  const handleDownloadApkAction = async () => {
    try {
      await ota.downloadUpdate('DevTools Manual');
    } catch (_) {}
  };

  const handleCompleteFlowAction = async () => {
    try {
      await checkForUpdate(true, 'devtools_auto', 'DevTools Complete Flow Trigger');
    } catch (_) {}
  };

  const handleResetFsmState = () => {
    transitionToState('IDLE', 'Diagnostics manual state reset', undefined);
    refreshLogs();
  };

  const handleClearCacheAction = async () => {
    await checkAndCleanCache();
    refreshLogs();
  };

  const handleVerifyCurrentApk = async () => {
    const path = updateDiagnostics.apkPath || updateDebugLogs.downloadedApkPath;
    if (!path) {
      alert('No downloaded APK is currently cached on the filesystem.');
      return;
    }
    // Re-trigger eligibility verification on cached path
    const { runEligibilityCheck } = await import('@workspace/studio-core/src/lib/updater/eligibilityVerification');
    const eligible = await runEligibilityCheck(path);
    alert(eligible ? 'APK integrity and verification success!' : `APK verification failed: ${updateDebugLogs.eligibilityReason}`);
  };

  const handleValidateDownloadUrl = async () => {
    const url = ota.apkUrl || ota.downloadUrl || updateDiagnostics.downloadUrl;
    if (!url || url === 'N/A') {
      alert('No active download URL available in the current update state.');
      return;
    }
    try {
      const res = await fetch(url, { method: 'HEAD' });
      alert(res.ok ? `URL reachable! Returned status: ${res.status}` : `URL verification failed: HTTP ${res.status}`);
    } catch (e) {
      alert(`Network verification failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleExportDiagnosticsFile = () => {
    const text = getDiagnosticsText();
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studio-ota-diagnostics-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + String(e));
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0e0e0e',
            color: '#e7e5e4',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Manrope', sans-serif",
            boxSizing: 'border-box'
          }}
        >
          {/* STICKY TOP APP BAR */}
          <header className="w-full shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#484848]/20 bg-[#0e0e0e]/85 backdrop-blur-md sticky top-0 z-[10000]">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1f2020] hover:bg-[#252626] transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-lg text-[#e7e5e4]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-[17px] font-extrabold text-[#e7e5e4] tracking-tight m-0 leading-tight">Updater Diagnostics</h1>
                <p className="text-[10px] text-[#acabaa] font-bold uppercase tracking-widest m-0 mt-0.5">OTA Diagnostics &amp; Debug Tools</p>
              </div>
            </div>
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 bg-[#679cff] text-[#000000] px-4 py-2 rounded-full text-xs font-black shadow-lg shadow-[#679cff]/10 hover:brightness-110 active:scale-95 transition-all focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy Report'}</span>
            </button>
          </header>

          {/* MAIN SCROLLABLE CONTENT AREA */}
          <main className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto space-y-6 box-border pb-32">
            
            {/* SYSTEM STATUS GRID (Non-collapsible) */}
            <motion.section 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="bg-[#191a1a] p-4 rounded-xl flex flex-col gap-1 border border-[#484848]/10">
                <span className="text-[#acabaa] text-[9px] uppercase tracking-widest font-black">App Version</span>
                <span className="text-[16px] font-extrabold text-[#679cff]">{APP_VERSION}</span>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="bg-[#191a1a] p-4 rounded-xl flex flex-col gap-1 border border-[#484848]/10">
                <span className="text-[#acabaa] text-[9px] uppercase tracking-widest font-black">Target Version</span>
                <span className="text-[16px] font-extrabold text-[#e7e5e4]">{ota.remoteVersion || 'N/A'}</span>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="bg-[#191a1a] p-4 rounded-xl flex flex-col gap-1 border border-[#484848]/10">
                <span className="text-[#acabaa] text-[9px] uppercase tracking-widest font-black">Updater Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${ota.loading ? 'bg-[#679cff] animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-[15px] font-extrabold text-[#e7e5e4]">{ota.loading ? 'Updating' : 'Idle'}</span>
                </div>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="bg-[#191a1a] p-4 rounded-xl flex flex-col gap-1 border border-[#484848]/10">
                <span className="text-[#acabaa] text-[9px] uppercase tracking-widest font-black">Runtime State</span>
                <span className="text-[14px] font-extrabold text-[#e7e5e4] truncate" title={ota.updateState}>{ota.updateState}</span>
              </motion.div>

              {/* Progress Bar Container */}
              <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="col-span-2 md:col-span-4 bg-[#191a1a] p-5 rounded-xl border border-[#484848]/10">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-[#e7e5e4]">Download / Installation Progress</span>
                  <span className="text-[11px] font-mono text-[#acabaa]">
                    {ota.progress}% {ota.statusText ? `(${ota.statusText})` : ''}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#252626] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#679cff] rounded-full transition-all duration-300"
                    style={{ width: `${ota.progress}%` }}
                  />
                </div>
              </motion.div>
            </motion.section>

            {/* ACCORDION/COLLAPSIBLE DRAWERS CONTAINER */}
            <div className="space-y-4">

              {/* SECTION: PRODUCTION ACTIONS */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, actions: !prev.actions }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">settings_suggest</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Production Actions</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.actions ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.actions && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5 bg-[#0e0e0e]/25">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                      <button 
                        onClick={handleCheckUpdates}
                        className="bg-[#1f2020] hover:bg-[#2c2c2c] p-4 rounded-xl flex flex-col items-start gap-3 transition-all border border-[#484848]/10 text-left focus:outline-none group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#679cff]/10 flex items-center justify-center text-[#679cff] group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-lg">refresh</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-[#e7e5e4]">Check for Updates</span>
                          <span className="text-[10px] text-[#acabaa]">Poll registries manually</span>
                        </div>
                      </button>

                      <button 
                        onClick={handleDownloadApkAction}
                        className="bg-[#1f2020] hover:bg-[#2c2c2c] p-4 rounded-xl flex flex-col items-start gap-3 transition-all border border-[#484848]/10 text-left focus:outline-none group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#679cff]/10 flex items-center justify-center text-[#679cff] group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-lg">download</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-[#e7e5e4]">Download APK</span>
                          <span className="text-[10px] text-[#acabaa]">Start target package download</span>
                        </div>
                      </button>

                      <button 
                        onClick={handleCompleteFlowAction}
                        className="bg-[#3a3b42] hover:brightness-110 p-4 rounded-xl flex flex-col items-start gap-3 transition-all border-none text-left focus:outline-none group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#ffffff]/20 flex items-center justify-center text-[#ffffff] group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-lg">play_arrow</span>
                        </div>
                        <div>
                          <span className="block font-bold text-xs text-white">Complete Flow</span>
                          <span className="text-[10px] text-white/80">Trigger full update loop</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: INTERACTIVE DEBUGGING TOOLS */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, simulation: !prev.simulation }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">build_circle</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Interactive Engineering Actions</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.simulation ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.simulation && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5 bg-[#0e0e0e]/25">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
                      <button onClick={handleCheckUpdates} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Refresh Metadata
                      </button>
                      <button onClick={handleVerifyCurrentApk} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Verify Current APK
                      </button>
                      <button onClick={handleVerifyCurrentApk} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Verify Signature
                      </button>
                      <button onClick={handleValidateDownloadUrl} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Validate Download URL
                      </button>
                      <button onClick={handleClearCacheAction} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Clear Cache
                      </button>
                      <button onClick={handleResetFsmState} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Reset State Machine
                      </button>
                      <button onClick={handleDownloadApkAction} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Retry Installation
                      </button>
                      <button onClick={handleExportDiagnosticsFile} className="bg-[#191a1a] hover:bg-[#252626] border border-[#484848]/10 text-left p-3 rounded-lg text-xs font-bold text-[#e7e5e4] focus:outline-none cursor-pointer transition-colors">
                        Export Technical Report
                      </button>
                    </div>

                    {/* Simulation Subsections */}
                    <div className="mt-4 pt-4 border-t border-[#484848]/10">
                      <span className="block text-[9px] font-black uppercase text-[#acabaa] tracking-wider mb-2">Simulation Lab Toggles</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center justify-between bg-[#191a1a] p-3 rounded-lg border border-[#484848]/10">
                          <span className="text-xs font-bold">Simulate Update Available</span>
                          <button 
                            onClick={() => toggleSimulation('forceUpdateAvailable')}
                            className={`w-8 h-4 rounded-full flex items-center px-0.5 border-none cursor-pointer transition-colors ${simulationList.forceUpdateAvailable ? 'bg-[#679cff]' : 'bg-[#252626]'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${simulationList.forceUpdateAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-[#191a1a] p-3 rounded-lg border border-[#484848]/10">
                          <span className="text-xs font-bold text-[#ee7d77]">Simulate Failure State</span>
                          <button 
                            onClick={() => toggleSimulation('forceDownloadFailure')}
                            className={`w-8 h-4 rounded-full flex items-center px-0.5 border-none cursor-pointer transition-colors ${simulationList.forceDownloadFailure ? 'bg-[#ee7d77]' : 'bg-[#252626]'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${simulationList.forceDownloadFailure ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-[#191a1a] p-3 rounded-lg border border-[#484848]/10">
                          <span className="text-xs font-bold">Force Signature Mismatch</span>
                          <button 
                            onClick={() => toggleSimulation('forceSignatureMismatch')}
                            className={`w-8 h-4 rounded-full flex items-center px-0.5 border-none cursor-pointer transition-colors ${simulationList.forceSignatureMismatch ? 'bg-[#679cff]' : 'bg-[#252626]'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${simulationList.forceSignatureMismatch ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-[#191a1a] p-3 rounded-lg border border-[#484848]/10">
                          <span className="text-xs font-bold">Simulate Download Throttling</span>
                          <button 
                            onClick={() => toggleSimulation('simulateDownloadThrottling')}
                            className={`w-8 h-4 rounded-full flex items-center px-0.5 border-none cursor-pointer transition-colors ${simulationList.simulateDownloadThrottling ? 'bg-[#679cff]' : 'bg-[#252626]'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${simulationList.simulateDownloadThrottling ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: LIVE FLIGHT RECORDER LOGS */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, logs: !prev.logs }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">terminal</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Live Logs ({filteredLogs.length})</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.logs ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.logs && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5">
                    <div className="bg-[#000000] border border-[#484848]/10 rounded-xl overflow-hidden flex flex-col h-80 shadow-inner mt-3">
                      {/* Log Action Filters Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-[#1f2020]/60 border-b border-[#484848]/10 shrink-0">
                        <div className="flex-1 flex items-center gap-2 bg-[#131313] px-3 py-1.5 rounded-lg border border-[#484848]/10">
                          <span className="material-symbols-outlined text-sm text-[#acabaa]">search</span>
                          <input 
                            type="text"
                            placeholder="Filter logs..."
                            value={logSearch}
                            onChange={e => setLogSearch(e.target.value)}
                            className="bg-transparent border-none text-xs text-[#e7e5e4] placeholder-[#acabaa]/40 focus:outline-none w-full font-mono focus:ring-0 p-0"
                          />
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
                          {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(level => {
                            const active = logFilter === level;
                            return (
                              <button
                                key={level}
                                onClick={() => setLogFilter(level as any)}
                                className={`px-2.5 py-1 rounded text-[9px] font-bold transition-colors cursor-pointer border-none focus:outline-none ${active ? 'bg-[#679cff] text-[#000000]' : 'bg-[#191a1a] text-[#acabaa] hover:bg-[#252626]'}`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Log Terminal Window */}
                      <div className="flex-1 p-4 font-mono text-[10px] leading-relaxed overflow-y-auto space-y-1.5 selection:bg-[#679cff]/20">
                        {filteredLogs.length === 0 ? (
                          <div className="text-[#acabaa]/40 italic text-center py-10">No flight recorder logs match your filters.</div>
                        ) : (
                          // Virtualized slice to prevent DOM overhead and main thread blocks
                          filteredLogs.slice(0, 200).map((log, i) => {
                            const date = new Date(log.timestamp);
                            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                            const isErr = log.severity === 'ERROR' || log.severity === 'FATAL';
                            const isWarn = log.severity === 'WARN';
                            const color = isErr ? 'text-[#ee7d77]' : (isWarn ? 'text-[#fbbf24]' : (log.severity === 'DEBUG' ? 'text-[#a78bfa]' : 'text-[#679cff]'));
                            return (
                              <div key={i} className="flex items-start gap-2.5 hover:bg-[#191a1a]/30 py-0.5 px-1 rounded transition-colors">
                                <span className="text-[#acabaa]/40 shrink-0 select-none">{timeStr}</span>
                                <span className={`font-bold shrink-0 select-none uppercase ${color}`}>[{log.severity || 'INFO'}]</span>
                                <span className="text-[#e7e5e4] break-all">
                                  <span className="text-[#acabaa]/80 font-bold shrink-0">{log.caller || 'None'}</span> &rarr; {log.eventType} {log.reason ? `(${log.reason})` : ''} {log.warning || log.error || ''} {log.details ? `| details: ${log.details}` : ''}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: DIAGNOSTICS CARD FILTER */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, diagnostics: !prev.diagnostics }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">analytics</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Diagnostics Details</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.diagnostics ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.diagnostics && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5">
                    {/* Search & Category Filter */}
                    <div className="flex flex-col gap-3 py-3 shrink-0">
                      <div className="flex items-center gap-2 bg-[#131313] px-3 py-2 rounded-lg border border-[#484848]/10">
                        <span className="material-symbols-outlined text-sm text-[#acabaa]">search</span>
                        <input 
                          type="text"
                          placeholder="Search diagnostics database..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="bg-transparent border-none text-xs text-[#e7e5e4] placeholder-[#acabaa]/40 focus:outline-none w-full focus:ring-0 p-0"
                        />
                      </div>
                      
                      {/* Horizontal Category Pill List */}
                      <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
                        {['All', 'Performance', 'Updater', 'Downloads', 'Installation', 'Version Manager', 'Android', 'Storage', 'Network', 'Firebase', 'GitHub', 'PackageInstaller'].map(cat => {
                          const active = selectedCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setExpandedEntryIdx(null);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border-none focus:outline-none cursor-pointer ${active ? 'bg-[#679cff] text-[#000000]' : 'bg-[#1f2020] text-[#acabaa] hover:bg-[#2c2c2c]'}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtered Cards List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {filteredDiagnostics.length === 0 ? (
                        <div className="text-center py-10 text-xs italic text-[#acabaa]/40">No diagnostics matches this search.</div>
                      ) : (
                        filteredDiagnostics.map((entry, idx) => {
                          const expanded = expandedEntryIdx === idx;
                          const color = entry.severity === 'Error' ? 'text-[#ee7d77]' : (entry.severity === 'Warning' ? 'text-[#fbbf24]' : 'text-[#679cff]');
                          const icon = entry.severity === 'Error' ? 'error' : (entry.severity === 'Warning' ? 'warning' : 'info');
                          return (
                            <div 
                              key={idx}
                              onClick={() => setExpandedEntryIdx(expanded ? null : idx)}
                              className="bg-[#191a1a] border border-[#484848]/10 rounded-xl p-3 cursor-pointer hover:bg-[#252626] transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span className={`material-symbols-outlined text-md shrink-0 mt-0.5 ${color}`}>{icon}</span>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#acabaa]/60">{entry.subsystem}</span>
                                    <h4 className="font-extrabold text-xs text-[#e7e5e4] m-0 mt-0.5">{entry.summary}</h4>
                                  </div>
                                </div>
                                <span className={`material-symbols-outlined text-[#acabaa] text-md transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                                  expand_more
                                </span>
                              </div>

                              {expanded && (
                                <div className="mt-3 pt-3 border-t border-[#484848]/10 text-xs space-y-2 leading-relaxed text-[#acabaa]">
                                  <div>
                                    <strong className="block text-[#e7e5e4] text-[10px] uppercase font-black mb-1">Technical details:</strong>
                                    <pre className="font-mono bg-[#000000] p-2 rounded text-[10px] text-[#679cff] overflow-x-auto whitespace-pre-wrap">{entry.technicalExplanation}</pre>
                                  </div>
                                  <div>
                                    <strong className="block text-[#e7e5e4] text-[10px] uppercase font-black mb-1">Human explanation:</strong>
                                    <p className="m-0 text-[#e7e5e4]/90">{entry.humanExplanation}</p>
                                  </div>
                                  <div>
                                    <strong className="block text-[#e7e5e4] text-[10px] uppercase font-black mb-1">Suggested fix:</strong>
                                    <p className="m-0 text-white/95">{entry.suggestedSolution}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: STATE MACHINE TIMELINE */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, timeline: !prev.timeline }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">account_tree</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Update State Machine</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.timeline ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.timeline && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5">
                    <div className="bg-[#131313] p-5 rounded-xl border border-[#484848]/10 space-y-5 mt-3">
                      {timelineStates.map((step, idx) => {
                        const status = getTimelineStepStatus(step.id);
                        const isLast = idx === timelineStates.length - 1;
                        
                        let markerNode;
                        let textClass = 'text-[#acabaa]/40';
                        if (status === 'COMPLETED') {
                          markerNode = (
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-500 border border-green-500/30">
                              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                            </div>
                          );
                          textClass = 'text-green-500';
                        } else if (status === 'ACTIVE') {
                          markerNode = (
                            <div className="w-5 h-5 rounded-full bg-[#679cff]/20 flex items-center justify-center shrink-0 text-[#679cff] border border-[#679cff]/30 animate-pulse">
                              <div className="w-2 h-2 rounded-full bg-[#679cff]" />
                            </div>
                          );
                          textClass = 'text-[#679cff] font-extrabold';
                        } else {
                          markerNode = (
                            <div className="w-5 h-5 rounded-full bg-[#252626] flex items-center justify-center shrink-0 text-[#acabaa]/30 border border-[#484848]/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#acabaa]/30" />
                            </div>
                          );
                        }

                        return (
                          <div key={step.id} className="relative flex gap-4 items-start">
                            {/* Vertical connector line */}
                            {!isLast && (
                              <div 
                                className="absolute left-[9px] top-5 bottom-[-20px] w-0.5 bg-[#484848] opacity-35"
                                style={{
                                  backgroundColor: status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(72, 72, 72, 0.2)'
                                }}
                              />
                            )}
                            {markerNode}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs m-0 leading-tight ${textClass}`}>{step.label}</h4>
                              <p className="text-[10px] text-[#acabaa]/60 m-0 mt-0.5 truncate">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: REPORT PREVIEW */}
              <div className="bg-[#191a1a]/40 rounded-2xl border border-[#484848]/10 overflow-hidden">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, report: !prev.report }))}
                  className="w-full flex items-center justify-between p-4 bg-transparent border-none text-left cursor-pointer hover:bg-[#1f2020] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#acabaa] text-lg">description</span>
                    <span className="text-[11px] font-black text-[#acabaa] uppercase tracking-widest">Diagnostics Report Preview</span>
                  </div>
                  <span className={`material-symbols-outlined text-[#acabaa] transition-transform duration-250 ${!collapsed.report ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {!collapsed.report && (
                  <div className="p-4 pt-0 border-t border-[#484848]/5">
                    <div className="bg-black/90 p-4 rounded-xl border border-[#484848]/10 mt-3">
                      <pre className="font-mono text-[9.5px] leading-relaxed text-[#acabaa]/90 overflow-x-auto whitespace-pre-wrap selection:bg-[#679cff]/20">
                        {getDiagnosticsText().slice(0, 1500)}...
                        <div className="text-[9px] text-[#acabaa]/40 italic mt-3">// Report has been truncated. Click Copy Report for full trace data.</div>
                      </pre>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
