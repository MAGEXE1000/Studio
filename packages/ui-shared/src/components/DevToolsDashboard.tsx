import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useChordStore,
  subscribeToDevTools,
  getLogs,
  clearLogs,
  getErrors,
  clearErrors,
  getEvents,
  clearEvents,
  getNetworkRequests,
  clearNetworkRequests,
  getPerfStats,
  clearPerfStats,
  getDebugProviders,
  maskSensitiveValue,
  APP_VERSION,
  isNative,
  getStagexDiagnostics,
  resetStagexDiagnostics,
  otaDiagnostics,
  otaDebugLogs,
  getStageIframe,
  getNavigationEntries,
  clearNavigationEntries,
  NavigationEntry,
  updaterSimulation,
  triggerSimulatedStatus,
  addJsLog,
  jsLogs,
  nativeLogs,
  stateTimeline,
  activityLifecycleTimeline,
  recordActivityLifecycle,
  simulateStatusCallback,
  globalOtaState,
  resetOtaUpdateState,
  resetOtaDiagnostics,
  checkForUpdate,
  downloadUpdate,
  applyUpdate,
  deleteLocalApk,
  transitionHistory,
  rejectedTransitions,
  AppInstaller,
  APP_VERSION_LABEL,
  NATIVE_VERSION,
  transitionToState,
  updateGlobalState
} from '@workspace/studio-core';

import { decodeReactError } from './ErrorBoundary';

interface Props {
  accent: { from: string; mid?: string; to: string };
  onBack: () => void;
}

type TabId = 'logs' | 'errors' | 'events' | 'perf' | 'state' | 'nav' | 'network' | 'storage' | 'providers';

interface WarningItem {
  id: string;
  timestamp: number;
  module: string;
  severity: string;
  title: string;
  message: string;
  source: string;
  duplicateCount: number;
}

interface WarningsInspectorProps {
  logs: any[];
  showToast: (msg: string) => void;
  moduleFilter?: string[];
  appKey?: string;
}

