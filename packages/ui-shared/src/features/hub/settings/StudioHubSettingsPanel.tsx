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
import { Toggle, SectionHeader, SettingRow, SegmentedControl } from '../../../shared/typography/SettingControls';
import InkThemeToggle from '../../../shared/typography/InkThemeToggle';
import HubChangelogSection from './HubChangelogSection';
import { StudioPageTransition } from '../../../components/StudioPageTransition';
import InspiraColorPicker from '../../../components/ui/InspiraColorPicker';

/**
 * StudioHubSettingsPanel — Completely Rebuilt Settings & Appearance Reference Implementation
 *
 * Design System Specifications:
 * - Cleaner, elevated visual hierarchy with curated spacing tokens.
 * - Glassmorphic surface cards with dark/light/AMOLED mode adaptability.
 * - Single animated Lucide Theme Morpher icon positioned on far right of Appearance header.
 * - Theme Mode body section completely removed in favor of single header morpher toggle with Ink ripple transition.
 * - Integrated Inspira UI Color Picker supporting Hex, RGB, RGBA, HSL, HSLA, swatches & WCAG contrast.
 * - Display Density & Text Scale controls.
 * - Zero technical debt or obsolete card grid layouts.
 */
export default function StudioHubSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);

  const acc =
    ACCENT_COLORS[settings.perApp?.hub?.accentColor ?? settings.accentColor] ??
    ACCENT_COLORS.purple;

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);
  const t = useT();

  const cardStyle: React.CSSProperties = {
    background: 'var(--app-surface, rgba(24, 24, 27, 0.65))',
    border: '1px solid var(--c-border, rgba(255, 255, 255, 0.08))',
    borderRadius: '1.5rem',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'background-color 500ms ease, border-color 500ms ease',
  };

  const isWebDesktop = useIsWebDesktop();

  return (
    <StudioPageTransition pageKey="hub-settings-panel">
      <div className="flex flex-col h-full overflow-hidden app-bg">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto no-scrollbar px-5"
          style={{
            paddingBottom: 'var(--content-bottom-pad, 100px)',
            paddingTop: isWebDesktop ? '20px' : '0',
          }}
        >
          {/* ── Page Header ── */}
          <div className="mt-3 mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--c-accent-from,rgba(103,156,255,0.15))] text-[var(--c-accent-from,#679cff)] border border-[var(--c-accent-from,rgba(103,156,255,0.3))]">
                Reference Settings Architecture
              </span>
            </div>
            <h2
              style={{
                fontSize: 'var(--font-hero, 28px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: 'var(--c-text-primary)',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Studio Hub Settings
            </h2>
            <p
              style={{
                color: 'var(--c-text-secondary)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'var(--font-sm, 14px)',
                marginTop: '6px',
              }}
            >
              Configure workspace preferences, theme appearance, performance engine, and version updates
            </p>
          </div>

          {/* ── REBUILT APPEARANCE & THEME SECTION ── */}
          <SectionHeader
            icon="palette"
            title={t.settings.sections.appearance || 'Appearance'}
            rightElement={<InkThemeToggle />}
          />
          <div style={cardStyle} className="mb-6">
            {/* Inspira UI Color Picker Row */}
            <SettingRow
              label="Accent Color Palette"
              desc="Choose workspace accent palette or input custom HEX / RGB / HSL"
            >
              <InspiraColorPicker />
            </SettingRow>

            {/* Display Density */}
            <SettingRow
              label="Display Density"
              desc="Adjust spatial padding and container boundaries"
            >
              <SegmentedControl
                value={settings.displayDensity || 'comfortable'}
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
                onChange={(v) => useSettingsStore.getState().updateSettings({ displayDensity: v as any })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="density-control"
              />
            </SettingRow>

            {/* Text Scale */}
            <SettingRow
              label="Text Scale"
              desc="Scale system typography and UI text sizes"
            >
              <SegmentedControl
                value={settings.fontSize || 'medium'}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                onChange={(v) => useSettingsStore.getState().updateSettings({ fontSize: v as any })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="font-control"
              />
            </SettingRow>

            {/* High Contrast Mode Toggle */}
            <SettingRow
              label="High Contrast Text"
              desc="Enhance text legibility and outline boundaries for accessibility"
            >
              <Toggle
                value={settings.highContrast}
                onChange={(v) => useSettingsStore.getState().updateSettings({ highContrast: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </div>

          {/* ── WORKSPACE & PERFORMANCE SECTION ── */}
          <SectionHeader icon="tune" title="Workspace & Performance" />
          <div style={cardStyle} className="mb-6">
            <SettingRow label="Haptic Feedback" desc="Vibrate on interactive touch gestures and control triggers">
              <Toggle
                value={settings.hapticFeedback}
                onChange={(v) => useSettingsStore.getState().updateSettings({ hapticFeedback: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label="High Refresh Rate" desc="Enable 120Hz smooth rendering pipeline for high-DPI displays">
              <Toggle
                value={settings.highRefreshRate}
                onChange={(v) => useSettingsStore.getState().updateSettings({ highRefreshRate: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
            <SettingRow label="Performance Mode" desc="Optimize GPU rendering pipeline for low-power mobile states">
              <Toggle
                value={settings.performanceMode}
                onChange={(v) => useSettingsStore.getState().updateSettings({ performanceMode: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </div>

          {/* ── CHANGELOG & RELEASE NOTES ── */}
          <div className="mt-4 mb-6">
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
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--c-surface-high,rgba(255,255,255,0.1))] text-[var(--c-text-primary)] border border-[var(--c-border,rgba(255,255,255,0.15))]">
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
                  <span className="font-mono text-emerald-400 font-bold">
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
