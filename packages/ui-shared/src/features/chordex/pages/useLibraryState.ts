import { useState, useMemo, useRef, useCallback } from 'react';
import {
  getAllChords,
  searchChords,
  getChordById,
  useChordStore,
  ACCENT_COLORS,
  SONGS,
  type SongChart,
  useIsWebDesktop,
  useBackHandler,
  useNavigationStore,
  NavigationDispatcher,
  type ActivePanel,
  useSettingsStore,
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { CATEGORIES } from './LibraryCategories';

export function useLibraryState() {
  const isWebDesktop = useIsWebDesktop();
  const currentRoute = useNavigationStore(useShallow((s) => s.history[s.history.length - 1])) || {
    app: 'hub',
  };
  const selectedChordId =
    currentRoute.app === 'chords' && ['chord', 'library'].includes(currentRoute.page || '')
      ? currentRoute.id || null
      : null;
  const activePanel =
    currentRoute.app === 'chords' && currentRoute.page
      ? (currentRoute.page === 'chord' ? 'library' : (currentRoute.page as ActivePanel))
      : 'library';
      
  const recentChords = useChordStore(useShallow((s) => s.recentChords));
  const favorites = useChordStore(useShallow((s) => s.favorites));
  const settings = useSettingsStore(useShallow((s) => s.settings));
  
  const toggleFavorite = useChordStore(useShallow((s) => s.toggleFavorite));
  const addToProgression = useChordStore(useShallow((s) => s.addToProgression));
  const activeType = useChordStore(useShallow((s) => s.libraryActiveType));
  const setActiveType = useChordStore(useShallow((s) => s.setLibraryActiveType));

  const [chordPlaying, setChordPlaying] = useState(false);
  const [query, setQuery] = useState('');
  const [showTuningMenu, setShowTuningMenu] = useState(false);

  const [showFinder, setShowFinder] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const allChords = useMemo(() => getAllChords(), []);
  const accent =
    ACCENT_COLORS[settings.perApp?.chords?.accentColor ?? settings.accentColor] ??
    ACCENT_COLORS.blue;
    
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const scrollRef = useRef<HTMLDivElement>(null);

  const chord = useMemo(() => {
    return selectedChordId ? getChordById(selectedChordId) : null;
  }, [selectedChordId]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    return searchChords(query);
  }, [query]);

  const chordOfTheDay = useMemo(() => {
    return getChordById('d-maj7') || allChords[0] || null;
  }, [allChords]);

  const selectChord = useCallback(
    (chordId: string | null) => {
      if (chordId === null) {
        if (isWebDesktop) {
          NavigationDispatcher.replace({ app: 'chords', page: 'library' });
        } else {
          NavigationDispatcher.pop();
        }
      } else {
        if (isWebDesktop) {
          NavigationDispatcher.replace({ app: 'chords', page: 'chord', id: chordId });
        } else {
          NavigationDispatcher.push({ app: 'chords', page: 'chord', id: chordId });
        }
      }
    },
    [isWebDesktop]
  );

  const handleChordClick = useCallback(
    (chordId: string) => {
      useChordStore.setState((state) => {
        const recent = [chordId, ...state.recentChords.filter((id) => id !== chordId)].slice(0, 10);
        return { recentChords: recent };
      });
      selectChord(chordId);
    },
    [selectChord]
  );
  
  const activePracticeSong = useMemo(() => {
    if (currentRoute.app === 'chords' && currentRoute.subView === 'practice' && currentRoute.id) {
      return SONGS.find((s) => s.id === currentRoute.id) || null;
    }
    return null;
  }, [currentRoute]);

  const setActivePracticeSong = useCallback((song: SongChart | null) => {
    if (song === null) {
      NavigationDispatcher.pop();
    } else {
      NavigationDispatcher.push({
        app: 'chords',
        page: 'library',
        subView: 'practice',
        id: song.id,
      });
    }
  }, []);

  useBackHandler(
    'nested',
    () => {
      if (activePanel !== 'library') return false;
      if (activePracticeSong) {
        setActivePracticeSong(null);
        return true;
      }
      if (selectedChordId) {
        selectChord(null);
        return true;
      }
      if (query) {
        setQuery('');
        return true;
      }
      if (activeType) {
        setActiveType(null);
        return true;
      }
      return false;
    },
    [activePanel, activePracticeSong, selectedChordId, query, activeType, selectChord, setActiveType]
  );

  const filteredByType = useMemo(() => {
    if (!activeType) return [];
    return allChords.filter((c) => c.type === activeType);
  }, [activeType, allChords]);

  const activeCategoryObject = CATEGORIES.find((c) => c.type === activeType);
  
  return {
    isWebDesktop, currentRoute, selectedChordId, activePanel, recentChords, favorites,
    settings, toggleFavorite, addToProgression, activeType, setActiveType, chordPlaying,
    setChordPlaying, query, setQuery, showTuningMenu, setShowTuningMenu, showFinder,
    setShowFinder, showGenerator, setShowGenerator, allChords, accent, isLight, scrollRef,
    chord, searchResults, chordOfTheDay, selectChord, handleChordClick, activePracticeSong,
    setActivePracticeSong, filteredByType, activeCategoryObject
  };
}
