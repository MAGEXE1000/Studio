/**
 * Navigation Module — ui-shared
 *
 * Single barrel for all navigation UI concerns:
 *   - navStyles         — shared CSS transform/transition helpers
 *   - SharedNavigationContainer — CSS-animation panel switcher (no Framer dep)
 *   - AppAnimationSystem — Framer Motion presets, PageTransition, AppEntryTransition
 *   - BottomNav         — mobile bottom navigation bar with LiquidGlass effect
 */

export * from './navStyles';
export * from './SharedNavigationContainer';
export * from './AppAnimationSystem';
export * from './BottomNav';
