import { useEffect } from 'react';
import { BackDispatcher, type BackPriority } from './BackDispatcher';

/**
 * Register a back handler while the component is mounted.
 * Auto-deregisters on unmount. Re-registers when deps change.
 *
 * @example
 *   useBackHandler('modal', () => {
 *     if (!isOpen) return false;
 *     setIsOpen(false);
 *     return true;
 *   }, [isOpen]);
 */
export function useBackHandler(
  priority: BackPriority,
  fn: () => boolean,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    let depsString = '[]';
    try {
      depsString = JSON.stringify(deps.map(d => typeof d === 'function' ? 'Function' : d));
    } catch(e) {}
    
    return BackDispatcher.register(priority, fn, undefined, 'Mount/Deps Changed', depsString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
