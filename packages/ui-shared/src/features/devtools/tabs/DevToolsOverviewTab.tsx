import React from 'react';
import { APP_VERSION_LABEL, NATIVE_VERSION } from '@workspace/studio-core';

interface DevToolsOverviewTabProps {
  accentFrom: string;
}

export function DevToolsOverviewTab({ accentFrom }: DevToolsOverviewTabProps) {
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
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: accentFrom }}>Application Overview</h4>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <strong>Web Version:</strong> {APP_VERSION_LABEL}
          </div>
          <div>
            <strong>Native Version:</strong> {NATIVE_VERSION}
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
          </div>
        </div>
      </div>
    </div>
  );
}
