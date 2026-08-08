import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
// ── Theme Hook (Left for backwards-compat) ─────────────────────────────────
export function useStudioDesignSystem() {
  const settings = useSettingsStore((s) => s.settings);
  const appKey = (NavigationDispatcher.currentApp()) as AppKey;
  const activeVis = settings.perApp?.[appKey] ?? {
    theme: settings.theme ?? 'dark',
    amoledMode: settings.amoledMode ?? false,
  };
  const accent = ACCENT_COLORS.blue;
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  return { isLight, activeVis, accent };
}

