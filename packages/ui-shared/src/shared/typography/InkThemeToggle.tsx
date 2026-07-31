import React, { useRef, useCallback } from 'react';
import { useSettingsStore, settingsController, ThemeTransitionEngine } from '@workspace/studio-core';
import { SunIcon, MoonIcon, SunMoonIcon } from 'lucide-animated';
import { motion, AnimatePresence } from 'motion/react';

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

  const currentTheme = settings.theme ?? 'light';
  const isAmoled = settings.amoledMode ?? false;

  const activeState: 'light' | 'dark' | 'amoled' =
    currentTheme === 'dark'
      ? isAmoled
        ? 'amoled'
        : 'dark'
      : 'light';

  const handleToggle = useCallback(() => {
    if (isTransitioningRef.current || !buttonRef.current) return;
    isTransitioningRef.current = true;

    const btn = buttonRef.current;
    const rect = btn.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    let nextThemeStr = 'dark';
    let nextAmoled = false;

    if (activeState === 'light') {
      nextThemeStr = 'dark';
      nextAmoled = false;
    } else if (activeState === 'dark') {
      nextThemeStr = 'dark';
      nextAmoled = true;
    } else {
      nextThemeStr = 'light';
      nextAmoled = false;
    }

    if (typeof (window as any).__triggerThemeTransition === 'function') {
      (window as any).__triggerThemeTransition(nextThemeStr, nextAmoled, startX, startY, () => {
        settingsController.cycleNextTheme();
        isTransitioningRef.current = false;
      });
    } else {
      ThemeTransitionEngine.startTransition({
        nextTheme: nextThemeStr,
        amoled: nextAmoled,
        startX,
        startY,
        updateFn: () => {
          settingsController.cycleNextTheme();
          isTransitioningRef.current = false;
        },
      });
    }
  }, [activeState]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      aria-label={`Current Theme: ${activeState}. Tap to cycle.`}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90 hover:scale-105 ${className || ''}`}
      style={{
        background: 'var(--c-surface-high)',
        border: '1px solid var(--c-border)',
        color: 'var(--c-text-primary)',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {activeState === 'light' && (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center justify-center"
          >
            <SunIcon size={20} color="var(--c-text-primary)" />
          </motion.div>
        )}

        {activeState === 'dark' && (
          <motion.div
            key="moon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center justify-center"
          >
            <MoonIcon size={20} color="var(--c-text-primary)" />
          </motion.div>
        )}

        {activeState === 'amoled' && (
          <motion.div
            key="sunmoon"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center justify-center"
          >
            <SunMoonIcon size={20} color="var(--c-text-primary)" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
