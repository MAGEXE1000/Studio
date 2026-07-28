export interface PaintVerificationResult {
  domExists: boolean;
  paintState: 'painted' | 'visually_black' | 'dom_missing' | 'error';
  blackPercent: number;
  histogram: {
    black: number;
    dark: number;
    mid: number;
    bright: number;
  };
  totalPixels: number;
  thumbnail: string;
}

/**
 * Captures screen/DOM element via canvas and verifies whether content is visually black or painted.
 */
export async function runPaintVerification(
  scaleFactor = 0.1
): Promise<PaintVerificationResult> {
  const el =
    document.querySelector('[data-livex-hub-root="true"]') ||
    document.querySelector('.app-main-layout') ||
    document.getElementById('root');

  if (!el) {
    return {
      domExists: false,
      paintState: 'dom_missing',
      blackPercent: 100,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: '',
    };
  }

  try {
    // @ts-ignore
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el as HTMLElement, {
      logging: false,
      useCORS: true,
      scale: scaleFactor,
    });
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let blackCount = 0;
    let darkCount = 0;
    let midCount = 0;
    let brightCount = 0;
    const total = canvas.width * canvas.height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      if (r < 15 && g < 15 && b < 15) {
        blackCount++;
      }

      if (gray <= 15) {
        // counted in black
      } else if (gray <= 64) {
        darkCount++;
      } else if (gray <= 180) {
        midCount++;
      } else {
        brightCount++;
      }
    }

    const blackPercent = total > 0 ? Math.round((blackCount / total) * 100) : 0;
    const isVisuallyBlack = blackPercent > 98;

    let thumbnail = '';
    try {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 60;
      thumbCanvas.height = 100;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, 60, 100);
        thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.2);
      } else {
        thumbnail = canvas.toDataURL('image/jpeg', 0.1);
      }
    } catch (_) {
      try {
        thumbnail = canvas.toDataURL('image/jpeg', 0.1);
      } catch (_) {}
    }

    return {
      domExists: true,
      paintState: isVisuallyBlack ? 'visually_black' : 'painted',
      blackPercent,
      histogram: {
        black: blackCount,
        dark: darkCount,
        mid: midCount,
        bright: brightCount,
      },
      totalPixels: total,
      thumbnail,
    };
  } catch (err) {
    console.error('Paint verification failed:', err);
    return {
      domExists: true,
      paintState: 'error',
      blackPercent: 0,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: '',
    };
  }
}
