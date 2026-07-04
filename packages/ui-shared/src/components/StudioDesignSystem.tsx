import { useChordStore, ACCENT_COLORS, type AppKey } from '@workspace/studio-core';
import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedAppHeader } from './AppAnimationSystem';
import AppSpinner from './AppSpinner';

// ── Theme Hook (Left for backwards-compat) ─────────────────────────────────
export function useStudioDesignSystem() {
  const settings = useChordStore(s => s.settings);
  const appKey = (settings.appMode ?? 'hub') as AppKey;
  const activeVis = settings.perApp?.[appKey] ?? {
    theme: settings.theme ?? 'dark',
    accentColor: settings.accentColor ?? 'blue',
    amoledMode: settings.amoledMode ?? false,
  };
  const accent = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
  return { isLight, activeVis, accent };
}

// ── 1. Button ──────────────────────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  style,
  className = '',
  disabled,
  ...props
}, ref) => {
  const getColors = () => {
    if (variant === 'primary') {
      return {
        bg: 'var(--c-accent-from)',
        text: '#ffffff',
        border: 'transparent'
      };
    }
    if (variant === 'danger') {
      return {
        bg: 'var(--c-error-container)',
        text: 'var(--c-error)',
        border: 'var(--c-error-container)'
      };
    }
    if (variant === 'ghost') {
      return {
        bg: 'transparent',
        text: 'var(--c-text-primary)',
        border: 'transparent'
      };
    }
    return {
      bg: 'var(--c-surface-high)',
      text: 'var(--c-text-primary)',
      border: 'var(--c-border)'
    };
  };

  const colors = getColors();
  const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '10px 18px';
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';

  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      style={{
        padding: pad,
        fontSize,
        fontFamily: 'var(--font-headline)',
        fontWeight: 700,
        borderRadius: 'var(--radius-md)',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1.5px solid ${colors.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        ...style
      }}
      disabled={disabled || loading}
      className={`btn-smooth ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '1.2em' }}>progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined" style={{ fontSize: '1.3em' }}>{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

// ── 2. Card ────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentBorder?: boolean;
}

export function Card({
  interactive = false,
  accentBorder = false,
  children,
  style,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--c-surface-mid)',
        border: accentBorder
          ? `1.5px solid var(--c-accent-from)`
          : `1px solid var(--c-border)`,
        boxShadow: 'var(--elevation-low)',
        transition: 'transform 180ms ease, border-color 180ms ease, background-color 180ms ease',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      className={`studio-card ${className}`}
      {...props}
    >
      {children}
    </div>
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
        ...style
      }}
      className={`studio-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 4. Dialog ──────────────────────────────────────────────────────────────
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--c-surface-highest)',
              borderRadius: 'var(--radius-2xl)',
              border: `1px solid var(--c-border)`,
              boxShadow: 'var(--elevation-high)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              transition: 'background-color 200ms ease, border-color 200ms ease'
            }}
          >
            {title && (
              <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--c-border)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--c-text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            )}
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '13px', lineHeight: 1.5, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-body)' }}>
              {children}
            </div>

            {footer && (
              <div style={{ padding: '12px 20px', borderTop: `1px solid var(--c-border)`, backgroundColor: 'var(--c-surface-lowest)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

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
        ...style
      }}
      className={`studio-toolbar ${className}`}
      {...props}
    >
      {title && (
        <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-headline)', color: 'var(--c-text-primary)' }}>
          {title}
        </span>
      )}
      {children}
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  );
}

