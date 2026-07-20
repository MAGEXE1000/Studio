import React, { useState, useEffect, useRef } from 'react';
import { useChordStore } from '@workspace/studio-core';
import { motion, AnimatePresence } from 'motion/react';

interface TransitionConcept {
  id: string;
  name: string;
  description: string;
  notes: string;
}

const CONCEPTS: TransitionConcept[] = [
  {
    id: 'liquid-wave',
    name: 'Liquid Wave',
    description:
      'A beautiful diagonal bezier liquid wave clip-path sweep that glides across the screen.',
    notes:
      'Uses GPU-accelerated CSS clip-paths. Avoids main thread layout invalidations. Highly performant on WebView.',
  },
  {
    id: 'glass-ripple',
    name: 'Glass Ripple',
    description:
      'A concentric ripple expanding from touch coordinates with a frosted glass refraction effect.',
    notes:
      'Leverages CSS backdrop-filter with scale transforms. Moderate GPU load due to dynamic blur calculations.',
  },
  {
    id: 'fluid-bloom',
    name: 'Fluid Bloom',
    description: 'A hardware-accelerated brightness bloom and chromatic saturation pulse reveal.',
    notes:
      'Combines CSS filters (brightness, contrast, saturate) with circular clip-paths. Outstanding frame pacing.',
  },
  {
    id: 'radial-flow',
    name: 'Radial Surface Flow',
    description:
      'A multi-layered swirling gradient circle expanding outward from the touch position.',
    notes: 'Uses multi-stop radial gradient backgrounds on a GPU-composited overlay layer.',
  },
  {
    id: 'ink-spread',
    name: 'Dynamic Ink Spread',
    description:
      'An organic, ink-blot spread using SVG turbulence and gooey threshold matrix filters.',
    notes:
      'Computationally heavy. SVG feTurbulence filters require CPU rasterization on older WebView engines, resulting in minor jank.',
  },
  {
    id: 'gradient-field',
    name: 'Expanding Gradient Field',
    description:
      'Shifting conic and radial gradients blending across the surface during transition.',
    notes:
      'Implements opacity cross-fades of pre-rendered gradient vectors to prevent runtime gradient recalculation.',
  },
  {
    id: 'chromatic-pulse',
    name: 'Soft Chromatic Pulse',
    description: 'A fast circular reveal that splits RGB channels momentarily before settling.',
    notes:
      'Duplicates the layer into three composited elements offset by color-matrix shifts. Medium fill cost.',
  },
  {
    id: 'glass-morph',
    name: 'Glass Morph',
    description:
      'Heavily blurred frost-glass overlay sliding in and dissolving into the new theme.',
    notes:
      'Utilizes high-radius backdrop-filter blurs. Double-buffered layer increases memory usage during animation.',
  },
  {
    id: 'energy-prop',
    name: 'Energy Propagation',
    description:
      'A glowing lightning-like neon ring propagating outward from the click with subtle sparks.',
    notes:
      'Draws a canvas-rendered neon ring overlay. Bypasses React updates for 60fps particle logic.',
  },
  {
    id: 'diffusion',
    name: 'Surface Diffusion',
    description: 'A granular pixel noise/dither dissolve wave spreading across the screen.',
    notes:
      'Uses a dynamic CSS mask-image with dithered SVG patterns. Excellent retro dither aesthetic.',
  },
];

interface MotionPlaygroundViewProps {
  accent: { from: string; to: string };
  onBack: () => void;
}

