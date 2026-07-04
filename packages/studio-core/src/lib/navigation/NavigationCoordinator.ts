import { type NavigationRoute, type NavigationHistory } from './navigationTypes';

export class NavigationCoordinator {
  /**
   * Resolves default landing pages/tabs for sub-apps if not explicitly provided.
   */
  public static resolveDefaultRoute(route: Partial<NavigationRoute>): NavigationRoute {
    const nextRoute: NavigationRoute = {
      app: route.app || 'hub',
      tab: route.tab,
      page: route.page,
      subView: route.subView,
      id: route.id,
      type: route.type,
    };

    if (nextRoute.app === 'chords' && !nextRoute.page) {
      nextRoute.page = 'library';
    } else if (nextRoute.app === 'groovex' && !nextRoute.page) {
      nextRoute.page = 'library';
    } else if (nextRoute.app === 'vocalex' && !nextRoute.page) {
      nextRoute.page = 'practice';
    } else if (nextRoute.app === 'drums' && !nextRoute.page) {
      nextRoute.page = 'songs';
    } else if (nextRoute.app === 'stage' && !nextRoute.page) {
      nextRoute.page = 'Editor';
    }

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
    const defaultHistory: NavigationHistory = [{ app: 'hub', tab: 'home' }];

    if (!rememberSession || !savedApp || savedApp === 'hub') {
      return defaultHistory;
    }

    const appRoute: Partial<NavigationRoute> = {
      app: savedApp as any,
      tab: savedTab as any,
      page: savedPage || undefined,
    };

    const resolved = this.resolveDefaultRoute(appRoute);
    return [...defaultHistory, resolved];
  }
}
