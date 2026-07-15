import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
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
  updateDiagnostics,
  PerformanceProfiler,
  getTransitionHistory,
  getRejectedTransitions,
  addJsLog,
  updateDebugLogs,
  useChordStore,
  useNavigationStore,
  APP_VERSION,
  useAppUpdate,
  transitionToState,
  applyUpdateDirect,
  checkAndCleanCache,
  runSignatureMismatchRecovery,
  deleteLocalApk,
  ACCENT_COLORS,
  PRODUCTION_SIGNING_SHA256
} from '@workspace/studio-core';
import { copyToClipboard } from './centralizedClipboard';

// Generate real diagnostics from memory
export interface DiagnosticEntry {
  category: 'Performance' | 'Updater' | 'Downloads' | 'Installation' | 'Version Manager' | 'Android' | 'Storage' | 'Network' | 'Firebase' | 'GitHub' | 'PackageInstaller';
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Error';
  subsystem: string;
  summary: string;
  technicalExplanation: string;
  humanExplanation: string;
  suggestedSolution: string;
}

export function getStructuredDiagnostics(developerMode: boolean): DiagnosticEntry[] {
  const list: DiagnosticEntry[] = [];
  const nowStr = new Date().toISOString();

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

  list.push({
    category: 'Updater',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'FSM Core',
    summary: 'State machine active engine verification',
    technicalExplanation: `Current core updateState: ${globalUpdateState.updateState}. SessionId: ${globalUpdateState.sessionId || 'None'}.`,
    humanExplanation: 'Verifies the updater state machine is running and responding to lifecycle events.',
    suggestedSolution: 'Check state machine listeners and log files if updates are stuck.'
  });

  list.push({
    category: 'Android',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Device Info',
    summary: 'Device details and environment',
    technicalExplanation: `Model: ${updateDiagnostics.deviceModel || 'Browser'}. OS: Android ${updateDiagnostics.androidVersion || 'N/A'}. Network: ${updateDiagnostics.networkState || 'N/A'}.`,
    humanExplanation: 'Information about the hardware and operating system running the application.',
    suggestedSolution: 'Use official emulator profiles or certified Android devices for standard verification.'
  });

  list.push({
    category: 'Storage',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'File System Space',
    summary: 'Available disk partition spacing',
    technicalExplanation: `Storage Available: ${updateDiagnostics.storageAvailable || 'N/A'}. APK Temp Path: ${updateDiagnostics.apkPath || 'N/A'}.`,
    humanExplanation: 'Checks if there is enough free disk space on the device to download and stage updates.',
    suggestedSolution: 'Clear application caches or native system files if storage is critically low.'
  });

  list.push({
    category: 'Firebase',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'Update Manifest',
    summary: 'Firebase CDN manifest updates checks',
    technicalExplanation: `version.json payload: ${updateDebugLogs.fetchedVersionJson || 'Not fetched'}. app-release.json payload: ${updateDebugLogs.fetchedAppReleaseJson || 'Not fetched'}.`,
    humanExplanation: 'Validates update metadata returned from Firebase Hosting static files.',
    suggestedSolution: 'Ensure static files exist under firebase-public/ and deployment is successful.'
  });

  list.push({
    category: 'PackageInstaller',
    timestamp: nowStr,
    severity: 'Info',
    subsystem: 'System Installer API',
    summary: 'PackageInstaller broadcast receiver response',
    technicalExplanation: `Installer Lock Status: ${isInstallationLocked() ? 'Locked' : 'Unlocked'}. Post Install Session: ${isPostInstallSessionActive() ? 'Active' : 'Idle'}.`,
    humanExplanation: 'The response returned by the Android system package installer.',
    suggestedSolution: 'Check settings permissions and clear conflicting packages.'
  });

  return list;
}

// Window Width hook for responsive dual-column layouts
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

