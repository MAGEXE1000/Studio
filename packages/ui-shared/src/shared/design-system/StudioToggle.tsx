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
 * Studio Toggle — GPU-accelerated toggle switch component.
 * Maintains the existing Toggle API (value/checked + onChange(boolean)).
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  value,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  className = '',
  style,
}) => {
  const isChecked = checked !== undefined ? checked : (value ?? false);

  return (
    <label
      aria-label={ariaLabel || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        ...style,
      }}
      className={className}
    >
      <div
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          onChange(!isChecked);
        }}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          backgroundColor: isChecked ? 'var(--c-accent-from, #7c3aed)' : 'var(--c-surface-highest, #2a2a2e)',
          position: 'relative',
          transition: 'background-color 200ms ease',
          padding: 2,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#ffffff',
            transform: isChecked ? 'translateX(18px)' : 'translateX(0px)',
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      {label && <span style={{ fontSize: 13, color: 'var(--c-text-primary)' }}>{label}</span>}
    </label>
  );
};

export default Toggle;
