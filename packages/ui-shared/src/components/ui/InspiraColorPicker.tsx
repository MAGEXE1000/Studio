import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ACCENT_COLORS, useSettingsStore, settingsController } from '@workspace/studio-core';

export interface InspiraColorPickerProps {
  value?: string;
  onChange?: (colorKeyOrHex: string) => void;
  className?: string;
}

// ── Color Conversion Helpers ──────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean.slice(0, 6), 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Livex HTML Specification Color Picker Implementation
 * 2D Saturation/Lightness Canvas + Hue Slider + Opacity Slider + HEX/RGB Badges + Presets
 */
export default function InspiraColorPicker({ className = '' }: InspiraColorPickerProps) {
  const settings = useSettingsStore((s) => s.settings);
  const currentAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'purple';
  const activeColorObj = ACCENT_COLORS[currentAccentKey] ?? ACCENT_COLORS.purple;

  const initialHex = activeColorObj.from;
  const initialRgb = hexToRgb(initialHex);
  const initialHsl = rgbToHsl(initialRgb.r, initialRgb.g, initialRgb.b);

  const [hue, setHue] = useState<number>(settings.customAccentHue ?? initialHsl.h);
  const [saturation, setSaturation] = useState<number>(initialHsl.s || 80);
  const [lightness, setLightness] = useState<number>(initialHsl.l || 70);
  const [opacity, setOpacity] = useState<number>(100);

  const [presets, setPresets] = useState<string[]>([
    '#ADC6FF',
    '#FFB595',
    '#E91E63',
    '#9C27B0',
    '#4CAF50',
    '#FF9800',
  ]);

  const currentColorHex = useMemo(
    () => hslToHex(hue, saturation, lightness),
    [hue, saturation, lightness]
  );
  const currentRgb = useMemo(() => hexToRgb(currentColorHex), [currentColorHex]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateColorFromCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let x = clientX - rect.left;
      let y = clientY - rect.top;
      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));

      const s = Math.round((x / rect.width) * 100);
      const l = Math.round((1 - y / rect.height) * 100);

      setSaturation(s);
      setLightness(l);

      settingsController.updateSettings({
        accentColor: 'custom',
        customAccentHue: hue,
      });
    },
    [hue]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    updateColorFromCanvas(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      updateColorFromCanvas(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        updateColorFromCanvas(e.clientX, e.clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) {
        updateColorFromCanvas(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [updateColorFromCanvas]);

  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    settingsController.updateSettings({
      accentColor: 'custom',
      customAccentHue: newHue,
    });
  };

  const handlePresetSelect = (hex: string) => {
    const rgbVal = hexToRgb(hex);
    const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
    setHue(hslVal.h);
    setSaturation(hslVal.s);
    setLightness(hslVal.l);

    const matchKey = Object.keys(ACCENT_COLORS).find(
      (k) => ACCENT_COLORS[k].from.toLowerCase() === hex.toLowerCase()
    );
    if (matchKey) {
      settingsController.updateSettings({ accentColor: matchKey as any });
    } else {
      settingsController.updateSettings({ accentColor: 'custom', customAccentHue: hslVal.h });
    }
  };

  const handleAddPreset = () => {
    const upperHex = currentColorHex.toUpperCase();
    if (!presets.includes(upperHex)) {
      setPresets((prev) => [...prev, upperHex]);
    }
  };

  return (
    <div className={`bg-surface-container-lowest rounded-lg p-4 custom-shadow flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-title-md text-title-md text-on-surface">Accent Color</h3>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Color Picker Visual Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="relative w-full aspect-[4/3] md:w-56 md:h-48 rounded-lg overflow-hidden color-canvas flex items-center justify-center cursor-crosshair select-none"
          style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        >
          <div
            className="w-5 h-5 border-2 border-white rounded-full shadow-lg absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              top: `${Math.max(5, Math.min(95, 100 - lightness))}%`,
              left: `${Math.max(5, Math.min(95, saturation))}%`,
            }}
          />
        </div>

        {/* Sliders & Previews */}
        <div className="flex-1 space-y-4">
          <div className="space-y-3">
            {/* Hue Slider */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">
                Hue
              </label>
              <div
                className="h-3 w-full rounded-full relative cursor-pointer"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={hue}
                  onChange={(e) => handleHueChange(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className="h-5 w-5 bg-white rounded-full border-4 border-surface shadow-sm -mt-1 absolute pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${(hue / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">
                Opacity
              </label>
              <div
                className="h-3 w-full rounded-full bg-surface-container relative cursor-pointer"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #1c1c1c 25%, transparent 25%), linear-gradient(-45deg, #1c1c1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1c1c 75%), linear-gradient(-45deg, transparent 75%, #1c1c1c 75%)',
                  backgroundSize: '6px 6px',
                }}
              >
                <div
                  className="h-full w-full rounded-full relative"
                  style={{
                    background: `linear-gradient(to right, transparent, ${currentColorHex})`,
                  }}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div
                    className="h-5 w-5 bg-white rounded-full border-4 border-surface shadow-sm -mt-1 absolute pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${opacity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HEX / RGB Badges */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-container rounded p-2 flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant text-[10px]">HEX</span>
              <div className="font-body-md font-semibold text-on-surface uppercase">
                {currentColorHex.toUpperCase()}
              </div>
            </div>
            <div className="bg-surface-container rounded p-2 flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant text-[10px]">RGB</span>
              <div className="font-body-md font-semibold text-on-surface">
                {currentRgb.r}, {currentRgb.g}, {currentRgb.b}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2.5 pt-3 border-t border-surface-variant/20">
        {presets.map((hex, idx) => {
          const isSelected = currentColorHex.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={`${hex}-${idx}`}
              type="button"
              onClick={() => handlePresetSelect(hex)}
              style={{ backgroundColor: hex }}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-105 ${
                isSelected
                  ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-surface-container-lowest scale-105'
                  : ''
              }`}
            />
          );
        })}
        <button
          type="button"
          onClick={handleAddPreset}
          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95"
          title="Add current color to presets"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </div>
  );
}
