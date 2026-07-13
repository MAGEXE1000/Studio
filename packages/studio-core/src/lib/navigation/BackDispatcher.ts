import { useNavigationStore, activeBackHandlers } from '../../store/useNavigationStore.js';
import { NavigationDispatcher } from './NavigationDispatcher.js';
import { SourceMapResolver } from '../diagnostics/SourceMapResolver.js';

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
  public static register(priority: BackPriority, fn: () => boolean, owner?: string, reason: string = 'Mount', dependencies: string = '[]'): () => void {
    this.initialize();
    const id = Math.random().toString(36).substring(2, 9);
    
    const displayOwner = owner || 'Unknown';

    // Debug logging disabled in production for performance

    
    const existingIndex = activeBackHandlers.findIndex((h: any) => h.id === id);
    if (existingIndex !== -1) {
      activeBackHandlers.splice(existingIndex, 1);
    }
    activeBackHandlers.push({ id, priority, fn, owner: displayOwner });

    return () => {
      // Debug logging disabled in production for performance

      const idx = activeBackHandlers.findIndex((h: any) => h.id === id);
      if (idx !== -1) {
        activeBackHandlers.splice(idx, 1);
      }
    };
  }

  /**
   * Main dispatch entry point. Checks prioritized handlers; falls back to popState.
   * Returns true if handled (consumed), false if nothing handled (indicating app should exit).
   */
  public static handleBackEvent(): boolean {
    const store = useNavigationStore.getState();
    const handlers = [...activeBackHandlers];


    // Sort handlers based on PRIORITY_ORDER index (lower index = higher priority)
    handlers.sort((a, b) => {
      const idxA = PRIORITY_ORDER.indexOf(a.priority as BackPriority);
      const idxB = PRIORITY_ORDER.indexOf(b.priority as BackPriority);
      return idxA - idxB;
    });

    // Execute handlers in priority order
    for (const handler of handlers) {
      try {
        const consumed = handler.fn();
        if (consumed) {
          return true;
        }
      } catch (err) {
        console.error(`[BackDispatcher] Error executing registered back handler:`, err);
      }
    }


    // Default fallback: pop navigation history
    if (NavigationDispatcher.canGoBack()) {
      NavigationDispatcher.pop();
      return true;
    }

    return false;
  }
}
