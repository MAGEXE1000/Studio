import React from 'react';

interface StageDiagnosticsOverlayProps {
  safeMode: boolean;
  setSafeMode: (val: boolean) => void;
  logDiagnostic: (msg: string) => void;
  testActive: boolean;
  testCycle: number;
  testStep: string;
  runInteractionTest: () => void;
  diagTaps: {
    bottomNav: number;
    plus: number;
    eye: number;
    picker: number;
    toolbar: number;
    sentMsgs: number;
    recvMsgs: number;
  };
  setDiagTaps: (taps: any) => void;
  lastDiagLog: string;
}

export const StageDiagnosticsOverlay: React.FC<StageDiagnosticsOverlayProps> = ({
  safeMode,
  setSafeMode,
  logDiagnostic,
  testActive,
  testCycle,
  testStep,
  runInteractionTest,
  diagTaps,
  setDiagTaps,
  lastDiagLog,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'env(safe-area-inset-top)',
        left: 8,
        right: 8,
        background: 'rgba(12,12,14,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 12,
        zIndex: 99999,
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#40c057',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        maxHeight: '40vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 6,
        }}
      >
        <span style={{ fontWeight: 800, color: '#fff' }}>STAGEX DIAGNOSTICS</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              const next = !safeMode;
              setSafeMode(next);
              localStorage.setItem('stagex_safe_mode_enabled', next ? 'true' : 'false');
              logDiagnostic(`[Safe Mode] ${next ? 'ENABLED' : 'DISABLED'}`);
            }}
            style={{
              padding: '3px 6px',
              background: safeMode ? '#e63946' : '#2a2a30',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 8,
              cursor: 'pointer',
            }}
          >
            {safeMode ? 'Disable Safe Mode' : 'Enable Safe Mode'}
          </button>
          <button
            onClick={runInteractionTest}
            disabled={testActive}
            style={{
              padding: '3px 6px',
              background: testActive ? '#ffb703' : '#3b5bdb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 8,
              cursor: 'pointer',
            }}
          >
            {testActive ? `Cycle ${testCycle} (${testStep})` : 'Run Test'}
          </button>
          <button
            onClick={() =>
              setDiagTaps({
                bottomNav: 0,
                plus: 0,
                eye: 0,
                picker: 0,
                toolbar: 0,
                sentMsgs: 0,
                recvMsgs: 0,
              })
            }
            style={{
              padding: '3px 6px',
              background: '#495057',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 8,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          background: 'rgba(0,0,0,0.3)',
          padding: 6,
          borderRadius: 8,
        }}
      >
        <div>Nav: {diagTaps.bottomNav}</div>
        <div>Plus: {diagTaps.plus}</div>
        <div>Eye: {diagTaps.eye}</div>
        <div>Pick: {diagTaps.picker}</div>
        <div>Tool: {diagTaps.toolbar}</div>
        <div>Sent: {diagTaps.sentMsgs}</div>
        <div>Recv: {diagTaps.recvMsgs}</div>
        <div style={{ color: safeMode ? '#ff6b6b' : '#a0a0a5' }}>
          Safe: {safeMode ? 'ON' : 'OFF'}
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          maxHeight: '18vh',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.5)',
          padding: 6,
          borderRadius: 6,
        }}
      >
        {lastDiagLog}
      </pre>
    </div>
  );
};
