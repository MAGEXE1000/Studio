import { type AccentColor } from '@workspace/studio-core';
import React, { memo } from 'react';

// ── Shared primitives used across SettingsPanel and HubSettings ────────────────

export interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  accentFrom: string;
  accentTo: string;
}

export const Toggle = memo(function Toggle({ value, onChange, accentFrom, accentTo }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="btn-smooth relative flex-none"
      style={{
        width: '48px',
        height: '28px',
        borderRadius: '9999px',
        background: value ? `linear-gradient(135deg, ${accentFrom}, ${accentTo})` : 'rgba(128,128,128,0.16)',
        transition: 'background 300ms ease',
        boxShadow: value ? `0 2px 12px ${accentTo}44` : 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: value ? 'calc(100% - 25px)' : '3px',
          width: '22px',
          height: '22px',
          borderRadius: '9999px',
          background: value ? 'white' : 'var(--c-text-secondary, #acabaa)',
          transition: 'left 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background 280ms ease',
          display: 'block',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
});

export const SectionHeader = memo(function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6 spring-in">
      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--c-text-secondary)' }}>{icon}</span>
      <p style={{ color: 'var(--c-text-secondary)', fontFamily: 'Manrope', fontWeight: 700, fontSize: 'var(--font-xs)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{title}</p>
    </div>
  );
});

export function SettingRow({ label, desc, children, indent }: { label: string; desc?: string; children: React.ReactNode; indent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ padding: '14px 20px', paddingLeft: indent ? '28px' : '20px', borderBottom: '1px solid rgba(128,128,128,0.08)' }}>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: indent ? 'var(--font-sm)' : 'var(--font-base)', fontWeight: 600, color: indent ? 'var(--c-text-secondary)' : 'var(--c-text-primary)', fontFamily: 'Manrope' }}>{label}</p>
        {desc && <p style={{ fontSize: 'var(--font-sm)', marginTop: '2px', lineHeight: 1.3, color: 'var(--c-text-secondary)', fontFamily: 'Inter', opacity: indent ? 0.75 : 1 }}>{desc}</p>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value, options, onChange, accentFrom, accentTo,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  accentFrom: string;
  accentTo: string;
}) {
  return (
    <div style={{ background: 'var(--app-surface-lowest)', borderRadius: '9999px', padding: '2px', display: 'flex', transition: 'background-color 700ms cubic-bezier(0.4,0,0.2,1)' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="btn-smooth"
          style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontFamily: 'Manrope',
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: value === opt.value ? `linear-gradient(135deg, ${accentFrom}, ${accentTo})` : 'transparent',
            color: value === opt.value ? 'white' : 'var(--c-text-secondary, #acabaa)',
            transition: 'background 250ms ease, color 250ms ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export const COLOR_OPTIONS: { id: AccentColor; from: string; to: string }[] = [
  { id: 'blue',   from: '#679cff', to: '#007aff' },
  { id: 'purple', from: '#b57bee', to: '#7c3aed' },
  { id: 'green',  from: '#34d399', to: '#059669' },
  { id: 'orange', from: '#fb923c', to: '#ea580c' },
  { id: 'pink',   from: '#f472b6', to: '#db2777' },
  { id: 'teal',   from: '#2dd4bf', to: '#0891b2' },
];

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
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="btn-smooth bento-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px',
        background: pressed ? 'var(--app-surface-highest)' : 'var(--app-surface-high)',
        border: '1px solid rgba(128, 128, 128, 0.06)',
        borderRadius: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box',
        animation: `settings-content-fade-in 300ms ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'var(--app-surface-highest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid rgba(128, 128, 128, 0.08)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 22,
            color: iconColor || 'var(--studio-accent-from, #679cff)',
            fontVariationSettings: "'FILL' 1",
          }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-primary)', margin: 0, letterSpacing: '-0.01em', fontFamily: 'Manrope' }}>{title}</h4>
          {desc && <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: '2px 0 0', fontWeight: 500, fontFamily: 'Inter', lineHeight: 1.3 }}>{desc}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {valueText && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--studio-accent-from, #679cff)', fontFamily: 'Inter', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{valueText}</span>
        )}
        {badge && (
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'Manrope',
            padding: '2px 8px',
            borderRadius: 6,
            background: 'var(--app-surface-bright)',
            color: 'var(--c-text-secondary)',
            border: '1px solid rgba(128, 128, 128, 0.12)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>{badge}</span>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-text-secondary)', opacity: 0.5 }}>chevron_right</span>
      </div>
    </button>
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
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="btn-smooth bento-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px',
        background: pressed ? 'var(--app-surface-highest)' : 'var(--app-surface-high)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        animation: `settings-content-fade-in 300ms ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 22,
          color: iconColor || 'var(--studio-accent-from, #679cff)',
          fontVariationSettings: "'FILL' 1",
          width: 24,
          textAlign: 'center',
        }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-primary)', margin: 0, letterSpacing: '-0.01em', fontFamily: 'Manrope' }}>{title}</h4>
          {desc && <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: '2px 0 0', fontWeight: 500, fontFamily: 'Inter', lineHeight: 1.3 }}>{desc}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {valueText && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--studio-accent-from, #679cff)', fontFamily: 'Inter', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{valueText}</span>
        )}
        {badge && (
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            fontFamily: 'Manrope',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--app-surface-bright)',
            color: 'var(--c-text-secondary)',
            border: '1px solid rgba(128, 128, 128, 0.12)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>{badge}</span>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-text-secondary)', opacity: 0.5 }}>chevron_right</span>
      </div>
    </button>
  );
}
