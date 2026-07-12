// RootCauseAnalyzer.ts

export interface RootCauseReport {
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  durationMs: number;
  sourceComponent: string;
  sourceFunction: string;
  sourceFile: string;
  sourceLine: string;
  callStack: string[];
  metrics: {
    componentRenderCount?: number;
    renderDuration?: number;
    layoutDuration?: number;
    paintDuration?: number;
    jsExecution?: number;
    uiThread?: number;
    cpuUsage?: number;
    memoryDelta?: string;
  };
  trigger: string;
  dependencies: string[];
  stateChanged: string;
  repeated: boolean;
  occurrences: number;
  recommendation: string;
}

export class RootCauseAnalyzer {
  private static observer: PerformanceObserver | null = null;
  private static reports: RootCauseReport[] = [];

  public static start() {
    if (typeof window === 'undefined' || !(window as any).__ENABLE_DIAGNOSTICS__) return;
    
    // Try to use the modern Long Animation Frames (LoAF) API (Chrome 123+)
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            this.analyzeLoAFEntry(entry);
          }
        });
        this.observer.observe({ type: 'long-animation-frame', buffered: true });
      } catch (e) {
        console.warn('[RootCauseAnalyzer] LoAF initialization failed:', e);
        this.fallbackToLongTask();
      }
    } else {
      this.fallbackToLongTask();
    }
  }

  private static fallbackToLongTask() {
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.analyzeLongTaskEntry(entry);
          }
        });
        this.observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('[RootCauseAnalyzer] LongTask initialization failed:', e);
      }
    }
  }

  private static analyzeLoAFEntry(entry: any) {
    // A long animation frame might have multiple scripts that contributed to the delay
    if (entry.scripts && entry.scripts.length > 0) {
      for (const script of entry.scripts) {
        if (script.duration > 50) {
          const report = this.buildReportFromScript(script, entry);
          this.logReport(report);
        }
      }
    } else {
      // No script attribution, meaning it's likely a heavy layout/paint
      const report = this.buildGenericReport('Heavy Layout/Paint', entry.duration, entry);
      this.logReport(report);
    }
  }

  private static analyzeLongTaskEntry(entry: PerformanceEntry) {
    // Basic longtask API doesn't give us much attribution. We use heuristics.
    const activeComponents = (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ || [];
    const topComponent = activeComponents.length > 0 ? activeComponents[activeComponents.length - 1] : 'UNKNOWN_COMPONENT';
    
    const report: RootCauseReport = {
      severity: entry.duration > 150 ? 'Critical' : 'Warning',
      title: 'Long Task',
      durationMs: Math.round(entry.duration),
      sourceComponent: topComponent,
      sourceFunction: 'UNKNOWN_ROOT_CAUSE (Update WebView for LoAF support)',
      sourceFile: 'N/A',
      sourceLine: 'N/A',
      callStack: ['UNKNOWN_ROOT_CAUSE', 'active_component: ' + topComponent],
      metrics: {
        jsExecution: Math.round(entry.duration),
      },
      trigger: 'UNKNOWN',
      dependencies: [],
      stateChanged: 'N/A',
      repeated: false,
      occurrences: 1,
      recommendation: 'Update WebView to version 123+ for deep script tracing, or profile manually in Chrome DevTools.'
    };
    
    this.logReport(report);
  }

  private static buildScriptTrace(script: any): { file: string, func: string, line: string, stack: string[] } {
    let file = script.sourceURL || 'UNKNOWN_FILE';
    const func = script.sourceFunctionName || 'anonymous';
    const line = script.sourceCharPosition ? `char ${script.sourceCharPosition}` : 'UNKNOWN_LINE';
    
    if (file.includes('node_modules')) {
      const parts = file.split('node_modules/');
      file = `node_modules/${parts[parts.length - 1]}`;
    } else if (file.includes('src/')) {
      const parts = file.split('src/');
      file = `src/${parts[parts.length - 1]}`;
    }

    const stack = [func];
    if (script.invoker) {
      stack.push(script.invoker);
    }

    return { file, func, line, stack };
  }

  private static buildReportFromScript(script: any, entry: any): RootCauseReport {
    const trace = this.buildScriptTrace(script);
    
    // Attempt to figure out the React component if it's a React render script
    let component = 'UNKNOWN';
    if (trace.func.startsWith('renderWithHooks') || trace.func.startsWith('updateFunctionComponent')) {
      component = 'React Internals (Check React Profiler report)';
    }

    return {
      severity: script.duration > 150 ? 'Critical' : 'Warning',
      title: 'Long Task',
      durationMs: Math.round(script.duration),
      sourceComponent: component,
      sourceFunction: trace.func,
      sourceFile: trace.file,
      sourceLine: trace.line,
      callStack: trace.stack,
      metrics: {
        jsExecution: Math.round(script.executionStart ? (script.executionStart + script.duration - script.startTime) : script.duration),
        uiThread: Math.round(entry.duration),
        layoutDuration: Math.round(script.forcedStyleAndLayoutDuration || 0)
      },
      trigger: script.invokerType || 'UNKNOWN',
      dependencies: [],
      stateChanged: 'N/A',
      repeated: false,
      occurrences: 1,
      recommendation: this.generateRecommendation(trace.func, trace.file, script.forcedStyleAndLayoutDuration)
    };
  }

  private static buildGenericReport(title: string, duration: number, entry: any): RootCauseReport {
    return {
      severity: duration > 150 ? 'Critical' : 'Warning',
      title,
      durationMs: Math.round(duration),
      sourceComponent: 'UNKNOWN',
      sourceFunction: 'UNKNOWN',
      sourceFile: 'UNKNOWN',
      sourceLine: 'UNKNOWN',
      callStack: [],
      metrics: {
        uiThread: Math.round(duration),
        layoutDuration: entry.renderStart ? (entry.duration - entry.renderStart) : undefined
      },
      trigger: 'UNKNOWN',
      dependencies: [],
      stateChanged: 'N/A',
      repeated: false,
      occurrences: 1,
      recommendation: 'Check DOM size, CSS complexity, or unoptimized image rendering.'
    };
  }

  private static generateRecommendation(func: string, file: string, layoutDuration?: number): string {
    if (layoutDuration && layoutDuration > 20) {
      return 'Heavy Forced Synchronous Layout detected (Layout Thrashing). Batch DOM reads and writes, avoid reading offsetHeight/clientWidth inside loops.';
    }
    if (file.includes('framer-motion')) {
      return 'Framer Motion overhead detected. Avoid \`useInView\` polling, and prefer native CSS transitions for simple animations.';
    }
    if (file.includes('zustand')) {
      return 'Zustand store update caused a massive render cascade. Use atomic selectors (\`useStore(state => state.property)\`) instead of subscribing to the entire store object.';
    }
    if (func === 'JSON.parse' || func === 'JSON.stringify') {
      return 'Synchronous JSON operation blocked the thread. Move to a WebWorker or chunk the parsing.';
    }
    return 'Memoize expensive calculations, split the component into smaller chunks, or move synchronous computation to a WebWorker.';
  }

  private static logReport(report: RootCauseReport) {
    this.reports.push(report);
    if (this.reports.length > 100) this.reports.shift(); // Keep buffer small

    const stackStr = report.callStack.join('\n↓\n');
    const msg = `
--------------------------------
Warning
${report.title}
Duration
${report.durationMs} ms
Severity
${report.severity}
Root Cause
${report.sourceComponent}
File
${report.sourceFile}
Function
${report.sourceFunction}
Line
${report.sourceLine}

Call Stack
${stackStr}

Component Render Count
${report.metrics.componentRenderCount || 'N/A'}
Render Duration
${report.metrics.renderDuration !== undefined ? report.metrics.renderDuration + ' ms' : 'N/A'}
Layout Duration
${report.metrics.layoutDuration !== undefined ? report.metrics.layoutDuration + ' ms' : 'N/A'}
JS Execution
${report.metrics.jsExecution || 0} ms
UI Thread
${report.metrics.uiThread || 0} ms

Trigger
${report.trigger}
Recommendation
${report.recommendation}
===========================================`;

    console.warn(msg);
  }

  public static stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
