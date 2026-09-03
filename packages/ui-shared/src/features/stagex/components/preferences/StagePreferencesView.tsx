import React from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { SectionHeader, SettingRow, Toggle } from '../../../../shared/settings/SettingControls';

export const StagePreferencesView: React.FC = () => {
  const { preferences, updatePreferences } = useStagexStore();

  const bgPresets = [
    { label: 'Deep Dark', value: '#0e0e0e', desc: 'Standard studio contrast' },
    { label: 'Pure AMOLED', value: '#000000', desc: 'Maximum battery savings' },
    { label: 'Studio Light', value: '#f2f1ef', desc: 'High daylight visibility' },
  ];

  const gridSizes = [
    { label: 'Fine (40px)', value: 40 },
    { label: 'Standard (80px)', value: 80 },
    { label: 'Coarse (120px)', value: 120 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pt-2 pb-12">
      {/* Appearance Section */}
      <SectionHeader icon="palette" title="Appearance & Theme" />
      <div
        className="rounded-[18px] border overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--c-bg-card, rgba(20, 20, 24, 0.65))',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <SettingRow
          label="Canvas Background"
          desc="Select the backdrop style for the stage plot editor"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
            {bgPresets.map((bg) => {
              const active = preferences.canvasBg === bg.value;
              return (
                <button
                  key={bg.value}
                  onClick={() =>
                    updatePreferences({ canvasBg: bg.value, amoled: bg.value === '#000000' })
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: active ? '#ffffff' : '#a1a1aa',
                  }}
                >
                  {bg.label}
                </button>
              );
            })}
          </div>
        </SettingRow>

        <SettingRow
          label="Reduced Animations"
          desc="Minimize transitions and layout motions for performance"
        >
          <Toggle
            checked={preferences.reducedAnimations}
            onChange={(val) => updatePreferences({ reducedAnimations: val })}
          />
        </SettingRow>
      </div>

      {/* Grid & Snapping Section */}
      <SectionHeader icon="grid_4x4" title="Grid & Snapping" />
      <div
        className="rounded-[18px] border overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--c-bg-card, rgba(20, 20, 24, 0.65))',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <SettingRow label="Grid Overlay" desc="Display layout alignment grid on the stage canvas">
          <Toggle
            checked={preferences.gridVisible}
            onChange={(val) => updatePreferences({ gridVisible: val })}
          />
        </SettingRow>

        <SettingRow
          label="Snap to Grid"
          desc="Automatically align elements to grid intersections while dragging"
        >
          <Toggle
            checked={preferences.snapToGrid}
            onChange={(val) => updatePreferences({ snapToGrid: val })}
          />
        </SettingRow>

        <SettingRow
          label="Grid Cell Size"
          desc="Distance between horizontal and vertical grid lines"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
            {gridSizes.map((gs) => {
              const active = preferences.gridSize === gs.value;
              return (
                <button
                  key={gs.value}
                  onClick={() => updatePreferences({ gridSize: gs.value })}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: active ? '#ffffff' : '#a1a1aa',
                  }}
                >
                  {gs.label}
                </button>
              );
            })}
          </div>
        </SettingRow>
      </div>

      {/* Stage Layout Section */}
      <SectionHeader icon="straighten" title="Stage Dimensions & Units" />
      <div
        className="rounded-[18px] border overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--c-bg-card, rgba(20, 20, 24, 0.65))',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <SettingRow
          label="Measurement Units"
          desc="Units used for stage width, depth, and distance indicators"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
            <button
              onClick={() => updatePreferences({ stageUnits: 'meters' })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor:
                  preferences.stageUnits === 'meters' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: preferences.stageUnits === 'meters' ? '#ffffff' : '#a1a1aa',
              }}
            >
              Meters (m)
            </button>
            <button
              onClick={() => updatePreferences({ stageUnits: 'feet' })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor:
                  preferences.stageUnits === 'feet' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: preferences.stageUnits === 'feet' ? '#ffffff' : '#a1a1aa',
              }}
            >
              Feet (ft)
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label="Stage Width"
          desc={`Default width of the performance area (${preferences.stageUnits === 'meters' ? '12m' : '40ft'})`}
        >
          <span className="text-xs font-mono font-bold text-neutral-300">
            {preferences.stageWidth || 12} {preferences.stageUnits === 'meters' ? 'm' : 'ft'}
          </span>
        </SettingRow>

        <SettingRow
          label="Stage Depth"
          desc={`Default depth from front of stage to backdrop (${preferences.stageUnits === 'meters' ? '8m' : '26ft'})`}
        >
          <span className="text-xs font-mono font-bold text-neutral-300">
            {preferences.stageDepth || 8} {preferences.stageUnits === 'meters' ? 'm' : 'ft'}
          </span>
        </SettingRow>
      </div>

      {/* Overlays & Routing Section */}
      <SectionHeader icon="hub" title="Connections & Overlays" />
      <div
        className="rounded-[18px] border overflow-hidden"
        style={{
          backgroundColor: 'var(--c-bg-card, rgba(20, 20, 24, 0.65))',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <SettingRow
          label="Cable Connections"
          desc="Show signal and power routes between stage elements"
        >
          <Toggle
            checked={preferences.connectionsVisible}
            onChange={(val) => updatePreferences({ connectionsVisible: val })}
          />
        </SettingRow>

        <SettingRow
          label="Element Labels"
          desc="Show name and channel tag below instruments and audio boxes"
        >
          <Toggle
            checked={preferences.labelsVisible}
            onChange={(val) => updatePreferences({ labelsVisible: val })}
          />
        </SettingRow>
      </div>
    </div>
  );
};