export default function UpdaterDiagnosticsPage() {
  const ota = useAppUpdate();
  const settings = useChordStore(s => s.settings);
  const accentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'blue';
  const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;
  const isWebDesktop = useIsWebDesktop();
  const width = useWindowWidth();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedEntryIdx, setExpandedEntryIdx] = useState<number | null>(null);

  // Flight Recorder Live Logs
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');
  const [logEntries, setLogEntries] = useState<any[]>([]);

  // Action Status & Message Grid
  const [actionStatus, setActionStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [actionMessage, setActionMessage] = useState<Record<string, string>>({});

  // Simulated properties
  const [simActive, setSimActive] = useState(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('studio:is_simulation_active') === 'true';
  });
  const [simulationList, setSimulationList] = useState({
    forceUpdateAvailable: updaterSimulation.forceUpdateAvailable,
    forceSignatureMismatch: updaterSimulation.forceSignatureMismatch,
    forceShaFailure: updaterSimulation.forceShaFailure,
    forceMetadataFailure: updaterSimulation.forceMetadataFailure,
    forceDownloadFailure: updaterSimulation.forceDownloadFailure,
    simulateDownloadThrottling: updaterSimulation.simulateDownloadThrottling,
  });

  const [fps, setFps] = useState(60);

  // Dynamic status configurations
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const triggerRefresh = useCallback(() => setRefreshCount(prev => prev + 1), []);

  // Periodic Logs Fetcher
  const refreshLogs = useCallback(() => {
    try {
      const events = UpdaterFlightRecorder.getEvents();
      setLogEntries([...events].reverse());
    } catch (_) {}
  }, []);

  // Subscribe to FSM State Machine transitions
  useEffect(() => {
    const listener = () => {
      triggerRefresh();
      refreshLogs();
    };
    stateListeners.add(listener);
    
    // Set periodic logs poller
    const logInterval = setInterval(refreshLogs, 1500);
    refreshLogs();

    return () => {
      stateListeners.delete(listener);
      clearInterval(logInterval);
    };
  }, [triggerRefresh, refreshLogs]);

  // FPS Tracker
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

  // Workflow safety: Clean up simulation overrides on component unmount
  useEffect(() => {
    return () => {
      // Restore the real updater by turning off all simulation flags
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
      
      localStorage.removeItem('studio:is_simulation_active');
    };
  }, []);

  // Filtered Logs list
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

  // Filtered Diagnostics compiled
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

  // Compile full text diagnostics report
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

  // Helper to wrap action execution with progress spinners
  const executeAction = async (key: string, fn: () => Promise<void>) => {
    setActionStatus(prev => ({ ...prev, [key]: 'loading' }));
    setActionMessage(prev => ({ ...prev, [key]: 'Processing...' }));
    try {
      await fn();
      setActionStatus(prev => ({ ...prev, [key]: 'success' }));
      setActionMessage(prev => ({ ...prev, [key]: 'Completed successfully' }));
    } catch (e: any) {
      setActionStatus(prev => ({ ...prev, [key]: 'error' }));
      setActionMessage(prev => ({ ...prev, [key]: e.message || String(e) }));
      showToast(`Action failed: ${e.message || String(e)}`);
    }
  };

  // Action handlers
  const handleCheckUpdates = () => executeAction('refreshMetadata', async () => {
    await ota.checkNow();
  });

  const handleVerifyCurrentApk = () => executeAction('verifyApk', async () => {
    const path = updateDiagnostics.apkPath || updateDebugLogs.downloadedApkPath;
    if (!path) throw new Error('No downloaded APK cached in directory.');
    const { runEligibilityCheck } = await import('@workspace/studio-core/src/lib/updater/eligibilityVerification');
    const eligible = await runEligibilityCheck(path);
    if (!eligible) {
      throw new Error(`APK verification failed: ${updateDebugLogs.eligibilityReason || 'unknown integrity code'}`);
    }
  });

  const handleVerifySignature = () => executeAction('verifySig', async () => {
    const path = updateDiagnostics.apkPath || updateDebugLogs.downloadedApkPath;
    if (!path) throw new Error('No downloaded APK cached in directory.');
    const { runEligibilityCheck } = await import('@workspace/studio-core/src/lib/updater/eligibilityVerification');
    await runEligibilityCheck(path);
    if (!updateDebugLogs.eligibilitySigningMatch) {
      throw new Error(`Signature fingerprint mismatch. Expected production fingerprint, got: ${updateDebugLogs.downloadedSigningSha256 || 'N/A'}`);
    }
  });

  const handleValidateDownloadUrl = () => executeAction('validateUrl', async () => {
    const url = ota.apkUrl || ota.downloadUrl || updateDiagnostics.downloadUrl;
    if (!url || url === 'N/A') throw new Error('No active download URL available in metadata.');
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) throw new Error(`URL reachability failed: HTTP status ${res.status}`);
  });

  const handleClearCacheAction = () => executeAction('clearCache', async () => {
    await checkAndCleanCache();
  });

  const handleResetFsmState = () => executeAction('resetFsm', async () => {
    transitionToState('IDLE', 'Diagnostics manual state reset', undefined);
  });

  const handleRetryInstallation = () => executeAction('retryInstall', async () => {
    const path = updateDiagnostics.apkPath || updateDebugLogs.downloadedApkPath;
    if (!path) throw new Error('No cached APK available. Run Check/Download update first.');
    await applyUpdateDirect();
  });

  const handleExportReport = () => executeAction('exportReport', async () => {
    const text = getDiagnosticsText();
    // 1. Download file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studio-updater-diagnostics-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    // 2. Copy report to clipboard
    await navigator.clipboard.writeText(text);
  });

  // Simulation Scenario workflows
  const clearSimulationOverrides = () => {
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

  const handleSimulateUpdateAvailable = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearSimulationOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.forceInstallSuccess = true;
    await checkForUpdate(true, 'dev_tools', 'Simulation: Successful Update');
    showToast('Simulating update available workflow...');
  };

  const handleSimulateFailure = async () => {
    localStorage.setItem('studio:is_simulation_active', 'true');
    setSimActive(true);
    clearSimulationOverrides();
    updaterSimulation.runWorkflowActive = true;
    updaterSimulation.forceUpdateAvailable = true;
    updaterSimulation.simulateDownload = true;
    updaterSimulation.injectDownloadFailure = true;
    updaterSimulation.forceDownloadFailure = true;
    await checkForUpdate(true, 'dev_tools', 'Simulation: Download Failure');
    showToast('Simulating update failure state...');
  };

  const handleResetSimulation = () => {
    clearSimulationOverrides();
    resetAppUpdateState();
    localStorage.removeItem('studio:is_simulation_active');
    setSimActive(false);
    setSimulationList({
      forceUpdateAvailable: false,
      forceSignatureMismatch: false,
      forceShaFailure: false,
      forceMetadataFailure: false,
      forceDownloadFailure: false,
      simulateDownloadThrottling: false,
    });
    showToast('Simulation sandbox deactivated.');
  };

  // Stepper helper component
  const renderStepIcon = (status: 'COMPLETED' | 'ACTIVE' | 'PENDING') => {
    if (status === 'COMPLETED') {
      return (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-success, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
          ✓
        </div>
      );
    }
    if (status === 'ACTIVE') {
      return (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--studio-accent-from, #679cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 10, fontWeight: 'bold', animation: 'lg-spin-spinner 1.5s linear infinite' }}>
          🗘
        </div>
      );
    }
    return (
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--c-border, rgba(128,128,128,0.2))', background: 'transparent' }} />
    );
  };

  // Main views
  const renderActionStatus = (key: string) => {
    const status = actionStatus[key];
    const msg = actionMessage[key];
    if (!status || status === 'idle') return null;

    if (status === 'loading') {
      return <span style={{ fontSize: 10, color: 'var(--c-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><span className="animate-spin text-xs">🗘</span> {msg}</span>;
    }
    if (status === 'success') {
      return <span style={{ fontSize: 10, color: 'var(--c-success, #22c55e)', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Done</span>;
    }
    return <span style={{ fontSize: 10, color: 'var(--c-danger, #ef4444)', display: 'flex', alignItems: 'center', gap: 4 }} title={msg}>✗ Error</span>;
  };

  const renderTelemetryGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>App Version</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4, fontFamily: 'monospace' }}>v{APP_VERSION}</span>
      </div>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>Target Version</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4, color: 'var(--studio-accent-from)', fontFamily: 'monospace' }}>{ota.remoteVersion || 'Check Pending'}</span>
      </div>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>FSM State</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4, fontFamily: 'monospace' }}>{ota.updateState}</span>
      </div>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>Installer API</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{isInstallationLocked() ? '🔒 Locked' : '🔓 Available'}</span>
      </div>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>Storage space</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{updateDiagnostics.storageAvailable || 'N/A'}</span>
      </div>
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 12, borderRadius: 12 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800 }}>Session Profile</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{ota.sessionId || 'None'}</span>
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
      {[
        { key: 'refreshMetadata', label: 'Refresh Metadata', action: handleCheckUpdates },
        { key: 'verifyApk', label: 'Verify Current APK', action: handleVerifyCurrentApk },
        { key: 'verifySig', label: 'Verify Signature', action: handleVerifySignature },
        { key: 'validateUrl', label: 'Validate Download URL', action: handleValidateDownloadUrl },
        { key: 'clearCache', label: 'Clear Cache', action: handleClearCacheAction },
        { key: 'resetFsm', label: 'Reset State Machine', action: handleResetFsmState },
        { key: 'retryInstall', label: 'Retry Installation', action: handleRetryInstallation },
        { key: 'exportReport', label: 'Export Diagnostics Report', action: handleExportReport },
      ].map(act => (
        <button
          key={act.key}
          onClick={act.action}
          style={{
            background: 'var(--c-surface-card)',
            border: '1px solid var(--c-border)',
            borderRadius: 12,
            padding: 12,
            color: 'var(--c-text-primary)',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
          className="hover:scale-[1.02] active:scale-98"
        >
          <span>{act.label}</span>
          {renderActionStatus(act.key)}
        </button>
      ))}
    </div>
  );

  const renderSimulationLab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Test workflows preset */}
      <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 16, borderRadius: 16 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Workflow Test Scenarios</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={handleSimulateUpdateAvailable} style={{ flex: '1 1 150px', padding: '10px 14px', background: 'rgba(var(--accent-rgb, 103,156,255), 0.12)', border: '1px solid var(--studio-accent-from)', color: 'var(--studio-accent-from)', borderRadius: 10, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
            Simulate Update Available
          </button>
          <button onClick={handleSimulateFailure} style={{ flex: '1 1 150px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
            Simulate Failure State
          </button>
          <button onClick={handleResetSimulation} style={{ flex: '1 1 150px', padding: '10px 14px', background: 'rgba(128, 128, 128, 0.15)', border: '1px solid var(--c-border)', color: 'var(--c-text-primary)', borderRadius: 10, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
            Deactivate Sandbox
          </button>
        </div>
      </div>

      {/* Overrides toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 'bold' }}>Simulate Update Available</span>
          <input type="checkbox" checked={simulationList.forceUpdateAvailable} onChange={() => toggleSimulation('forceUpdateAvailable')} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 'bold', color: '#ef4444' }}>Simulate Download Failure</span>
          <input type="checkbox" checked={simulationList.forceDownloadFailure} onChange={() => toggleSimulation('forceDownloadFailure')} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 'bold' }}>Force Signature Mismatch</span>
          <input type="checkbox" checked={simulationList.forceSignatureMismatch} onChange={() => toggleSimulation('forceSignatureMismatch')} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 'bold' }}>Simulate Download Throttling</span>
          <input type="checkbox" checked={simulationList.simulateDownloadThrottling} onChange={() => toggleSimulation('simulateDownloadThrottling')} style={{ cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  );

  const renderTimelineVisualizer = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {timelineStates.map(state => {
        const status = getTimelineStepStatus(state.id);
        return (
          <div key={state.id} style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {renderStepIcon(status)}
              <div style={{ width: 2, height: 24, background: status === 'COMPLETED' ? 'var(--c-success, #22c55e)' : 'var(--c-border, rgba(128,128,128,0.2))', margin: '4px 0' }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: status === 'ACTIVE' ? 'var(--studio-accent-from)' : 'var(--c-text-primary)' }}>{state.label}</span>
              <p style={{ fontSize: 9, color: 'var(--c-text-secondary)', margin: '2px 0 0' }}>{state.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLiveLogsTerminal = () => (
    <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid var(--c-border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--c-border)', background: 'rgba(128,128,128,0.06)' }}>
        <input 
          type="text" 
          placeholder="Filter logs..." 
          value={logSearch} 
          onChange={e => setLogSearch(e.target.value)} 
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 11, fontFamily: 'monospace', width: '100%', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'INFO', 'WARN', 'ERROR'].map(lvl => (
            <button key={lvl} onClick={() => setLogFilter(lvl as any)} style={{ fontSize: 9, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, border: 'none', background: logFilter === lvl ? 'var(--studio-accent-from)' : 'rgba(255,255,255,0.08)', color: logFilter === lvl ? '#000' : '#ccc', cursor: 'pointer' }}>
              {lvl}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: 12, overflowY: 'auto', fontFamily: 'monospace', fontSize: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No logs found matching filters.</div>
        ) : (
          filteredLogs.slice(0, 100).map((log, i) => {
            const date = new Date(log.timestamp);
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
            const isErr = log.severity === 'ERROR' || log.severity === 'FATAL';
            const isWarn = log.severity === 'WARN';
            const color = isErr ? '#ee7d77' : (isWarn ? '#fbbf24' : '#679cff');
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 6, padding: '2px 0' }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{timeStr}</span>
                <span style={{ color, flexShrink: 0 }}>[{log.severity || 'INFO'}]</span>
                <span style={{ color: '#fff', wordBreak: 'break-all' }}>{log.eventType}: {log.reason || log.details}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderDiagnosticsDetails = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Category selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Performance', 'Updater', 'Storage', 'PackageInstaller'].map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '6px 12px', border: 'none', background: selectedCategory === cat ? 'var(--studio-accent-from)' : 'var(--c-surface-card)', color: selectedCategory === cat ? '#000' : 'var(--c-text-primary)', borderRadius: 20, fontSize: 10, fontWeight: 'bold', cursor: 'pointer' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Details List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredDiagnostics.map((entry, idx) => {
          const expanded = expandedEntryIdx === idx;
          return (
            <div key={idx} style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div onClick={() => setExpandedEntryIdx(expanded ? null : idx)} style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <span style={{ fontSize: 8, textTransform: 'uppercase', background: 'rgba(128,128,128,0.1)', color: 'var(--c-text-secondary)', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', marginRight: 8 }}>{entry.category}</span>
                  <span style={{ fontSize: 12, fontWeight: 'bold' }}>{entry.summary}</span>
                </div>
                <span style={{ fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
              </div>
              {expanded && (
                <div style={{ padding: 12, borderTop: '1px solid var(--c-border)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--c-text-secondary)' }}>
                  <p style={{ margin: '4px 0' }}><strong>Technical explanation:</strong> {entry.technicalExplanation}</p>
                  <p style={{ margin: '4px 0' }}><strong>Impact details:</strong> {entry.humanExplanation}</p>
                  <p style={{ margin: '4px 0' }}><strong>Suggested fix:</strong> {entry.suggestedSolution}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const mainLayoutContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* PROGRESS TRACKER */}
      {ota.loading && (
        <div style={{ background: 'rgba(var(--accent-rgb), 0.08)', border: '1px solid var(--studio-accent-from)', padding: 16, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--studio-accent-from)' }}>Applying Update (FSM: {ota.updateState})</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{ota.progress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--c-border, rgba(128,128,128,0.2))', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${ota.progress}%`, height: '100%', background: 'var(--studio-accent-from)', borderRadius: 3, transition: 'width 0.2s ease-out' }} />
          </div>
          {updateDebugLogs.downloadStatus && (
            <p style={{ fontSize: 9, color: 'var(--c-text-secondary)', margin: '8px 0 0', fontFamily: 'monospace' }}>{updateDebugLogs.downloadStatus}</p>
          )}
        </div>
      )}

      {/* DUAL-COLUMN GRID ON DESKTOP/LANDSCAPE */}
      {width >= 1024 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* LEFT COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>System Telemetry</span>
              {renderTelemetryGrid()}
            </div>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Engineering Operations</span>
              {renderActionButtons()}
            </div>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Simulation Lab</span>
              {renderSimulationLab()}
            </div>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Diagnostics Explorer</span>
              {renderDiagnosticsDetails()}
            </div>
          </div>

          {/* RIGHT COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 16 }}>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>State Machine Timeline</span>
              <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 16, borderRadius: 16 }}>
                {renderTimelineVisualizer()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Live Flight recorder Terminal</span>
              {renderLiveLogsTerminal()}
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE COLUMN ON PORTRAIT/MOBILE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>System Telemetry</span>
            {renderTelemetryGrid()}
          </div>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Engineering Operations</span>
            {renderActionButtons()}
          </div>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>State Machine Timeline</span>
            <div style={{ background: 'var(--c-surface-card)', border: '1px solid var(--c-border)', padding: 16, borderRadius: 16 }}>
              {renderTimelineVisualizer()}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Live Flight recorder Terminal</span>
            {renderLiveLogsTerminal()}
          </div>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Simulation Lab</span>
            {renderSimulationLab()}
          </div>
          <div>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text-secondary)', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 8 }}>Diagnostics Explorer</span>
            {renderDiagnosticsDetails()}
          </div>
        </div>
      )}

      {/* FLOAT NOTIFICATION TOAST */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--content-bottom-pad, 96px) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid var(--c-border)',
          borderRadius: 20,
          padding: '10px 20px',
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );

  return mainLayoutContent;
}
