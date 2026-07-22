import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useNavScrollOffset, useChordStore, useNavigationStore, NavigationDispatcher, useBottomNavigationStore, SpringPresets, useSettingsStore, APP_SECTIONS, useApplicationTransitionStore, useT } from '@workspace/studio-core';
import {
  StudioLogo,
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
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
  items?: SharedNavigationItem[];
  isLight?: boolean;
}

const NavigationItem = React.memo(
  ({
    item,
    index,
    pillX,
    itemWidth,
    getCenterX,
    onClick,
    isActive,
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
            <div
              style={{
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </div>
          )}
        </motion.div>
      </motion.button>
    );
  }
);

export function SharedNavigationBar({
  items: propsItems,
  isLight: propsIsLight,
}: SharedNavigationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useNavScrollOffset();
  const startupComplete = useStartupComplete();

  // Read centralized state from useBottomNavigationStore
  const storeItems = useBottomNavigationStore((s) => s.items);
  const storeIsLight = useBottomNavigationStore((s) => s.isLight);
  const storeVisible = useBottomNavigationStore((s) => s.visible);
  const storeCollapsed = useBottomNavigationStore((s) => s.collapsed);

  const isSwitcherOpen = useBottomNavigationStore((s) => s.isSwitcherOpen);
  const setIsSwitcherOpen = (open: boolean) =>
    useBottomNavigationStore.getState().setSwitcherOpen(open);

  const currentRoute = useNavigationStore((s) => s.history[s.history.length - 1]);
  const currentApp = currentRoute?.app ?? 'hub';
  const activeTab = currentRoute?.tab || currentRoute?.page || 'home';
  const activePage = currentRoute?.page || 'main';

  const transitionState = useApplicationTransitionStore((s) => s.state);
  const isTransitioning = transitionState !== 'IDLE';

  const t = useT();
  const getTranslation = useCallback((key: string) => {
    if (!t) return key;
    if (key === 'songs') return t.navigation?.songs || 'Songs';
    if (key === 'library') return t.navigation?.library || 'Library';
    if (key === 'settings') return t.navigation?.settings || 'Preferences';
    if (key === 'chords') return t.navigation?.chords || 'Chords';
    if (key === 'drumSongs') return t.navigation?.drumSongs || 'Songs';
    if (key === 'drumPatterns') return t.navigation?.drumPatterns || 'Patterns';
    if (key === 'drumPreferences') return t.navigation?.drumPreferences || 'Preferences';
    if (key === 'groovexLibrary') return t.navigation?.groovexLibrary || 'Library';
    if (key === 'groovexPreferences') return t.navigation?.groovexPreferences || 'Preferences';
    if (key === 'vocalexCoach') return t.navigation?.vocalexCoach || 'Coach';
    if (key === 'vocalexRecorder') return t.navigation?.vocalexRecorder || 'Recorder';
    if (key === 'vocalexTakes') return t.navigation?.vocalexTakes || 'Takes';
    if (key === 'vocalexPreferences') return t.navigation?.vocalexPreferences || 'Preferences';
    if (key === 'stagexStage') return t.navigation?.stagexStage || 'Stage';
    if (key === 'stagexSetup') return t.navigation?.stagexSetup || 'Setup';
    if (key === 'stagexPreferences') return t.navigation?.stagexPreferences || 'Preferences';
    return key;
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__navMetrics = (window as any).__navMetrics || {
        mounts: 0,
        unmounts: 0,
        fallbackActivations: 0,
        recoveries: 0,
        itemRebuilds: 0,
        controllerRecreations: 0,
      };
      (window as any).__navMetrics.mounts++;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__navMetrics.unmounts++;
      }
    };
  }, []);

  const lastAppRef = useRef<string | null>(null);

  // Compute navigation items synchronously from route history & registry definitions
  const computedItems = useMemo(() => {
    if (isTransitioning) {
      return [];
    }

    if (currentApp !== lastAppRef.current) {
      lastAppRef.current = currentApp;
      if (typeof window !== 'undefined') {
        (window as any).__navMetrics = (window as any).__navMetrics || {
          mounts: 0,
          unmounts: 0,
          fallbackActivations: 0,
          recoveries: 0,
          itemRebuilds: 0,
          controllerRecreations: 0,
        };
        (window as any).__navMetrics.itemRebuilds++;
      }
    }

    if (currentApp === 'hub') {
      return [
        {
          key: 'notifications',
          icon: 'notifications',
          label: 'Activity',
          isActive: activeTab === 'settings' && activePage === 'notifications',
          onClick: () =>
            NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'notifications' }),
        },
        {
          key: 'home',
          icon: 'home',
          label: 'Home',
          isActive: activeTab === 'home',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' }),
        },
        {
          key: 'settings',
          icon: 'settings',
          label: 'Settings',
          isActive: activeTab === 'settings' && activePage !== 'notifications',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
        },
      ];
    }

    const sections = APP_SECTIONS[currentApp] || [];
    return sections.map((sec) => ({
      key: sec.id,
      icon: sec.icon,
      label: getTranslation(sec.labelKey),
      isActive: activeTab === sec.id || activePage === sec.id,
      onClick: () =>
        NavigationDispatcher.push({ app: currentApp as any, page: sec.id as any, tab: sec.id }),
    }));
  }, [currentApp, activeTab, activePage, isTransitioning, getTranslation]);

  // Compute visibility reactively based on transition and DOM indicators
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkKeyboard = () => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        setIsKeyboardFocused(
          tagName === 'input' ||
          tagName === 'textarea' ||
          activeEl.hasAttribute('contenteditable') ||
          (activeEl as HTMLElement).isContentEditable
        );
      } else {
        setIsKeyboardFocused(false);
      }
    };
    window.addEventListener('focusin', checkKeyboard);
    window.addEventListener('focusout', checkKeyboard);
    window.addEventListener('click', checkKeyboard, { passive: true });
    window.addEventListener('touchstart', checkKeyboard, { passive: true });
    window.addEventListener('resize', checkKeyboard);
    return () => {
      window.removeEventListener('focusin', checkKeyboard);
      window.removeEventListener('focusout', checkKeyboard);
      window.removeEventListener('click', checkKeyboard);
      window.removeEventListener('touchstart', checkKeyboard);
      window.removeEventListener('resize', checkKeyboard);
    };
  }, []);

  const [hasDOMHiddenIndicator, setHasDOMHiddenIndicator] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkDOM = () => {
      const isFullscreen = !!document.fullscreenElement;
      const isModalOpen =
        document.querySelector('.modal-backdrop') !== null ||
        document.querySelector('.studio-modal') !== null ||
        document.querySelector('[role="dialog"]') !== null;
      const hasHideClass =
        document.querySelector('.hide-bottom-nav') !== null ||
        document.querySelector('.hide-global-nav') !== null;
      setHasDOMHiddenIndicator(isFullscreen || isModalOpen || hasHideClass);
    };
    
    checkDOM();
    const interval = setInterval(checkDOM, 500);

    window.addEventListener('click', checkDOM, { passive: true });
    window.addEventListener('touchstart', checkDOM, { passive: true });
    window.addEventListener('resize', checkDOM);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', checkDOM);
      window.removeEventListener('touchstart', checkDOM);
      window.removeEventListener('resize', checkDOM);
    };
  }, []);

  const items = propsItems !== undefined ? propsItems : computedItems;
  const isLight = propsIsLight !== undefined ? propsIsLight : storeIsLight;
  const visible = !isTransitioning && !isKeyboardFocused && !hasDOMHiddenIndicator && storeVisible;
  const collapsed = storeCollapsed;

  // Slide down out of view progressively up to 100px (beyond viewport edge)
  const translateY = scrollOffset * 100;

  const handleAppSwitch = (appKey: string) => {
    NavigationDispatcher.push({ app: appKey as any });
    setIsSwitcherOpen(false);
  };

  const switcherApps = useMemo(
    () => [
      {
        key: 'hub',
        label: 'Hub',
        icon: <StudioLogo size={18} />,
        onClick: () => handleAppSwitch('hub'),
      },
      {
        key: 'chords',
        label: 'Chordex',
        icon: <ChordexLogo size={18} />,
        onClick: () => handleAppSwitch('chords'),
      },
      {
        key: 'drums',
        label: 'Drumex',
        icon: <DrumexLogo size={18} />,
        onClick: () => handleAppSwitch('drums'),
      },
      {
        key: 'stage',
        label: 'Stagex',
        icon: <StagexLogoIcon size={18} />,
        onClick: () => handleAppSwitch('stage'),
      },
      {
        key: 'groovex',
        label: 'Groovex',
        icon: <GroovexLogo size={18} />,
        onClick: () => handleAppSwitch('groovex'),
      },
      {
        key: 'vocalex',
        label: 'Vocalex',
        icon: <VocalexLogo size={18} />,
        onClick: () => handleAppSwitch('vocalex'),
      },
    ],
    []
  );

  const currentItems = isSwitcherOpen ? switcherApps : items || [];
  const N = currentItems.length || 1;

  // Dynamic screen width monitoring for robust responsiveness
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 360
  );

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
  const getCenterX = useCallback(
    (index: number) => {
      return (index + 0.5) * itemWidth;
    },
    [itemWidth]
  );

  const activeIndex = useMemo(() => {
    const idx = currentItems.findIndex((item) => {
      return isSwitcherOpen ? item.key === currentApp : item.isActive;
    });
    return idx >= 0 ? idx : 0;
  }, [currentItems, currentApp, isSwitcherOpen]);

  const pillX = useMotionValue(getCenterX(activeIndex));
  const pillSkewX = useMotionValue(0);
  const pressureOffset = useMotionValue(0);

  const pillPathD = useTransform([pillSkewX, pressureOffset] as const, ([skewVal, pressVal]) => {
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
  });

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
        ...SpringPresets.soft,
      });
    }
  }, [activeIndex, getCenterX, pillX]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    useBottomNavigationStore.getState().setMotionState('Dragging');
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

    animate(pressureOffset, 4, { ...SpringPresets.stiff });

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      isScrubbingRef.current = true;
      setIsScrubbing(true);

      if (
        typeof window !== 'undefined' &&
        window.navigator &&
        typeof window.navigator.vibrate === 'function'
      ) {
        try {
          window.navigator.vibrate(15);
        } catch (err) {}
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

      if (
        typeof window !== 'undefined' &&
        window.navigator &&
        typeof window.navigator.vibrate === 'function'
      ) {
        try {
          window.navigator.vibrate(8);
        } catch (err) {}
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
        if (
          typeof window !== 'undefined' &&
          window.navigator &&
          typeof window.navigator.vibrate === 'function'
        ) {
          try {
            window.navigator.vibrate(5);
          } catch (err) {}
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    useBottomNavigationStore.getState().setMotionState('Idle');
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    animate(pillSkewX, 0, { ...SpringPresets.expressive });
    animate(pressureOffset, 0, { ...SpringPresets.expressive });

    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      setIsScrubbing(false);

      const finalIndex = scrubbingIndexRef.current;
      const targetItem = currentItems[finalIndex];

      animate(pillX, getCenterX(finalIndex), {
        ...SpringPresets.soft,
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
    useBottomNavigationStore.getState().setMotionState('Idle');
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    animate(pillSkewX, 0, { ...SpringPresets.expressive });
    animate(pressureOffset, 0, { ...SpringPresets.expressive });

    isScrubbingRef.current = false;
    setIsScrubbing(false);

    animate(pillX, getCenterX(activeIndex), {
      ...SpringPresets.soft,
    });
  };

  const pillSkewXTrans = useTransform(pillSkewX, (val) => `${val}deg`);

  return (
    <motion.div
      ref={containerRef}
      className="shared-bottom-nav-container"
      animate={{
        y: !visible || collapsed || currentItems.length === 0 ? 150 : translateY,
        x: '-50%',
        opacity: !visible || collapsed || currentItems.length === 0 ? 0 : 1,
      }}
      transition={{
        ...SpringPresets.soft,
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
            touchAction: 'none',
          }}
        >
          {/* Floating interactive liquid capsule indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: '2px',
              height: '38px',
              width: `${pillWidth + 40}px`,
              x: useTransform(pillX, (val) => val - pillWidth / 2 - 20),
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
              <motion.path d={pillPathD} fill="rgba(255, 255, 255, 0.16)" />
            </svg>
          </motion.div>

          {currentItems.map((item, index) => {
            const isActive = isSwitcherOpen ? item.key === currentApp : item.isActive;

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
          onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
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
