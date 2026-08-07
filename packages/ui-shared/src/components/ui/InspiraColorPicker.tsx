import React, { useMemo, useCallback } from 'react';
import { ACCENT_COLORS, useSettingsStore, settingsController } from '@workspace/studio-core';

export interface InspiraColorPickerProps {
  value?: string;
  onChange?: (colorKeyOrHex: string) => void;
  className?: string;
}

export default function InspiraColorPicker({ className = '' }: InspiraColorPickerProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const currentAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'purple';

  const handleSelectColor = useCallback((key: string) => {
    updateSettings({ accentColor: key as any });
  }, [updateSettings]);

  const swatches = useMemo(() => {
    return Object.entries(ACCENT_COLORS).map(([key, val]) => ({
      key,
      color: val.from,
    }));
  }, []);

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {swatches.map(({ key, color }) => (
        <button
          key={key}
          onClick={() => handleSelectColor(key)}
          style={{ backgroundColor: color }}
          className={`w-7 h-7 rounded-full transition-transform border-2 ${
            currentAccentKey === key ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
          }`}
          title={key}
          type="button"
        />
      ))}
    </div>
  );
}
