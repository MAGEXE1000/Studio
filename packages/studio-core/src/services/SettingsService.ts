import { applyThemeTokens } from '../lib/preferences/themeEngine';
import type { AppSettings } from '../store/useSettingsStore';

export class SettingsService {
  /**
   * Applies the theme settings to the DOM.
   */
  public applyThemeToDOM(settings: AppSettings): void {
    applyThemeTokens(settings);
  }
}

export const settingsService = new SettingsService();
