import React from 'react';
import { motion } from 'motion/react';

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
 * Studio Toggle — GPU-accelerated physical toggle switch component.
 * Features spring damping, tactile active glow, and optical specular highlights.
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
  accentFrom,
  accentTo,
}) => {
  const isChecked = checked !== undefined ? checked : (value ?? false);
  const activeColor = accentFrom || 'var(--c-accent-from, #7c3aed)';

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
      <motion.div
        whileTap={disabled ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          onChange(!isChecked);
        }}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: isChecked ? activeColor : 'rgba(128, 128, 128, 0.16)',
          border: isChecked ? '1px solid rgba(255, 255, 255, 0.20)' : '1px solid var(--c-border)',
          boxShadow: isChecked
            ? `0 2px 10px ${activeColor}40, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
            : 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          transition: 'background-color 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
          padding: 2,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <motion.div
          animate={{ x: isChecked ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 30 }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
          }}
        />
      </motion.div>
      {label && (
        <span
          style={{
            fontSize: 13,
            color: 'var(--c-text-primary)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
