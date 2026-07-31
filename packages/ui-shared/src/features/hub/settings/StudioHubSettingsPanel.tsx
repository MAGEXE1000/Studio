import { Capacitor } from '@capacitor/core';
import {
  useChordStore,
  ACCENT_COLORS,
  useScrollHide,
  useT,
  useIsWebDesktop,
  useSettingsStore,
  APP_VERSION_LABEL,
  APP_BUILD_TIMESTAMP,
  APP_COMMIT_SHA,
  APP_VERSION_DATE,
  isAppInstallerAvailable,
} from '@workspace/studio-core';
import React, { useRef } from 'react';
import { Toggle, SectionHeader, SettingRow, SettingSection } from '../../../shared/typography/SettingControls';
import InkThemeToggle from '../../../shared/typography/InkThemeToggle';
import SingleThemeToggleRow from '../../../shared/typography/SingleThemeToggleRow';
import HubChangelogSection from './HubChangelogSection';
import { StudioPageTransition } from '../../../components/StudioPageTransition';

export default function StudioHubSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);

  const acc =
    ACCENT_COLORS[settings.perApp?.hub?.accentColor ?? settings.accentColor] ??
    ACCENT_COLORS.purple;

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);
  const t = useT();

  const cardStyle: React.CSSProperties = {
    background: 'var(--app-surface)',
    borderRadius: '1.5rem',
    overflow: 'hidden',
    transition: 'background-color 700ms cubic-bezier(0.4,0,0.2,1)',
  };

  const isWebDesktop = useIsWebDesktop();

  return (
    <StudioPageTransition pageKey="hub-settings-panel">
      <div className="flex flex-col h-full overflow-hidden app-bg">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-5"
        style={{
          paddingBottom: 'var(--content-bottom-pad)',
          paddingTop: isWebDesktop ? '20px' : '0',
        }}
      >
        {/* Page title */}
        <div className="mt-3 mb-6">
          <h2
            style={{
              fontSize: 'var(--font-hero)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--c-text-primary)',
              fontFamily: 'Manrope',
            }}
          >
            Studio Hub Settings
          </h2>
          <p
            style={{
              color: 'var(--c-text-secondary)',
              fontFamily: 'Inter',
              fontSize: 'var(--font-sm)',
              marginTop: '4px',
            }}
          >
            Configure global workspace preferences, performance, theme, and version changelog
          </p>
        </div>

        {/* ── WORKSPACE & PERFORMANCE ── */}
        <SectionHeader icon="tune" title="Workspace & Performance" />
        <div style={cardStyle}>
          <SettingRow label="Haptic Feedback" desc="Vibrate on interactive gestures and triggers">
            <Toggle
              value={settings.hapticFeedback}
              onChange={(v) => useSettingsStore.getState().updateSettings({ hapticFeedback: v })}
              accentFrom={acc.from}
              accentTo={acc.to}
            />
          </SettingRow>
          <SettingRow label="High Refresh Rate" desc="Enable 120Hz smooth rendering pipeline">
            <Toggle
              value={settings.highRefreshRate}
              onChange={(v) => useSettingsStore.getState().updateSettings({ highRefreshRate: v })}
              accentFrom={acc.from}
              accentTo={acc.to}
            />
          </SettingRow>
          <SettingRow label="Performance Mode" desc="Optimize rendering for mobile low-power states">
            <Toggle
              value={settings.performanceMode}
              onChange={(v) => useSettingsStore.getState().updateSettings({ performanceMode: v })}
              accentFrom={acc.from}
              accentTo={acc.to}
            />
          </SettingRow>
        </div>

        {/* ── APPEARANCE ── */}
        <SectionHeader icon="palette" title={t.settings.sections.appearance} />
        <div style={cardStyle}>
          <SingleThemeToggleRow />
        </div>

        {/* ── CHANGELOG & RELEASE NOTES (IMMEDIATELY ABOVE ABOUT) ── */}
        <div className="mt-4">
          <HubChangelogSection />
        </div>

        {/* ── ABOUT STUDIO ── */}
        <div className="mt-4 mb-6">
          <SectionHeader icon="info" title="About Studio" />
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--c-text-primary)]">
                  Version
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-white">
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--c-text-secondary)]">
                <span>Release Date</span>
                <span className="font-mono">{APP_VERSION_DATE}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--c-text-secondary)]">
                <span>Build Timestamp</span>
                <span className="font-mono">{APP_BUILD_TIMESTAMP}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--c-text-secondary)]">
                <span>Git Commit</span>
                <span className="font-mono">{APP_COMMIT_SHA}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--c-text-secondary)]">
                <span>Native Installer</span>
                <span className="font-mono text-emerald-400">
                  {isAppInstallerAvailable() ? 'Active & Verified' : 'Standard Web Engine'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudioPageTransition>
  );
}
