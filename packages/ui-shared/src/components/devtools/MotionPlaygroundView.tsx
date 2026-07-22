import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TransitionConcept {
  id: string;
  name: string;
  description: string;
  notes: string;
}

const CONCEPTS: TransitionConcept[] = [
  {
    id: 'material-shared-axis',
    name: 'Material Shared Axis',
    description: 'A smooth sliding transition matching Material Design 3 guidelines along X, Y, or Z axes with clean opacity crossfades.',
    notes: 'Leverages GPU-accelerated translate3d and opacity transitions. Low memory usage and zero layout reflow overhead.'
  },
  {
    id: 'premium-spring-slide',
    name: 'Premium Spring Slide',
    description: 'A snappy, physical-based spring slide with overshoot damping that matches natural physical mass.',
    notes: 'Uses custom fast-spring physics (stiffness: 450, damping: 32, mass: 0.8) for immediate tactile response.'
  },
  {
    id: 'elastic-morph',
    name: 'Elastic Morph',
    description: 'An organic elastic morphing container transition where panels fluidly scale and bounce into position.',
    notes: 'Combines dynamic scale and border-radius interpolation with spring damping. Feels bouncy and alive.'
  },
  {
    id: 'floating-depth',
    name: 'Floating Depth',
    description: 'A layered depth transition where the outgoing screen recedes into the background and the incoming screen floats over it.',
    notes: 'Utilizes 3D perspective, scale shifts, and card shadows to create hierarchical depth.'
  },
  {
    id: 'liquid-flow',
    name: 'Liquid Flow',
    description: 'A gorgeous, organic liquid transition utilizing fluid cubic beziers and smooth sliding clipping waves.',
    notes: 'Combines clip-path radial sweep animations with hardware-accelerated SVG compositing.'
  }
];

interface MotionPlaygroundViewProps {
  accent: { from: string; to: string };
  onBack: () => void;
}

