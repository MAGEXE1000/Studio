import React, { memo } from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { Toggle } from '../../../../shared/settings/SettingControls';
import { useSettingsStore } from '@workspace/studio-core';

export interface StagePreferencesViewProps {
  isLight?: boolean;
  isAmoled?: boolean;
}

interface PrefRowProps {
  title: string;
  description: string;
  control: React.ReactNode;
  isLight?: boolean;
}

const PrefRow: React.FC<PrefRowProps> = ({ title, description, control, isLight }) => (
  <div className="py-3 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 transition-colors">
    <div className="flex-1 min-w-0 pr-2">
      <p
        className="text-[13.5px] font-bold tracking-tight"
        style={{
          color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
          fontFamily: 'Manrope, sans-serif',
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        className="text-[11.5px] leading-relaxed mt-0.5"
        style={{
          color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa',
          fontFamily: 'Inter, sans-serif',
          margin: '2px 0 0 0',
        }}
      >
        {description}
      </p>
    </div>
    <div className="shrink-0 self-start sm:self-center">{control}</div>
  </div>
);

interface SegmentedControlProps<T extends string | number> {
  options: Array<{ label: string; value: T; testId?: string }>;
  value: T;
  onChange: (val: T) => void;
  isLight?: boolean;
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  isLight,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl border"
      style={{
        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.45)',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            data-testid={opt.testId}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-[9px] text-[11px] font-bold tracking-wider transition-all cursor-pointer border"
            style={{
              backgroundColor: active
                ? isLight
                  ? 'rgba(236, 72, 153, 0.12)'
                  : 'rgba(236, 72, 153, 0.18)'
                : 'transparent',
              borderColor: active ? 'var(--studio-accent, #ec4899)' : 'transparent',
              color: active
                ? isLight
                  ? '#db2777'
                  : 'var(--studio-accent, #ec4899)'
                : isLight
                  ? '#71717a'
                  : '#a1a1aa',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface PrefSectionHeaderProps {
  icon: string;
  title: string;
  isLight?: boolean;
}

const PrefSectionHeader: React.FC<PrefSectionHeaderProps> = ({ icon, title, isLight }) => (
  <div className="flex items-center gap-2 mb-2 mt-5 first:mt-1">
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: '15px',
        color: isLight ? 'var(--c-text-tertiary, #71717a)' : 'rgba(255, 255, 255, 0.5)',
      }}
    >
      {icon}
    </span>
    <p
      style={{
        color: isLight ? 'var(--c-text-tertiary, #71717a)' : 'rgba(255, 255, 255, 0.5)',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: '10px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        margin: 0,
      }}
    >
      {title}
    </p>
  </div>
);

export const StagePreferencesView: React.FC<StagePreferencesViewProps> = ({
  isLight: isLightProp,
  isAmoled: isAmoledProp,
}) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;
  const isAmoled =
    isAmoledProp !== undefined ? isAmoledProp : activeVis ? Boolean(activeVis.amoledMode) : false;

  const { preferences, updatePreferences } = useStagexStore();

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

  const cardBg = isLight ? '#ffffff' : isAmoled ? '#000000' : 'var(--c-bg-card, #0d0d11)';

  const cardBorder = isLight
    ? 'rgba(0, 0, 0, 0.08)'
    : isAmoled
      ? 'rgba(255, 255, 255, 0.12)'
      : 'var(--c-border, rgba(255, 255, 255, 0.08))';

  const rowDivider = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  return (
    <div className="w-full pb-4">
      {/* ── 1. APPEARANCE SECTION ── */}
      <PrefSectionHeader icon="palette" title="APPEARANCE" isLight={isLight} />
      <div
        className="rounded-[20px] border p-4 sm:p-5 mb-5 shadow-sm"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
        }}
      >
        <div>
          <p
            className="text-[13.5px] font-bold leading-tight"
            style={{
              color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
              fontFamily: 'Manrope, sans-serif',
              margin: 0,
            }}
          >
            Canvas Background
          </p>
          <p
            className="text-[11.5px] leading-relaxed mt-0.5"
            style={{
              color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa',
              fontFamily: 'Inter, sans-serif',
              margin: '2px 0 0 0',
            }}
          >
            Set the stage plot canvas color.
          </p>
        </div>

        {/* 6-Swatch Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3.5">
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
                className="h-12 sm:h-13 rounded-[12px] border flex flex-col justify-end p-1.5 transition-all cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: bg.value,
                  borderColor: active
                    ? 'var(--studio-accent, #ec4899)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.12)'
                      : 'rgba(255, 255, 255, 0.10)',
                  boxShadow: active
                    ? '0 0 0 1.5px var(--studio-accent, #ec4899), 0 2px 8px rgba(236, 72, 153, 0.3)'
                    : 'none',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <span
                  className="text-[9px] font-black tracking-wider uppercase text-center block w-full truncate"
                  style={{
                    color: active ? '#ffffff' : '#a1a1aa',
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

      {/* ── 2. CANVAS SECTION (Contains Grid Size, Stage Plot Shape, and Toggles) ── */}
      <PrefSectionHeader icon="grid_4x4" title="CANVAS" isLight={isLight} />
      <div
        className="rounded-[20px] border overflow-hidden mb-5 shadow-sm divide-y"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
        }}
      >
        {/* Grid Size Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Grid Size"
            description="Controls the spacing of the stage grid lines."
            isLight={isLight}
            control={
              <SegmentedControl
                options={gridSizes}
                value={preferences.gridSize || 80}
                onChange={(val) => updatePreferences({ gridSize: val })}
                isLight={isLight}
              />
            }
          />
        </div>

        {/* Stage Plot Shape Row (NEW CANONICAL PREFERENCE) */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Stage Plot Shape"
            description="Aspect ratio and geometry of the stage canvas plot."
            isLight={isLight}
            control={
              <SegmentedControl
                options={stageShapes}
                value={preferences.stageShape || 'rectangular'}
                onChange={(val) =>
                  updatePreferences({ stageShape: val as 'rectangular' | 'square' })
                }
                isLight={isLight}
              />
            }
          />
        </div>

        {/* Snap to Grid Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Snap to Grid"
            description="Elements snap to grid when dragging."
            isLight={isLight}
            control={
              <Toggle
                checked={preferences.snapToGrid}
                onChange={(val) => updatePreferences({ snapToGrid: val })}
              />
            }
          />
        </div>

        {/* Show Cable Length Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Show Cable Length"
            description="Display the approximate length of every connection in meters."
            isLight={isLight}
            control={
              <Toggle
                checked={Boolean(preferences.showCableLength)}
                onChange={(val) => updatePreferences({ showCableLength: val })}
              />
            }
          />
        </div>

        {/* Auto Wire Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Auto Wire"
            description="Automatically connect compatible elements when placed."
            isLight={isLight}
            control={
              <Toggle
                checked={Boolean(preferences.autoWire)}
                onChange={(val) => updatePreferences({ autoWire: val })}
              />
            }
          />
        </div>

        {/* Stage Balance Visualizer Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Stage Balance Visualizer"
            description="Show stage weight distribution when elements are placed."
            isLight={isLight}
            control={
              <Toggle
                checked={Boolean(preferences.stageBalanceVisible)}
                onChange={(val) => updatePreferences({ stageBalanceVisible: val })}
              />
            }
          />
        </div>
      </div>

      {/* ── 3. EDITOR SECTION ── */}
      <PrefSectionHeader icon="tune" title="EDITOR" isLight={isLight} />
      <div
        className="rounded-[20px] border overflow-hidden mb-5 shadow-sm divide-y"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
        }}
      >
        {/* Measurement Units Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Measurement Units"
            description="Units used for stage width, depth, and distance indicators."
            isLight={isLight}
            control={
              <SegmentedControl
                options={stageUnitsList}
                value={preferences.stageUnits || 'meters'}
                onChange={(val) => updatePreferences({ stageUnits: val as 'meters' | 'feet' })}
                isLight={isLight}
              />
            }
          />
        </div>

        {/* Reduced Animations Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Reduced Animations"
            description="Minimize transitions and layout motions for performance."
            isLight={isLight}
            control={
              <Toggle
                checked={Boolean(preferences.reducedAnimations)}
                onChange={(val) => updatePreferences({ reducedAnimations: val })}
              />
            }
          />
        </div>

        {/* Grid Overlay Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Grid Overlay"
            description="Display layout alignment grid on the stage canvas."
            isLight={isLight}
            control={
              <Toggle
                checked={preferences.gridVisible !== false}
                onChange={(val) => updatePreferences({ gridVisible: val })}
              />
            }
          />
        </div>

        {/* Cable Connections Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Cable Connections"
            description="Show signal and power routes between stage elements."
            isLight={isLight}
            control={
              <Toggle
                checked={preferences.connectionsVisible !== false}
                onChange={(val) => updatePreferences({ connectionsVisible: val })}
              />
            }
          />
        </div>

        {/* Element Labels Row */}
        <div style={{ borderColor: rowDivider }}>
          <PrefRow
            title="Element Labels"
            description="Show name and channel tag below instruments and audio boxes."
            isLight={isLight}
            control={
              <Toggle
                checked={preferences.labelsVisible !== false}
                onChange={(val) => updatePreferences({ labelsVisible: val })}
              />
            }
          />
        </div>
      </div>
    </div>
  );
};
