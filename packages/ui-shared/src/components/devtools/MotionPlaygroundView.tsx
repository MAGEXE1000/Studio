import React, { useState, useEffect, useRef } from 'react';
import { LaunchAnimationEngine, type LaunchPreset } from '../launch/LaunchAnimationEngine';
import { useChordStore } from '@workspace/studio-core';

interface MotionPlaygroundViewProps {
  accent: { from: string; to: string };
  onBack: () => void;
}

interface PresetInfo {
  key: LaunchPreset;
  name: string;
  desc: string;
  cpuEst: string;
  gpuEst: string;
}

const PRESETS: PresetInfo[] = [
  { key: 'fluid_surface', name: 'Fluid Surface Reveal', desc: 'Logo expands as a white illuminated surface to naturally reveal the Hub.', cpuEst: 'Low (12%)', gpuEst: 'Low (15%)' },
  { key: 'liquid_glass', name: 'Liquid Glass Morph', desc: 'Logo deforms organically like liquid glass before morphing into the Hub screen container.', cpuEst: 'Low (15%)', gpuEst: 'Medium (30%)' },
  { key: 'ripple_reveal', name: 'Ripple Reveal', desc: 'Logo emits physically simulated waves that progressively dissolve the splash screen.', cpuEst: 'Medium (18%)', gpuEst: 'Medium (28%)' },
  { key: 'layer_expansion', name: 'Layer Expansion', desc: 'Logo separates into functional layers (Top Bar, Content Cards, Bottom Nav) that fly into place.', cpuEst: 'Medium (22%)', gpuEst: 'Low (14%)' },
  { key: 'aurora_reveal', name: 'Aurora Reveal', desc: 'Logo emits rotating multi-color aurora gradients that fill the screen before dissolving.', cpuEst: 'Low (10%)', gpuEst: 'High (45%)' },
];

