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
  public static register(priority: BackPriority, fn: () => boolean, ownerRawStack?: string, reason: string = 'Mount', dependencies: string = '[]'): () => void {
    this.initialize();
    const id = Math.random().toString(36).substring(2, 9);
    const registerTime = performance.now();
    
    const handlerObj: any = { id, priority, fn, owner: 'Resolving...', file: '', func: '', reason, dependencies, registerTime };
    
    if (ownerRawStack) {
      Promise.resolve().then(() => {
        const parsed = SourceMapResolver.parseStackTrace(ownerRawStack);
        let found = false;
        for (const frame of parsed) {
          if (frame.func && !frame.func.includes('useBackHandler') && !frame.func.includes('BackDispatcher')) {
            handlerObj.owner = frame.func;
            handlerObj.file = frame.file;
            handlerObj.func = frame.func;
            handlerObj.line = frame.line;
            found = true;
            break;
          }
        }
        if (!found) {
           handlerObj.owner = 'Unknown (Stack omitted by V8/Capacitor)';
        }
        
        console.warn(`[BackDispatcher] Registered [${priority}] Owner: ${handlerObj.owner} | Reason: ${reason} | Deps: ${dependencies} | File: ${handlerObj.file}:${handlerObj.line}`);
      }).catch(e => {
        handlerObj.owner = 'Unknown (Parse Error)';
      });
    } else {
      handlerObj.owner = 'Unknown (No stack provided)';
    }

    const existingIndex = activeBackHandlers.findIndex((h: any) => h.id === id);
    if (existingIndex !== -1) {
      activeBackHandlers.splice(existingIndex, 1);
    }
    activeBackHandlers.push(handlerObj);

    return () => {
      const lifetime = (performance.now() - handlerObj.registerTime).toFixed(1);
      console.warn(`[BackDispatcher] Unregistered [${priority}] Owner: ${handlerObj.owner} | Lifetime: ${lifetime}ms | Unregister Reason: Unmount or Deps Changed`);
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
