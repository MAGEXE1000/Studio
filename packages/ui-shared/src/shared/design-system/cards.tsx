import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { SpringPresets } from '@workspace/studio-core';

// ── 2. Card ────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentBorder?: boolean;
  glass?: boolean;
  rim?: boolean;
}

const isHoverable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      interactive = false,
      accentBorder = false,
      glass = true,
      rim = false,
      children,
      style,
      className = '',
      ...props
    },
    ref
  ) => {
    const Component = (interactive ? motion.div : 'div') as any;
    const motionProps = interactive
      ? {
          whileHover: isHoverable
            ? { scale: 1.012, y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.20)' }
            : undefined,
          whileTap: { scale: 0.985, y: 0 },
          transition: SpringPresets.soft,
        }
      : {};

    return (
      <Component
        ref={ref}
        style={{
          borderRadius: 20,
          padding: '16px 18px',
          background: glass
            ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.04))'
            : 'var(--c-surface-mid)',
          border: accentBorder
            ? `1.5px solid var(--c-accent-from, #7c3aed)`
            : `1px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
          backdropFilter: glass ? 'blur(16px) saturate(180%)' : 'none',
          WebkitBackdropFilter: glass ? 'blur(16px) saturate(180%)' : 'none',
          cursor: interactive ? 'pointer' : 'default',
          willChange: interactive ? 'transform, box-shadow' : 'auto',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
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
);

Card.displayName = 'Card';

// ── 2.5. BentoCard ─────────────────────────────────────────────────────────
export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string | React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  accentGlow?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      icon,
      iconColor,
      iconBg,
      title,
      subtitle,
      badge,
      accentGlow,
      interactive = false,
      onClick,
      children,
      style,
      className = '',
      ...props
    },
    ref
  ) => {
    const Component = (interactive || onClick ? motion.div : 'div') as any;
    const motionProps =
      interactive || onClick
        ? {
            whileHover: isHoverable
              ? { scale: 1.015, y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.20)' }
              : undefined,
            whileTap: { scale: 0.985, y: 0 },
            transition: SpringPresets.soft,
          }
        : {};

    return (
      <Component
        ref={ref}
        onClick={onClick}
        style={{
          background: 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.04))',
          border: 'var(--surface-topbar-border)',
          borderRadius: 20,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 96,
          backdropFilter: 'var(--surface-float-blur)',
          WebkitBackdropFilter: 'var(--surface-float-blur)',
          boxShadow: 'var(--surface-topbar-shadow)',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: interactive || onClick ? 'pointer' : 'default',
          userSelect: interactive || onClick ? 'none' : 'auto',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
        className={`studio-bento-card ${className}`}
        {...motionProps}
        {...props}
      >
        {/* Ambient Glow */}
        {accentGlow && (
          <div
            style={{
              position: 'absolute',
              top: -24,
              right: -24,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: accentGlow,
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {(icon || badge) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              zIndex: 2,
            }}
          >
            {icon && (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: iconBg || 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor || 'var(--c-text-primary)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                {typeof icon === 'string' ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {icon}
                  </span>
                ) : (
                  icon
                )}
              </div>
            )}
            {badge && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: 'var(--c-text-tertiary, #808080)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {badge}
              </span>
            )}
          </div>
        )}

        {(title || subtitle) && (
          <div style={{ marginTop: 10, zIndex: 2 }}>
            {title && (
              <p
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 850,
                  fontSize: 24,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                }}
              >
                {title}
              </p>
            )}
            {subtitle && (
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11.5,
                  color: 'var(--c-text-secondary)',
                  margin: '3px 0 0',
                  lineHeight: 1.2,
                  opacity: 0.82,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </Component>
    );
  }
);

BentoCard.displayName = 'BentoCard';

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
    if (glass) return 'var(--surface-topbar-bg, var(--c-surface-glass-bg))';
    if (level === 'low') return 'var(--c-background)';
    if (level === 'high') return 'var(--c-surface-high)';
    return 'var(--c-surface-mid)';
  };

  return (
    <div
      style={{
        backgroundColor: getBg(),
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        backdropFilter: glass ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: glass ? 'blur(20px) saturate(180%)' : 'none',
        color: 'var(--c-text-primary)',
        boxShadow: glass ? '0 8px 24px rgba(0, 0, 0, 0.16)' : 'none',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        borderRadius: 20,
        ...style,
      }}
      className={`studio-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
