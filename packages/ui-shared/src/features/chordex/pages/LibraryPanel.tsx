import {
  getAllChords,
  searchChords,
  getChordById,
  getRelatedChords,
  type ChordType,
  useChordStore,
  ACCENT_COLORS,
  SONGS,
  GENRE_META,
  type Genre,
  useScrollHide,
  useT,
  useIsWebDesktop,
  useBackHandler,
  playChord,
  stopChordPlayback,
  type GuitarChordData,
  type SongChart,
  useNavigationStore,
  NavigationDispatcher,
  type ActivePanel
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import React, { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { SongPracticeView } from '../../../components/SongPracticeView';
import ChordDiagram from '../../../components/ChordDiagram';
import { AppModeMenuLogo } from '../../../components/icons/AppModeMenuLogo';
import GuitarDiagram from '../../../components/GuitarDiagram';
import PianoDiagram from '../../../components/PianoDiagram';
import FourStringDiagram from '../../../components/FourStringDiagram';
import { WebEmptyState } from '../../../components/WebDesignSystem';
import InkThemeToggle from '../../../components/typography/InkThemeToggle';

const CustomChordBuilder = lazy(() => import('../../../components/feature/CustomChordBuilder'));
const ProgressionGenerator = lazy(() => import('../../../components/feature/ProgressionGenerator'));

// Category descriptions
const CATEGORIES: {
  type: ChordType;
  icon: string;
  label: string;
  desc: string;
  color: string;
  variations: string;
}[] = [
  { type: 'major', icon: 'piano', label: 'Major', desc: 'Bright, happy, foundational.', color: '#679cff', variations: '84 Variations' },
  { type: 'minor', icon: 'music_note', label: 'Minor', desc: 'Moody & emotional.', color: '#bb5551', variations: '72 Variations' },
  { type: '7th', icon: 'star', label: '7th Chords', desc: 'Dominant & Major 7ths.', color: '#9d9da6', variations: 'Dominant & Major 7ths' },
  { type: 'sus2', icon: 'waves', label: 'Sus2/4', desc: 'Open & airy.', color: '#2dd4bf', variations: '42 Variations' },
  { type: 'dim', icon: 'blur_on', label: 'Diminished', desc: 'Tense & dissonant.', color: '#ee7d77', variations: '36 Variations' },
];

function RelatedPlayBtn({ guitar, accent, isLight }: {
  guitar: GuitarChordData;
  accent: { from: string; to: string; mid: string };
  isLight?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playing) { stopChordPlayback(); setPlaying(false); return; }
    setPlaying(true);
    playChord(guitar);
    setTimeout(() => setPlaying(false), 2800);
  }, [guitar, playing]);

  return (
    <button
      aria-label="Play chord"
      onClick={handlePlay}
      style={{
        width: 24, height: 24, borderRadius: '50%',
        background: playing ? `${accent.from}30` : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'),
        border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 0,
        transition: 'background 200ms ease',
      }}
    >
      <span className="material-symbols-outlined" style={{
        fontSize: '13px',
        color: playing ? accent.from : 'var(--c-text-secondary)',
        fontVariationSettings: "'FILL' 1",
        transition: 'color 200ms ease',
      }}>{playing ? 'stop' : 'play_arrow'}</span>
    </button>
  );
}