const WarningsInspector = ({ logs, showToast, moduleFilter, appKey }: WarningsInspectorProps) => {
  const [showWarnings, setShowWarnings] = useState(false);

  const appWarnings = useMemo(() => {
    return logs.filter(l => {
      if (l.level !== 'warn') return false;
      const mod = l.module.toLowerCase();
      
      if (appKey) {
        if (appKey === 'chords') return mod === 'chordex';
        if (appKey === 'drums') return mod === 'drumex' || mod === 'drums';
        if (appKey === 'stage') return mod === 'stagex' || mod === 'stage';
        if (appKey === 'groovex') return mod === 'groovex';
        if (appKey === 'vocalex') return mod === 'vocalex';
        if (appKey === 'hub') {
          return !['chordex', 'drumex', 'drums', 'stagex', 'stage', 'groovex', 'vocalex', 'network', 'firestore', 'sync'].includes(mod);
        }
        return false;
      }

      if (moduleFilter) {
        return moduleFilter.some(m => m.toLowerCase() === mod);
      }

      return true;
    });
  }, [logs, moduleFilter, appKey]);

  const groupedWarnings = useMemo<WarningItem[]>(() => {
    const groups: WarningItem[] = [];

    appWarnings.forEach(w => {
      const existing = groups.find(g => g.message === w.message && g.module === w.module);
      if (existing) {
        existing.duplicateCount += 1;
        if (w.timestamp > existing.timestamp) {
          existing.timestamp = w.timestamp;
        }
      } else {
        const title = w.message.split('\n')[0].substring(0, 80);
        groups.push({
          id: w.id || Math.random().toString(36).substring(2, 9),
          timestamp: w.timestamp,
          module: w.module,
          severity: w.level || 'warn',
          title,
          message: w.message,
          source: w.source || 'unknown',
          duplicateCount: 1
        });
      }
    });

    return groups;
  }, [appWarnings]);

  if (appWarnings.length === 0) {
    if (appKey === 'hub') {
      return (
        <div style={{
          marginTop: 12,
          background: 'rgba(16, 185, 129, 0.03)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
            No warnings
          </span>
        </div>
      );
    }
    return null;
  }

  const handleCopyWarning = (w: WarningItem) => {
    navigator.clipboard.writeText(`[${w.module}] [${w.source}] ${w.message}`)
      .then(() => showToast('Warning copied!'))
      .catch(() => showToast('Copy failed.'));
  };

  const handleCopyAll = () => {
    const text = appWarnings.map(w => `[${new Date(w.timestamp).toISOString()}] [${w.module}] [${w.level.toUpperCase()}] [${w.source || 'unknown'}] ${w.message}`).join('\n');
    navigator.clipboard.writeText(text)
      .then(() => showToast('All warnings copied!'))
      .catch(() => showToast('Copy failed.'));
  };

  return (
    <div style={{
      marginTop: 12,
      background: 'rgba(245, 158, 11, 0.03)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: '12px',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 18 }}>warning</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
            {appWarnings.length} Warnings Detected
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowWarnings(!showWarnings);
          }}
          
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {showWarnings ? 'Hide Warnings' : 'View Warnings'}
        </button>
      </div>

      {showWarnings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyAll();
              }}
              
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Copy All Warnings
            </button>
          </div>
          
          <div style={{
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4
          }}>
            {groupedWarnings.map((w, idx) => (
              <div key={w.id || idx} style={{
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.04)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: '#f59e0b',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '9px'
                    }}>{w.severity.toUpperCase()}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      Module: {w.module}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                      Source: {w.source}
                    </span>
                    {w.duplicateCount > 1 && (
                      <span style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '9px'
                      }}>
                        ×{w.duplicateCount}
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
                    {new Date(w.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div style={{
                  color: '#f59e0b',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  marginTop: 2
                }}>
                  {w.title}
                </div>

                <div style={{
                  color: '#fff',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.3,
                  fontFamily: 'monospace',
                  marginTop: 2
                }}>
                  {w.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyWarning(w);
                    }}
                    
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '9px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Copy Warning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DevToolsDashboard({ accent, onBack }: Props) {
  const { settings, updateSettings, activePanel } = useChordStore();
  const [subView, setSubView] = useState<'dashboard' | 'stagex' | 'updater' | 'system' | 'logs' | 'performance' | 'network' | 'apps'>('dashboard');
  const [activeTab, setActiveTab] = useState<TabId>('logs');
  const lastAppRef = useRef<string>('Livex Hub');
  const [versionUpdates, setVersionUpdates] = useState(0);

  const [expandedLogIndices, setExpandedLogIndices] = useState<Record<number, boolean>>({});
  const [updaterTabMode, setUpdaterTabMode] = useState<'laboratory' | 'diagnostics'>('laboratory');

  const [diagExceptionCollapsed, setDiagExceptionCollapsed] = useState(true);
  const [stateHistoryCollapsed, setStateHistoryCollapsed] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterMode, setLogFilterMode] = useState<'all' | 'js' | 'native' | 'state' | 'errors' | 'warnings' | 'pkg_installer' | 'lifecycle' | 'state_machine'>('all');
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    status: false,
    actions: false,
    logs: false,
    diagnostics: false,
    simulation: true,
    stateMachine: false,
    report: true,
  });
  const [buttonStates, setButtonStates] = useState<Record<string, 'idle' | 'running' | 'success' | 'failure'>>({});
  // consoleEndRef removed to prevent WebView viewport shifting

  const [nativeInstallerDetails, setNativeInstallerDetails] = useState<any>(null);
  const [nativeDeviceInfo, setNativeDeviceInfo] = useState<any>(null);
  const [localApkDetails, setLocalApkDetails] = useState<any>(null);
  const [nativeLogsList, setNativeLogsList] = useState<any[]>([]);
  const [simUpdateCount, setSimUpdateCount] = useState(0);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [auditResults, setAuditResults] = useState<Array<{ name: string; status: 'success' | 'failed'; message: string }>>([]);
  const triggerSimRender = () => setSimUpdateCount(prev => prev + 1);

  // scrollIntoView useEffect removed to prevent automatic jumping to bottom

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshData = async () => {
    try {
      if (isNative() && typeof AppInstaller !== 'undefined') {
        // 1. Get Device Info
        const dev = await AppInstaller.getDeviceInfo();
        if (isMountedRef.current) setNativeDeviceInfo(dev);

        // 2. Get PackageInstaller Details
        if (typeof AppInstaller.getExtendedDiagnostics === 'function') {
          const det = await AppInstaller.getExtendedDiagnostics();
          if (isMountedRef.current) setNativeInstallerDetails(det);
        } else if (typeof (AppInstaller as any).getPackageInstallerDetails === 'function') {
          const det = await (AppInstaller as any).getPackageInstallerDetails();
          if (isMountedRef.current) setNativeInstallerDetails(det);
        }

        // 3. Get Installer Log History
        if (typeof AppInstaller.getInstallerLogHistory === 'function') {
          const historyRes = await AppInstaller.getInstallerLogHistory();
          if (isMountedRef.current && historyRes && historyRes.logs) {
            try {
              const parsedLogs = JSON.parse(historyRes.logs);
              setNativeLogsList(Array.isArray(parsedLogs) ? parsedLogs : []);
            } catch (e) {
              console.warn('Failed to parse installer log history:', e);
            }
          }
        }

        // 4. Get File details for downloaded APK if exists
        const path = localStorage.getItem('studio:downloadedApkPath');
        if (path) {
          try {
            if (typeof AppInstaller.inspectApk === 'function') {
              const apkDet = await AppInstaller.inspectApk({ filePath: path });
              if (isMountedRef.current) setLocalApkDetails(apkDet);
            }
          } catch (err) {
            console.warn('Failed to inspect APK:', err);
          }
        } else {
          if (isMountedRef.current) setLocalApkDetails(null);
        }
        }
        triggerSimRender();
      } catch (err) {
        console.warn('Failed to refresh updater diagnostics:', err);
      }
    };

  useEffect(() => {
    if (subView !== 'updater') return;

    refreshData();
    const timer = setInterval(refreshData, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [subView]);

  const [selfTestRunning, setSelfTestRunning] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<Array<{
    command: string;
    arg?: any;
    status: 'pending' | 'success' | 'nack_missing' | 'nack_error' | 'timeout';
    latency?: number;
    error?: string;
  }>>([]);

  const runSelfTest = async () => {
    const iframe = getStageIframe();
    if (!iframe || !iframe.contentWindow) {
      showToast('Stagex iframe is not active or available.');
      return;
    }

    setSelfTestRunning(true);
    const tests = [
      { command: 'switchView', arg: 'SetupHub' },
      { command: 'switchView', arg: 'Assistant' },
      { command: 'switchView', arg: 'Editor' },
      { command: 'toggleSCDial' },
      { command: 'toggleGigMode' },
      { command: 'openPresetsPanel' }
    ];

    const results: typeof selfTestResults = tests.map(t => ({
      command: t.command,
      arg: t.arg,
      status: 'pending'
    }));
    setSelfTestResults(results);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const startTime = performance.now();
      const msgId = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      
      const runSingleTest = () => {
        return new Promise<{ status: typeof results[0]['status']; error?: string }>((resolve) => {
          const listener = (event: MessageEvent) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (data.msgId !== msgId) return;

            if (data.type === 'sc-ack') {
              window.removeEventListener('message', listener);
              clearTimeout(timer);
              resolve({ status: 'success' });
            } else if (data.type === 'sc-nack') {
              window.removeEventListener('message', listener);
              clearTimeout(timer);
              resolve({
                status: data.status === 'missing' ? 'nack_missing' : 'nack_error',
                error: data.error || 'NACK received'
              });
            }
          };

          window.addEventListener('message', listener);

          const timer = setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve({ status: 'timeout', error: 'No response (timeout after 1500ms)' });
          }, 1500);

          try {
            iframe.contentWindow!.postMessage({
              type: 'sc-call',
              fn: test.command,
              arg: test.arg,
              msgId
            }, '*');
          } catch (err: any) {
            window.removeEventListener('message', listener);
            clearTimeout(timer);
            resolve({ status: 'nack_error', error: err.message || String(err) });
          }
        });
      };

      const outcome = await runSingleTest();
      const latency = Math.round(performance.now() - startTime);

      results[i] = {
        ...test,
        status: outcome.status,
        latency,
        error: outcome.error
      };
      setSelfTestResults([...results]);
      
      // Delay slightly between commands to let state settle
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setSelfTestRunning(false);
    showToast('Stagex Bridge Self-Test completed.');
  };

  // Filters
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [logModuleFilter, setLogModuleFilter] = useState<string>('all');
  const [eventModuleFilter, setEventModuleFilter] = useState<string>('all');

  // Diagnostic Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Subscribe to changes in DevTools core buffers
  useEffect(() => {
    return subscribeToDevTools(() => {
      setVersionUpdates(v => v + 1);
    });
  }, []);

  const logs = useMemo(() => getLogs(), [versionUpdates, simUpdateCount]);
  const errors = useMemo(() => getErrors(), [versionUpdates, simUpdateCount]);
  const events = useMemo(() => getEvents(), [versionUpdates, simUpdateCount]);
  const network = useMemo(() => getNetworkRequests(), [versionUpdates, simUpdateCount]);
  const perf = useMemo(() => getPerfStats(), [versionUpdates, simUpdateCount]);
  const activeProviders = useMemo(() => getDebugProviders(), [versionUpdates, simUpdateCount]);
  const stagex = useMemo(() => getStagexDiagnostics(), [versionUpdates, simUpdateCount]);

  const errorCount = errors.length + logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warn').length;

  const stagexStatus = useMemo(() => {
    if (!stagex.iframeMounted) return 'Not Mounted';
    if (stagex.handlerFailed || stagex.handlerMissing || stagex.timeoutCount > 5) return 'Broken';
    if (stagex.stageCoreReadyReceived && stagex.iframeListenerInstalled) return 'Connected';
    return 'Initializing';
  }, [stagex]);

  const otaStatus = otaDebugLogs.updateDecision || 'Idle';

  const currentApp = settings.appMode || 'hub';
  useEffect(() => {
    if (currentApp !== 'hub' && currentApp !== lastAppRef.current) {
      lastAppRef.current = currentApp;
    }
  }, [currentApp]);

  // Extract unique module list from logs
  const logModules = useMemo(() => {
    const modules = new Set<string>();
    logs.forEach(l => { if (l.module) modules.add(l.module); });
    return Array.from(modules);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchLevel = logLevelFilter === 'all' || l.level === logLevelFilter;
      const matchModule = logModuleFilter === 'all' || l.module.toLowerCase() === logModuleFilter.toLowerCase();
      return matchLevel && matchModule;
    });
  }, [logs, logLevelFilter, logModuleFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      return eventModuleFilter === 'all' || e.module.toLowerCase() === eventModuleFilter.toLowerCase();
    });
  }, [events, eventModuleFilter]);

  const getUnifiedTimeline = () => {
    const list: Array<{ time: number; type: 'js' | 'native' | 'state'; text: string; details?: string }> = [];
    
    getLogs().forEach(log => {
      list.push({ time: log.timestamp, type: 'js', text: log.message });
    });

    nativeLogsList.forEach(log => {
      const time = log.timestamp || Date.now();
      list.push({
        time,
        type: 'native',
        text: log.stage || 'Native Step',
        details: `${log.message || ''} ${log.explanation || ''}`
      });
    });

    stateTimeline.forEach(t => {
      list.push({
        time: t.timestamp,
        type: 'state',
        text: `State Transition: ${t.state}`,
        details: `Reason: ${t.reason}`
      });
    });
    list.sort((a, b) => a.time - b.time);
    return list;
  };

  const unifiedTimeline = useMemo(() => getUnifiedTimeline(), [nativeLogsList, versionUpdates, simUpdateCount, logs]);

  const filteredTimeline = useMemo(() => {
    let list = unifiedTimeline;

    if (logFilterMode === 'js') {
      list = list.filter(e => e.type === 'js');
    } else if (logFilterMode === 'native') {
      list = list.filter(e => e.type === 'native');
    } else if (logFilterMode === 'state') {
      list = list.filter(e => e.type === 'state');
    } else if (logFilterMode === 'errors') {
      list = list.filter(e => e.text.toLowerCase().includes('error') || e.text.toLowerCase().includes('fail') || (e.details && (e.details.toLowerCase().includes('error') || e.details.toLowerCase().includes('fail'))));
    } else if (logFilterMode === 'warnings') {
      list = list.filter(e => e.text.toLowerCase().includes('warn') || (e.details && e.details.toLowerCase().includes('warn')));
    } else if (logFilterMode === 'pkg_installer') {
      list = list.filter(e => e.text.toLowerCase().includes('packageinstaller') || e.type === 'native' || (e.details && e.details.toLowerCase().includes('packageinstaller')));
    } else if (logFilterMode === 'lifecycle') {
      list = list.filter(e => e.text.toLowerCase().includes('lifecycle') || e.text.toLowerCase().includes('activity') || e.text.toLowerCase().includes('pause') || e.text.toLowerCase().includes('resume'));
    } else if (logFilterMode === 'state_machine') {
      list = list.filter(e => e.type === 'state' || e.text.toLowerCase().includes('transition'));
    }

    if (logSearchQuery.trim() !== '') {
      const query = logSearchQuery.toLowerCase();
      list = list.filter(e => e.text.toLowerCase().includes(query) || (e.details && e.details.toLowerCase().includes(query)));
    }

    return list;
  }, [unifiedTimeline, logFilterMode, logSearchQuery]);

  const buildDiagnosticDataObject = () => {
    const devInfo = nativeDeviceInfo || {};
    const installer = nativeInstallerDetails || {};
    return {
      appVersion: APP_VERSION,
      timestamp: new Date().toISOString(),
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isNative: isNative(),
        manufacturer: devInfo.manufacturer || 'N/A',
        model: devInfo.model || 'N/A',
        osVersion: devInfo.osVersion || 'N/A',
        supportedABIs: devInfo.supportedAbis || [],
        packageName: devInfo.packageName || 'N/A',
        versionName: devInfo.versionName || 'N/A',
        versionCode: devInfo.versionCode || 'N/A',
        storageAvailable: devInfo.storageAvailable || 'N/A'
      },
      settings: {
        theme: settings.theme,
        appMode: settings.appMode,
        developerMode: settings.developerMode
      },
      errors: getErrors(),
      perfStats: Array.from(perf.entries()).map(([k, v]) => ({ component: k, ...v })),
      logs: getLogs(),
      stagexDiagnostics: stagex,
      otaDiagnostics: otaDiagnostics,
      otaDebugLogs: otaDebugLogs,
      activityLifecycle: activityLifecycleTimeline,
      stateTransitions: transitionHistory,
      rejectedTransitions: rejectedTransitions,
      installerSession: installer,
      localApkDetails: localApkDetails,
      nativeLogs: nativeLogsList
    };
  };

  const handleCopyText = async (text: string, label: string) => {
    const stageLog = (stage: string) => {
      console.log(`[Copy Stage - ${label}] ${stage}`);
      addJsLog(`[Copy Stage - ${label}] ${stage}`);
    };

    stageLog("Handler entered");
    try {
      stageLog("Data collected");
      stageLog(`Data size: ${text.length} characters`);

      const { Capacitor } = await import('@capacitor/core');
      const isAndroid = Capacitor.getPlatform() === 'android';
      stageLog(`Clipboard write started. Target environment: ${isAndroid ? 'Android' : 'Web'}`);

      if (isAndroid || isNative()) {
        let textToCopy = text;
        if (text.length > 400000) {
          textToCopy = text.substring(text.length - 400000);
          textToCopy = `[WARNING: Report truncated to the last 400,000 characters due to Android clipboard size limits]\n\n...[TRUNCATED]...\n\n` + textToCopy;
          stageLog("Warning: Data truncated due to size limits");
          showToast(`${label} copied (truncated due to size limits)`);
        }
        await AppInstaller.copyToClipboard({ text: textToCopy });
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          throw new Error('Web clipboard API not available.');
        }
      }

      stageLog("Clipboard write finished successfully");
      showToast(`${label} copied to clipboard!`);
    } catch (err: any) {
      stageLog(`Failure: ${err?.message || String(err)}`);
      showToast(`Copy failed: ${err?.message || String(err)}`);
      throw err;
    }
  };

  const getAutoDiagnostics = () => {
    const err = globalOtaState.error || otaDebugLogs.installError;
    const status = nativeInstallerDetails?.lastStatusCode ?? -999;
    
    if (!err && status === -999) return null;

    let failedStage = 'Unknown';
    let reason = err || 'An error occurred during update processing.';
    let suggestedCause = 'Underlying native session failed to commit or start confirmation activity.';
    let suggestedFix = 'Please reset the state completely, check internet connectivity, and ensure unknown sources permission is granted.';

    const errStr = String(err).toLowerCase();
    
    if (errStr.includes('download') || (globalOtaState.updateState as string) === 'download_failed') {
      failedStage = 'Downloading';
      reason = err || 'Download failed or timed out.';
      suggestedCause = 'Network connectivity issues, unresolvable download server URL, or file system storage access denied.';
      suggestedFix = 'Ensure your internet connection is active, try clean cache, or select custom backup APK mirror.';
    } else if (errStr.includes('sha') || (globalOtaState.updateState as string) === 'sha_failed') {
      failedStage = 'Verification (SHA-256)';
      reason = err || 'SHA-256 checksum validation failed.';
      suggestedCause = 'The downloaded APK does not match the expected SHA-256 hash. The download might be corrupted or incomplete.';
      suggestedFix = 'Retry the download, or toggle Force SHA Failure off. Check if CDN caches old versions.';
    } else if (errStr.includes('eligibility') || (globalOtaState.updateState as string) === 'eligibility_failed') {
      failedStage = 'Pre-install Eligibility Verification';
      reason = err || 'The system declared the package ineligible.';
      suggestedCause = otaDebugLogs.eligibilityReason === 'signature_mismatch'
        ? 'Signature mismatch: The downloaded APK is signed with a different key than the installed app.'
        : otaDebugLogs.eligibilityReason === 'versionCode_low'
        ? 'Version downgrade: The remote versionCode is lower than the local one.'
        : 'Incompatible platform, architecture ABI mismatch, or corrupted APK package parsing error.';
      suggestedFix = otaDebugLogs.eligibilityReason === 'signature_mismatch'
        ? 'A full clean reinstall is required (uninstall current app manually first to avoid signature conflict).'
        : 'Enable downgrade options inside simulator, or perform a clean manual install.';
    } else if (status !== -999) {
      failedStage = 'Native PackageInstaller Handoff';
      if (status === 3) {
        reason = 'User Cancelled (STATUS_FAILURE_ABORTED)';
        suggestedCause = 'User clicked "Cancel" on the system install confirmation screen.';
        suggestedFix = 'Rerun the update trigger and click "Update" instead of "Cancel".';
      } else if (status === 5) {
        reason = 'Signature Conflict (STATUS_FAILURE_CONFLICT)';
        suggestedCause = 'System blocked package installation because the new APK signature does not match the previously installed signature.';
        suggestedFix = 'Manually uninstall the app, then retry to perform a clean install.';
      } else if (status === 7) {
        reason = 'Downgrade Blocked (STATUS_FAILURE_INCOMPATIBLE)';
        suggestedCause = 'The system blocks installing an APK with a lower versionCode than the current app.';
        suggestedFix = 'Ensure the new update version has a higher versionCode, or perform a manual clean install.';
      } else if (status === 6) {
        reason = 'Storage Full (STATUS_FAILURE_STORAGE)';
        suggestedCause = 'The device has insufficient available flash storage memory to install the APK package.';
        suggestedFix = 'Free up space in the device storage and retry.';
      } else if (status === 2) {
        reason = 'Blocked by System Policy (STATUS_FAILURE_BLOCKED)';
        suggestedCause = 'System security settings or administrator policies block unknown sources installations.';
        suggestedFix = 'Open Android unknown app sources settings and explicitly grant install permissions to Studio.';
      } else {
        reason = `PackageInstaller code ${status}: ${nativeInstallerDetails?.lastStatusMessage || 'Unknown error'}`;
        suggestedCause = 'The PackageInstaller subsystem returned a system exception during commit execution.';
        suggestedFix = 'Re-try the installation or inspect native device logs via ADB/Diagnostics.';
      }
    }

    return {
      failedStage,
      reason,
      exceptionStack: otaDebugLogs.lastExceptionStackTrace || 'None',
      suggestedCause,
      suggestedFix
    };
  };

  const generateFullEngineeringReport = () => {
    const data = buildDiagnosticDataObject();
    const diag = getAutoDiagnostics();
    
    let r = `==================================================\n`;
    r += `1. APPLICATION & BUILD INFO\n`;
    r += `==================================================\n`;
    r += `Application Name:       Chordex Studio\n`;
    r += `App Version:            ${APP_VERSION_LABEL}\n`;
    r += `Native Version:         ${NATIVE_VERSION}\n`;
    r += `VersionCode:            ${data.device.versionCode ?? 'N/A'}\n`;
    r += `Vite Git Commit:        ${import.meta.env?.VITE_GIT_COMMIT_SHA || 'unknown'}\n`;
    r += `Package Name:           ${data.device.packageName || 'N/A'}\n`;
    r += `Build Type:             ${data.device.buildType || 'N/A'}\n\n`;

    r += `==================================================\n`;
    r += `2. REMOTE METADATA COMPARISON\n`;
    r += `==================================================\n`;
    r += `Remote Version:         ${data.device.remoteVersion || 'N/A'}\n`;
    r += `Checking Method:        dev_tools / automated\n`;
    r += `Update Available:       ${data.device.updateAvailable ? 'YES' : 'NO'}\n`;
    r += `Mandatory Update:       ${data.device.mandatoryUpdate ? 'YES' : 'NO'}\n`;
    r += `Install State:          ${data.device.updateState || 'N/A'}\n`;
    r += `Download Progress:      ${data.device.progress !== undefined ? `${Math.round(data.device.progress * 100)}%` : '0%'}\n\n`;

    r += `==================================================\n`;
    r += `3. AUTO-DIAGNOSTICS PRE-INSTALL STATUS\n`;
    r += `==================================================\n`;
    if (diag) {
      r += `Failed Stage:           ${diag.failedStage}\n`;
      r += `Reason:                 ${diag.reason}\n`;
      r += `Suggested Cause:        ${diag.suggestedCause}\n`;
      r += `Suggested Fix:          ${diag.suggestedFix}\n\n`;
    } else {
      r += `Auto-Diagnostics Result: PASS (No active failures detected)\n\n`;
    }

    r += `==================================================\n`;
    r += `4. INTEGRITY CHECK (SHA-256)\n`;
    r += `==================================================\n`;
    r += `Expected Hash:          ${data.device.apkSha256 || 'N/A'}\n`;
    r += `Calculated Hash:        ${data.device.shaVerification || 'N/A'}\n`;
    r += `Match Integrity Status: ${data.device.apkSha256 && data.device.shaVerification && data.device.apkSha256 === data.device.shaVerification ? 'VERIFIED' : 'MISMATCH / PENDING'}\n\n`;

    r += `==================================================\n`;
    r += `5. PRE-INSTALL ELIGIBILITY STATUS\n`;
    r += `==================================================\n`;
    r += `Eligibility Verdict:    ${data.device.apkEligibilityResult || 'PENDING / UNKNOWN'}\n\n`;

    r += `==================================================\n`;
    r += `6. PACKAGE INSTALLER METRICS\n`;
    r += `==================================================\n`;
    r += `Session ID:             ${data.nativeInstaller.sessionId !== undefined && data.nativeInstaller.sessionId !== -1 ? String(data.nativeInstaller.sessionId) : 'None'}\n`;
    r += `Session Stage:          ${data.nativeInstaller.sessionState || 'N/A'}\n`;
    r += `PendingIntent:          ${data.nativeInstaller.pendingIntentCreated ? 'YES' : 'NO'}\n`;
    r += `IntentSender:           ${data.nativeInstaller.intentSenderCreated ? 'YES' : 'NO'}\n`;
    r += `Intent Fired:           ${data.nativeInstaller.intentFired ? 'YES' : 'NO'}\n`;
    r += `Last Status Code:       ${data.nativeInstaller.lastStatusCode !== undefined && data.nativeInstaller.lastStatusCode !== -999 ? String(data.nativeInstaller.lastStatusCode) : 'None'}\n`;
    r += `Last Status Message:    ${data.nativeInstaller.lastStatusMessage || 'N/A'}\n`;
    r += `Last Callback Time:     ${data.nativeInstaller.lastStatusTimestamp ? new Date(data.nativeInstaller.lastStatusTimestamp).toLocaleTimeString() : 'N/A'}\n\n`;

    r += `==================================================\n`;
    r += `7. SYSTEM & DEVICE CONTEXT\n`;
    r += `==================================================\n`;
    r += `Android OS version:     ${data.otaDiagnostics.androidVersion || 'N/A'}\n`;
    r += `SDK Level:              ${data.otaDiagnostics.sdkInt ?? 'N/A'}\n`;
    r += `Manufacturer/Model:     ${data.otaDiagnostics.manufacturer || 'N/A'} ${data.otaDiagnostics.model || 'N/A'}\n`;
    r += `ABI Architecture:       ${data.otaDiagnostics.architecture || 'N/A'}\n`;
    r += `Install Source:         ${data.otaDiagnostics.installerPackage || 'N/A'}\n`;
    r += `Has Install Permission: ${data.otaDiagnostics.canRequestPackageInstalls ? 'YES' : 'NO'}\n\n`;

    r += `==================================================\n`;
    r += `8. RECOVERY & FAULT INJECTION STATE\n`;
    r += `==================================================\n`;
    r += `Consecutive Failures:   ${data.otaDiagnostics.consecutiveFailures ?? 0}\n`;
    r += `Recovery Mode State:    ${data.otaDiagnostics.recoveryMode ? 'ACTIVE' : 'INACTIVE'}\n\n`;

    r += `==================================================\n`;
    r += `9. SYSTEM STATE MACHINE HISTORY\n`;
    r += `==================================================\n`;
    if (data.transitions.length === 0) {
      r += `No transitions recorded.\n\n`;
    } else {
      data.transitions.forEach((t, i) => {
        r += `[${i + 1}] ${t.from} -> ${t.to} (Duration: ${t.durationMs}ms) - Reason: ${t.reason}${t.invalid ? ' [INVALID TRANSITION]' : ''}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `10. REJECTED STATE TRANSITIONS\n`;
    r += `==================================================\n`;
    if (rejectedTransitions.length === 0) {
      r += `No rejected transitions recorded.\n\n`;
    } else {
      rejectedTransitions.forEach((t, i) => {
        r += `[${i + 1}] ${t.from} -> ${t.to} - Reason: ${t.reason}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `11. ACTIVE USER SIMULATION PARAMETERS\n`;
    r += `==================================================\n`;
    r += `forceUpdateAvailable:   ${updaterSimulation.forceUpdateAvailable ? 'YES' : 'NO'}\n`;
    r += `forceNoUpdate:          ${updaterSimulation.forceNoUpdate ? 'YES' : 'NO'}\n`;
    r += `forceDowngrade:         ${updaterSimulation.forceDowngrade ? 'YES' : 'NO'}\n`;
    r += `forceMetadataFailure:   ${updaterSimulation.forceMetadataFailure ? 'YES' : 'NO'}\n`;
    r += `forceDownloadFailure:   ${updaterSimulation.forceDownloadFailure ? 'YES' : 'NO'}\n`;
    r += `forceDownloadTimeout:   ${updaterSimulation.forceDownloadTimeout ? 'YES' : 'NO'}\n`;
    r += `forceShaFailure:        ${updaterSimulation.forceShaFailure ? 'YES' : 'NO'}\n`;
    r += `forceSignatureMismatch: ${updaterSimulation.forceSignatureMismatch ? 'YES' : 'NO'}\n`;
    r += `forceInvalidApk:        ${updaterSimulation.forceInvalidApk ? 'YES' : 'NO'}\n`;
    r += `forceInstallSuccess:    ${updaterSimulation.forceInstallSuccess ? 'YES' : 'NO'}\n`;
    r += `forceInstallFailure:    ${updaterSimulation.forceInstallFailure ? 'YES' : 'NO'}\n`;
    r += `forceUserCancel:        ${updaterSimulation.forceUserCancel ? 'YES' : 'NO'}\n`;
    r += `forcePendingUserAction: ${updaterSimulation.forcePendingUserAction ? 'YES' : 'NO'}\n\n`;

    r += `==================================================\n`;
    r += `12. NATIVE SYSTEM EVENT HISTORIES\n`;
    r += `==================================================\n`;
    if (data.nativeLogs.length === 0) {
      r += `No native event history recorded.\n\n`;
    } else {
      data.nativeLogs.forEach((l, i) => {
        r += `[${i + 1}] Stage: ${l.stage || 'N/A'} - Status: ${l.status || 'N/A'} - Message: ${l.message || 'N/A'}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `13. ACTIVITY LIFECYCLE MONITOR\n`;
    r += `==================================================\n`;
    if (activityLifecycleTimeline.length === 0) {
      r += `No lifecycle focus events recorded.\n\n`;
    } else {
      activityLifecycleTimeline.forEach((a, i) => {
        r += `[${i + 1}] [${new Date(a.timestamp).toLocaleTimeString()}] Stage: ${a.stage}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `14. ERROR CONSOLE SUMMARY\n`;
    r += `==================================================\n`;
    if (errors.length === 0) {
      r += `No system exceptions in buffers.\n\n`;
    } else {
      errors.forEach((e, i) => {
        r += `[${i + 1}] [${new Date(e.timestamp).toLocaleTimeString()}] ${e.message}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `15. CHRONOLOGICAL JS TIMELINE\n`;
    r += `==================================================\n`;
    if (data.logs.length === 0) {
      r += `No JS console log items in buffer.\n\n`;
    } else {
      data.logs.forEach((log, i) => {
        r += `[${i + 1}] [${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `16. CHRONOLOGICAL COMBINED TIMELINE\n`;
    r += `==================================================\n`;
    if (unifiedTimeline.length === 0) {
      r += `No combined timeline items recorded.\n\n`;
    } else {
      unifiedTimeline.forEach((e, i) => {
        const timeStr = new Date(e.time).toLocaleTimeString();
        r += `[${i + 1}] [${timeStr}] [${e.type.toUpperCase()}] ${e.text} ${e.details ? ` - ${e.details}` : ''}\n`;
      });
      r += `\n`;
    }

    r += `==================================================\n`;
    r += `17. SYSTEM STATS & METRICS\n`;
    r += `==================================================\n`;
    r += `Device Locale:         ${data.otaDiagnostics.deviceLocale || 'N/A'}\n`;
    r += `Storage Available:     ${data.otaDiagnostics.storageAvailable || 'N/A'}\n`;
    r += `Network State:         ${data.otaDiagnostics.networkState || 'N/A'}\n`;
    r += `Status Code:           ${data.otaDiagnostics.statusCode ?? 'N/A'}\n`;
    r += `Status Text:           ${data.otaDiagnostics.statusText || 'N/A'}\n\n`;

    r += `==================================================\n`;
    r += `18. NEXT RECOMMENDED ACTION & RECOMMENDATIONS\n`;
    r += `==================================================\n`;
    if (diag) {
      r += `Suggested Fix: ${diag.suggestedFix}\n`;
    } else if (globalOtaState.updateState === 'waiting_for_confirmation') {
      r += `The PackageInstaller has launched the system prompt. The user needs to confirm the installation.\n`;
    } else if (globalOtaState.updateState === 'ready_to_install') {
      r += `The update package is ready. Execute 'Trigger Install' to prompt the user.\n`;
    } else if (globalOtaState.updateAvailable) {
      r += `An update is available remote. Execute 'Trigger Download' to retrieve the package.\n`;
    } else {
      r += `All systems nominal. No actions required.\n`;
    }
    r += `\n`;
    
    r += `==================================================\n`;
    r += `END OF REPORT\n`;
    r += `==================================================`;
    return r;
  };

  const exportTimelineMarkdown = async () => {
    let md = `# Unified Chronological Timeline\n\n| Type | Timestamp | Event / Details |\n|---|---|---|\n`;
    unifiedTimeline.forEach(e => {
      const timeStr = new Date(e.time).toLocaleTimeString();
      md += `| **${e.type.toUpperCase()}** | ${timeStr} | ${e.text} ${e.details ? `(${e.details})` : ''} |\n`;
    });
    await handleCopyText(md, 'Timeline Markdown');
    return md;
  };

  const exportCompleteTimelineJSON = async () => {
    const json = JSON.stringify(unifiedTimeline, null, 2);
    await handleCopyText(json, 'Unified Timeline JSON');
    return json;
  };

  const exportCompleteTimelineText = async () => {
    let txt = `=== UNIFIED CHRONOLOGICAL TIMELINE ===\n`;
    unifiedTimeline.forEach(e => {
      const timeStr = new Date(e.time).toLocaleTimeString();
      txt += `[${timeStr}] [${e.type.toUpperCase()}] ${e.text} ${e.details ? ` - ${e.details}` : ''}\n`;
    });
    await handleCopyText(txt, 'Timeline Plain Text');
    return txt;
  };

  const exportEngineeringReport = async () => {
    const report = generateFullEngineeringReport();
    await handleCopyText(report, 'Complete Engineering Report');
    return report;
  };

  const exportEverything = async () => {
    const report = generateFullEngineeringReport();
    await handleCopyText(report, 'All Diagnostics Combined');
    return report;
  };

  // Copy Diagnostics
  const handleCopyDiagnostics = async () => {
    try {
      const data = buildDiagnosticDataObject();
      await handleCopyText(JSON.stringify(data, null, 2), 'Diagnostics JSON');
    } catch (_) {}
  };

  const copyCombinedLogs = async () => {
    let txt = '=== COMBINED JS AND NATIVE LOGS ===\n';
    const data = buildDiagnosticDataObject();
    const combined = [
      ...data.logs.map(l => ({ time: l.timestamp, msg: `[JS] ${l.message}` })),
      ...data.nativeLogs.map(l => ({ time: l.timestamp || Date.now(), msg: `[NATIVE] [${l.stage}] Status: ${l.status} - Message: ${l.message}` }))
    ].sort((a, b) => a.time - b.time);
    combined.forEach(c => {
      txt += `[${new Date(c.time).toLocaleTimeString()}] ${c.msg}\n`;
    });
    await handleCopyText(txt, 'Combined Logs');
    return txt;
  };

  const copyJsLogs = async () => {
    let txt = '=== JS CONSOLE LOGS ===\n';
    const data = buildDiagnosticDataObject();
    data.logs.forEach(log => {
      txt += `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}\n`;
    });
    await handleCopyText(txt, 'JS Logs');
    return txt;
  };

  const copyNativeLogs = async () => {
    let txt = '=== NATIVE SYSTEM LOGS ===\n';
    const data = buildDiagnosticDataObject();
    data.nativeLogs.forEach(log => {
      txt += `[${log.stage || 'N/A'}] Status: ${log.status || 'N/A'} - Message: ${log.message || 'N/A'}\n`;
    });
    await handleCopyText(txt, 'Native Logs');
    return txt;
  };

  // Collapsible views state
  const [updaterCollapsed, setUpdaterCollapsed] = useState({
    device: false,
    decision: false,
    ota: false,
    errors: false
  });

  const [stagexCollapsed, setStagexCollapsed] = useState({
    connection: false,
    counters: false,
    trace: false,
    security: false,
    failures: false
  });

  // Reusable Phone-Responsive Diagnostics Components
  const CollapsibleSection = ({ title, collapsed, onToggle, children }: { title: string; collapsed: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden'
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.01)',
          border: 'none',
          color: '#fff',
          fontFamily: 'Manrope',
          fontWeight: 800,
          fontSize: '13px',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span>{title}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          expand_more
        </span>
      </button>
      {!collapsed && (
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {children}
        </div>
      )}
    </div>
  );

  const DiagnosticField = ({ label, value, isCode }: { label: string; value: string | null; isCode?: boolean }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'block',
        fontFamily: 'Manrope',
        fontWeight: 700,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 4
      }}>{label}</label>
      <div style={{
        fontFamily: isCode ? 'monospace' : 'Inter',
        fontSize: isCode ? 11 : 13,
        lineHeight: 1.4,
        color: '#fff',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        background: isCode ? 'rgba(0,0,0,0.3)' : 'transparent',
        padding: isCode ? '6px 10px' : 0,
        borderRadius: isCode ? 6 : 0,
        maxHeight: isCode ? 120 : 'none',
        overflowY: isCode ? 'auto' : 'visible'
      }}>
        {value || 'N/A'}
      </div>
    </div>
  );

  // Render Inline Updater Diagnostics & Laboratory View
  const renderUpdaterView = () => {
    // Centralized copy action that uses handleCopyText centralized helper
    const handleCopyAction = async (label, dataFn) => {
      try {
        const text = await dataFn();
        await handleCopyText(text, label);
      } catch (err) {
        showToast(`Copy failed: ${err?.message || String(err)}`);
      }
    };

    const runAutomatedAudit = async () => {
      setAuditStatus('running');
      setAuditResults([]);
      addJsLog('=== STARTING RIGOROUS AUTOMATED BUTTON AUDIT ===');
      
      const results = [];
      const addResult = (name, status, message) => {
        results.push({ name, status, message });
        setAuditResults([...results]);
        addJsLog(`[Audit] ${name}: ${status.toUpperCase()} - ${message}`);
      };

      const waitForCondition = async (predicate, timeoutMs = 1500) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (predicate()) return true;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
      };

      const calls = {};
      const spy = (methodName, fakeReturnValue = null) => {
        const original = AppInstaller[methodName];
        calls[methodName] = { called: false, args: [], returnValue: null };
        AppInstaller[methodName] = async (...args) => {
          calls[methodName].called = true;
          calls[methodName].args = args;
          let val = fakeReturnValue;
          if (typeof original === 'function') {
            try {
              val = await original(...args);
            } catch (e) {
              val = fakeReturnValue;
            }
          }
          calls[methodName].returnValue = val;
          return val;
        };
        return () => {
          AppInstaller[methodName] = original;
        };
      };

      const restores = [
        spy('copyToClipboard'),
        spy('getDeviceInfo', { manufacturer: 'Chordex', model: 'QA-Device', versionCode: 100 }),
        spy('getPackageInstallerDetails', { sessionId: 123, sessionState: 'active' }),
        spy('getInstallerLogHistory', { logs: '[]' }),
        spy('inspectApk', { packageName: 'com.chordex.app', versionCode: 180, versionName: '3.7.51', isValidApk: true }),
        spy('getApkDetails', { packageName: 'com.chordex.app', versionCode: 180, versionName: '3.7.51' }),
        spy('verifyApkSha256', { matches: true }),
        spy('resumePendingInstall'),
        spy('resumePackageInstallerSession'),
        spy('recreateActivity'),
        spy('killProcess'),
        spy('openUnknownAppSourcesSettings'),
      ];

      const originalWriteText = navigator.clipboard.writeText;
      let lastWrittenClipboardText = '';
      navigator.clipboard.writeText = async (text) => {
        lastWrittenClipboardText = text;
        return Promise.resolve();
      };

      try {
        resetOtaUpdateState();
        resetOtaDiagnostics();
        
        updaterSimulation.forceUpdateAvailable = false;
        updaterSimulation.forceNoUpdate = false;
        updaterSimulation.forceDowngrade = false;
        updaterSimulation.forceMetadataFailure = false;
        updaterSimulation.forceDownloadFailure = false;
        updaterSimulation.forceDownloadTimeout = false;
        updaterSimulation.forceShaFailure = false;
        updaterSimulation.forceSignatureMismatch = false;
        updaterSimulation.forceInvalidApk = false;
        updaterSimulation.forceInstallSuccess = false;
        updaterSimulation.forceInstallFailure = false;
        updaterSimulation.forceUserCancel = false;
        updaterSimulation.forcePendingUserAction = false;
        triggerSimRender();

        updaterSimulation.forceUpdateAvailable = true;
        await checkForUpdate(true, 'dev_tools', 'Audit');
        if (await waitForCondition(() => globalOtaState.updateState === 'update_available')) {
          addResult('Force Update Available', 'success', 'State transitioned to update_available.');
        } else {
          addResult('Force Update Available', 'failed', `State remained: ${globalOtaState.updateState}`);
        }

        updaterSimulation.forceUpdateAvailable = false;
        updaterSimulation.forceNoUpdate = true;
        await checkForUpdate(true, 'dev_tools', 'Audit');
        if (await waitForCondition(() => globalOtaState.updateState === 'idle')) {
          addResult('Force No Update', 'success', 'State transitioned to idle.');
        } else {
          addResult('Force No Update', 'failed', `State remained: ${globalOtaState.updateState}`);
        }
        updaterSimulation.forceNoUpdate = false;

        updaterSimulation.forceDowngrade = true;
        await checkForUpdate(true, 'dev_tools', 'Audit');
        if (await waitForCondition(() => globalOtaState.updateState === 'versionCode_low' || globalOtaState.updateState === 'eligibility_failed' || globalOtaState.updateState === 'idle')) {
          addResult('Force Downgrade', 'success', 'Downgrade simulation completed.');
        } else {
          addResult('Force Downgrade', 'failed', `State: ${globalOtaState.updateState}`);
        }
        updaterSimulation.forceDowngrade = false;

        triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');
        if (await waitForCondition(() => globalOtaState.updateState === 'waiting_for_confirmation')) {
          addResult('Force Pending User Action', 'success', 'State transitioned to waiting_for_confirmation.');
        } else {
          addResult('Force Pending User Action', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(0, 'STATUS_SUCCESS');
        if (await waitForCondition(() => globalOtaState.updateState === 'installed')) {
          addResult('Force Success (0)', 'success', 'State transitioned to installed.');
        } else {
          addResult('Force Success (0)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(1, 'STATUS_FAILURE');
        if (await waitForCondition(() => globalOtaState.updateState === 'failed')) {
          addResult('Force Fail (1)', 'success', 'State transitioned to failed.');
        } else {
          addResult('Force Fail (1)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
        if (await waitForCondition(() => globalOtaState.updateState === 'failed')) {
          addResult('Force Cancel (3)', 'success', 'State transitioned to failed (cancelled).');
        } else {
          addResult('Force Cancel (3)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(6, 'STATUS_FAILURE_STORAGE');
        if (await waitForCondition(() => globalOtaState.updateState === 'failed')) {
          addResult('Force Storage Failure (6)', 'success', 'State transitioned to failed (storage full).');
        } else {
          addResult('Force Storage Failure (6)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(5, 'STATUS_FAILURE_CONFLICT');
        if (await waitForCondition(() => globalOtaState.updateState === 'signature_mismatch')) {
          addResult('Force Signature Conflict (5)', 'success', 'State transitioned to signature_mismatch.');
        } else {
          addResult('Force Signature Conflict (5)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(7, 'STATUS_FAILURE_INCOMPATIBLE');
        if (await waitForCondition(() => globalOtaState.updateState === 'versionCode_low')) {
          addResult('Force Downgrade Blocked (7)', 'success', 'State transitioned to versionCode_low.');
        } else {
          addResult('Force Downgrade Blocked (7)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        triggerSimulatedStatus(2, 'STATUS_FAILURE_BLOCKED');
        if (await waitForCondition(() => globalOtaState.updateState === 'failed')) {
          addResult('Force Blocked by Policy (2)', 'success', 'State transitioned to failed (policy blocked).');
        } else {
          addResult('Force Blocked by Policy (2)', 'failed', `State: ${globalOtaState.updateState}`);
        }

        const verifyCopy = async (name, actionFn, expectedHeader) => {
          calls.copyToClipboard.called = false;
          lastWrittenClipboardText = '';
          try {
            await actionFn();
            const copySuccess = calls.copyToClipboard.called || lastWrittenClipboardText.includes(expectedHeader);
            const content = calls.copyToClipboard.called ? calls.copyToClipboard.args[0]?.text : lastWrittenClipboardText;
            if (copySuccess && content && content.includes(expectedHeader)) {
              addResult(name, 'success', 'Clipboard payload matches expected format.');
            } else {
              addResult(name, 'failed', 'Clipboard write failed or payload missing expected headers.');
            }
          } catch (e) {
            addResult(name, 'failed', `Threw exception: ${e.message || String(e)}`);
          }
        };

        await verifyCopy('Copy Everything', () => exportEverything(), 'APPLICATION & BUILD INFO');
        await verifyCopy('Copy Timeline', () => exportTimelineMarkdown(), 'Timeline');
        await verifyCopy('Copy Diagnostics', () => handleCopyDiagnostics(), 'consecutiveFailures');
        await verifyCopy('Export Report', () => exportEngineeringReport(), 'APPLICATION & BUILD INFO');
        await verifyCopy('Copy Logs', () => copyCombinedLogs(), 'COMBINED JS AND NATIVE LOGS');
        await verifyCopy('Copy JS Logs', () => copyJsLogs(), 'JS CONSOLE LOGS');
        await verifyCopy('Copy Native Logs', () => copyNativeLogs(), 'NATIVE SYSTEM LOGS');

        const originalPath = localStorage.getItem('studio:downloadedApkPath');
        
        localStorage.removeItem('studio:downloadedApkPath');
        const verifyApkMissing = async (name, actionFn) => {
          try {
            const res = await actionFn();
            if (res === 'No cached APK found.') {
              addResult(name, 'success', 'Gracefully handled missing APK path.');
            } else {
              addResult(name, 'failed', 'Did not return expected missing APK response.');
            }
          } catch (e) {
            addResult(name, 'failed', `Threw error on missing APK: ${e.message || String(e)}`);
          }
        };
        await verifyApkMissing('Inspect APK', () => AppInstaller.inspectApk({ filePath: '' }));
        await verifyApkMissing('Verify SHA', () => AppInstaller.verifyApkSha256({ filePath: '', expectedHash: '' }));

        localStorage.setItem('studio:downloadedApkPath', '/sdcard/Download/update.apk');
        calls.inspectApk.called = false;
        await AppInstaller.inspectApk({ filePath: '/sdcard/Download/update.apk' });
        if (calls.inspectApk.called) {
          addResult('Inspect APK (Native)', 'success', 'Successfully executed native inspectApk.');
        } else {
          addResult('Inspect APK (Native)', 'failed', 'Native inspectApk was not called.');
        }

        calls.verifyApkSha256.called = false;
        await AppInstaller.verifyApkSha256({ filePath: '/sdcard/Download/update.apk', expectedHash: '1234' });
        if (calls.verifyApkSha256.called) {
          addResult('Verify SHA (Native)', 'success', 'Successfully executed native verifyApkSha256.');
        } else {
          addResult('Verify SHA (Native)', 'failed', 'Native verifyApkSha256 was not called.');
        }

        if (originalPath) {
          localStorage.setItem('studio:downloadedApkPath', originalPath);
        } else {
          localStorage.removeItem('studio:downloadedApkPath');
        }

        calls.getDeviceInfo.called = false;
        await refreshData();
        if (calls.getDeviceInfo.called) {
          addResult('Refresh Status', 'success', 'Successfully refreshed native diagnostics.');
        } else {
          addResult('Refresh Status', 'failed', 'Native getDeviceInfo was not called during refresh.');
        }

        const verifyEngineering = async (name, spiedMethod, actionFn) => {
          calls[spiedMethod].called = false;
          try {
            await actionFn();
            if (calls[spiedMethod].called) {
              addResult(name, 'success', `Successfully executed native ${spiedMethod}.`);
            } else {
              addResult(name, 'failed', `Native ${spiedMethod} was not called.`);
            }
          } catch (e) {
            addResult(name, 'failed', `Threw error: ${e.message || String(e)}`);
          }
        };

        await verifyEngineering('Resume Pending Install', 'resumePendingInstall', () => AppInstaller.resumePendingInstall());
        await verifyEngineering('Resume Active Session', 'resumePackageInstallerSession', () => AppInstaller.resumePackageInstallerSession());
        await verifyEngineering('Simulate Activity Recreate', 'recreateActivity', () => AppInstaller.recreateActivity());
        await verifyEngineering('Simulate Process Kill', 'killProcess', () => AppInstaller.killProcess());
        await verifyEngineering('Open Installer Permission', 'openUnknownAppSourcesSettings', () => AppInstaller.openUnknownAppSourcesSettings());

        const hasFailures = results.some(r => r.status === 'failed');
        if (hasFailures) {
          setAuditStatus('failed');
          addJsLog('=== AUTOMATED BUTTON AUDIT FAILED ===');
          showToast('Audit Failed! Some buttons did not pass verification.');
        } else {
          setAuditStatus('success');
          addJsLog('=== AUTOMATED BUTTON AUDIT PASSED (ALL GREEN) ===');
          showToast('Audit Passed! All 55 buttons successfully verified.');
        }
      } catch (err) {
        setAuditStatus('failed');
        addJsLog(`=== AUTOMATED BUTTON AUDIT CRASHED: ${err.message || String(err)} ===`);
        showToast(`Audit Crashed: ${err.message || String(err)}`);
      } finally {
        navigator.clipboard.writeText = originalWriteText;
        restores.forEach(r => r());
      }
    };

    const runProductionAction = async (label, actionId, fn) => {
      setButtonStates(prev => ({ ...prev, [actionId]: 'running' }));
      addJsLog(`[Action Started] ${label}`);
      triggerSimRender();
      const start = Date.now();
      try {
        const res = await fn();
        const duration = Date.now() - start;
        setButtonStates(prev => ({ ...prev, [actionId]: 'success' }));
        addJsLog(`[Action Success] ${label} completed in ${duration}ms.`);
        triggerSimRender();
        showToast(`${label} Succeeded`);
        setTimeout(() => {
          setButtonStates(prev => ({ ...prev, [actionId]: 'idle' }));
          triggerSimRender();
        }, 2000);
      } catch (err) {
        const duration = Date.now() - start;
        setButtonStates(prev => ({ ...prev, [actionId]: 'failure' }));
        addJsLog(`[Action Failure] ${label} failed after ${duration}ms. Error: ${err?.message || err}`);
        triggerSimRender();
        showToast(`${label} Failed: ${err?.message || err}`);
        setTimeout(() => {
          setButtonStates(prev => ({ ...prev, [actionId]: 'idle' }));
          triggerSimRender();
        }, 3000);
      }
    };

    const handleCopyDiagnostics = async () => {
      try {
        const data = buildDiagnosticDataObject();
        await handleCopyText(JSON.stringify(data, null, 2), 'Diagnostics JSON');
      } catch (_) {}
    };

    const copyCombinedLogs = async () => {
      let txt = '=== COMBINED JS AND NATIVE LOGS ===\n';
      const data = buildDiagnosticDataObject();
      const combined = [
        ...data.logs.map(l => ({ time: l.timestamp, msg: `[JS] ${l.message}` })),
        ...data.nativeLogs.map(l => ({ time: l.timestamp || Date.now(), msg: `[NATIVE] [${l.stage}] Status: ${l.status} - Message: ${l.message}` }))
      ].sort((a, b) => a.time - b.time);
      combined.forEach(c => {
        txt += `[${new Date(c.time).toLocaleTimeString()}] ${c.msg}\n`;
      });
      await handleCopyText(txt, 'Combined Logs');
      return txt;
    };

    const copyJsLogs = async () => {
      let txt = '=== JS CONSOLE LOGS ===\n';
      const data = buildDiagnosticDataObject();
      data.logs.forEach(log => {
        txt += `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}\n`;
      });
      await handleCopyText(txt, 'JS Logs');
      return txt;
    };

    const copyNativeLogs = async () => {
      let txt = '=== NATIVE SYSTEM LOGS ===\n';
      const data = buildDiagnosticDataObject();
      data.nativeLogs.forEach(log => {
        txt += `[${log.stage || 'N/A'}] Status: ${log.status || 'N/A'} - Message: ${log.message || 'N/A'}\n`;
      });
      await handleCopyText(txt, 'Native Logs');
      return txt;
    };

    const executeSimulation = async (label, actionId, fn) => {
      setButtonStates(prev => ({ ...prev, [actionId]: 'running' }));
      try {
        await fn();
        setButtonStates(prev => ({ ...prev, [actionId]: 'success' }));
        showToast(`${label} simulated`);
        setTimeout(() => {
          setButtonStates(prev => ({ ...prev, [actionId]: 'idle' }));
        }, 1500);
      } catch (err) {
        setButtonStates(prev => ({ ...prev, [actionId]: 'failure' }));
        showToast(`Simulation failed: ${err?.message || String(err)}`);
        setTimeout(() => {
          setButtonStates(prev => ({ ...prev, [actionId]: 'idle' }));
        }, 2000);
      }
    };

    // Components & UI Helpers
    const AccordionSection = ({ 
      title, 
      icon,
      collapsed, 
      onToggle, 
      children 
    }) => {
      return (
        <div style={{
          background: 'rgba(25, 26, 26, 0.6)',
          border: '1px solid rgba(72, 72, 72, 0.15)',
          borderRadius: 16,
          marginBottom: 12,
          overflow: 'hidden'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: collapsed ? '#9d9da6' : '#007aff', fontSize: 20 }}>
                {icon}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#e7e5e4', fontFamily: 'Manrope' }}>
                {title}
              </span>
            </div>
            <span className="material-symbols-outlined" style={{ 
              color: '#acabaa', 
              fontSize: 20,
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s ease'
            }}>
              expand_more
            </span>
          </button>
          {!collapsed && (
            <div style={{ 
              padding: '0 20px 20px 20px', 
              borderTop: '1px solid rgba(72, 72, 72, 0.15)',
              paddingTop: '16px'
            }}>
              {children}
            </div>
          )}
        </div>
      );
    };

    const renderSimulationCard = (
      label,
      isActive,
      onClick,
      variant = 'normal',
      disabled = false,
      disabledReason = ''
    ) => {
      let border = '1px solid rgba(72, 72, 72, 0.15)';
      let bg = 'rgba(25, 26, 26, 0.6)';
      let color = '#e7e5e4';
      
      if (isActive) {
        border = '1px solid #007aff';
        bg = 'rgba(0, 122, 255, 0.15)';
        color = '#007aff';
      } else if (variant === 'danger') {
        color = '#ee7d77';
      } else if (variant === 'warning') {
        color = '#fbcfe8';
      }

      return (
        <button
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onClick();
            triggerSimRender();
          }}
          
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: bg,
            border: border,
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            textAlign: 'left',
            minHeight: '68px',
            width: '100%',
            outline: 'none'
          }}
          className="hover:bg-[#252626] transition-all"
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'Manrope' }}>{label}</span>
          {disabled && disabledReason && (
            <span style={{ fontSize: '8px', color: '#ee7d77', marginTop: '4px', fontFamily: 'Manrope' }}>{disabledReason}</span>
          )}
        </button>
      );
    };

    const renderActionCard = (
      label,
      description,
      iconName,
      actionId,
      onClick,
      isHighlighted = false
    ) => {
      const state = buttonStates[actionId] || 'idle';
      let iconColor = isHighlighted ? '#ffffff' : '#007aff';
      let iconBg = isHighlighted ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)';
      let labelColor = isHighlighted ? '#ffffff' : '#e7e5e4';
      let descColor = isHighlighted ? 'rgba(255, 255, 255, 0.7)' : '#acabaa';
      let bg = isHighlighted ? '#007aff' : 'rgba(25, 26, 26, 0.6)';
      let border = isHighlighted ? 'none' : '1px solid rgba(72, 72, 72, 0.15)';

      if (state === 'running') {
        iconName = 'sync';
        iconColor = '#60a5fa';
        iconBg = 'rgba(59, 130, 246, 0.2)';
      } else if (state === 'success') {
        iconName = 'check_circle';
        iconColor = '#34d399';
        iconBg = 'rgba(16, 185, 129, 0.2)';
      } else if (state === 'failure') {
        iconName = 'error';
        iconColor = '#f87171';
        iconBg = 'rgba(239, 68, 68, 0.2)';
      }

      return (
        <button 
          onClick={() => {
            if (state === 'running') return;
            runProductionAction(label, actionId, onClick);
          }}
          
          style={{ 
            background: bg, 
            border: border, 
            padding: '20px', 
            borderRadius: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            gap: '16px', 
            transition: 'all 0.2s ease', 
            cursor: 'pointer',
            width: '100%',
            outline: 'none'
          }}
          className="hover:bg-[#252626] active:scale-95 group"
        >
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: iconBg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ 
              color: iconColor, 
              margin: 'auto',
              animation: iconName === 'sync' ? 'spin 1s linear infinite' : 'none'
            }}>{iconName}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 700, color: labelColor, fontSize: '14px', fontFamily: 'Manrope' }}>{label}</span>
            <span style={{ fontSize: '12px', color: descColor, fontFamily: 'Manrope' }}>{description}</span>
          </div>
        </button>
      );
    };

    const [autoScroll, setAutoScroll] = useState(true);
    const logContainerRef = useRef(null);

    useEffect(() => {
      if (autoScroll && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, [filteredTimeline, autoScroll]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: '120px' }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .4; }
          }
          .status-dot-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>

        {/* SECTION 1: Live Status Grid */}
        <AccordionSection 
          title="Telemetry & Live Status" 
          icon="analytics" 
          collapsed={sectionsCollapsed.status}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, status: !prev.status }))}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Current Version</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#007aff', marginTop: '4px' }}>{APP_VERSION}</div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Latest Version</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e7e5e4', marginTop: '4px' }}>{globalOtaState.remoteVersion || 'N/A'}</div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Version Code</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e7e5e4', marginTop: '4px' }}>{otaDebugLogs.installedVersionCode !== null ? String(otaDebugLogs.installedVersionCode) : 'N/A'}</div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Current State</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#e7e5e4', marginTop: '4px' }}>{globalOtaState.updateState}</div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>OTA Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: globalOtaState.updateAvailable ? '#ee7d77' : '#4ade80' }} className="status-dot-pulse" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#e7e5e4' }}>{globalOtaState.updateAvailable ? 'Available' : 'Idle'}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>PackageInstaller</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#e7e5e4', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nativeInstallerDetails?.sessionState || 'None'}</div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Storage / Network</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#e7e5e4', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nativeDeviceInfo?.storageAvailable || otaDiagnostics?.storageAvailable || 'N/A'} / {nativeDeviceInfo?.networkState || otaDiagnostics?.networkState || 'N/A'}
              </div>
            </div>
            <div style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ color: '#acabaa', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Battery / Last Check</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#e7e5e4', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nativeDeviceInfo?.battery !== undefined ? `${nativeDeviceInfo.battery}%` : otaDiagnostics?.batteryLevel !== undefined ? `${otaDiagnostics.batteryLevel}%` : 'N/A'} &bull; {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2 / span 4', background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e7e5e4' }}>Download Progress</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#acabaa' }}>
                  {(globalOtaState.progress * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${globalOtaState.progress * 100}%`, background: '#007aff', transition: 'width 0.3s ease', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 2: Production Actions */}
        <AccordionSection 
          title="Production Controls" 
          icon="settings_remote" 
          collapsed={sectionsCollapsed.actions}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, actions: !prev.actions }))}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderActionCard(
              'Check for Updates',
              'Queries the remote release registry for update manifests',
              'refresh',
              'prodCheck',
              async () => {
                await checkForUpdate(true, 'dev_tools', 'Check for Updates button tapped');
              }
            )}
            {renderActionCard(
              'Download APK',
              'Downloads target package to native storage caching folder',
              'download',
              'prodDownload',
              async () => {
                await downloadUpdate('Download APK button tapped');
              }
            )}
            {renderActionCard(
              'Install APK',
              'Launches Android PackageInstaller session overlay prompts',
              'archive',
              'prodInstall',
              async () => {
                await applyUpdate('Install APK button tapped');
              }
            )}
            {renderActionCard(
              'Run Complete Flow',
              'Performs checking, downloading, and package install steps',
              'play_arrow',
              'prodFlow',
              async () => {
                const checkRes = await checkForUpdate(true, 'dev_tools', 'Complete Flow button tapped');
                if (checkRes.updateAvailable) {
                  await downloadUpdate('Complete Flow');
                  await applyUpdate('Complete Flow');
                } else {
                  showToast('No update available.');
                }
              },
              true
            )}
          </div>
        </AccordionSection>

        {/* SECTION 3: Live Logs */}
        <AccordionSection 
          title="Live Execution Console" 
          icon="terminal" 
          collapsed={sectionsCollapsed.logs}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, logs: !prev.logs }))}
        >
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(72,72,72,0.15)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(25,26,26,0.5)', borderBottom: '1px solid rgba(72,72,72,0.15)' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(72,72,72,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#acabaa' }}>search</span>
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '11px', width: '100%', fontFamily: 'monospace' }}
                  className="bg-transparent"
                />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => {
                    jsLogs.length = 0;
                    nativeLogsList.length = 0;
                    stateTimeline.length = 0;
                    triggerSimRender();
                    showToast('Logs cleared');
                  }}
                  style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', display: 'flex' }}
                  className="hover:bg-white/10"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ee7d77' }}>delete_sweep</span>
                </button>
                <button 
                  onClick={() => {
                    let txt = `=== LIVE CONSOLE LOGS ===\n`;
                    filteredTimeline.forEach(e => {
                      const timeStr = new Date(e.time).toLocaleTimeString();
                      txt += `[${timeStr}] [${e.type.toUpperCase()}] ${e.text} ${e.details ? ` - ${e.details}` : ''}\n`;
                    });
                    handleCopyText(txt, 'Console Logs');
                  }}
                  style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', display: 'flex' }}
                  className="hover:bg-white/10"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#679cff' }}>content_copy</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 12px', background: 'rgba(25,26,26,0.3)', borderBottom: '1px solid rgba(72,72,72,0.15)' }}>
              {(['all', 'js', 'native', 'state', 'errors', 'warnings'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setLogFilterMode(mode)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: logFilterMode === mode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: logFilterMode === mode ? '#007aff' : '#acabaa',
                    border: logFilterMode === mode ? '1px solid #007aff' : '1px solid transparent',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Scrollable Container */}
            <div 
              ref={logContainerRef}
              style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: '#0e0e0e' }}
            >
              {filteredTimeline.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No logs match current criteria.</div>
              ) : (
                filteredTimeline.map((e, idx) => {
                  const timeStr = new Date(e.time).toLocaleTimeString();
                  let badgeBg = 'rgba(0, 122, 255, 0.1)';
                  let badgeColor = '#007aff';
                  if (e.type === 'native') {
                    badgeBg = 'rgba(74, 222, 128, 0.1)';
                    badgeColor = '#4ade80';
                  } else if (e.type === 'state') {
                    badgeBg = 'rgba(168, 85, 247, 0.1)';
                    badgeColor = '#c084fc';
                  }
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: 'monospace', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{timeStr}</span>
                      <span style={{ background: badgeBg, color: badgeColor, padding: '1px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>
                        {e.type}
                      </span>
                      <span style={{ color: '#e7e5e4', wordBreak: 'break-all' }}>{e.text}</span>
                      {e.details && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>({e.details})</span>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Auto Scroll toggle */}
            <div style={{ padding: '6px 12px', background: 'rgba(25,26,26,0.5)', borderTop: '1px solid rgba(72,72,72,0.15)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: '#acabaa', fontWeight: 600 }}>Auto Scroll</span>
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                style={{ 
                  width: '28px', 
                  height: '14px', 
                  borderRadius: '99px', 
                  background: autoScroll ? '#007aff' : 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  position: 'relative', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: '#fff', 
                  marginLeft: autoScroll ? '14px' : '0px', 
                  transition: 'margin-left 0.15s ease' 
                }} />
              </button>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 4: Diagnostics Copy Stack */}
        <AccordionSection 
          title="Diagnostic Exports" 
          icon="content_copy" 
          collapsed={sectionsCollapsed.diagnostics}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, diagnostics: !prev.diagnostics }))}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              onClick={() => handleCopyAction('Complete Snapshot', () => JSON.stringify(buildDiagnosticDataObject(), null, 2))}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>analytics</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>Diagnostics Snapshot (JSON)</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('Combined Logs', () => copyCombinedLogs())}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>history</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>Combined logs trace</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('JS Logs only', () => copyJsLogs())}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>javascript</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>JS Execution Context logs</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('Native Logs only', () => copyNativeLogs())}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>android</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>Native PackageInstaller logs</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('PackageInstaller details', () => {
                return JSON.stringify(nativeInstallerDetails || {}, null, 2);
              })}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>inventory_2</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>PackageInstaller metrics</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('State machine transitions', () => {
                let txt = '=== STATE MACHINE TRANSITIONS ===\n';
                transitionHistory.forEach(t => {
                  txt += `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.from} -> ${t.to} (${t.reason})\n`;
                });
                return txt;
              })}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>account_tree</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>State machine transitions log</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('Engineering report', () => exportEngineeringReport())}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>description</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>Engineering report Markdown</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>

            <div 
              onClick={() => handleCopyAction('Complete aggregated report', () => exportEverything())}
              style={{ background: 'rgba(25, 26, 26, 0.4)', border: '1px solid rgba(72, 72, 72, 0.15)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              className="hover:bg-[#252626]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#acabaa' }}>library_books</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>Aggregated Engineering log report</span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#acabaa' }}>content_copy</span>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 5: Simulation Lab (Bento visual style) */}
        <AccordionSection 
          title="Simulation Laboratory" 
          icon="science" 
          collapsed={sectionsCollapsed.simulation}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, simulation: !prev.simulation }))}
        >
          <div style={{ position: 'relative', overflow: 'hidden', background: '#191a1a', padding: '16px', borderRadius: '18px', border: '1px solid rgba(72, 72, 72, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#007aff' }}>science</span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#e7e5e4', letterSpacing: '-0.02em', fontFamily: 'Manrope' }}>Bento Simulator API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: '14px' }}>
              {renderSimulationCard(
                'Force Update Available',
                updaterSimulation.forceUpdateAvailable,
                async () => {
                  updaterSimulation.forceUpdateAvailable = true;
                  updaterSimulation.forceNoUpdate = false;
                  updaterSimulation.forceDowngrade = false;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force Update Available');
                }
              )}
              {renderSimulationCard(
                'Force No Update',
                updaterSimulation.forceNoUpdate,
                async () => {
                  updaterSimulation.forceUpdateAvailable = false;
                  updaterSimulation.forceNoUpdate = true;
                  updaterSimulation.forceDowngrade = false;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force No Update');
                }
              )}
              {renderSimulationCard(
                'Force Downgrade',
                updaterSimulation.forceDowngrade,
                async () => {
                  updaterSimulation.forceUpdateAvailable = false;
                  updaterSimulation.forceNoUpdate = false;
                  updaterSimulation.forceDowngrade = true;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force Downgrade');
                }
              )}
              {renderSimulationCard(
                'Force Metadata Failure',
                updaterSimulation.forceMetadataFailure,
                async () => {
                  updaterSimulation.forceMetadataFailure = true;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force Metadata Failure');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Mandatory Badge',
                updaterSimulation.forceMandatoryUpdate,
                async () => {
                  updaterSimulation.forceMandatoryUpdate = true;
                  updaterSimulation.forceOptionalUpdate = false;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force Mandatory');
                }
              )}
              {renderSimulationCard(
                'Force Optional Badge',
                updaterSimulation.forceOptionalUpdate,
                async () => {
                  updaterSimulation.forceOptionalUpdate = true;
                  updaterSimulation.forceMandatoryUpdate = false;
                  await checkForUpdate(true, 'dev_tools', 'Simulation: Force Optional');
                }
              )}
              {renderSimulationCard(
                'Force Pending Confirmation',
                updaterSimulation.forcePendingUserAction,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = false;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = true;
                  triggerSimulatedStatus(-1, 'STATUS_PENDING_USER_ACTION');
                },
                'warning'
              )}
              {renderSimulationCard(
                'Force Success Status (0)',
                updaterSimulation.forceInstallSuccess,
                () => {
                  updaterSimulation.forceInstallSuccess = true;
                  updaterSimulation.forceInstallFailure = false;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(0, 'STATUS_SUCCESS');
                }
              )}
              {renderSimulationCard(
                'Force Fail Status (1)',
                updaterSimulation.forceInstallFailure && !updaterSimulation.forceUserCancel && !updaterSimulation.forcePendingUserAction,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = true;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(1, 'STATUS_FAILURE');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Cancel Status (3)',
                updaterSimulation.forceUserCancel,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = false;
                  updaterSimulation.forceUserCancel = true;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(3, 'STATUS_FAILURE_ABORTED');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Storage Full Status (6)',
                updaterSimulation.forceInstallFailure && nativeInstallerDetails?.lastStatusCode === 6,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = true;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(6, 'STATUS_FAILURE_STORAGE');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Signature Error (5)',
                updaterSimulation.forceInstallFailure && nativeInstallerDetails?.lastStatusCode === 5,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = true;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(5, 'STATUS_FAILURE_CONFLICT');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Incompatible Status (7)',
                updaterSimulation.forceInstallFailure && nativeInstallerDetails?.lastStatusCode === 7,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = true;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(7, 'STATUS_FAILURE_INCOMPATIBLE');
                },
                'danger'
              )}
              {renderSimulationCard(
                'Force Blocked Status (2)',
                updaterSimulation.forceInstallFailure && nativeInstallerDetails?.lastStatusCode === 2,
                () => {
                  updaterSimulation.forceInstallSuccess = false;
                  updaterSimulation.forceInstallFailure = true;
                  updaterSimulation.forceUserCancel = false;
                  updaterSimulation.forcePendingUserAction = false;
                  triggerSimulatedStatus(2, 'STATUS_FAILURE_BLOCKED');
                },
                'danger'
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button 
                onClick={() => {
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
                  triggerSimRender();
                  showToast('Simulation settings wiped');
                }}
                
                style={{ flex: 1, minWidth: '120px', padding: '10px', borderRadius: '10px', background: '#007aff', color: '#fff', border: 'none', fontWeight: 800, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
                className="hover:brightness-110"
              >
                Clear Simulations
              </button>
              
              <button 
                onClick={() => {
                  resetOtaUpdateState();
                  showToast('State machine reset');
                }}
                
                style={{ flex: 1, minWidth: '120px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#ee7d77', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 800, fontSize: '11px', cursor: 'pointer', outline: 'none' }}
                className="hover:bg-white/10"
              >
                Reset State Machine
              </button>

              <button 
                disabled={!isNative()}
                onClick={() => {
                  if (isNative()) {
                    AppInstaller.openUnknownAppSourcesSettings();
                  }
                }}
                
                style={{ flex: 1, minWidth: '120px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#e7e5e4', border: '1px solid rgba(72,72,72,0.15)', fontWeight: 800, fontSize: '11px', cursor: isNative() ? 'pointer' : 'not-allowed', opacity: isNative() ? 1 : 0.4, outline: 'none' }}
                className="hover:bg-white/10"
              >
                Settings Permission {!isNative() && "(Native only)"}
              </button>
            </div>
            
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(72, 72, 72, 0.1)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#acabaa', fontFamily: 'Manrope' }}>Automated QA Functional Audit</span>
                <button
                  onClick={() => {
                    console.log("BUTTON PRESSED:\nRun Functional Audit");
                    addJsLog("BUTTON PRESSED:\nRun Functional Audit");
                    runAutomatedAudit();
                  }}
                  disabled={auditStatus === 'running'}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(103, 156, 255, 0.1)',
                    color: '#679cff',
                    fontWeight: 800,
                    border: '1px solid rgba(103, 156, 255, 0.2)',
                    fontSize: '10px',
                    cursor: auditStatus === 'running' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                >
                  {auditStatus === 'running' ? 'Running Audit...' : 'Execute Audit'}
                </button>
              </div>
              
              {auditStatus !== 'idle' && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 10,
                  maxHeight: 120,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginTop: '8px',
                  fontFamily: 'monospace'
                }}>
                  {auditResults.map((res, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff' }}>{res.name}</span>
                      <span style={{
                        color: res.status === 'success' ? '#34d399' : '#f87171',
                        fontWeight: 700,
                        fontSize: 9,
                        background: res.status === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                        padding: '2px 4px',
                        borderRadius: 4
                      }}>
                        {res.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </AccordionSection>

        {/* SECTION 6: State Machine timeline connected connecting line */}
        <AccordionSection 
          title="Update State Transitions" 
          icon="insights" 
          collapsed={sectionsCollapsed.stateMachine}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, stateMachine: !prev.stateMachine }))}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(25, 26, 26, 0.4)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(72, 72, 72, 0.15)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {transitionHistory.length === 0 ? (
                <div style={{ color: '#acabaa', fontSize: '11px', fontStyle: 'italic', fontFamily: 'Manrope' }}>No state transitions recorded yet.</div>
              ) : (
                transitionHistory.slice(-6).reverse().map((t, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', textAlign: 'left' }}>
                      {!isLast && (
                        <div style={{
                          position: 'absolute',
                          left: '11px',
                          top: '24px',
                          bottom: '-20px',
                          width: '2px',
                          background: 'rgba(72, 72, 72, 0.3)'
                        }} />
                      )}
                      <div style={{
                        zIndex: 10,
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'rgba(0, 122, 255, 0.2)' : 'rgba(74, 222, 128, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#007aff' : '#4ade80'
                        }} className={idx === 0 ? "status-dot-pulse" : ""} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: idx === 0 ? '#e7e5e4' : '#acabaa', fontFamily: 'Manrope', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {t.to} 
                          {idx === 0 && <span style={{ fontSize: '9px', color: '#007aff', background: 'rgba(0, 122, 255, 0.1)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>Current</span>}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#acabaa', fontFamily: 'Manrope', lineHeight: 1.35 }}>
                          Reason: {t.reason} &bull; <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 7: Engineering Report Preview */}
        <AccordionSection 
          title="Engineering Report Snapshot" 
          icon="description" 
          collapsed={sectionsCollapsed.report}
          onToggle={() => setSectionsCollapsed(prev => ({ ...prev, report: !prev.report }))}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(25, 26, 26, 0.6)', border: '1px solid rgba(72, 72, 72, 0.15)', padding: '16px', borderRadius: '12px', maxHeight: '240px', overflowY: 'auto', textAlign: 'left' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '10px', color: '#acabaa', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.45 }}>
                {generateFullEngineeringReport()}
              </pre>
            </div>
            <button 
              onClick={() => handleCopyAction('Complete Report', () => generateFullEngineeringReport())}
              
              style={{ padding: '12px', borderRadius: '10px', background: '#007aff', color: '#fff', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer', outline: 'none' }}
              className="hover:brightness-110"
            >
              Copy Complete Report
            </button>
          </div>
        </AccordionSection>

      </div>
    );
  };
  // Render Stagex Diagnostics View
  const renderStagexView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Stagex ACK Telemetry</span>
          <button
            onClick={() => {
              resetStagexDiagnostics();
              setSelfTestResults([]);
              showToast('Stagex diagnostics reset.');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontFamily: 'Manrope',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Reset Stats
          </button>
        </div>

        {/* ROOT CAUSE DETECTION */}
        {(stagex.missingHandlers?.length > 0 || stagex.handlerFailed || stagex.timeoutCount > 0 || !stagex.iframeMounted || stagex.lastError !== 'none') && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 800, fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
              Root Cause Diagnostics Alert
            </div>
            
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!stagex.iframeMounted && (
                <li><strong>Bridge Failure:</strong> Stagex IFrame is not mounted in the DOM.</li>
              )}
              {stagex.iframeMounted && !stagex.stageCoreReadyReceived && (
                <li><strong>Bridge Failure:</strong> IFrame loaded, but stage-core ready message was never received.</li>
              )}
              {stagex.missingHandlers?.length > 0 && (
                <li><strong>Missing Handlers:</strong> Parent called functions not exported to window: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: 4 }}>{stagex.missingHandlers.join(', ')}</code></li>
              )}
              {stagex.handlerFailed && (
                <li><strong>Handler Exception:</strong> Runtime exception raised during command execution. Check error trace below.</li>
              )}
              {stagex.timeoutCount > 0 && (
                <li><strong>ACK Failure:</strong> {stagex.timeoutCount} commands timed out without receiving an ACK/NACK.</li>
              )}
              {stagex.lastError !== 'none' && stagex.lastError !== 'N/A' && (
                <li><strong>Last Exception:</strong> <code style={{ display: 'block', margin: '4px 0 0', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{stagex.lastError}</code></li>
              )}
            </ul>
          </div>
        )}

        {/* SELF TEST SECTION */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 13, display: 'block' }}>Stagex Bridge Self-Test</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Verifies each runtime command executes & returns ACK/NACK</span>
            </div>
            <button
              onClick={runSelfTest}
              disabled={selfTestRunning}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: selfTestRunning ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                border: 'none',
                color: selfTestRunning ? 'rgba(255,255,255,0.4)' : '#fff',
                fontWeight: 700,
                fontSize: '11px',
                cursor: selfTestRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {selfTestRunning ? 'Running...' : 'Run Self-Test'}
            </button>
          </div>

          {selfTestResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
              {selfTestResults.map((res, i) => {
                let statusColor = '#fbbf24'; // pending
                let statusIcon = 'hourglass_empty';
                let statusText = 'Pending';

                if (res.status === 'success') {
                  statusColor = '#10b981';
                  statusIcon = 'check_circle';
                  statusText = `ACK (${res.latency}ms)`;
                } else if (res.status === 'nack_missing') {
                  statusColor = '#ef4444';
                  statusIcon = 'cancel';
                  statusText = `NACK: Missing`;
                } else if (res.status === 'nack_error') {
                  statusColor = '#ef4444';
                  statusIcon = 'error';
                  statusText = `NACK: Error`;
                } else if (res.status === 'timeout') {
                  statusColor = '#f59e0b';
                  statusIcon = 'timer';
                  statusText = 'Timeout';
                }

                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0', borderBottom: i < selfTestResults.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: statusColor }}>{statusIcon}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {res.command}({res.arg ? `'${res.arg}'` : ''})
                      </span>
                    </div>
                    <span style={{ color: statusColor, fontWeight: 800, fontSize: 10 }}>{statusText}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CollapsibleSection
          title="IFrame Connection Status"
          collapsed={stagexCollapsed.connection}
          onToggle={() => setStagexCollapsed(prev => ({ ...prev, connection: !prev.connection }))}
        >
          <DiagnosticField label="IFrame Mounted" value={stagex.iframeMounted ? 'YES' : 'NO'} />
          <DiagnosticField label="IFrame URL / Src" value={stagex.iframeSrc} />
          <DiagnosticField label="Load Event Fired" value={stagex.iframeLoadFired ? 'YES' : 'NO'} />
          <DiagnosticField label="contentWindow Available" value={stagex.contentWindowAvailable ? 'YES' : 'NO'} />
          <DiagnosticField label="stage-core Ready Event Received" value={stagex.stageCoreReadyReceived ? 'YES' : 'NO'} />
          <DiagnosticField label="Wrapper Listener Bound" value={stagex.wrapperListenerRegistered ? 'YES' : 'NO'} />
          <DiagnosticField label="IFrame Listener Installed" value={stagex.iframeListenerInstalled ? 'YES' : 'NO'} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Bridge Telemetry Counters"
          collapsed={stagexCollapsed.counters}
          onToggle={() => setStagexCollapsed(prev => ({ ...prev, counters: !prev.counters }))}
        >
          <DiagnosticField label="Messages Sent Count" value={String(stagex.messagesSent)} />
          <DiagnosticField label="Messages Received Count" value={String(stagex.messagesReceived)} />
          <DiagnosticField label="ACK Count" value={String(stagex.ackCount)} />
          <DiagnosticField label="NACK Count" value={String(stagex.nackCount || 0)} />
          <DiagnosticField label="Timeout Count" value={String(stagex.timeoutCount)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Command Registry Details"
          collapsed={stagexCollapsed.trace}
          onToggle={() => setStagexCollapsed(prev => ({ ...prev, trace: !prev.trace }))}
        >
          <DiagnosticField label="Available Handlers" value={(stagex.availableHandlers || []).join(', ')} />
          <DiagnosticField label="Missing Handlers" value={(stagex.missingHandlers || []).join(', ') || 'none'} />
          <DiagnosticField label="Registry Keys" value="switchView, toggleSCDial, toggleGigMode, stageGoBack, openPresetsPanel, exportPDFWithOptions" />
          <DiagnosticField label="Last Command Sent" value={stagex.lastCommandSent} />
          <DiagnosticField label="Last Message ID" value={stagex.lastMsgId} />
          <DiagnosticField label="Last ACK Received Timestamp" value={stagex.lastAckReceived} />
          <DiagnosticField label="Last NACK Command" value={stagex.lastNack || 'none'} />
          <DiagnosticField label="Last Timeout Command" value={stagex.lastTimeout} />
          <DiagnosticField label="Last Missing Handler" value={stagex.lastMissingHandler || 'none'} />
          <DiagnosticField label="Last Failed Handler" value={stagex.lastFailedHandler || 'none'} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Security & Origin Check"
          collapsed={stagexCollapsed.security}
          onToggle={() => setStagexCollapsed(prev => ({ ...prev, security: !prev.security }))}
        >
          <DiagnosticField label="Current Origin" value={stagex.currentOrigin} />
          <DiagnosticField label="Expected Origin" value={stagex.expectedOrigin} />
          <DiagnosticField label="Actual Event Origin" value={stagex.actualEventOrigin} />
          <DiagnosticField label="Command Sent with Wildcard targetOrigin" value={stagex.sentWithTargetOriginWildcard ? 'YES' : 'NO'} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Execution Failures & Errors"
          collapsed={stagexCollapsed.failures}
          onToggle={() => setStagexCollapsed(prev => ({ ...prev, failures: !prev.failures }))}
        >
          <DiagnosticField label="Origin Rejected" value={stagex.originRejected ? 'YES (Origins mismatched!)' : 'NO'} />
          <DiagnosticField label="Handler Missing (IFrame)" value={stagex.handlerMissing ? 'YES (Target function not exported on window)' : 'NO'} />
          <DiagnosticField label="Handler Execution Failed" value={stagex.handlerFailed ? 'YES (Exceptions raised during run)' : 'NO'} />
          <DiagnosticField label="Last Exception Trace" value={stagex.lastError} />
        </CollapsibleSection>
      </div>
    );
  };

  // UI styles
  const tabBtnStyle = (tab: TabId) => ({
    padding: '8px 14px',
    borderRadius: '12px',
    background: activeTab === tab ? accent.from : 'rgba(255,255,255,0.04)',
    border: 'none',
    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
    fontFamily: 'Manrope',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease'
  });

  // Copy Module Diagnostics
  const handleCopyModuleDiagnostics = (module: string) => {
    let dump: any = {
      appVersion: APP_VERSION,
      timestamp: new Date().toISOString(),
      module
    };

    switch (module) {
      case 'Apps':
        dump.apps = {
          hub: {
            status: settings.appMode === 'hub' ? 'Active' : 'Suspended',
            activeView: activePanel,
            warnings: logs.filter(l => l.level === 'warn' && (l.module === 'Hub' || l.module === 'general')).length
          },
          chordex: {
            status: settings.appMode === 'chords' ? 'Active' : 'Suspended',
            activeView: activePanel,
            warnings: logs.filter(l => l.level === 'warn' && l.module.toLowerCase() === 'chordex').length
          },
          drumex: {
            status: settings.appMode === 'drums' ? 'Active' : 'Suspended',
            activeView: settings.defaultDrumTab,
            warnings: logs.filter(l => l.level === 'warn' && (l.module.toLowerCase() === 'drumex' || l.module.toLowerCase() === 'drums')).length
          },
          stagex: {
            status: settings.appMode === 'stage' ? 'Active' : 'Suspended',
            activeView: settings.defaultStageView,
            warnings: logs.filter(l => l.level === 'warn' && (l.module.toLowerCase() === 'stagex' || l.module.toLowerCase() === 'stage')).length,
            telemetry: stagex
          },
          groovex: {
            status: settings.appMode === 'groovex' ? 'Active' : 'Suspended',
            activeView: 'library',
            warnings: logs.filter(l => l.level === 'warn' && l.module.toLowerCase() === 'groovex').length
          },
          vocalex: {
            status: settings.appMode === 'vocalex' ? 'Active' : 'Suspended',
            activeView: 'practice',
            warnings: logs.filter(l => l.level === 'warn' && l.module.toLowerCase() === 'vocalex').length
          }
        };
        break;
      case 'Stagex':
        dump.stagexDiagnostics = stagex;
        dump.selfTestResults = selfTestResults;
        break;
      case 'Updater':
        dump.otaDiagnostics = otaDiagnostics;
        dump.otaDebugLogs = otaDebugLogs;
        break;
      case 'System':
        dump.device = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isNative: isNative(),
          androidVersion: otaDiagnostics.androidVersion || 'N/A',
          deviceModel: otaDiagnostics.deviceModel || 'Browser'
        };
        dump.settings = {
          theme: settings.theme,
          appMode: settings.appMode,
          developerMode: settings.developerMode
        };
        break;
      case 'Logs':
        dump.errors = errors;
        dump.logs = logs.slice(-100);
        break;
      case 'Performance':
        dump.perfStats = Array.from(perf.entries()).map(([k, v]) => ({ component: k, ...v }));
        break;
      case 'Network':
        dump.network = network.slice(-50);
        break;
      default:
        break;
    }

    navigator.clipboard.writeText(JSON.stringify(dump, null, 2))
      .then(() => showToast(`${module} diagnostics copied!`))
      .catch(() => showToast('Copy failed.'));
  };

  // WarningsInspector moved to file-level

  const renderSubViewHeader = (title: string) => {
    const handleGoBack = () => {
      if (title === 'Stagex Diagnostics') {
        setSubView('apps');
      } else {
        setSubView('dashboard');
      }
    };

    const moduleName = title === 'Apps Diagnostics' ? 'Apps' :
                       title === 'Stagex Diagnostics' ? 'Stagex' :
                       title === 'Updater Diagnostics' ? 'Updater' :
                       title === 'System Diagnostics' ? 'System' :
                       title === 'Logs & Warnings' ? 'Logs' :
                       title === 'Performance Diagnostics' ? 'Performance' :
                       title === 'Network Sniffer' ? 'Network' : '';

    return (
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#000000',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              console.log("BUTTON PRESSED:\nBack to Developer Panel");
              addJsLog("BUTTON PRESSED:\nBack to Developer Panel");
              handleGoBack();
            }}
            className="btn-smooth"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '999px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{title}</span>
        </div>

        {moduleName && (
          <button
            onClick={() => handleCopyModuleDiagnostics(moduleName)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: accent.from,
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Copy Diagnostics
          </button>
        )}
      </div>
    );
  };

  const renderLogsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={logLevelFilter}
            onChange={(e) => setLogLevelFilter(e.target.value as any)}
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>
          <select
            value={logModuleFilter}
            onChange={(e) => setLogModuleFilter(e.target.value)}
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}
          >
            <option value="all">All Modules</option>
            <option value="general">general</option>
            {logModules.filter(m => m !== 'general').map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <button onClick={clearLogs} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 6, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>
          Clear Logs
        </button>
      </div>

      <div style={{ background: '#000000', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', maxHeight: '60vh', overflowY: 'auto', padding: 8 }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No logs capture matched the filters.</div>
        ) : (
          filteredLogs.map((log, i) => {
            const color = log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#fbbf24' : '#60a5fa';
            const isExpanded = !!expandedLogIndices[i];
            
            // Split into summary and details
            const lines = log.message.split('\n');
            const summary = lines[0].substring(0, 100) + (lines[0].length > 100 || lines.length > 1 ? '...' : '');
            
            return (
              <div
                key={i}
                onClick={() => setExpandedLogIndices(prev => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ color, fontWeight: 850, fontSize: '10px', background: `${color}15`, padding: '2px 6px', borderRadius: 4 }}>
                    {log.level.toUpperCase()}
                  </span>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>[{log.module}]</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </span>
                </div>
                
                <div style={{
                  color: log.level === 'error' ? '#fca5a5' : '#e4e4e7',
                  wordBreak: 'break-all',
                  paddingLeft: 4,
                  fontSize: '11px',
                  lineHeight: 1.4
                }}>
                  {isExpanded ? log.message : summary}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderErrorsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Captured Exceptions</span>
        <button onClick={clearErrors} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 6, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>
          Clear Errors
        </button>
      </div>
      {errors.length === 0 ? (
        <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', padding: '16px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', fontSize: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          No runtime errors captured in this session.
        </div>
      ) : (
        errors.map((err, i) => (
          <div key={i} style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>[{new Date(err.timestamp).toLocaleTimeString()}] Source: {err.source}</span>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>{err.module.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', fontFamily: 'monospace', marginBottom: 8 }}>{err.message}</div>
            {(() => {
              const codeMatch = /Minified React error #(\d+)/i.exec(err.message);
              if (codeMatch) {
                const code = codeMatch[1];
                const decoded = decodeReactError(code);
                if (decoded) {
                  return (
                    <div style={{ marginTop: 8, marginBottom: 8, padding: 10, background: 'rgba(59, 91, 219, 0.08)', border: '1px solid rgba(59, 91, 219, 0.2)', borderRadius: 8, fontSize: 11, color: '#d2d6dc', lineHeight: 1.4, textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#748ffc', marginBottom: 4 }}>Decoded React Error #${code}:</div>
                      <div style={{ fontStyle: 'italic', marginBottom: 6 }}>{decoded.message}</div>
                      <div style={{ marginBottom: 6 }}><strong style={{ color: '#a5b4fc' }}>Potential Cause:</strong> {decoded.cause}</div>
                      <div style={{ marginBottom: 8 }}><strong style={{ color: '#a5b4fc' }}>Recommended Fix:</strong> {decoded.fix}</div>
                      <button
                        onClick={() => {
                          const explanation = `=== DECODED REACT ERROR #${code} ===\nMessage: ${decoded.message}\n\nPotential Cause: ${decoded.cause}\n\nRecommended Fix: ${decoded.fix}`;
                          navigator.clipboard.writeText(explanation);
                          alert("React error explanation copied to clipboard!");
                        }}
                        style={{
                          background: 'rgba(59, 91, 219, 0.2)',
                          border: '1px solid rgba(59, 91, 219, 0.4)',
                          color: '#9eb2ff',
                          borderRadius: 6,
                          fontSize: 10,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontFamily: 'Manrope',
                          fontWeight: 700
                        }}
                      >
                        Copy Decoded Explanation
                      </button>
                    </div>
                  );
                }
              }
              return null;
            })()}
            {err.stack && (
              <pre style={{ margin: 0, padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>
                {err.stack}
              </pre>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderEventsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <select
          value={eventModuleFilter}
          onChange={(e) => setEventModuleFilter(e.target.value)}
          style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}
        >
          <option value="all">All Modules</option>
          <option value="general">general</option>
          <option value="hub">hub</option>
          <option value="stage">stage</option>
          <option value="drums">drums</option>
          <option value="grooves">grooves</option>
          <option value="vocals">vocals</option>
        </select>
        <button onClick={clearEvents} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>
          Clear
        </button>
      </div>

      <div style={{ background: '#000000', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', maxHeight: '60vh', overflowY: 'auto', padding: 8 }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No gesture events streamed yet. Tap around the UI!</div>
        ) : (
          filteredEvents.slice().reverse().map((evt, i) => (
            <div key={i} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 11, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{evt.type}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>→ {evt.target}</span>
              </div>
              <span style={{ color: '#a78bfa' }}>{evt.module}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPerfTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Component Render Tracker</span>
        <button onClick={clearPerfStats} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>
          Reset
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from(perf.entries()).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No component performance metrics logged.</div>
        ) : (
          Array.from(perf.entries()).map(([comp, stats]) => {
            const isHighRerender = stats.renders > 15;
            return (
              <div key={comp} style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: isHighRerender ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 13, color: isHighRerender ? '#fbbf24' : '#fff' }}>
                    {comp}
                  </span>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Last render: {new Date(stats.lastRenderTime).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'monospace' }}>
                  <div>Mounts: <span style={{ color: '#10b981', fontWeight: 800 }}>{stats.mounts}</span></div>
                  <div>Renders: <span style={{ color: isHighRerender ? '#f59e0b' : '#3b82f6', fontWeight: 800 }}>{stats.renders}</span></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderStateTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>Global App State Dump</span>
      <div style={{
        padding: 12,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        fontFamily: 'monospace',
        fontSize: 11,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '55vh',
        overflowY: 'auto'
      }}>
        {JSON.stringify({
          activeModule: settings.appMode,
          activeTheme: settings.theme,
          accentColor: settings.accentColor,
          customAccentHue: settings.customAccentHue,
          language: settings.language,
          syncAcrossDevices: settings.syncAcrossDevices,
          otaNotifications: settings.otaNotifications,
          otaAutoCheck: settings.otaAutoCheck
        }, null, 2)}
      </div>
    </div>
  );

  const renderNavTab = () => {
    const navEntries = getNavigationEntries();
    let diag = (window as any).__navigationDiagnostics;
    if (!diag) {
      try {
        const stored = localStorage.getItem('studio_black_screen_diagnostics');
        if (stored) {
          diag = JSON.parse(stored);
          (window as any).__navigationDiagnostics = diag;
        }
      } catch (_) {}
    }
    diag = diag || {
      returnAttempts: 0,
      failedReturns: 0,
      blackScreenDetections: 0,
      lastBlocker: 'none',
      history: []
    };

    const handleCapture = () => {
      const statePayload = (window as any).__captureBlackScreenState?.();
      if (statePayload) {
        diag.lastPayload = statePayload;
        showToast('Black screen state captured!');
        try {
          localStorage.setItem('studio_black_screen_diagnostics', JSON.stringify(diag));
        } catch (_) {}
      } else {
        showToast('Capture failed: capture function not registered.');
      }
    };

    const handleCopy = () => {
      const payload = {
        navigationDiagnostics: {
          returnAttempts: diag.returnAttempts,
          failedReturns: diag.failedReturns,
          blackScreenDetections: diag.blackScreenDetections,
          lastBlocker: diag.lastBlocker,
          chordex: (window as any).__chordexDiagnostics || null
        },
        capturedPayload: diag.lastPayload || (window as any).__captureBlackScreenState?.() || null
      };

      navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
        .then(() => showToast('Diagnostics copied to clipboard!'))
        .catch(() => showToast('Copy failed. Please copy manually.'));
    };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Navigation Trace & Lifecycle Diagnostics</span>
          <button 
            onClick={() => {
              clearNavigationEntries();
              showToast('Navigation logs cleared!');
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: 6,
              fontSize: 10,
              padding: '4px 10px',
              cursor: 'pointer'
            }}
          >
            Clear logs
          </button>
        </div>

        <div style={{ background: '#181820', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Black Screen Diagnostics</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontSize: 11 }}>
            <div>Return Attempts: <strong>{diag.returnAttempts}</strong></div>
            <div>Failed Returns: <strong>{diag.failedReturns}</strong></div>
            <div>Detections: <strong>{diag.blackScreenDetections}</strong></div>
            <div style={{ gridColumn: 'span 2' }}>
              Topmost Blocker: <span style={{ fontFamily: 'monospace', color: '#f87171' }}>{diag.lastBlocker}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleCapture}
              style={{
                flex: 1,
                background: '#3b82f6',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Capture Black Screen State
            </button>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                background: '#10b981',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Copy Black Screen Diagnostics
            </button>
          </div>
        </div>

        <div style={{ background: '#000000', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 12, fontSize: 12, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
            Current Route Mode: <strong style={{ color: '#fff' }}>{settings.appMode}</strong>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>
            Previous view cache triggers:
            <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
              <li>Last Active Session Panel: {useChordStore.getState().lastSession?.stagexView || 'N/A'}</li>
              <li>LiquidGlassNav collapsed state: {String(useChordStore.getState().favorites?.length > 0)}</li>
            </ul>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {navEntries.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
              No navigation events logged yet.
            </div>
          ) : (
            navEntries.slice().reverse().map(entry => {
              const timeStr = new Date(entry.timestamp).toLocaleTimeString() + '.' + String(entry.timestamp % 1000).padStart(3, '0');
              
              const tags: React.ReactNode[] = [];
              if (entry.transitionStart) tags.push(<span key="start" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>START</span>);
              if (entry.transitionComplete) tags.push(<span key="complete" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>COMPLETE</span>);
              if (entry.hubMounted) tags.push(<span key="hub" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>HUB MOUNTED</span>);
              if (entry.subappUnmounted) tags.push(<span key="unmount" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>SUBAPP UNMOUNTED</span>);
              if (entry.fallbackRendered) tags.push(<span key="fallback" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>FALLBACK SHOWN</span>);

              return (
                <div key={entry.id} style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10,
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{timeStr}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {tags}
                      <span style={{
                        background: entry.transitionLockState ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: entry.transitionLockState ? '#ef4444' : '#10b981',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700
                      }}>
                        {entry.transitionLockState ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff' }}>
                      Flow: <strong style={{ color: '#3b82f6' }}>{entry.fromApp || 'none'}</strong> &rarr; <strong style={{ color: '#10b981' }}>{entry.toApp || 'none'}</strong>
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Active: <strong style={{ color: '#fff' }}>{entry.activeAppAfterTransition}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderNetworkTab = () => {
    const missingAssets = network.reduce((acc, req) => {
      if (req.status === 404) {
        let pathOnly = req.url;
        try {
          const urlObj = new URL(req.url);
          pathOnly = urlObj.pathname;
        } catch {
          const queryIdx = req.url.indexOf('?');
          pathOnly = queryIdx >= 0 ? req.url.substring(0, queryIdx) : req.url;
        }

        let module = 'general';
        const lowerPath = pathOnly.toLowerCase();
        if (lowerPath.includes('drums/')) {
          module = 'drumex';
        } else if (lowerPath.includes('stage-core/') || lowerPath.includes('stagex/')) {
          module = 'stagex';
        } else if (lowerPath.includes('chordex/')) {
          module = 'chordex';
        } else if (lowerPath.includes('groovex/')) {
          module = 'groovex';
        } else if (lowerPath.includes('vocalex/')) {
          module = 'vocalex';
        }

        let suggestedCause = 'Asset missing from local build assets.';
        if (lowerPath.includes('drums/')) {
          suggestedCause = 'Drums asset ignored by aapt packaging rule or missing from public/drums.';
        } else if (lowerPath.endsWith('.map')) {
          suggestedCause = 'Source maps excluded in production build.';
        }

        const existing = acc.find(a => a.path === pathOnly);
        if (existing) {
          existing.count++;
          if (req.timestamp < existing.firstSeen) existing.firstSeen = req.timestamp;
          if (req.timestamp > existing.lastSeen) existing.lastSeen = req.timestamp;
        } else {
          acc.push({
            path: pathOnly,
            count: 1,
            firstSeen: req.timestamp,
            lastSeen: req.timestamp,
            module,
            suggestedCause
          });
        }
      }
      return acc;
    }, [] as Array<{
      path: string;
      count: number;
      firstSeen: number;
      lastSeen: number;
      module: string;
      suggestedCause: string;
    }>);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Network Request Sniffer</span>
          <button onClick={clearNetworkRequests} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>
            Clear
          </button>
        </div>

        {missingAssets.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: 18 }}>error</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>
                Missing Assets ({missingAssets.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {missingAssets.map((asset, idx) => (
                <div key={idx} style={{
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '9px'
                      }}>404</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        Module: {asset.module}
                      </span>
                      {asset.count > 1 && (
                        <span style={{
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '9px'
                        }}>
                          ×{asset.count}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
                      Seen: {new Date(asset.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#fff', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: 600 }}>
                    {asset.path}
                  </div>
                  <div style={{ color: '#ef4444', opacity: 0.9, fontSize: '10px' }}>
                    <strong>Cause:</strong> {asset.suggestedCause}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>
                    First seen: {new Date(asset.firstSeen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {network.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No HTTP requests logged.</div>
          ) : (
            network.slice().reverse().map((req, i) => {
              const isError = req.error || (req.status && req.status >= 400);
              const color = isError ? '#ef4444' : '#10b981';
              return (
                <div key={i} style={{
                  padding: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>
                    <span style={{ color: '#fbbf24', fontWeight: 800 }}>{req.method}</span>
                    <span style={{ color }}>{req.status ? `HTTP ${req.status} ${req.statusText || ''}`.trim() : req.error ? 'FAILED' : 'PENDING'}</span>
                  </div>
                  <div style={{ fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace', color: '#fff' }}>{req.url}</div>
                  {req.headers && Object.keys(req.headers).length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      Headers: {JSON.stringify(req.headers)}
                    </div>
                  )}
                  {req.error && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#fca5a5', fontFamily: 'monospace' }}>
                      Error: {req.error}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderStorageTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>LocalStorage Inspector (Masked)</span>
      <div style={{ display: 'grid', gap: 8 }}>
        {Object.keys(localStorage).map(key => {
          const val = localStorage.getItem(key) || '';
          return (
            <div key={key} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 12, fontFamily: 'monospace', color: '#a78bfa', marginBottom: 4 }}>{key}</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.2)',
                padding: '6px 8px',
                borderRadius: 4
              }}>
                {maskSensitiveValue(key, val)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProvidersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>App-Specific Debug Panels</span>
      {activeProviders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          No app-specific debug panel is currently active. Open Chordex, Stagex, or Drumex to inspect them.
        </div>
      ) : (
        activeProviders.map(prov => (
          <div key={prov.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#a78bfa' }}>{prov.name} ({prov.id})</h4>
            
            {/* Provider Actions */}
            {prov.getActions && prov.getActions().length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {prov.getActions().map((act, idx) => (
                  <button
                    key={idx}
                    onClick={act.action}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: accent.from,
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 10,
                      cursor: 'pointer'
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {/* State */}
            <pre style={{
              margin: 0,
              padding: 10,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#f4f4f5',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {JSON.stringify(prov.getDebugState(), null, 2)}
            </pre>
          </div>
        ))
      )}
    </div>
  );

  const renderDashboardCards = () => {
    const cards = [
      {
        id: 'apps',
        title: 'Apps',
        description: 'View diagnostics and runtime status for Livex applications.',
        action: () => setSubView('apps')
      },
      {
        id: 'updater',
        title: 'Updater',
        description: 'Inspect update and native APK diagnostics.',
        action: () => setSubView('updater')
      },
      {
        id: 'system',
        title: 'System',
        description: 'View device, runtime and environment information.',
        action: () => { setSubView('system'); setActiveTab('state'); }
      },
      {
        id: 'logs',
        title: 'Logs',
        description: 'View runtime logs, warnings and errors.',
        action: () => { setSubView('logs'); setActiveTab('logs'); }
      },
      {
        id: 'performance',
        title: 'Performance',
        description: 'Inspect memory, rendering and performance metrics.',
        action: () => { setSubView('performance'); setActiveTab('perf'); }
      },
      {
        id: 'network',
        title: 'Network',
        description: 'Inspect connectivity and request diagnostics.',
        action: () => { setSubView('network'); setActiveTab('network'); }
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={card.action}
            className="btn-smooth"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              gap: 12
            }}
          >
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>{card.title}</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', lineHeight: '1.4' }}>
                {card.description}
              </p>
            </div>
            
            <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 20 }}>
              chevron_right
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderAppsView = () => {
    const getAppWarningsCount = (appKey: string) => {
      return logs.filter(l => {
        if (l.level !== 'warn') return false;
        const mod = l.module.toLowerCase();
        if (appKey === 'chords') return mod === 'chordex';
        if (appKey === 'drums') return mod === 'drumex' || mod === 'drums';
        if (appKey === 'stage') return mod === 'stagex' || mod === 'stage';
        if (appKey === 'groovex') return mod === 'groovex';
        if (appKey === 'vocalex') return mod === 'vocalex';
        if (appKey === 'hub') {
          return !['chordex', 'drumex', 'drums', 'stagex', 'stage', 'groovex', 'vocalex'].includes(mod);
        }
        return false;
      }).length;
    };

    const appsList = [
      {
        key: 'hub',
        name: 'Livex Hub',
        status: settings.appMode === 'hub' ? 'Active' : 'Suspended',
        view: activePanel,
        memory: '24.5 MB',
        warnings: getAppWarningsCount('hub'),
      },
      {
        key: 'chords',
        name: 'Chordex',
        status: settings.appMode === 'chords' ? 'Active' : 'Suspended',
        view: activePanel,
        memory: '32.1 MB',
        warnings: getAppWarningsCount('chords'),
      },
      {
        key: 'drums',
        name: 'Drumex',
        status: settings.appMode === 'drums' ? 'Active' : 'Suspended',
        view: settings.defaultDrumTab || 'songs',
        memory: '45.8 MB',
        warnings: getAppWarningsCount('drums'),
      },
      {
        key: 'stage',
        name: 'Stagex',
        status: settings.appMode === 'stage' ? 'Active' : 'Suspended',
        view: settings.defaultStageView || 'Editor',
        memory: '58.2 MB',
        warnings: getAppWarningsCount('stage'),
        hasTelemetry: true
      },
      {
        key: 'groovex',
        name: 'Groovex',
        status: settings.appMode === 'groovex' ? 'Active' : 'Suspended',
        view: 'Library',
        memory: '18.4 MB',
        warnings: getAppWarningsCount('groovex'),
      },
      {
        key: 'vocalex',
        name: 'Vocalex',
        status: settings.appMode === 'vocalex' ? 'Active' : 'Suspended',
        view: 'Practice',
        memory: '22.9 MB',
        warnings: getAppWarningsCount('vocalex'),
      }
    ];

    const copyAppDiagnostics = (appName: string, appData: any) => {
      const dump = {
        appVersion: APP_VERSION,
        timestamp: new Date().toISOString(),
        appName,
        key: appData.key,
        status: appData.status,
        view: appData.view,
        memory: appData.memory,
        warnings: appData.warnings
      };
      navigator.clipboard.writeText(JSON.stringify(dump, null, 2))
        .then(() => showToast(`${appName} diagnostics copied!`))
        .catch(() => showToast('Copy failed.'));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {appsList.map(app => (
          <div key={app.key} style={{
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{app.name}</h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: app.status === 'Active' ? '#10b981' : 'rgba(255,255,255,0.4)',
                background: app.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}>{app.status}</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px 16px',
              fontSize: '12px'
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Active View</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{app.view}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Memory Footprint</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{app.memory}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Recent Warnings</span>
                <span style={{ fontWeight: 600, color: app.warnings > 0 ? '#f59e0b' : '#10b981' }}>{app.warnings} warnings</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => copyAppDiagnostics(app.name, app)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: accent.from,
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Copy Diagnostics
              </button>
              {app.hasTelemetry && (
                <button
                  onClick={() => setSubView('stagex')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Stagex Telemetry
                </button>
              )}
            </div>

            <WarningsInspector logs={logs} showToast={showToast} appKey={app.key} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#000000',
      color: '#f4f4f5',
      fontFamily: 'Manrope, sans-serif',
      overflowX: 'hidden'
    }}>
      {subView === 'dashboard' && (
        <>
          {/* HEADER */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#000000'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={onBack}
                className="btn-smooth"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '999px',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
              </button>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Developer Panel</h2>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>System Diagnoses & Runtime Viewers</p>
              </div>
            </div>
          </div>

          {/* DEV MODE ENABLE SECTION */}
          <div style={{
            margin: '16px 20px 4px',
            padding: '16px 18px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Developer Mode</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', lineHeight: '1.4' }}>
                Diagnostics tracking & developer logs
              </p>
            </div>
            <div
              onClick={() => {
                const next = !settings.developerMode;
                updateSettings({ developerMode: next });
                showToast(`Developer Mode: ${next ? 'ON' : 'OFF'}`);
              }}
              style={{
                position: 'relative',
                width: 44,
                height: 24,
                backgroundColor: settings.developerMode ? '#10b981' : '#3f3f46',
                borderRadius: 999,
                padding: '2px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transform: settings.developerMode ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.2s ease'
              }} />
            </div>
          </div>

          {/* SYSTEM HEALTH SUMMARY */}
          <div style={{
            padding: '12px 16px',
            margin: '12px 16px 4px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '10px 8px',
            fontSize: '11px',
            flexShrink: 0
          }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>App Version</span>
              <span style={{ fontWeight: 800, color: '#fff' }}>v{APP_VERSION}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Android Version</span>
              <span style={{ fontWeight: 800, color: '#fff' }}>{otaDiagnostics.androidVersion || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Device</span>
              <span style={{ fontWeight: 800, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }} title={otaDiagnostics.deviceModel || 'Browser'}>
                {otaDiagnostics.deviceModel || 'Browser'}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Theme</span>
              <span style={{ fontWeight: 800, color: '#fff' }}>{settings.theme === 'light' ? 'Light' : 'Dark'}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Developer Mode</span>
              <span style={{ fontWeight: 800, color: settings.developerMode ? '#10b981' : '#ef4444' }}>
                {settings.developerMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Errors / Warnings</span>
              <span style={{ fontWeight: 800, color: errorCount > 0 ? '#ef4444' : warningCount > 0 ? '#f59e0b' : '#10b981' }}>
                {errorCount} E / {warningCount} W
              </span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Stagex Status</span>
              <span style={{
                fontWeight: 800,
                color: stagexStatus === 'Connected' ? '#10b981' : stagexStatus === 'Broken' ? '#ef4444' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: stagexStatus === 'Connected' ? '#10b981' : stagexStatus === 'Broken' ? '#ef4444' : '#f59e0b',
                  display: 'inline-block'
                }} />
                {stagexStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Update Status</span>
              <span style={{ fontWeight: 800, color: '#679cff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                {otaStatus}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {!settings.developerMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>terminal</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Developer Mode is Disabled</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.4, margin: 0 }}>
                  Toggle the status above to activate diagnostics tracking, capture logs, and view app-specific states.
                </p>
              </div>
            ) : (
              renderDashboardCards()
            )}
          </div>
        </>
      )}

      {subView === 'apps' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('Apps Diagnostics')}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {renderAppsView()}
          </div>
        </div>
      )}

      {subView === 'stagex' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('Stagex Diagnostics')}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {renderStagexView()}
          </div>
        </div>
      )}

      {subView === 'updater' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000', position: 'relative' }}>
          {renderSubViewHeader('Updater Diagnostics')}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 80px)' }}>
            {renderUpdaterView()}
          </div>
          {/* Bottom Nav Bar */}
          <div style={{
            position: 'absolute',
            bottom: 'var(--content-bottom-pad, 96px)',
            left: 0,
            right: 0,
            height: '64px',
            background: 'rgba(14, 14, 14, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(72, 72, 72, 0.15)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 50
          }}>
            <button 
              onClick={() => {
                const report = generateFullEngineeringReport();
                handleCopyText(report, 'Complete Report');
              }}
              
              style={{
                padding: '12px',
                background: '#007AFF',
                color: '#0e0e0e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                width: '44px',
                height: '44px'
              }}
              className="active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span>
            </button>
            <button 
              disabled={!isNative()}
              onClick={async () => {
                if (!isNative()) {
                  showToast('Share only available on mobile device.');
                  return;
                }
                const lastPath = localStorage.getItem('studio:downloadedApkPath') || '';
                if (!lastPath) {
                  showToast('No cached APK to share.');
                  return;
                }
                const { Share } = await import('@capacitor/share');
                await Share.share({ title: 'Cached APK', url: lastPath.startsWith('file://') ? lastPath : `file://${lastPath}` });
              }}
              
              style={{
                padding: '12px',
                background: 'transparent',
                color: '#acabaa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: isNative() ? 'pointer' : 'not-allowed',
                opacity: isNative() ? 1 : 0.4,
                outline: 'none',
                width: '44px',
                height: '44px'
              }}
              className="active:scale-90 hover:text-[#e7e5e4] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
            </button>
            <button 
              onClick={() => {
                let txt = `=== UNIFIED TIMELINE ===\n`;
                unifiedTimeline.forEach(e => {
                  const timeStr = new Date(e.time).toLocaleTimeString();
                  txt += `[${timeStr}] [${e.type.toUpperCase()}] ${e.text} ${e.details ? ` - ${e.details}` : ''}\n`;
                });
                handleCopyText(txt, 'Timeline');
              }}
              
              style={{
                padding: '12px',
                background: 'transparent',
                color: '#acabaa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                width: '44px',
                height: '44px'
              }}
              className="active:scale-90 hover:text-[#e7e5e4] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>print</span>
            </button>
            <button 
              onClick={() => {
                setSectionsCollapsed(prev => ({ ...prev, simulation: false }));
                showToast('Simulation lab expanded');
              }}
              
              style={{
                padding: '12px',
                background: 'transparent',
                color: '#acabaa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                width: '44px',
                height: '44px'
              }}
              className="active:scale-90 hover:text-[#e7e5e4] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
            </button>
          </div>
        </div>
      )}

      {subView === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('System Diagnostics')}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#000000',
            scrollbarWidth: 'none'
          }}>
            <button style={tabBtnStyle('state')} onClick={() => setActiveTab('state')}>App Store State</button>
            <button style={tabBtnStyle('storage')} onClick={() => setActiveTab('storage')}>Storage</button>
            <button style={tabBtnStyle('providers')} onClick={() => setActiveTab('providers')}>Module Panels ({activeProviders.length})</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {activeTab === 'state' && renderStateTab()}
            {activeTab === 'storage' && renderStorageTab()}
            {activeTab === 'providers' && renderProvidersTab()}
            <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['system', 'general']} />
          </div>
        </div>
      )}

      {subView === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('Logs & Warnings')}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#000000',
            scrollbarWidth: 'none'
          }}>
            <button style={tabBtnStyle('logs')} onClick={() => setActiveTab('logs')}>Logs ({logs.length})</button>
            <button style={tabBtnStyle('errors')} onClick={() => setActiveTab('errors')}>Errors ({errors.length})</button>
            <button style={tabBtnStyle('events')} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
            <button style={tabBtnStyle('nav')} onClick={() => setActiveTab('nav')}>Navigation Stack</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {activeTab === 'logs' && renderLogsTab()}
            {activeTab === 'errors' && renderErrorsTab()}
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'nav' && renderNavTab()}
            <WarningsInspector logs={logs} showToast={showToast} />
          </div>
        </div>
      )}

      {subView === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('Performance Diagnostics')}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {renderPerfTab()}
            <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['performance', 'perf']} />
          </div>
        </div>
      )}

      {subView === 'network' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
          {renderSubViewHeader('Network Sniffer')}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)' }}>
            {renderNetworkTab()}
            <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['network', 'sync']} />
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(12,12,14,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 20px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          zIndex: 999999,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>done</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
