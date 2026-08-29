import React from 'react';

export interface StudioHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  disableTopInset?: boolean;
  disableHorizontalPadding?: boolean;
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
  actions,
  badge,
  disableTopInset = false,
  disableHorizontalPadding = false,
  titleClassName = '',
  subtitleClassName = '',
  titleStyle = {},
  subtitleStyle = {},
  containerStyle = {},
}: StudioHeaderProps) {
  const mergedTitleStyle: React.CSSProperties = {
    fontFamily: 'Manrope, sans-serif',
    color: 'var(--c-text-primary)',
    lineHeight: 1.15,
    fontSize: '28px',
    fontWeight: 850,
    letterSpacing: '-0.03em',
    textAlign: 'left',
    marginTop: 0,
    marginBottom: 0,
    ...titleStyle,
  };

  const mergedSubtitleStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    color: 'var(--c-text-secondary)',
    lineHeight: 1.4,
    fontSize: '13px',
    fontWeight: 500,
    marginTop: '4px',
    marginBottom: 0,
    ...subtitleStyle,
  };

  const textContent = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      {badge && <div style={{ marginBottom: 4 }}>{badge}</div>}
      {typeof title === 'string' ? (
        <h2 className={titleClassName} style={mergedTitleStyle}>
          {title}
        </h2>
      ) : (
        <div className={titleClassName} style={mergedTitleStyle}>
          {title}
        </div>
      )}
      {subtitle &&
        (typeof subtitle === 'string' ? (
          <p className={subtitleClassName} style={mergedSubtitleStyle}>
            {subtitle}
          </p>
        ) : (
          <div className={subtitleClassName} style={mergedSubtitleStyle}>
            {subtitle}
          </div>
        ))}
    </div>
  );

  return (
    <div
      style={{
        paddingTop: disableTopInset
          ? 0
          : 'var(--page-header-top-inset, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 40px))',
        paddingBottom: 'var(--page-header-bottom-inset, 16px)',
        paddingLeft: disableHorizontalPadding
          ? 0
          : 'var(--page-header-inset-h, var(--page-inset-h, 24px))',
        paddingRight: disableHorizontalPadding
          ? 0
          : 'var(--page-header-inset-h, var(--page-inset-h, 24px))',
        display: 'flex',
        flexDirection: actions ? 'row' : 'column',
        alignItems: actions ? 'flex-end' : 'flex-start',
        justifyContent: actions ? 'space-between' : 'flex-start',
        gap: actions ? 12 : 0,
        boxSizing: 'border-box',
        width: '100%',
        ...containerStyle,
      }}
      className="studio-header-container"
    >
      {textContent}
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            marginBottom: 2,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
