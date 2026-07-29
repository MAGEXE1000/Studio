import { create } from 'zustand';
import { applyThemeTokens, rawAccentColors } from '../lib/preferences/themeEngine';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type NavigationRoute } from '../lib/navigation/navigationTypes';
import { detectDeviceLanguage, type Language as I18nLanguage } from '../lib/i18n';
import { settingsRepository } from '../repositories/SettingsRepository';
import type { Instrument } from '../data/chords';

export type Theme = 'dark' | 'light' | 'system' | 'dynamic';
export type ActivePanel = 'library' | 'settings' | 'songs';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal' | 'custom';
export type AppKey = 'hub' | 'chords' | 'drums' | 'stage' | 'groovex' | 'vocalex';
export type AppRoute = NavigationRoute;

export interface PerAppVisuals {
  theme: Theme;
  accentColor: AccentColor;
  amoledMode: boolean;
}

export type Language = I18nLanguage;
export type AnimationSpeed = 'normal' | 'fast' | 'reduced';
export type DisplayDensity = 'compact' | 'comfortable' | 'spacious';

export interface AppSettings {
  appMode?: AppKey;
  instrument: Instrument;
  theme: Theme;
  showNoteNames: boolean;
  showIntervals: boolean;
  tuning: string;
  amoledMode: boolean;
  accentColor: AccentColor;
  leftHanded: boolean;
  showFretNumbers: boolean;
  showFingerNumbers: boolean;
  animationSpeed: AnimationSpeed;
  displayDensity: DisplayDensity;
  showChordQualityColors: boolean;
  diagramSize: number;
  bassFiveString: boolean;
  hapticFeedback: boolean;
  showOpenStrings: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showIntervalNames: boolean;
  liveModeAnimations: boolean;
  liveModeDiagram: boolean;
  liveChordSize: number;
  language: Language;
  preferFlats: boolean;
  defaultTab: ActivePanel;
  defaultDrumTab: 'songs' | 'patterns' | 'prefs';
  defaultStageView: 'Editor' | 'Setup' | 'Preferences';
  defaultVocalexTab?: 'coach' | 'recorder' | 'takes' | 'preferences';
  defaultGroovexView?: 'library' | 'preferences';
  startupApp: 'chords' | 'drums' | 'hub' | 'stage' | 'groovex' | 'vocalex';
  hubUserName: string;
  highRefreshRate: boolean;
  lowLatencyMode: boolean;
  performanceMode: boolean;
  chordAssistant: boolean;
  assistantSmartSuggestions: boolean;
  assistantProgressionTips: boolean;
  assistantConflictDetection: boolean;
  assistantLearning: boolean;
  restoreLastSession: boolean;
  autoHideSidebarInApps: boolean;
  swipeBackBehavior: 'exit-to-hub' | 'manual-only';
  perApp: Record<AppKey, PerAppVisuals>;
  customAccentHue: number;
  dynamicLightStart: number;
  dynamicLightEnd: number;
  privacyAnalytics: boolean;
  privacyCrashReports: boolean;
  privacyPerfReports: boolean;
  autoBackup: boolean;
  syncAcrossDevices: boolean;
  backupFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  backupRetention: 'forever' | '90days' | '30days';
  autoCleanTemp: boolean;
  lastExportDate: string;
  activityHistoryEnabled: boolean;
  developerMode: boolean;
  syncBackendProvider: 'firebase-firestore-legacy' | 'supabase-realtime' | 'supabase-powersync';
  launchAnimationPreset?: 'fluid_surface' | 'liquid_glass' | 'ripple_reveal' | 'layer_expansion' | 'aurora_reveal';
}

export interface SettingsStore {
  settings: AppSettings;
  lastSession: {
    app?: AppKey;
    vocalexTab?: 'coach' | 'recorder' | 'takes' | 'preferences';
    stagexView?: string;
    drumexTab?: 'songs' | 'patterns' | 'prefs';
    groovexView?: 'library' | 'player' | 'preferences';
  };

  updateSettings: (settings: Partial<AppSettings>) => void;
  updatePerApp: (apps: AppKey[], patch: Partial<PerAppVisuals>) => void;
  setLastSession: (patch: Partial<SettingsStore['lastSession']>) => void;
}



export const ACCENT_COLORS = new Proxy(rawAccentColors, {
  get(target, prop) {
    if (prop === 'custom') {
      try {
        const state = useSettingsStore.getState();
        const hue = state?.settings?.customAccentHue ?? 220;
        return {
          from: `hsl(${hue}, 75%, 65%)`,
          mid: `hsl(${hue}, 80%, 55%)`,
          to: `hsl(${(hue + 25) % 360}, 85%, 42%)`,
        };
      } catch (e) {
        return target.custom;
      }
    }
    return target[prop as keyof typeof target] || target.blue;
  },
}) as typeof rawAccentColors;

