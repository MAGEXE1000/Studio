import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { StartupCoordinator } from '@workspace/studio-core';
import { triggerIntroReveal } from '../typography/StudioTitleReveal';

// Studio Sine Wave Logo SVG path
export const StudioSinePath = 'M 72 256 C 128 60 192 60 256 256 S 384 452 440 256';

export type LaunchPreset =
  'fluid_surface' | 'liquid_glass' | 'ripple_reveal' | 'layer_expansion' | 'aurora_reveal';

interface LaunchAnimationEngineProps {
  preset?: LaunchPreset;
  onComplete?: () => void;
  isLight?: boolean;
  isAmoled?: boolean;
  loopMode?: boolean;
  scaleFactor?: number;
  skipIntro?: boolean;
}

export function LaunchAnimationEngine({
  onComplete,
  isLight = false,
  isAmoled = false,
  loopMode = false,
  scaleFactor = 1,
  skipIntro = false,
}: LaunchAnimationEngineProps) {
  const [stage, setStage] = useState<'logo' | 'reveal' | 'complete'>(skipIntro ? 'reveal' : 'logo');
  const [canStartReveal, setCanStartReveal] = useState(skipIntro || loopMode);
  const [key, setKey] = useState(0);

  // Telemetry frame tracking
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    // Dismiss the index.html splash overlay only after React has mounted and drawn the initial overlay frame
    const intro = document.getElementById('intro');
    console.log(`[STARTUP-TRACE] LaunchAnimationEngine: mount effect, #intro exists=${!!intro}`);
    if (intro) {
      intro.style.display = 'none';
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      triggerIntroReveal();
      console.log(
        `[STARTUP-TRACE] LaunchAnimationEngine: triggered intro reveal at ${performance.now().toFixed(0)}ms`
      );
    }
  }, []);

  useEffect(() => {
    if (!skipIntro) {
      setStage('logo');
      setCanStartReveal(loopMode);
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
  }, [key, skipIntro, loopMode]);

  // Phase timers and paint state event-driven checks
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    console.log(
      `[STARTUP-TRACE] LaunchAnimationEngine: stage effect, stage=${stage}, canStartReveal=${canStartReveal}`
    );

    if (stage === 'logo') {
      // Step 1: Materialize logo path drawing (700ms)
      t1 = setTimeout(() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: logo->reveal transition at ${performance.now().toFixed(0)}ms`
        );
        setStage('reveal');
      }, 700);
    } else if (stage === 'reveal') {
      // Step 2: Wait for Hub to mount and paint 2 requestAnimationFrames to prevent flashes
      const isComplete =
        loopMode ||
        (typeof window !== 'undefined' &&
          ((window as any).__studioStartupComplete ||
            !!document.querySelector('[data-livex-hub-root="true"]') ||
            !!document.getElementById('hub-root')));
      if (isComplete) {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: startup complete or Hub DOM present, setting canStartReveal`
        );
        setCanStartReveal(true);
      } else {
        const unsub = StartupCoordinator.subscribeStartupComplete(() => {
          setCanStartReveal(true);
        });

        // Fail-safe watchdog fallback to guarantee transition out even if event is missed
        const fallbackTimer = setTimeout(() => {
          setCanStartReveal(true);
        }, 2000);

        return () => {
          unsub();
          clearTimeout(fallbackTimer);
        };
      }
    }

    return () => {
      clearTimeout(t1);
    };
  }, [stage, loopMode]);

  // Color variables based on theme
  const bgColor = isAmoled ? '#000000' : isLight ? '#f8f9fa' : '#0a0a0c';

  const logoColor = isLight ? '#0f172a' : '#ffffff';

  // Spring and zoom timing configurations
  const logoSpring = { type: 'spring' as const, stiffness: 380, damping: 26 };

  // Smoothly dissolve the background overlay when revealing the Hub
  const containerAnimate = !canStartReveal
    ? { backgroundColor: bgColor, opacity: 1 }
    : { backgroundColor: 'rgba(0,0,0,0)', opacity: [1, 1, 0] };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 1, backgroundColor: bgColor }}
      animate={containerAnimate}
      transition={{ duration: 0.95, ease: [0.6, 0.01, 0.05, 0.95] }}
      onAnimationComplete={() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: onAnimationComplete, canStartReveal=${canStartReveal}, stage=${stage}`
        );
        if (canStartReveal && stage === 'reveal') {
          if (loopMode) {
            setKey((prev) => prev + 1);
          } else {
            setStage('complete');
            console.log(
              `[STARTUP-TRACE] LaunchAnimationEngine: calling onComplete(), stage->complete at ${performance.now().toFixed(0)}ms`
            );
            if (onComplete) onComplete();
          }
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        backgroundColor: bgColor,
        pointerEvents: stage === 'complete' ? 'none' : 'auto',
        // GPU Promotion styles for native screen refresh rate (90Hz / 120Hz)
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={!canStartReveal ? { opacity: 1, scale: 1 } : { scale: 120, opacity: [1, 1, 0] }}
          transition={
            !canStartReveal ? logoSpring : { duration: 0.95, ease: [0.6, 0.01, 0.05, 0.95] }
          }
          style={{
            zIndex: 3,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
          }}
        >
          <svg width={96 * scaleFactor} height={96 * scaleFactor} viewBox="0 0 512 512" fill="none">
            <motion.path
              d={StudioSinePath}
              stroke={logoColor}
              strokeWidth={44}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: skipIntro ? 1 : 0 }}
              animate={
                !canStartReveal
                  ? { pathLength: 1, strokeWidth: 44 }
                  : { pathLength: 1, strokeWidth: 10 }
              }
              transition={
                !canStartReveal
                  ? { duration: skipIntro ? 0 : 0.6, ease: 'easeOut' }
                  : { duration: 0.95, ease: [0.6, 0.01, 0.05, 0.95] }
              }
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
