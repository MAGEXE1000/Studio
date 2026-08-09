import React from 'react';
import { usePrefersReducedMotion, useAnimationSpeed } from '../../shared/animation';

export interface StudioHeaderProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  staggerInterval?: number;
  delayOffset?: number;
}

export function StudioHeader({
  title,
  subtitle,
  titleClassName = '',
  subtitleClassName = '',
  titleStyle = {},
  subtitleStyle = {},
  containerStyle = {},
  staggerInterval = 20,
  delayOffset = 0.06,
}: StudioHeaderProps) {
  const prefersReduced = usePrefersReducedMotion();
  const speedScale = useAnimationSpeed();

  const mergedTitleStyle: React.CSSProperties = {
    fontFamily: 'Manrope, sans-serif',
    color: 'var(--c-text-primary)',
    lineHeight: 1.2,
    ...titleStyle,
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginTop: 0,
    marginBottom: 0,
  };

  const mergedSubtitleStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    color: 'var(--c-text-secondary)',
    lineHeight: 1.4,
    ...subtitleStyle,
    fontSize: '11px',
    marginTop: '4px',
    marginBottom: 0,
  };

  return (
    <div
      style={{
        paddingTop: '48px',
        paddingBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
        ...containerStyle,
      }}
      className="studio-header-container"
    >
      <h2 className={titleClassName} style={mergedTitleStyle}>
        {title}
      </h2>
      {subtitle && (
        <p className={subtitleClassName} style={mergedSubtitleStyle}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
