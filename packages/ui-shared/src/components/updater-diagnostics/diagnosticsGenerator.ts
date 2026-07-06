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
  PerformanceProfiler,
  getUpdateSessions,
  getActiveSession
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
    sections.push(`CPU Avg / Peak:      ${perfMetrics.cpuAverage}% / ${perfMetrics.cpuPeak}%`);
    sections.push(`Memory Avg / Peak:   ${perfMetrics.memoryAverage} / ${perfMetrics.memoryPeak}`);
    sections.push(`JS Thread Avg/Peak:  ${perfMetrics.jsThreadAverage} ms / ${perfMetrics.jsThreadPeak} ms`);
    sections.push(`UI Thread Avg/Peak:  ${perfMetrics.uiThreadAverage} ms / ${perfMetrics.uiThreadPeak} ms`);
    sections.push(`1% Low FPS:          ${metricsLabel(perfMetrics.low1PercentFps)} FPS`);
    sections.push(`Frame Time:          ${perfMetrics.frameTime} ms (Variance: ${perfMetrics.frameVariance} ms)`);
    sections.push(`Pacing Metrics:      ${perfMetrics.droppedFrames} dropped frames, ${perfMetrics.longFrames} long frames, ${perfMetrics.veryLongFrames} very long frames`);
    sections.push(`Event Loop Lag:      ${perfMetrics.eventLoopDelay} ms delay`);
    sections.push(`Heap Size / Used:    ${perfMetrics.heapSize} / ${perfMetrics.usedHeap} (Growth Rate: ${perfMetrics.heapGrowth})`);
    sections.push(`GPU Layer Count:     ${perfMetrics.gpuLayerCount} active composition layers`);
    sections.push(`GPU Renderer:        ${perfMetrics.gpuRenderer}`);
    sections.push(`Refresh Rate:        ${perfMetrics.refreshRate} Hz`);
    sections.push(`Callback Latency:    Avg JS: ${perfMetrics.averageCallbackLatency} ms | PackageInstaller: ${perfMetrics.packageInstallerLatency} ms`);
    sections.push(`Pipeline Duration:   ${perfMetrics.updatePipelineDuration}`);
    sections.push(`Main Thread Blocks:  ${perfMetrics.mainThreadBlockingTotal} ms total (Longest task: ${perfMetrics.longestBlockingTask} ms)`);
    sections.push(`Renders / Layouts:   Renders: ${data.otaDebugLogs.renderCount || 0} | Paints: ${data.otaDebugLogs.paintCount || 0} | Layouts: ${data.otaDebugLogs.layoutCount || 0}`);
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