export default function LibraryPanel() {
  const isWebDesktop = useIsWebDesktop();
  const currentRoute = useNavigationStore(useShallow(s => s.history[s.history.length - 1])) || { app: 'hub' };
  const selectedChordId = (currentRoute.app === 'chords' && ['chord', 'library'].includes(currentRoute.page || '') ? currentRoute.id || null : null);
  const activePanel = (currentRoute.app === 'chords' && currentRoute.page ? currentRoute.page as ActivePanel : 'library');
  const recentChords = useChordStore(useShallow(s => s.recentChords));
  const favorites = useChordStore(useShallow(s => s.favorites));
  const settings = useChordStore(useShallow(s => s.settings));
  const updateSettings = useChordStore(useShallow(s => s.updateSettings));
  const toggleFavorite = useChordStore(useShallow(s => s.toggleFavorite));
  const addToProgression = useChordStore(useShallow(s => s.addToProgression));
  const activeType = useChordStore(useShallow(s => s.libraryActiveType));
  const setActiveType = useChordStore(useShallow(s => s.setLibraryActiveType));

  const [chordPlaying, setChordPlaying] = useState(false);
  const [query, setQuery] = useState('');
  const [showTuningMenu, setShowTuningMenu] = useState(false);

  const [showFinder, setShowFinder] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const allChords = useMemo(() => getAllChords(), []);
  const accent = ACCENT_COLORS[settings.perApp?.chords?.accentColor ?? settings.accentColor] ?? ACCENT_COLORS.blue;
  const t = useT();
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);

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

  const selectChord = useCallback((chordId: string | null) => {
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
  }, [isWebDesktop]);

  const handleChordClick = useCallback((chordId: string) => {
    useChordStore.setState((state) => {
      const recent = [chordId, ...state.recentChords.filter(id => id !== chordId)].slice(0, 10);
      return { recentChords: recent };
    });
    selectChord(chordId);
  }, [selectChord]);

  const tunings = [
    { label: t.settings.tunings.standard, value: 'Standard (EADGBE)' },
    { label: t.settings.tunings.dropD, value: 'Drop D (DADGBE)' },
    { label: t.settings.tunings.openG, value: 'Open G (DGDGBD)' },
    { label: t.settings.tunings.openD, value: 'Open D (DADF#AD)' },
    { label: 'DADGAD', value: 'DADGAD' },
  ];

  const activePracticeSong = useMemo(() => {
    if (currentRoute.app === 'chords' && currentRoute.subView === 'practice' && currentRoute.id) {
      return SONGS.find(s => s.id === currentRoute.id) || null;
    }
    return null;
  }, [currentRoute]);

  const setActivePracticeSong = useCallback((song: SongChart | null) => {
    if (song === null) {
      NavigationDispatcher.pop();
    } else {
      NavigationDispatcher.push({ app: 'chords', page: 'library', subView: 'practice', id: song.id });
    }
  }, []);

  useBackHandler('nested', () => {
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
  }, [activePanel, activePracticeSong, selectedChordId, query, activeType, selectChord]);

  const filteredByType = useMemo(() => {
    if (!activeType) return [];
    return allChords.filter(c => {
      if (activeType === 'sus2') return c.type === 'sus2' || c.type === 'sus4';
      if (activeType === 'dim') return c.type === 'dim' || c.type === 'dim7' || c.type === 'halfdim';
      if (activeType === '7th') return c.type === '7th' || c.type === 'maj7' || c.type === 'min7';
      return c.type === activeType;
    });
  }, [activeType, allChords]);

  const handlePlayChord = () => {
    if (!chord) return;
    if (chordPlaying) {
      stopChordPlayback();
      setChordPlaying(false);
      return;
    }
    setChordPlaying(true);
    playChord(chord.guitar);
    setTimeout(() => setChordPlaying(false), 2800);
  };

  const renderDetailDiagram = () => {
    if (!chord) return null;
    const props = {
      chordName: chord.name,
      notes: chord.notes,
      intervals: chord.intervals,
      showNoteNames: settings.showNoteNames,
      showIntervals: settings.showIntervals,
      size: 'lg' as const,
    };
    if (settings.instrument === 'guitar') {
      return <GuitarDiagram chordData={chord.guitar} {...props} leftHanded={settings.leftHanded} />;
    } else if (settings.instrument === 'bass') {
      return <FourStringDiagram chordData={chord.guitar} {...props} instrument={settings.instrument} fiveString={settings.bassFiveString} />;
    } else {
      return <PianoDiagram chordData={chord.piano} {...props} />;
    }
  };

  const renderChordDetail = () => {
    if (!chord) return null;
    const favorite = favorites.includes(chord.id);
    const notesStr = chord.notes.join(' - ');
    const typeStr = chord.type.charAt(0).toUpperCase() + chord.type.slice(1) + ' Chord';
    const relatedChords = getRelatedChords(chord);

    return (
      <div className="flex-1 overflow-y-auto no-scrollbar p-6" style={{ background: 'var(--app-bg)' }}>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1" style={{ fontFamily: 'Manrope' }}>
                {t.chord.instruments[settings.instrument]}
              </p>
              <h2 className="text-3xl font-extrabold tracking-tighter text-[var(--c-text-primary)]" style={{ fontFamily: 'Manrope' }}>
                {chord.name}
              </h2>
              <p className="text-xs text-[var(--c-text-secondary)] mt-1" style={{ fontFamily: 'Inter' }}>
                {notesStr} ({typeStr})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlayChord}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: chordPlaying ? "'FILL' 1" : "'FILL' 0" }}>
                  {chordPlaying ? 'stop' : 'play_arrow'}
                </span>
              </button>
              <button
                onClick={() => toggleFavorite(chord.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 ${favorite ? 'text-rose-500' : 'text-zinc-400'}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: favorite ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
              <button
                onClick={() => addToProgression(chord.id)}
                className="h-10 px-4 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-zinc-800 bg-zinc-950/40 text-zinc-300 text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'Manrope' }}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl p-6 flex justify-center items-center">
            {renderDetailDiagram()}
          </div>

          {settings.chordAssistant && settings.assistantSmartSuggestions && relatedChords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-500" style={{ fontFamily: 'Inter' }}>
                {t.chord.voicings}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {relatedChords.slice(0, 2).map(related => (
                  <button
                    key={related.id}
                    onClick={() => handleChordClick(related.id)}
                    className="block text-left p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all cursor-pointer w-full relative"
                  >
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
                      <RelatedPlayBtn guitar={related.guitar} accent={accent} isLight={isLight} />
                    </div>
                    <span className="font-bold text-[var(--c-text-primary)] text-xs block mb-2" style={{ fontFamily: 'Manrope' }}>
                      {related.name}
                    </span>
                    <div className="bg-black/40 rounded-lg p-3">
                      <ChordDiagram data={related.guitar} accentFrom={accent.from} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeCategoryObject = CATEGORIES.find(c => c.type === activeType);

  const mainView = (
    <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef}>
      <header className="relative z-10 px-6 pt-12 pb-6 flex justify-between items-start">
        <div>
          <h1 className="font-headline-lg-mobile text-3xl text-on-surface tracking-tight mb-1" style={{ fontFamily: 'Manrope' }}>Library</h1>
          <p className="font-label-md text-xs text-on-surface-variant tracking-widest uppercase opacity-60">Explore {allChords.length} Chords</p>
        </div>
        <InkThemeToggle />
      </header>

      {/* Action shortcuts row (Finder & Generator) */}
      <div className="px-6 mb-4 flex gap-2">
        <button
          onClick={() => setShowFinder(true)}
          className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-2 text-zinc-100 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
          style={{ fontFamily: 'Manrope' }}
        >
          <span className="material-symbols-outlined text-primary text-base">add_circle</span>
          Chord Finder
        </button>
        <button
          onClick={() => setShowGenerator(true)}
          className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-2 text-zinc-100 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
          style={{ fontFamily: 'Manrope' }}
        >
          <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
          Generator
        </button>
      </div>

      {/* Sticky Search bar */}
      <div className="sticky top-0 z-30 px-6 mb-8 pt-4 pb-2 bg-black/85 backdrop-blur-xl">
        <div className="glass-surface rounded-full h-14 flex items-center px-6 gap-4 border border-white/5 relative">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            className="bg-transparent border-none outline-none flex-1 text-on-surface placeholder:text-on-surface-variant/40 font-body-lg"
            placeholder="Search chords..."
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          <button
            onClick={() => setShowTuningMenu(p => !p)}
            className="w-10 h-10 flex items-center justify-center text-primary active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>

          {/* Tuning options list popover */}
          {showTuningMenu && (
            <div className="absolute right-4 top-[calc(100%+8px)] w-60 rounded-2xl border border-zinc-850 bg-zinc-900 p-2 shadow-2xl z-50">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 px-3 py-2">
                Tuning System
              </div>
              {tunings.map(t => {
                const isCurrent = settings.tuning === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      updateSettings({ tuning: t.value });
                      setShowTuningMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex justify-between items-center transition-all ${isCurrent ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'}`}
                  >
                    <span>{t.label}</span>
                    {isCurrent && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {query ? (
        // Search Results state
        <div className="px-6 mb-8">
          <h2 className="font-title-md text-sm text-on-surface mb-4 uppercase tracking-wider">Search Results</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-zinc-500">No matching chords found</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleChordClick(c.id)}
                  className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all text-left cursor-pointer flex flex-col justify-between h-[110px]"
                >
                  <div>
                    <span className="font-bold text-[var(--c-text-primary)] text-xs block" style={{ fontFamily: 'Manrope' }}>
                      {c.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1" style={{ fontFamily: 'Inter' }}>
                      {c.notes.join(' · ')}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    {c.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeType ? (
        // Category chords listing
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveType(null)}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
            <h2 className="font-title-md text-sm text-on-surface uppercase tracking-wider">
              {activeCategoryObject?.label || 'Chords'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredByType.map(c => (
              <button
                key={c.id}
                onClick={() => handleChordClick(c.id)}
                className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all text-left cursor-pointer flex flex-col justify-between h-[110px]"
              >
                <div>
                  <span className="font-bold text-[var(--c-text-primary)] text-xs block" style={{ fontFamily: 'Manrope' }}>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-1" style={{ fontFamily: 'Inter' }}>
                    {c.notes.join(' · ')}
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  {c.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Explore view Default
        <>
          {/* Chord of the Day preview */}
          {chordOfTheDay && (
            <section className="px-6 mb-10">
              <div className="glass-surface rounded-3xl p-6 relative overflow-hidden border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-primary font-label-md text-[10px] uppercase tracking-[0.2em] mb-2 block" style={{ fontFamily: 'Manrope' }}>
                      Chord of the Day
                    </span>
                    <h2 className="text-4xl font-display-lg text-on-surface" style={{ fontFamily: 'Manrope', fontWeight: 800 }}>
                      {chordOfTheDay.name.split(' ')[0]} <span className="text-primary">{chordOfTheDay.name.split(' ').slice(1).join(' ')}</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      playChord(chordOfTheDay.guitar);
                    }}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 max-w-[200px]">
                    <ChordDiagram data={chordOfTheDay.guitar} accentFrom={accent.from} />
                  </div>
                  <button
                    onClick={() => handleChordClick(chordOfTheDay.id)}
                    className="px-5 py-2.5 rounded-full bg-on-surface text-background font-label-md text-xs uppercase tracking-wider font-extrabold ml-auto"
                    style={{ fontFamily: 'Manrope' }}
                  >
                    Practice
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Recently Practiced */}
          {recentChords.length > 0 && (
            <section className="relative z-10 mb-10">
              <div className="px-6 mb-4 flex justify-between items-center">
                <h2 className="font-title-md text-lg text-on-surface font-extrabold" style={{ fontFamily: 'Manrope' }}>Recently Practiced</h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x pb-2">
                {recentChords.slice(0, 4).map(rcId => {
                  const rc = getChordById(rcId);
                  if (!rc) return null;
                  return (
                    <div
                      key={rcId}
                      onClick={() => handleChordClick(rcId)}
                      className="flex-shrink-0 w-32 snap-start cursor-pointer hover:scale-[0.98] transition-transform"
                    >
                      <div className="glass-surface aspect-square rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden border border-white/5">
                        <div className="absolute top-2 right-2 opacity-20">
                          <span className="material-symbols-outlined text-[10px]">history</span>
                        </div>
                        <span className="text-on-surface-variant text-[8px] uppercase tracking-widest mb-1" style={{ fontFamily: 'Manrope' }}>
                          {rc.name}
                        </span>
                        <span className="text-4xl font-display-lg text-primary drop-shadow-[0_0_15px_rgba(173,198,255,0.3)]" style={{ fontFamily: 'Manrope', fontWeight: 800 }}>
                          {rc.name.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Categories Grid */}
          <section className="relative z-10 px-6 mb-12">
            <h2 className="font-title-md text-lg text-on-surface mb-6 font-extrabold" style={{ fontFamily: 'Manrope' }}>Categories</h2>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const isWide = cat.type === '7th';
                return (
                  <div
                    key={cat.type}
                    onClick={() => setActiveType(cat.type)}
                    className={`glass-surface rounded-2xl p-6 h-40 flex flex-col justify-between relative overflow-hidden group border border-white/5 cursor-pointer hover:bg-zinc-900/60 transition-colors ${isWide ? 'col-span-2' : ''}`}
                  >
                    <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-8xl text-primary transform rotate-12">{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-title-md text-base text-on-surface font-extrabold" style={{ fontFamily: 'Manrope' }}>{cat.label}</h3>
                      <p className="font-label-md text-xs text-on-surface-variant opacity-60" style={{ fontFamily: 'Manrope' }}>{cat.variations}</p>
                    </div>
                    {cat.type === 'major' && (
                      <div className="flex gap-1 items-end h-8">
                        <div className="w-1 bg-primary/40 h-[40%] rounded-full"></div>
                        <div className="w-1 bg-primary/40 h-[70%] rounded-full"></div>
                        <div className="w-1 bg-primary h-[100%] rounded-full"></div>
                        <div className="w-1 bg-primary/40 h-[60%] rounded-full"></div>
                      </div>
                    )}
                    {cat.type === 'minor' && (
                      <div className="flex gap-1 items-end h-8">
                        <div className="w-1 bg-on-surface-variant/20 h-[100%] rounded-full"></div>
                        <div className="w-1 bg-on-surface-variant/20 h-[40%] rounded-full"></div>
                        <div className="w-1 bg-on-surface-variant/20 h-[80%] rounded-full"></div>
                        <div className="w-1 bg-on-surface-variant/20 h-[50%] rounded-full"></div>
                      </div>
                    )}
                    {cat.type === '7th' && (
                      <div className="absolute right-6 bottom-6 w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(173,198,255,0.15)]">
                        <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden app-bg" style={{ position: 'relative' }}>
      {isWebDesktop ? (
        <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Left Column: Explorer */}
          <div style={{ width: '380px', borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {mainView}
          </div>
          {/* Right Column: Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {chord ? renderChordDetail() : <WebEmptyState message="Select a chord to view details" icon="music_note" />}
          </div>
        </div>
      ) : (
        // Mobile view - either details or main list
        selectedChordId ? (
          <div className="flex flex-col h-full overflow-hidden">
            <header className="flex-none px-4 pt-4 pb-2 border-b border-white/5 flex items-center gap-3">
              <button
                onClick={() => selectChord(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-300"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <span className="font-extrabold text-sm text-zinc-300" style={{ fontFamily: 'Manrope' }}>Back to Library</span>
            </header>
            {renderChordDetail()}
          </div>
        ) : (
          mainView
        )
      )}

      {/* Floating Action Modals */}
      {showFinder && (
        <Suspense fallback={null}>
          <CustomChordBuilder
            accent={accent}
            mode="find"
            onClose={() => setShowFinder(false)}
          />
        </Suspense>
      )}
      {showGenerator && (
        <Suspense fallback={null}>
          <ProgressionGenerator
            accent={accent}
            onClose={() => setShowGenerator(false)}
          />
        </Suspense>
      )}

      {activePracticeSong && (
        <SongPracticeView
          song={activePracticeSong}
          onClose={() => setActivePracticeSong(null)}
        />
      )}
    </div>
  );
}
