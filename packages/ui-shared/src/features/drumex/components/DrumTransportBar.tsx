import React from 'react';

interface DrumTransportBarProps {
  isPlaying: boolean;
  bpm: number;
  onTogglePlay: () => void;
  onChangeBpm: (bpm: number) => void;
}

export function DrumTransportBar({ isPlaying, bpm, onTogglePlay, onChangeBpm }: DrumTransportBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--c-surface-high)',
        borderRadius: 12,
        border: '1px solid var(--c-border)',
        marginBottom: 12,
      }}
    >
      <button
        onClick={onTogglePlay}
        style={{
          padding: '8px 18px',
          borderRadius: 20,
          background: isPlaying ? '#ef4444' : '#10b981',
          color: '#ffffff',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)' }}>BPM:</span>
        <input
          type="number"
          value={bpm}
          min={40}
          max={240}
          onChange={(e) => onChangeBpm(Number(e.target.value))}
          style={{
            width: 60,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'var(--c-surface-mid)',
            border: '1px solid var(--c-border)',
            color: 'var(--c-text-primary)',
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
          }}
        />
      </div>
    </div>
  );
}
