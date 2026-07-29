import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
import AppSpinner from '../loading/AppSpinner';
import { Button } from './buttons';
// ── 14. Skeleton ───────────────────────────────────────────────────────────
export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({
  variant = 'rect',
  width = '100%',
  height = '16px',
  style,
  className = '',
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius:
          variant === 'circle'
            ? 'var(--radius-full)'
            : variant === 'text'
              ? 'var(--radius-xs)'
              : 'var(--radius-md)',
        backgroundColor: 'var(--c-surface-lowest)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 200ms ease',
        ...style,
      }}
      className={`studio-shimmer ${className}`}
    />
  );
}

// ── 15. Loading ────────────────────────────────────────────────────────────
export interface LoadingProps {
  statusText?: string;
  overlay?: boolean;
}

export function Loading({ statusText = 'Loading...', overlay = false }: LoadingProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <AppSpinner size={32} color="var(--c-accent-from)" />
      {statusText && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--c-text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {statusText}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--c-surface-glass-bg)',
          backdropFilter: 'var(--c-surface-glass-blur)',
          zIndex: 1000,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

// ── 16. Error ─────────────────────────────────────────────────────────────
export interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export function Error({ message, onRetry }: ErrorProps) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--c-error-container)',
        border: `1.5px solid var(--c-error-container)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center',
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
      className="studio-error-card"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '32px', color: 'var(--c-error)' }}
      >
        error
      </span>
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--c-error)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ── 17. Empty State ────────────────────────────────────────────────────────
export interface EmptyStateProps {
  message: string;
  icon?: string;
  description?: string;
}

export function EmptyState({ message, icon = 'folder_open', description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '48px',
          color: 'var(--c-text-secondary)',
          marginBottom: '8px',
          opacity: 0.5,
        }}
      >
        {icon}
      </span>
      <h3
        style={{
          margin: '0 0 4px',
          fontSize: '15px',
          fontWeight: 800,
          fontFamily: 'var(--font-headline)',
        }}
      >
        {message}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--c-text-secondary)',
            fontFamily: 'var(--font-body)',
            maxWidth: '280px',
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