// ── 6. Input ───────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  desc?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  desc,
  error,
  style,
  className = '',
  ...props
}, ref) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-headline)' }}>
          {label}
        </span>
      )}
      <input
        ref={ref}
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          backgroundColor: 'var(--c-surface-lowest)',
          border: `1.5px solid ${error ? 'var(--c-error)' : 'var(--c-border)'}`,
          color: 'var(--c-text-primary)',
          outline: 'none',
          transition: 'border-color 180ms ease, background-color 180ms ease, color 180ms ease',
          ...style
        }}
        className={`studio-input ${className}`}
        {...props}
      />
      {desc && !error && (
        <span style={{ fontSize: '10px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-body)' }}>{desc}</span>
      )}
      {error && (
        <span style={{ fontSize: '10px', color: 'var(--c-error)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ── 7. Sheet ───────────────────────────────────────────────────────────────
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  children
}: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)'
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--c-surface-highest)',
              borderTopLeftRadius: 'var(--radius-3xl)',
              borderTopRightRadius: 'var(--radius-3xl)',
              border: `1px solid var(--c-border)`,
              borderBottom: 'none',
              boxShadow: 'var(--elevation-high)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
              transition: 'background-color 200ms ease, border-color 200ms ease'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--c-border)' }} />
            </div>

            {title && (
              <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--c-text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            )}

            <div style={{ padding: '0 20px 20px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── 8. Header ──────────────────────────────────────────────────────────────
export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

export function Header({
  title,
  subtitle,
  style,
  className = '',
  ...props
}: HeaderProps) {
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
        ...style
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
        ...style
      }}
      className={`studio-scaffold ${className}`}
      {...props}
    >
      {toolbar}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
      {floatingButton && (
        <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 80px)', right: '20px', zIndex: 40 }}>
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

export const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(({
  children,
  style,
  className = '',
  ...props
}, ref) => {
  return (
    <nav
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 'var(--nav-safe-bottom)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '88%',
        maxWidth: '360px',
        height: '56px',
        borderRadius: 'var(--radius-3xl)',
        border: `1px solid var(--c-border)`,
        background: 'var(--c-surface-glass-bg)',
        boxShadow: 'var(--elevation-high)',
        zIndex: 50,
        overflow: 'hidden',
        transition: 'background-color 200ms ease, border-color 200ms ease',
        ...style
      }}
      className={`studio-bottom-nav ${className}`}
      {...props}
    >
      {children}
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

// ── 12. Floating Button ────────────────────────────────────────────────────
export interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
}

export function FloatingButton({
  icon,
  style,
  className = '',
  ...props
}: FloatingButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-3xl)',
        backgroundColor: 'var(--c-accent-from)',
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--elevation-high)',
        cursor: 'pointer',
        outline: 'none',
        ...style
      }}
      className={`studio-fab ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icon}</span>
    </motion.button>
  );
}

// ── 13. Progress ───────────────────────────────────────────────────────────
import StudioProgressBar from './StudioProgressBar';

export interface ProgressProps {
  value: number;
  accentFrom?: string;
  accentTo?: string;
  height?: number;
  style?: React.CSSProperties;
}

export function Progress(props: ProgressProps) {
  return <StudioProgressBar {...props} />;
}

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
  className = ''
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: variant === 'circle' ? 'var(--radius-full)' : variant === 'text' ? 'var(--radius-xs)' : 'var(--radius-md)',
        backgroundColor: 'var(--c-surface-lowest)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 200ms ease',
        ...style
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

export function Loading({
  statusText = 'Loading...',
  overlay = false
}: LoadingProps) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <AppSpinner size={32} color="var(--c-accent-from)" />
      {statusText && (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-body)' }}>
          {statusText}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-surface-glass-bg)', backdropFilter: 'var(--c-surface-glass-blur)', zIndex: 1000 }}>
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

export function Error({
  message,
  onRetry
}: ErrorProps) {
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
        transition: 'background-color 200ms ease, border-color 200ms ease'
      }}
      className="studio-error-card"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--c-error)' }}>error</span>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--c-error)', fontFamily: 'var(--font-body)' }}>
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

export function EmptyState({
  message,
  icon = 'folder_open',
  description
}: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyRules: 'center', padding: '32px 16px', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--c-text-secondary)', marginBottom: '8px', opacity: 0.5 }}>
        {icon}
      </span>
      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>{message}</h3>
      {description && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'var(--font-body)', maxWidth: '280px', lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </div>
  );
}
