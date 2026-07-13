import { useEffect, useRef } from 'react';
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
  const stackRef = useRef(new Error().stack);
  const isFirstMount = useRef(true);

  useEffect(() => {
    let depsString = '[]';
    try {
      depsString = JSON.stringify(deps.map(d => typeof d === 'function' ? 'Function' : d));
    } catch(e) {}
    
    const reason = isFirstMount.current ? 'Mount' : 'Deps Changed';
    isFirstMount.current = false;
    
    return BackDispatcher.register(priority, fn, stackRef.current, reason, depsString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