// Default values to use if there is no previous state.
const DEFAULT_SETTINGS: AppSettings = {
  instrument: 'guitar',
  theme: 'dark',
  showNoteNames: true,
  showIntervals: false,
  tuning: 'Standard (EADGBE)',
  amoledMode: false,
  accentColor: 'blue',
  leftHanded: false,
  showFretNumbers: true,
  showFingerNumbers: false,
  animationSpeed: 'normal',
  displayDensity: 'comfortable',
  showChordQualityColors: true,
  diagramSize: 60,
  bassFiveString: false,
  hapticFeedback: true,
  showOpenStrings: true,
  fontSize: 'medium',
  showIntervalNames: false,
  liveModeAnimations: true,
  liveModeDiagram: false,
  liveChordSize: 100,
  language: detectDeviceLanguage(),
  preferFlats: false,
  defaultTab: 'library',
  defaultDrumTab: 'songs',
  defaultStageView: 'Editor',
  defaultVocalexTab: 'coach',
  defaultGroovexView: 'library',
  startupApp: 'hub',
  hubUserName: '',
  highRefreshRate: false,
  lowLatencyMode: false,
  performanceMode: false,
  chordAssistant: false,
  assistantSmartSuggestions: true,
  assistantProgressionTips: true,
  assistantConflictDetection: true,
  assistantLearning: true,
  restoreLastSession: false,
  autoHideSidebarInApps: true,
  swipeBackBehavior: 'exit-to-hub',
  customAccentHue: 220,
  dynamicLightStart: 7,
  dynamicLightEnd: 20,
  privacyAnalytics: false,
  privacyCrashReports: false,
  privacyPerfReports: false,
  autoBackup: false,
  syncAcrossDevices: false,
  backupFrequency: 'manual',
  backupRetention: 'forever',
  autoCleanTemp: false,
  lastExportDate: 'Never exported',
  activityHistoryEnabled: true,
  developerMode: false,
  syncBackendProvider: (import.meta.env.VITE_SYNC_BACKEND_PROVIDER as any) || 'supabase-realtime',
  launchAnimationPreset: 'fluid_surface',
  perApp: {
    hub: { theme: 'dark', accentColor: 'blue', amoledMode: false },
    chords: { theme: 'dark', accentColor: 'blue', amoledMode: false },
    drums: { theme: 'dark', accentColor: 'blue', amoledMode: false },
    stage: { theme: 'dark', accentColor: 'blue', amoledMode: false },
    vocalex: { theme: 'dark', accentColor: 'blue', amoledMode: false },
    groovex: { theme: 'dark', accentColor: 'blue', amoledMode: false },
  },
};

const DEFAULT_LAST_SESSION = { app: 'hub' as AppKey };

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      lastSession: DEFAULT_LAST_SESSION,

      updateSettings: (newSettings) => {
        set((state) => {
          const nextSession = state.lastSession;
          const updatedSettings = { ...state.settings, ...newSettings };

          if (newSettings.theme || newSettings.accentColor || newSettings.amoledMode !== undefined) {
            const updatedPerApp = { ...updatedSettings.perApp };
            (Object.keys(updatedPerApp) as AppKey[]).forEach((app) => {
              updatedPerApp[app] = {
                ...updatedPerApp[app],
                ...(newSettings.theme && { theme: newSettings.theme }),
                ...(newSettings.accentColor && { accentColor: newSettings.accentColor }),
                ...(newSettings.amoledMode !== undefined && { amoledMode: newSettings.amoledMode }),
              };
            });
            updatedSettings.perApp = updatedPerApp;
          }

          return {
            settings: updatedSettings,
            lastSession: nextSession,
          };
        });
      },

      setLastSession: (patch) => {
        set((state) => ({ lastSession: { ...state.lastSession, ...patch } }));
      },

      updatePerApp: (apps, patch) => {
        set((state) => {
          const perApp = { ...state.settings.perApp };
          apps.forEach((app) => {
            perApp[app] = { ...perApp[app], ...patch };
          });
          return { settings: { ...state.settings, perApp } };
        });
      },
    }),
    {
      name: 'settings-storage-v1',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          try {
            const raw = settingsRepository.readLegacyRawState();
            if (raw) {
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (parsed && parsed.state) {
                const oldSettings = parsed.state.settings || {};
                const oldLastSession = parsed.state.lastSession || {};
                return {
                  settings: { ...DEFAULT_SETTINGS, ...oldSettings },
                  lastSession: { ...DEFAULT_LAST_SESSION, ...oldLastSession },
                };
              }
            }
          } catch (e) {
          }
        }
        return persistedState;
      },
      merge: (persistedState: any, currentState: SettingsStore) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        const settings = persistedState.settings
          ? { ...currentState.settings, ...persistedState.settings }
          : currentState.settings;
        const lastSession = persistedState.lastSession
          ? { ...currentState.lastSession, ...persistedState.lastSession }
          : currentState.lastSession;
        return {
          ...currentState,
          settings,
          lastSession,
        };
      },
      storage: createJSONStorage(() => ({
        getItem: () => settingsRepository.readRawState(),
        setItem: (_, value) => settingsRepository.writeRawState(value),
        removeItem: () => settingsRepository.clearState(),
      })),
    }
  )
);

if (typeof window !== 'undefined') {
  useSettingsStore.subscribe((state) => {
    applyThemeTokens(state.settings);
  });
}

export const settingsController = {
  updateSettings: (patch: Partial<AppSettings>) => {
    useSettingsStore.getState().updateSettings(patch);
    applyThemeTokens(useSettingsStore.getState().settings);
  },
  updatePerApp: (apps: AppKey[], patch: Partial<PerAppVisuals>) => {
    useSettingsStore.getState().updatePerApp(apps, patch);
    applyThemeTokens(useSettingsStore.getState().settings);
  }
};
