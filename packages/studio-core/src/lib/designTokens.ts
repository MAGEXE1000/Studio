/**
 * Studio Flagship 2026 Design Tokens
 * Centralized styling, animation, layout, and motion values.
 */

export const ColorTokens = {
  accentBlue: '#3b82f6',
  accentPurple: '#a855f7',
  accentPink: '#ec4899',
  accentGreen: '#10b981',
  accentYellow: '#f59e0b',
  
  darkBg: '#0a0a0c',
  darkSurfaceLowest: '#0d0d0f',
  darkSurfaceLow: '#16161a',
  darkSurfaceMid: '#222227',
  darkSurfaceHigh: '#2e2e35',
  
  lightBg: '#f8f9fa',
  lightSurfaceLowest: '#f5f5f5',
  lightSurfaceLow: '#f1f3f5',
  lightSurfaceMid: '#e9ecef',
  lightSurfaceHigh: '#dee2e6',
  
  borderDark: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.08)',
  
  glassBgDark: 'rgba(0, 0, 0, 0.60)',
  glassBgLight: 'rgba(255, 255, 255, 0.60)',
};

export const TypographyTokens = {
  headlineFont: 'Inter, system-ui, sans-serif',
  bodyFont: 'Inter, system-ui, sans-serif',
};

export const SpacingTokens = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  // Standard position above gesture navigation bar and safe areas
  bottomNavSafe: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
};

export const RadiusTokens = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  full: '9999px',
};

export const BlurTokens = {
  navBg: 'blur(8px)',
  glassBg: 'blur(16px)',
};

export const ShadowTokens = {
  navShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

export const GlassTokens = {
  border: '1.5px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.60)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
};

export const MotionTokens = {
  transitionDurationHub: 0.35,
  transitionDurationApp: 0.95,
  transitionEaseHub: 'easeOut',
  transitionEaseApp: [0.65, 0, 0.35, 1],
};

export const SpringPresets = {
  soft: { type: 'spring', stiffness: 380, damping: 22, mass: 0.5 },
  stiff: { type: 'spring', stiffness: 500, damping: 25, mass: 0.4 },
  expressive: { type: 'spring', stiffness: 400, damping: 20, mass: 0.35 },
};

export const HapticTokens = {
  tap: 8,
  drag: 5,
  hold: 15,
};
