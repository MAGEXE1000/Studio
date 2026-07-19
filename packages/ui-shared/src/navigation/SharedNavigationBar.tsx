import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { 
  useNavScrollOffset,
  useChordStore,
  useNavigationStore,
  NavigationDispatcher
} from '@workspace/studio-core';
import { 
  StudioLogo, 
  ChordexLogo, 
  DrumexLogo, 
  StagexLogoIcon, 
  GroovexLogo, 
  VocalexLogo 
} from '../components/icons/ChordexLogo';

function useStartupComplete() {
  const [complete, setComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !!(window as any).__studioStartupComplete;
  });

  useEffect(() => {
    if (complete) return;
    
    const check = () => {
      if ((window as any).__studioStartupComplete) {
        setComplete(true);
        clearInterval(interval);
      }
    };

    const interval = setInterval(check, 100);
    window.addEventListener('studio-launch-complete', check);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('studio-launch-complete', check);
    };
  }, [complete]);

  return complete;
}

export interface SharedNavigationItem {
  key: string;
  icon: string | React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface SharedNavigationBarProps {
  items: SharedNavigationItem[];
  isLight?: boolean;
}

const NavigationItem = React.memo(({
  item,
  index,
  pillX,
  itemWidth,
  getCenterX,
  onClick,
  isActive
}: {
  item: any;
  index: number;
  pillX: any;
  itemWidth: number;
  getCenterX: (idx: number) => number;
  onClick: () => void;
  isActive: boolean;
}) => {
  const centerX = getCenterX(index);
  
  const scale = useTransform(
    pillX,
    [centerX - itemWidth * 1.2, centerX, centerX + itemWidth * 1.2],
    [1.0, 1.18, 1.0],
    { clamp: true }
  );

  const opacity = useTransform(
    pillX,
    [centerX - itemWidth * 1.2, centerX, centerX + itemWidth * 1.2],
    [0.55, 1.0, 0.55],
    { clamp: true }
  );

  const isIconString = typeof item.icon === 'string';

  return (
    <motion.button
      onClick={onClick}
      aria-label={item.label}
      title={item.label}
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 1,
        padding: '0 8px',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isIconString ? (
          <span
            className="material-symbols-outlined text-[20px]"
            style={{
              fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
              color: '#ffffff',
            }}
          >
            {item.icon}
          </span>
        ) : (
          <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.icon}
          </div>
        )}
      </motion.div>
    </motion.button>
  );
});

