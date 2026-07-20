import {
  type NavigationRoute,
  type NavigationHistory,
  type TransitionType,
} from './navigationTypes';
import { useNavigationStore } from '../../store/useNavigationStore.js';
import { NavigationCoordinator } from './NavigationCoordinator.js';
import {
  normalizeAndValidateRoute,
  isRouteEqual,
  detectRecursion,
  isTransitionLocked,
  isRootRouteOnly,
} from './validation.js';

export class NavigationDispatcher {
  private static transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Pushes a new route onto the stack, applying guards and calculating transition direction.
   */
  public static push(route: Partial<NavigationRoute>): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] push | requested: ${JSON.stringify(route)}`);
    // Transition is allowed to interrupt immediately (lock check removed)

    const nextRoute = NavigationCoordinator.resolveDefaultRoute(normalizeAndValidateRoute(route));
    const store = useNavigationStore.getState();
    const current = store.history[store.history.length - 1];

    if (current && isRouteEqual(current, nextRoute)) {
      console.warn(
        `[NavigationDispatcher] [${timestamp}] Push ignored: Duplicate route detected. Current: ${JSON.stringify(current)} | Next: ${JSON.stringify(nextRoute)}`
      );
      return;
    }

    if (detectRecursion(store.history, nextRoute)) {
      console.warn(
        `[NavigationDispatcher] [${timestamp}] Push ignored: Recursive cycle detected. Stack: ${JSON.stringify(store.history)} | Next: ${JSON.stringify(nextRoute)}`
      );
      return;
    }

    let tType: TransitionType = 'forward';
    if (nextRoute.type === 'modal') tType = 'modal';
    else if (nextRoute.type === 'sheet') tType = 'sheet';
    else if (nextRoute.type === 'overlay') tType = 'overlay';

    this.lockTransition(tType);

    const newHistory = [...store.history, nextRoute];
    store.setHistory(newHistory);
  }

  /**
   * Replaces the current top route on the stack.
   */
  public static replace(route: Partial<NavigationRoute>): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[NavigationDispatcher] [${timestamp}] replace | requested: ${JSON.stringify(route)}`
    );
    // Transition is allowed to interrupt immediately (lock check removed)

    const nextRoute = NavigationCoordinator.resolveDefaultRoute(normalizeAndValidateRoute(route));
    const store = useNavigationStore.getState();

    this.lockTransition('replace');

    const newHistory = [...store.history.slice(0, -1), nextRoute];
    store.setHistory(newHistory);
  }

  /**
   * Pops the top route from the stack.
   */
  public static pop(): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] pop`);
    // Transition is allowed to interrupt immediately (lock check removed)

    const store = useNavigationStore.getState();
    if (isRootRouteOnly(store.history)) {
      console.warn(
        `[NavigationDispatcher] [${timestamp}] Pop ignored: Cannot pop past root route. Stack: ${JSON.stringify(store.history)}`
      );
      return;
    }

    const poppedRoute = store.history[store.history.length - 1];
    let tType: TransitionType = 'backward';
    if (poppedRoute.type === 'modal') tType = 'modal';
    else if (poppedRoute.type === 'sheet') tType = 'sheet';
    else if (poppedRoute.type === 'overlay') tType = 'overlay';

    this.lockTransition(tType);

    const newHistory = store.history.slice(0, -1);
    store.setHistory(newHistory);
  }

  /**
   * Pops the stack back to the first route matching the predicate.
   */
  public static popTo(predicate: (route: NavigationRoute) => boolean): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] popTo`);
    // Transition is allowed to interrupt immediately (lock check removed)

    const store = useNavigationStore.getState();
    const index = store.history.findIndex(predicate);

    if (index === -1) {
      console.warn(
        `[NavigationDispatcher] [${timestamp}] popTo ignored: Target route not found in stack. Stack: ${JSON.stringify(store.history)}`
      );
      return;
    }

    if (index === store.history.length - 1) {
      console.log(`[NavigationDispatcher] [${timestamp}] popTo: Already at the target`);
      return;
    }

    this.lockTransition('backward');

    const newHistory = store.history.slice(0, index + 1);
    store.setHistory(newHistory);
  }

  /**
   * Resets the entire stack to a new history.
   */
  public static reset(stack: NavigationHistory): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] reset | stack: ${JSON.stringify(stack)}`);
    if (stack.length === 0) {
      throw new Error(`[NavigationDispatcher] [${timestamp}] Reset history stack cannot be empty.`);
    }

    const validatedStack = stack.map((r) =>
      NavigationCoordinator.resolveDefaultRoute(normalizeAndValidateRoute(r))
    );

    const store = useNavigationStore.getState();
    this.lockTransition('replace');
    store.setHistory(validatedStack);
  }

  /**
   * Checks if back navigation is permitted (stack history contains more than root).
   */
  public static canGoBack(): boolean {
    const store = useNavigationStore.getState();
    return !isRootRouteOnly(store.history);
  }

  /**
   * Gets the current active route.
   */
  public static currentRoute(): NavigationRoute {
    const store = useNavigationStore.getState();
    return store.history[store.history.length - 1] || { app: 'hub', tab: 'home' };
  }

  /**
   * Gets the previous route in the stack history if available.
   */
  public static previousRoute(): NavigationRoute | null {
    const store = useNavigationStore.getState();
    if (store.history.length < 2) return null;
    return store.history[store.history.length - 2];
  }

  
  /**
   * Opens an application by name.
   */
  public static openApp(appKey: NavigationRoute['app']): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] openApp | appKey: ${appKey}`);
    if (this.currentApp() === appKey) return;
    this.push({ app: appKey });
  }

  /**
   * Closes the current application and returns to the hub.
   */
  public static closeApp(): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] closeApp`);
    this.openApp('hub');
  }

  /**
   * Switches to a specific tab in the current application.
   */
  public static switchTab(tab: NavigationRoute['tab']): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] switchTab | tab: ${tab}`);
    const current = this.currentRoute();
    if (current.tab === tab) return;
    this.push({ app: current.app, tab });
  }

  /**
   * Goes back to the previous route (alias for pop).
   */
  public static goBack(): void {
    this.pop();
  }

  /**
   * Gets the currently active application.
   */
  public static currentApp(): NavigationRoute['app'] {
    return this.currentRoute().app;
  }

  /**
   * Subscribes to navigation store state changes.
   */
  public static subscribe(listener: (state: any) => void): () => void {
    return useNavigationStore.subscribe(listener);
  }

  /**
   * Internal helper to lock transitioning state and auto-release it.
   */
  private static lockTransition(type: TransitionType): void {
    const timestamp = new Date().toISOString();
    console.log(`[NavigationDispatcher] [${timestamp}] lockTransition | type: ${type}`);
    const store = useNavigationStore.getState();
    store.setTransition(type, true);

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    this.transitionTimeout = setTimeout(() => {
      console.log(
        `[NavigationDispatcher] [${new Date().toISOString()}] lockTransition timeout auto-release`
      );
      useNavigationStore.getState().setTransition(null, false);
      this.transitionTimeout = null;
    }, 300); // 300ms matches visual transition timing
  }
}
