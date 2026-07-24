import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import {
  useNavScrollOffset,
  NavigationDispatcher,
  SpringPresets,
  useBottomNavigationStore,
  useBackHandler,
  searchIndex,
  type SearchableItem,
  useSettingsStore,
} from '@workspace/studio-core';
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
  items: SharedNavigationItem[];
  isLight: boolean;
  visible: boolean;
  collapsed: boolean;
  isSwitcherOpen: boolean;
  setIsSwitcherOpen: (open: boolean) => void;
  currentApp: string;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
}

const NavigationItem = React.memo(
  ({
    item,
    index,
    onClick,
    isActive,
  }: {
    item: any;
    index: number;
    onClick: () => void;
    isActive: boolean;
  }) => {
    const isIconString = typeof item.icon === 'string';

    return (
      <button
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
          borderRadius: '9999px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
          padding: '0 8px',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {isIconString ? (
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                color: '#ffffff',
                fontSize: '20px',
                transition: 'font-variation-settings 150ms ease',
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

          <AnimatePresence initial={false}>
            {isActive && item.label && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>
    );
  }
);

export function SharedNavigationBar({
  items,
  isLight,
  visible,
  collapsed,
  isSwitcherOpen,
  setIsSwitcherOpen,
  currentApp,
  onOpenSearch,
  onOpenProfile,
}: SharedNavigationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useNavScrollOffset();
  const startupComplete = useStartupComplete();

  const settings = useSettingsStore((s) => s.settings);
  const lang = settings?.language ?? 'en';

  const searchOpen = useBottomNavigationStore((s) => s.isSearchOpen);
  const setSearchOpen = useBottomNavigationStore((s) => s.setSearchOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close search on hardware back press
  useBackHandler(
    'modal',
    () => {
      if (searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        return true;
      }
      return false;
    },
    [searchOpen, setSearchOpen]
  );

  // 1. One-time index registration from local storage on mount (avoiding CPU spikes on open)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const chordex = localStorage.getItem('chord-explorer-storage-v3');
        if (chordex) {
          const parsed = JSON.parse(chordex);
          const state = parsed.state || {};
          (state.presets || []).forEach((p: any) => {
            searchIndex.register({
              id: `chordex-preset-${p.id || p.name}`,
              category: 'projects',
              titleEn: p.name || 'Untitled Chordex Preset',
              titleEs: p.name || 'Preajuste de Chordex sin título',
              subtitleEn: 'Chordex Preset',
              subtitleEs: 'Preajuste de Chordex',
              keywordsEn: ['chord', 'preset', 'chordex', 'progression'],
              keywordsEs: ['acorde', 'preajuste', 'chordex', 'progresión'],
              target: {
                app: 'chords',
                action: () => {
                  NavigationDispatcher.push({ app: 'chords', page: 'library' as any });
                },
              },
            });
          });
          (state.progressions || []).forEach((p: any) => {
            searchIndex.register({
              id: `chordex-prog-${p.id || p.name}`,
              category: 'projects',
              titleEn: p.name || 'Untitled Progression',
              titleEs: p.name || 'Progresión sin título',
              subtitleEn: 'Chordex Progression',
              subtitleEs: 'Progresión de Chordex',
              keywordsEn: ['progression', 'chords', 'chordex'],
              keywordsEs: ['progresión', 'acordes', 'chordex'],
              target: {
                app: 'chords',
                action: () => {
                  NavigationDispatcher.push({ app: 'chords', page: 'songs' as any });
                },
              },
            });
          });
        }
      } catch {}

      try {
        const drumex = localStorage.getItem('chordex-drums');
        if (drumex) {
          const parsed = JSON.parse(drumex);
          const state = parsed.state || {};
          (state.drumSongs || []).forEach((s: any) => {
            searchIndex.register({
              id: `drumex-song-${s.id || s.name}`,
              category: 'songs',
              titleEn: s.name || 'Untitled Drum Song',
              titleEs: s.name || 'Canción de batería sin título',
              subtitleEn: 'Drumex Song',
              subtitleEs: 'Canción de Drumex',
              keywordsEn: ['drum', 'song', 'pattern', 'drumex'],
              keywordsEs: ['batería', 'canción', 'patrón', 'drumex'],
              target: {
                app: 'drums',
                action: () => {
                  NavigationDispatcher.push({ app: 'drums', page: 'songs' as any });
                },
              },
            });
          });
        }
      } catch {}

      try {
        const groovex = localStorage.getItem('groovex-storage-v1');
        if (groovex) {
          const parsed = JSON.parse(groovex);
          const state = parsed.state || {};
          (state.recentSongs || []).forEach((s: any) => {
            searchIndex.register({
              id: `groovex-song-${s.id || s.name || s.title}`,
              category: 'songs',
              titleEn: s.name || s.title || s.artist || 'Untitled Groovex Song',
              titleEs: s.name || s.title || s.artist || 'Canción de Groovex sin título',
              subtitleEn: 'Groovex Recent Song',
              subtitleEs: 'Canción reciente de Groovex',
              keywordsEn: ['groove', 'song', 'recent', 'groovex'],
              keywordsEs: ['groove', 'canción', 'reciente', 'groovex'],
              target: {
                app: 'groovex',
              },
            });
          });
        }
      } catch {}
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 2. Fetch recent searches and auto focus on searchOpen
  useEffect(() => {
    if (!searchOpen) return;
    try {
      const historyStr = localStorage.getItem('studio:recent-searches') || '[]';
      setRecentSearches(JSON.parse(historyStr));
    } catch {}

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  const addToSearchHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const historyStr = localStorage.getItem('studio:recent-searches') || '[]';
      let history: string[] = JSON.parse(historyStr);
      history = history.filter((x) => x.toLowerCase() !== trimmed.toLowerCase());
      history.unshift(trimmed);
      history = history.slice(0, 5);
      localStorage.setItem('studio:recent-searches', JSON.stringify(history));
      setRecentSearches(history);
    } catch {}
  };

  const removeSearchHistory = (queryToRemove: string) => {
    try {
      const historyStr = localStorage.getItem('studio:recent-searches') || '[]';
      let history: string[] = JSON.parse(historyStr);
      history = history.filter((x) => x.toLowerCase() !== queryToRemove.toLowerCase());
      localStorage.setItem('studio:recent-searches', JSON.stringify(history));
      setRecentSearches(history);
    } catch {}
  };

  const scoreMatch = (query: string, text: string): number => {
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase();
    if (!q) return 0;
    if (t === q) return 150;
    if (t.startsWith(q)) return 100;
    if (t.includes(q)) return 80;

    let qIdx = 0;
    let tIdx = 0;
    let matchDistance = 0;
    while (qIdx < q.length && tIdx < t.length) {
      if (q[qIdx] === t[tIdx]) {
        if (qIdx > 0) {
          matchDistance += tIdx - qIdx;
        }
        qIdx++;
      }
      tIdx++;
    }
    if (qIdx === q.length) {
      return Math.max(10, 50 - matchDistance);
    }
    return 0;
  };

  const getSearchResults = (query: string): SearchableItem[] => {
    const q = query.trim();
    if (!q) return [];

    const allItems = searchIndex.getItems();
    
    // Category sorting weights
    const categoryWeights: Record<string, number> = {
      apps: 100,
      actions: 90,
      recent: 80,
      songs: 70,
      projects: 60,
      settings: 50,
      updater: 40,
      documents: 30,
    };

    const scored = allItems.map((item) => {
      const titleScore = Math.max(scoreMatch(q, item.titleEn), scoreMatch(q, item.titleEs));
      const subtitleScore =
        Math.max(scoreMatch(q, item.subtitleEn), scoreMatch(q, item.subtitleEs)) * 0.5;

      const keywordsEnScore = (item.keywordsEn || []).some((k) =>
        k.toLowerCase().includes(q.toLowerCase())
      )
        ? 70
        : 0;
      const keywordsEsScore = (item.keywordsEs || []).some((k) =>
        k.toLowerCase().includes(q.toLowerCase())
      )
        ? 70
        : 0;

      const baseScore = Math.max(titleScore, subtitleScore, keywordsEnScore, keywordsEsScore);
      const categoryWeight = categoryWeights[item.category] || 0;
      const finalScore = baseScore > 0 ? baseScore + categoryWeight * 0.1 : 0;

      return { item, score: finalScore };
    });

    const seenIds = new Set<string>();
    const deduplicatedScored: { item: SearchableItem; score: number }[] = [];
    
    scored.forEach((x) => {
      if (x.score > 0) {
        const id = x.item.id || `${x.item.category}-${x.item.titleEn}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          deduplicatedScored.push(x);
        }
      }
    });

    let results = deduplicatedScored
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);

    if (searchCategory !== 'all') {
      results = results.filter((x) => x.category === searchCategory);
    }

    return results;
  };

  const handleSearchRowClick = (item: SearchableItem) => {
    addToSearchHistory(searchQuery);
    setSearchOpen(false);
    setSearchQuery('');

    if (item.target.action) {
      item.target.action();
    } else if (item.target.app) {
      NavigationDispatcher.push({
        app: item.target.app as any,
        tab: item.target.tab as any,
        page: item.target.page as any,
      });
    }
  };

  const renderSearchRow = (item: SearchableItem, idx: number) => {
    const displayTitle = lang === 'es' ? item.titleEs : item.titleEn;
    const displaySubtitle = lang === 'es' ? item.subtitleEs : item.subtitleEn;
    
    const categoryLabels: Record<string, string> = {
      apps: lang === 'es' ? 'Aplicación' : 'App',
      settings: lang === 'es' ? 'Ajustes' : 'Settings',
      projects: lang === 'es' ? 'Proyecto' : 'Project',
      songs: lang === 'es' ? 'Canción' : 'Song',
      actions: lang === 'es' ? 'Comando' : 'Command',
    };
    const categoryLabel = categoryLabels[item.category] || item.category;

    const categoryColors: Record<string, string> = {
      apps: '#ff2d55',
      settings: '#38bdf8',
      projects: '#fb7185',
      songs: '#a78bfa',
      actions: '#f59e0b',
    };
    const categoryColor = categoryColors[item.category] || '#ff2d55';

    return (
      <button
        key={item.id || idx}
        onClick={() => handleSearchRowClick(item)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 14,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'background-color 150ms ease',
          gap: '4px',
          marginBottom: '8px',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12 }}>
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {displayTitle}
          </div>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: categoryColor,
              backgroundColor: `${categoryColor}15`,
              padding: '2px 6px',
              borderRadius: '6px',
              letterSpacing: '0.05em',
            }}
          >
            {categoryLabel}
          </span>
        </div>
        {displaySubtitle && (
          <div
            style={{
              fontSize: '11.5px',
              color: 'rgba(255, 255, 255, 0.45)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
            }}
          >
            {displaySubtitle}
          </div>
        )}
      </button>
    );
  };

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

  const isHub = currentApp === 'hub';
  const showSwitcherButton = currentApp !== 'hub';
  const showSearchButton = isHub;

  const currentItems = isSwitcherOpen ? switcherApps : items || [];
  const N = currentItems.length || 1;
  const totalSlots = isHub && !isSwitcherOpen ? N + 1 : N;
  const slotWidth = isSwitcherOpen ? 52 : 70;
  const paddingX = 8; // Match the container padding: '6px 8px'
  const insetX = 6;

  const maxBarWidth = windowWidth - 32 - (showSwitcherButton ? 72 : 0);
  const barWidth = Math.max(160, Math.min(totalSlots * slotWidth + paddingX * 2, maxBarWidth));

  const usableWidth = barWidth - paddingX * 2;
  const itemWidth = usableWidth / totalSlots;
  const pillWidth = itemWidth - insetX * 2;

  const getPillX = useCallback(
    (index: number) => {
      return index * itemWidth + insetX;
    },
    [itemWidth, insetX]
  );

  const activeIndex = useMemo(() => {
    const idx = currentItems.findIndex((item) => {
      return isSwitcherOpen ? item.key === currentApp : item.isActive;
    });
    return idx >= 0 ? idx : 0;
  }, [currentItems, currentApp, isSwitcherOpen]);

  const pillX = useMotionValue(getPillX(activeIndex));
  const pillSkewX = useMotionValue(0);
  const pressureOffset = useMotionValue(0);

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
      animate(pillX, getPillX(activeIndex), {
        ...SpringPresets.soft,
      });
    }
  }, [activeIndex, getPillX, pillX]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const minX = getPillX(0);
    const maxX = getPillX(N - 1);
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
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}

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
    }, 250);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragDistance = Math.abs(e.clientX - startXRef.current);
    if (!isScrubbingRef.current && dragDistance > 10) {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}

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

    if (!isScrubbingRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const minX = getPillX(0);
    const maxX = getPillX(N - 1);
    const clampedX = Math.max(minX, Math.min(maxX, relativeX));
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    const dx = e.clientX - lastXRef.current;

    const velocity = dt > 0 ? dx / dt : 0;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

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

      animate(pillX, getPillX(finalIndex), {
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

    animate(pillX, getPillX(activeIndex), {
      ...SpringPresets.soft,
    });
  };

  const pillSkewXTrans = useTransform(pillSkewX, (val) => `${val}deg`);
  const pillXTrans = useTransform(pillX, (val) => val - pillWidth / 2);

  const fastSpring = useMemo(
    () => ({
      type: 'spring' as const,
      stiffness: 180,
      damping: 26,
      mass: 1.0,
    }),
    []
  );

  // Slide down out of view progressively up to 100px (beyond viewport edge)
  const translateY = searchOpen ? 0 : scrollOffset * 100;

  const glassWidth = searchOpen ? 'calc(100% - 16px)' : `${pillWidth}px`;
  const glassX = searchOpen ? 8 : pillXTrans;
  const glassSkewX = searchOpen ? '0deg' : pillSkewXTrans;

  return (
    <>
      <motion.div
        key="navigation-bar-wrapper"
        ref={containerRef}
        className="shared-bottom-nav-container-wrapper"
        animate={{
          y: 0,
          scale: (collapsed && !searchOpen) ? 0.70 : 1.0,
          opacity: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 28,
        }}
        style={{
          position: 'fixed',
          bottom: 'max(14px, env(safe-area-inset-bottom))',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Click-outside backdrop */}
        {searchOpen && (
          <div
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 5, 8, 0.4)',
              zIndex: -1,
              pointerEvents: 'auto',
            }}
          />
        )}

        {/* Search Results Panel */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: '42vh' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={fastSpring}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(20, 20, 24, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '8px',
                pointerEvents: 'auto',
                willChange: 'transform, opacity, height',
              }}
            >
              {/* Category chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  padding: '16px 16px 8px',
                  flexShrink: 0,
                }}
              >
                {['all', 'apps', 'settings', 'projects', 'songs', 'actions'].map((cat) => {
                  const isActive = searchCategory === cat;
                  const translatedCat =
                    lang === 'es'
                      ? {
                          all: 'todo',
                          apps: 'aplicaciones',
                          settings: 'ajustes',
                          projects: 'proyectos',
                          songs: 'canciones',
                          actions: 'acciones',
                        }[cat] || cat
                      : cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSearchCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.60)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {translatedCat}
                    </button>
                  );
                })}
              </div>

              {/* Results scroll list */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {searchQuery.trim() ? (
                  (() => {
                    const results = getSearchResults(searchQuery);
                    if (results.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '24px', fontSize: '13px' }}>
                          {lang === 'es' ? `No hay resultados para "${searchQuery}"` : `No results found for "${searchQuery}"`}
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {results.map((item, idx) => renderSearchRow(item, idx))}
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                          {lang === 'es' ? 'Búsquedas Recientes' : 'Recent Searches'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '8px' }}>
                          {recentSearches.map((term) => (
                            <div
                              key={term}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <span
                                onClick={() => setSearchQuery(term)}
                                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.80)', cursor: 'pointer' }}
                              >
                                {term}
                              </span>
                              <span
                                onClick={() => removeSearchHistory(term)}
                                className="material-symbols-outlined"
                                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                              >
                                close
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions / Commands */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        {lang === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                        {searchIndex
                          .getItems()
                          .filter((item) => item.category === 'actions')
                          .slice(0, 3)
                          .map((item, idx) => renderSearchRow(item, idx))}
                      </div>
                    </div>

                    {/* Suggested Apps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        {lang === 'es' ? 'Aplicaciones Sugeridas' : 'Suggested Apps'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {searchIndex
                          .getItems()
                          .filter((item) => item.category === 'apps')
                          .slice(0, 4)
                          .map((item, idx) => renderSearchRow(item, idx))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Dock Grid */}
        {searchOpen ? (
          <motion.div
            layoutId="search-container"
            transition={fastSpring}
            className="shared-bottom-nav glass-nav"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '480px',
              height: '64px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(12, 12, 14, 0.45)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 8px',
              position: 'relative',
              touchAction: 'none',
              userSelect: 'none',
              alignSelf: 'center',
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
              {/* Standard Icons Wrapper */}
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 200ms ease',
                }}
              >
                {currentItems.map((item, index) => {
                  const isActive = isSwitcherOpen ? item.key === currentApp : item.isActive;
                  return (
                    <NavigationItem
                      key={item.key}
                      item={item}
                      index={index}
                      onClick={item.onClick}
                      isActive={isActive}
                    />
                  );
                })}

                {isHub && !isSwitcherOpen && (
                  <motion.button
                    onClick={() => {
                      if (onOpenSearch) onOpenSearch();
                      setSearchOpen(true);
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: `${itemWidth}px`,
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
                      layoutId="search-icon"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.60)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </motion.div>
                  </motion.button>
                )}
              </div>

              {/* Embedded Search input inside stretched bar */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      zIndex: 10,
                      pointerEvents: 'auto',
                    }}
                  >
                    <motion.div
                      layoutId="search-icon"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#ffffff',
                        opacity: 0.6,
                        marginRight: '8px',
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </motion.div>
                    <input
                      id="global-search-input"
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'es' ? 'Buscar canciones, apps, ajustes...' : 'Search songs, apps, settings...'}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '16px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.6)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          marginRight: '8px',
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          clear
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'none' }} />
            
            <motion.div
              layoutId="search-container"
              className="shared-bottom-nav glass-nav"
              style={{
                pointerEvents: 'auto',
                justifySelf: 'center',
                width: `${barWidth}px`,
                height: '64px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(12, 12, 14, 0.45)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '6px 8px',
                position: 'relative',
                touchAction: 'none',
                userSelect: 'none',
                transformOrigin: 'center center',
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
                {/* Continuous Gliding Pill Highlight */}
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    width: `${pillWidth}px`,
                    x: pillX,
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                    border: '1.2px solid rgba(255, 255, 255, 0.32)',
                    boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.45), 0 4px 14px rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />


                {/* Standard Icons Wrapper */}
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    opacity: 1,
                    pointerEvents: 'auto',
                    transition: 'opacity 200ms ease',
                  }}
                >
                  {currentItems.map((item, index) => {
                    const isActive = isSwitcherOpen ? item.key === currentApp : item.isActive;
                    return (
                      <NavigationItem
                        key={item.key}
                        item={item}
                        index={index}
                        onClick={item.onClick}
                        isActive={isActive}
                      />
                    );
                  })}

                  {isHub && !isSwitcherOpen && (
                    <motion.button
                      onClick={() => {
                        if (onOpenSearch) onOpenSearch();
                        setSearchOpen(true);
                      }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        width: `${itemWidth}px`,
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
                        layoutId="search-icon"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(255, 255, 255, 0.60)',
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          search
                        </span>
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            <div
              style={{
                pointerEvents: 'auto',
                justifySelf: 'end',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {showSwitcherButton && !searchOpen && (
                <motion.button
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(12, 12, 14, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.2)',
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
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
