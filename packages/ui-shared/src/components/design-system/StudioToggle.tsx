import React, { useRef } from 'react';

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
 * Fixed: Replaced <label> wrapping <button> to eliminate double-firing events,
 * flickering, stale UI, layout jumps, and race conditions.
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

  const isDebouncingRef = useRef(false);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled || isDebouncingRef.current) return;

    isDebouncingRef.current = true;
    onChange(!isChecked);

    setTimeout(() => {
      isDebouncingRef.current = false;
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      handleToggle(e);
    }
  };

  return (
    <div
      className={`transitions-toggle-wrapper ${className}`}
      onClick={handleToggle}
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
            'background-color 280ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 250ms ease, box-shadow 250ms ease',
          flexShrink: 0,
        }}
      >
        <span
          className="transitions-toggle-thumb"
          style={{
            position: 'absolute',
            top: '50%',
            left: '2px',
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow:
              '0 2px 4px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.15)',
            transform: isChecked
              ? `translate3d(${translateDist}px, -50%, 0)`
              : 'translate3d(0, -50%, 0)',
            transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Toggle;
