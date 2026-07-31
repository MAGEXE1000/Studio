import React, { useState, useMemo, useCallback } from 'react';

export interface InspiraColorPickerProps {
  color: string; // e.g. '#6366f1' or 'rgba(99, 102, 241, 1)'
  onChange: (newColor: string) => void;
  presetSwatches?: string[];
  showAlpha?: boolean;
}

// Utility conversions
function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length === 6) {
    c += 'ff';
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 24) & 255,
    g: (num >> 16) & 255,
    b: (num >> 8) & 255,
    a: parseFloat(((num & 255) / 255).toFixed(2)),
  };
}

function rgbaToHex({ r, g, b, a }: { r: number; g: number; b: number; a: number }): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex === 'ff' ? '' : alphaHex}`;
}

function rgbaToHsl({ r, g, b, a }: { r: number; g: number; b: number; a: number }): { h: number; s: number; l: number; a: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  };
}

// Calculate WCAG relative luminance & contrast against white/black
function getContrastRatio(r: number, g: number, b: number): { vsWhite: string; vsBlack: string } {
  const lum = [r, g, b].map((v) => {
    const norm = v / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
  const contrastWhite = (1 + 0.05) / (L + 0.05);
  const contrastBlack = (L + 0.05) / (0 + 0.05);
  return {
    vsWhite: contrastWhite.toFixed(1) + ':1',
    vsBlack: contrastBlack.toFixed(1) + ':1',
  };
}

const DEFAULT_SWATCHES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#ffffff', '#000000',
];

export default function InspiraColorPicker({
  color,
  onChange,
  presetSwatches = DEFAULT_SWATCHES,
  showAlpha = true,
}: InspiraColorPickerProps) {
  const [mode, setMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  const rgba = useMemo(() => {
    try {
      if (color.startsWith('#')) return hexToRgba(color);
      if (color.startsWith('rgb')) {
        const parts = color.match(/[\d.]+/g)?.map(Number) || [99, 102, 241, 1];
        return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 };
      }
    } catch {
      // fallback
    }
    return { r: 99, g: 102, b: 241, a: 1 };
  }, [color]);

  const hsl = useMemo(() => rgbaToHsl(rgba), [rgba]);
  const contrast = useMemo(() => getContrastRatio(rgba.r, rgba.g, rgba.b), [rgba]);

  const updateRgba = useCallback(
    (newRgba: Partial<typeof rgba>) => {
      const merged = { ...rgba, ...newRgba };
      if (mode === 'hex') {
        onChange(rgbaToHex(merged));
      } else if (mode === 'rgb') {
        onChange(`rgba(${merged.r}, ${merged.g}, ${merged.b}, ${merged.a})`);
      } else {
        const newHsl = rgbaToHsl(merged);
        onChange(`hsla(${newHsl.h}, ${newHsl.s}%, ${newHsl.l}%, ${newHsl.a})`);
      }
    },
    [rgba, mode, onChange]
  );

  return (
    <div
      style={{
        background: 'var(--app-surface-high, rgba(30,30,35,0.95))',
        border: '1px solid var(--app-border, rgba(255,255,255,0.1))',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 320,
      }}
    >
      {/* Live Preview Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: `0 0 12px rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.4)`,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
            {mode === 'hex'
              ? rgbaToHex(rgba).toUpperCase()
              : mode === 'rgb'
              ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
              : `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontFamily: 'Manrope' }}>
            WCAG: {contrast.vsWhite} (vs White) · {contrast.vsBlack} (vs Black)
          </span>
        </div>
        {/* Format Selector */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          style={{
            background: 'var(--app-surface-low, rgba(0,0,0,0.3))',
            color: 'var(--c-text-primary)',
            border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
        </select>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Red / Hue slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
            {mode === 'hsl' ? 'H' : 'R'}
          </span>
          <input
            type="range"
            min={0}
            max={mode === 'hsl' ? 360 : 255}
            value={mode === 'hsl' ? hsl.h : rgba.r}
            onChange={(e) => updateRgba({ r: Number(e.target.value) })}
            style={{ flex: 1, accentColor: `rgb(${rgba.r},0,0)` }}
          />
          <span style={{ width: 28, fontSize: 11, textAlign: 'right', color: 'var(--c-text-primary)' }}>
            {mode === 'hsl' ? hsl.h : rgba.r}
          </span>
        </div>

        {/* Green / Saturation slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
            {mode === 'hsl' ? 'S' : 'G'}
          </span>
          <input
            type="range"
            min={0}
            max={mode === 'hsl' ? 100 : 255}
            value={mode === 'hsl' ? hsl.s : rgba.g}
            onChange={(e) => updateRgba({ g: Number(e.target.value) })}
            style={{ flex: 1, accentColor: `rgb(0,${rgba.g},0)` }}
          />
          <span style={{ width: 28, fontSize: 11, textAlign: 'right', color: 'var(--c-text-primary)' }}>
            {mode === 'hsl' ? `${hsl.s}%` : rgba.g}
          </span>
        </div>

        {/* Blue / Lightness slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
            {mode === 'hsl' ? 'L' : 'B'}
          </span>
          <input
            type="range"
            min={0}
            max={mode === 'hsl' ? 100 : 255}
            value={mode === 'hsl' ? hsl.l : rgba.b}
            onChange={(e) => updateRgba({ b: Number(e.target.value) })}
            style={{ flex: 1, accentColor: `rgb(0,0,${rgba.b})` }}
          />
          <span style={{ width: 28, fontSize: 11, textAlign: 'right', color: 'var(--c-text-primary)' }}>
            {mode === 'hsl' ? `${hsl.l}%` : rgba.b}
          </span>
        </div>

        {/* Alpha slider */}
        {showAlpha && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)' }}>
              A
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={rgba.a}
              onChange={(e) => updateRgba({ a: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ width: 28, fontSize: 11, textAlign: 'right', color: 'var(--c-text-primary)' }}>
              {Math.round(rgba.a * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Preset Swatches */}
      {presetSwatches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
          {presetSwatches.map((swatch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(swatch)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: swatch,
                border: '1.5px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'transform 150ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
