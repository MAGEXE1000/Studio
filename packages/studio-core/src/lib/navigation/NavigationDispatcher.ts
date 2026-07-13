import { type NavigationRoute, type NavigationHistory, type TransitionType } from './navigationTypes';
import { useNavigationStore } from '../../store/useNavigationStore.js';
import { NavigationCoordinator } from './NavigationCoordinator.js';
import {
  normalizeAndValidateRoute,
  isRouteEqual,
  detectRecursion,
  isTransitionLocked,
  isRootRouteOnly,
} from './validation.js';
import { SourceMapResolver } from '../diagnostics/SourceMapResolver.js';

export class NavigationDispatcher {
  private static transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Pushes a new route onto the stack, applying guards and calculating transition direction.
   */
  public static push(route: Partial<NavigationRoute>): void {
    const timestamp = new Date().toISOString();
    Promise.resolve().then(() => {
       if (typeof window !== 'undefined' && (window as any).__ENABLE_DIAGNOSTICS__) {
         NavigationDispatcher.logDiagnostic('push', route);
       } else {
         console.log(`[NavigationDispatcher] [${timestamp}] push | requested: ${JSON.stringify(route)}`);
       }
    });
    // Transition is allowed to interrupt immediately (lock check removed)

    const nextRoute = NavigationCoordinator.resolveDefaultRoute(normalizeAndValidateRoute(route));
    const store = useNavigationStore.getState();
    const current = store.history[store.history.length - 1];

    if (current && isRouteEqual(current, nextRoute)) {
      console.info(`[NavigationDispatcher] [${timestamp}] Push ignored: Duplicate route detected. Current: ${JSON.stringify(current)} | Next: ${JSON.stringify(nextRoute)}`);
      return;
    }

    if (detectRecursion(store.history, nextRoute)) {
      console.info(`[NavigationDispatcher] [${timestamp}] Push ignored: Recursive cycle detected. Stack: ${JSON.stringify(store.history)} | Next: ${JSON.stringify(nextRoute)}`);
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
    Promise.resolve().then(() => {
       if (typeof window !== 'undefined' && (window as any).__ENABLE_DIAGNOSTICS__) {
         NavigationDispatcher.logDiagnostic('replace', route);
       } else {
         console.log(`[NavigationDispatcher] [${timestamp}] replace | requested: ${JSON.stringify(route)}`);
       }
    });
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
    Promise.resolve().then(() => {
       if (typeof window !== 'undefined' && (window as any).__ENABLE_DIAGNOSTICS__) {
         NavigationDispatcher.logDiagnostic('pop', {});
       } else {
         console.log(`[NavigationDispatcher] [${timestamp}] pop`);
       }
    });
    // Transition is allowed to interrupt immediately (lock check removed)

    const store = useNavigationStore.getState();
    if (isRootRouteOnly(store.history)) {
      console.info(`[NavigationDispatcher] [${timestamp}] Pop ignored: Cannot pop past root route. Stack: ${JSON.stringify(store.history)}`);
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
    Promise.resolve().then(() => {
       if (typeof window !== 'undefined' && (window as any).__ENABLE_DIAGNOSTICS__) {
         NavigationDispatcher.logDiagnostic('popTo', {});
       } else {
         console.log(`[NavigationDispatcher] [${timestamp}] popTo`);
       }
    });
    // Transition is allowed to interrupt immediately (lock check removed)

    const store = useNavigationStore.getState();
    const index = store.history.findIndex(predicate);

    if (index === -1) {
      console.info(`[NavigationDispatcher] [${timestamp}] popTo ignored: Target route not found in stack. Stack: ${JSON.stringify(store.history)}`);
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
      console.log(`[NavigationDispatcher] [${new Date().toISOString()}] lockTransition timeout auto-release`);
      useNavigationStore.getState().setTransition(null, false);
      this.transitionTimeout = null;
    }, 300); // 300ms matches visual transition timing
  }

  private static logDiagnostic(action: string, route: any) {
    const rawStack = new Error().stack;
    let caller = 'Unknown';
    let fileLocation = 'N/A';
    
    if (rawStack) {
      const lines = rawStack.split('\\n');
      for (let i = 3; i < lines.length; i++) {
        if (!lines[i].includes('NavigationDispatcher')) {
          const parsed = SourceMapResolver.parseStackTrace(lines.slice(i).join('\\n'));
          if (parsed.length > 0) {
            caller = parsed[0].func;
            fileLocation = `${parsed[0].file}:${parsed[0].line}`;
          } else {
            caller = lines[i].trim();
          }
          break;
        }
      }
    }

    const store = useNavigationStore.getState();
    const sourcePage = store.history.length > 1 ? store.history[store.history.length - 2]?.app : 'root';
    const destPage = store.history[store.history.length - 1]?.app || 'unknown';

    const msg = `------------------------------------------
Title
Navigation Transition
Severity
INFO
Classification
INFO
Studio subsystem
NavigationDispatcher
React component
${caller.startsWith('use') || caller.match(/^[A-Z]/) ? caller : 'Unknown'}
Component hierarchy
Unknown
Source file
${fileLocation.split(':')[0]}
Source line
${fileLocation.split(':')[1] || 'Unknown'}
Hook
N/A
Function
${caller}
Store involved
NavigationStore
Store mutation
history
Navigation route
${action}
Trigger
${action}()
Previous value
${sourcePage}
Current value
${destPage}
Render count
Unknown
Layout count
Unknown
Paint count
Unknown
JS execution time
Unknown
Layout time
Unknown
Paint time
Unknown
Total duration
300ms
Expected?
YES
Root cause
Navigation transition triggered by ${caller}.
Recommendation
N/A
------------------------------------------`;
    console.log(msg);
  }
}
