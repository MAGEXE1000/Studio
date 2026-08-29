import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useSettingsStore,
  ACCENT_PRESETS,
  DEFAULT_ACCENT_ID,
  resolveAccent,
  useT,
} from '@workspace/studio-core';
import { Card } from '../../../shared/design-system/StudioDesignSystem';

/**
 * AccentColorPicker
 *
 * Premium, compact, accessible accent color picker for Settings -> Appearance.
 * Supports curated design-system presets, custom arbitrary color picker via native
 * platform input, and immediate live token propagation.
 */
export function AccentColorPicker() {
  const settings = useSettingsStore((s) => s.settings);
  const currentAccent = settings.accentColor || DEFAULT_ACCENT_ID;
  const resolved = resolveAccent(currentAccent);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const isCustomActive =
    resolved.id === 'custom' ||
    (!ACCENT_PRESETS.some((p) => p.id === currentAccent) && currentAccent.startsWith('#'));

  const handleSelectPreset = (presetId: string) => {
    useSettingsStore.getState().updateSettings({ accentColor: presetId });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    useSettingsStore.getState().updateSettings({ accentColor: hex });
  };

  const handleResetDefault = () => {
    useSettingsStore.getState().updateSettings({ accentColor: DEFAULT_ACCENT_ID });
  };

  return (
    <Card
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--app-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
      }}
    >
      {/* Header Row with Active Color preview & Reset action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${resolved.from}, ${resolved.to})`,
              boxShadow: `0 2px 10px ${resolved.soft}, inset 0 1px 1.5px rgba(255, 255, 255, 0.4)`,
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 750,
                color: 'var(--c-text-primary)',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>
                {isCustomActive
                  ? 'Custom Accent'
                  : ACCENT_PRESETS.find((p) => p.id === currentAccent)?.label || 'Accent Color'}
              </span>
              {currentAccent !== DEFAULT_ACCENT_ID && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: 'var(--studio-accent-soft)',
                    color: 'var(--studio-accent-from)',
                    border: '1px solid var(--studio-accent-border)',
                  }}
                >
                  Active
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 'var(--font-section-label, 11.5px)',
                color: 'var(--c-text-secondary)',
                fontFamily: 'Inter, sans-serif',
                marginTop: 2,
              }}
            >
              Choose an accent highlight for buttons, tabs, and controls
            </div>
          </div>
        </div>

        {currentAccent !== DEFAULT_ACCENT_ID && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            onClick={handleResetDefault}
            className="btn-smooth"
            style={{
              background: 'var(--app-surface-low)',
              border: '1px solid var(--c-border)',
              borderRadius: 8,
              padding: '5px 10px',
              color: 'var(--c-text-secondary)',
              fontSize: 'var(--font-section-label, 11px)',
              fontWeight: 650,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              restart_alt
            </span>
            <span>Reset</span>
          </motion.button>
        )}
      </div>

      {/* Swatches Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))',
          gap: 10,
          alignItems: 'center',
          paddingTop: 4,
        }}
      >
        {ACCENT_PRESETS.map((preset) => {
          const isActive = currentAccent === preset.id;
          return (
            <motion.button
              key={preset.id}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.12 }}
              onClick={() => handleSelectPreset(preset.id)}
              title={preset.label}
              className="btn-smooth"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                border: isActive
                  ? '2.5px solid var(--c-text-primary)'
                  : '2px solid rgba(255, 255, 255, 0.16)',
                boxShadow: isActive
                  ? `0 0 0 2px var(--app-surface), 0 4px 14px ${preset.to}66`
                  : '0 2px 6px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: 0,
                outline: 'none',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
              }}
            >
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: '#ffffff',
                    fontWeight: 900,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  check
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* Custom Color Swatch Trigger */}
        <div style={{ position: 'relative', width: 38, height: 38 }}>
          <input
            ref={colorInputRef}
            type="color"
            value={isCustomActive ? resolved.to : '#007aff'}
            onChange={handleCustomColorChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 5,
            }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.12 }}
            onClick={() => colorInputRef.current?.click()}
            title="Choose custom color"
            className="btn-smooth"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: isCustomActive
                ? `linear-gradient(135deg, ${resolved.from}, ${resolved.to})`
                : 'conic-gradient(from 180deg at 50% 50%, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              border: isCustomActive
                ? '2.5px solid var(--c-text-primary)'
                : '2px solid rgba(255, 255, 255, 0.25)',
              boxShadow: isCustomActive
                ? `0 0 0 2px var(--app-surface), 0 4px 14px ${resolved.to}66`
                : '0 2px 6px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              outline: 'none',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 17,
                color: isCustomActive ? resolved.contrast : '#ffffff',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
              }}
            >
              {isCustomActive ? 'check' : 'colorize'}
            </span>
          </motion.button>
        </div>
      </div>
    </Card>
  );
}
