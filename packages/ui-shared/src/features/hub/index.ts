// features/hub/index.ts — Hub module public API

// Components
export { default as StudioHub } from './components/StudioHub';
export { HubAppGrid } from './components/HubAppGrid';

// Navigation
export { SharedNavigationBar } from './navigation/SharedNavigationBar';
export { BottomNavigationController } from './navigation/BottomNavigationController';
export { LiquidBottomNav } from './navigation/LiquidBottomNav';

// Animations
export * from './animations/AppAnimationSystem';
export {
  LaunchAnimationEngine,
  type LaunchPreset,
} from './animations/LaunchAnimationEngine';
export { ApplicationTransitionEngine } from './animations/ApplicationTransitionEngine';

// Settings
export { default as StudioHubSettingsPanel } from './settings/StudioHubSettingsPanel';
export { default as HubChangelogSection } from './settings/HubChangelogSection';

// Icons
export * from './icons/NavIcons';
