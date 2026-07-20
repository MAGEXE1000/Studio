export interface ThemeTransitionOptions {
  nextTheme: string;
  amoled: boolean;
  startX: number;
  startY: number;
  updateFn: () => void;
}

class ThemeTransitionEngineImpl {
  private isTransitioning = false;

  public async startTransition(options: ThemeTransitionOptions) {
    if (this.isTransitioning) {
      options.updateFn();
      return;
    }

    this.isTransitioning = true;
    const { nextTheme, startX, startY, updateFn } = options;

    const doc = document as any;
    if (doc.startViewTransition) {
      // Set click coordinates as custom CSS variables
      document.documentElement.style.setProperty('--theme-transition-x', `${startX}px`);
      document.documentElement.style.setProperty('--theme-transition-y', `${startY}px`);

      // Inject view-transition reveal styles dynamically
      let styleEl = document.getElementById('view-transition-styles') as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'view-transition-styles';
        styleEl.innerHTML = `
          ::view-transition-image-pair(root) {
            isolation: auto;
          }
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
          }
          ::view-transition-old(root) {
            z-index: 1;
          }
          ::view-transition-new(root) {
            z-index: 999999;
            animation: theme-reveal-clip 500ms cubic-bezier(0.25, 1, 0.5, 1) both;
          }
          @keyframes theme-reveal-clip {
            from {
              clip-path: circle(0px at var(--theme-transition-x) var(--theme-transition-y));
              filter: brightness(1.2) contrast(1.25) saturate(1.4) blur(4px);
              transform: scale(0.98);
            }
            to {
              clip-path: circle(150% at var(--theme-transition-x) var(--theme-transition-y));
              filter: brightness(1) contrast(1) saturate(1) blur(0px);
              transform: scale(1);
            }
          }
        `;
        document.head.appendChild(styleEl);
      }

      try {
        const transition = doc.startViewTransition(() => {
          updateFn();
        });
        await transition.finished;
      } catch (e) {
        updateFn();
      } finally {
        this.isTransitioning = false;
      }
    } else {
      // Fallback: Lightweight ripple fade overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '999999';
      overlay.style.pointerEvents = 'none';
      overlay.style.backgroundColor = nextTheme === 'light' ? '#f4f4f5' : '#09090b';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 300ms ease-out';

      document.body.appendChild(overlay);

      overlay.getBoundingClientRect(); // trigger reflow
      overlay.style.opacity = '1';

      setTimeout(() => {
        try {
          updateFn();
        } catch (e) {
          console.error(e);
        }
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          this.isTransitioning = false;
        }, 300);
      }, 150);
    }
  }
}

export const ThemeTransitionEngine = new ThemeTransitionEngineImpl();
