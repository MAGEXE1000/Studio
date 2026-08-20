import React from 'react';
import { type AppKey, NavigationDispatcher } from '@workspace/studio-core';
import { motion } from 'motion/react';

interface AppCardItem {
  key: AppKey;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
}

const APP_CARDS: AppCardItem[] = [
  {
    key: 'chordex',
    title: 'Chordex',
    subtitle: 'Chord Voicings & Progressions',
    color: '#a855f7',
    icon: 'music_note',
  },
  {
    key: 'drumex',
    title: 'Drumex',
    subtitle: 'Pattern Sequencer & Drum Kits',
    color: '#ec4899',
    icon: 'drum',
  },
  {
    key: 'stagex',
    title: 'Stagex',
    subtitle: 'Stage Canvas & Live Rig',
    color: '#3b82f6',
    icon: 'equalizer',
  },
  {
    key: 'groovex',
    title: 'Groovex',
    subtitle: 'Multi-Track Stem Player',
    color: '#10b981',
    icon: 'graphic_eq',
  },
  {
    key: 'vocalex',
    title: 'Vocalex',
    subtitle: 'Vocal Pitch & Lab Session',
    color: '#f59e0b',
    icon: 'mic',
  },
];

export function HubAppGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        padding: 'var(--space-3)',
      }}
    >
      {APP_CARDS.map((app) => (
        <motion.div
          key={app.key}
          onClick={() => NavigationDispatcher.push({ app: app.key })}
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            background: 'var(--c-surface-glass-bg, rgba(255, 255, 255, 0.04))',
            borderRadius: 20,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              '0 8px 24px rgba(0, 0, 0, 0.20), inset 0 1px 1.5px rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient colored glow */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: app.color,
              opacity: 0.12,
              filter: 'blur(20px)', // token-guard-ignore
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${app.color} 0%, ${app.color}cc 100%)`,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${app.color}40, inset 0 1px 1px rgba(255, 255, 255, 0.40)`,
              border: '1px solid rgba(255, 255, 255, 0.20)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {app.icon}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--c-text-primary)',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {app.title}
            </div>
            <div
              style={{
                fontSize: 'var(--font-section-label)',
                color: 'var(--c-text-secondary)',
                fontFamily: 'Inter, sans-serif',
                opacity: 0.85,
                lineHeight: 1.3,
              }}
            >
              {app.subtitle}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
