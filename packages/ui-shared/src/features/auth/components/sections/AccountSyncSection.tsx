import React from 'react';

interface AccountSyncSectionProps {
  phase: string;
  lastSyncedAt: number | null;
  onSyncTrigger: () => void;
}

export function AccountSyncSection({ phase, lastSyncedAt, onSyncTrigger }: AccountSyncSectionProps) {
  const syncDateStr = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Never';

  return (
    <div
      style={{
        background: 'var(--c-surface-mid)',
        borderRadius: 12,
        padding: 14,
        border: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)' }}>Cloud Sync</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
          Status: {phase} | Last sync: {syncDateStr}
        </div>
      </div>
      <button
        onClick={onSyncTrigger}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: 'var(--c-surface-high)',
          border: '1px solid var(--c-border)',
          color: 'var(--c-text-primary)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Sync Now
      </button>
    </div>
  );
}
