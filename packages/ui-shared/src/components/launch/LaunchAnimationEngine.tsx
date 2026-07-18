import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

// Studio Sine Wave Logo SVG path
export const StudioSinePath = "M 72 256 C 128 60 192 60 256 256 S 384 452 440 256";

export type LaunchPreset = 'fluid_surface' | 'liquid_glass' | 'ripple_reveal' | 'layer_expansion' | 'aurora_reveal';

interface LaunchAnimationEngineProps {
  preset: LaunchPreset;
  onComplete?: () => void;
  isLight?: boolean;
  isAmoled?: boolean;
  loopMode?: boolean;
  scaleFactor?: number; // for side-by-side comparison scaling
  skipIntro?: boolean;  // skip drawing logo (directly start zoom-in reveal)
}

export function LaunchAnimationEngine({
  preset,
  onComplete,
  isLight = false,
  isAmoled = false,
  loopMode = false,
  scaleFactor = 1,
  skipIntro = false,
}: LaunchAnimationEngineProps) {
  const [stage, setStage] = useState<'logo' | 'reveal' | 'complete'>(skipIntro ? 'reveal' : 'logo');
  const [key, setKey] = useState(0); // to restart on loop

  // Telemetry frame tracking
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number>(0);
  
  useEffect(() => {
    // Dismiss the index.html vanilla splash only after React has mounted and drawn the initial overlay frame
    const intro = document.getElementById('intro');
    if (intro) {
      intro.style.display = 'none';
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      (window as any).__introDone = true;
      window.dispatchEvent(new Event('studio-intro-done'));
    }
  }, []);

  useEffect(() => {
    if (!skipIntro) {
      setStage('logo');
    }
    lastTime.current = performance.now();
    let frameId: number;
    
    const trackFrame = (time: number) => {
      if (lastTime.current > 0) {
        const delta = time - lastTime.current;
        frameTimes.current.push(delta);
        if (frameTimes.current.length > 300) frameTimes.current.shift();
      }
      lastTime.current = time;
      frameId = requestAnimationFrame(trackFrame);
    };
    
    frameId = requestAnimationFrame(trackFrame);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [key, preset, skipIntro]);

  // Handle stage timers based on selected preset
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    if (stage === 'logo') {
      // Step 1: Materialize logo
      t1 = setTimeout(() => {
        setStage('reveal');
      }, 700);
    } else if (stage === 'reveal') {
      const checkReadyAndComplete = () => {
        // Only block/extend for fluid_surface (the production launch preset)
        if (preset === 'fluid_surface' && !loopMode) {
          const isHubReady = (window as any).__studioHubReady;
          if (!isHubReady) {
            // Check again in 100ms
            t2 = setTimeout(checkReadyAndComplete, 100);
            return;
          }
        }
        
        if (loopMode) {
          setKey(prev => prev + 1);
        } else {
          setStage('complete');
          if (onComplete) onComplete();
        }
      };

      const baseRevealDuration = preset === 'layer_expansion' ? 800 : preset === 'aurora_reveal' ? 1000 : 750;
      t2 = setTimeout(checkReadyAndComplete, baseRevealDuration);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stage, preset, loopMode, onComplete]);

  // Color variables based on theme
  const bgColor = isAmoled 
    ? '#000000' 
    : isLight 
      ? '#f8f9fa' 
      : '#0a0a0c';

  const logoColor = isLight ? '#0f172a' : '#ffffff';
  
  // Spring configurations
  const logoSpring = { type: 'spring' as const, stiffness: 380, damping: 26 };
  const expansionSpring = { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.8 };

  // Render presets
  const renderContent = () => {
    switch (preset) {
      case 'fluid_surface':
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stage === 'reveal' && (
              <motion.div
                initial={{ scale: 0.1, opacity: 0.8 }}
                animate={{ scale: 28, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: isLight 
                    ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(103,156,255,0.4) 60%, rgba(103,156,255,0) 100%)'
                    : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(103,156,255,0.4) 60%, rgba(103,156,255,0) 100%)',
                  zIndex: 2,
                }}
              />
            )}
            
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={stage === 'logo' ? { opacity: 1, scale: 1 } : { scale: 45, opacity: 0 }}
              transition={stage === 'logo' ? logoSpring : { duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
              style={{ zIndex: 3 }}
            >
              <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
                <motion.path
                  d={StudioSinePath}
                  stroke={logoColor}
                  strokeWidth={44}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: skipIntro ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: skipIntro ? 0 : 0.6, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
          </div>
        );

      case 'liquid_glass':
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stage === 'reveal' && (
              <motion.div
                initial={{ 
                  scale: 0.8, 
                  borderRadius: "50% 50% 50% 50%", 
                  opacity: 0.9 
                }}
                animate={{ 
                  scale: 25, 
                  borderRadius: ["40% 60% 40% 60% / 40% 40% 60% 60%", "60% 40% 60% 40% / 50% 60% 40% 50%", "50% 50% 50% 50%"],
                  opacity: 0 
                }}
                transition={{ duration: 0.75, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  background: isLight 
                    ? 'rgba(255, 255, 255, 0.35)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: `2px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)'}`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 2,
                }}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={stage === 'logo' 
                ? { 
                    opacity: 1, 
                    scale: [0.7, 1.05, 1],
                  } 
                : { 
                    scale: 0.5,
                    opacity: 0 
                  }
              }
              transition={logoSpring}
              style={{ zIndex: 3 }}
            >
              <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
                <path
                  d={StudioSinePath}
                  stroke={logoColor}
                  strokeWidth={44}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        );

      case 'ripple_reveal':
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {stage === 'reveal' && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 12, opacity: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: i * 0.12, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    style={{
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      border: `1.5px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
                      background: isLight 
                        ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
                      zIndex: 2,
                    }}
                  />
                ))}
              </>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={stage === 'logo' ? { opacity: 1, scale: 1 } : { scale: 0.85, opacity: 0 }}
              transition={expansionSpring}
              style={{ zIndex: 3 }}
            >
              <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
                <path
                  d={StudioSinePath}
                  stroke={logoColor}
                  strokeWidth={44}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        );

      case 'layer_expansion':
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stage === 'reveal' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'space-between', zIndex: 2 }}>
                {/* Mock Top bar card block */}
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.8 }}
                  transition={expansionSpring}
                  style={{
                    height: 56,
                    borderRadius: 28,
                    background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                />

                {/* Mock Central Cards Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, margin: '32px 0' }}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ ...expansionSpring, delay: 0.05 }}
                    style={{
                      flex: 1,
                      borderRadius: 24,
                      background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ ...expansionSpring, delay: 0.1 }}
                    style={{
                      height: 120,
                      borderRadius: 24,
                      background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  />
                </div>

                {/* Mock Bottom navigation pill */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.8 }}
                  transition={{ ...expansionSpring, delay: 0.15 }}
                  style={{
                    height: 60,
                    width: '80%',
                    margin: '0 auto',
                    borderRadius: 30,
                    background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={stage === 'logo' ? { opacity: 1, scale: 1 } : { scale: 0.9, opacity: 0 }}
              transition={logoSpring}
              style={{ zIndex: 3 }}
            >
              <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
                <path
                  d={StudioSinePath}
                  stroke={logoColor}
                  strokeWidth={44}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        );

      case 'aurora_reveal':
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {stage === 'reveal' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0.45, 0] }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(at 0% 0%, #679cff 0px, transparent 50%), radial-gradient(at 100% 0%, #a78bfa 0px, transparent 50%), radial-gradient(at 100% 100%, #fb923c 0px, transparent 50%), radial-gradient(at 0% 100%, #679cff 0px, transparent 50%)',
                  filter: 'blur(40px)',
                  mixBlendMode: 'screen',
                  zIndex: 1,
                }}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={stage === 'logo' ? { opacity: 1, scale: 1 } : { scale: 1.1, opacity: 0 }}
              transition={logoSpring}
              style={{ zIndex: 3 }}
            >
              <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
                <path
                  d={StudioSinePath}
                  stroke={logoColor}
                  strokeWidth={44}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  // Smoothly dissolve the background overlay when revealing the Hub
  const containerAnimate = stage === 'logo'
    ? { backgroundColor: bgColor, opacity: 1 }
    : { backgroundColor: 'rgba(0,0,0,0)', opacity: 0 };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 1 }}
      animate={containerAnimate}
      transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: stage === 'complete' ? 'none' : 'auto',
      }}
    >
      {renderContent()}
    </motion.div>
  );
}
