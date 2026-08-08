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
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function InspiraColorPicker({ className = '' }: InspiraColorPickerProps) {
  const settings = useSettingsStore((s) => s.settings);
  const currentAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'purple';
  const activeColorObj = ACCENT_COLORS[currentAccentKey] ?? ACCENT_COLORS.purple;

  let currentHex = activeColorObj.from;
  if (currentHex.startsWith('hsl')) {
    const m = currentHex.match(/\d+/g);
    if (m && m.length >= 3) {
      currentHex = hslToHex(parseInt(m[0], 10), parseInt(m[1], 10), parseInt(m[2], 10));
    }
  }

  // Build swatches from the accent palette + user presets
  const swatches = useMemo(() => {
    const paletteColors = Object.values(ACCENT_COLORS).map((c) => c.from);
    return [...new Set(paletteColors)];
  }, []);

  const pendingCommitRef = React.useRef<any>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const applyInstantCssVars = useCallback((cleanHex: string) => {
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--c-accent-from', cleanHex);
    root.style.setProperty('--c-accent-to', cleanHex);
    root.style.setProperty('--c-accent-mid', cleanHex);
    root.style.setProperty('--c-brand', cleanHex);
  }, []);

  const commitSettingUpdate = useCallback((cleanHex: string) => {
    const matchKey = Object.keys(ACCENT_COLORS).find(
      (k) => ACCENT_COLORS[k].from.toLowerCase() === cleanHex.toLowerCase()
    );

    if (matchKey) {
      settingsController.updateSettings({ accentColor: matchKey as any });
    } else {
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
  }, []);

  const handleValueChange = useCallback(
    (hex: string) => {
      const cleanHex = hex.length > 7 ? hex.slice(0, 7) : hex;

      // 1. Instant 60 FPS CSS variable update (no React re-renders)
      applyInstantCssVars(cleanHex);

      // 2. Throttle Zustand store commit to RAF
      pendingCommitRef.current = cleanHex;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (pendingCommitRef.current) {
            commitSettingUpdate(pendingCommitRef.current);
            pendingCommitRef.current = null;
          }
        });
      }
    },
    [applyInstantCssVars, commitSettingUpdate]
  );

  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

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
