import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const reportHelpers = `
  // Unified Diagnostics Generators for Copy Buttons
  const buildCopyEverythingReport = () => {
    const timestamp = new Date().toISOString();
    let text = \`====================================================\\n\`;
    text += \`STUDIO DEVELOPER DIAGNOSTICS REPORT\\n\`;
    text += \`Generated: \${timestamp}\\n\`;
    text += \`App Version: v\${APP_VERSION}\\n\`;
    text += \`====================================================\\n\\n\`;

    text += \`========================\\nLogs (\${logs.length})\\n========================\\n\`;
    if (logs.length > 0) {
      logs.forEach((l) => {
        text += \`[\${new Date(l.timestamp).toLocaleTimeString()}] [\${l.level.toUpperCase()}] [\${l.module}] \${l.message}\\n\`;
      });
    } else {
      text += \`No log entries recorded.\\n\`;
    }
    text += \`\\n\`;

    const warnings = logs.filter((l) => l.level === 'warn');
    text += \`========================\\nWarnings (\${warnings.length})\\n========================\\n\`;
    if (warnings.length > 0) {
      warnings.forEach((l) => {
        text += \`[\${new Date(l.timestamp).toLocaleTimeString()}] [\${l.module}] \${l.message}\\n\`;
      });
    } else {
      text += \`No warnings recorded.\\n\`;
    }
    text += \`\\n\`;

    text += \`========================\\nErrors (\${errors.length})\\n========================\\n\`;
    if (errors.length > 0) {
      errors.forEach((e) => {
        text += \`[\${new Date(e.timestamp).toLocaleTimeString()}] [\${e.module}] \${e.message}\\n\`;
        if (e.stack) text += \`Stack: \${e.stack}\\n\`;
      });
    } else {
      text += \`No errors recorded.\\n\`;
    }
    text += \`\\n\`;

    text += \`========================\\nEvents (\${events.length})\\n========================\\n\`;
    if (events.length > 0) {
      events.forEach((evt) => {
        text += \`[\${new Date(evt.timestamp).toLocaleTimeString()}] [\${evt.module}] \${evt.type} on <\${evt.target}>\\n\`;
      });
    } else {
      text += \`No user events recorded.\\n\`;
    }
    text += \`\\n\`;

    text += \`========================\\nSystem & Environment\\n========================\\n\`;
    text += \`User Agent: \${navigator.userAgent}\\n\`;
    text += \`Platform: \${navigator.platform}\\n\`;
    text += \`Screen: \${window.screen.width}x\${window.screen.height} (\${window.devicePixelRatio}x DPR)\\n\`;
    text += \`Viewport: \${window.innerWidth}x\${window.innerHeight}\\n\\n\`;

    text += \`========================\\nPerformance Metrics\\n========================\\n\`;
    if (perf.size > 0) {
      perf.forEach((v, k) => {
        text += \`\${k}: \${v.renders} renders, \${v.mounts} mounts, last render \${v.lastRenderTime}ms\\n\`;
      });
    } else {
      text += \`No performance profiler stats recorded.\\n\`;
    }

    return text;
  };

  const buildCopySectionReport = () => {
    let title = 'Logs';
    let text = '';
    if (activeTab === 'logs') {
      title = \`Logs (\${logLevelFilter})\`;
      text = filteredLogs.map((l) => \`[\${new Date(l.timestamp).toLocaleTimeString()}] [\${l.level.toUpperCase()}] [\${l.module}] \${l.message}\`).join('\\n');
    } else if (activeTab === 'errors') {
      title = 'Errors';
      text = errors.map((e) => \`[\${new Date(e.timestamp).toLocaleTimeString()}] [\${e.module}] \${e.message}\\n\${e.stack || ''}\`).join('\\n');
    } else if (activeTab === 'events') {
      title = 'Events';
      text = events.map((e) => \`[\${new Date(e.timestamp).toLocaleTimeString()}] [\${e.module}] \${e.type} -> \${e.target}\`).join('\\n');
    }
    return \`========================\\n\${title}\\n========================\\n\` + (text || 'No data recorded.');
  };

  const buildPerformanceReport = () => {
    const profiler = PerformanceProfiler.getInstance();
    const metrics = perfMetrics || profiler.getMetrics();
    const warnings = profiler.getWarnings(metrics);

    let text = \`========================\\nPerformance Diagnostics\\n========================\\n\`;
    text += \`Average FPS: \${metrics.averageFps}\\n\`;
    text += \`1% Low FPS: \${metrics.low1PercentFps}\\n\`;
    text += \`JS Thread Avg Delay: \${metrics.jsThreadAverage}ms (Peak: \${metrics.jsThreadPeak}ms)\\n\`;
    text += \`UI Thread Paint: \${metrics.uiThreadAverage}ms (Peak: \${metrics.uiThreadPeak}ms)\\n\`;
    text += \`Active Component Renders:\\n\`;
    if (perf.size > 0) {
      perf.forEach((v, k) => {
        text += \` - \${k}: \${v.renders} renders, \${v.mounts} mounts\\n\`;
      });
    } else {
      text += \` - None recorded\\n\`;
    }
    if (warnings.length > 0) {
      text += \`\\nActive Warnings:\\n\`;
      warnings.forEach((w) => {
        text += \` - [\${w.severity}] \${w.title}: \${w.description}\\n\`;
      });
    }
    return text;
  };

  const buildNetworkReport = () => {
    let text = \`========================\\nNetwork Sniffer Log\\n========================\\n\`;
    if (network.length > 0) {
      network.forEach((req) => {
        text += \`[\${new Date(req.timestamp).toLocaleTimeString()}] \${req.method} \${req.url} -> Status: \${req.status || 'Pending'} (\${req.statusText || ''})\\n\`;
      });
    } else {
      text += \`No network traffic recorded.\\n\`;
    }
    return text;
  };

  const buildSystemReport = () => {
    let text = \`========================\\nSystem Diagnostics\\n========================\\n\`;
    text += \`App Version: \${APP_VERSION}\\n\`;
    text += \`Native Version: \${Capacitor.isNativePlatform() ? NATIVE_VERSION : 'Web Portal'}\\n\`;
    text += \`User Agent: \${navigator.userAgent}\\n\`;
    text += \`Platform: \${navigator.platform}\\n\`;
    text += \`Screen: \${window.screen.width}x\${window.screen.height} (\${window.devicePixelRatio}x DPR)\\n\`;
    text += \`Viewport: \${window.innerWidth}x\${window.innerHeight}\\n\`;
    text += \`Active Module: \${currentApp}\\n\`;
    text += \`Theme: \${settings.theme} (\${settings.accentColor})\\n\`;
    return text;
  };

  const buildStorageReport = () => {
    let text = \`========================\\nStorage Diagnostics\\n========================\\n\`;
    text += \`LocalStorage Keys Count: \${localStorage.length}\\n\\n\`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        text += \`[\${k}]: \${maskSensitiveValue(k, localStorage.getItem(k) || '')}\\n\`;
      }
    }
    return text;
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
`;

// Insert reportHelpers right before renderSubViewHeader
const subViewHeaderIdx = content.indexOf('const renderSubViewHeader =');
if (subViewHeaderIdx !== -1) {
  content = content.substring(0, subViewHeaderIdx) + reportHelpers + '\n\n' + content.substring(subViewHeaderIdx);
  console.log('✓ Added diagnostic report generators and unified renderCopyButton');
} else {
  console.log('❌ Could not locate renderSubViewHeader');
}

fs.writeFileSync(filePath, content, 'utf8');
