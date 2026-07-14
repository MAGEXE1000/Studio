import { type NavigationRoute, type NavigationHistory } from './navigationTypes';
import { useChordStore } from '../../store/useChordStore.js';

export class NavigationCoordinator {
  /**
   * Resolves default landing pages/tabs for sub-apps if not explicitly provided.
   */
  public static resolveDefaultRoute(route: Partial<NavigationRoute>): NavigationRoute {
    const timestamp = new Date().toISOString();
    const nextRoute: NavigationRoute = {
      app: route.app || 'hub',
      tab: route.tab,
      page: route.page,
      subView: route.subView,
      id: route.id,
      type: route.type,
    };

    const settings = useChordStore.getState().settings;

    if (nextRoute.app === 'chords' && !nextRoute.page) {
      nextRoute.page = settings.defaultTab || 'library';
    } else if (nextRoute.app === 'groovex' && !nextRoute.page) {
      nextRoute.page = settings.defaultGroovexView || 'library';
    } else if (nextRoute.app === 'vocalex' && !nextRoute.page) {
      const vTab = settings.defaultVocalexTab as any;
      nextRoute.page = vTab === 'practice' || vTab === 'vocalLab' || vTab === 'pitch' ? 'coach' : (vTab || 'coach');
    } else if (nextRoute.app === 'drums' && !nextRoute.page) {
      nextRoute.page = settings.defaultDrumTab || 'songs';
    } else if (nextRoute.app === 'stage' && !nextRoute.page) {
      nextRoute.page = settings.defaultStageView || 'Editor';
    }

    console.log(`[NavigationCoordinator] [${timestamp}] resolveDefaultRoute | Input: ${JSON.stringify(route)} -> Resolved: ${JSON.stringify(nextRoute)}`);
    return nextRoute;
  }

  /**
   * Restores navigation state based on user store preferences.
   */
  public static restoreLastSession(
    rememberSession: boolean,
    savedApp: string | null,
    savedTab?: string | null,
    savedPage?: string | null
  ): NavigationHistory {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationCoordinator] [${timestamp}] restoreLastSession | rememberSession: ${rememberSession}, savedApp: ${savedApp}, savedTab: ${savedTab}, savedPage: ${savedPage}`);
    const defaultHistory: NavigationHistory = [{ app: 'hub', tab: 'home' }];

    if (!rememberSession || !savedApp || savedApp === 'hub') {
      console.log(`[NavigationCoordinator] [${timestamp}] restoreLastSession -> Using default history`);
      return defaultHistory;
    }

    const appRoute: Partial<NavigationRoute> = {
      app: savedApp as any,
      tab: savedTab as any,
      page: savedPage || undefined,
    };

    const resolved = this.resolveDefaultRoute(appRoute);
    const resultHistory = [...defaultHistory, resolved];
    console.log(`[NavigationCoordinator] [${timestamp}] restoreLastSession -> Restored history: ${JSON.stringify(resultHistory)}`);
    return resultHistory;
  }
}
