import React, { useRef } from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import {
  useSettingsStore,
  useScrollHide,
  useT,
  useIsWebDesktop,
  resolveAccent,
} from '@workspace/studio-core';
import {
  Toggle,
  SectionHeader,
  SettingRow,
  SegmentedControl,
} from '../../../../shared/settings/SettingControls';
import { StudioHeader } from '../../../../shared/layout/StudioHeader';

export interface StagePreferencesViewProps {
  isLight?: boolean;
  isAmoled?: boolean;
}

export const StagePreferencesView: React.FC<StagePreferencesViewProps> = () => {
  const settings = useSettingsStore((s) => s.settings);
  const acc = resolveAccent(settings.accentColor);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);

  const t = useT();
  const tr = t as any;
  const isWebDesktop = useIsWebDesktop();

  const { preferences, updatePreferences } = useStagexStore();

  const cardStyle: React.CSSProperties = {
    background: 'var(--app-surface)',
    borderRadius: '1.5rem',
    overflow: 'hidden',
    transition: 'background-color 700ms cubic-bezier(0.4,0,0.2,1)',
  };

  const bgPresets = [
    { label: 'Shadow', value: '#16161a', desc: 'Standard studio contrast' },
    { label: 'Void', value: '#000000', desc: 'Maximum battery savings' },
    { label: 'Graphite', value: '#1e2229', desc: 'Cool dark slate' },
    { label: 'Slate', value: '#1c2430', desc: 'Muted slate blue' },
    { label: 'Midnight', value: '#1a1a2e', desc: 'Deep midnight navy' },
    { label: 'Forest', value: '#16241a', desc: 'Deep forest green' },
  ];

  const gridSizes = [
    { label: 'FINE', value: 40, testId: 'grid-size-fine' },
    { label: 'NORMAL', value: 80, testId: 'grid-size-normal' },
    { label: 'COARSE', value: 120, testId: 'grid-size-coarse' },
  ];

  const stageShapes = [
    { label: 'Rectangle', value: 'rectangular', testId: 'stage-shape-rectangle' },
    { label: 'Square', value: 'square', testId: 'stage-shape-square' },
  ];

  const stageUnitsList = [
    { label: 'Meters (m)', value: 'meters', testId: 'units-meters' },
    { label: 'Feet (ft)', value: 'feet', testId: 'units-feet' },
  ];

  const title = tr.stagex?.preferences || 'Preferences';
  const subtitle =
    tr.stagex?.preferencesSubtitle || 'Stage plot canvas, display and editor settings';

  return (
    <div className="flex flex-col h-full overflow-hidden app-bg">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
          paddingTop: isWebDesktop ? '20px' : '0',
        }}
      >
        <StudioHeader title={title} subtitle={subtitle} />

        <div className="px-6 max-w-3xl mx-auto">
          {/* ── 1. APPEARANCE ── */}
          <SectionHeader icon="palette" title="Appearance" />
          <div style={cardStyle} className="mb-6">
            <div
              style={{
                padding: '14px 16px',
                boxSizing: 'border-box',
              }}
            >
              <p
                style={{
                  fontSize: '14.5px',
                  fontWeight: 750,
                  color: 'var(--c-text-primary)',
                  fontFamily: 'Manrope, sans-serif',
                  letterSpacing: '-0.015em',
                  margin: 0,
                }}
              >
                Canvas Background
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  opacity: 0.82,
                  margin: '2px 0 12px',
                }}
              >
                Set the stage plot canvas color.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {bgPresets.map((bg) => {
                  const active = preferences.canvasBg === bg.value;
                  return (
                    <button
                      key={bg.value}
                      type="button"
                      data-testid={`bg-swatch-${bg.label.toLowerCase()}`}
                      onClick={() =>
                        updatePreferences({ canvasBg: bg.value, amoled: bg.value === '#000000' })
                      }
                      className="h-12 rounded-[12px] flex flex-col justify-end p-1.5 transition-all cursor-pointer relative overflow-hidden"
                      style={{
                        backgroundColor: bg.value,
                        border: active ? `2px solid ${acc.from}` : '1px solid var(--c-border)',
                        boxShadow: active
                          ? `0 0 0 1.5px ${acc.from}, 0 2px 8px rgba(0, 0, 0, 0.3)`
                          : 'none',
                        transform: active ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <span
                        className="text-[9px] font-extrabold tracking-wider uppercase text-center block w-full truncate"
                        style={{
                          color: active ? '#ffffff' : 'var(--c-text-secondary)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {bg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 2. CANVAS ── */}
          <SectionHeader icon="grid_4x4" title="Canvas" />
          <div style={cardStyle} className="mb-6">
            <SettingRow label="Grid Size" desc="Controls the spacing of the stage grid lines.">
              <SegmentedControl
                options={gridSizes}
                value={preferences.gridSize || 80}
                onChange={(val) => updatePreferences({ gridSize: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="stagex-grid-size"
              />
            </SettingRow>

            <SettingRow
              label="Stage Plot Shape"
              desc="Aspect ratio and geometry of the stage canvas plot."
            >
              <SegmentedControl
                options={stageShapes}
                value={preferences.stageShape || 'rectangular'}
                onChange={(val) =>
                  updatePreferences({ stageShape: val as 'rectangular' | 'square' })
                }
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="stagex-shape"
              />
            </SettingRow>

            <SettingRow label="Snap to Grid" desc="Elements snap to grid when dragging.">
              <Toggle
                value={preferences.snapToGrid}
                onChange={(val) => updatePreferences({ snapToGrid: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Show Cable Length"
              desc="Display the approximate length of every connection in meters."
            >
              <Toggle
                value={Boolean(preferences.showCableLength)}
                onChange={(val) => updatePreferences({ showCableLength: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Auto Wire"
              desc="Automatically connect compatible elements when placed."
            >
              <Toggle
                value={Boolean(preferences.autoWire)}
                onChange={(val) => updatePreferences({ autoWire: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Stage Balance Visualizer"
              desc="Show stage weight distribution when elements are placed."
            >
              <Toggle
                value={Boolean(preferences.stageBalanceVisible)}
                onChange={(val) => updatePreferences({ stageBalanceVisible: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </div>

          {/* ── 3. EDITOR ── */}
          <SectionHeader icon="tune" title="Editor" />
          <div style={cardStyle} className="mb-6">
            <SettingRow
              label="Measurement Units"
              desc="Units used for stage width, depth, and distance indicators."
            >
              <SegmentedControl
                options={stageUnitsList}
                value={preferences.stageUnits || 'meters'}
                onChange={(val) => updatePreferences({ stageUnits: val as 'meters' | 'feet' })}
                accentFrom={acc.from}
                accentTo={acc.to}
                layoutId="stagex-units"
              />
            </SettingRow>

            <SettingRow
              label="Reduced Animations"
              desc="Minimize transitions and layout motions for performance."
            >
              <Toggle
                value={Boolean(preferences.reducedAnimations)}
                onChange={(val) => updatePreferences({ reducedAnimations: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Grid Overlay"
              desc="Display layout alignment grid on the stage canvas."
            >
              <Toggle
                value={preferences.gridVisible !== false}
                onChange={(val) => updatePreferences({ gridVisible: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Cable Connections"
              desc="Show signal and power routes between stage elements."
            >
              <Toggle
                value={preferences.connectionsVisible !== false}
                onChange={(val) => updatePreferences({ connectionsVisible: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>

            <SettingRow
              label="Element Labels"
              desc="Show name and channel tag below instruments and audio boxes."
            >
              <Toggle
                value={preferences.labelsVisible !== false}
                onChange={(val) => updatePreferences({ labelsVisible: val })}
                accentFrom={acc.from}
                accentTo={acc.to}
              />
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  );
};
