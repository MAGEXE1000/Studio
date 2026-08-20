import { SpringPresets } from '@workspace/studio-core';
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
export { Toggle, type ToggleProps } from '../design-system/StudioToggle';

export const SectionHeader = memo(function SectionHeader({
  icon,
  title,
  rightElement,
}: {
  icon: string;
  title: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6 spring-in">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', color: 'var(--c-text-secondary)' }}
        >
          {icon}
        </span>
        <p
          style={{
            color: 'var(--c-text-secondary)',
            fontFamily: 'Manrope',
            fontWeight: 700,
            fontSize: 'var(--font-xs)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </p>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
});

export function SettingRow({
  label,
  desc,
  children,
  indent,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4"
      style={{
        padding: 'var(--density-row-pad, 14px 20px)',
        paddingLeft: indent ? 'calc(var(--spacing-md, 16px) * 1.75)' : 'var(--spacing-md, 16px)',
        borderBottom: '1px solid rgba(128,128,128,0.08)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: indent ? 'var(--font-sm)' : 'var(--font-base)',
            fontWeight: 600,
            color: indent ? 'var(--c-text-secondary)' : 'var(--c-text-primary)',
            fontFamily: 'Manrope',
          }}
        >
          {label}
        </p>
        {desc && (
          <p
            style={{
              fontSize: 'var(--font-sm)',
              marginTop: '2px',
              lineHeight: 1.3,
              color: 'var(--c-text-secondary)',
              fontFamily: 'Inter',
              opacity: indent ? 0.75 : 1,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  accentFrom = 'var(--studio-accent-from, #679cff)',
  accentTo = 'var(--studio-accent-to, #007aff)',
  layoutId = 'segmented-control-active',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  accentFrom?: string;
  accentTo?: string;
  layoutId?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--app-surface-lowest, #000000)',
        borderRadius: '9999px',
        padding: '3px',
        display: 'flex',
        position: 'relative',
        border: '1px solid rgba(128,128,128,0.08)',
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="btn-smooth relative outline-none cursor-pointer"
            style={{
              padding: 'var(--density-button-padding, 6px 14px)',
              borderRadius: '9999px',
              fontFamily: 'var(--font-headline, Manrope)',
              fontSize: 'var(--density-button-font-size, 11px)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: active ? '#ffffff' : 'var(--c-text-secondary, #acabaa)',
              background: 'transparent',
              border: 'none',
              transition: 'color 200ms cubic-bezier(0.2, 0, 0, 1)',
              zIndex: 10,
            }}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '9999px',
                  background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
                  zIndex: -1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 11 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BentoSettingCard({
  icon,
  iconColor,
  title,
  desc,
  valueText,
  badge,
  onPress,
  delay = 0,
}: {
  icon: string;
  iconColor?: string;
  title: string;
  desc?: string;
  valueText?: string;
  badge?: string;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.975 }}
      transition={SpringPresets.soft}
      className="btn-smooth bento-card outline-none"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 'var(--density-row-pad, 16px)',
        background: 'var(--app-surface-high)',
        border: '1px solid rgba(128, 128, 128, 0.06)',
        borderRadius: 'var(--density-card-radius, var(--radius-xl))',
        cursor: 'pointer',
        textAlign: 'left',
        boxSizing: 'border-box',
        animation: `settings-content-fade-in 300ms ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--density-list-item-gap, 16px)',
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            width: 'calc(var(--density-icon-size, 22px) * 2)',
            height: 'calc(var(--density-icon-size, 22px) * 2)',
            borderRadius: 'var(--density-card-radius, 12px)',
            background: 'var(--app-surface-highest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(128, 128, 128, 0.08)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 'var(--density-icon-size, 22px)',
              color: iconColor || 'var(--studio-accent-from, #679cff)',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {icon}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--c-text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: 'Manrope',
            }}
          >
            {title}
          </h4>
          {desc && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--c-text-secondary)',
                margin: '2px 0 0',
                fontWeight: 500,
                fontFamily: 'Inter',
                lineHeight: 1.3,
              }}
            >
              {desc}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {valueText && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--studio-accent-from, #679cff)',
              fontFamily: 'Inter',
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {valueText}
          </span>
        )}
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'Manrope',
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--app-surface-bright)',
              color: 'var(--c-text-secondary)',
              border: '1px solid rgba(128, 128, 128, 0.12)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {badge}
          </span>
        )}
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--c-text-secondary)', opacity: 0.5 }}
        >
          chevron_right
        </span>
      </div>
    </motion.button>
  );
}

export function BentoSettingRow({
  icon,
  iconColor,
  title,
  desc,
  valueText,
  badge,
  onPress,
  delay = 0,
}: {
  icon: string;
  iconColor?: string;
  title: string;
  desc?: string;
  valueText?: string;
  badge?: string;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.985 }}
      transition={SpringPresets.soft}
      className="btn-smooth bento-card outline-none"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 'var(--density-row-pad, 16px)',
        background: 'var(--app-surface-high)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        boxSizing: 'border-box',
        animation: `settings-content-fade-in 300ms ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--density-list-item-gap, 16px)',
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 'var(--density-icon-size, 22px)',
            color: iconColor || 'var(--studio-accent-from, #679cff)',
            fontVariationSettings: "'FILL' 1",
            width: 'var(--density-icon-size, 24px)',
            textAlign: 'center',
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--c-text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: 'Manrope',
            }}
          >
            {title}
          </h4>
          {desc && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--c-text-secondary)',
                margin: '2px 0 0',
                fontWeight: 500,
                fontFamily: 'Inter',
                lineHeight: 1.3,
              }}
            >
              {desc}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {valueText && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--studio-accent-from, #679cff)',
              fontFamily: 'Inter',
              opacity: 0.8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {valueText}
          </span>
        )}
        {badge && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              fontFamily: 'Manrope',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--app-surface-bright)',
              color: 'var(--c-text-secondary)',
              border: '1px solid rgba(128, 128, 128, 0.12)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {badge}
          </span>
        )}
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--c-text-secondary)', opacity: 0.5 }}
        >
          chevron_right
        </span>
      </div>
    </motion.button>
  );
}

export function SettingSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap: 'var(--spacing-xs, 6px)' }}>
      <span
        className="px-1 text-[9.5px] font-extrabold uppercase tracking-wider"
        style={{ letterSpacing: '0.06em', color: 'var(--c-text-tertiary, #808080)' }}
      >
        {title}
      </span>
      <div
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'var(--c-surface-glass-bg, rgba(255, 255, 255, 0.03))',
          borderRadius: 'var(--density-card-radius, 20px)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
