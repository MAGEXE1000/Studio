import {
  APP_VERSION,
  isNative,
  otaDiagnostics,
  otaDebugLogs,
  activityLifecycleTimeline,
  transitionHistory,
  rejectedTransitions,
  getErrors,
  getLogs,
  getPerfStats,
  getStagexDiagnostics,
  useNavigationStore,
  PerformanceProfiler
} from '@workspace/studio-core';

export interface DiagnosticsData {
  appVersion: string;
  timestamp: string;
  device: {
    userAgent: string;
    platform: string;
    isNative: boolean;
    manufacturer: string;
    model: string;
    osVersion: string;
    supportedABIs: string[];
    packageName: string;
    versionName: string;
    versionCode: string;
    storageAvailable: string;
    networkState: string;
    batteryLevel: number | string;
  };
  errors: any[];
  perfStats: any[];
  logs: any[];
  stagexDiagnostics: any;
  otaDiagnostics: typeof otaDiagnostics;
  otaDebugLogs: typeof otaDebugLogs;
  activityLifecycle: any[];
  stateTransitions: typeof transitionHistory;
  rejectedTransitions: typeof rejectedTransitions;
  localApkDetails: any;
  nativeLogs: any[];
}

export function buildDiagnosticDataObject(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): DiagnosticsData {
  const devInfo = nativeDeviceInfo || {};
  const perf = getPerfStats();

  return {
    appVersion: APP_VERSION,
    timestamp: new Date().toISOString(),
    device: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      isNative: isNative(),
      manufacturer: devInfo.manufacturer || otaDiagnostics?.deviceModel || 'N/A',
      model: devInfo.model || otaDiagnostics?.deviceModel || 'N/A',
      osVersion: devInfo.osVersion || otaDiagnostics?.androidVersion || 'N/A',
      supportedABIs: devInfo.supportedAbis || [],
      packageName: devInfo.packageName || 'com.chordex.app',
      versionName: devInfo.versionName || APP_VERSION,
      versionCode: devInfo.versionCode !== undefined ? String(devInfo.versionCode) : 'N/A',
      storageAvailable: devInfo.storageAvailable || otaDiagnostics?.storageAvailable || 'N/A',
      networkState: devInfo.networkState || otaDiagnostics?.networkState || 'N/A',
      batteryLevel: devInfo.battery !== undefined ? devInfo.battery : 'N/A'
    },
    errors: getErrors() || [],
    perfStats: perf ? Array.from(perf.entries()).map(([k, v]) => ({ component: k, ...v })) : [],
    logs: getLogs() || [],
    stagexDiagnostics: getStagexDiagnostics() || {},
    otaDiagnostics: otaDiagnostics || {},
    otaDebugLogs: otaDebugLogs || {},
    activityLifecycle: activityLifecycleTimeline || [],
    stateTransitions: transitionHistory || [],
    rejectedTransitions: rejectedTransitions || [],
    localApkDetails: localApkDetails || null,
    nativeLogs: nativeLogsList || []
  };
}

function translateSentinel(val: any, label = 'Not initialized'): string {
  if (val === null || val === undefined || val === '' || val === -999 || val === '-999') {
    return label;
  }
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower === 'none' || lower === 'n/a' || lower === 'null' || lower === 'undefined') {
    return label;
  }
  return str;
}