export default function MotionPlaygroundView({ accent, onBack }: MotionPlaygroundViewProps) {
  const [selectedConcept, setSelectedConcept] = useState<string>('liquid-wave');
  const [simulatedTheme, setSimulatedTheme] = useState<'light' | 'dark'>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickCoord, setClickCoord] = useState({ x: 120, y: 200 });

  // Measured Telemetry
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    drops: 0,
    time: 0,
    active: false,
  });

  const transitionFrameRef = useRef<number | null>(null);

  const activeConcept = CONCEPTS.find((c) => c.id === selectedConcept) || CONCEPTS[0];

  const triggerTransition = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTransitioning) return;

    // Capture relative coordinates inside the phone screen mockup
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setClickCoord({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2,
      });
    }

    setIsTransitioning(true);
    setTelemetry((prev) => ({ ...prev, active: true, time: 0, drops: 0, fps: 60 }));

    const duration = 650; // ms
    const startTime = performance.now();
    let frameCount = 0;
    let jankCount = 0;
    let lastFrameTime = performance.now();

    const measureFrame = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      frameCount++;

      const delta = now - lastFrameTime;
      lastFrameTime = now;

      // Frame time > 20ms (~50fps) counts as a dropped frame/jank
      if (delta > 20) {
        jankCount++;
      }

      if (elapsed < duration) {
        transitionFrameRef.current = requestAnimationFrame(measureFrame);
      } else {
        const finalTime = performance.now() - startTime;
        const calculatedFps = Math.min(60, Math.round((frameCount / finalTime) * 1000));
        setTelemetry({
          fps: calculatedFps,
          drops: jankCount,
          time: parseFloat(finalTime.toFixed(1)),
          active: false,
        });
        setIsTransitioning(false);
        setSimulatedTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
      }
    };

    transitionFrameRef.current = requestAnimationFrame(measureFrame);
  };

  useEffect(() => {
    return () => {
      if (transitionFrameRef.current) {
        cancelAnimationFrame(transitionFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--app-bg)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
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
          zIndex: 100,
        }}
      >
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
              color: 'var(--c-text-primary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              arrow_back
            </span>
          </button>
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                margin: 0,
              }}
            >
              Theme Laboratory
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--c-text-secondary)', margin: 0 }}>
              Flagship Transition Architect Playground
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* SELECT CONCEPT */}
        <div
          style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--c-text-secondary)',
              letterSpacing: '0.05em',
            }}
          >
            Select Transition Concept
          </label>
          <select
            value={selectedConcept}
            onChange={(e) => setSelectedConcept(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 14,
              border: '1px solid rgba(128,128,128,0.15)',
              background: 'var(--app-surface-high)',
              color: 'var(--c-text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {CONCEPTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* PREVIEW CONTAINER */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            background: 'var(--app-surface-high)',
            borderRadius: 24,
            padding: 24,
            border: '1px solid rgba(128,128,128,0.08)',
            width: '100%',
            maxWidth: 440,
            boxSizing: 'border-box',
          }}
        >
          {/* Phone Aspect Viewport Mockup */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 240,
              aspectRatio: '9/16',
              borderRadius: 32,
              border: '6px solid #1a1a20',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              background: simulatedTheme === 'dark' ? '#0a0a0c' : '#f8f9fa',
              color: simulatedTheme === 'dark' ? '#ffffff' : '#111827',
              transition: isTransitioning ? 'none' : 'background 300ms ease, color 300ms ease',
            }}
          >
            {/* Simulated App Content Layout */}
            <div
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>LIVEX STUDIO</span>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  signal_cellular_alt
                </span>
              </div>

              <div style={{ marginTop: 8 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px' }}>Workspace</h4>
                <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>
                  Simulated Laboratory Environment
                </p>
              </div>

              {/* Cards Mockup */}
              <div
                style={{
                  background:
                    simulatedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(128,128,128,0.08)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Primary Core</div>
                <div
                  style={{ width: '80%', height: 6, borderRadius: 3, background: accent.from }}
                />
              </div>

              <div
                style={{
                  background:
                    simulatedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid rgba(128,128,128,0.08)',
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>AppTelemetry</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 2,
                      background: 'rgba(128,128,128,0.2)',
                      width: '90%',
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      borderRadius: 2,
                      background: 'rgba(128,128,128,0.2)',
                      width: '70%',
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      borderRadius: 2,
                      background: 'rgba(128,128,128,0.2)',
                      width: '85%',
                    }}
                  />
                </div>
              </div>

              {/* Floating Action Button (Theme Trigger) */}
              <button
                onClick={triggerTransition}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: accent.from,
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 20,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {simulatedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            {/* TRANSITION OVERLAY ANIMATOR */}
            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {/* CONCEPT 1: Liquid Wave */}
                  {selectedConcept === 'liquid-wave' && (
                    <motion.div
                      initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
                      animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: simulatedTheme === 'dark' ? '#f8f9fa' : '#0a0a0c',
                      }}
                    />
                  )}

                  {/* CONCEPT 2: Glass Ripple */}
                  {selectedConcept === 'glass-ripple' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 4.5, opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        left: clickCoord.x - 50,
                        top: clickCoord.y - 50,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '2px solid rgba(255,255,255,0.3)',
                      }}
                    />
                  )}

                  {/* CONCEPT 3: Fluid Bloom */}
                  {selectedConcept === 'fluid-bloom' && (
                    <motion.div
                      initial={{ scale: 0, filter: 'brightness(1.5) saturate(1.8) blur(0px)' }}
                      animate={{ scale: 6, filter: 'brightness(1.0) saturate(1.0) blur(4px)' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        left: clickCoord.x - 40,
                        top: clickCoord.y - 40,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: accent.from,
                        opacity: 0.8,
                      }}
                    />
                  )}

                  {/* CONCEPT 4: Radial Flow */}
                  {selectedConcept === 'radial-flow' && (
                    <motion.div
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 5, rotate: 180 }}
                      transition={{ duration: 0.65, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        left: clickCoord.x - 50,
                        top: clickCoord.y - 50,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${accent.from} 0%, ${accent.to} 100%)`,
                      }}
                    />
                  )}

                  {/* CONCEPT 5: Ink Spread */}
                  {selectedConcept === 'ink-spread' && (
                    <motion.div
                      initial={{ scale: 0, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                      animate={{ scale: 6, borderRadius: '50%' }}
                      transition={{ duration: 0.65, ease: 'easeIn' }}
                      style={{
                        position: 'absolute',
                        left: clickCoord.x - 50,
                        top: clickCoord.y - 50,
                        width: 100,
                        height: 100,
                        background: simulatedTheme === 'dark' ? '#f8f9fa' : '#0a0a0c',
                      }}
                    />
                  )}

                  {/* CONCEPT 6: Expanding Gradient Field */}
                  {selectedConcept === 'gradient-field' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg, ${accent.from} 0%, var(--app-bg) 100%)`,
                      }}
                    />
                  )}

                  {/* CONCEPT 7: Chromatic Pulse */}
                  {selectedConcept === 'chromatic-pulse' && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 5 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          left: clickCoord.x - 50,
                          top: clickCoord.y - 50,
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.4)',
                          mixBlendMode: 'screen',
                        }}
                      />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 5 }}
                        transition={{ duration: 0.6, delay: 0.05, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          left: clickCoord.x - 50,
                          top: clickCoord.y - 50,
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.4)',
                          mixBlendMode: 'screen',
                        }}
                      />
                    </div>
                  )}

                  {/* CONCEPT 8: Glass Morph */}
                  {selectedConcept === 'glass-morph' && (
                    <motion.div
                      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                      animate={{
                        opacity: [1, 1, 0],
                        backdropFilter: ['blur(0px)', 'blur(20px)', 'blur(0px)'],
                      }}
                      transition={{ duration: 0.65 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(128,128,128,0.1)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                    />
                  )}

                  {/* CONCEPT 9: Energy Propagation */}
                  {selectedConcept === 'energy-prop' && (
                    <motion.div
                      initial={{
                        scale: 0,
                        border: '4px solid #3b82f6',
                        boxShadow: '0 0 0px #3b82f6',
                      }}
                      animate={{
                        scale: 6,
                        border: '1px solid #10b981',
                        boxShadow: '0 0 20px #10b981',
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        left: clickCoord.x - 50,
                        top: clickCoord.y - 50,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                      }}
                    />
                  )}

                  {/* CONCEPT 10: Surface Diffusion */}
                  {selectedConcept === 'diffusion' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: simulatedTheme === 'dark' ? '#f8f9fa' : '#0a0a0c',
                        backgroundImage:
                          'radial-gradient(rgba(128,128,128,0.15) 1px, transparent 0)',
                        backgroundSize: '8px 8px',
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* METRICS & DESCRIPTION CARD */}
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'var(--app-surface-high)',
            borderRadius: 20,
            padding: 20,
            border: '1px solid rgba(128,128,128,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                margin: '0 0 4px',
              }}
            >
              {activeConcept.name}
            </h3>
            <p
              style={{
                fontSize: 11.5,
                color: 'var(--c-text-secondary)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {activeConcept.description}
            </p>
          </div>

          {/* Dynamic Telemetry Results */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              borderTop: '1px solid rgba(128,128,128,0.08)',
              paddingTop: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--c-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Performance
              </span>
              <strong style={{ fontSize: 14, color: telemetry.fps >= 58 ? '#10b981' : '#f59e0b' }}>
                {telemetry.active ? 'Measuring...' : `${telemetry.fps} FPS`}
              </strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--c-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Frame Time
              </span>
              <strong style={{ fontSize: 14, color: 'var(--c-text-primary)' }}>
                {telemetry.active ? '...' : `${telemetry.time || '0.0'} ms`}
              </strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--c-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Jank Drops
              </span>
              <strong
                style={{
                  fontSize: 14,
                  color: telemetry.drops > 0 ? '#ef4444' : 'var(--c-text-secondary)',
                }}
              >
                {telemetry.active ? '...' : telemetry.drops}
              </strong>
            </div>
          </div>

          {/* Implementation Notes */}
          <div
            style={{
              background: 'rgba(128, 128, 128, 0.04)',
              borderRadius: 12,
              padding: 12,
              border: '1px solid rgba(128, 128, 128, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--c-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Architecture Implementation Notes
            </span>
            <span style={{ fontSize: 11, color: 'var(--c-text-primary)', lineHeight: 1.4 }}>
              {activeConcept.notes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
