import React, { useRef, useCallback } from 'react';
import { useChordStore, ThemeTransitionEngine, useSettingsStore } from '@workspace/studio-core';

export default function InkThemeToggle({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const settings = useSettingsStore((s) => s.settings);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);

  // Resolve current active theme mode
  const currentTheme = settings.theme ?? 'dark';
  const isLight =
    currentTheme === 'light' ||
    (currentTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const handleToggle = useCallback(async () => {
    if (isTransitioningRef.current || !buttonRef.current) return;
    isTransitioningRef.current = true;

    const btn = buttonRef.current;
    const rect = btn.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const nextTheme = isLight ? 'dark' : 'light';

    if (typeof (window as any).__triggerThemeTransition === 'function') {
      (window as any).__triggerThemeTransition(nextTheme, false, startX, startY, () => {
        settingsController.updateSettings({
          theme: nextTheme,
          amoledMode: false,
        });
        isTransitioningRef.current = false;
      });
    } else {
      ThemeTransitionEngine.startTransition({
        nextTheme,
        amoled: false,
        startX,
        startY,
        updateFn: () => {
          settingsController.updateSettings({
            theme: nextTheme,
            amoledMode: false,
          });
          isTransitioningRef.current = false;
        },
      });
    }
  }, [isLight, updateSettings]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      className={`w-10 h-10 flex items-center justify-center rounded-full glass-surface text-on-surface hover:bg-white/5 active:scale-90 transition-transform ${className || ''}`}
      style={{
        border: '1px solid var(--c-border)',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined select-none"
        style={{
          fontSize: '20px',
          fontVariationSettings: "'FILL' 0",
        }}
      >
        {isLight ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
