import { useEffect, useRef } from 'react';

export function useScrollFade() {
  const ref = useRef<HTMLDivElement>(null);
  const currentClassRef = useRef<'fade-none' | 'fade-left' | 'fade-right' | 'fade-both'>('fade-none');

  const updateScrollFade = () => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    let nextClass: 'fade-none' | 'fade-left' | 'fade-right' | 'fade-both' = 'fade-none';

    // If content fits within container, no fade is needed
    if (scrollWidth > clientWidth) {
      const isAtStart = scrollLeft <= 2;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 2;

      if (isAtStart) {
        nextClass = 'fade-right';
      } else if (isAtEnd) {
        nextClass = 'fade-left';
      } else {
        nextClass = 'fade-both';
      }
    }

    if (currentClassRef.current !== nextClass) {
      el.classList.remove(currentClassRef.current);
      el.classList.add(nextClass);
      currentClassRef.current = nextClass;
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Apply the initial class on mount
    el.classList.add(currentClassRef.current);

    updateScrollFade();

    // Listen to scroll events
    el.addEventListener('scroll', updateScrollFade, { passive: true });

    // Monitor resize events of the element
    const resizeObserver = new ResizeObserver(() => {
      updateScrollFade();
    });
    resizeObserver.observe(el);
    
    // Monitor changes in child nodes (e.g. dynamic genre chips loading)
    const mutationObserver = new MutationObserver(() => {
      updateScrollFade();
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', updateScrollFade);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Re-apply class if React overwrote it during a re-render
  useEffect(() => {
    const el = ref.current;
    if (el && !el.classList.contains(currentClassRef.current)) {
      el.classList.add(currentClassRef.current);
    }
  });

  return { ref, fadeClass: '' };
}
