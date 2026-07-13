import { useEffect, useRef } from 'react';
import { BackDispatcher, type BackPriority } from './BackDispatcher';

/**
 * Register a back handler while the component is mounted.
 * Auto-deregisters on unmount. Re-registration on deps change is no longer needed.
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
  active: boolean = true,
): void {
  const stackRef = useRef(new Error().stack);
  const fnRef = useRef(fn);
  
  // Keep the callback ref up-to-date
  fnRef.current = fn;

  useEffect(() => {
    if (!active) return;
    const handler = () => fnRef.current();
    return BackDispatcher.register(priority, handler, stackRef.current, 'Mount', '[]');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priority, active]);
}
