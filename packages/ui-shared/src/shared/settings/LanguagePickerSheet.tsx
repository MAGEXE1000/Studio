import React from 'react';
import { useSettingsStore, settingsController, ACCENT_COLORS } from '@workspace/studio-core';
import { Dialog } from '../design-system/dialogs';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
] as const;

interface LanguagePickerSheetProps {
  open: boolean;
  onClose: () => void;
}

export function LanguagePickerSheet({ open, onClose }: LanguagePickerSheetProps) {
  const settings = useSettingsStore((s) => s.settings);
  
  const acc = ACCENT_COLORS.blue;

  return (
    <Dialog open={open} onClose={onClose} title="Select Language">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SUPPORTED_LANGUAGES.map(({ code, label }) => {
          const isSelected = (settings.language ?? 'en') === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => {
                settingsController.updateSettings({ language: code as any });
                onClose();
              }}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: isSelected
                  ? `linear-gradient(135deg, ${acc.from}18, ${acc.to}10)`
                  : 'transparent',
                color: isSelected ? acc.from : 'var(--c-text-primary)',
                fontSize: 14,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 200ms ease, color 200ms ease',
              }}
            >
              <span>{label}</span>
              {isSelected && (
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: acc.from }}>
                  check
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
