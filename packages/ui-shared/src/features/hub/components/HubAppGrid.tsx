import React from 'react';
import { type AppKey, NavigationDispatcher } from '@workspace/studio-core';

interface AppCardItem {
  key: AppKey;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
}

const APP_CARDS: AppCardItem[] = [
  { key: 'chordex', title: 'Chordex', subtitle: 'Chord Voicings & Progressions', color: '#a855f7', icon: 'music_note' },
  { key: 'drumex', title: 'Drumex', subtitle: 'Pattern Sequencer & Drum Kits', color: '#ec4899', icon: 'drum' },
  { key: 'stagex', title: 'Stagex', subtitle: 'Stage Canvas & Live Rig', color: '#3b82f6', icon: 'equalizer' },
  { key: 'groovex', title: 'Groovex', subtitle: 'Multi-Track Stem Player', color: '#10b981', icon: 'graphic_eq' },
  { key: 'vocalex', title: 'Vocalex', subtitle: 'Vocal Pitch & Lab Session', color: '#f59e0b', icon: 'mic' },
];

export function HubAppGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 12 }}>
      {APP_CARDS.map((app) => (
        <div
          key={app.key}
          onClick={() => NavigationDispatcher.push({ app: app.key })}
          style={{
            background: 'var(--c-surface-mid)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid var(--c-border)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'transform 150ms ease',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: app.color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {app.icon}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-primary)' }}>{app.title}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>{app.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
