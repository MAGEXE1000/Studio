// Export everything from ui-shared
export { default as AppSpinner } from './components/AppSpinner';
export { default as ElasticSlider } from './components/ElasticSlider';
export { default as GradientBorderCard } from './components/GradientBorderCard';
export { default as SmartLoading, AppLoadingScreen } from './components/SmartLoading';
export { SharedNavigationContainer } from './navigation/SharedNavigationContainer';
export { default as StudioCountUpPercentage } from './components/StudioCountUpPercentage';
export { default as StudioProgressBar } from './components/StudioProgressBar';
export { default as StudioThemeToggler } from './components/StudioThemeToggler';
export { default as InkThemeToggle } from './components/typography/InkThemeToggle';
export { default as StudioTitleReveal } from './components/StudioTitleReveal';
export { default as StudioUpdateAuroraBackground } from './components/StudioUpdateAuroraBackground';
export { ErrorBoundary } from './components/ErrorBoundary';
export * from './components/ChordexLogo';
export { default as PianoDiagram } from './components/PianoDiagram';
export { default as GuitarDiagram } from './components/GuitarDiagram';
export { default as FourStringDiagram } from './components/FourStringDiagram';
export { default as ChordDiagram } from './components/ChordDiagram';
export * from './components/StudioSkeleton';
export { LibraryPanel } from './features/chordex';
export { AnimatedIcon } from './components/icons/AnimatedIcon';
export * from './components/icons/bakaiIconLibrary';
export { LiquidSurfaceEngine } from './components/liquid/LiquidSurfaceEngine';
export { LiquidBottomNav } from './navigation/LiquidBottomNav';
export { SaxophonePracticePanel } from './features/chordex/pages/SaxophonePracticePanel';
export { SaxophoneView } from './features/chordex/components/SaxophoneView';
export { default as SettingsPanel } from './panels/SettingsPanel';
export { default as ChordexSettingsPanel } from './features/chordex/ChordexSettingsPanel';
export { default as StudioHubSettingsPanel } from './features/hub/StudioHubSettingsPanel';
export { default as HubChangelogSection } from './features/hub/HubChangelogSection';
export { SongsPanel } from './features/chordex';
export { DrumEditor } from './features/drumex';
export { GroovexApp } from './features/groovex';
export { VocalexApp } from './features/vocalex';
export { StageCorePanel } from './features/stagex';
export { default as StudioHub } from './components/StudioHub';
export * from './components/NavIcons';
export * from './navigation/AppAnimationSystem';
export { SongPracticeView } from './components/SongPracticeView';

// Remaining components in ui-shared/components
export { default as AccountCard } from './components/AccountCard';
export { default as ApplyToSheet } from './components/ApplyToSheet';
export { default as ChangelogSheet } from './components/ChangelogSheet';
export { default as CustomChordBuilder } from './components/CustomChordBuilder';
export { default as DisabledAccountScreen } from './components/DisabledAccountScreen';
export * from './components/DownloadIcon';
export { default as PendingDeletionScreen } from './components/PendingDeletionScreen';
export { default as ProgressionGenerator } from './components/ProgressionGenerator';
export * from './components/ScrollFade';
export * from './components/SettingControls';
export { default as StudioAuthCard } from './components/StudioAuthCard';
export { default as StudioPricingSection } from './components/StudioPricingSection';
export { default as StudioUpdateScreen } from './components/StudioUpdateScreen';
export { default as ProfileDropdown } from './components/kokonutui/profile-dropdown';

// Animata
export { default as AnimatedActionButton } from './components/animata/container/animated-border-trail';
export { default as StudioSpinner } from './components/animata/progress/spinner';

// Lottie
export { default as AppLottie } from './components/lottie/AppLottie';
export { default as EmptyStateLottie } from './components/lottie/EmptyStateLottie';
export { default as LoadingLottie } from './components/lottie/LoadingLottie';
export { default as MicWavesLottie } from './components/lottie/MicWavesLottie';
export { default as MusicNotesLottie } from './components/lottie/MusicNotesLottie';
export { default as NoResultsLottie } from './components/lottie/NoResultsLottie';
export { default as SuccessLottie } from './components/lottie/SuccessLottie';
export { default as VinylLottie } from './components/lottie/VinylLottie';

// UI
export * from './components/ui/encrypted-text';

export { useGroovexStore } from './features/groovex';
export { default as WebAppSectionDock } from './components/WebAppSectionDock';
export { default as DevToolsDashboard } from './components/DevToolsDashboard';

// BottomNav removed (architectural unification)
export { default as UpdateIndicator } from './components/UpdateIndicator';
export { default as UpdateDiagnosticsSheet } from './components/UpdateDiagnosticsSheet';
export * from './components/StudioLayoutSystem';
export { ProgressiveBlur } from './components/design-system/ProgressiveBlur';
export { ActionButton } from './components/design-system/StudioDesignSystem';
export { SharedNavigationBar } from './navigation/SharedNavigationBar';
export { BottomNavigationController } from './navigation/BottomNavigationController';
export {
  LaunchAnimationEngine,
  type LaunchPreset,
} from './components/launch/LaunchAnimationEngine';
export { ApplicationTransitionEngine } from './components/launch/ApplicationTransitionEngine';
export { default as InkThemeOverlay } from './components/feature/InkThemeOverlay';
export { default as html2canvas } from 'html2canvas';
export * from './components/design-system';
export * from './components/devtools/inspector';
