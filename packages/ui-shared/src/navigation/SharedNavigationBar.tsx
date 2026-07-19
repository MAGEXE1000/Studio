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
  const N = currentItems.length;

  // Dynamic screen width monitoring for robust responsiveness
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 360);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showSwitcherButton = currentApp !== 'hub';
  const switcherButtonWidth = showSwitcherButton ? 54 : 0; // 46px switcher + 8px gap
  const maxAvailableWidth = windowWidth - 32 - switcherButtonWidth;
  const barWidth = Math.min(330, maxAvailableWidth);

  const paddingX = 4;
  const insetX = 6;
  const usableWidth = barWidth - paddingX * 2;
  const itemWidth = usableWidth / N;
  const pillWidth = itemWidth - insetX * 2;

  // Mathematically perfect centering (relative to wrapper div, no paddingX offset!)
  const getCenterX = useCallback((index: number) => {
    return (index + 0.5) * itemWidth;
  }, [itemWidth]);

  const activeIndex = useMemo(() => {
    const idx = currentItems.findIndex(item => {
      return isSwitcherOpen ? (item.key === currentApp) : item.isActive;
    });
    return idx >= 0 ? idx : 0;
  }, [currentItems, currentApp, isSwitcherOpen]);

  const pillX = useMotionValue(getCenterX(activeIndex));
  const pillSkewX = useMotionValue(0);
  const pressureOffset = useMotionValue(0);

  const pillPathD = useTransform(
    [pillSkewX, pressureOffset] as const,
    ([skewVal, pressVal]) => {
      const tailAmount = (skewVal as number) * 1.2;
      const press = pressVal as number;
      
      const H = 38;
      const R = 19;
      
      let leftX = (tailAmount < 0 ? tailAmount : 0) + press;
      let rightX = pillWidth + (tailAmount > 0 ? tailAmount : 0) - press;
      
      // Enforce minimum width to prevent collapsing into a vertical lemon shape
      const currentWidth = rightX - leftX;
      if (currentWidth < H) {
        const delta = (H - currentWidth) / 2;
        leftX -= delta;
        rightX += delta;
      }
      
      const leftR = tailAmount > 0 ? Math.max(12, R - tailAmount * 0.25) : R;
      const rightR = tailAmount < 0 ? Math.max(12, R + tailAmount * 0.25) : R;
      
      return `M ${leftX + leftR} 0
              L ${rightX - rightR} 0
              A ${rightR} ${R} 0 0 1 ${rightX} ${R}
              A ${rightR} ${R} 0 0 1 ${rightX - rightR} ${H}
              L ${leftX + leftR} ${H}
              A ${leftR} ${R} 0 0 1 ${leftX} ${R}
              A ${leftR} ${R} 0 0 1 ${leftX + leftR} 0
              Z`;
    }
  );

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

    animate(pressureOffset, 4, { type: 'spring', stiffness: 500, damping: 25 });

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
      
      const skew = Math.max(-10, Math.min(10, velocity * 3.5));
      pillSkewX.set(skew);

      const progress = relativeX / usableWidth;
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

    animate(pillSkewX, 0, { type: 'spring', stiffness: 400, damping: 20 });
    animate(pressureOffset, 0, { type: 'spring', stiffness: 400, damping: 20 });

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
      const progress = relativeX / usableWidth;
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

    animate(pillSkewX, 0, { type: 'spring', stiffness: 400, damping: 20 });
    animate(pressureOffset, 0, { type: 'spring', stiffness: 400, damping: 20 });

    isScrubbingRef.current = false;
    setIsScrubbing(false);

    animate(pillX, getCenterX(activeIndex), {
      type: 'spring',
      stiffness: 380,
      damping: 22,
      mass: 0.5
    });
  };

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
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ 
            display: 'flex', 
            width: '100%', 
            height: '100%', 
            alignItems: 'center', 
            position: 'relative',
            touchAction: 'none'
          }}
        >
          {/* Floating interactive liquid capsule indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: '2px',
              height: '38px',
              width: `${pillWidth + 40}px`,
              x: useTransform(pillX, val => val - pillWidth / 2 - 20),
              skewX: pillSkewXTrans,
              transformOrigin: 'center center',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`-20 0 ${pillWidth + 40} 38`}
              style={{ overflow: 'visible' }}
            >
              <motion.path
                d={pillPathD}
                fill="rgba(255, 255, 255, 0.16)"
              />
            </svg>
          </motion.div>

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
