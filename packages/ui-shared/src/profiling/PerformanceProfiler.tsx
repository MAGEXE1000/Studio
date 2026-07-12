import React, { Profiler, type ProfilerOnRenderCallback } from 'react';

export function PerformanceProfiler({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const onRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.info(
      `[ReactProfiler] [${profilerId}] ${phase} | ` +
        `actualDuration: ${actualDuration.toFixed(2)}ms | ` +
        `baseDuration: ${baseDuration.toFixed(2)}ms | ` +
        `commitTime: ${commitTime}`
    );
  };

  return <Profiler id={id} onRender={onRender}>{children}</Profiler>;
}
