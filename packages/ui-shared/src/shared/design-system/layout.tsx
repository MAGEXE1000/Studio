import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
import { AnimatedAppHeader } from '../../features/hub/animations/AppAnimationSystem';
import { ProgressiveBlur } from './ProgressiveBlur';
// ── 5. Toolbar ─────────────────────────────────────────────────────────────
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
}

export function Toolbar({
  title,
  actions,
  children,
  style,
  className = '',
  ...props
}: ToolbarProps) {
  return (
    <div
      style={{
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid var(--c-border)`,
        backgroundColor: 'transparent',
        flexShrink: 0,
        ...style,
      }}
      className={`studio-toolbar ${className}`}
      {...props}
    >
      {title && (
        <span
          style={{
            fontSize: '15px',
            fontWeight: 800,
            fontFamily: 'var(--font-headline)',
            color: 'var(--c-text-primary)',
          }}
        >
          {title}
        </span>
      )}
      {children}
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  );
}

// ── 8. Header ──────────────────────────────────────────────────────────────
export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle, style, className = '', ...props }: HeaderProps) {
  return (
    <div style={{ padding: '16px', flexShrink: 0, ...style }} className={className} {...props}>
      <AnimatedAppHeader title={title} subtitle={subtitle} />
    </div>
  );
}

// ── 9. Screen ──────────────────────────────────────────────────────────────
export interface ScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean;
}

export function Screen({
  scrollable = true,
  children,
  style,
  className = '',
  ...props
}: ScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: scrollable ? 'auto' : 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        ...style,
      }}
      className={`studio-screen ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 10. Scaffold ───────────────────────────────────────────────────────────
export interface ScaffoldProps extends React.HTMLAttributes<HTMLDivElement> {
  toolbar?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  floatingButton?: React.ReactNode;
}

export function Scaffold({
  toolbar,
  bottomNavigation,
  floatingButton,
  children,
  style,
  className = '',
  ...props
}: ScaffoldProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
      className={`studio-scaffold ${className}`}
      {...props}
    >
      {toolbar}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
      {floatingButton && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            right: '20px',
            zIndex: 40,
          }}
        >
          {floatingButton}
        </div>
      )}
      {bottomNavigation}
    </div>
  );
}

// ── 11. Bottom Navigation ──────────────────────────────────────────────────
export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ children, style, className = '', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        style={{
          position: 'fixed',
          bottom: 'var(--nav-safe-bottom)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '448px',
          height: '60px',
          borderRadius: '2rem',
          border: `1px solid var(--c-border)`,
          background: 'transparent',
          boxShadow: 'var(--elevation-high)',
          zIndex: 50,
          overflow: 'hidden',
          transition: 'background-color 200ms ease, border-color 200ms ease',
          ...style,
        }}
        className={`studio-bottom-nav ${className}`}
        {...props}
      >
        {/* Flagship progressive blur background layer */}
        <ProgressiveBlur direction="bottom" blurLayers={6} maxBlur={24} style={{ zIndex: -2 }} />
        {/* Semi-transparent color overlay for theme matching */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--c-surface-glass-bg, rgba(26,26,30,0.45))',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
        {children}
      </nav>
    );
  }
);

BottomNavigation.displayName = 'BottomNavigation';

