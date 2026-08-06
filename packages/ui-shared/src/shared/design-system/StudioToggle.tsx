import React from 'react';
import { Switch } from '../../components/ui/switch';

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
 * Studio Toggle — wraps the fluidfunctionalism Switch component.
 * Maintains the existing Toggle API (value/checked + onChange(boolean))
 * so all 40+ call sites remain unchanged.
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  value,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  className = '',
}) => {
  const isChecked = checked !== undefined ? checked : (value ?? false);

  return (
    <Switch
      label={ariaLabel || label || ''}
      checked={isChecked}
      onToggle={() => onChange(!isChecked)}
      disabled={disabled}
      className={className}
    />
  );
};

export default Toggle;
