import { useEffect, useRef } from 'react';

export function useRenderProfiler(componentName: string, props: any = {}, state: any = {}) {
  const renderCount = useRef(0);
  const prevProps = useRef<any>(props);
  const prevState = useRef<any>(state);

  renderCount.current++;

  useEffect(() => {
    const changedProps = Object.keys(props).filter(
      (key) => prevProps.current[key] !== props[key]
    );
    const changedState = Object.keys(state).filter(
      (key) => prevState.current[key] !== state[key]
    );

    if (renderCount.current > 1 && (changedProps.length > 0 || changedState.length > 0)) {
      console.info(
        `[RenderProfiler] [${componentName}] Rerender #${renderCount.current} | ` +
          `Changed Props: ${changedProps.join(', ')} | ` +
          `Changed State: ${changedState.join(', ')}`
      );
    } else if (renderCount.current > 1) {
      console.info(
        `[RenderProfiler] [${componentName}] Rerender #${renderCount.current} | Force Update or Context Change`
      );
    } else {
      console.info(`[RenderProfiler] [${componentName}] Initial Render`);
    }

    prevProps.current = props;
    prevState.current = state;
  });
}