export default function MotionPlaygroundView({ accent, onBack }: MotionPlaygroundViewProps) {
  const [selectedConcept, setSelectedConcept] = useState<string>('material-shared-axis');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickCoord, setClickCoord] = useState({ x: 120, y: 200 });

  // Simulator States
  const [simulatedPage, setSimulatedPage] = useState<'home' | 'details'>('home');
  const [simulatedTab, setSimulatedTab] = useState<'home' | 'profile' | 'settings'>('home');
  const [simulatedApp, setSimulatedApp] = useState<'hub' | 'chordex' | 'drumex'>('hub');
  const [simulatedPanelOpen, setSimulatedPanelOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'forward' | 'backward' | 'tab' | 'app' | 'panel'>('forward');

  // Animation directions
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [tabDirection, setTabDirection] = useState<'left' | 'right'>('right');
  const [appDirection, setAppDirection] = useState<'left' | 'right'>('right');

  // Measured Telemetry
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    drops: 0,
    time: 0,
    active: false,
  });

  const transitionFrameRef = useRef<number | null>(null);

  const activeConcept = useMemo(() => {
    return CONCEPTS.find((c) => c.id === selectedConcept) || CONCEPTS[0];
  }, [selectedConcept]);

  const runTelemetry = (durationMs: number = 320) => {
    setIsTransitioning(true);
    setTelemetry((prev) => ({ ...prev, active: true, time: 0, drops: 0, fps: 60 }));

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

      if (elapsed < durationMs) {
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
      }
    };

    transitionFrameRef.current = requestAnimationFrame(measureFrame);
  };

  const handleForwardClick = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    captureCoords(e);
    setActiveAction('forward');
    setDirection('forward');
    setSimulatedPage('details');
    runTelemetry(350);
  };

  const handleBackwardClick = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    captureCoords(e);
    setActiveAction('backward');
    setDirection('backward');
    setSimulatedPage('home');
    runTelemetry(350);
  };

  const handleTabClick = (e: React.MouseEvent, tab: 'home' | 'profile' | 'settings') => {
    if (isTransitioning || tab === simulatedTab) return;
    captureCoords(e);
    setActiveAction('tab');
    const tabs: ('home' | 'profile' | 'settings')[] = ['home', 'profile', 'settings'];
    const oldIdx = tabs.indexOf(simulatedTab);
    const newIdx = tabs.indexOf(tab);
    setTabDirection(newIdx > oldIdx ? 'right' : 'left');
    setSimulatedTab(tab);
    runTelemetry(280);
  };

  const handleAppClick = (e: React.MouseEvent, app: 'hub' | 'chordex' | 'drumex') => {
    if (isTransitioning || app === simulatedApp) return;
    captureCoords(e);
    setActiveAction('app');
    const apps: ('hub' | 'chordex' | 'drumex')[] = ['hub', 'chordex', 'drumex'];
    const oldIdx = apps.indexOf(simulatedApp);
    const newIdx = apps.indexOf(app);
    setAppDirection(newIdx > oldIdx ? 'right' : 'left');
    setSimulatedApp(app);
    runTelemetry(300);
  };

  const handlePanelToggle = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    captureCoords(e);
    setActiveAction('panel');
    setSimulatedPanelOpen((prev) => !prev);
    runTelemetry(320);
  };

  const captureCoords = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = document.getElementById('simulated-phone-viewport');
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      setClickCoord({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (transitionFrameRef.current) {
        cancelAnimationFrame(transitionFrameRef.current);
      }
    };
  }, []);

  // Preset physics configuration
  const springTransition = useMemo(() => {
    if (selectedConcept === 'premium-spring-slide') {
      return { type: 'spring' as const, stiffness: 450, damping: 32, mass: 0.8 };
    }
    if (selectedConcept === 'elastic-morph') {
      return { type: 'spring' as const, stiffness: 500, damping: 20, mass: 0.6 };
    }
    if (selectedConcept === 'floating-depth') {
      return { type: 'spring' as const, stiffness: 260, damping: 26 };
    }
    return { type: 'spring' as const, stiffness: 300, damping: 28 };
  }, [selectedConcept]);

  const cssTransition = useMemo(() => {
    return { duration: 0.5, ease: [0.25, 1, 0.5, 1] }; // For Liquid Flow
  }, []);

  const activeTransition = selectedConcept === 'liquid-flow' ? cssTransition : springTransition;

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
              Motion Playground
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
        {/* SELECT PRESET */}
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
            Select Transition Preset
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
          {/* Phone Viewport Simulator */}
          <div
            id="simulated-phone-viewport"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 260,
              aspectRatio: '9/16',
              borderRadius: 36,
              border: '8px solid #1a1a20',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              background: '#0a0a0c',
              color: '#ffffff',
            }}
          >
            {/* Top App Bar Switcher */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'rgba(12, 12, 14, 0.85)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 8px',
              }}
            >
              {(['hub', 'chordex', 'drumex'] as const).map((app) => (
                <button
                  key={app}
                  onClick={(e) => handleAppClick(e, app)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: simulatedApp === app ? accent.from : 'rgba(255,255,255,0.5)',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    transition: 'all 200ms ease',
                  }}
                >
                  {app === 'hub' ? 'Hub' : app === 'chordex' ? 'Chords' : 'Drums'}
                </button>
              ))}
            </div>

            {/* Inner Content Animator */}
            <div style={{ width: '100%', height: '100%', paddingTop: '40px', paddingBottom: '50px', position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence initial={false} mode={selectedConcept === 'floating-depth' ? 'popLayout' : 'wait'}>
                {/* Simulated Screen */}
                <motion.div
                  key={`${simulatedApp}-${simulatedTab}-${simulatedPage}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    background: simulatedApp === 'chordex' ? 'rgba(30,15,45,0.95)' : simulatedApp === 'drumex' ? 'rgba(45,15,35,0.95)' : '#0d0d11',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                  initial={
                    selectedConcept === 'liquid-flow'
                      ? { clipPath: 'circle(0% at 50% 50%)', opacity: 1 }
                      : selectedConcept === 'floating-depth'
                        ? (activeAction === 'backward' ? { scale: 0.9, opacity: 0.6 } : { y: '100%', opacity: 1 })
                        : selectedConcept === 'elastic-morph'
                          ? { scale: 0.8, opacity: 0, borderRadius: '48px' }
                          : selectedConcept === 'premium-spring-slide'
                            ? { x: activeAction === 'forward' ? '100%' : '-100%', opacity: 1 }
                            : { opacity: 0, x: activeAction === 'forward' ? 30 : -30, scale: 0.96 } // Material Shared Axis
                  }
                  animate={
                    selectedConcept === 'liquid-flow'
                      ? { clipPath: 'circle(150% at 50% 50%)', opacity: 1 }
                      : { y: 0, x: 0, scale: 1, opacity: 1, borderRadius: '0px' }
                  }
                  exit={
                    selectedConcept === 'liquid-flow'
                      ? { opacity: 0 }
                      : selectedConcept === 'floating-depth'
                        ? (activeAction === 'forward' ? { scale: 0.9, opacity: 0.6 } : { y: '100%', opacity: 0 })
                        : selectedConcept === 'elastic-morph'
                          ? { scale: 1.2, opacity: 0, borderRadius: '48px' }
                          : selectedConcept === 'premium-spring-slide'
                            ? { x: activeAction === 'forward' ? '-100%' : '100%', opacity: 1 }
                            : { opacity: 0, x: activeAction === 'forward' ? -30 : 30, scale: 0.96 } // Material Shared Axis
                  }
                  transition={activeTransition}
                >
                  {simulatedPage === 'home' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>
                          {simulatedApp} &bull; {simulatedTab}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 2px' }}>Studio workspace</h4>
                      </div>

                      {/* Forward Action trigger */}
                      <button
                        onClick={handleForwardClick}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 14,
                          padding: 10,
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: '#fff',
                          outline: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>Push detail screen</div>
                          <div style={{ fontSize: 9, opacity: 0.5 }}>Simulates Forward Transition</div>
                        </div>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: accent.from }}>
                          chevron_right
                        </span>
                      </button>

                      {/* Panel Action trigger */}
                      <button
                        onClick={handlePanelToggle}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 14,
                          padding: 10,
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: '#fff',
                          outline: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>Toggle Slide Panel</div>
                          <div style={{ fontSize: 9, opacity: 0.5 }}>Simulates bottom sheet modal</div>
                        </div>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: accent.from }}>
                          keyboard_double_arrow_up
                        </span>
                      </button>

                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 14,
                          padding: 10,
                          flex: 1,
                          fontSize: 9,
                          opacity: 0.6,
                        }}
                      >
                        Interactive simulation playground. Tap tabs, switch apps, or trigger actions to observe custom physics.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <button
                          onClick={handleBackwardClick}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Detail View</span>
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.7, padding: '4px 0' }}>
                        This screen simulates a sub-page or deep panel context.
                      </div>
                      <div
                        style={{
                          height: 80,
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}22)`,
                          border: `1px dashed ${accent.from}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, color: accent.from }}>GPU Composite Layer</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Simulated Panel (Bottom Sheet overlay) */}
              <AnimatePresence>
                {simulatedPanelOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      onClick={handlePanelToggle}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#000',
                        zIndex: 45,
                      }}
                    />
                    <motion.div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background: '#141418',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px 20px 0 0',
                        zIndex: 50,
                        padding: 14,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transformOrigin: 'bottom center',
                      }}
                      initial={
                        selectedConcept === 'liquid-flow'
                          ? { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)' }
                          : selectedConcept === 'elastic-morph'
                            ? { scaleY: 0, opacity: 0 }
                            : { y: '100%' }
                      }
                      animate={
                        selectedConcept === 'liquid-flow'
                          ? { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' }
                          : selectedConcept === 'elastic-morph'
                            ? { scaleY: 1, opacity: 1 }
                            : { y: 0 }
                      }
                      exit={
                        selectedConcept === 'liquid-flow'
                          ? { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)' }
                          : selectedConcept === 'elastic-morph'
                            ? { scaleY: 0, opacity: 0 }
                            : { y: '100%' }
                      }
                      transition={activeTransition}
                    >
                      <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800 }}>Slide Panel Title</span>
                        <button
                          onClick={handlePanelToggle}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }}
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        Configured as a spring-driven sheets container. Simulates panel overlay behavior.
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Tab Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50px',
                background: 'rgba(12, 12, 14, 0.9)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
              }}
            >
              {([
                { key: 'home', icon: 'home' },
                { key: 'profile', icon: 'person' },
                { key: 'settings', icon: 'settings' }
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={(e) => handleTabClick(e, tab.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: simulatedTab === tab.key ? accent.from : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '4px',
                    outline: 'none',
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                </button>
              ))}
            </div>
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
