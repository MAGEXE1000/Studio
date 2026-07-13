// RootCauseAnalyzer.ts
import { SourceMapResolver } from './SourceMapResolver';
import { StartupCoordinator } from '../startup/startupCoordinator.js';

export interface RootCauseReport {
  severity: 'TRACE' | 'INFO' | 'OPTIMIZATION OPPORTUNITY' | 'RECOVERABLE ISSUE' | 'BUG' | 'CRITICAL';
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

  private static determineSeverity(
    duration: number,
    func: string,
    file: string,
    layoutDuration?: number,
    entryTitle?: string
  ): RootCauseReport['severity'] {
    if (!StartupCoordinator.isStartupComplete()) {
      return 'INFO';
    }

    if (layoutDuration && layoutDuration > 20) {
      return 'OPTIMIZATION OPPORTUNITY';
    }

    if (file.includes('framer-motion') || file.includes('zustand')) {
      return 'OPTIMIZATION OPPORTUNITY';
    }

    if (duration > 500) {
      return 'CRITICAL';
    }

    if (duration > 150) {
      return 'RECOVERABLE ISSUE';
    }

    if (duration > 50) {
      return 'OPTIMIZATION OPPORTUNITY';
    }

    return 'INFO';
  }

  public static async start() {
    if (typeof window === 'undefined' || !(window as any).__ENABLE_DIAGNOSTICS__) return;
    
    await SourceMapResolver.init();

    // Try to use the modern Long Animation Frames (LoAF) API (Chrome 123+)
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      try {
        this.observer = new PerformanceObserver(async (list) => {
          for (const entry of list.getEntries() as any[]) {
            await this.analyzeLoAFEntry(entry);
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

  private static async analyzeLoAFEntry(entry: any) {
    // A long animation frame might have multiple scripts that contributed to the delay
    if (entry.scripts && entry.scripts.length > 0) {
      for (const script of entry.scripts) {
        if (script.duration > 50) {
          const report = await this.buildReportFromScript(script, entry);
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
    const topComponent = activeComponents.length > 0 ? activeComponents[activeComponents.length - 1] : 'Unknown';
    
    // Determine reason/trigger
    let reason = 'Check application state';
    let trigger = 'UNKNOWN';
    if (topComponent !== 'Unknown') {
       reason = `Long task occurred while rendering ${topComponent}. See React Profiler logs.`;
       trigger = 'React Render/Commit Phase';
    } else {
       reason = 'Long task outside of React render cycle. Potentially a bridge call, timeout, or layout thrashing. Check Performance Timeline.';
    }

    const severity = this.determineSeverity(entry.duration, 'Unknown', 'Unknown', undefined, entry.name);

    const report: RootCauseReport = {
      severity,
      title: 'Long Task',
      durationMs: Math.round(entry.duration),
      sourceComponent: topComponent,
      sourceFunction: topComponent !== 'Unknown' ? 'Render/Commit' : 'Unknown',
      sourceFile: 'Unknown',
      sourceLine: 'N/A',
      callStack: topComponent !== 'Unknown' ? activeComponents : [],
      metrics: {
        jsExecution: Math.round(entry.duration),
        uiThread: Math.round(entry.duration),
      },
      trigger,
      dependencies: [],
      stateChanged: 'N/A',
      repeated: false,
      occurrences: 1,
      recommendation: reason
    };
    
    this.logReport(report);
  }

  private static async buildScriptTrace(script: any): Promise<{ file: string, func: string, line: string, stack: string[] }> {
    let file = script.sourceURL || 'UNKNOWN_FILE';
    let func = script.sourceFunctionName || 'anonymous';
    let line = script.sourceCharPosition ? `char ${script.sourceCharPosition}` : 'UNKNOWN_LINE';
    
    // Attempt source map resolution
    const resolved = await SourceMapResolver.resolve(file, script.sourceCharPosition || 0, 0, func);
    if (resolved.file !== file) {
      file = resolved.file;
      func = resolved.func;
      line = `Line ${resolved.line}`;
    } else {
      if (file.includes('node_modules')) {
        const parts = file.split('node_modules/');
        file = `node_modules/${parts[parts.length - 1]}`;
      } else if (file.includes('src/')) {
        const parts = file.split('src/');
        file = `src/${parts[parts.length - 1]}`;
      }
    }

    const stack = [func];
    if (script.invoker) {
      stack.push(script.invoker);
    }

    return { file, func, line, stack };
  }

  private static async buildReportFromScript(script: any, entry: any): Promise<RootCauseReport> {
    const trace = await this.buildScriptTrace(script);
    
    // Attempt to figure out the React component if it's a React render script
    let component = 'Unknown';
    if (trace.func.startsWith('renderWithHooks') || trace.func.startsWith('updateFunctionComponent') || trace.func.startsWith('commitMutationEffects')) {
      const activeComponents = (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ || [];
      if (activeComponents.length > 0) {
        component = activeComponents[activeComponents.length - 1];
      } else {
        component = 'React Internals';
      }
    }

    const severity = this.determineSeverity(script.duration, trace.func, trace.file, script.forcedStyleAndLayoutDuration, 'Long Task');

    return {
      severity,
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
    const activeComponents = (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ || [];
    const topComponent = activeComponents.length > 0 ? activeComponents[activeComponents.length - 1] : 'Unknown';

    const severity = this.determineSeverity(duration, 'Deferred Async Paint/Layout', 'Attribution impossible (Browser engine batches Layout asynchronously)', entry.renderStart ? Math.round(Math.max(0, (entry.startTime + entry.duration) - entry.renderStart)) : undefined, title);

    return {
      severity,
      title,
      durationMs: Math.round(duration),
      sourceComponent: topComponent,
      sourceFunction: 'Deferred Async Paint/Layout',
      sourceFile: 'Attribution impossible (Browser engine batches Layout asynchronously)',
      sourceLine: 'Unknown',
      callStack: [],
      metrics: {
        uiThread: Math.round(duration),
        layoutDuration: entry.renderStart ? Math.round(Math.max(0, (entry.startTime + entry.duration) - entry.renderStart)) : undefined
      },
      trigger: 'Browser Render Pipeline',
      dependencies: [],
      stateChanged: 'N/A',
      repeated: false,
      occurrences: 1,
      recommendation: 'Check DOM size, CSS complexity, or unoptimized image rendering (possibly originating from ' + topComponent + ').'
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

    const msg = `------------------------------------------
Title
${report.title}
Severity
${report.severity}
Classification
${report.severity}
Studio subsystem
RootCauseAnalyzer
React component
${report.sourceComponent}
Component hierarchy
${report.callStack.join(' > ') || 'Unknown'}
Source file
${report.sourceFile}
Source line
${report.sourceLine}
Hook
N/A
Function
${report.sourceFunction}
Store involved
N/A
Store mutation
N/A
Navigation route
N/A
Trigger
${report.trigger}
Previous value
N/A
Current value
N/A
Render count
${report.metrics.componentRenderCount || 'N/A'}
Layout count
${report.metrics.layoutDuration !== undefined ? 1 : 'N/A'}
Paint count
1
JS execution time
${report.metrics.jsExecution || report.durationMs}ms
Layout time
${report.metrics.layoutDuration !== undefined ? report.metrics.layoutDuration + 'ms' : 'N/A'}
Paint time
Unknown
Total duration
${report.durationMs}ms
Expected?
NO
Root cause
${report.recommendation}
Recommendation
${report.recommendation}
------------------------------------------`;

    console.warn(msg);
  }

  public static stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
