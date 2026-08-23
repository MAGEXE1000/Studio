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
          transition={{ type: 'spring', stiffness: 420, damping: 25 }}
          style={{
            background: 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.04))',
            borderRadius: 20,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              '0 8px 24px rgba(0, 0, 0, 0.20), inset 0 1px 1.5px rgba(255, 255, 255, 0.12)',
            backdropFilter: 'var(--surface-topbar-blur, blur(24px) saturate(180%))',
            WebkitBackdropFilter: 'var(--surface-topbar-blur, blur(24px) saturate(180%))',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Chromatic Top Specular Highlight Rim */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 12,
              right: 12,
              height: '1px',
              background: 'var(--surface-glass-rim)',
              pointerEvents: 'none',
              opacity: 0.7,
            }}
          />

          {/* Ambient colored glow */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              right: -24,
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: app.color,
              opacity: 0.1,
              filter: 'blur(20px)', // token-guard-ignore
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${app.color}24 0%, ${app.color}0c 100%)`,
              border: `1px solid ${app.color}40`,
              color: app.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${app.color}22, inset 0 1px 1px rgba(255, 255, 255, 0.35)`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {app.icon}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              {app.title}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--c-text-secondary)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                opacity: 0.82,
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
