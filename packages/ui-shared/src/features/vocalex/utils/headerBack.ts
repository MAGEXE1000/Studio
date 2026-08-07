type BackFn = () => void;
type Listener = (fn: BackFn | null) => void;

let _handler: BackFn | null = null;
const _listeners = new Set<Listener>();

/**
 * @deprecated Use `useNavigationCoordinator` or platform-native back handlers instead.
 * This global back handler is part of a deprecated architecture and will be removed in future versions.
 */
export function setVocalexBack(fn: BackFn | null): void {
  console.warn('[Deprecation Warning] setVocalexBack is deprecated. Use useNavigationCoordinator or standard routing.');
  _handler = fn;
  _listeners.forEach((l) => l(_handler));
}

/**
 * @deprecated Use `useNavigationCoordinator` or platform-native back handlers instead.
 * This global back handler is part of a deprecated architecture and will be removed in future versions.
 */
export function subscribeVocalexBack(l: Listener): () => void {
  console.warn('[Deprecation Warning] subscribeVocalexBack is deprecated. Use useNavigationCoordinator or standard routing.');
  _listeners.add(l);
  l(_handler);
  return () => {
    _listeners.delete(l);
  };
}
