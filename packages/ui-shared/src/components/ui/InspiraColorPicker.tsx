import React, { useMemo, useCallback } from 'react';
import { ACCENT_COLORS, useSettingsStore, settingsController } from '@workspace/studio-core';
import { ColorPicker } from './color-picker';

export interface InspiraColorPickerProps {
  value?: string;
  onChange?: (colorKeyOrHex: string) => void;
  className?: string;
}

/**
 * Livex HTML Specification Color Picker Implementation
 * Integrates the fluidfunctionalism ColorPicker with the Studio accent color system.
 * Supports HEX, RGB, HSL, OKLCH formats, eyedropper, and preset swatches.
 * Alpha/opacity is disabled as it is not used anywhere in Studio.
 */
export default function InspiraColorPicker({ className = '' }: InspiraColorPickerProps) {
  const settings = useSettingsStore((s) => s.settings);
  const currentAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'purple';
  const activeColorObj = ACCENT_COLORS[currentAccentKey] ?? ACCENT_COLORS.purple;

  const currentHex = activeColorObj.from;

  // Build swatches from the accent palette + user presets
  const swatches = useMemo(() => {
    const paletteColors = Object.values(ACCENT_COLORS).map((c) => c.from);
    // Deduplicate while preserving order
    return [...new Set(paletteColors)];
  }, []);

  const handleValueChange = useCallback(
    (hex: string) => {
      // Strip alpha if present (e.g. #RRGGBBAA → #RRGGBB)
      const cleanHex = hex.length > 7 ? hex.slice(0, 7) : hex;

      // Check if the selected color matches a named accent
      const matchKey = Object.keys(ACCENT_COLORS).find(
        (k) => ACCENT_COLORS[k].from.toLowerCase() === cleanHex.toLowerCase()
      );

      if (matchKey) {
        settingsController.updateSettings({ accentColor: matchKey as any });
      } else {
        // Custom color — extract hue for the custom accent system
        const r = parseInt(cleanHex.slice(1, 3), 16) || 0;
        const g = parseInt(cleanHex.slice(3, 5), 16) || 0;
        const b = parseInt(cleanHex.slice(5, 7), 16) || 0;

        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        let h = 0;
        if (max !== min) {
          const d = max - min;
          const rn = r / 255, gn = g / 255, bn = b / 255;
          switch (max) {
            case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60; break;
            case gn: h = ((bn - rn) / d + 2) * 60; break;
            case bn: h = ((rn - gn) / d + 4) * 60; break;
          }
        }

        settingsController.updateSettings({
          accentColor: 'custom',
          customAccentHue: Math.round(h),
        });
      }
    },
    []
  );

  return (
    <div className={`w-full ${className}`}>
      <ColorPicker
        value={currentHex}
        onValueChange={handleValueChange}
        defaultFormat="hex"
        swatches={swatches}
        hideAlpha
      />
    </div>
  );
}
