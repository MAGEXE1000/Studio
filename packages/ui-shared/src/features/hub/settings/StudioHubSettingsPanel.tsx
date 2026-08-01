import React from 'react';
import {
  useSettingsStore,
  settingsController,
  ACCENT_COLORS,
} from '@workspace/studio-core';
import { StudioPageTransition } from '../../../components/StudioPageTransition';
import {
  SettingSection,
  SettingRow,
  SegmentedControl,
  Toggle,
} from '../../../shared/typography/SettingControls';
import InspiraColorPicker from '../../../components/ui/InspiraColorPicker';

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
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          background: 'var(--app-bg)',
          color: 'var(--c-text-primary)',
        }}
      >
        <div
          className="flex-1 overflow-y-auto no-scrollbar px-margin-mobile py-4 space-y-6"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
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
    </StudioPageTransition>
  );
}