export function generateCopyEverythingReport(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): string {
  const data = buildDiagnosticDataObject(nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
  const activeSession = getActiveSession();
  const allSessions = getUpdateSessions();
  const profiler = PerformanceProfiler.getInstance();
  const perfMetrics = profiler.getMetrics();
  const perfScore = profiler.getScore(perfMetrics);

  // Overall Health Score calculation
  let healthScore = 100;
  const criticalDeductions = data.errors.length * 15;
  const warningLogs = data.logs.filter(l => l.level === 'warn');
  const warningDeductions = warningLogs.length * 5;
  const perfDeductions = Math.max(0, 100 - perfScore);
  healthScore = Math.max(0, Math.min(100, healthScore - criticalDeductions - warningDeductions - perfDeductions));
  let overallStatus = 'Normal';
  if (healthScore < 50) overallStatus = 'Critical';
  else if (healthScore < 75) overallStatus = 'Attention Required';
  else if (healthScore < 90) overallStatus = 'Minor Warnings';

  let report = '';
  report += `# STUDIO UPDATER SYSTEM DIAGNOSTICS REPORT\n`;
  report += `*Generated on: ${data.timestamp}*\n\n`;

  report += `## 1. Overall System Health Summary\n`;
  report += `*   **System Health Score**: ${healthScore}/100 (${overallStatus})\n`;
  report += `*   **App version**: ${data.appVersion} (Build Code: ${data.device.versionCode})\n`;
  report += `*   **Platform**: ${data.device.platform} (Native Cap: ${data.device.isNative ? 'YES' : 'NO'})\n`;
  report += `*   **Network State**: ${data.device.networkState} | Battery: ${data.device.batteryLevel}%\n`;
  report += `*   **Storage Available**: ${data.device.storageAvailable}\n\n`;

  report += `## 2. Active Update Session\n`;
  if (activeSession) {
    const activeDur = activeSession.durationMs ? `${(activeSession.durationMs / 1000).toFixed(2)}s` : 'In progress';
    const statusIcon = activeSession.result === 'SUCCESS' ? '✓ SUCCESS' :
                       activeSession.result === 'FAILED' ? '✖ ERROR' :
                       activeSession.result === 'CANCELLED' ? '✖ CANCELLED' :
                       activeSession.result === 'FINISHED' ? '✓ FINISHED' :
                       activeSession.result === 'ABORTED' ? '✖ ABORTED' :
                       '↺ IN_PROGRESS';

    report += `*   **Session ID**: \`${activeSession.id}\`\n`;
    report += `*   **Current Session State**: **${statusIcon}**\n`;
    report += `*   **Target version**: ${activeSession.version || 'unknown'}\n`;
    report += `*   **Started**: ${activeSession.startTime}\n`;
    report += `*   **Finished**: ${activeSession.endTime || 'N/A'}\n`;
    report += `*   **Duration**: ${activeDur}\n\n`;

    if (activeSession.closeEvent) {
      report += `### ⚠ Who Closed the Updater & Why\n`;
      report += `*   **Closed At**: ${activeSession.closeEvent.timestamp}\n`;
      report += `*   **By Function**: \`${activeSession.closeEvent.functionName}\` in \`${activeSession.closeEvent.file}\`\n`;
      report += `*   **Reason**: ${activeSession.closeEvent.reason}\n`;
      report += `*   **State transition**: ${activeSession.closeEvent.previousState} -> ${activeSession.closeEvent.currentState}\n`;
      report += `*   **Caller Stack Trace**:\n\`\`\`\n${activeSession.closeEvent.stackTrace}\n\`\`\`\n\n`;
    }

    if (activeSession.upToDateEvent) {
      report += `### ℹ Who Opened "Studio is up to date" Popup & Why\n`;
      report += `*   **Trigger Type**: ${activeSession.upToDateEvent.triggerType}\n`;
      report += `*   **By Function**: \`${activeSession.upToDateEvent.functionName}\` in \`${activeSession.upToDateEvent.file}\`\n`;
      report += `*   **Reason**: ${activeSession.upToDateEvent.reason}\n`;
      report += `*   **State transition**: ${activeSession.upToDateEvent.previousState} -> ${activeSession.upToDateEvent.currentState}\n`;
      report += `*   **Caller Stack Trace**:\n\`\`\`\n${activeSession.upToDateEvent.stackTrace}\n\`\`\`\n\n`;
    }
  } else {
    report += `*No active update session.*\n\n`;
  }

  report += `## 3. Update Session Timeline\n`;
  if (activeSession && activeSession.timeline.length > 0) {
    report += `| Timestamp | Offset | State | Module | Event | Status | Details |\n`;
    report += `|---|---|---|---|---|---|---|\n`;
    activeSession.timeline.forEach(e => {
      let icon = '✓ SUCCESS';
      const eventName = e.event.toLowerCase();
      const moduleName = e.module.toLowerCase();
      const reasonText = e.reason.toLowerCase();

      if (reasonText.includes('fail') || reasonText.includes('error') || eventName.includes('fail') || eventName.includes('error') || e.state.includes('FAILED')) {
        icon = '✖ ERROR';
      } else if (reasonText.includes('recover') || eventName.includes('recover')) {
        icon = '↺ RECOVERED';
      } else if (reasonText.includes('skip') || reasonText.includes('busy') || reasonText.includes('ignore') || eventName.includes('skip') || eventName.includes('warn') || eventName.includes('pause')) {
        icon = '⚠ WARNING';
      } else if (moduleName.includes('applifecycle') || eventName.includes('visibility') || eventName.includes('opened') || eventName.includes('closed')) {
        icon = '⚠ INFO';
      }

      report += `| ${e.timestamp} | ${e.offset} | ${e.state} | ${e.module} | ${e.event} | ${icon} | ${e.reason.replace(/\|/g, '\\|')} |\n`;
    });
    report += `\n`;
  } else {
    report += `*No chronological timeline logged.*\n\n`;
  }

  report += `## 4. Update Workflow Transitions\n`;
  if (activeSession && activeSession.transitions.length > 0) {
    report += `| Timestamp | Elapsed | Prev State | Next State | Function | File | Reason | Status |\n`;
    report += `|---|---|---|---|---|---|---|---|\n`;
    activeSession.transitions.forEach(t => {
      let icon = '✓ SUCCESS';
      if (t.nextState === 'INSTALL_FAILED') {
        icon = '✖ ERROR';
      } else if (t.nextState === 'RECOVERY') {
        icon = '↺ RECOVERED';
      } else if (['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE'].includes(t.nextState)) {
        icon = '⚠ WARNING';
      }
      report += `| ${t.timestamp} | ${(t.elapsedTimeMs / 1000).toFixed(3)}s | ${t.previousState} | ${t.nextState} | ${t.functionName} | ${t.file} | ${t.reason.replace(/\|/g, '\\|')} | ${icon} |\n`;
    });
    report += `\n`;
  } else {
    report += `*No workflow state transitions logged.*\n\n`;
  }

  report += `## 5. Performance Diagnostics\n`;
  report += `*   **Avg FPS**: ${perfMetrics.averageFps} FPS (Min: ${perfMetrics.minFps} FPS, Max: ${perfMetrics.maxFps} FPS)\n`;
  report += `*   **CPU Average / Peak**: ${perfMetrics.cpuAverage}% / ${perfMetrics.cpuPeak}%\n`;
  report += `*   **Memory Average / Peak**: ${perfMetrics.memoryAverage} / ${perfMetrics.memoryPeak}\n`;
  report += `*   **JS Thread Average / Peak**: ${perfMetrics.jsThreadAverage} ms / ${perfMetrics.jsThreadPeak} ms\n`;
  report += `*   **UI Thread Average / Peak**: ${perfMetrics.uiThreadAverage} ms / ${perfMetrics.uiThreadPeak} ms\n`;
  report += `*   **Frame Pacing**: ${perfMetrics.framePacing} ms (Variance: ${perfMetrics.frameVariance} ms)\n`;
  report += `*   **Dropped Frames**: ${perfMetrics.droppedFrames} frames | Skipped: ${perfMetrics.longFrames} frames\n`;
  report += `*   **Main Thread Blockings**: Total block time ${perfMetrics.mainThreadBlockingTotal} ms | Longest task: ${perfMetrics.longestBlockingTask} ms\n`;
  report += `*   **Event Loop Delay / Lag**: ${perfMetrics.eventLoopDelay} ms\n`;
  report += `*   **GPU Layer Count**: ${perfMetrics.gpuLayerCount}\n`;
  report += `*   **Callback Latencies**: JS Average: ${perfMetrics.averageCallbackLatency} ms | PackageInstaller: ${perfMetrics.packageInstallerLatency} ms\n`;
  report += `*   **Update Pipeline Duration**: ${perfMetrics.updatePipelineDuration}\n`;
  report += `*   **Renders / Layouts / Paints**: Render count ${data.otaDebugLogs.renderCount || 0} | Paint count ${data.otaDebugLogs.paintCount || 0} | Layout count ${data.otaDebugLogs.layoutCount || 0}\n\n`;
  
  report += `### State Durations (Time spent in each state)\n`;
  if (activeSession && activeSession.stateDurations && Object.keys(activeSession.stateDurations).length > 0) {
    report += `| State | Total Duration spent |\n`;
    report += `|---|---|\n`;
    Object.entries(activeSession.stateDurations).forEach(([st, ms]) => {
      report += `| ${st} | ${(ms / 1000).toFixed(3)}s (${ms} ms) |\n`;
    });
    report += `\n`;
  } else {
    report += `*No state durations recorded.*\n\n`;
  }

  report += `## 6. Package Eligibility & Signature Verification\n`;
  report += `*   **Downloaded APK Name**: ${localApkDetails ? localApkDetails.packageName : 'N/A'}\n`;
  report += `*   **Downloaded APK Version**: ${localApkDetails ? localApkDetails.versionName : 'N/A'}\n`;
  report += `*   **Downloaded APK Code**: ${localApkDetails ? localApkDetails.versionCode : 'N/A'}\n`;
  report += `*   **Signature status**: ${localApkDetails ? (localApkDetails.isValidApk ? '✓ SUCCESS (Valid certificate signature matching installed app)' : '✖ ERROR (Signature mismatch)') : 'N/A'}\n`;
  report += `*   **Package verification details**: ${localApkDetails?.signingSha256 || 'N/A'}\n\n`;

  report += `## 7. Previous Session History\n`;
  const prevSessions = allSessions.filter(s => s.id !== (activeSession ? activeSession.id : null));
  if (prevSessions.length > 0) {
    report += `| Session ID | Started | Target Version | Duration | Result State | Build Platform |\n`;
    report += `|---|---|---|---|---|---|\n`;
    prevSessions.forEach(s => {
      const sDur = s.durationMs ? `${(s.durationMs / 1000).toFixed(2)}s` : 'N/A';
      let icon = '✓ SUCCESS';
      if (s.result === 'FAILED' || s.result === 'ABORTED') icon = '✖ ERROR';
      else if (s.result === 'CANCELLED') icon = '✖ CANCELLED';
      report += `| ${s.id} | ${new Date(s.startTime).toLocaleString()} | ${s.version || 'N/A'} | ${sDur} | ${icon} (${s.result}) | ${s.buildType} |\n`;
    });
    report += `\n`;
  } else {
    report += `*No previous sessions recorded in local history.*\n\n`;
  }

  report += `## 8. Technical Appendix: JS Console Logs (Last 30)\n`;
  report += `\`\`\`\n`;
  if (data.logs.length > 0) {
    data.logs.slice(-30).forEach(log => {
      report += `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}\n`;
    });
  } else {
    report += `No JS console logs recorded.\n`;
  }
  report += `\`\`\`\n\n`;

  report += `## 9. Technical Appendix: Native PackageInstaller Callback Events (Last 30)\n`;
  report += `\`\`\`\n`;
  if (data.nativeLogs.length > 0) {
    data.nativeLogs.slice(-30).forEach(log => {
      report += `[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${log.stage || 'Installer'}] Status: ${log.status} - Message: ${log.message}\n`;
    });
  } else {
    report += `No native PackageInstaller callback events recorded.\n`;
  }
  report += `\`\`\`\n`;

  return report;
}
