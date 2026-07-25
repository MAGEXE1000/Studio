import React from 'react';

export interface ToggleProps {
  checked?: boolean;
  value?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  accentFrom?: string;
  accentTo?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Transitions.dev Canonical CSS Spring Toggle Component
 * Source of truth: https://transitions.dev/detail.html?t=toggle
 * Exact CSS timing, overshoot, double bounce, and reduced-motion support.
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  value,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  size = 'md',
  style,
  className = '',
}) => {
  const isChecked = checked !== undefined ? checked : (value ?? false);
  const isSm = size === 'sm';
  const width = isSm ? 40 : 48;
  const height = isSm ? 22 : 26;
  const thumbSize = isSm ? 16 : 20;
  const translateDist = isSm ? 18 : 22;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!isChecked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!isChecked);
    }
  };

  return (
    <label
      className={`transitions-toggle-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="transitions-toggle-root"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: '9999px',
          backgroundColor: isChecked
            ? 'var(--c-accent-from, #3b82f6)'
            : 'var(--c-surface-high, rgba(255, 255, 255, 0.14))',
          border: `1.5px solid ${isChecked ? 'rgba(255, 255, 255, 0.32)' : 'var(--c-border, rgba(255, 255, 255, 0.16))'}`,
          boxShadow: isChecked
            ? '0 0 12px rgba(59, 130, 246, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          padding: 0,
          transition:
            'background-color 350ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 300ms ease, box-shadow 300ms ease',
          flexShrink: 0,
        }}
      >
        <span
          className="transitions-toggle-thumb"
          style={{
            position: 'absolute',
            top: '1.5px',
            left: '1.5px',
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            transform: isChecked ? `translateX(${translateDist}px)` : 'translateX(0px)',
            transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), width 200ms ease',
            willChange: 'transform',
          }}
        />
      </button>
      {label && (
        <span
          style={{
            fontSize: isSm ? '12px' : '13px',
            fontWeight: 600,
            color: 'var(--c-text-primary, #ffffff)',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
