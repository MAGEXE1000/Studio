import CopyButton from './CopyButton';
import CopyDropdown from './CopyDropdown';
import {
  BouncyAccordion,
  type BouncyAccordionItem,
} from '../../../components/motion/bouncy-accordion';
import { Capacitor } from '@capacitor/core';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  compressReportText,
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
  getStagexDiagnostics,
  resetStagexDiagnostics,
  updateDiagnostics,
  updateDebugLogs,
  getStageIframe,
  getNavigationEntries,
  clearNavigationEntries,
  NavigationEntry,
  triggerSimulatedStatus,
  addJsLog,
  jsLogs,
  nativeLogs,
  stateTimeline,
  activityLifecycleTimeline,
  recordActivityLifecycle,
  simulateStatusCallback,
  globalUpdateState,
  resetAppUpdateState,
  resetUpdateDiagnostics,
  getTimelineReport,
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
  useIsWebDesktop,
  useNavigationStore,
  useScrollHide,
  NavigationDispatcher,
  useBackHandler,
  PerformanceProfiler,
  type ProfilerMetrics,
  type PerformanceWarning,
  useSettingsStore,
  useSessionStore,
} from '@workspace/studio-core';

import { decodeReactError } from '../../../shared/feedback/ErrorBoundary';
import {
  SettingsScaffold,
  SettingsContentContainer,
} from '../../../shared/layout/StudioLayoutSystem';
import UpdaterDiagnosticsPage from '../../updater/diagnostics/UpdaterDiagnosticsPage';
import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';
import MotionPlaygroundView from './MotionPlaygroundView';
import { DeveloperInspectorPanel } from '../inspector/DeveloperInspectorPanel';
import { Toggle as StudioToggle } from '../../../shared/design-system/StudioToggle';

interface Props {
  accent: { from: string; mid?: string; to: string };
  onBack: () => void;
  hideHeader?: boolean;
}

type TabId =
  | 'inspector'
  | 'logs'
  | 'errors'
  | 'events'
  | 'perf'
  | 'state'
  | 'network'
  | 'storage'
  | 'providers';

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

interface AccordionSectionProps {
  title: string;
  icon: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection = ({
  title,
  icon,
  collapsed,
  onToggle,
  children,
}: AccordionSectionProps) => {
  const item: BouncyAccordionItem = {
    id: 'section',
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="material-symbols-outlined"
          style={{ color: collapsed ? 'var(--c-text-secondary)' : '#007aff', fontSize: 20 }}
        >
          {icon}
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--c-text-primary)',
            fontFamily: 'Manrope',
          }}
        >
          {title}
        </span>
      </div>
    ),
    description: (
      <div
        style={{
          padding: '0 4px 16px 4px',
          paddingTop: '12px',
        }}
      >
        {children}
      </div>
    ),
  };

  return (
    <BouncyAccordion
      items={[item]}
      value={!collapsed ? 'section' : null}
      onValueChange={() => onToggle()}
    />
  );
};

interface WarningsInspectorProps {
  logs: any[];
  showToast: (msg: string) => void;
  moduleFilter?: string[];
  appKey?: string;
}

