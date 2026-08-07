// features/hub/index.ts — Hub module public API

// Components
export { default as StudioHub } from './components/StudioHub';
export { HubAppGrid } from './components/HubAppGrid';

// Navigation
export { SharedNavigationBar } from './navigation/SharedNavigationBar';
export { BottomNavigationController } from './navigation/BottomNavigationController';


// Animations

export {
  LaunchAnimationEngine,
  type LaunchPreset,
} from '../../shared/animation/LaunchAnimationEngine';


// Settings
export { default as StudioHubSettingsPanel } from './settings/StudioHubSettingsPanel';
export { default as HubChangelogSection } from './settings/HubChangelogSection';

// Icons
export * from './icons/NavIcons';
