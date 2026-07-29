import React from 'react';
import { PerformanceProfiler, type ProfilerMetrics } from '@workspace/studio-core';

interface DevToolsPerformanceTabProps {
  metrics?: ProfilerMetrics;
}

export function DevToolsPerformanceTab({ metrics }: DevToolsPerformanceTabProps) {
  const currentMetrics = metrics || PerformanceProfiler.getInstance().getMetrics();

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          background: 'var(--c-surface-mid)',
          borderRadius: 12,
          padding: 14,
          border: '1px solid var(--c-border)',
        }}
      >
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#3b82f6' }}>Profiler Metrics</h4>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <strong>Current FPS:</strong> {currentMetrics.currentFps}
          </div>
          <div>
            <strong>Average FPS:</strong> {currentMetrics.averageFps}
          </div>
          <div>
            <strong>Frame Time:</strong> {currentMetrics.frameTime} ms
          </div>
          <div>
            <strong>JS Heap Used:</strong> {currentMetrics.usedHeap}
          </div>
          <div>
            <strong>GPU Layers:</strong> {currentMetrics.gpuLayerCount}
          </div>
        </div>
      </div>
    </div>
  );
}
