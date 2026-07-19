import html2canvas from 'html2canvas';

export interface ThemeTransitionOptions {
  nextTheme: string;
  amoled: boolean;
  startX: number;
  startY: number;
  updateFn: () => void;
}

class ThemeTransitionEngineImpl {
  private activeOverlay: HTMLDivElement | null = null;
  private animFrameId: number | null = null;
  private safetyTimer: any = null;
  private isTransitioning: boolean = false;

  public async startTransition(options: ThemeTransitionOptions) {
    if (this.isTransitioning) {
      console.warn('[ThemeTransitionEngine] Another transition is already running. Ignoring.');
      options.updateFn();
      return;
    }

    this.isTransitioning = true;
    const { nextTheme, amoled, startX, startY, updateFn } = options;

    // Failsafe watchdog timer (2.5 seconds max)
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => {
      console.error('[ThemeTransitionEngine] Watchdog triggered. Force disposing transition.');
      this.dispose(updateFn);
    }, 2500);

    let screenshot: HTMLCanvasElement;
    try {
      screenshot = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: nextTheme === 'light' ? '#f4f4f5' : '#000000',
        scale: window.devicePixelRatio || 1,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });
    } catch (err) {
      console.error('[ThemeTransitionEngine] html2canvas failed, skipping transition animation:', err);
      this.dispose(updateFn);
      return;
    }

    // Create the overlay DOM elements
    const overlay = document.createElement('div');
    overlay.id = 'theme-transition-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.pointerEvents = 'none';
    overlay.style.contain = 'strict';

    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.transform = 'translateZ(0)'; // force GPU acceleration
    
    // SVG goo filter defs
    const svgFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgFilter.style.position = 'absolute';
    svgFilter.style.width = '0';
    svgFilter.style.height = '0';
    svgFilter.innerHTML = `
      <defs>
        <filter id="goo-theme-filter-engine">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    `;
    canvas.style.filter = 'url(#goo-theme-filter-engine)';

    overlay.appendChild(svgFilter);
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    this.activeOverlay = overlay;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.dispose(updateFn);
      return;
    }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Timing constants
    const t_swell = 220;
    const t_hang = 280;
    const t_fall = 380;
    const t_wave = 650;
    const totalTime = t_swell + t_hang + t_fall + t_wave;

    const HEAD_R = 14;
    const TAIL_R = 10;
    const maxRadius = Math.max(Math.hypot(startX, H), Math.hypot(W - startX, H)) + 120;

    // Cubic bezier easing (0.33, 0, 0.15, 1)
    const solveBezier = (t: number) => {
      let u = t;
      for (let i = 0; i < 6; i++) {
        const currentT = 3 * (1 - u) * (1 - u) * u * 0.33 + 3 * (1 - u) * u * u * 0.15 + u * u * u;
        const deriv = 3 * (1 - u) * (1 - u) * 0.33 + 6 * (1 - u) * u * (0.15 - 0.33) + 3 * u * u * (1 - 0.15);
        if (Math.abs(deriv) < 1e-5) break;
        u -= (currentT - t) / deriv;
      }
      return 3 * (1 - u) * (1 - u) * u * 0 + 3 * (1 - u) * u * u * 1 + u * u * u;
    };

    const startTime = performance.now();
    let themeApplied = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      if (elapsed > totalTime) {
        this.dispose(updateFn);
        return;
      }

      // Switch theme during the Fall phase (hidden completely behind screenshot)
      if (elapsed >= (t_swell + t_hang + 150) && !themeApplied) {
        themeApplied = true;
        try {
          updateFn();
        } catch (e) {
          console.error('[ThemeTransitionEngine] Error in updateFn:', e);
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(screenshot, 0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';

      ctx.beginPath();

      if (elapsed <= t_swell) {
        const progress = elapsed / t_swell;
        ctx.arc(startX, startY + 12, progress * HEAD_R, 0, Math.PI * 2);
        ctx.fill();
      } else if (elapsed <= t_swell + t_hang) {
        const progress = (elapsed - t_swell) / t_hang;
        const headY = startY + 12;
        const tailY = headY + progress * 24;
        const tailR = HEAD_R * (1 - progress * 0.3);

        ctx.arc(startX, headY, HEAD_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(startX, tailY, tailR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(startX - HEAD_R, headY);
        ctx.lineTo(startX - tailR, tailY);
        ctx.lineTo(startX + tailR, tailY);
        ctx.lineTo(startX + HEAD_R, headY);
        ctx.closePath();
        ctx.fill();
      } else if (elapsed <= t_swell + t_hang + t_fall) {
        const progress = (elapsed - t_swell - t_hang) / t_fall;
        const easeProgress = progress * progress * progress;
        const startYPos = startY + 36;
        const currentY = startYPos + (H - startYPos) * easeProgress;
        const stretchLen = 30 * progress;
        const headY = currentY;
        const tailY = currentY - stretchLen;
        const headR = HEAD_R * (1 - progress * 0.1);
        const tailR = TAIL_R * (1 - progress * 0.3);

        ctx.arc(startX, headY, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(startX, tailY, tailR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(startX - headR, headY);
        ctx.lineTo(startX - tailR, tailY);
        ctx.lineTo(startX + tailR, tailY);
        ctx.lineTo(startX + headR, headY);
        ctx.closePath();
        ctx.fill();
      } else {
        const progress = (elapsed - t_swell - t_hang - t_fall) / t_wave;
        const easeProgress = solveBezier(progress);
        ctx.arc(startX, H, easeProgress * maxRadius, 0, Math.PI * 2);
        ctx.fill();

        const elapsedWave = elapsed - t_swell - t_hang - t_fall;
        if (elapsedWave < 120) {
          const squashProgress = elapsedWave / 120;
          const squashY = H - 8 * (1 - squashProgress);
          const squashWidth = HEAD_R * (1 + (1 - squashProgress) * 0.8);
          const squashHeight = HEAD_R * (1 - (1 - squashProgress) * 0.5);
          ctx.beginPath();
          ctx.ellipse(startX, squashY, squashWidth, squashHeight, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private dispose(updateFn?: () => void) {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.activeOverlay) {
      try {
        if (this.activeOverlay.parentNode) {
          this.activeOverlay.parentNode.removeChild(this.activeOverlay);
        }
      } catch (err) {
        console.error('[ThemeTransitionEngine] Error removing overlay node:', err);
      }
      this.activeOverlay = null;
    }
    if (updateFn) {
      try {
        updateFn();
      } catch (e) {
        console.error('[ThemeTransitionEngine] Error in safety updateFn:', e);
      }
    }
    this.isTransitioning = false;
  }
}

export const ThemeTransitionEngine = new ThemeTransitionEngineImpl();