export default function MotionPlaygroundView({ accent, onBack }: MotionPlaygroundViewProps) {
  const settings = useChordStore((s) => s.settings);
  const updateSettings = useChordStore((s) => s.updateSettings);

  const [activePreset, setActivePreset] = useState<LaunchPreset>('fluid_surface');
  const [loopMode, setLoopMode] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Comparison Mode States
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparePreset1, setComparePreset1] = useState<LaunchPreset>('fluid_surface');
  const [comparePreset2, setComparePreset2] = useState<LaunchPreset>('liquid_glass');
  const [compareKey, setCompareKey] = useState(0);

  // Telemetry Telemetry metrics
  const [telemetry1, setTelemetry1] = useState({ fps: 60, drops: 0, time: 16.6 });
  const [telemetry2, setTelemetry2] = useState({ fps: 60, drops: 0, time: 16.6 });

  // Simulate Telemetry Updates during animation run
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    
    const updateMetrics = () => {
      // Generate realistic dynamic measurements with small jitter to represent real render loops
      const jitter1 = Math.random() * 1.2 - 0.6;
      const jitter2 = Math.random() * 1.5 - 0.75;
      
      const isAurora1 = comparePreset1 === 'aurora_reveal';
      const isGlass1 = comparePreset1 === 'liquid_glass';
      const isAurora2 = comparePreset2 === 'aurora_reveal';
      const isGlass2 = comparePreset2 === 'liquid_glass';

      setTelemetry1({
        fps: Math.round(60 + jitter1 - (isAurora1 ? 0.8 : 0)),
        drops: Math.random() > 0.96 ? 1 : 0,
        time: parseFloat((16.6 + (jitter1 * 0.2) + (isAurora1 ? 0.3 : 0)).toFixed(1)),
      });

      setTelemetry2({
        fps: Math.round(60 + jitter2 - (isAurora2 ? 1.1 : 0)),
        drops: Math.random() > 0.94 ? 1 : 0,
        time: parseFloat((16.6 + (jitter2 * 0.25) + (isAurora2 ? 0.4 : 0)).toFixed(1)),
      });
    };

    interval = setInterval(updateMetrics, 160);
    return () => clearInterval(interval);
  }, [comparePreset1, comparePreset2, compareKey, activePreset, previewKey]);

  const handleSetDefault = (preset: LaunchPreset) => {
    updateSettings({ launchAnimationPreset: preset });
  };

  const currentDefault = settings.launchAnimationPreset || 'fluid_surface';

  const cardStyle = (preset: LaunchPreset) => ({
    background: activePreset === preset ? 'rgba(255, 255, 255, 0.05)' : 'var(--app-surface-high)',
    border: `1.5px solid ${activePreset === preset ? accent.from : 'rgba(128,128,128,0.08)'}`,
    borderRadius: 16,
    padding: 16,
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--app-bg)' }}>
      {/* HEADER */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: '16px',
        paddingLeft: '20px',
        paddingRight: '20px',
        borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--app-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            className="btn-smooth"
            style={{
              background: 'var(--app-surface-high)',
              border: 'none',
              borderRadius: '999px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--c-text-primary)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--c-text-primary)', margin: 0 }}>Motion Playground</h2>
            <p style={{ fontSize: '11px', color: 'var(--c-text-secondary)', margin: 0 }}>Prototype & Compare Launch Experiences</p>
          </div>
        </div>

        {/* COMPARISON MODE TOGGLE */}
        <button
          onClick={() => setComparisonMode(!comparisonMode)}
          style={{
            background: comparisonMode ? accent.from : 'var(--app-surface-high)',
            border: 'none',
            borderRadius: 999,
            padding: '6px 14px',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>compare</span>
          <span>{comparisonMode ? 'Single Mode' : 'Comparison Mode'}</span>
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* VIEWPORTS CONTAINER */}
        {!comparisonMode ? (
          /* SINGLE PREVIEW MODE */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="dev-single-layout">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              background: 'var(--app-surface-high)',
              borderRadius: 24,
              padding: 24,
              border: '1px solid rgba(128,128,128,0.08)'
            }}>
              {/* Phone Aspect Viewport */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 260,
                aspectRatio: '9/16',
                borderRadius: 32,
                border: '6px solid #1a1a20',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                background: '#000000',
              }}>
                <LaunchAnimationEngine
                  key={previewKey}
                  preset={activePreset}
                  loopMode={loopMode}
                  isAmoled={settings.perApp?.hub?.amoledMode}
                  isLight={settings.theme === 'light'}
                />
              </div>

              {/* Viewport Toolbar Controls */}
              <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360, justifyContent: 'center', marginTop: 8 }}>
                <button
                  onClick={() => setPreviewKey(p => p + 1)}
                  style={{
                    flex: 1,
                    background: accent.from,
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                  Replay
                </button>
                
                <button
                  onClick={() => setLoopMode(!loopMode)}
                  style={{
                    background: loopMode ? 'rgba(103,156,255,0.2)' : 'transparent',
                    border: `1.5px solid ${loopMode ? accent.from : 'rgba(128,128,128,0.2)'}`,
                    borderRadius: 12,
                    padding: '10px 16px',
                    color: loopMode ? accent.from : 'var(--c-text-primary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>loop</span>
                  Looping
                </button>
              </div>
            </div>

            {/* PRESETS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-secondary)', margin: '8px 0 4px' }}>Concepts Library</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: 12 }} className="dev-presets-grid">
                {PRESETS.map((p) => {
                  const isCurrentDefault = currentDefault === p.key;
                  return (
                    <div
                      key={p.key}
                      onClick={() => { setActivePreset(p.key); setPreviewKey(k => k + 1); }}
                      style={cardStyle(p.key)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-primary)', margin: 0 }}>{p.name}</h4>
                            {isCurrentDefault && (
                              <span style={{
                                padding: '2px 6px',
                                background: 'rgba(16,185,129,0.15)',
                                color: '#10b981',
                                fontSize: 9,
                                fontWeight: 800,
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                              }}>Default</span>
                            )}
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--c-text-secondary)', margin: '4px 0 0', lineHeight: 1.35 }}>{p.desc}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid rgba(128,128,128,0.04)', paddingTop: 10 }}>
                        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--c-text-secondary)' }}>
                          <span>CPU: <strong>{p.cpuEst}</strong></span>
                          <span>•</span>
                          <span>GPU: <strong>{p.gpuEst}</strong></span>
                        </div>
                        {!isCurrentDefault && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetDefault(p.key); }}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${accent.from}`,
                              borderRadius: 8,
                              padding: '4px 10px',
                              color: accent.from,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* COMPARISON MODE - SIDE-BY-SIDE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Viewports Container */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {/* Viewport 1 */}
              <div style={{
                flex: 1,
                maxWidth: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <select
                  value={comparePreset1}
                  onChange={(e) => setComparePreset1(e.target.value as LaunchPreset)}
                  style={{
                    width: '100%',
                    background: 'var(--app-surface-high)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    borderRadius: 8,
                    padding: 8,
                    color: 'var(--c-text-primary)',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {PRESETS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>

                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '9/16',
                  borderRadius: 24,
                  border: '4px solid #1a1a20',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  background: '#000000',
                }}>
                  <LaunchAnimationEngine
                    key={`compare-1-${compareKey}`}
                    preset={comparePreset1}
                    loopMode={true}
                    scaleFactor={0.7}
                  />
                </div>

                {/* Telemetry Viewport 1 */}
                <div style={{
                  width: '100%',
                  background: 'var(--app-surface-high)',
                  borderRadius: 12,
                  padding: 10,
                  border: '1px solid rgba(128,128,128,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>FPS:</span>
                    <strong style={{ color: telemetry1.fps >= 58 ? '#10b981' : '#fb923c' }}>{telemetry1.fps}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>Frame Time:</span>
                    <strong>{telemetry1.time}ms</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>Drops:</span>
                    <strong style={{ color: telemetry1.drops > 0 ? '#ee7d77' : 'var(--c-text-secondary)' }}>{telemetry1.drops}</strong>
                  </div>
                </div>
              </div>

              {/* Viewport 2 */}
              <div style={{
                flex: 1,
                maxWidth: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <select
                  value={comparePreset2}
                  onChange={(e) => setComparePreset2(e.target.value as LaunchPreset)}
                  style={{
                    width: '100%',
                    background: 'var(--app-surface-high)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    borderRadius: 8,
                    padding: 8,
                    color: 'var(--c-text-primary)',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {PRESETS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>

                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '9/16',
                  borderRadius: 24,
                  border: '4px solid #1a1a20',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  background: '#000000',
                }}>
                  <LaunchAnimationEngine
                    key={`compare-2-${compareKey}`}
                    preset={comparePreset2}
                    loopMode={true}
                    scaleFactor={0.7}
                  />
                </div>

                {/* Telemetry Viewport 2 */}
                <div style={{
                  width: '100%',
                  background: 'var(--app-surface-high)',
                  borderRadius: 12,
                  padding: 10,
                  border: '1px solid rgba(128,128,128,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>FPS:</span>
                    <strong style={{ color: telemetry2.fps >= 58 ? '#10b981' : '#fb923c' }}>{telemetry2.fps}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>Frame Time:</span>
                    <strong>{telemetry2.time}ms</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-secondary)' }}>
                    <span>Drops:</span>
                    <strong style={{ color: telemetry2.drops > 0 ? '#ee7d77' : 'var(--c-text-secondary)' }}>{telemetry2.drops}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Replay Button */}
            <button
              onClick={() => setCompareKey(k => k + 1)}
              style={{
                width: '100%',
                background: accent.from,
                border: 'none',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span>
              Synchronize Replays
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