export function SharedNavigationBar({ items, isLight = false }: SharedNavigationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useNavScrollOffset();
  const startupComplete = useStartupComplete();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Slide down out of view progressively up to 100px (beyond viewport edge)
  const translateY = scrollOffset * 100;

  const currentRoute = useNavigationStore(s => s.history[s.history.length - 1]);
  const currentApp = currentRoute?.app ?? 'hub';

  const handleAppSwitch = (appKey: string) => {
    NavigationDispatcher.push({ app: appKey as any });
    useChordStore.getState().updateSettings({ appMode: appKey as any });
    setIsSwitcherOpen(false);
  };

  const switcherApps = useMemo(() => [
    { key: 'hub', label: 'Hub', icon: <StudioLogo size={18} />, onClick: () => handleAppSwitch('hub') },
    { key: 'chords', label: 'Chordex', icon: <ChordexLogo size={18} />, onClick: () => handleAppSwitch('chords') },
    { key: 'drums', label: 'Drumex', icon: <DrumexLogo size={18} />, onClick: () => handleAppSwitch('drums') },
    { key: 'stage', label: 'Stagex', icon: <StagexLogoIcon size={18} />, onClick: () => handleAppSwitch('stage') },
    { key: 'groovex', label: 'Groovex', icon: <GroovexLogo size={18} />, onClick: () => handleAppSwitch('groovex') },
    { key: 'vocalex', label: 'Vocalex', icon: <VocalexLogo size={18} />, onClick: () => handleAppSwitch('vocalex') },
  ], []);

  const currentItems = isSwitcherOpen ? switcherApps : items;

  // Gesture/Scrubbing properties
  const N = currentItems.length;
  const barWidth = 330;
  const paddingX = 4;
  const insetX = 6;
  const usableWidth = barWidth - paddingX * 2;
  const itemWidth = usableWidth / N;
  const pillWidth = itemWidth - insetX * 2;

  const getCenterX = useCallback((index: number) => {
    return paddingX + (index + 0.5) * itemWidth;
  }, [itemWidth]);

  const activeIndex = useMemo(() => {
    const idx = currentItems.findIndex(item => {
      return isSwitcherOpen ? (item.key === currentApp) : item.isActive;
    });
    return idx >= 0 ? idx : 0;
  }, [currentItems, currentApp, isSwitcherOpen]);

  const pillX = useMotionValue(getCenterX(activeIndex));
  const pillScaleX = useMotionValue(1);
  const pillSkewX = useMotionValue(0);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const scrubbingIndexRef = useRef(activeIndex);
  
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep pill positioned on active tab when activeIndex changes and not scrubbing
  useEffect(() => {
    if (!isScrubbingRef.current) {
      animate(pillX, getCenterX(activeIndex), {
        type: 'spring',
        stiffness: 380,
        damping: 22,
        mass: 0.5
      });
    }
  }, [activeIndex, getCenterX, pillX]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const minX = getCenterX(0);
    const maxX = getCenterX(N - 1);
    const clampedX = Math.max(minX, Math.min(maxX, relativeX));
    
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    isScrubbingRef.current = false;
    scrubbingIndexRef.current = activeIndex;

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      
      if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
        try { window.navigator.vibrate(15); } catch (err) {}
      }

      pillX.set(clampedX);
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const minX = getCenterX(0);
    const maxX = getCenterX(N - 1);
    const clampedX = Math.max(minX, Math.min(maxX, relativeX));
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const dx = e.clientX - lastXRef.current;
    
    const velocity = dt > 0 ? dx / dt : 0;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

    const dragDistance = Math.abs(e.clientX - startXRef.current);
    if (!isScrubbingRef.current && dragDistance > 10) {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      
      if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
        try { window.navigator.vibrate(8); } catch (err) {}
      }
    }

    if (isScrubbingRef.current) {
      pillX.set(clampedX);
      
      const stretch = 1 + Math.min(0.35, Math.abs(velocity) * 0.08);
      const skew = Math.max(-12, Math.min(12, velocity * 4));
      
      pillScaleX.set(stretch);
      pillSkewX.set(skew);

      const progress = (relativeX - paddingX) / usableWidth;
      const hoveredIndex = Math.max(0, Math.min(N - 1, Math.floor(progress * N)));
      
      if (hoveredIndex !== scrubbingIndexRef.current) {
        scrubbingIndexRef.current = hoveredIndex;
        if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
          try { window.navigator.vibrate(5); } catch (err) {}
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    animate(pillScaleX, 1, { type: 'spring', stiffness: 400, damping: 20 });
    animate(pillSkewX, 0, { type: 'spring', stiffness: 400, damping: 20 });

    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setIsScrubbing(false);
      
      const finalIndex = scrubbingIndexRef.current;
      const targetItem = currentItems[finalIndex];
      
      animate(pillX, getCenterX(finalIndex), {
        type: 'spring',
        stiffness: 380,
        damping: 22,
        mass: 0.5
      });

      if (targetItem && finalIndex !== activeIndex) {
        targetItem.onClick();
      }
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const progress = (relativeX - paddingX) / usableWidth;
      const clickIndex = Math.max(0, Math.min(N - 1, Math.floor(progress * N)));
      const clickedItem = currentItems[clickIndex];
      
      if (clickedItem) {
        clickedItem.onClick();
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    animate(pillScaleX, 1, { type: 'spring', stiffness: 400, damping: 20 });
    animate(pillSkewX, 0, { type: 'spring', stiffness: 400, damping: 20 });

    isScrubbingRef.current = false;
    setIsScrubbing(false);

    animate(pillX, getCenterX(activeIndex), {
      type: 'spring',
      stiffness: 380,
      damping: 22,
      mass: 0.5
    });
  };

  const pillXTrans = useTransform(pillX, val => val - pillWidth / 2);
  const pillSkewXTrans = useTransform(pillSkewX, val => `${val}deg`);

  return (
    <motion.div
      ref={containerRef}
      className="shared-bottom-nav-container"
      animate={{
        y: translateY,
        x: '-50%'
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 22,
        mass: 0.35
      }}
      style={{
        position: 'fixed',
        bottom: 'max(14px, env(safe-area-inset-bottom))',
        left: '50%',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="shared-bottom-nav"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          pointerEvents: 'auto',
          width: `${barWidth}px`,
          height: '46px',
          borderRadius: '9999px',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.60)',
          boxShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '2px 4px',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', position: 'relative' }}>
          {/* Floating interactive capsule indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              width: `${pillWidth}px`,
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.16)',
              zIndex: 0,
              x: pillXTrans,
              scaleX: pillScaleX,
              skewX: pillSkewXTrans,
              transformOrigin: 'center center',
              pointerEvents: 'none',
            }}
          />

          {currentItems.map((item, index) => {
            const isActive = isSwitcherOpen 
              ? (item.key === currentApp)
              : item.isActive;

            return (
              <NavigationItem
                key={item.key}
                item={item}
                index={index}
                pillX={pillX}
                itemWidth={itemWidth}
                getCenterX={getCenterX}
                onClick={item.onClick}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>

      {currentApp !== 'hub' && (
        <motion.button
          onClick={() => setIsSwitcherOpen(prev => !prev)}
          whileTap={{ scale: 0.9 }}
          style={{
            pointerEvents: 'auto',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.60)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSwitcherOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.60)',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSwitcherOpen ? 'close' : 'apps'}
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}
