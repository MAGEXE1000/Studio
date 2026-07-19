import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface InkThemeOverlayProps {
  screenshotCanvas: HTMLCanvasElement;
  startX: number;
  startY: number;
  onComplete: () => void;
}

// Cubic bezier solver for Easing/Curve (0.33, 0, 0.15, 1)
function bezier(x1: number, y1: number, x2: number, y2: number) {
  return function (t: number) {
    let u = t;
    for (let i = 0; i < 6; i++) {
      const currentT = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
      const deriv = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
      if (Math.abs(deriv) < 1e-5) break;
      u -= (currentT - t) / deriv;
    }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  };
}

const waveBezier = bezier(0.33, 0, 0.15, 1);

export default function InkThemeOverlay({
  screenshotCanvas,
  startX,
  startY,
  onComplete,
}: InkThemeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Timings
    const t_swell = 220;
    const t_hang = 280;
    const t_fall = 380;
    const t_wave = 650;

    const startTime = performance.now();
    let animFrameId: number;

    const HEAD_R = 14;
    const TAIL_R = 10;

    // Calculate max radius needed to cover the entire screen from the bottom impact point (startX, H)
    const maxRadius = Math.max(
      Math.hypot(startX, H),
      Math.hypot(W - startX, H)
    ) + 100;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      // Clear the canvas
      ctx.clearRect(0, 0, W, H);

      // Draw the screenshot onto the canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(screenshotCanvas, 0, 0, W, H);

      // Set blendMode to destination-out (erase mode)
      ctx.globalCompositeOperation = 'destination-out';

      // Draw overlay erasure shape
      ctx.beginPath();

      if (elapsed <= t_swell) {
        // Phase 1: Swell - Drop grows directly below the icon
        const progress = elapsed / t_swell;
        const currentR = progress * HEAD_R;
        // Head circle
        ctx.arc(startX, startY + 12, currentR, 0, Math.PI * 2);
        ctx.fill();
      } else if (elapsed <= t_swell + t_hang) {
        // Phase 2: Hang - Drop stretches downward
        const progress = (elapsed - t_swell) / t_hang;
        const headY = startY + 12;
        const tailY = headY + progress * 24;
        const tailR = HEAD_R * (1 - progress * 0.3);

        // Draw head
        ctx.arc(startX, headY, HEAD_R, 0, Math.PI * 2);
        ctx.fill();

        // Draw stretched tail
        ctx.beginPath();
        ctx.arc(startX, tailY, tailR, 0, Math.PI * 2);
        ctx.fill();

        // Fill bridge between head and tail
        ctx.beginPath();
        ctx.moveTo(startX - HEAD_R, headY);
        ctx.lineTo(startX - tailR, tailY);
        ctx.lineTo(startX + tailR, tailY);
        ctx.lineTo(startX + HEAD_R, headY);
        ctx.closePath();
        ctx.fill();
      } else if (elapsed <= t_swell + t_hang + t_fall) {
        // Phase 3: Fall - Drop detaches and free-falls
        const progress = (elapsed - t_swell - t_hang) / t_fall;
        const easeProgress = progress * progress * progress; // cubic in
        
        const startYPos = startY + 36;
        const endYPos = H;
        const currentY = startYPos + (endYPos - startYPos) * easeProgress;
        
        // Stretch math
        const stretchLen = 30 * progress;
        const headY = currentY;
        const tailY = currentY - stretchLen;
        const headR = HEAD_R * (1 - progress * 0.1);
        const tailR = TAIL_R * (1 - progress * 0.3);

        // Head
        ctx.beginPath();
        ctx.arc(startX, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.arc(startX, tailY, tailR, 0, Math.PI * 2);
        ctx.fill();

        // Bridge
        ctx.beginPath();
        ctx.moveTo(startX - headR, headY);
        ctx.lineTo(startX - tailR, tailY);
        ctx.lineTo(startX + tailR, tailY);
        ctx.lineTo(startX + headR, headY);
        ctx.closePath();
        ctx.fill();
      } else if (elapsed <= t_swell + t_hang + t_fall + t_wave) {
        // Phase 4: Wave - Drop impacts bottom, triggers rising wave
        const elapsedWave = elapsed - t_swell - t_hang - t_fall;
        const progress = elapsedWave / t_wave;
        const easeProgress = waveBezier(progress);

        const currentWaveR = easeProgress * maxRadius;

        // Wave circle (centered at bottom edge startX, H)
        ctx.arc(startX, H, currentWaveR, 0, Math.PI * 2);
        ctx.fill();

        // Impact compression physics (first 120ms of impact)
        if (elapsedWave < 120) {
          const squashProgress = elapsedWave / 120;
          const squashY = H - 8 * (1 - squashProgress);
          const squashWidth = HEAD_R * (1 + (1 - squashProgress) * 0.8);
          const squashHeight = HEAD_R * (1 - (1 - squashProgress) * 0.5);

          ctx.beginPath();
          ctx.ellipse(startX, squashY, squashWidth, squashHeight, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Animation finished
        onComplete();
        return;
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [screenshotCanvas, startX, startY, onComplete]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        pointerEvents: 'none',
        contain: 'strict',
      }}
    >
      {/* SVG Gooey filter overlay for GPU accelerated metaball merging */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} width="0" height="0">
        <defs>
          <filter id="goo-theme-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          filter: 'url(#goo-theme-filter)',
          transform: 'translateZ(0)', // Force GPU layer
        }}
      />
    </div>,
    document.body
  );
}
