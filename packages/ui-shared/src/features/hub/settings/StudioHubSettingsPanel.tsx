import React from 'react';
import {
  useSettingsStore,
  settingsController,
  ACCENT_COLORS,
  useT,
} from '@workspace/studio-core';
import { motion } from 'motion/react';
import { StudioPageTransition } from '../../../components/StudioPageTransition';
import {
  SettingSection,
  SettingRow,
  SegmentedControl,
  Toggle,
} from '../../../shared/typography/SettingControls';
import InspiraColorPicker from '../../../components/ui/InspiraColorPicker';
import { Sheet } from '../../../shared/design-system/dialogs';

/**
 * StudioHubSettingsPanel — Completely Rebuilt Settings & Appearance Reference Implementation
 *
 * Design System Specifications:
 * - Cleaner, elevated visual hierarchy matching Drumex/Groovex Preferences.
 * - Reuses existing segmented controls, cards, spacing tokens, and typography.
 * - Premium theme switcher animation via motion wrapper.
 */
export default function StudioHubSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const t = useT();
  const [showLanguageSheet, setShowLanguageSheet] = React.useState(false);
  const [langQuery, setLangQuery] = React.useState('');

  const LANG_OPTIONS = React.useMemo(() => [
    {
      code: 'en',
      flag: '🇬🇧',
      native: 'English',
      label: t.settings.language?.en || 'English (US)',
    },
    { code: 'es', flag: '🇪🇸', native: 'Español', label: t.settings.language?.es || 'Spanish' },
    { code: 'de', flag: '🇩🇪', native: 'Deutsch', label: t.settings.language?.de || 'German' },
    { code: 'fr', flag: '🇫🇷', native: 'Français', label: t.settings.language?.fr || 'French' },
    { code: 'zh', flag: '🇨🇳', native: '中文', label: t.settings.language?.zh || 'Chinese' },
    {
      code: 'pt',
      flag: '🇧🇷',
      native: 'Português',
      label: t.settings.language?.pt || 'Portuguese',
    },
    { code: 'it', flag: '🇮🇹', native: 'Italiano', label: t.settings.language?.it || 'Italian' },
    { code: 'ja', flag: '🇯🇵', native: '日本語', label: t.settings.language?.ja || 'Japanese' },
    { code: 'ko', flag: '🇰🇷', native: '한국어', label: t.settings.language?.ko || 'Korean' },
  ], [t]);

  const filteredLangs = React.useMemo(() => {
    return LANG_OPTIONS.filter(
      (opt) =>
        opt.native.toLowerCase().includes(langQuery.toLowerCase()) ||
        opt.label.toLowerCase().includes(langQuery.toLowerCase())
    );
  }, [LANG_OPTIONS, langQuery]);

  React.useEffect(() => {
    console.log('[APPEARANCE-RUNTIME-PROOF]', {
      component: 'StudioHubSettingsPanel',
      filename: 'StudioHubSettingsPanel.tsx',
      importPath: '@workspace/ui-shared/src/features/hub/settings/StudioHubSettingsPanel.tsx',
      renderPath:
        'App.tsx -> SharedAppShell -> StudioHub -> renderActivePageContent -> StudioHubSettingsPanel',
      mountedAt: new Date().toISOString(),
    });
    try {
      (window as any).__lastMountedAppearanceComponent = 'StudioHubSettingsPanel';
    } catch (_) {}
  }, []);

  const acc = React.useMemo(() => {
    const hubAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'purple';
    return hubAccentKey === 'custom'
      ? {
          from: `hsl(${settings.customAccentHue ?? 220}, 75%, 65%)`,
          mid: `hsl(${settings.customAccentHue ?? 220}, 80%, 55%)`,
          to: `hsl(${((settings.customAccentHue ?? 220) + 25) % 360}, 85%, 42%)`,
        }
      : ((ACCENT_COLORS as any)[hubAccentKey] ?? ACCENT_COLORS.purple);
  }, [settings.perApp?.hub?.accentColor, settings.accentColor, settings.customAccentHue]);

  return (
    <StudioPageTransition pageKey="hub-settings-panel">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          background: 'transparent',
          color: 'var(--c-text-primary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--density-section-gap, 24px)',
            paddingLeft: 'var(--density-pad, 16px)',
            paddingRight: 'var(--density-pad, 16px)',
            paddingTop: 'var(--spacing-md, 16px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 96px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Accent Color Section */}
          <SettingSection title="Accent Color">
            <div className="p-3">
              <InspiraColorPicker />
            </div>
          </SettingSection>

          {/* Interface Scaling Section */}
          <SettingSection title="Interface Scaling">
            <SettingRow label="Display Density" desc="Adjust screen layout density">
              <SegmentedControl
                value={settings.displayDensity || 'comfortable'}
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'comfortable', label: 'Standard' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
                onChange={(v) => settingsController.updateSettings({ displayDensity: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="density-control"
              />
            </SettingRow>
            <SettingRow label="Text Size" desc="Scale global typography">
              <SegmentedControl
                value={settings.fontSize || 'medium'}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                onChange={(v) => settingsController.updateSettings({ fontSize: v })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="font-size-control"
              />
            </SettingRow>
          </SettingSection>

          {/* Language Section */}
          <SettingSection title="Language">
            <SettingRow
              label="System Language"
              desc={`Current: ${LANG_OPTIONS.find((o) => o.code === (settings.language ?? 'en'))?.native || 'English'}`}
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLanguageSheet(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(128,128,128,0.12)',
                  background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                  color: 'var(--c-text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background-color 200ms',
                }}
                className="hover:bg-white/5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>language</span>
                Change
              </motion.button>
            </SettingRow>
          </SettingSection>

          {/* Accessibility Section */}
          <SettingSection title="Accessibility">
            <SettingRow label="High Contrast" desc="Sharpen text and interface elements for better readability">
              <Toggle
                value={settings.highContrast ?? false}
                onChange={(v) => settingsController.updateSettings({ highContrast: v })}
              />
            </SettingRow>
          </SettingSection>

          {/* Performance Section */}
          <SettingSection title="Performance & Interaction">
            <SettingRow label="Haptics" desc="Subtle tactile feedback for gestures and controls">
              <Toggle
                value={settings.hapticFeedback ?? true}
                onChange={(v) => settingsController.updateSettings({ hapticFeedback: v })}
              />
            </SettingRow>
            <SettingRow label="ProMotion" desc="Enable 120Hz smooth scrolling rendering pipeline">
              <Toggle
                value={settings.highRefreshRate ?? true}
                onChange={(v) => settingsController.updateSettings({ highRefreshRate: v })}
              />
            </SettingRow>
            <SettingRow label="Performance Boost" desc="Optimize system rendering engine for heavy audio/visual tasks">
              <Toggle
                value={settings.performanceMode ?? false}
                onChange={(v) => settingsController.updateSettings({ performanceMode: v })}
              />
            </SettingRow>
          </SettingSection>
        </div>
      </div>

      <Sheet open={showLanguageSheet} onClose={() => setShowLanguageSheet(false)} title="Select Language">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '0 20px 24px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
          className="no-scrollbar"
        >
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 16,
                color: 'var(--c-text-secondary)',
                opacity: 0.5,
                fontSize: 20,
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search languages..."
              value={langQuery}
              onChange={(e) => setLangQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                background: 'var(--app-surface-low, rgba(0,0,0,0.2))',
                border: '1px solid rgba(128,128,128,0.12)',
                borderRadius: 12,
                color: 'var(--c-text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Language selection list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLangs.map((opt) => {
              const isSelected = (settings.language ?? 'en') === opt.code;
              return (
                <motion.button
                  key={opt.code}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    settingsController.updateSettings({ language: opt.code as any });
                    setShowLanguageSheet(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? acc.from + '40' : 'rgba(128,128,128,0.06)'}`,
                    padding: '14px 20px',
                    background: isSelected
                      ? 'var(--app-surface-high, rgba(128,128,128,0.06))'
                      : 'var(--app-surface-low, rgba(128,128,128,0.02))',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 12px ${acc.from}15` : 'none',
                    transition: 'background-color 200ms, border-color 200ms, box-shadow 200ms',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-text-primary)', fontFamily: 'Manrope' }}>
                      {opt.native}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)', opacity: 0.7, fontFamily: 'Inter' }}>
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      className="material-symbols-outlined"
                      style={{ color: acc.from, fontSize: 20 }}
                    >
                      check_circle
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </Sheet>
    </StudioPageTransition>
  );
}
