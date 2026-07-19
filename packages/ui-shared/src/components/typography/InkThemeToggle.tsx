import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useChordStore } from '@workspace/studio-core';
import InkThemeOverlay from '../feature/InkThemeOverlay';

export default function InkThemeToggle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const settings = useChordStore(s => s.settings);
  const updateSettings = useChordStore(s => s.updateSettings);

  const [overlayData, setOverlayData] = useState<{
    screenshot: HTMLCanvasElement;
    startX: number;
    startY: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);

  // Resolve current active theme mode
  const currentTheme = settings.theme ?? 'dark';
  const isLight = currentTheme === 'light' || (currentTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const handleToggle = useCallback(async () => {
    if (isTransitioningRef.current || !buttonRef.current) return;
    isTransitioningRef.current = true;

    try {
      const btn = buttonRef.current;
      const rect = btn.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      // 1. Take snapshot of document body
      const screenshot = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: isLight ? '#f4f4f5' : '#000000',
        scale: 1, // Keep snapshot memory usage light and sharp
      });

      // 2. Set overlay screenshot to block visually
      setOverlayData({
        screenshot,
        startX,
        startY,
      });

      // 3. Switch application theme underneath synchronously
      const nextTheme = isLight ? 'dark' : 'light';
      updateSettings({
        theme: nextTheme,
        amoledMode: false,
      });
    } catch (err) {
      console.error('Failed to trigger Ink theme transition:', err);
      isTransitioningRef.current = false;
    }
  }, [isLight, updateSettings]);

  const handleComplete = useCallback(() => {
    setOverlayData(null);
    isTransitioningRef.current = false;
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-10 h-10 flex items-center justify-center rounded-full glass-surface text-on-surface hover:bg-white/5 active:scale-90 transition-transform ${className || ''}`}
        style={{
          border: '1px solid var(--c-border)',
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
      >
        <span
          className="material-symbols-outlined select-none"
          style={{
            fontSize: '20px',
            fontVariationSettings: "'FILL' 0",
          }}
        >
          {isLight ? 'dark_mode' : 'light_mode'}
        </span>
      </button>

      {overlayData && (
        <InkThemeOverlay
          screenshotCanvas={overlayData.screenshot}
          startX={overlayData.startX}
          startY={overlayData.startY}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
