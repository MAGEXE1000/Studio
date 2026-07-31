import React from 'react';
import { useSettingsStore, settingsController, ACCENT_COLORS, ThemeTransitionEngine, type Theme } from '@workspace/studio-core';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { motion } from 'motion/react';

export default function PremiumThemeSwitcher() {
  const settings = useSettingsStore((s) => s.settings);
  const currentTheme = settings.theme ?? 'dark';
  const isAmoled = settings.amoledMode ?? false;

  const activeValue = currentTheme === 'light' ? 'light' : isAmoled ? 'amoled' : 'dark';

  const acc =
    ACCENT_COLORS[settings.perApp?.hub?.accentColor ?? settings.accentColor] ??
    ACCENT_COLORS.purple;

  const handleSetTheme = (mode: 'light' | 'dark' | 'amoled', e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    let nextTheme: Theme = 'dark';
    let nextAmoled = false;
    if (mode === 'light') {
      nextTheme = 'light';
      nextAmoled = false;
    } else if (mode === 'dark') {
      nextTheme = 'dark';
      nextAmoled = false;
    } else {
      nextTheme = 'dark';
      nextAmoled = true;
    }

    if (typeof (window as any).__triggerThemeTransition === 'function') {
      (window as any).__triggerThemeTransition(nextTheme, nextAmoled, x, y, () => {
        settingsController.updateSettings({ theme: nextTheme, amoledMode: nextAmoled });
      });
    } else {
      ThemeTransitionEngine.startTransition({
        nextTheme,
        amoled: nextAmoled,
        startX: x,
        startY: y,
        updateFn: () => {
          settingsController.updateSettings({ theme: nextTheme, amoledMode: nextAmoled });
        },
      });
    }
  };

  const options = [
    { value: 'light' as const, label: 'Light', Icon: Sun },
    { value: 'dark' as const, label: 'Dark', Icon: Moon },
    { value: 'amoled' as const, label: 'AMOLED', Icon: SunMoon },
  ];

  return (
    <div
      style={{
        background: 'var(--app-surface-lowest, #000000)',
        borderRadius: '9999px',
        padding: '3px',
        display: 'flex',
        position: 'relative',
        border: '1px solid rgba(128,128,128,0.08)',
      }}
    >
      {options.map((opt) => {
        const active = activeValue === opt.value;
        const Icon = opt.Icon;

        return (
          <button
            key={opt.value}
            onClick={(e) => handleSetTheme(opt.value, e)}
            className="btn-smooth relative outline-none cursor-pointer"
            style={{
              width: '36px',
              height: '32px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: active ? '#ffffff' : 'var(--c-text-secondary, #acabaa)',
              background: 'transparent',
              border: 'none',
              transition: 'color 200ms cubic-bezier(0.2, 0, 0, 1)',
              zIndex: 10,
              opacity: active ? 1 : 0.6,
            }}
            title={opt.label}
          >
            {active && (
              <motion.span
                layoutId="premium-theme-switcher-active"
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '9999px',
                  background: `linear-gradient(135deg, ${acc.from}, ${acc.to})`,
                  zIndex: -1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
            )}
            <Icon size={16} style={{ position: 'relative', zIndex: 11 }} />
          </button>
        );
      })}
    </div>
  );
}