export function generateUnifiedReport(
  module: string | undefined,
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): string {
  const data = buildDiagnosticDataObject(nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
  
  // Calculate dynamic health score
  let healthScore = 100;
  const criticalDeductions = data.errors.length * 15;
  const warningLogs = data.logs.filter(l => l.level === 'warn');
  const warningDeductions = warningLogs.length * 5;
  
  // Get real performance metrics for score calculations
  const profiler = PerformanceProfiler.getInstance();
  const perfMetrics = profiler.getMetrics();
  const perfScore = profiler.getScore(perfMetrics);
  const perfDeductions = Math.max(0, 100 - perfScore);
  
  healthScore = Math.max(0, Math.min(100, healthScore - criticalDeductions - warningDeductions - perfDeductions));
  
  let overallStatus = 'Normal';
  if (healthScore < 50) overallStatus = 'Critical';
  else if (healthScore < 75) overallStatus = 'Attention Required';
  else if (healthScore < 90) overallStatus = 'Minor Warnings';

  const sections: string[] = [];

  // REPORT HEADER
  sections.push('==================================================');
  sections.push('             Studio Diagnostics Report            ');
  sections.push('==================================================');
  sections.push(`App Version:      ${data.appVersion}`);
  sections.push(`Build/Code:       ${data.device.versionCode}`);
  sections.push(`Timestamp:        ${data.timestamp}`);
  sections.push(`Device Model:     ${data.device.manufacturer} ${data.device.model}`);
  sections.push(`Android Version:  ${data.device.osVersion}`);
  sections.push(`Report Type:      ${module ? `${module} Sub-Report` : 'Full System Report'}`);
  sections.push('');

  // OVERALL HEALTH
  sections.push('==================================================');
  sections.push('                  Overall Health                  ');
  sections.push('==================================================');
  sections.push(`Health Score:     ${healthScore}/100`);
  sections.push(`Overall Status:   ${overallStatus}`);
  sections.push(`Warnings Logged:  ${warningLogs.length}`);
  sections.push(`Errors Logged:    ${data.errors.length}`);
  sections.push(`Performance:      ${perfScore}/100`);
  sections.push(`Navigation State: ${useNavigationStore.getState().isTransitioning ? 'LOCKED' : 'STABLE'}`);
  sections.push(`Updater State:    ${data.otaDebugLogs.downloadStatus || 'IDLE'}`);
  sections.push(`Storage Info:     ${data.device.storageAvailable}`);
  sections.push('');

  // SUMMARY
  sections.push('==================================================');
  sections.push('                     Summary                      ');
  sections.push('==================================================');
  if (healthScore >= 90) {
    sections.push(`The application is operating normally. All core systems are stable with no major errors recorded.`);
  } else if (healthScore >= 70) {
    sections.push(`The application is operational. Some warning logs and/or minor performance jitter were detected, but no critical crashes occurred.`);
  } else {
    sections.push(`CRITICAL ALERT: Multiple system issues or rendering locks have compromised application health. Immediate developer investigation is recommended.`);
  }
  sections.push('');

  // DETECTED PROBLEMS
  sections.push('==================================================');
  sections.push('                Detected Problems                 ');
  sections.push('==================================================');
  
  // Group problems
  const problems: { severity: string; title: string; desc: string; cause: string; inv: string; mod: string; time: string; freq: number }[] = [];
  
  // Parse errors
  data.errors.forEach(err => {
    problems.push({
      severity: 'Critical',
      title: err.message.split('\n')[0].substring(0, 60),
      desc: err.message,
      cause: 'Unhandled runtime JS exception.',
      inv: 'Examine stack trace in the Technical Appendix.',
      mod: err.module || 'Runtime',
      time: new Date(err.timestamp || Date.now()).toLocaleTimeString(),
      freq: 1
    });
  });

  // Parse performance warnings
  const perfWarnings = profiler.getWarnings(perfMetrics);
  perfWarnings.forEach(w => {
    problems.push({
      severity: w.severity,
      title: w.title,
      desc: w.description,
      cause: w.possibleCause,
      inv: w.suggestedInvestigation,
      mod: 'Performance',
      time: new Date().toLocaleTimeString(),
      freq: 1
    });
  });

  // Parse warning logs (collapse duplicates)
  const collapsedWarnings: Record<string, typeof warningLogs[0] & { count: number }> = {};
  warningLogs.forEach(w => {
    const key = w.module + ':' + w.message;
    if (collapsedWarnings[key]) {
      collapsedWarnings[key].count++;
    } else {
      collapsedWarnings[key] = { ...w, count: 1 };
    }
  });

  Object.values(collapsedWarnings).forEach(w => {
    problems.push({
      severity: 'Warning',
      title: w.message.split('\n')[0].substring(0, 60),
      desc: w.message,
      cause: 'Log level warning emitted by module.',
      inv: `Trace source file: ${w.source}. Check application settings/state.`,
      mod: w.module,
      time: new Date(w.timestamp).toLocaleTimeString(),
      freq: w.count
    });
  });

  if (problems.length > 0) {
    problems.sort((a, b) => (a.severity === 'Critical' ? -1 : 1));
    problems.forEach(p => {
      sections.push(`[${p.severity}] ${p.title}`);
      sections.push(`  • Description:    ${p.desc}`);
      sections.push(`  • Possible Cause: ${p.cause}`);
      sections.push(`  • Investigation:  ${p.inv}`);
      sections.push(`  • Module:         ${p.mod}`);
      sections.push(`  • Timestamp:      ${p.time}`);
      sections.push(`  • Frequency:      ${p.freq} times`);
      sections.push('');
    });
  } else {
    sections.push('No problems detected.');
    sections.push('');
  }

  // PERFORMANCE ANALYSIS
  sections.push('==================================================');
  sections.push('               Performance Analysis               ');
  sections.push('==================================================');
  if (!module || module === 'Performance') {
    sections.push(`Frame Rate:          ${perfMetrics.currentFps} FPS (Avg: ${metricsLabel(perfMetrics.averageFps)} FPS, Min: ${metricsLabel(perfMetrics.minFps)} FPS, Max: ${metricsLabel(perfMetrics.maxFps)} FPS)`);
    sections.push(`1% Low FPS:          ${metricsLabel(perfMetrics.low1PercentFps)} FPS`);
    sections.push(`Frame Time:          ${perfMetrics.frameTime} ms (Variance: ${perfMetrics.frameVariance} ms)`);
    sections.push(`Pacing Metrics:      ${perfMetrics.droppedFrames} dropped frames, ${perfMetrics.longFrames} long frames, ${perfMetrics.veryLongFrames} very long frames`);
    sections.push(`Event Loop Lag:      ${perfMetrics.eventLoopDelay} ms delay`);
    sections.push(`Heap Size / Used:    ${perfMetrics.heapSize} / ${perfMetrics.usedHeap} (Growth Rate: ${perfMetrics.heapGrowth})`);
    sections.push(`GPU Renderer:        ${perfMetrics.gpuRenderer}`);
    sections.push(`Refresh Rate:        ${perfMetrics.refreshRate} Hz`);
    sections.push(`Main Thread Blocks:  ${perfMetrics.mainThreadBlockingTotal} ms total (Longest task: ${perfMetrics.longestBlockingTask} ms)`);
    sections.push('');
    sections.push('Performance Plain-Language Summary:');
    if (perfScore >= 90) {
      sections.push('The rendering pipeline is operating smoothly at target display frame rate. Frame intervals are highly stable.');
    } else if (perfScore >= 70) {
      sections.push('The rendering pipeline is mostly stable, but some heavy frames or minor main thread blocks were recorded.');
    } else {
      sections.push('CRITICAL PERFORMANCE STUTTERS: Repeated layout recalculations or long blocking tasks are causing noticeable interface jank.');
    }
  } else {
    sections.push('Performance metrics skipped in this module report.');
  }
  sections.push('');

  // NAVIGATION ANALYSIS
  sections.push('==================================================');
  sections.push('               Navigation Analysis                ');
  sections.push('==================================================');
  if (!module || module === 'Apps' || module === 'System') {
    const navState = useNavigationStore.getState();
    sections.push(`Current Route App:  ${navState.history[navState.history.length - 1]?.app || 'hub'}`);
    sections.push(`Current Route Tab:  ${navState.history[navState.history.length - 1]?.tab || 'home'}`);
    sections.push(`Current Route Page: ${navState.history[navState.history.length - 1]?.page || 'none'}`);
    sections.push(`Transition Lock:    ${navState.isTransitioning ? 'LOCKED' : 'UNLOCKED'}`);
    sections.push(`History Stack Depth:${navState.history.length} screens`);
    sections.push(`Gesture State:      ${navState.gestureState || 'idle'}`);
    sections.push('');
    sections.push('Navigation Trace History:');
    navState.history.forEach((h, idx) => {
      sections.push(`  [${idx + 1}] App: ${h.app}, Tab: ${h.tab || 'none'}, Page: ${h.page || 'none'}`);
    });
  } else {
    sections.push('Navigation analysis skipped in this module report.');
  }
  sections.push('');

  // UPDATER ANALYSIS
  sections.push('==================================================');
  sections.push('                 Updater Analysis                 ');
  sections.push('==================================================');
  if (!module || module === 'Updater' || module === 'System') {
    sections.push(`Local APK Package:  ${localApkDetails ? localApkDetails.packageName : 'No package downloaded'}`);
    sections.push(`Local APK Version:  ${localApkDetails ? localApkDetails.versionName : 'N/A'}`);
    sections.push(`Signature Status:   ${localApkDetails?.isValidApk ? 'VERIFIED (Valid signature)' : 'UNVERIFIED'}`);
    sections.push(`Update Decision:    ${data.otaDebugLogs.updateDecision || 'No check performed'}`);
    sections.push(`Decision Reason:    ${data.otaDebugLogs.updateDecisionReason || 'N/A'}`);
    sections.push(`Download Status:    ${data.otaDebugLogs.downloadStatus || 'IDLE'}`);
    sections.push(`Installation State: ${nativeInstallerDetails ? nativeInstallerDetails.sessionState : 'No active session'}`);
  } else {
    sections.push('Updater analysis skipped in this module report.');
  }
  sections.push('');

  // LOGS ANALYSIS
  sections.push('==================================================');
  sections.push('                  Logs Analysis                   ');
  sections.push('==================================================');
  
  const logGroups: Record<string, { level: string; msg: string; count: number; source: string }> = {};
  data.logs.forEach(log => {
    const key = log.module + ':' + log.message;
    if (logGroups[key]) {
      logGroups[key].count++;
    } else {
      logGroups[key] = { level: log.level, msg: log.message, count: 1, source: log.source };
    }
  });

  const parsedLogs = Object.values(logGroups);
  const infoLogs = parsedLogs.filter(l => l.level === 'info');
  const warnLogs = parsedLogs.filter(l => l.level === 'warn');
  const errLogs = parsedLogs.filter(l => l.level === 'error');

  sections.push(`Log Summary: Info: ${infoLogs.length} events, Warnings: ${warnLogs.length} events, Errors: ${errLogs.length} events`);
  sections.push('');
  sections.push('Logs Conclusions:');
  if (errLogs.length > 0) {
    sections.push('• Critical runtime errors were recorded. Check the stack traces immediately.');
  }
  if (warnLogs.length > 3) {
    sections.push('• High warning volume detected. This might cause memory overhead or performance jank.');
  }
  if (errLogs.length === 0 && warnLogs.length === 0) {
    sections.push('• Event logging is clean. No warnings or errors detected.');
  }
  sections.push('');

  // RECOMMENDATIONS
  sections.push('==================================================');
  sections.push('                 Recommendations                  ');
  sections.push('==================================================');
  let recsCount = 0;
  if (data.errors.length > 0) {
    recsCount++;
    sections.push(`${recsCount}. Resolve the unhandled runtime exceptions in the Technical Appendix.`);
  }
  if (perfScore < 85) {
    recsCount++;
    sections.push(`${recsCount}. Audit components in rendering performance view. Implement memoization to stabilize frame rates.`);
  }
  if (warningLogs.length > 5) {
    recsCount++;
    sections.push(`${recsCount}. Investigate warning loops in module logs to eliminate diagnostic noise.`);
  }
  if (recsCount === 0) {
    sections.push('No actionable recommendations. Keep up the good work!');
  }
  sections.push('');

  // TECHNICAL APPENDIX
  sections.push('==================================================');
  sections.push('                Technical Appendix                ');
  sections.push('==================================================');
  sections.push('--- JavaScript Console Log Dump ---');
  if (data.logs.length > 0) {
    data.logs.slice(-50).forEach(log => {
      sections.push(`[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`);
    });
  } else {
    sections.push('No JavaScript logs in buffer.');
  }
  sections.push('');
  sections.push('--- Android Native Installer Log Dump ---');
  if (data.nativeLogs.length > 0) {
    data.nativeLogs.slice(-50).forEach(log => {
      sections.push(`[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${translateSentinel(log.stage, 'Installer')}] Status: ${log.status} - Message: ${translateSentinel(log.message, 'No message')}`);
    });
  } else {
    sections.push('No native logs in buffer.');
  }
  sections.push('==================================================');

  return sections.join('\n');
}

function metricsLabel(val: number): string | number {
  return val > 0 ? val : 'Unavailable';
}

export function generateFullEngineeringReport(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): string {
  return generateUnifiedReport(undefined, nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
}
