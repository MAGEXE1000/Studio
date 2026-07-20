import {
  useSettingsStore,
  type AppSettings,
  type AppKey,
  type PerAppVisuals,
} from '../store/useSettingsStore';
import { settingsService } from '../services/SettingsService';

export class SettingsController {
  /**
   * Updates global settings and orchestrates side effects like theme or language changes.
   */
  public updateSettings(patch: Partial<AppSettings>) {
    const store = useSettingsStore.getState();
    store.updateSettings(patch);

    const updatedSettings = useSettingsStore.getState().settings;

    if (
      patch.theme ||
      patch.accentColor ||
      patch.amoledMode !== undefined ||
      patch.customAccentHue !== undefined ||
      patch.displayDensity
    ) {
      settingsService.applyThemeToDOM(updatedSettings);
    }
  }

  /**
   * Updates per-app settings and triggers side effects if the updated app is currently active.
   */
  public updatePerApp(apps: AppKey[], patch: Partial<PerAppVisuals>) {
    const store = useSettingsStore.getState();
    store.updatePerApp(apps, patch);
  }
}

export const settingsController = new SettingsController();