const WarningsInspector = ({ logs, showToast, moduleFilter, appKey }: WarningsInspectorProps) => {
  const [showWarnings, setShowWarnings] = useState(false);

  const appWarnings = useMemo(() => {
    return logs.filter((l) => {
      if (l.level !== 'warn') return false;
      const mod = l.module.toLowerCase();

      if (appKey) {
        if (appKey === 'chordex') return mod === 'chordex';
        if (appKey === 'drumex') return mod === 'drumex' || mod === 'drums';
        if (appKey === 'stagex') return mod === 'stagex' || mod === 'stage';
        if (appKey === 'groovex') return mod === 'groovex';
        if (appKey === 'vocalex') return mod === 'vocalex';
        if (appKey === 'hub') {
          return ![
            'chordex',
            'drumex',
            'drums',
            'stagex',
            'stage',
            'groovex',
            'vocalex',
            'network',
            'firestore',
            'sync',
          ].includes(mod);
        }
        return false;
      }

      if (moduleFilter) {
        return moduleFilter.some((m) => m.toLowerCase() === mod);
      }

      return true;
    });
  }, [logs, moduleFilter, appKey]);

  const groupedWarnings = useMemo<WarningItem[]>(() => {
    const groups: WarningItem[] = [];

    appWarnings.forEach((w) => {
      const existing = groups.find((g) => g.message === w.message && g.module === w.module);
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
          duplicateCount: 1,
        });
      }
    });

    return groups;
  }, [appWarnings]);

  if (appWarnings.length === 0) {
    return null;
  }

  const handleCopyWarning = (w: WarningItem) => {
    navigator.clipboard
      .writeText(`[${w.module}] [${w.source}] ${w.message}`)
      .then(() => showToast('Warning copied!'))
      .catch(() => showToast('Copy failed.'));
  };

  const handleCopyAll = () => {
    const text = appWarnings
      .map(
        (w) =>
          `[${new Date(w.timestamp).toISOString()}] [${w.module}] [${w.level.toUpperCase()}] [${w.source || 'unknown'}] ${w.message}`
      )
      .join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('All warnings copied!'))
      .catch(() => showToast('Copy failed.'));
  };

  return (
    <div
      style={{
        marginTop: 12,
        background: 'rgba(245, 158, 11, 0.03)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 18 }}>
            warning
          </span>
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
            cursor: 'pointer',
          }}
        >
          {showWarnings ? 'Hide Warnings' : 'View Warnings'}
        </button>
      </div>

      {showWarnings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CopyButton
              getTextToCopy={() =>
                appWarnings
                  .map(
                    (w) =>
                      `[${new Date(w.timestamp).toISOString()}] [${w.module}] [${w.level.toUpperCase()}] [${w.source || 'unknown'}] ${w.message}`
                  )
                  .join('\n')
              }
              label="Copy All Warnings"
              copiedLabel="Copied All Warnings!"
              size="sm"
            />
          </div>

          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 4,
            }}
          >
            {groupedWarnings.map((w, idx) => (
              <div
                key={w.id || idx}
                style={{
                  padding: '8px 10px',
                  background: 'var(--app-surface-low, var(--app-surface))',
                  borderRadius: '8px',
                  border: '1px solid var(--c-border)',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '9px',
                      }}
                    >
                      {w.severity.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--c-text-secondary)', fontWeight: 600 }}>
                      Module: {w.module}
                    </span>
                    <span
                      style={{ color: 'var(--c-text-secondary)', opacity: 0.8, fontWeight: 500 }}
                    >
                      Source: {w.source}
                    </span>
                    {w.duplicateCount > 1 && (
                      <span
                        style={{
                          background: 'var(--app-surface-high)',
                          color: 'var(--c-text-primary)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '9px',
                        }}
                      >
                        ×{w.duplicateCount}
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--c-text-secondary)', opacity: 0.8, fontSize: '9px' }}>
                    {new Date(w.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div
                  style={{
                    color: '#f59e0b',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    marginTop: 2,
                  }}
                >
                  {w.title}
                </div>

                <div
                  style={{
                    color: 'var(--c-text-primary)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.3,
                    fontFamily: 'monospace',
                    marginTop: 2,
                  }}
                >
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
                      background: 'var(--app-surface-high, var(--app-surface))',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text-secondary)',
                      fontSize: '9px',
                      fontWeight: 600,
                      cursor: 'pointer',
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

export default function DevToolsDashboard({ accent, onBack, hideHeader }: Props) {
  const settings = useSettingsStore((state) => state.settings);

  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  useScrollHide(mainScrollRef);
  const chordsRoute = useNavigationStore((s) => s.history.find((r) => r.app === 'chordex'));
  const activePanel = chordsRoute?.page || 'library';
  const isWebDesktop = useIsWebDesktop();
  const currentRoute = useNavigationStore((s) => s.history[s.history.length - 1]) || { app: 'hub' };
  const currentApp = currentRoute?.app ?? 'hub';
  const subView = useMemo(() => {
    if (
      currentRoute.app === 'hub' &&
      currentRoute.tab === 'settings' &&
      currentRoute.page === 'developer'
    ) {
      return (currentRoute.subView as any) || 'dashboard';
    }
    return 'dashboard';
  }, [currentRoute]);

  const setSubView = useCallback((newSubView: string) => {
    if (newSubView === 'dashboard') {
      const current = useNavigationStore.getState().history;
      if (current.length > 1) {
        NavigationDispatcher.pop();
        return;
      }
    }
    NavigationDispatcher.push({
      app: 'hub',
      tab: 'settings',
      page: 'developer',
      subView: newSubView,
    });
  }, []);

  const getSubViewTitle = () => {
    switch (subView) {
      case 'dashboard':
        return 'Developer Options';
      case 'apps':
        return 'Apps Diagnostics';
      case 'stagex':
        return 'Stagex Diagnostics';
      case 'updater_diagnostics':
        return 'Updater Diagnostics';
      case 'system':
        return 'System Diagnostics';
      case 'logs':
        return 'Logs';
      case 'performance':
        return 'Performance Diagnostics';
      case 'network':
        return 'Network Sniffer';
      default:
        return 'Developer Options';
    }
  };

  const handleSubViewBack = useCallback(() => {
    if (subView === 'dashboard') {
      onBack();
    } else {
      NavigationDispatcher.pop();
    }
  }, [subView, onBack]);

  // Centralised Back Handler Integration for every Diagnostics page
  useBackHandler(
    'modal',
    () => {
      if (subView !== 'dashboard') {
        handleSubViewBack();
        return true;
      }
      return false;
    },
    [subView, handleSubViewBack]
  );

  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const [perfMetrics, setPerfMetrics] = useState<ProfilerMetrics | null>(null);
  const [chartBars, setChartBars] = useState<number[]>(new Array(20).fill(60));

  useEffect(() => {
    if (subView !== 'performance') return;

    const profiler = PerformanceProfiler.getInstance();
    const unsubscribe = profiler.subscribe((metrics) => {
      setPerfMetrics(metrics);
      setChartBars((prev) => {
        const next = [...prev.slice(1)];
        next.push(metrics.currentFps);
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subView]);

  const [activeTab, setActiveTab] = useState<TabId>('logs');
  const lastAppRef = useRef<string>('Livex Hub');
  const [versionUpdates, setVersionUpdates] = useState(0);

  const [expandedLogIndices, setExpandedLogIndices] = useState<Record<number, boolean>>({});
  const [updaterTabMode, setUpdaterTabMode] = useState<'laboratory' | 'diagnostics'>('laboratory');

  const [diagExceptionCollapsed, setDiagExceptionCollapsed] = useState(true);
  const [stateHistoryCollapsed, setStateHistoryCollapsed] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterMode, setLogFilterMode] = useState<
    | 'all'
    | 'js'
    | 'native'
    | 'state'
    | 'errors'
    | 'warnings'
    | 'pkg_installer'
    | 'lifecycle'
    | 'state_machine'
  >('all');
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    status: false,
    actions: false,
    logs: false,
    diagnostics: false,
    simulation: true,
    stateMachine: false,
    report: true,
  });
  const [buttonStates, setButtonStates] = useState<
    Record<string, 'idle' | 'running' | 'success' | 'failure'>
  >({});
  // consoleEndRef removed to prevent WebView viewport shifting

  const [nativeInstallerDetails, setNativeInstallerDetails] = useState<any>(null);
  const [nativeDeviceInfo, setNativeDeviceInfo] = useState<any>(null);
  const [localApkDetails, setLocalApkDetails] = useState<any>(null);
  const [nativeLogsList, setNativeLogsList] = useState<any[]>([]);
  const [simUpdateCount, setSimUpdateCount] = useState(0);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [auditResults, setAuditResults] = useState<
    Array<{ name: string; status: 'success' | 'failed'; message: string }>
  >([]);
  const triggerSimRender = () => setSimUpdateCount((prev) => prev + 1);

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
      if (Capacitor.isNativePlatform() && typeof AppInstaller !== 'undefined') {
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
            } catch (e) {}
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
          } catch (err) {}
        } else {
          if (isMountedRef.current) setLocalApkDetails(null);
        }
      }
      triggerSimRender();
    } catch (err) {}
  };

  useEffect(() => {
    if (subView === 'dashboard') return;

    refreshData();
    const timer = setInterval(refreshData, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [subView]);

  const [selfTestRunning, setSelfTestRunning] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<
    Array<{
      command: string;
      arg?: any;
      status: 'pending' | 'success' | 'nack_missing' | 'nack_error' | 'timeout';
      latency?: number;
      error?: string;
    }>
  >([]);

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
      { command: 'openPresetsPanel' },
    ];

    const results: typeof selfTestResults = tests.map((t) => ({
      command: t.command,
      arg: t.arg,
      status: 'pending',
    }));
    setSelfTestResults(results);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const startTime = performance.now();
      const msgId = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

      const runSingleTest = () => {
        return new Promise<{ status: (typeof results)[0]['status']; error?: string }>((resolve) => {
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
                error: data.error || 'NACK received',
              });
            }
          };

          window.addEventListener('message', listener);

          const timer = setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve({ status: 'timeout', error: 'No response (timeout after 1500ms)' });
          }, 1500);

          try {
            iframe.contentWindow!.postMessage(
              {
                type: 'sc-call',
                fn: test.command,
                arg: test.arg,
                msgId,
              },
              '*'
            );
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
        error: outcome.error,
      };
      setSelfTestResults([...results]);

      // Delay slightly between commands to let state settle
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      setVersionUpdates((v) => v + 1);
    });
  }, []);

  const logs = useMemo(() => getLogs(), [versionUpdates, simUpdateCount]);
  const errors = useMemo(() => getErrors(), [versionUpdates, simUpdateCount]);
  const events = useMemo(() => getEvents(), [versionUpdates, simUpdateCount]);
  const network = useMemo(() => getNetworkRequests(), [versionUpdates, simUpdateCount]);
  const perf = useMemo(() => getPerfStats(), [versionUpdates, simUpdateCount]);
  const activeProviders = useMemo(() => getDebugProviders(), [versionUpdates, simUpdateCount]);
  const stagex = useMemo(() => getStagexDiagnostics(), [versionUpdates, simUpdateCount]);

  const errorCount = errors.length + logs.filter((l) => l.level === 'error').length;
  const warningCount = logs.filter((l) => l.level === 'warn').length;

  const stagexStatus = useMemo(() => {
    if (!stagex.iframeMounted) return 'Not Mounted';
    if (stagex.handlerFailed || stagex.handlerMissing || stagex.timeoutCount > 5) return 'Broken';
    if (stagex.stageCoreReadyReceived && stagex.iframeListenerInstalled) return 'Connected';
    return 'Initializing';
  }, [stagex]);

  const otaStatus = updateDebugLogs.updateDecision || 'Idle';

  useEffect(() => {
    if (currentApp !== 'hub' && currentApp !== lastAppRef.current) {
      lastAppRef.current = currentApp;
    }
  }, [currentApp]);

  // Extract unique module list from logs
  const logModules = useMemo(() => {
    const modules = new Set<string>();
    logs.forEach((l) => {
      if (l.module) modules.add(l.module);
    });
    return Array.from(modules);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchLevel = logLevelFilter === 'all' || l.level === logLevelFilter;
      const matchModule =
        logModuleFilter === 'all' || l.module.toLowerCase() === logModuleFilter.toLowerCase();
      return matchLevel && matchModule;
    });
  }, [logs, logLevelFilter, logModuleFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      return (
        eventModuleFilter === 'all' || e.module.toLowerCase() === eventModuleFilter.toLowerCase()
      );
    });
  }, [events, eventModuleFilter]);

  const getUnifiedTimeline = () => {
    const list: Array<{
      time: number;
      type: 'js' | 'native' | 'state';
      text: string;
      details?: string;
    }> = [];

    getLogs().forEach((log) => {
      list.push({ time: log.timestamp, type: 'js', text: log.message });
    });

    nativeLogsList.forEach((log) => {
      const time = log.timestamp || Date.now();
      list.push({
        time,
        type: 'native',
        text: log.stage || 'Native Step',
        details: `${log.message || ''} ${log.explanation || ''}`,
      });
    });

    stateTimeline.forEach((t) => {
      list.push({
        time: t.timestamp,
        type: 'state',
        text: `State Transition: ${t.state}`,
        details: `Reason: ${t.reason}`,
      });
    });
    list.sort((a, b) => a.time - b.time);
    return list;
  };

  const unifiedTimeline = useMemo(
    () => getUnifiedTimeline(),
    [nativeLogsList, versionUpdates, simUpdateCount, logs]
  );

  const filteredTimeline = useMemo(() => {
    let list = unifiedTimeline;

    if (logFilterMode === 'js') {
      list = list.filter((e) => e.type === 'js');
    } else if (logFilterMode === 'native') {
      list = list.filter((e) => e.type === 'native');
    } else if (logFilterMode === 'state') {
      list = list.filter((e) => e.type === 'state');
    } else if (logFilterMode === 'errors') {
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes('error') ||
          e.text.toLowerCase().includes('fail') ||
          (e.details &&
            (e.details.toLowerCase().includes('error') || e.details.toLowerCase().includes('fail')))
      );
    } else if (logFilterMode === 'warnings') {
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes('warn') ||
          (e.details && e.details.toLowerCase().includes('warn'))
      );
    } else if (logFilterMode === 'pkg_installer') {
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes('packageinstaller') ||
          e.type === 'native' ||
          (e.details && e.details.toLowerCase().includes('packageinstaller'))
      );
    } else if (logFilterMode === 'lifecycle') {
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes('lifecycle') ||
          e.text.toLowerCase().includes('activity') ||
          e.text.toLowerCase().includes('pause') ||
          e.text.toLowerCase().includes('resume')
      );
    } else if (logFilterMode === 'state_machine') {
      list = list.filter((e) => e.type === 'state' || e.text.toLowerCase().includes('transition'));
    }

    if (logSearchQuery.trim() !== '') {
      const query = logSearchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes(query) ||
          (e.details && e.details.toLowerCase().includes(query))
      );
    }

    return list;
  }, [unifiedTimeline, logFilterMode, logSearchQuery]);

  // Obsolete diagnostics methods removed
  // Collapsible views state
  const [updaterCollapsed, setUpdaterCollapsed] = useState({
    device: false,
    decision: false,
    updater: false,
    errors: false,
  });

  const [stagexCollapsed, setStagexCollapsed] = useState({
    connection: false,
    counters: false,
    trace: false,
    security: false,
    failures: false,
  });

  // Reusable Phone-Responsive Diagnostics Components
  const CollapsibleSection = ({
    title,
    collapsed,
    onToggle,
    children,
  }: {
    title: string;
    collapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div
      style={{
        background: 'var(--app-surface-high, var(--app-surface))',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
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
          background: 'transparent',
          border: 'none',
          color: 'var(--c-text-primary)',
          fontFamily: 'Manrope',
          fontWeight: 800,
          fontSize: '13px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          expand_more
        </span>
      </button>
      {!collapsed && (
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--c-border)',
            background: 'var(--app-surface-low, var(--app-surface))',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );

  const DiagnosticField = ({
    label,
    value,
    isCode,
  }: {
    label: string;
    value: string | null;
    isCode?: boolean;
  }) => (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'block',
          fontFamily: 'Manrope',
          fontWeight: 700,
          fontSize: 10,
          color: 'var(--c-text-secondary)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <div
        style={{
          fontFamily: isCode ? 'monospace' : 'Inter',
          fontSize: isCode ? 11 : 13,
          lineHeight: 1.4,
          color: 'var(--c-text-primary)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          background: isCode ? 'var(--app-surface-bright, var(--app-surface))' : 'transparent',
          border: isCode ? '1px solid var(--c-border)' : 'none',
          padding: isCode ? '6px 10px' : 0,
          borderRadius: isCode ? 6 : 0,
          maxHeight: isCode ? 120 : 'none',
          overflowY: isCode ? 'auto' : 'visible',
        }}
      >
        {value || 'N/A'}
      </div>
    </div>
  );

  // Render Inline Updater Diagnostics & Laboratory View
  const renderUpdaterView = () => {
    return null;
  };
  const renderStagexView = () => {
    return (
      <SettingsContentContainer
        style={{
          gap: 4,
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
            Stagex ACK Telemetry
          </span>
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
              cursor: 'pointer',
            }}
          >
            Reset Stats
          </button>
        </div>

        {/* ROOT CAUSE DETECTION */}
        {(stagex.missingHandlers?.length > 0 ||
          stagex.handlerFailed ||
          stagex.timeoutCount > 0 ||
          !stagex.iframeMounted ||
          stagex.lastError !== 'none') && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#ef4444',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                warning
              </span>
              Root Cause Diagnostics Alert
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 11,
                color: '#fca5a5',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {!stagex.iframeMounted && (
                <li>
                  <strong>Bridge Failure:</strong> Stagex IFrame is not mounted in the DOM.
                </li>
              )}
              {stagex.iframeMounted && !stagex.stageCoreReadyReceived && (
                <li>
                  <strong>Bridge Failure:</strong> IFrame loaded, but stage-core ready message was
                  never received.
                </li>
              )}
              {stagex.missingHandlers?.length > 0 && (
                <li>
                  <strong>Missing Handlers:</strong> Parent called functions not exported to window:{' '}
                  <code
                    style={{
                      background: 'var(--app-surface-bright, var(--app-surface))',
                      padding: '2px 4px',
                      borderRadius: 4,
                    }}
                  >
                    {stagex.missingHandlers.join(', ')}
                  </code>
                </li>
              )}
              {stagex.handlerFailed && (
                <li>
                  <strong>Handler Exception:</strong> Runtime exception raised during command
                  execution. Check error trace below.
                </li>
              )}
              {stagex.timeoutCount > 0 && (
                <li>
                  <strong>ACK Failure:</strong> {stagex.timeoutCount} commands timed out without
                  receiving an ACK/NACK.
                </li>
              )}
              {stagex.lastError !== 'none' && stagex.lastError !== 'N/A' && (
                <li>
                  <strong>Last Exception:</strong>{' '}
                  <code
                    style={{
                      display: 'block',
                      margin: '4px 0 0',
                      padding: '6px',
                      background: 'var(--app-surface-bright, var(--app-surface))',
                      border: '1px solid var(--c-border)',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                      fontSize: 10,
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {stagex.lastError}
                  </code>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* SELF TEST SECTION */}
        <div
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            border: '1px solid var(--c-border)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'block',
                  color: 'var(--c-text-primary)',
                }}
              >
                Stagex Bridge Self-Test
              </span>
              <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>
                Verifies each runtime command executes & returns ACK/NACK
              </span>
            </div>
            <button
              onClick={runSelfTest}
              disabled={selfTestRunning}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: selfTestRunning
                  ? 'var(--app-surface)'
                  : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                border: 'none',
                color: selfTestRunning ? 'var(--c-text-secondary)' : '#fff',
                fontWeight: 700,
                fontSize: '11px',
                cursor: selfTestRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {selfTestRunning ? 'Running...' : 'Run Self-Test'}
            </button>
          </div>

          {selfTestResults.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: 'var(--app-surface-low, var(--app-surface))',
                border: '1px solid var(--c-border)',
                padding: 10,
                borderRadius: 8,
              }}
            >
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
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 11,
                      padding: '4px 0',
                      borderBottom:
                        i < selfTestResults.length - 1 ? '1px solid var(--c-border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, color: statusColor }}
                      >
                        {statusIcon}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--c-text-primary)',
                        }}
                      >
                        {res.command}({res.arg ? `'${res.arg}'` : ''})
                      </span>
                    </div>
                    <span style={{ color: statusColor, fontWeight: 800, fontSize: 10 }}>
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CollapsibleSection
          title="IFrame Connection Status"
          collapsed={stagexCollapsed.connection}
          onToggle={() => setStagexCollapsed((prev) => ({ ...prev, connection: !prev.connection }))}
        >
          <DiagnosticField label="IFrame Mounted" value={stagex.iframeMounted ? 'YES' : 'NO'} />
          <DiagnosticField label="IFrame URL / Src" value={stagex.iframeSrc} />
          <DiagnosticField label="Load Event Fired" value={stagex.iframeLoadFired ? 'YES' : 'NO'} />
          <DiagnosticField
            label="contentWindow Available"
            value={stagex.contentWindowAvailable ? 'YES' : 'NO'}
          />
          <DiagnosticField
            label="stage-core Ready Event Received"
            value={stagex.stageCoreReadyReceived ? 'YES' : 'NO'}
          />
          <DiagnosticField
            label="Wrapper Listener Bound"
            value={stagex.wrapperListenerRegistered ? 'YES' : 'NO'}
          />
          <DiagnosticField
            label="IFrame Listener Installed"
            value={stagex.iframeListenerInstalled ? 'YES' : 'NO'}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Bridge Telemetry Counters"
          collapsed={stagexCollapsed.counters}
          onToggle={() => setStagexCollapsed((prev) => ({ ...prev, counters: !prev.counters }))}
        >
          <DiagnosticField label="Messages Sent Count" value={String(stagex.messagesSent)} />
          <DiagnosticField
            label="Messages Received Count"
            value={String(stagex.messagesReceived)}
          />
          <DiagnosticField label="ACK Count" value={String(stagex.ackCount)} />
          <DiagnosticField label="NACK Count" value={String(stagex.nackCount || 0)} />
          <DiagnosticField label="Timeout Count" value={String(stagex.timeoutCount)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Command Registry Details"
          collapsed={stagexCollapsed.trace}
          onToggle={() => setStagexCollapsed((prev) => ({ ...prev, trace: !prev.trace }))}
        >
          <DiagnosticField
            label="Available Handlers"
            value={(stagex.availableHandlers || []).join(', ')}
          />
          <DiagnosticField
            label="Missing Handlers"
            value={(stagex.missingHandlers || []).join(', ') || 'none'}
          />
          <DiagnosticField
            label="Registry Keys"
            value="switchView, toggleSCDial, toggleGigMode, stageGoBack, openPresetsPanel, exportPDFWithOptions"
          />
          <DiagnosticField label="Last Command Sent" value={stagex.lastCommandSent} />
          <DiagnosticField label="Last Message ID" value={stagex.lastMsgId} />
          <DiagnosticField label="Last ACK Received Timestamp" value={stagex.lastAckReceived} />
          <DiagnosticField label="Last NACK Command" value={stagex.lastNack || 'none'} />
          <DiagnosticField label="Last Timeout Command" value={stagex.lastTimeout} />
          <DiagnosticField
            label="Last Missing Handler"
            value={stagex.lastMissingHandler || 'none'}
          />
          <DiagnosticField label="Last Failed Handler" value={stagex.lastFailedHandler || 'none'} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Security & Origin Check"
          collapsed={stagexCollapsed.security}
          onToggle={() => setStagexCollapsed((prev) => ({ ...prev, security: !prev.security }))}
        >
          <DiagnosticField label="Current Origin" value={stagex.currentOrigin} />
          <DiagnosticField label="Expected Origin" value={stagex.expectedOrigin} />
          <DiagnosticField label="Actual Event Origin" value={stagex.actualEventOrigin} />
          <DiagnosticField
            label="Command Sent with Wildcard targetOrigin"
            value={stagex.sentWithTargetOriginWildcard ? 'YES' : 'NO'}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Execution Failures & Errors"
          collapsed={stagexCollapsed.failures}
          onToggle={() => setStagexCollapsed((prev) => ({ ...prev, failures: !prev.failures }))}
        >
          <DiagnosticField
            label="Origin Rejected"
            value={stagex.originRejected ? 'YES (Origins mismatched!)' : 'NO'}
          />
          <DiagnosticField
            label="Handler Missing (IFrame)"
            value={stagex.handlerMissing ? 'YES (Target function not exported on window)' : 'NO'}
          />
          <DiagnosticField
            label="Handler Execution Failed"
            value={stagex.handlerFailed ? 'YES (Exceptions raised during run)' : 'NO'}
          />
          <DiagnosticField label="Last Exception Trace" value={stagex.lastError} />
        </CollapsibleSection>
      </SettingsContentContainer>
    );
  };

  // UI styles
  const tabBtnStyle = (tab: TabId) => ({
    padding: '8px 14px',
    borderRadius: '12px',
    background: activeTab === tab ? accent.from : 'var(--app-surface-high, var(--app-surface))',
    border: activeTab === tab ? 'none' : '1px solid var(--c-border)',
    color: activeTab === tab ? '#fff' : 'var(--c-text-secondary)',
    fontFamily: 'Manrope',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
  });

  const copyToClipboard = (title: string, data: any) => {
    const content =
      `### ${title}\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `App Version: ${APP_VERSION}\n\n` +
      `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

    navigator.clipboard
      .writeText(content)
      .then(() => showToast(`${title} copied!`))
      .catch(() => showToast('Copy failed.'));
  };

  // Copy Module Diagnostics (Copy Everything)

  const handleCopyModuleDiagnostics = (module: string) => {
    const dump: any = {
      appVersion: APP_VERSION,
      timestamp: new Date().toISOString(),
      module,
    };

    switch (module) {
      case 'Apps':
        dump.apps = {
          hub: {
            status: currentApp === 'hub' ? 'Active' : 'Suspended',
            activeView: activePanel,
            warnings: logs.filter(
              (l) => l.level === 'warn' && (l.module === 'Hub' || l.module === 'general')
            ).length,
          },
          chordex: {
            status: currentApp === 'chordex' ? 'Active' : 'Suspended',
            activeView: activePanel,
            warnings: logs.filter((l) => l.level === 'warn' && l.module.toLowerCase() === 'chordex')
              .length,
          },
          drumex: {
            status: currentApp === 'drumex' ? 'Active' : 'Suspended',
            activeView: settings.defaultDrumTab,
            warnings: logs.filter(
              (l) =>
                l.level === 'warn' &&
                (l.module.toLowerCase() === 'drumex' || l.module.toLowerCase() === 'drums')
            ).length,
          },
          stagex: {
            status: currentApp === 'stagex' ? 'Active' : 'Suspended',
            activeView: settings.defaultStageView,
            warnings: logs.filter(
              (l) =>
                l.level === 'warn' &&
                (l.module.toLowerCase() === 'stagex' || l.module.toLowerCase() === 'stage')
            ).length,
            telemetry: stagex,
          },
          groovex: {
            status: currentApp === 'groovex' ? 'Active' : 'Suspended',
            activeView: 'library',
            warnings: logs.filter((l) => l.level === 'warn' && l.module.toLowerCase() === 'groovex')
              .length,
          },
          vocalex: {
            status: currentApp === 'vocalex' ? 'Active' : 'Suspended',
            activeView: 'practice',
            warnings: logs.filter((l) => l.level === 'warn' && l.module.toLowerCase() === 'vocalex')
              .length,
          },
        };
        break;
      case 'Stagex':
        dump.stagexDiagnostics = stagex;
        dump.selfTestResults = selfTestResults;
        break;
      case 'Updater':
        dump.updateDiagnostics = updateDiagnostics;
        dump.updateDebugLogs = updateDebugLogs;
        break;
      case 'System':
        dump.device = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isNative: Capacitor.isNativePlatform(),
          androidVersion: updateDiagnostics.androidVersion || 'N/A',
          deviceModel: updateDiagnostics.deviceModel || 'Browser',
        };
        dump.settings = {
          activeModule: currentApp,
          activeTheme: settings.theme,
          language: settings.language,
          syncAcrossDevices: settings.syncAcrossDevices,
        };
        // LocalStorage (masked)
        {
          const storageDump: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const val = localStorage.getItem(key) || '';
              storageDump[key] = maskSensitiveValue(key, val);
            }
          }
          dump.localStorage = storageDump;
        }
        // Module debug panels state
        dump.modulePanels = activeProviders.map((prov) => ({
          id: prov.id,
          name: prov.name,
          debugState: typeof prov.getDebugState === 'function' ? prov.getDebugState() : null,
        }));
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

    const content =
      `### ${module} Diagnostics Report\n` +
      `Generated: ${new Date().toISOString()}\n` +
      `App Version: ${APP_VERSION}\n\n` +
      `\`\`\`json\n${JSON.stringify(dump, null, 2)}\n\`\`\``;

    navigator.clipboard
      .writeText(content)
      .then(() => showToast(`${module} report copied!`))
      .catch(() => showToast('Copy failed.'));
  };

  // WarningsInspector moved to file-level

  // Unified Diagnostics Generators for Copy Buttons
  const buildCopyEverythingReport = () => {
    const timestamp = new Date().toISOString();
    let text = `====================================================\n`;
    text += `STUDIO DEVELOPER DIAGNOSTICS REPORT\n`;
    text += `Generated: ${timestamp}\n`;
    text += `App Version: v${APP_VERSION}\n`;
    text += `====================================================\n\n`;

    text += `========================\nLogs (${logs.length})\n========================\n`;
    if (logs.length > 0) {
      logs.forEach((l) => {
        text += `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.module}] ${l.message}\n`;
      });
    } else {
      text += `No log entries recorded.\n`;
    }
    text += `\n`;

    const warnings = logs.filter((l) => l.level === 'warn');
    text += `========================\nWarnings (${warnings.length})\n========================\n`;
    if (warnings.length > 0) {
      warnings.forEach((l) => {
        text += `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.module}] ${l.message}\n`;
      });
    } else {
      text += `No warnings recorded.\n`;
    }
    text += `\n`;

    text += `========================\nErrors (${errors.length})\n========================\n`;
    if (errors.length > 0) {
      errors.forEach((e) => {
        text += `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.module}] ${e.message}\n`;
        if (e.stack) text += `Stack: ${e.stack}\n`;
      });
    } else {
      text += `No errors recorded.\n`;
    }
    text += `\n`;

    text += `========================\nEvents (${events.length})\n========================\n`;
    if (events.length > 0) {
      events.forEach((evt) => {
        text += `[${new Date(evt.timestamp).toLocaleTimeString()}] [${evt.module}] ${evt.type} on <${evt.target}>\n`;
      });
    } else {
      text += `No user events recorded.\n`;
    }
    text += `\n`;

    text += `========================\nSystem & Environment\n========================\n`;
    text += `User Agent: ${navigator.userAgent}\n`;
    text += `Platform: ${navigator.platform}\n`;
    text += `Screen: ${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x DPR)\n`;
    text += `Viewport: ${window.innerWidth}x${window.innerHeight}\n\n`;

    text += `========================\nPerformance Metrics\n========================\n`;
    if (perf.size > 0) {
      perf.forEach((v, k) => {
        text += `${k}: ${v.renders} renders, ${v.mounts} mounts, last render ${v.lastRenderTime}ms\n`;
      });
    } else {
      text += `No performance profiler stats recorded.\n`;
    }

    return compressReportText(text);
  };

  const buildCopySectionReport = () => {
    let title = 'Logs';
    let text = '';
    if (activeTab === 'logs') {
      title = `Logs (${logLevelFilter})`;
      text = filteredLogs
        .map(
          (l) =>
            `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.module}] ${l.message}`
        )
        .join('\n');
    } else if (activeTab === 'errors') {
      title = 'Errors';
      text = errors
        .map(
          (e) =>
            `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.module}] (x${e.count || 1}) ${e.message}\n${e.stack || ''}`
        )
        .join('\n');
    } else if (activeTab === 'events') {
      title = 'Events';
      text = events
        .map(
          (e) =>
            `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.module}] ${e.type} -> ${e.target}`
        )
        .join('\n');
    }
    return compressReportText(
      `========================\n${title}\n========================\n` +
        (text || 'No data recorded.')
    );
  };

  const buildPerformanceReport = () => {
    const profiler = PerformanceProfiler.getInstance();
    const metrics = perfMetrics || profiler.getMetrics();
    const warnings = profiler.getWarnings(metrics);

    let text = `========================\nPerformance Diagnostics\n========================\n`;
    text += `Average FPS: ${metrics.averageFps}\n`;
    text += `1% Low FPS: ${metrics.low1PercentFps}\n`;
    text += `JS Thread Avg Delay: ${metrics.jsThreadAverage}ms (Peak: ${metrics.jsThreadPeak}ms)\n`;
    text += `UI Thread Paint: ${metrics.uiThreadAverage}ms (Peak: ${metrics.uiThreadPeak}ms)\n`;
    text += `Active Component Renders:\n`;
    if (perf.size > 0) {
      perf.forEach((v, k) => {
        text += ` - ${k}: ${v.renders} renders, ${v.mounts} mounts\n`;
      });
    } else {
      text += ` - None recorded\n`;
    }
    if (warnings.length > 0) {
      text += `\nActive Warnings:\n`;
      warnings.forEach((w) => {
        text += ` - [${w.severity}] ${w.title}: ${w.description}\n`;
      });
    }
    return compressReportText(text);
  };

  const buildNetworkReport = () => {
    let text = `========================\nNetwork Sniffer Log\n========================\n`;
    if (network.length > 0) {
      network.forEach((req) => {
        text += `[${new Date(req.timestamp).toLocaleTimeString()}] ${req.method} ${req.url} -> Status: ${req.status || 'Pending'} (${req.statusText || ''})\n`;
      });
    } else {
      text += `No network traffic recorded.\n`;
    }
    return compressReportText(text);
  };

  const buildSystemReport = () => {
    let text = `========================\nSystem Diagnostics\n========================\n`;
    text += `App Version: ${APP_VERSION}\n`;
    text += `Native Version: ${Capacitor.isNativePlatform() ? NATIVE_VERSION : 'Web Portal'}\n`;
    text += `User Agent: ${navigator.userAgent}\n`;
    text += `Platform: ${navigator.platform}\n`;
    text += `Screen: ${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x DPR)\n`;
    text += `Viewport: ${window.innerWidth}x${window.innerHeight}\n`;
    text += `Active Module: ${currentApp}\n`;
    text += `Theme: ${settings.theme}\n`;
    return compressReportText(text);
  };

  const buildStorageReport = () => {
    let text = `========================\nStorage Diagnostics\n========================\n`;
    text += `LocalStorage Keys Count: ${localStorage.length}\n\n`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        text += `[${k}]: ${maskSensitiveValue(k, localStorage.getItem(k) || '')}\n`;
      }
    }
    return compressReportText(text);
  };

  const renderCopyButton = (module: string) => {
    if (module === 'Logs') {
      return (
        <CopyDropdown
          onCopyEverything={buildCopyEverythingReport}
          onCopySection={buildCopySectionReport}
        />
      );
    }
    if (module === 'Performance') {
      return <CopyButton getTextToCopy={buildPerformanceReport} />;
    }
    if (module === 'Network') {
      return <CopyButton getTextToCopy={buildNetworkReport} />;
    }
    if (module === 'System') {
      return <CopyButton getTextToCopy={buildSystemReport} />;
    }
    return <CopyButton getTextToCopy={buildCopyEverythingReport} />;
  };

  const renderSubViewHeader = (title: string) => {
    if (!isWebDesktop) return null;
    const handleGoBack = () => {
      NavigationDispatcher.pop();
    };

    const moduleName =
      title === 'Apps Diagnostics'
        ? 'Apps'
        : title === 'Stagex Diagnostics'
          ? 'Stagex'
          : title === 'Updater Diagnostics'
            ? 'Updater'
            : title === 'System Diagnostics'
              ? 'System'
              : title === 'Logs'
                ? 'Logs'
                : title === 'Performance Diagnostics'
                  ? 'Performance'
                  : title === 'Network Sniffer'
                    ? 'Network'
                    : '';

    const desc =
      title === 'Apps Diagnostics'
        ? 'Module Performance & Lifecycle'
        : title === 'Stagex Diagnostics'
          ? 'Stagex Telemetry & Testing'
          : title === 'Updater Diagnostics'
            ? 'Updater Updates & Diagnostics'
            : title === 'System Diagnostics'
              ? 'App Store & Module State'
              : title === 'Logs'
                ? 'Runtime Events & Warnings'
                : title === 'Performance Diagnostics'
                  ? 'Real-time Metrics & Frame Data'
                  : title === 'Network Sniffer'
                    ? 'HTTP Traffic & WebSockets'
                    : '';

    return (
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
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isWebDesktop ? 16 : 10 }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isWebDesktop ? '20px' : '15px',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>
            {desc && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: isWebDesktop ? '12px' : '10px',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter',
                }}
              >
                {desc}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {moduleName && renderCopyButton(moduleName)}
          {isWebDesktop && (
            <button
              onClick={handleGoBack}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Back
            </button>
          )}
        </div>
      </header>
    );
  };

  const parseLogItem = (log: any) => {
    const timestamp = new Date(log.timestamp || Date.now()).toLocaleTimeString();
    let level = log.level ? log.level.toUpperCase() : 'INFO';
    let thread = 'Main JS Thread';
    let caller = log.module || 'System';
    let message = log.message || '';

    if (log.type === 'native') {
      level = 'NATIVE';
      thread = 'Native Android Thread';
      caller = 'AppInstaller';
      message = log.text;
    } else if (log.type === 'state') {
      level = 'STATE';
      thread = 'State Machine Thread';
      caller = 'StateMachine';
      message = `${log.text} (${log.details || ''})`;
    } else {
      const match = /^\[([^\]]+)\]\s*\[[^\]]+\]\s*(.*)$/.exec(message);
      if (match) {
        caller = match[1];
        message = match[2];
        if (
          caller.includes('Dispatcher') ||
          caller.includes('Store') ||
          caller.includes('Coordinator')
        ) {
          thread = 'Navigation Thread';
        }
      }
    }

    return { timestamp, level, thread, caller, message };
  };

  const renderLogsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
          Runtime Logs
        </span>
        <button
          onClick={clearLogs}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#ee7d77',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredLogs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 24,
              color: 'var(--c-text-secondary)',
              fontSize: 12,
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: 12,
              border: '1px solid var(--c-border)',
            }}
          >
            No logs capture matched the filters.
          </div>
        ) : (
          filteredLogs.map((log, i) => {
            const logAny = log as any;
            const { timestamp, level, thread, caller, message } = parseLogItem(logAny);
            const color =
              level === 'ERROR'
                ? '#ee7d77'
                : level === 'WARN'
                  ? '#fbbf24'
                  : level === 'NATIVE'
                    ? '#10b981'
                    : '#60a5fa';
            const isExpanded = !!expandedLogIndices[i];

            return (
              <div
                key={i}
                onClick={() => setExpandedLogIndices((prev) => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  padding: '14px',
                  background: 'var(--app-surface-high, var(--app-surface))',
                  borderLeft: `4px solid ${color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all 0.15s ease',
                  borderTop: '1px solid var(--c-border)',
                  borderRight: '1px solid var(--c-border)',
                  borderBottom: '1px solid var(--c-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: 'var(--c-text-secondary)',
                        background: 'var(--app-surface-low, var(--app-surface))',
                        border: '1px solid var(--c-border)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {timestamp}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: color,
                        background: `${color}15`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {level}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--c-text-secondary)',
                        fontFamily: 'Inter',
                      }}
                    >
                      {thread}
                    </span>
                  </div>
                  {caller && (
                    <span
                      style={{
                        fontSize: '9px',
                        color: 'var(--c-text-secondary)',
                        background: 'var(--app-surface-low, var(--app-surface))',
                        border: '1px solid var(--c-border)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'Inter',
                      }}
                    >
                      Caller: {caller}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: level === 'ERROR' ? '#fca5a5' : 'var(--c-text-primary)',
                    lineHeight: 1.5,
                    wordBreak: 'break-all',
                  }}
                >
                  {isExpanded
                    ? logAny.message
                    : message.split('\n')[0].substring(0, 120) +
                      (message.length > 120 ? '...' : '')}
                </p>
                {isExpanded && logAny.details && (
                  <pre
                    style={{
                      margin: 0,
                      padding: 10,
                      background: 'var(--app-surface-low, var(--app-surface))',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: 'var(--c-text-secondary)',
                      overflowX: 'auto',
                      border: '1px solid var(--c-border)',
                    }}
                  >
                    {logAny.details}
                  </pre>
                )}
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
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-primary)' }}>
          Captured Exceptions
        </span>
        <button
          onClick={clearErrors}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            borderRadius: 6,
            fontSize: 10,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          Clear Errors
        </button>
      </div>
      {errors.length === 0 ? (
        <div
          style={{
            background: 'rgba(16,185,129,0.04)',
            border: '1px solid rgba(16,185,129,0.12)',
            padding: '16px 20px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#10b981',
            fontSize: 12,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            check_circle
          </span>
          No runtime errors captured in this session.
        </div>
      ) : (
        errors.map((err, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    background: err.count && err.count > 1 ? '#10b981' : '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Occurred: x{err.count || 1}
                </span>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>
                  First: {new Date(err.firstSeen || err.timestamp).toLocaleTimeString()} | Last:{' '}
                  {new Date(err.lastSeen || err.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span
                style={{
                  background: 'var(--app-surface-high)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-secondary)',
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {err.module.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fca5a5',
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              {err.message}
            </div>
            {(() => {
              const codeMatch = /Minified React error #(\d+)/i.exec(err.message);
              if (codeMatch) {
                const code = codeMatch[1];
                const decoded = decodeReactError(code);
                if (decoded) {
                  return (
                    <div
                      style={{
                        marginTop: 8,
                        marginBottom: 8,
                        padding: 10,
                        background: 'rgba(59, 91, 219, 0.08)',
                        border: '1px solid rgba(59, 91, 219, 0.2)',
                        borderRadius: 8,
                        fontSize: 11,
                        color: '#d2d6dc',
                        lineHeight: 1.4,
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#748ffc', marginBottom: 4 }}>
                        Decoded React Error #${code}:
                      </div>
                      <div style={{ fontStyle: 'italic', marginBottom: 6 }}>{decoded.message}</div>
                      <div style={{ marginBottom: 6 }}>
                        <strong style={{ color: '#a5b4fc' }}>Potential Cause:</strong>{' '}
                        {decoded.cause}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#a5b4fc' }}>Recommended Fix:</strong> {decoded.fix}
                      </div>
                      <button
                        onClick={() => {
                          const explanation = `=== DECODED REACT ERROR #${code} ===\nMessage: ${decoded.message}\n\nPotential Cause: ${decoded.cause}\n\nRecommended Fix: ${decoded.fix}`;
                          navigator.clipboard.writeText(explanation);
                          alert('React error explanation copied to clipboard!');
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
                          fontWeight: 700,
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
              <pre
                style={{
                  margin: 0,
                  padding: 8,
                  background: 'var(--app-surface-bright, var(--app-surface))',
                  border: '1px solid var(--c-border)',
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: 'var(--c-text-secondary)',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 150,
                  overflowY: 'auto',
                }}
              >
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
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--c-border)',
            color: 'var(--c-text-primary)',
            padding: '4px 8px',
            borderRadius: 8,
            fontSize: 11,
          }}
        >
          <option value="all">All Modules</option>
          <option value="general">general</option>
          <option value="hub">hub</option>
          <option value="stage">stage</option>
          <option value="drums">drums</option>
          <option value="grooves">grooves</option>
          <option value="vocals">vocals</option>
        </select>
        <button
          onClick={clearEvents}
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            border: '1px solid var(--c-border)',
            color: 'var(--c-text-primary)',
            borderRadius: 6,
            fontSize: 10,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          background: 'var(--app-surface-low, var(--app-surface))',
          borderRadius: 12,
          border: '1px solid var(--c-border)',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: 8,
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 20,
              color: 'var(--c-text-secondary)',
              fontSize: 12,
            }}
          >
            No gesture events streamed yet. Tap around the UI!
          </div>
        ) : (
          filteredEvents
            .slice()
            .reverse()
            .map((evt, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--c-border)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ color: 'var(--c-text-secondary)', marginRight: 8 }}>
                    [{new Date(evt.timestamp).toLocaleTimeString()}]
                  </span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{evt.type}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>
                    → {evt.target}
                  </span>
                </div>
                <span style={{ color: '#a78bfa' }}>{evt.module}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderPerfTab = () => {
    const profiler = PerformanceProfiler.getInstance();
    const metrics = perfMetrics || profiler.getMetrics();
    const score = profiler.getScore(metrics);
    const warnings = profiler.getWarnings(metrics);

    const copyMemoryMap = () => {
      const memoryStats = {
        heapSize: metrics.heapSize,
        usedJSHeapSize: metrics.usedHeap,
        heapGrowthRate: metrics.heapGrowth,
        origin: 'Browser API (performance.memory)',
      };
      copyToClipboard('Memory Profile', memoryStats);
    };

    const copyComponentRenderStats = () => {
      const stats = Array.from(perf.entries()).map(([k, v]) => ({ component: k, ...v }));
      copyToClipboard('Component Render Stats', stats);
    };

    const getScoreColor = (s: number) => {
      if (s >= 90) return '#10b981';
      if (s >= 70) return '#f59e0b';
      return '#ef4444';
    };

    const originBadge = (
      origin: 'Measured' | 'Calculated' | 'Browser API' | 'Native' | 'Unavailable'
    ) => {
      const colors = {
        Measured: { bg: 'rgba(103,124,255,0.12)', text: '#677cff' },
        Calculated: { bg: 'rgba(236,72,153,0.12)', text: '#ec4899' },
        'Browser API': { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
        Native: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' },
        Unavailable: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
      };
      const match = colors[origin] || colors.Calculated;
      return (
        <span
          style={{
            fontSize: '8px',
            fontWeight: 800,
            background: match.bg,
            color: match.text,
            padding: '2px 5px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginLeft: 'auto',
          }}
        >
          {origin}
        </span>
      );
    };

    return (
      <SettingsContentContainer style={{ gap: 24 }}>
        <style>{`
          .perf-metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          @media (min-width: 768px) {
            .perf-metrics-grid {
              grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            }
          }
          .perf-bento-grid {
            display: grid !important;
            grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            gap: 20px !important;
          }
          .perf-card-memory {
            grid-column: span 12 !important;
          }
          .perf-card-pipeline {
            grid-column: span 12 !important;
          }
          @media (min-width: 1024px) {
            .perf-card-memory {
              grid-column: span 4 !important;
            }
            .perf-card-pipeline {
              grid-column: span 8 !important;
            }
          }
        `}</style>

        <div
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            borderRadius: '16px',
            padding: '20px 24px',
            boxSizing: 'border-box',
            border: '1px solid var(--c-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: `4px solid ${getScoreColor(score)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                color: 'var(--c-text-primary)',
                background: 'var(--app-surface-low, var(--app-surface))',
              }}
            >
              {score}
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                }}
              >
                Overall Performance Score
              </h4>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '11px',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                }}
              >
                Score calculated from frame stability, dropped frames, main thread blocks, and
                memory overhead.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: getScoreColor(score),
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {score >= 90 ? 'Excellent' : score >= 70 ? 'Optimal' : 'Janky / Warning'}
            </span>
          </div>
        </div>

        <div className="perf-metrics-grid">
          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--c-border)',
              borderLeft: '3px solid var(--studio-accent-from, #679cff)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.08em',
                }}
              >
                Current FPS
              </span>
              {originBadge('Measured')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {metrics.currentFps}
              </span>
              <span
                style={{ fontSize: '10px', color: 'var(--c-text-secondary)', fontFamily: 'Inter' }}
              >
                / {metrics.refreshRate}Hz
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--c-border)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.08em',
                }}
              >
                Avg FPS
              </span>
              {originBadge('Calculated')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {metrics.averageFps}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--c-border)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.08em',
                }}
              >
                1% Low FPS
              </span>
              {originBadge('Calculated')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {metrics.low1PercentFps}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--c-border)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.08em',
                }}
              >
                Frame Time
              </span>
              {originBadge('Measured')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {metrics.frameTime}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--c-text-secondary)' }}>ms</span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--c-border)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.08em',
                }}
              >
                Jitter
              </span>
              {originBadge('Calculated')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {metrics.frameVariance}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--c-text-secondary)' }}>ms</span>
            </div>
          </div>
        </div>

        <div className="perf-bento-grid">
          <div
            className="perf-card-memory"
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '16px',
              padding: '24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              border: '1px solid var(--c-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                }}
              >
                Memory Profile
              </h3>
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--c-text-secondary)' }}
              >
                memory
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--c-border)',
                  paddingBottom: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--c-text-secondary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    Heap Size
                  </span>
                  <span
                    style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-text-primary)' }}
                  >
                    {metrics.heapSize}
                  </span>
                </div>
                {originBadge(metrics.heapSize === 'Unavailable' ? 'Unavailable' : 'Browser API')}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--c-border)',
                  paddingBottom: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--c-text-secondary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    Used Heap
                  </span>
                  <span
                    style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-text-primary)' }}
                  >
                    {metrics.usedHeap}
                  </span>
                </div>
                {originBadge(metrics.usedHeap === 'Unavailable' ? 'Unavailable' : 'Browser API')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--c-text-secondary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    Heap Growth
                  </span>
                  <span
                    style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-text-primary)' }}
                  >
                    {metrics.heapGrowth}
                  </span>
                </div>
                {originBadge(metrics.heapGrowth === 'Unavailable' ? 'Unavailable' : 'Calculated')}
              </div>
            </div>

            <button
              onClick={copyMemoryMap}
              style={{
                width: '100%',
                background: 'var(--app-surface-high, var(--app-surface))',
                border: '1px solid var(--c-border)',
                borderRadius: '10px',
                color: 'var(--c-text-primary)',
                padding: '12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                content_copy
              </span>
              Copy Memory Map
            </button>
          </div>

          <div
            className="perf-card-pipeline"
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '16px',
              padding: '24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: '1px solid var(--c-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                }}
              >
                Rendering Pipeline
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    background: 'rgba(103,124,255,0.15)',
                    color: 'var(--studio-accent-from, #679cff)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  V-Sync On
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    background: 'var(--app-surface-low, var(--app-surface))',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-secondary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Refresh: {metrics.refreshRate}Hz
                </span>
              </div>
            </div>

            <div
              style={{
                flexGrow: 1,
                minHeight: 180,
                background: 'var(--app-surface-low, #0a0a0c)',
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 8,
                border: '1px solid var(--c-border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.06,
                  backgroundSize: '20px 20px',
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-between',
                  height: '100%',
                  width: '100%',
                  zIndex: 10,
                  gap: 4,
                }}
              >
                {chartBars.map((val, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--studio-accent-from, #679cff)',
                      height: `${(val / metrics.refreshRate) * 80}%`,
                      width: '100%',
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.3 + (idx / chartBars.length) * 0.7,
                      transition: 'height 0.3s ease',
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  zIndex: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  color: 'var(--c-text-secondary)',
                  textTransform: 'uppercase',
                  fontFamily: 'Inter',
                  letterSpacing: '0.04em',
                  marginTop: 6,
                }}
              >
                <span>Last 20 Samples</span>
                <span>UI Thread Delay: {metrics.eventLoopDelay.toFixed(1)}ms</span>
                <span>GPU: {metrics.gpuRenderer.substring(0, 30)}</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
                paddingTop: 8,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--c-text-secondary)',
                      textTransform: 'uppercase',
                      fontFamily: 'Inter',
                    }}
                  >
                    Rasterization
                  </span>
                  {originBadge('Unavailable')}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  Unavailable
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--c-text-secondary)',
                      textTransform: 'uppercase',
                      fontFamily: 'Inter',
                    }}
                  >
                    Compositing
                  </span>
                  {originBadge('Unavailable')}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  Unavailable
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--c-text-secondary)',
                      textTransform: 'uppercase',
                      fontFamily: 'Inter',
                    }}
                  >
                    UI Loop Lag
                  </span>
                  {originBadge('Measured')}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--c-text-primary)',
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {metrics.eventLoopDelay.toFixed(1)}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid var(--c-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.04em',
                }}
              >
                Thermal State
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--c-text-secondary)',
                  opacity: 0.6,
                  display: 'block',
                  marginTop: 4,
                }}
              >
                Unavailable
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--c-text-secondary)',
                  opacity: 0.7,
                  display: 'block',
                  marginTop: 2,
                }}
              >
                Reason: Metric not exposed by current platform.
              </span>
            </div>
            {originBadge('Unavailable')}
          </div>
          <div
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid var(--c-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  letterSpacing: '0.04em',
                }}
              >
                Battery Optimization
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--c-text-secondary)',
                  opacity: 0.6,
                  display: 'block',
                  marginTop: 4,
                }}
              >
                Unavailable
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--c-text-secondary)',
                  opacity: 0.7,
                  display: 'block',
                  marginTop: 2,
                }}
              >
                Reason: Metric not exposed by current platform.
              </span>
            </div>
            {originBadge('Unavailable')}
          </div>
        </div>

        <div
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            borderRadius: '16px',
            padding: '24px',
            boxSizing: 'border-box',
            border: '1px solid var(--c-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--c-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: warnings.length > 0 ? '#fbbf24' : '#10b981' }}
            >
              warning
            </span>
            Active Performance Warnings ({warnings.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {warnings.length === 0 ? (
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--c-text-secondary)',
                  padding: '12px',
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#10b981', fontSize: 18 }}
                >
                  check_circle
                </span>
                All metrics are operating within recommended limits. Rendering pipeline is optimal.
              </div>
            ) : (
              warnings.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: 'var(--app-surface-bright, var(--app-surface))',
                    border: '1px solid var(--c-border)',
                    borderLeft: `4px solid ${w.severity === 'Critical' ? '#ef4444' : '#fbbf24'}`,
                    borderRadius: '4px 12px 12px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{ fontWeight: 800, fontSize: '14px', color: 'var(--c-text-primary)' }}
                    >
                      {w.title}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        background:
                          w.severity === 'Critical'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(251,191,36,0.15)',
                        color: w.severity === 'Critical' ? '#ef4444' : '#fbbf24',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {w.severity}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--c-text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {w.description}
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 8,
                      marginTop: 4,
                      fontSize: '11px',
                      borderTop: '1px solid var(--c-border)',
                      paddingTop: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--c-text-secondary)' }}>Measured: </span>
                      <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>
                        {w.measured}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--c-text-secondary)' }}>Expected: </span>
                      <span style={{ color: 'var(--c-text-secondary)' }}>{w.expected}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-secondary)', marginTop: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--studio-accent-from, #679cff)' }}>
                      Possible Cause:{' '}
                    </span>
                    {w.possibleCause}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--studio-accent-from, #679cff)' }}>
                      Investigation:{' '}
                    </span>
                    {w.suggestedInvestigation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            borderRadius: '16px',
            padding: '24px',
            boxSizing: 'border-box',
            border: '1px solid var(--c-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                }}
              >
                Component Rendering Profiler
              </h3>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '11px',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                }}
              >
                Tracks mounts, unmounts, and render frequencies for heavy layout components in the
                active session.
              </p>
            </div>
            <button
              onClick={copyComponentRenderStats}
              style={{
                background: 'var(--app-surface-high, var(--app-surface))',
                border: '1px solid var(--c-border)',
                borderRadius: '8px',
                color: 'var(--c-text-primary)',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                content_copy
              </span>
              Copy Stats
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: 300,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {perf.size === 0 ? (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--c-text-secondary)',
                  textAlign: 'center',
                  padding: '24px 0',
                }}
              >
                No active component render telemetry captured in this session.
              </div>
            ) : (
              Array.from(perf.entries()).map(([comp, stats]) => {
                const isHighRerender = stats.renders > 15;
                return (
                  <div
                    key={comp}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--app-surface-low, var(--app-surface))',
                      border: isHighRerender
                        ? '1px solid rgba(251,191,36,0.25)'
                        : '1px solid var(--c-border)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '13px',
                          color: isHighRerender ? '#fbbf24' : 'var(--c-text-primary)',
                        }}
                      >
                        {comp}
                      </span>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--c-text-secondary)',
                          marginTop: 4,
                          fontFamily: 'Inter',
                        }}
                      >
                        Last render: {new Date(stats.lastRenderTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    >
                      <div style={{ color: 'var(--c-text-secondary)' }}>
                        Mounts:{' '}
                        <span style={{ color: '#10b981', fontWeight: 800 }}>{stats.mounts}</span>
                      </div>
                      <div style={{ color: 'var(--c-text-secondary)' }}>
                        Renders:{' '}
                        <span
                          style={{
                            color: isHighRerender
                              ? '#f59e0b'
                              : 'var(--studio-accent-from, #679cff)',
                            fontWeight: 800,
                          }}
                        >
                          {stats.renders}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SettingsContentContainer>
    );
  };

  const renderStateTab = () => {
    const states = [
      { key: 'Active Module', value: currentApp, icon: 'apps' },
      { key: 'Theme Mode', value: settings.theme, icon: 'palette' },
      { key: 'Language', value: settings.language || 'en', icon: 'language' },
      {
        key: 'Sync Across Devices',
        value: settings.syncAcrossDevices ? 'Enabled' : 'Disabled',
        icon: 'sync',
        isBoolean: true,
        boolVal: settings.syncAcrossDevices,
      },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
          App Store Settings & Configurations
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            width: '100%',
          }}
        >
          {states.map((st, idx) => {
            const valueColor = st.isBoolean
              ? st.boolVal
                ? 'var(--studio-accent-from, #679cff)'
                : 'var(--c-text-secondary)'
              : st.key === 'Active Module'
                ? 'var(--studio-accent-from, #679cff)'
                : 'var(--c-text-primary)';

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--app-surface-high, var(--app-surface))',
                  border: '1px solid var(--c-border)',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 110,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--c-text-secondary)',
                      fontFamily: 'Inter',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {st.key}
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 20,
                      color: 'var(--c-text-secondary)',
                    }}
                  >
                    {st.icon}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: valueColor,
                    fontFamily: 'Manrope, sans-serif',
                    marginTop: 12,
                  }}
                >
                  {st.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      history: [],
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
          chordex: (window as any).__chordexDiagnostics || null,
        },
        capturedPayload: diag.lastPayload || (window as any).__captureBlackScreenState?.() || null,
      };

      navigator.clipboard
        .writeText(JSON.stringify(payload, null, 2))
        .then(() => showToast('Diagnostics copied to clipboard!'))
        .catch(() => showToast('Copy failed. Please copy manually.'));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-primary)' }}>
            Navigation Trace & Lifecycle Diagnostics
          </span>
          <button
            onClick={() => {
              clearNavigationEntries();
              showToast('Navigation logs cleared!');
            }}
            style={{
              background: 'var(--app-surface-high, var(--app-surface))',
              border: '1px solid var(--c-border)',
              color: 'var(--c-text-primary)',
              borderRadius: 6,
              fontSize: 10,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Clear logs
          </button>
        </div>

        <div
          style={{
            background: 'var(--app-surface-high, var(--app-surface))',
            borderRadius: 12,
            border: '1px solid var(--c-border)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
            Black Screen Diagnostics
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
              fontSize: 11,
              color: 'var(--c-text-primary)',
            }}
          >
            <div>
              Return Attempts: <strong>{diag.returnAttempts}</strong>
            </div>
            <div>
              Failed Returns: <strong>{diag.failedReturns}</strong>
            </div>
            <div>
              Detections: <strong>{diag.blackScreenDetections}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              Topmost Blocker:{' '}
              <span style={{ fontFamily: 'monospace', color: '#f87171' }}>{diag.lastBlocker}</span>
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
                fontWeight: 600,
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
                fontWeight: 600,
              }}
            >
              Copy Black Screen Diagnostics
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'var(--app-surface-low, var(--app-surface))',
            borderRadius: 12,
            border: '1px solid var(--c-border)',
            padding: 12,
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#10b981',
              marginBottom: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              play_arrow
            </span>
            Current Route Mode:{' '}
            <strong style={{ color: 'var(--c-text-primary)' }}>{currentApp}</strong>
          </div>
          <div style={{ color: 'var(--c-text-secondary)', fontSize: 11, marginBottom: 8 }}>
            Previous view cache triggers:
            <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
              <li>
                Last Active Session Panel:{' '}
                {useSessionStore.getState().lastSession?.stagexView || 'N/A'}
              </li>
              <li>
                LiquidGlassNav collapsed state:{' '}
                {String(useChordStore.getState().favorites?.length > 0)}
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {navEntries.length === 0 ? (
            <div
              style={{
                color: 'var(--c-text-secondary)',
                fontSize: 11,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No navigation events logged yet.
            </div>
          ) : (
            navEntries
              .slice()
              .reverse()
              .map((entry) => {
                const timeStr =
                  new Date(entry.timestamp).toLocaleTimeString() +
                  '.' +
                  String(entry.timestamp % 1000).padStart(3, '0');

                const tags: React.ReactNode[] = [];
                if (entry.transitionStart)
                  tags.push(
                    <span
                      key="start"
                      style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      START
                    </span>
                  );
                if (entry.transitionComplete)
                  tags.push(
                    <span
                      key="complete"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      COMPLETE
                    </span>
                  );
                if (entry.hubMounted)
                  tags.push(
                    <span
                      key="hub"
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      HUB MOUNTED
                    </span>
                  );
                if (entry.subappUnmounted)
                  tags.push(
                    <span
                      key="unmount"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      SUBAPP UNMOUNTED
                    </span>
                  );
                if (entry.fallbackRendered)
                  tags.push(
                    <span
                      key="fallback"
                      style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#a855f7',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      FALLBACK SHOWN
                    </span>
                  );

                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--app-surface-high, var(--app-surface))',
                      border: '1px solid var(--c-border)',
                      borderRadius: 10,
                      fontSize: 11,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--c-text-secondary)', fontFamily: 'monospace' }}>
                        {timeStr}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {tags}
                        <span
                          style={{
                            background: entry.transitionLockState
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                            color: entry.transitionLockState ? '#ef4444' : '#10b981',
                            padding: '1px 5px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 700,
                          }}
                        >
                          {entry.transitionLockState ? 'LOCKED' : 'UNLOCKED'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'var(--c-text-primary)' }}>
                        Flow:{' '}
                        <strong style={{ color: '#3b82f6' }}>{entry.fromApp || 'none'}</strong>{' '}
                        &rarr; <strong style={{ color: '#10b981' }}>{entry.toApp || 'none'}</strong>
                      </span>
                      <span style={{ color: 'var(--c-text-secondary)' }}>
                        Active:{' '}
                        <strong style={{ color: 'var(--c-text-primary)' }}>
                          {entry.activeAppAfterTransition}
                        </strong>
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
    const missingAssets = network.reduce(
      (acc, req) => {
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
            suggestedCause =
              'Drums asset ignored by aapt packaging rule or missing from public/drums.';
          } else if (lowerPath.endsWith('.map')) {
            suggestedCause = 'Source maps excluded in production build.';
          }

          const existing = acc.find((a) => a.path === pathOnly);
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
              suggestedCause,
            });
          }
        }
        return acc;
      },
      [] as Array<{
        path: string;
        count: number;
        firstSeen: number;
        lastSeen: number;
        module: string;
        suggestedCause: string;
      }>
    );

    return (
      <SettingsContentContainer style={{ gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
            HTTP Requests Sniffer
          </span>
          <button
            onClick={clearNetworkRequests}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#ee7d77',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Clear Requests
          </button>
        </div>

        {/* Missing Assets Alerts */}
        {missingAssets.length > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ color: '#ee7d77', fontSize: 20 }}
              >
                error
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ee7d77' }}>
                Missing Assets ({missingAssets.length})
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 180,
                overflowY: 'auto',
              }}
            >
              {missingAssets.map((asset, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--app-surface-low, var(--app-surface))',
                    borderRadius: '8px',
                    border: '1px solid var(--c-border)',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}
                    >
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ee7d77',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '9px',
                          fontFamily: 'Inter',
                        }}
                      >
                        404
                      </span>
                      <span
                        style={{
                          color: 'var(--c-text-secondary)',
                          fontWeight: 700,
                          fontFamily: 'Inter',
                        }}
                      >
                        Module: {asset.module}
                      </span>
                      {asset.count > 1 && (
                        <span
                          style={{
                            background: 'var(--app-surface-high)',
                            color: 'var(--c-text-primary)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '9px',
                            fontFamily: 'Inter',
                          }}
                        >
                          ×{asset.count}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        color: 'var(--c-text-secondary)',
                        fontSize: '9px',
                        fontFamily: 'Inter',
                      }}
                    >
                      Seen: {new Date(asset.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    style={{
                      color: 'var(--c-text-primary)',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '11.5px',
                    }}
                  >
                    {asset.path}
                  </div>
                  <div
                    style={{
                      color: '#ee7d77',
                      opacity: 0.9,
                      fontSize: '10.5px',
                      fontFamily: 'Inter',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Suggested Cause:</strong> {asset.suggestedCause}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Sniffer List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {network.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 24,
                color: 'var(--c-text-secondary)',
                fontSize: 12,
                background: 'var(--app-surface-high, var(--app-surface))',
                borderRadius: 12,
                border: '1px solid var(--c-border)',
              }}
            >
              No HTTP requests logged.
            </div>
          ) : (
            network
              .slice()
              .reverse()
              .map((req, i) => {
                const isError = req.error || (req.status && req.status >= 400);
                const color = isError ? '#ee7d77' : '#10b981';
                return (
                  <div
                    key={i}
                    style={{
                      padding: '14px',
                      background: 'var(--app-surface-high, var(--app-surface))',
                      borderLeft: `3px solid ${color}`,
                      borderRadius: '12px',
                      borderTop: '1px solid var(--c-border)',
                      borderRight: '1px solid var(--c-border)',
                      borderBottom: '1px solid var(--c-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--studio-accent-from, #679cff)',
                          fontWeight: 800,
                          background: 'rgba(103,124,255,0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {req.method}
                      </span>
                      <span
                        style={{
                          color: color,
                          fontWeight: 700,
                          background: `${color}12`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {req.status ? `HTTP ${req.status}` : req.error ? 'FAILED' : 'PENDING'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        color: 'var(--c-text-primary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {req.url}
                    </div>
                    {req.headers && Object.keys(req.headers).length > 0 && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: '10px',
                          color: 'var(--c-text-secondary)',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          background: 'var(--app-surface-low, var(--app-surface))',
                          border: '1px solid var(--c-border)',
                          padding: 6,
                          borderRadius: 6,
                        }}
                      >
                        Headers: {JSON.stringify(req.headers)}
                      </div>
                    )}
                    {req.error && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: '11px',
                          color: '#fca5a5',
                          fontFamily: 'monospace',
                        }}
                      >
                        Error: {req.error}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </SettingsContentContainer>
    );
  };

  const renderStorageTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
        LocalStorage Inspector (Masked)
      </span>
      <div style={{ display: 'grid', gap: 12 }}>
        {Object.keys(localStorage).map((key) => {
          const val = localStorage.getItem(key) || '';
          return (
            <div
              key={key}
              style={{
                padding: '16px 20px',
                background: 'var(--app-surface-high, var(--app-surface))',
                border: '1px solid var(--c-border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--studio-accent-from, #679cff)',
                    wordBreak: 'break-all',
                  }}
                >
                  {key}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(val);
                    showToast(`Copied value of ${key}`);
                  }}
                  style={{
                    background: 'var(--app-surface-low, var(--app-surface))',
                    border: '1px solid var(--c-border)',
                    borderRadius: '8px',
                    color: 'var(--c-text-secondary)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '11px',
                    fontFamily: 'Inter',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    content_copy
                  </span>
                  Copy Raw
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--c-text-secondary)',
                  wordBreak: 'break-all',
                  background: 'var(--app-surface-bright, var(--app-surface))',
                  border: '1px solid var(--c-border)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {maskSensitiveValue(key, val)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProvidersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-primary)' }}>
        App-Specific Debug Panels
      </span>
      {activeProviders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--app-surface-high, var(--app-surface))',
            border: '1px solid var(--c-border)',
            borderRadius: '16px',
            color: 'var(--c-text-secondary)',
            fontSize: '12px',
          }}
        >
          No app-specific debug panel is currently active. Open Chordex, Stagex, or Drumex to
          inspect them.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeProviders.map((prov) => (
            <div
              key={prov.id}
              style={{
                background: 'var(--app-surface-high, var(--app-surface))',
                border: '1px solid var(--c-border)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--studio-accent-from, #679cff)',
                  }}
                >
                  {prov.name}
                </h4>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'Inter',
                    color: 'var(--c-text-secondary)',
                    background: 'var(--app-surface-low, var(--app-surface))',
                    border: '1px solid var(--c-border)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {prov.id}
                </span>
              </div>

              {/* Provider Actions */}
              {prov.getActions && prov.getActions().length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {prov.getActions().map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.action}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'var(--app-surface-low, var(--app-surface))',
                        border: '1px solid var(--c-border)',
                        color: 'var(--c-text-primary)',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'Inter',
                      }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              {/* State */}
              <pre
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  background: 'var(--app-surface-bright, var(--app-surface))',
                  border: '1px solid var(--c-border)',
                  borderRadius: '10px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--c-text-secondary)',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 250,
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(prov.getDebugState(), null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAppsView = () => {
    const isLightMode =
      settings.theme === 'light' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: light)').matches);

    const getAppWarnings = (appKey: string) => {
      return logs.filter((l) => {
        if (l.level !== 'warn') return false;
        const mod = (l.module || '').toLowerCase();
        if (appKey === 'chordex') return mod === 'chordex';
        if (appKey === 'drumex') return mod === 'drumex' || mod === 'drums';
        if (appKey === 'stagex') return mod === 'stagex' || mod === 'stage';
        if (appKey === 'groovex') return mod === 'groovex';
        if (appKey === 'vocalex') return mod === 'vocalex';
        if (appKey === 'hub') {
          return !['chordex', 'drumex', 'drums', 'stagex', 'stage', 'groovex', 'vocalex'].includes(
            mod
          );
        }
        return false;
      });
    };

    const getAppErrors = (appKey: string) => {
      return errors.filter((e) => {
        const mod = (e.module || '').toLowerCase();
        if (appKey === 'chordex') return mod === 'chordex';
        if (appKey === 'drumex') return mod === 'drumex' || mod === 'drums';
        if (appKey === 'stagex') return mod === 'stagex' || mod === 'stage';
        if (appKey === 'groovex') return mod === 'groovex';
        if (appKey === 'vocalex') return mod === 'vocalex';
        if (appKey === 'hub') {
          return !['chordex', 'drumex', 'drums', 'stagex', 'stage', 'groovex', 'vocalex'].includes(
            mod
          );
        }
        return false;
      });
    };

    // Genuine JS heap measurement if supported by browser/WebView
    const measuredHeap =
      typeof window !== 'undefined' && (window.performance as any)?.memory?.usedJSHeapSize
        ? `${Math.round(((window.performance as any).memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10} MB`
        : null;

    // Genuine OS process PID if available from nativeDeviceInfo
    const nativePid = nativeDeviceInfo?.pid ? String(nativeDeviceInfo.pid) : null;

    const chordsHistory = useNavigationStore.getState().history.find((r) => r.app === 'chordex');
    const chordsView = chordsHistory?.page || chordsHistory?.tab || 'Library';

    const stagexHistory = useNavigationStore.getState().history.find((r) => r.app === 'stagex');
    const stagexView =
      stagexHistory?.page || stagexHistory?.tab || settings.defaultStageView || 'Editor';

    const drumexHistory = useNavigationStore.getState().history.find((r) => r.app === 'drumex');
    const drumexView =
      drumexHistory?.page || drumexHistory?.tab || settings.defaultDrumTab || 'Songs';

    const groovexHistory = useNavigationStore.getState().history.find((r) => r.app === 'groovex');
    const groovexView = groovexHistory?.page || groovexHistory?.tab || 'Library';

    const vocalexHistory = useNavigationStore.getState().history.find((r) => r.app === 'vocalex');
    const vocalexView = vocalexHistory?.page || vocalexHistory?.tab || 'Practice';

    const hubHistory = useNavigationStore.getState().history.find((r) => r.app === 'hub');
    const hubView = hubHistory?.tab || hubHistory?.page || 'Main';

    const customChordsCount = useChordStore.getState().customChords?.length || 0;

    const appsList = [
      {
        key: 'hub',
        name: 'Livex Hub',
        icon: 'hub',
        isActive: currentApp === 'hub',
        view: hubView,
        engine: 'React DOM / Host Router',
        details: [
          { label: 'Route Tab', value: hubView },
          { label: 'Theme', value: settings.theme },
          { label: 'Language', value: settings.language || 'en' },
        ],
        warnings: getAppWarnings('hub'),
        errors: getAppErrors('hub'),
      },
      {
        key: 'chordex',
        name: 'Chordex',
        icon: 'music_note',
        isActive: currentApp === 'chordex',
        view: chordsView,
        engine: 'Chord Engine & SVG Renderer',
        details: [
          { label: 'Active Page', value: chordsView },
          { label: 'Instrument', value: settings.instrument || 'guitar' },
          { label: 'Custom Chords', value: String(customChordsCount) },
        ],
        warnings: getAppWarnings('chordex'),
        errors: getAppErrors('chordex'),
      },
      {
        key: 'drumex',
        name: 'Drumex',
        icon: 'album',
        isActive: currentApp === 'drumex',
        view: drumexView,
        engine: 'Web Audio Sequencer',
        details: [
          { label: 'Default Tab', value: drumexView },
          { label: 'Audio Engine', value: 'Web Audio API' },
          {
            label: 'Sample Rate',
            value: typeof AudioContext !== 'undefined' ? '44.1/48 kHz' : 'N/A',
          },
        ],
        warnings: getAppWarnings('drumex'),
        errors: getAppErrors('drumex'),
      },
      {
        key: 'stagex',
        name: 'Stagex',
        icon: 'theater_comedy',
        isActive: currentApp === 'stagex',
        view: stagexView,
        engine: 'IFrame Stage-Core Bridge',
        details: [
          { label: 'Default View', value: stagexView },
          { label: 'Bridge Status', value: stagexStatus },
          {
            label: 'ACK Telemetry',
            value: `${stagex.ackCount} ACKs / ${stagex.messagesSent} Sent`,
          },
        ],
        warnings: getAppWarnings('stagex'),
        errors: getAppErrors('stagex'),
        hasTelemetry: true,
      },
      {
        key: 'groovex',
        name: 'Groovex',
        icon: 'graphic_eq',
        isActive: currentApp === 'groovex',
        view: groovexView,
        engine: 'Soundfont Player & Synth',
        details: [
          { label: 'Active Tab', value: groovexView },
          { label: 'Synth Engine', value: 'Web Audio / Soundfont' },
        ],
        warnings: getAppWarnings('groovex'),
        errors: getAppErrors('groovex'),
      },
      {
        key: 'vocalex',
        name: 'Vocalex',
        icon: 'mic',
        isActive: currentApp === 'vocalex',
        view: vocalexView,
        engine: 'Audio Worklet & Pitch Detection',
        details: [
          { label: 'Active View', value: vocalexView },
          { label: 'Pitch Detector', value: 'YIN Algorithm' },
        ],
        warnings: getAppWarnings('vocalex'),
        errors: getAppErrors('vocalex'),
      },
    ];

    const copyAppDiagnostics = (appName: string, appData: any) => {
      const dump = {
        appVersion: APP_VERSION,
        timestamp: new Date().toISOString(),
        appName,
        key: appData.key,
        status: appData.isActive ? 'Active' : 'Inactive',
        view: appData.view,
        engine: appData.engine,
        details: appData.details,
        warningsCount: appData.warnings.length,
        errorsCount: appData.errors.length,
        ...(measuredHeap ? { jsHeapUsage: measuredHeap } : {}),
        ...(nativePid ? { processId: nativePid } : {}),
      };
      copyToClipboard(`${appName} Diagnostics`, dump);
    };

    return (
      <SettingsContentContainer style={{ gap: 16 }}>
        <style>{`
          .apps-diag-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            width: 100% !important;
          }
          @media (min-width: 640px) {
            .apps-diag-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          @media (min-width: 1080px) {
            .apps-diag-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }
          }
          @keyframes app-status-pulse {
            0% { transform: scale(0.95); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.6; }
          }
          .app-active-pulse {
            animation: app-status-pulse 2s infinite ease-in-out;
          }
        `}</style>

        {/* Global Runtime Overview Card */}
        <div
          style={{
            background: isLightMode
              ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.75))'
              : 'var(--surface-topbar-bg, rgba(20, 20, 24, 0.70))',
            borderRadius: 18,
            padding: '14px 18px',
            border: '1px solid var(--c-border)',
            boxShadow: 'var(--surface-topbar-shadow)',
            backdropFilter: 'var(--surface-float-blur)',
            WebkitBackdropFilter: 'var(--surface-float-blur)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--studio-accent-from, #2563eb)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                apps
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                App Runtime Manager
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter, sans-serif',
                  opacity: 0.8,
                }}
              >
                Active app:{' '}
                <strong style={{ color: 'var(--studio-accent-from, #2563eb)' }}>
                  {currentApp.toUpperCase()}
                </strong>{' '}
                • 6 Integrated Modules
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {measuredHeap && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: 'rgba(16, 185, 129, 0.10)',
                  border: '1px solid rgba(16, 185, 129, 0.20)',
                  color: '#10b981',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Heap: {measuredHeap}
              </span>
            )}
            {nativePid && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: 'rgba(128, 128, 128, 0.10)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-secondary)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                PID: {nativePid}
              </span>
            )}
          </div>
        </div>

        {/* Responsive Independent Apps Grid */}
        <div className="apps-diag-grid">
          {appsList.map((app) => {
            const hasErrors = app.errors.length > 0;
            const hasWarnings = app.warnings.length > 0;
            const statusColor = hasErrors
              ? '#ee7d77'
              : hasWarnings
                ? '#fbbf24'
                : app.isActive
                  ? 'var(--studio-accent-from, #2563eb)'
                  : 'var(--c-text-secondary)';

            const statusBg = hasErrors
              ? 'rgba(238, 125, 119, 0.12)'
              : hasWarnings
                ? 'rgba(251, 191, 36, 0.12)'
                : app.isActive
                  ? 'rgba(37, 99, 235, 0.12)'
                  : 'rgba(128, 128, 128, 0.08)';

            const statusText = hasErrors
              ? `${app.errors.length} ERROR${app.errors.length > 1 ? 'S' : ''}`
              : hasWarnings
                ? `${app.warnings.length} WARN`
                : app.isActive
                  ? 'ACTIVE'
                  : 'INACTIVE';

            return (
              <div
                key={app.key}
                style={{
                  background: isLightMode
                    ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
                    : 'var(--surface-topbar-bg, rgba(24, 24, 28, 0.70))',
                  borderRadius: 18,
                  padding: '16px 18px',
                  border: app.isActive
                    ? '1.5px solid var(--studio-accent-from, #2563eb)'
                    : hasErrors
                      ? '1px solid rgba(238, 125, 119, 0.3)'
                      : '1px solid var(--c-border)',
                  boxShadow: 'var(--surface-topbar-shadow)',
                  backdropFilter: 'var(--surface-float-blur)',
                  WebkitBackdropFilter: 'var(--surface-float-blur)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: app.isActive
                          ? 'rgba(37, 99, 235, 0.15)'
                          : 'rgba(128, 128, 128, 0.08)',
                        border: '1px solid var(--c-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: app.isActive
                          ? 'var(--studio-accent-from, #2563eb)'
                          : 'var(--c-text-secondary)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {app.icon}
                      </span>
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: 'var(--c-text-primary)',
                          margin: 0,
                          fontFamily: 'Manrope, sans-serif',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {app.name}
                      </h3>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--c-text-secondary)',
                          fontFamily: 'Inter, sans-serif',
                          opacity: 0.75,
                        }}
                      >
                        {app.engine}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 8px',
                      borderRadius: 9999,
                      background: statusBg,
                      border: `1px solid ${statusColor}30`,
                    }}
                  >
                    <span
                      className={app.isActive ? 'app-active-pulse' : ''}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: statusColor,
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: statusColor,
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Details Metrics Grid */}
                <div
                  style={{
                    background: isLightMode ? 'rgba(0, 0, 0, 0.025)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    border: '1px solid var(--c-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {app.details.map((det, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <span style={{ color: 'var(--c-text-secondary)', opacity: 0.8 }}>
                        {det.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--c-text-primary)',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          maxWidth: '65%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {det.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => copyAppDiagnostics(app.name, app)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: isLightMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text-primary)',
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13, opacity: 0.7 }}
                    >
                      content_copy
                    </span>
                    Copy Data
                  </button>

                  {app.hasTelemetry && (
                    <button
                      onClick={() => setSubView('stagex')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(37, 99, 235, 0.12)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        color: 'var(--studio-accent-from, #2563eb)',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        sensors
                      </span>
                      Telemetry
                    </button>
                  )}
                </div>

                {/* Warnings Accordion if any warning exists for this app */}
                {app.warnings.length > 0 && (
                  <WarningsInspector logs={logs} showToast={showToast} appKey={app.key} />
                )}
              </div>
            );
          })}
        </div>
      </SettingsContentContainer>
    );
  };

  const cardContainerStyle = (id: string): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    width: '100%',
    padding: '20px',
    background: 'var(--app-surface-high)',
    border: '1px solid rgba(128,128,128,0.08)',
    borderRadius: '16px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    outline: 'none',
  });

  const badgeStyle = (type: string): React.CSSProperties => {
    let bg = 'rgba(128,128,128,0.08)';
    let color = 'var(--c-text-secondary)';
    if (type === 'running' || type === 'active' || type === 'stable') {
      bg = 'rgba(103, 156, 255, 0.1)';
      color = 'var(--studio-accent-from, #679cff)';
    } else if (type === 'profiling') {
      bg = 'rgba(238, 125, 119, 0.1)';
      color = '#ee7d77';
    } else if (type === 'warnings') {
      bg = 'rgba(251, 146, 60, 0.1)';
      color = '#fb923c';
    }
    return {
      padding: '4px 10px',
      borderRadius: 99,
      fontSize: 9,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      background: bg,
      color: color,
      flexShrink: 0,
      marginLeft: 8,
    };
  };

  const initialBadgeStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--app-surface-bright)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8,
    fontWeight: 800,
    color: 'var(--c-text-primary)',
    border: '1px solid rgba(128, 128, 128, 0.12)',
  };

  const renderDashboardBody = () => (
    <SettingsContentContainer
      style={{
        flex: 1,
        overflowY: isWebDesktop ? 'auto' : 'visible',
        gap: 20,
      }}
    >
      <div style={{ padding: isWebDesktop ? '0 20px' : '0', marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--c-text-secondary)',
              margin: 0,
            }}
          >
            System Health
          </h2>
          <span
            style={{
              padding: '2px 8px',
              background: `${accent.from}15`,
              color: accent.from,
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Live Stream
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
          className="dev-grid-4col"
        >
          {/* App Version */}
          <div
            style={{
              background: 'var(--app-surface-high)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-secondary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                terminal
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                App Version
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary)' }}>
              v{APP_VERSION}
            </div>
          </div>

          {/* Android */}
          <div
            style={{
              background: 'var(--app-surface-high)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-secondary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                android
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Android
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary)' }}>
              {updateDiagnostics.androidVersion || '14.0'}
            </div>
          </div>

          {/* Alerts */}
          <div
            style={{
              background: 'var(--app-surface-high)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-secondary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                report_problem
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Alerts
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', gap: 6 }}>
              <span
                style={{
                  color: errorCount > 0 ? 'var(--studio-error, #ee7d77)' : 'var(--c-text-primary)',
                }}
              >
                {errorCount} E
              </span>
              <span style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}>/</span>
              <span style={{ color: warningCount > 0 ? '#fb923c' : 'var(--c-text-primary)' }}>
                {warningCount} W
              </span>
            </div>
          </div>

          {/* Status */}
          <div
            style={{
              background: 'var(--app-surface-high)',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-secondary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                published_with_changes
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Status
              </span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--studio-accent-from, #679cff)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {otaStatus || 'Up to date'}
            </div>
          </div>
        </div>
      </div>

      {/* ENGINEERING TOOLS */}
      <div
        style={{
          padding: isWebDesktop ? '0 20px' : '0',
          marginTop: 8,
          paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--c-text-secondary)',
              margin: 0,
            }}
          >
            Engineering Tools
          </h2>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--c-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--studio-accent-from, #679cff)',
                display: 'inline-block',
              }}
            />
            <span>6 Modules Active</span>
          </div>
        </div>

        {!settings.developerMode ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              textAlign: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: 'var(--studio-error, #ee7d77)', marginBottom: 16 }}
            >
              terminal
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
              Developer Mode is Disabled
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--c-text-secondary)',
                maxWidth: 280,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              Toggle the status above to activate diagnostics tracking, capture logs, and view
              app-specific states.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
              gap: 16,
            }}
            className="dev-tools-grid"
          >
            {/* Apps */}
            <button
              onClick={() => setSubView('apps')}
              className="btn-smooth"
              style={cardContainerStyle('apps')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'var(--studio-accent-from, #679cff)',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    grid_view
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Apps
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      View diagnostics and runtime status for Livex applications.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('running')}>Running</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={initialBadgeStyle}>CH</div>
                  <div style={initialBadgeStyle}>DR</div>
                  <div style={initialBadgeStyle}>ST</div>
                  <div
                    style={{
                      ...initialBadgeStyle,
                      background: 'var(--studio-accent-from, #679cff)',
                      color: '#fff',
                    }}
                  >
                    +2
                  </div>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Performance */}
            <button
              onClick={() => {
                setSubView('performance');
                setActiveTab('perf');
              }}
              className="btn-smooth"
              style={cardContainerStyle('performance')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 32, color: '#fb923c', fontVariationSettings: "'FILL' 1" }}
                  >
                    speed
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Performance
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Inspect memory, rendering and performance metrics.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('profiling')}>Profiling...</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                  60 FPS{' '}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--c-text-secondary)',
                      fontWeight: 500,
                      marginLeft: 4,
                    }}
                  >
                    / 2.4ms jitter
                  </span>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Logs */}
            <button
              onClick={() => {
                setSubView('logs');
                setActiveTab('logs');
              }}
              className="btn-smooth"
              style={cardContainerStyle('logs')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'var(--c-text-secondary)',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    list_alt
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Logs
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      View runtime logs, warnings and system errors.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('warnings')}>{warningCount} Warnings</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: 'var(--c-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    textAlign: 'left',
                    marginRight: 16,
                  }}
                >
                  {logs.length > 0
                    ? `[${logs[logs.length - 1].level.toUpperCase()}] ${logs[logs.length - 1].message}`
                    : 'No runtime logs recorded.'}
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5, flexShrink: 0 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Network */}
            <button
              onClick={() => {
                setSubView('network');
                setActiveTab('network');
              }}
              className="btn-smooth"
              style={cardContainerStyle('network')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'var(--studio-accent-from, #679cff)',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    wifi
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Network
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Inspect network traffic, latency, and endpoint requests.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('active')}>Active</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                    Connected
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    - WebSockets stable
                  </span>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* System */}
            <button
              onClick={() => {
                setSubView('system');
                setActiveTab('state');
              }}
              className="btn-smooth"
              style={cardContainerStyle('system')}
            >
              <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 32,
                    color: 'var(--c-text-secondary)',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  developer_board
                </span>
                <div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--c-text-primary)',
                      margin: '0 0 4px',
                    }}
                  >
                    System
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--c-text-secondary)',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    View device, runtime and environment architecture information.
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--c-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Environment: {Capacitor.isNativePlatform() ? 'ANDROID-NATIVE' : 'WEB-PORTAL'}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Updater */}
            <button
              onClick={() => setSubView('updater_diagnostics')}
              className="btn-smooth"
              style={cardContainerStyle('updater_diagnostics')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 32,
                      color: 'var(--studio-accent-from, #679cff)',
                      fontVariationSettings: "'FILL' 0",
                    }}
                  >
                    system_update
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Updater Diagnostics
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Inspect update and native APK diagnostics.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('stable')}>Stable</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>
                  Updater system initialized
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Developer Inspector */}
            <button
              onClick={() => setSubView('developer_inspector')}
              className="btn-smooth"
              style={cardContainerStyle('developer_inspector')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 32, color: '#3b82f6', fontVariationSettings: "'FILL' 1" }}
                  >
                    search_hands_free
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Developer Inspector
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Inspect live DOM elements, React Fiber, styles & Box Model.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('stable')}>New</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>
                  Chrome DevTools / Layout Inspector for Android
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>

            {/* Motion Playground */}
            <button
              onClick={() => setSubView('motion_playground')}
              className="btn-smooth"
              style={cardContainerStyle('motion_playground')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 32, color: '#a78bfa', fontVariationSettings: "'FILL' 0" }}
                  >
                    motion_photos_on
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--c-text-primary)',
                        margin: '0 0 4px',
                      }}
                    >
                      Motion Playground
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Prototype and compare different launch animations.
                    </p>
                  </div>
                </div>
                <span style={badgeStyle('experimental')}>Experimental</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>
                  5 Flagship concepts loaded
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}
                >
                  arrow_forward
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </SettingsContentContainer>
  );

  const renderLogsBody = (isMobile: boolean) => (
    <>
      {/* Unified Filters Bento Bar */}
      <div
        style={{
          padding: isMobile ? '16px 0 8px' : '20px 24px 12px',
          background: 'var(--app-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        {/* Search Input & Copy Section button */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--c-text-secondary)',
                pointerEvents: 'none',
                fontSize: 20,
              }}
            >
              search
            </span>
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="Search system events, pids, threads, or messages..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--app-surface-high, var(--app-surface))',
                border: '1px solid var(--c-border)',
                borderRadius: '999px',
                padding: '12px 20px 12px 46px',
                color: 'var(--c-text-primary)',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>
        </div>

        {/* Severity Toggles / Tab Selectors */}
        <div
          className="toggle-scroll"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '4px 0',
            width: '100%',
          }}
        >
          {[
            {
              label: 'All',
              id: 'all_logs',
              active: activeTab === 'logs' && logLevelFilter === 'all',
              color: '#acabaa',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('all');
              },
            },
            {
              label: 'Info',
              id: 'info_logs',
              active: activeTab === 'logs' && logLevelFilter === 'info',
              color: '#60a5fa',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('info');
              },
            },
            {
              label: 'Warnings',
              id: 'warn_logs',
              active: activeTab === 'logs' && logLevelFilter === 'warn',
              color: '#fbbf24',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('warn');
              },
            },
            {
              label: `Errors (${errors.length})`,
              id: 'errors_tab',
              active: activeTab === 'errors',
              color: '#ee7d77',
              onClick: () => {
                setActiveTab('errors');
              },
            },
            {
              label: `Events (${events.length})`,
              id: 'events_tab',
              active: activeTab === 'events',
              color: '#10b981',
              onClick: () => {
                setActiveTab('events');
              },
            },
          ].map((toggle) => (
            <button
              key={toggle.id}
              onClick={toggle.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '10px',
                background: toggle.active
                  ? 'var(--studio-accent-from, #679cff)'
                  : 'var(--app-surface-high, var(--app-surface))',
                border: toggle.active ? '1px solid transparent' : '1px solid var(--c-border)',
                color: toggle.active ? '#fff' : 'var(--c-text-secondary)',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: toggle.active ? '#fff' : toggle.color,
                  display: 'inline-block',
                }}
              />
              {toggle.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: isMobile ? 'none' : 1,
          overflowY: isMobile ? 'visible' : 'auto',
          paddingTop: 16,
          paddingLeft: isMobile ? 0 : 20,
          paddingRight: isMobile ? 0 : 20,
          paddingBottom: isMobile ? 20 : 'calc(var(--content-bottom-pad, 96px) + 20px)',
        }}
      >
        {activeTab === 'logs' && renderLogsTab()}
        {activeTab === 'errors' && renderErrorsTab()}
        {activeTab === 'events' && renderEventsTab()}

        <WarningsInspector logs={logs} showToast={showToast} />
      </div>
    </>
  );

  const renderDashboardContent = () => (
    <>
      <style>{`
        @media (min-width: 768px) {
          .dev-grid-4col {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .dev-tools-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      <div
        style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        <SharedNavigationContainer
          activeView={subView}
          viewOrder={[
            'dashboard',
            'developer_inspector',
            'apps',
            'stagex',
            'updater_diagnostics',
            'system',
            'logs',
            'performance',
            'network',
            'motion_playground',
          ]}
        >
          {(viewId) => (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: subView === viewId ? 'auto' : 'none',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'var(--app-bg)',
              }}
            >
              {viewId === 'dashboard' && (
                <SettingsScaffold
                  title="Developer Options"
                  onBack={onBack}
                  toolbarActions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--studio-accent-from, #679cff)',
                        }}
                      >
                        Dev Mode
                      </span>
                      <StudioToggle
                        size="sm"
                        value={settings.developerMode}
                        onChange={(next) => {
                          useSettingsStore.getState().updateSettings({ developerMode: next });
                          showToast(`Developer Mode: ${next ? 'ON' : 'OFF'}`);
                        }}
                      />
                    </div>
                  }
                >
                  {renderDashboardBody()}
                </SettingsScaffold>
              )}

              {viewId === 'apps' && (
                <SettingsScaffold
                  title="Apps Diagnostics"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Apps')}
                >
                  {renderAppsView()}
                </SettingsScaffold>
              )}

              {viewId === 'stagex' && (
                <SettingsScaffold
                  title="Stagex Diagnostics"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Stagex')}
                >
                  {renderStagexView()}
                </SettingsScaffold>
              )}

              {viewId === 'updater_diagnostics' && (
                <SettingsScaffold
                  title="Updater Diagnostics"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Updater')}
                >
                  <SettingsContentContainer
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      paddingTop: 16,
                      paddingBottom:
                        'calc(env(safe-area-inset-bottom, 0px) + var(--content-bottom-pad, 96px) + 20px)',
                    }}
                  >
                    <UpdaterDiagnosticsPage hideHeader={true} />
                  </SettingsContentContainer>
                </SettingsScaffold>
              )}

              {viewId === 'system' && (
                <SettingsScaffold
                  title="System Diagnostics"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('System')}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(128,128,128,0.08)',
                      background: 'var(--app-bg)',
                      scrollbarWidth: 'none',
                    }}
                  >
                    <button style={tabBtnStyle('state')} onClick={() => setActiveTab('state')}>
                      App Store State
                    </button>
                    <button style={tabBtnStyle('storage')} onClick={() => setActiveTab('storage')}>
                      Storage
                    </button>
                    <button
                      style={tabBtnStyle('providers')}
                      onClick={() => setActiveTab('providers')}
                    >
                      Module Panels ({activeProviders.length})
                    </button>
                  </div>
                  <div style={{ paddingTop: 16 }}>
                    {activeTab === 'state' && renderStateTab()}
                    {activeTab === 'storage' && renderStorageTab()}
                    {activeTab === 'providers' && renderProvidersTab()}
                    <WarningsInspector
                      logs={logs}
                      showToast={showToast}
                      moduleFilter={['system', 'general']}
                    />
                  </div>
                </SettingsScaffold>
              )}

              {viewId === 'logs' && (
                <SettingsScaffold
                  title="Logs"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Logs')}
                >
                  {renderLogsBody(true)}
                </SettingsScaffold>
              )}

              {viewId === 'performance' && (
                <SettingsScaffold
                  title="Performance Diagnostics"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Performance')}
                >
                  {renderPerfTab()}
                  <WarningsInspector
                    logs={logs}
                    showToast={showToast}
                    moduleFilter={['performance', 'perf']}
                  />
                </SettingsScaffold>
              )}

              {viewId === 'network' && (
                <SettingsScaffold
                  title="Network Sniffer"
                  onBack={handleSubViewBack}
                  toolbarActions={renderCopyButton('Network')}
                >
                  {renderNetworkTab()}
                  <WarningsInspector
                    logs={logs}
                    showToast={showToast}
                    moduleFilter={['network', 'sync']}
                  />
                </SettingsScaffold>
              )}

              {viewId === 'motion_playground' && (
                <MotionPlaygroundView accent={accent} onBack={handleSubViewBack} />
              )}

              {viewId === 'developer_inspector' && (
                <SettingsScaffold title="Developer Inspector" onBack={handleSubViewBack}>
                  <SettingsContentContainer
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      paddingTop: 16,
                      paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)',
                    }}
                  >
                    <DeveloperInspectorPanel />
                  </SettingsContentContainer>
                </SettingsScaffold>
              )}
            </div>
          )}
        </SharedNavigationContainer>
      </div>
    </>
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--c-background)',
        color: 'var(--c-text-primary)',
        fontFamily: 'Manrope, sans-serif',
        overflowX: 'hidden',
        zIndex: 99990,
      }}
    >
      {renderDashboardContent()}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--app-surface)',
            border: '1px solid var(--c-border)',
            padding: '10px 20px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 999999,
            color: 'var(--c-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>
            done
          </span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
