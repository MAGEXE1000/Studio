import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
// ── 2. Card ────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentBorder?: boolean;
}

const isHoverable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

export function Card({
  interactive = false,
  accentBorder = false,
  children,
  style,
  className = '',
  ...props
}: CardProps) {
  const Component = (interactive ? motion.div : 'div') as any;
  const motionProps = interactive
    ? {
        whileHover: isHoverable
          ? { scale: 1.015, y: -2, boxShadow: 'var(--elevation-mid)' }
          : undefined,
        whileTap: { scale: 0.985, y: 0 },
        transition: SpringPresets.soft,
      }
    : {};

  return (
    <Component
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--c-surface-mid)',
        border: accentBorder ? `1.5px solid var(--c-accent-from)` : `1px solid var(--c-border)`,
        boxShadow: 'var(--elevation-low)',
        cursor: interactive ? 'pointer' : 'default',
        willChange: interactive ? 'transform, box-shadow' : 'auto',
        ...style,
      }}
      className={`studio-card ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}

// ── 3. Surface ─────────────────────────────────────────────────────────────
export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  level?: 'low' | 'mid' | 'high';
}

export function Surface({
  glass = false,
  level = 'mid',
  children,
  style,
  className = '',
  ...props
}: SurfaceProps) {
  const getBg = () => {
    if (glass) return 'var(--c-surface-glass-bg)';
    if (level === 'low') return 'var(--c-background)';
    if (level === 'high') return 'var(--c-surface-high)';
    return 'var(--c-surface-mid)';
  };

  return (
    <div
      style={{
        backgroundColor: getBg(),
        border: `1px solid var(--c-border)`,
        backdropFilter: glass ? 'var(--c-surface-glass-blur)' : 'none',
        WebkitBackdropFilter: glass ? 'var(--c-surface-glass-blur)' : 'none',
        color: 'var(--c-text-primary)',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        ...style,
      }}
      className={`studio-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

