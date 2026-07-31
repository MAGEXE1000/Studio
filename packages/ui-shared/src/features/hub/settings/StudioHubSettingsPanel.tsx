import React from 'react';
import {
  useSettingsStore,
  settingsController,
  ThemeTransitionEngine,
  NavigationDispatcher,
} from '@workspace/studio-core';
import { StudioPageTransition } from '../../../components/StudioPageTransition';
import InspiraColorPicker from '../../../components/ui/InspiraColorPicker';

/**
 * StudioHubSettingsPanel — Faithfully Rebuilt Livex Appearance Reference Implementation
 * Direct 1:1 React Conversion of the HTML Source of Truth Specification.
 */
export default function StudioHubSettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);

  React.useEffect(() => {
    console.log('[APPEARANCE-RUNTIME-PROOF]', {
      component: 'StudioHubSettingsPanel',
      filename: 'StudioHubSettingsPanel.tsx',
      importPath: '@workspace/ui-shared/src/features/hub/settings/StudioHubSettingsPanel.tsx',
      renderPath:
        'App.tsx -> SharedAppShell -> StudioHub -> renderActivePageContent -> StudioHubSettingsPanel',
      mountedAt: new Date().toISOString(),
    });
    try {
      (window as any).__lastMountedAppearanceComponent = 'StudioHubSettingsPanel';
    } catch (_) {}
  }, []);

  const currentTheme = settings.theme ?? 'dark';
  const isAmoled = settings.amoledMode ?? false;

  // Theme cycler state: 0 = Light, 1 = Dark, 2 = AMOLED
  const themeState = currentTheme === 'light' ? 0 : isAmoled ? 2 : 1;

  const handleThemeCycle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    let nextTheme = 'dark';
    let nextAmoled = false;

    if (themeState === 0) {
      nextTheme = 'dark';
      nextAmoled = false;
    } else if (themeState === 1) {
      nextTheme = 'dark';
      nextAmoled = true;
    } else {
      nextTheme = 'light';
      nextAmoled = false;
    }

    if (typeof (window as any).__triggerThemeTransition === 'function') {
      (window as any).__triggerThemeTransition(nextTheme, nextAmoled, x, y, () => {
        settingsController.cycleNextTheme();
      });
    } else {
      ThemeTransitionEngine.startTransition({
        nextTheme,
        amoled: nextAmoled,
        startX: x,
        startY: y,
        updateFn: () => {
          settingsController.cycleNextTheme();
        },
      });
    }
  };

  const handleBack = () => {
    try {
      NavigationDispatcher.pop();
    } catch (_) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
    }
  };

  return (
    <StudioPageTransition pageKey="hub-settings-panel">
      <div className="font-body-md text-body-md min-h-screen pb-stack-lg app-bg text-on-surface">
        {/* Compact Top App Bar */}
        <header className="w-full sticky top-0 z-50 flex flex-col justify-end px-margin-mobile pt-stack-md pb-stack-sm bg-black/60 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go Back"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface text-[22px]">
                  arrow_back
                </span>
              </button>
              <div className="flex flex-col">
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
                  Appearance
                </h1>
                <p className="text-on-surface-variant font-label-md opacity-60">
                  Personalize your Livex experience.
                </p>
              </div>
            </div>
            <button
              id="theme-cycler"
              type="button"
              onClick={handleThemeCycle}
              aria-label="Cycle Theme"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-90 duration-300 cursor-pointer"
            >
              <span
                id="theme-icon"
                className={`material-symbols-outlined transition-all duration-300 text-[20px] ${
                  themeState === 0
                    ? 'text-primary'
                    : themeState === 1
                      ? 'text-on-surface-variant'
                      : 'text-tertiary'
                }`}
                style={{ transform: `rotate(${themeState * 120}deg)` }}
              >
                {themeState === 0 ? 'light_mode' : themeState === 1 ? 'dark_mode' : 'brightness_6'}
              </span>
            </button>
          </div>
        </header>

        <main className="px-margin-mobile space-y-4 mt-2 max-w-2xl mx-auto">
          {/* Section 1: Accent Color */}
          <section className="w-full">
            <InspiraColorPicker />
          </section>

          {/* Combined Grid for Density & Text Scale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Density */}
            <section className="bg-surface-container-lowest rounded-lg p-4 custom-shadow flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  grid_view
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">Density</h3>
              </div>
              <div className="bg-surface-container p-1 rounded-full flex">
                <button
                  type="button"
                  onClick={() => settingsController.updateSettings({ displayDensity: 'compact' })}
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    settings.displayDensity === 'compact' ? 'active' : ''
                  }`}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() =>
                    settingsController.updateSettings({ displayDensity: 'comfortable' })
                  }
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    (settings.displayDensity || 'comfortable') === 'comfortable' ? 'active' : ''
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => settingsController.updateSettings({ displayDensity: 'spacious' })}
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    settings.displayDensity === 'spacious' ? 'active' : ''
                  }`}
                >
                  Spacious
                </button>
              </div>
              <p className="text-on-surface-variant font-body-md text-[12px] opacity-60">
                Adjust screen layout density.
              </p>
            </section>

            {/* Text Scale */}
            <section className="bg-surface-container-lowest rounded-lg p-4 custom-shadow flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  text_fields
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">Text Size</h3>
              </div>
              <div className="bg-surface-container p-1 rounded-full flex">
                <button
                  type="button"
                  onClick={() => settingsController.updateSettings({ fontSize: 'small' })}
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    settings.fontSize === 'small' ? 'active' : ''
                  }`}
                >
                  Small
                </button>
                <button
                  type="button"
                  onClick={() => settingsController.updateSettings({ fontSize: 'medium' })}
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    (settings.fontSize || 'medium') === 'medium' ? 'active' : ''
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => settingsController.updateSettings({ fontSize: 'large' })}
                  className={`flex-1 py-1.5 px-2 rounded-full font-label-md text-[11px] transition-all segmented-item cursor-pointer ${
                    settings.fontSize === 'large' ? 'active' : ''
                  }`}
                >
                  Large
                </button>
              </div>
              <p className="text-on-surface-variant font-body-md text-[12px] opacity-60">
                Scale global typography.
              </p>
            </section>
          </div>

          {/* Section 4: Accessibility */}
          <section className="bg-surface-container-lowest rounded-lg p-4 custom-shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">
                visibility
              </span>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">High Contrast</h3>
                <p className="text-on-surface-variant font-body-md text-[12px] opacity-60">
                  Sharpen text for better readability.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast ?? false}
                onChange={(e) =>
                  settingsController.updateSettings({ highContrast: e.target.checked })
                }
                className="sr-only peer switch-toggle"
              />
              <div className="w-10 h-5 bg-surface-container-highest rounded-full peer-focus:ring-2 peer-focus:ring-primary/20 transition-all switch-bg">
                <div className="absolute top-0.5 left-0.5 bg-on-surface-variant w-4 h-4 rounded-full transition-all duration-300 switch-dot" />
              </div>
            </label>
          </section>

          {/* Section 5: Workspace & Performance */}
          <section className="bg-surface-container-lowest rounded-lg p-4 custom-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
              <h3 className="font-title-md text-title-md text-on-surface">Performance</h3>
            </div>
            <div className="space-y-1">
              {/* Row 1: Haptic Feedback */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    vibration
                  </span>
                  <div>
                    <div className="font-body-md font-semibold text-on-surface text-[14px]">
                      Haptics
                    </div>
                    <div className="text-on-surface-variant text-[12px] opacity-60">
                      Subtle tactile responses.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hapticFeedback ?? true}
                    onChange={(e) =>
                      settingsController.updateSettings({ hapticFeedback: e.target.checked })
                    }
                    className="sr-only peer switch-toggle"
                  />
                  <div className="w-10 h-5 bg-surface-container-highest rounded-full transition-all switch-bg">
                    <div className="absolute top-0.5 left-0.5 bg-on-surface-variant w-4 h-4 rounded-full transition-all duration-300 switch-dot" />
                  </div>
                </label>
              </div>

              {/* Row 2: High Refresh Rate */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    bolt
                  </span>
                  <div>
                    <div className="font-body-md font-semibold text-on-surface text-[14px]">
                      ProMotion
                    </div>
                    <div className="text-on-surface-variant text-[12px] opacity-60">
                      Enable 120Hz smooth scrolling.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.highRefreshRate ?? true}
                    onChange={(e) =>
                      settingsController.updateSettings({ highRefreshRate: e.target.checked })
                    }
                    className="sr-only peer switch-toggle"
                  />
                  <div className="w-10 h-5 bg-surface-container-highest rounded-full transition-all switch-bg">
                    <div className="absolute top-0.5 left-0.5 bg-on-surface-variant w-4 h-4 rounded-full transition-all duration-300 switch-dot" />
                  </div>
                </label>
              </div>

              {/* Row 3: Performance Mode */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    rocket_launch
                  </span>
                  <div>
                    <div className="font-body-md font-semibold text-on-surface text-[14px]">
                      Performance Boost
                    </div>
                    <div className="text-on-surface-variant text-[12px] opacity-60">
                      Optimize for heavy tasks.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.performanceMode ?? false}
                    onChange={(e) =>
                      settingsController.updateSettings({ performanceMode: e.target.checked })
                    }
                    className="sr-only peer switch-toggle"
                  />
                  <div className="w-10 h-5 bg-surface-container-highest rounded-full transition-all switch-bg">
                    <div className="absolute top-0.5 left-0.5 bg-on-surface-variant w-4 h-4 rounded-full transition-all duration-300 switch-dot" />
                  </div>
                </label>
              </div>
            </div>
          </section>
        </main>
      </div>
    </StudioPageTransition>
  );
}
