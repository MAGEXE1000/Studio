import React from 'react';
import { usePrefersReducedMotion, useAnimationSpeed } from '../../shared/animation';

export interface StudioHeaderProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  staggerInterval?: number;
  delayOffset?: number;
}

export function StudioHeader({
  title,
  subtitle,
  titleClassName = 'font-extrabold tracking-tighter leading-none mb-3',
  subtitleClassName = '',
  titleStyle = {},
  subtitleStyle = {},
  staggerInterval = 20,
  delayOffset = 0.06,
}: StudioHeaderProps) {
  const prefersReduced = usePrefersReducedMotion();
  const speedScale = useAnimationSpeed();

  const mergedTitleStyle: React.CSSProperties = {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 900,
    fontSize: '2.6rem',
    color: 'var(--c-text-primary)',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    marginTop: '12px',
    marginBottom: '8px',
    ...titleStyle,
  };

  const mergedSubtitleStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: 'var(--c-text-secondary)',
    marginTop: '4px',
    marginBottom: '24px',
    lineHeight: 1.4,
    ...subtitleStyle,
  };

  return (
    <>
      <h2 className={titleClassName} style={mergedTitleStyle}>
        {title}
      </h2>
      {subtitle && (
        <p className={subtitleClassName} style={mergedSubtitleStyle}>
          {subtitle}
        </p>
      )}
    </>
  );
}
