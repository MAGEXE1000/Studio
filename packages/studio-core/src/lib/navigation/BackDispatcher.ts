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
    
    let caller = owner;
    let stackTrace = '';
    const err = new Error();
    if (err.stack) {
      stackTrace = err.stack;
      if (!caller) {
        // Fix the literal backslash-n bug
        const lines = err.stack.split('\n');
        for (let i = 2; i < lines.length; i++) {
          if (!lines[i].includes('BackDispatcher') && !lines[i].includes('useBackHandler')) {
            const parsed = SourceMapResolver.parseStackTrace(lines.slice(i).join('\n'));
            if (parsed.length > 0) {
              caller = `${parsed[0].func} (${parsed[0].file}:${parsed[0].line})`;
            } else {
              caller = lines[i].trim();
            }
            break;
          }
        }
      }
    }
    
    const displayOwner = caller || 'Unknown';
    const parsedStack = SourceMapResolver.parseStackTrace(stackTrace);
    const topStack = parsedStack.length > 0 ? `${parsedStack[0].file}:${parsedStack[0].line}` : 'N/A';

    console.log(`
--------------------------------------------------
[BackDispatcher] Register
Owner: ${displayOwner}
Priority: ${priority}
Reason: ${reason}
Dependencies: ${dependencies}
File: ${topStack}
ID: ${id}
--------------------------------------------------`);
    
    const existingIndex = activeBackHandlers.findIndex((h: any) => h.id === id);
    if (existingIndex !== -1) {
      activeBackHandlers.splice(existingIndex, 1);
    }
    activeBackHandlers.push({ id, priority, fn, owner: displayOwner });

    return () => {
      console.log(`[BackDispatcher] Unregister | id: ${id}, owner: ${displayOwner}`);
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
    const timestamp = new Date().toISOString();
    const store = useNavigationStore.getState();
    const handlers = [...activeBackHandlers];
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
