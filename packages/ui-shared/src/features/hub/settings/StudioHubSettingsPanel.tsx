import { ThemeToggle } from '../../../components/motion/theme-toggle';
import React from 'react';
import { useSettingsStore, settingsController, useT } from '@workspace/studio-core';
import { motion } from 'motion/react';
import { StudioPageTransition } from '../../../components/StudioPageTransition';
import {
  SettingSection,
  SettingRow,
  SegmentedControl,
  Toggle,
} from '../../../shared/settings/SettingControls';
import { SettingsContentContainer } from '../../../shared/layout/StudioLayoutSystem';

import {
  LanguagePickerSheet,
  SUPPORTED_LANGUAGES,
} from '../../../shared/settings/LanguagePickerSheet';
import { Button } from '../../../shared/design-system/buttons';

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
  const [isLanguageOpen, setIsLanguageOpen] = React.useState(false);

  return (
    <>
      <SettingsContentContainer
        style={{
          paddingTop: 'var(--space-4)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 96px)',
          color: 'var(--c-text-primary)',
        }}
      >
        {/* Theme Section */}
        <SettingSection title="Appearance Theme">
          <SettingRow label="Theme Mode" desc="Switch between Light and Dark themes">
            <ThemeToggle variant="circle-blur" start="bottom-up" />
          </SettingRow>
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
              layoutId="font-size-control"
            />
          </SettingRow>
        </SettingSection>

        {/* Language Section */}
        <SettingSection title="Language">
          <SettingRow label="App Language" desc="Change the display language for Studio">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsLanguageOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.10)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--c-text-primary, #ffffff)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>
                {SUPPORTED_LANGUAGES.find((l) => l.code === (settings.language ?? 'en'))?.label ||
                  'English'}
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'var(--c-text-secondary)' }}
              >
                expand_more
              </span>
            </motion.button>
          </SettingRow>
        </SettingSection>

        {/* Accessibility Section */}
        <SettingSection title="Accessibility">
          <SettingRow
            label="High Contrast"
            desc="Sharpen text and interface elements for better readability"
          >
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
          <SettingRow
            label="Performance Boost"
            desc="Optimize system rendering engine for heavy audio/visual tasks"
          >
            <Toggle
              value={settings.performanceMode ?? false}
              onChange={(v) => settingsController.updateSettings({ performanceMode: v })}
            />
          </SettingRow>
        </SettingSection>
      </SettingsContentContainer>

      <LanguagePickerSheet open={isLanguageOpen} onClose={() => setIsLanguageOpen(false)} />
    </>
  );
}
