import { NavigationDispatcher } from '../navigation/NavigationDispatcher';
import { Capacitor } from '@capacitor/core';
import { syncStatusBar } from '../platform/useStatusBar';
export const rawAccentColors = {
  blue: { from: '#679cff', to: '#007aff', mid: '#4d8ef7' },
  purple: { from: '#b57bee', to: '#7c3aed', mid: '#9d60e6' },
  green: { from: '#34d399', to: '#059669', mid: '#10b981' },
  orange: { from: '#fb923c', to: '#ea580c', mid: '#f97316' },
  pink: { from: '#f472b6', to: '#db2777', mid: '#ec4899' },
  teal: { from: '#2dd4bf', to: '#0891b2', mid: '#14b8a6' },
  custom: { from: '#6ea8fe', to: '#0d6efd', mid: '#4188fc' },
};

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'system' | 'dynamic';
  accentColor: string;
  amoledMode: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  displayDensity?: 'compact' | 'comfortable' | 'spacious';
  animationSpeed?: 'fast' | 'normal' | 'reduced';
  customAccentHue?: number;
  dynamicLightStart?: number;
  dynamicLightEnd?: number;
}

export function applyThemeTokens(settings: any) {
  if (typeof document === 'undefined') return;

  const globalTheme = settings?.theme ?? 'dark';
  const globalAccent = settings?.accentColor ?? 'blue';
  const globalAmoled = settings?.amoledMode ?? false;

  const appMode = NavigationDispatcher.currentApp();
  const perAppVis = settings?.perApp?.[appMode];

  const activeVis = {
    theme: perAppVis?.theme ?? globalTheme,
    accentColor: perAppVis?.accentColor ?? globalAccent,
    amoledMode: perAppVis?.amoledMode ?? globalAmoled,
  };

  const root = document.documentElement;

  // 1. Resolve Light/Dark Mode
  const systemIsLight =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
  let isLightMode = false;
  const theme = activeVis.theme;
  if (theme === 'light') {
    isLightMode = true;
  } else if (theme === 'system') {
    isLightMode = systemIsLight;
  } else if (theme === 'dynamic') {
    const h = new Date().getHours();
    const start = settings?.dynamicLightStart ?? 7;
    const end = settings?.dynamicLightEnd ?? 20;
    isLightMode = h >= start && h < end;
  }

  // Update HTML theme classes
  if (isLightMode) {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  if (activeVis.amoledMode) {
    root.classList.add('amoled');
  } else {
    root.classList.remove('amoled');
  }

  // 2. Color Tokens
  // Backgrounds
  const bg = isLightMode ? '#f4f4f5' : activeVis.amoledMode ? '#000000' : '#09090b';
  const lowest = isLightMode ? '#e4e4e7' : activeVis.amoledMode ? '#000000' : '#0e0e11';
  const low = isLightMode ? '#ececed' : activeVis.amoledMode ? '#030303' : '#131316';
  const mid = isLightMode ? '#f4f4f5' : activeVis.amoledMode ? '#080808' : '#191a1e';
  const high = isLightMode ? '#fafafa' : activeVis.amoledMode ? '#0d0d0d' : '#1f2025';
  const highest = isLightMode ? '#ffffff' : activeVis.amoledMode ? '#121212' : '#25262c';

  root.style.setProperty('--c-background', bg);
  root.style.setProperty('--c-surface-lowest', lowest);
  root.style.setProperty('--c-surface-low', low);
  root.style.setProperty('--c-surface-mid', mid);
  root.style.setProperty('--c-surface-high', high);
  root.style.setProperty('--c-surface-highest', highest);

  // Borders
  const border = isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const borderDashed = isLightMode
    ? '1px dashed rgba(0, 0, 0, 0.16)'
    : '1px dashed rgba(255, 255, 255, 0.16)';
  root.style.setProperty('--c-border', border);
  root.style.setProperty('--c-border-dashed', borderDashed);

  // Glassmorphism overlays
  const glassBg = isLightMode
    ? activeVis.amoledMode
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(255, 255, 255, 0.40)'
    : activeVis.amoledMode
      ? 'rgba(4, 4, 4, 0.88)'
      : 'rgba(26, 26, 30, 0.72)';
  const glassBlur = 'blur(16px)';
  root.style.setProperty('--c-surface-glass-bg', glassBg);
  root.style.setProperty('--c-surface-glass-blur', glassBlur);

  // Text
  const textPrimary = isLightMode ? '#18181b' : '#e7e5e4';
  const textSecondary = isLightMode ? '#52525b' : '#acabaa';
  const textMuted = isLightMode ? '#71717a' : '#484848';
  root.style.setProperty('--c-text-primary', textPrimary);
  root.style.setProperty('--c-text-secondary', textSecondary);
  root.style.setProperty('--c-text-muted', textMuted);

  // Accent Color Tokens
  const hubAccentKey = activeVis.accentColor ?? 'blue';
  const accent =
    hubAccentKey === 'custom'
      ? {
          from: `hsl(${settings.customAccentHue ?? 220}, 75%, 65%)`,
          mid: `hsl(${settings.customAccentHue ?? 220}, 80%, 55%)`,
          to: `hsl(${((settings.customAccentHue ?? 220) + 25) % 360}, 85%, 42%)`,
        }
      : ((rawAccentColors as any)[hubAccentKey] ?? rawAccentColors.blue);

  root.style.setProperty('--c-accent-from', accent.from);
  root.style.setProperty('--c-accent-to', accent.to);
  root.style.setProperty('--c-accent-mid', accent.mid);

  const colorToRgbStr = (colorStr: string) => {
    if (colorStr.startsWith('rgb')) {
      const m = colorStr.match(/\d+/g);
      return m ? m.slice(0, 3).join(', ') : '0, 122, 255';
    }
    if (colorStr.startsWith('#')) {
      const hex = colorStr.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return '0, 122, 255';
  };

  root.style.setProperty('--c-accent-rgb', colorToRgbStr(accent.to));
  root.style.setProperty('--c-accent-soft', `color-mix(in srgb, ${accent.to} 12%, transparent)`);
  root.style.setProperty(
    '--c-accent-glow',
    `0 4px 20px color-mix(in srgb, ${accent.to} 25%, transparent)`
  );
  root.style.setProperty('--c-accent-border', `color-mix(in srgb, ${accent.to} 30%, transparent)`);
  root.style.setProperty('--c-brand', accent.from);

  // Error colors
  root.style.setProperty('--c-error', '#ef4444');
  root.style.setProperty('--c-error-dim', '#f87171');
  root.style.setProperty(
    '--c-error-container',
    isLightMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.15)'
  );

  // 3. Spacing Tokens
  root.style.setProperty('--spacing-xs', '4px');
  root.style.setProperty('--spacing-sm', '8px');
  root.style.setProperty('--spacing-md', '16px');
  root.style.setProperty('--spacing-lg', '24px');
  root.style.setProperty('--spacing-xl', '32px');

  // Sync density-aware layout spacing
  const densities = {
    compact: { pad: '10px', rowPad: '10px 20px', gap: '8px', cardGap: '6px' },
    comfortable: { pad: '16px', rowPad: '14px 20px', gap: '12px', cardGap: '10px' },
    spacious: { pad: '22px', rowPad: '20px 24px', gap: '18px', cardGap: '16px' },
  };
  const d = (densities as any)[settings.displayDensity] || densities.comfortable;
  root.style.setProperty('--c-space-pad', d.pad);
  root.style.setProperty('--c-space-row-pad', d.rowPad);
  root.style.setProperty('--c-space-gap', d.gap);
  root.style.setProperty('--c-space-card-gap', d.cardGap);

  root.style.setProperty('--density-pad', d.pad);
  root.style.setProperty('--density-row-pad', d.rowPad);
  root.style.setProperty('--density-gap', d.gap);
  root.style.setProperty('--density-card-gap', d.cardGap);
  root.setAttribute('data-density', settings.displayDensity);

  // 4. Radius Tokens
  root.style.setProperty('--radius-xs', '0.25rem');
  root.style.setProperty('--radius-sm', '0.5rem');
  root.style.setProperty('--radius-md', '0.75rem');
  root.style.setProperty('--radius-lg', '1rem');
  root.style.setProperty('--radius-xl', '1.25rem');
  root.style.setProperty('--radius-2xl', '1.5rem');
  root.style.setProperty('--radius-3xl', '2rem');
  root.style.setProperty('--radius-full', '9999px');

  // 5. Elevation Tokens
  root.style.setProperty('--elevation-low', isLightMode ? '0 1px 3px rgba(0,0,0,0.06)' : 'none');
  root.style.setProperty('--elevation-mid', isLightMode ? '0 4px 12px rgba(0,0,0,0.04)' : 'none');
  root.style.setProperty(
    '--elevation-high',
    isLightMode ? '0 12px 32px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.4)'
  );

  // 6. Typography Tokens
  root.style.setProperty('--font-headline', 'Manrope, sans-serif');
  root.style.setProperty('--font-body', 'Inter, sans-serif');

  const sizes = {
    small: { base: '13px', sm: '11px', xs: '9px', lg: '16px', xl: '20px', hero: '2.2rem' },
    medium: { base: '14px', sm: '12px', xs: '10px', lg: '18px', xl: '24px', hero: '2.8rem' },
    large: { base: '16px', sm: '13px', xs: '11px', lg: '20px', xl: '26px', hero: '3.2rem' },
  };
  const s = (sizes as any)[settings.fontSize] || sizes.medium;
  root.style.setProperty('--font-base', s.base);
  root.style.setProperty('--font-sm', s.sm);
  root.style.setProperty('--font-xs', s.xs);
  root.style.setProperty('--font-lg', s.lg);
  root.style.setProperty('--font-xl', s.xl);
  root.style.setProperty('--font-hero', s.hero);
  root.style.fontSize = s.base;
  root.setAttribute('data-text-scale', settings.fontSize);

  // Apply zoom/scale to document.body for immediate live updates to density
  const densityScales = {
    compact: 0.90,
    comfortable: 1.0,
    spacious: 1.10,
  };
  const ds = densityScales[settings.displayDensity as keyof typeof densityScales] || 1.0;

  if (root) {
    (root.style as any).zoom = '';
    root.style.width = '';
    root.style.height = '';
    root.style.minHeight = '';
  }

  if (typeof document !== 'undefined' && document.body) {
    document.body.style.zoom = String(ds);
    document.body.style.width = `calc(100% / ${ds})`;
    document.body.style.height = `calc(100% / ${ds})`;
    document.body.style.minHeight = `calc(100vh / ${ds})`;
  }

  // 7. Motion Tokens
  const isReduced = settings.animationSpeed === 'reduced';
  const speedScale = settings.animationSpeed === 'fast' ? 0.6 : 1.0;
  root.style.setProperty('--motion-speed-scale', isReduced ? '0' : String(speedScale));
  root.style.setProperty('--motion-duration', isReduced ? '0s' : '0.3s');
  root.style.setProperty('--motion-easing', 'cubic-bezier(0.25, 1, 0.5, 1)');
  root.setAttribute('data-anim', isReduced ? 'reduced' : settings.animationSpeed);

  // Performance / High refresh
  if (settings.performanceMode) root.setAttribute('data-perf-mode', 'on');
  else root.removeAttribute('data-perf-mode');

  if (settings.highRefreshRate) {
    root.setAttribute('data-hifps', 'on');
  } else {
    root.removeAttribute('data-hifps');
  }

  // StatusBar Sync
  void syncStatusBar(activeVis.theme, activeVis.amoledMode);
}
