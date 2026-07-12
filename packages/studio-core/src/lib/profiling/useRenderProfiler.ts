import { useEffect, useRef } from 'react';

const globalRenderStats = new Map<string, { count: number, reasons: Set<string>, lastProps: any, lastState: any }>();

if (typeof window !== 'undefined') {
  (window as any).dumpRenderReport = () => {
    console.log('=== RENDER REPORT ===');
    const sorted = Array.from(globalRenderStats.entries()).sort((a, b) => b[1].count - a[1].count);
    sorted.forEach(([name, stats], index) => {
      console.log(`${index + 1}. [${name}] Renders: ${stats.count} | Reasons: ${Array.from(stats.reasons).join(' | ')}`);
    });
    console.log('=====================');
    return sorted;
  };
}

export function useRenderProfiler(componentName: string, props: any = {}, state: any = {}) {
  const renderCount = useRef(0);
  const prevProps = useRef<any>(props);
  const prevState = useRef<any>(state);

  renderCount.current++;

  useEffect(() => {
    let stats = globalRenderStats.get(componentName);
    if (!stats) {
      stats = { count: 0, reasons: new Set(), lastProps: props, lastState: state };
      globalRenderStats.set(componentName, stats);
    }
    stats.count++;

    const changedProps = Object.keys(props).filter(
      (key) => prevProps.current[key] !== props[key]
    );
    const changedState = Object.keys(state).filter(
      (key) => prevState.current[key] !== state[key]
    );

    let reason = 'Initial Render';
    if (renderCount.current > 1) {
      if (changedProps.length > 0 || changedState.length > 0) {
        reason = `Props: ${changedProps.join(', ')} | State: ${changedState.join(', ')}`;
      } else {
        reason = 'Force Update or Context Change';
      }
    }
    stats.reasons.add(reason);
    
    if (renderCount.current > 1 && (changedProps.length > 0 || changedState.length > 0)) {
      console.info(
        `[RenderProfiler] [${componentName}] Rerender #${renderCount.current} | ` + reason
      );
    } else if (renderCount.current > 1) {
      console.info(
        `[RenderProfiler] [${componentName}] Rerender #${renderCount.current} | Force Update or Context Change`
      );
    }

    prevProps.current = props;
    prevState.current = state;
  });
}
