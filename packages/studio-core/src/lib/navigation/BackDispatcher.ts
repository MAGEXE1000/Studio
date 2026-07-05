import { useNavigationStore } from '../../store/useNavigationStore.js';
import { NavigationDispatcher } from './NavigationDispatcher.js';

export type BackPriority = 'modal' | 'sheet' | 'overlay' | 'nested' | 'panel';

const PRIORITY_ORDER: BackPriority[] = ['modal', 'sheet', 'overlay', 'nested', 'panel'];

export class BackDispatcher {
  private static isInitialized = false;

  /**
   * Initializes global document and window listeners for back actions (Escape key and popstate).
   */
  public static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    window.addEventListener('popstate', () => {
      this.handleBackEvent();
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.handleBackEvent();
      }
    });

    this.isInitialized = true;
  }

  /**
   * Registers a callback with a priority. Returns a cleanup unregister function.
   */
  public static register(priority: BackPriority, fn: () => boolean): () => void {
    this.initialize();
    const id = Math.random().toString(36).substring(2, 9);
    console.log(`[BackDispatcher] [${new Date().toISOString()}] Register handler | id: ${id}, priority: ${priority}`);
    useNavigationStore.getState().registerHandler(id, priority, fn);

    return () => {
      console.log(`[BackDispatcher] [${new Date().toISOString()}] Unregister handler | id: ${id}, priority: ${priority}`);
      useNavigationStore.getState().unregisterHandler(id);
    };
  }

  /**
   * Main dispatch entry point. Checks prioritized handlers; falls back to popState.
   * Returns true if handled (consumed), false if nothing handled (indicating app should exit).
   */
  public static handleBackEvent(): boolean {
    const timestamp = new Date().toISOString();
    const store = useNavigationStore.getState();
    const handlers = [...store.activeHandlers];
    console.log(`[BackDispatcher] [${timestamp}] handleBackEvent | Active handlers count: ${handlers.length}`);

    // Sort handlers based on PRIORITY_ORDER index (lower index = higher priority)
    handlers.sort((a, b) => {
      const idxA = PRIORITY_ORDER.indexOf(a.priority as BackPriority);
      const idxB = PRIORITY_ORDER.indexOf(b.priority as BackPriority);
      return idxA - idxB;
    });

    // Execute handlers in priority order
    for (const handler of handlers) {
      try {
        console.log(`[BackDispatcher] [${timestamp}] Evaluating handler: {id: ${handler.id}, priority: ${handler.priority}}`);
        const consumed = handler.fn();
        if (consumed) {
          console.log(`[BackDispatcher] [${timestamp}] Event consumed by handler with priority: ${handler.priority} (id: ${handler.id})`);
          return true;
        }
      } catch (err) {
        console.error(`[BackDispatcher] [${timestamp}] Error executing registered back handler:`, err);
      }
    }

    // Default fallback: pop navigation history
    if (NavigationDispatcher.canGoBack()) {
      console.log(`[BackDispatcher] [${timestamp}] Fallback pop executed. History stack: ${JSON.stringify(store.history)}`);
      NavigationDispatcher.pop();
      return true;
    }

    console.log(`[BackDispatcher] [${timestamp}] Back event unhandled (root reached).`);
    return false;
  }
}
