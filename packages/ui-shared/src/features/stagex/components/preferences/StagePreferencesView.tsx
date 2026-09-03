import React from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { SectionHeader, Toggle } from '../../../../shared/settings/SettingControls';

export const StagePreferencesView: React.FC = () => {
  const { preferences, updatePreferences } = useStagexStore();

  const bgPresets = [
    { label: 'SHADOW', value: '#16161a', desc: 'Standard studio contrast' },
    { label: 'VOID', value: '#000000', desc: 'Maximum battery savings' },
    { label: 'GRAPHITE', value: '#1e2229', desc: 'Cool dark slate' },
    { label: 'SLATE', value: '#1c2430', desc: 'Muted slate blue' },
    { label: 'MIDNIGHT', value: '#1a1a2e', desc: 'Deep midnight navy' },
    { label: 'FOREST', value: '#16241a', desc: 'Deep forest green' },
  ];

  const gridSizes = [
    { label: 'FINE', value: 40 },
    { label: 'NORMAL', value: 80 },
    { label: 'COARSE', value: 120 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pt-2 pb-24">
      {/* ── APPEARANCE SECTION ── */}
      <SectionHeader icon="palette" title="APPEARANCE" />
      <div
        className="rounded-[22px] border p-5 sm:p-6 mb-6"
        style={{
          backgroundColor: 'var(--c-bg-card, #0a0a0c)',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div className="mb-2">
          <p
            className="text-[15px] font-bold leading-tight"
            style={{
              color: 'var(--c-text-primary, #ffffff)',
              fontFamily: 'Manrope, sans-serif',
              margin: 0,
            }}
          >
            Canvas Background
          </p>
          <p
            className="text-[12px] font-normal leading-normal mt-1"
            style={{
              color: 'var(--c-text-secondary, #a1a1aa)',
              fontFamily: 'Inter, sans-serif',
              margin: '2px 0 0 0',
            }}
          >
            Set the stage plot canvas color.
          </p>
        </div>

        {/* 6-Swatch Swatch Grid matching reference */}
        <div className="grid grid-cols-4 gap-2.5 mt-3.5">
          {bgPresets.map((bg) => {
            const active = preferences.canvasBg === bg.value;
            return (
              <button
                key={bg.value}
                data-testid={`bg-swatch-${bg.label.toLowerCase()}`}
                onClick={() =>
                  updatePreferences({ canvasBg: bg.value, amoled: bg.value === '#000000' })
                }
                className="h-16 sm:h-18 rounded-[12px] border flex flex-col justify-end p-2 transition-all cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: bg.value,
                  borderColor: active
                    ? 'var(--studio-accent, #ec4899)'
                    : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: active
                    ? '0 0 0 1px var(--studio-accent, #ec4899), 0 4px 12px rgba(236, 72, 153, 0.25)'
                    : 'none',
                }}
              >
                <span
                  className="text-[9.5px] font-extrabold tracking-wider uppercase text-center block w-full truncate"
                  style={{
                    color: active ? '#ffffff' : '#71717a',
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

      {/* ── CANVAS SECTION ── */}
      <SectionHeader icon="grid_4x4" title="CANVAS" />
      <div
        className="rounded-[22px] border overflow-hidden mb-6 divide-y"
        style={{
          backgroundColor: 'var(--c-bg-card, #0a0a0c)',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        {/* Grid Size Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Grid Size
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Controls the spacing of the stage grid lines.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 self-start sm:self-auto">
            {gridSizes.map((gs) => {
              const active = preferences.gridSize === gs.value;
              return (
                <button
                  key={gs.value}
                  data-testid={`grid-size-${gs.label.toLowerCase()}`}
                  onClick={() => updatePreferences({ gridSize: gs.value })}
                  className="px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border"
                  style={{
                    backgroundColor: active ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                    borderColor: active ? 'var(--studio-accent, #ec4899)' : 'transparent',
                    color: active ? 'var(--studio-accent, #ec4899)' : '#a1a1aa',
                  }}
                >
                  {gs.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Snap to Grid Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Snap to Grid
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Elements snap to grid when dragging.
            </p>
          </div>
          <Toggle
            checked={preferences.snapToGrid}
            onChange={(val) => updatePreferences({ snapToGrid: val })}
          />
        </div>

        {/* Show Cable Length Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Show Cable Length
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Display the approximate length of every connection in meters.
            </p>
          </div>
          <Toggle
            checked={Boolean(preferences.showCableLength)}
            onChange={(val) => updatePreferences({ showCableLength: val })}
          />
        </div>

        {/* Auto Wire Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Auto Wire
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Automatically connect compatible elements when placed.
            </p>
          </div>
          <Toggle
            checked={Boolean(preferences.autoWire)}
            onChange={(val) => updatePreferences({ autoWire: val })}
          />
        </div>

        {/* Stage Balance Visualizer Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Stage Balance Visualizer
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Show stage weight distribution when elements are placed.
            </p>
          </div>
          <Toggle
            checked={Boolean(preferences.stageBalanceVisible)}
            onChange={(val) => updatePreferences({ stageBalanceVisible: val })}
          />
        </div>
      </div>

      {/* ── EDITOR SECTION ── */}
      <SectionHeader icon="edit" title="EDITOR" />
      <div
        className="rounded-[22px] border overflow-hidden mb-6 divide-y"
        style={{
          backgroundColor: 'var(--c-bg-card, #0a0a0c)',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        {/* Stage Shape Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Stage Shape
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Aspect ratio and geometry of the stage canvas plot.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 self-start sm:self-auto">
            <button
              data-testid="stage-shape-rectangle"
              onClick={() => updatePreferences({ stageShape: 'rectangular' })}
              className="px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border"
              style={{
                backgroundColor:
                  (preferences.stageShape || 'rectangular') === 'rectangular'
                    ? 'rgba(236, 72, 153, 0.12)'
                    : 'transparent',
                borderColor:
                  (preferences.stageShape || 'rectangular') === 'rectangular'
                    ? 'var(--studio-accent, #ec4899)'
                    : 'transparent',
                color:
                  (preferences.stageShape || 'rectangular') === 'rectangular'
                    ? 'var(--studio-accent, #ec4899)'
                    : '#a1a1aa',
              }}
            >
              Rectangle
            </button>
            <button
              data-testid="stage-shape-square"
              onClick={() => updatePreferences({ stageShape: 'square' })}
              className="px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border"
              style={{
                backgroundColor:
                  preferences.stageShape === 'square' ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                borderColor:
                  preferences.stageShape === 'square'
                    ? 'var(--studio-accent, #ec4899)'
                    : 'transparent',
                color:
                  preferences.stageShape === 'square' ? 'var(--studio-accent, #ec4899)' : '#a1a1aa',
              }}
            >
              Square
            </button>
          </div>
        </div>

        {/* Measurement Units Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Measurement Units
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Units used for stage width, depth, and distance indicators.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 self-start sm:self-auto">
            <button
              data-testid="units-meters"
              onClick={() => updatePreferences({ stageUnits: 'meters' })}
              className="px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border"
              style={{
                backgroundColor:
                  preferences.stageUnits === 'meters' ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                borderColor:
                  preferences.stageUnits === 'meters'
                    ? 'var(--studio-accent, #ec4899)'
                    : 'transparent',
                color:
                  preferences.stageUnits === 'meters' ? 'var(--studio-accent, #ec4899)' : '#a1a1aa',
              }}
            >
              Meters (m)
            </button>
            <button
              data-testid="units-feet"
              onClick={() => updatePreferences({ stageUnits: 'feet' })}
              className="px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer border"
              style={{
                backgroundColor:
                  preferences.stageUnits === 'feet' ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                borderColor:
                  preferences.stageUnits === 'feet'
                    ? 'var(--studio-accent, #ec4899)'
                    : 'transparent',
                color:
                  preferences.stageUnits === 'feet' ? 'var(--studio-accent, #ec4899)' : '#a1a1aa',
              }}
            >
              Feet (ft)
            </button>
          </div>
        </div>

        {/* Reduced Animations Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Reduced Animations
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Minimize transitions and layout motions for performance.
            </p>
          </div>
          <Toggle
            checked={preferences.reducedAnimations}
            onChange={(val) => updatePreferences({ reducedAnimations: val })}
          />
        </div>

        {/* Grid Overlay Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Grid Overlay
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Display layout alignment grid on the stage canvas.
            </p>
          </div>
          <Toggle
            checked={preferences.gridVisible}
            onChange={(val) => updatePreferences({ gridVisible: val })}
          />
        </div>

        {/* Cable Connections Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Cable Connections
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Show signal and power routes between stage elements.
            </p>
          </div>
          <Toggle
            checked={preferences.connectionsVisible}
            onChange={(val) => updatePreferences({ connectionsVisible: val })}
          />
        </div>

        {/* Element Labels Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-bold"
              style={{
                color: 'var(--c-text-primary, #ffffff)',
                fontFamily: 'Manrope, sans-serif',
                margin: 0,
              }}
            >
              Element Labels
            </p>
            <p
              className="text-[12px] font-normal mt-0.5"
              style={{
                color: 'var(--c-text-secondary, #a1a1aa)',
                fontFamily: 'Inter, sans-serif',
                margin: '2px 0 0 0',
              }}
            >
              Show name and channel tag below instruments and audio boxes.
            </p>
          </div>
          <Toggle
            checked={preferences.labelsVisible}
            onChange={(val) => updatePreferences({ labelsVisible: val })}
          />
        </div>
      </div>
    </div>
  );
};
