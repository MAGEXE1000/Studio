import React, { useState, useCallback, useMemo } from 'react';
import {
  getChordById,
  getRelatedChords,
  playChord,
  stopChordPlayback,
  type GuitarChordData,
  useSettingsStore,
  useT,
  type Instrument,
} from '@workspace/studio-core';
import GuitarDiagram from '../diagrams/GuitarDiagram';
import PianoDiagram from '../diagrams/PianoDiagram';
import FourStringDiagram from '../diagrams/FourStringDiagram';
import { CATEGORIES } from './LibraryCategories';
import { ROOT_NOTES } from './useLibraryState';
import { HeroChordRecess, CategoryMiniRecess, ChordCardMiniRecess } from '../components/MiniFretboardRecess';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { Button, ActionButton } from '../../../shared/design-system/buttons';

export function RelatedPlayBtn({
  guitar,
  accent,
  isLight,
}: {
  guitar: GuitarChordData;
  accent?: { from: string; to: string; mid: string };
  isLight?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (playing) {
        stopChordPlayback();
        setPlaying(false);
        return;
      }
      setPlaying(true);
      playChord(guitar);
      setTimeout(() => setPlaying(false), 2800);
    },
    [guitar, playing]
  );

  return (
    <button
      aria-label="Play chord audio"
      onClick={handlePlay}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
      style={{
        background: playing
          ? 'color-mix(in srgb, var(--c-accent-from, #679cff) 25%, transparent)'
          : 'var(--c-surface-high, rgba(255,255,255,0.06))',
        border: '1px solid var(--c-border)',
        cursor: 'pointer',
        padding: 0,
        boxShadow: playing ? '0 0 10px var(--c-accent-from, #679cff)' : 'none',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '16px',
          color: playing ? 'var(--c-accent-from, #679cff)' : 'var(--c-text-primary)',
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {playing ? 'stop' : 'play_arrow'}
      </span>
    </button>
  );
}

export function LibraryChordDetail({
  state,
  isDefaultPreview = false,
}: {
  state: any;
  isDefaultPreview?: boolean;
}) {
  const {
    chord,
    favorites,
    settings,
    toggleFavorite,
    addToProgression,
    chordPlaying,
    setChordPlaying,
    handleChordClick,
    accent,
    isLight,
    previewInstrument,
    setPreviewInstrument,
    diagramDisplayMode,
    setDiagramDisplayMode,
  } = state;
  const t = useT();

  if (!chord) return null;
  const favorite = favorites.includes(chord.id);
  const notesStr = chord.notes.join(' - ');
  const typeStr = chord.type.charAt(0).toUpperCase() + chord.type.slice(1) + ' Chord';
  const relatedChords = useMemo(() => getRelatedChords(chord), [chord]);

  const activeInstrument: Instrument = previewInstrument || settings.instrument || 'guitar';

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
      showNoteNames: diagramDisplayMode === 'notes',
      showIntervals: diagramDisplayMode === 'intervals',
      size: 'lg' as const,
    };

    if (activeInstrument === 'guitar') {
      return <GuitarDiagram chordData={chord.guitar} {...props} leftHanded={settings.leftHanded} />;
    } else if (activeInstrument === 'bass') {
      return (
        <FourStringDiagram
          chordData={chord.guitar}
          {...props}
          instrument="bass"
          fiveString={settings.bassFiveString}
        />
      );
    } else {
      return <PianoDiagram chordData={chord.piano} {...props} />;
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Default Preview Header Badge if desktop empty preview */}
        {isDefaultPreview && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--c-surface-low)] border border-[var(--c-border)] w-fit">
            <span className="material-symbols-outlined text-xs text-[var(--c-accent-from)]">stars</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-secondary)]">
              Featured Chord Preview
            </span>
          </div>
        )}

        {/* Hero Card Header */}
        <div className="bento-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[10px] uppercase tracking-wider font-bold text-[var(--c-accent-from)]">
                  {activeInstrument.toUpperCase()} · {chord.type.toUpperCase()}
                </span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-extrabold text-[var(--c-text-primary)] tracking-tight"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {chord.name}
              </h2>
              <p
                className="text-sm text-[var(--c-text-secondary)] mt-1 font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {notesStr} <span className="opacity-60">({typeStr})</span>
              </p>
            </div>

            {/* Action Buttons Top */}
            <div className="flex gap-2 items-center">
              <Button
                variant={chordPlaying ? 'primary' : 'secondary'}
                onClick={handlePlayChord}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0 }}
                aria-label={chordPlaying ? 'Stop Audio' : 'Play Chord'}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{
                    fontVariationSettings: chordPlaying ? "'FILL' 1" : "'FILL' 1",
                  }}
                >
                  {chordPlaying ? 'stop' : 'play_arrow'}
                </span>
              </Button>
              <ActionButton
                variant="favorite"
                isFavorite={favorite}
                onClick={() => toggleFavorite(chord.id)}
                iconSize={22}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0 }}
              />
              <Button
                variant="secondary"
                onClick={() => addToProgression(chord.id)}
                icon="add"
                style={{ height: 44, borderRadius: '22px', paddingLeft: '14px', paddingRight: '16px' }}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Instrument Switcher & Display Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--c-border)]">
            <div className="flex bg-[var(--c-surface-lowest)] p-1 rounded-full border border-[var(--c-border)] gap-1">
              {(['guitar', 'bass', 'piano'] as Instrument[]).map((inst) => {
                const isActive = activeInstrument === inst;
                return (
                  <button
                    key={inst}
                    onClick={() => setPreviewInstrument(inst)}
                    className="px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all"
                    style={{
                      backgroundColor: isActive ? 'var(--c-accent-from, #679cff)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--c-text-secondary)',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {inst}
                  </button>
                );
              })}
            </div>

            <div className="flex bg-[var(--c-surface-lowest)] p-1 rounded-full border border-[var(--c-border)] gap-1">
              <button
                onClick={() => setDiagramDisplayMode('notes')}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: diagramDisplayMode === 'notes' ? 'var(--c-surface-high)' : 'transparent',
                  color: diagramDisplayMode === 'notes' ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
                }}
              >
                Notes
              </button>
              <button
                onClick={() => setDiagramDisplayMode('intervals')}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: diagramDisplayMode === 'intervals' ? 'var(--c-surface-high)' : 'transparent',
                  color: diagramDisplayMode === 'intervals' ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
                }}
              >
                Intervals
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Visualizer Surface */}
        <div className="bento-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex justify-center py-2">{renderDetailDiagram()}</div>
          
          {/* Notes Interval Breakdown Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--c-border)] w-full">
            {chord.notes.map((note: string, idx: number) => {
              const interval = chord.intervals[idx] || (idx === 0 ? '1' : '');
              return (
                <div
                  key={`${note}-${idx}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--c-surface-lowest)] border border-[var(--c-border)]"
                >
                  <span className="font-bold text-xs text-[var(--c-text-primary)]">{note}</span>
                  <span className="text-[10px] font-semibold text-[var(--c-accent-from)] bg-[var(--c-surface-high)] px-1.5 py-0.5 rounded-md">
                    {interval}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Suggestions & Related Voicings */}
        {relatedChords.length > 0 && (
          <div className="space-y-3">
            <h3
              className="text-xs font-extrabold uppercase tracking-wider text-[var(--c-text-secondary)] px-1"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {t.chord.voicings} & Related Chords
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedChords.slice(0, 4).map((related) => (
                <div
                  key={related.id}
                  onClick={() => handleChordClick(related.id)}
                  className="bento-card p-4 flex flex-col justify-between hover:bg-[var(--c-surface-high)] transition-all cursor-pointer group relative active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span
                        className="font-bold text-[var(--c-text-primary)] text-sm block"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {related.name}
                      </span>
                      <span className="text-[10px] text-[var(--c-text-secondary)] block">
                        {related.notes.join(' · ')}
                      </span>
                    </div>
                    <RelatedPlayBtn guitar={related.guitar} accent={accent} isLight={isLight} />
                  </div>
                  <div className="w-full flex justify-center pt-1">
                    <HeroChordRecess chordData={related.guitar} className="w-full max-w-[140px] h-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LibraryMainView({ state }: { state: any }) {
  const {
    scrollRef,
    allChords,
    setShowFinder,
    setShowGenerator,
    query,
    setQuery,
    showTuningMenu,
    setShowTuningMenu,
    settings,
    searchResults,
    handleChordClick,
    activeType,
    setActiveType,
    activeCategoryObject,
    filteredByType,
    chordOfTheDay,
    accent,
    isLight,
    recentChords,
    showAllCategories,
    toggleShowAllCategories,
    selectedRootFilter,
    setSelectedRootFilter,
  } = state;
  const t = useT();

  const [dayChordPlaying, setDayChordPlaying] = useState(false);

  const tunings = [
    { label: t.settings.tunings.standard, value: 'Standard (EADGBE)' },
    { label: t.settings.tunings.dropD, value: 'Drop D (DADGBE)' },
    { label: t.settings.tunings.openG, value: 'Open G (DGDGBD)' },
    { label: t.settings.tunings.openD, value: 'Open D (DADF#AD)' },
    { label: 'DADGAD', value: 'DADGAD' },
  ];

  const handlePlayDayChord = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!chordOfTheDay) return;
      if (dayChordPlaying) {
        stopChordPlayback();
        setDayChordPlaying(false);
        return;
      }
      setDayChordPlaying(true);
      playChord(chordOfTheDay.guitar);
      setTimeout(() => setDayChordPlaying(false), 2800);
    },
    [chordOfTheDay, dayChordPlaying]
  );

  // Top 4 categories displayed initially
  const visibleCategories = useMemo(() => {
    return showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 4);
  }, [showAllCategories]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef} style={{ background: 'var(--app-bg)' }}>
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-12 space-y-6">
        {/* Header & Quick Action Buttons */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2
                className="text-4xl md:text-5xl font-extrabold text-[var(--c-text-primary)] tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                Library
              </h2>
              <p
                className="text-sm text-[var(--c-text-secondary)] mt-1.5 font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Explore {allChords.length} Chords
              </p>
            </div>
            
            {/* Quick action tools */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinder(true)}
                icon="add_circle"
                style={{ borderRadius: '12px', height: '36px' }}
              >
                Finder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerator(true)}
                icon="auto_awesome"
                style={{ borderRadius: '12px', height: '36px' }}
              >
                Generator
              </Button>
            </div>
          </div>

          {/* Pill Search & Tuning Filter Bar */}
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-text-secondary)] pointer-events-none"
              data-icon="search"
              style={{ fontSize: '20px' }}
            >
              search
            </span>
            <input
              className="w-full bg-[var(--c-surface-low)] border border-[var(--c-border)] rounded-full py-4 pl-12 pr-12 text-sm md:text-base text-[var(--c-text-primary)] placeholder:text-[var(--c-text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--c-accent-from)]/50 focus:border-[var(--c-accent-from)]/50 transition-all"
              placeholder="Search chords..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-11 top-1/2 -translate-y-1/2 text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)] p-1 transition-colors"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            ) : null}
            <button
              onClick={() => setShowTuningMenu((p: boolean) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--c-text-secondary)] hover:text-[var(--c-accent-from)] transition-colors p-1"
              aria-label="Tuning system filter"
            >
              <span className="material-symbols-outlined text-lg" data-icon="tune">tune</span>
            </button>

            {/* Tuning Popover Dropdown */}
            {showTuningMenu && (
              <div
                className="absolute right-2 top-[calc(100%+8px)] w-64 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: 'var(--c-surface-high)',
                  border: '1px solid var(--c-border)',
                  boxShadow: 'var(--elevation-high, 0 10px 30px rgba(0,0,0,0.5))',
                }}
              >
                <div
                  className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-2"
                  style={{ color: 'var(--c-text-secondary)' }}
                >
                  Tuning System
                </div>
                {tunings.map((tu) => {
                  const isCurrent = settings.tuning === tu.value;
                  return (
                    <Button
                      key={tu.value}
                      variant="ghost"
                      onClick={() => {
                        useSettingsStore.getState().updateSettings({ tuning: tu.value });
                        setShowTuningMenu(false);
                      }}
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        background: isCurrent ? 'var(--c-surface-lowest)' : 'transparent',
                        color: isCurrent ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                        borderRadius: '8px',
                        marginBottom: '2px',
                      }}
                    >
                      <span className="text-xs font-semibold">{tu.label}</span>
                      {isCurrent && (
                        <span className="material-symbols-outlined text-[var(--c-accent-from)] text-sm">
                          check
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SEARCH RESULTS VIEW */}
        {query ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-lg text-[var(--c-text-primary)] font-bold">
                Search Results ({searchResults.length})
              </h3>
            </div>

            {/* Root note quick filter pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
              {ROOT_NOTES.map((root) => {
                const isSelected = selectedRootFilter === root;
                return (
                  <button
                    key={root}
                    onClick={() => setSelectedRootFilter(root)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--c-accent-from, #679cff)'
                        : 'var(--c-surface-low)',
                      color: isSelected ? '#ffffff' : 'var(--c-text-secondary)',
                      border: isSelected
                        ? '1px solid transparent'
                        : '1px solid var(--c-border)',
                    }}
                  >
                    {root}
                  </button>
                );
              })}
            </div>

            {searchResults.length === 0 ? (
              <div className="bento-card p-8 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-[var(--c-text-muted)]">search_off</span>
                <p className="text-sm text-[var(--c-text-secondary)] font-medium">
                  No matching chords found for "{query}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {searchResults.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => handleChordClick(c.id)}
                    className="bento-card p-4 flex items-center justify-between hover:bg-[var(--c-surface-high)] transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                      <div>
                        <h4
                          className="font-bold text-[var(--c-text-primary)] text-base truncate"
                          style={{ fontFamily: 'var(--font-headline)' }}
                        >
                          {c.name}
                        </h4>
                        <span className="text-[10px] text-[var(--c-text-secondary)] block truncate mt-0.5">
                          {c.notes.join(' · ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--c-accent-from)] bg-[var(--c-surface-lowest)] px-1.5 py-0.5 rounded">
                          {c.type}
                        </span>
                        <RelatedPlayBtn guitar={c.guitar} accent={accent} isLight={isLight} />
                      </div>
                    </div>
                    <HeroChordRecess chordData={c.guitar} className="w-14 h-14 rounded-lg flex-none" style={{ width: '56px', height: '56px' }} />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : activeType ? (
          /* CATEGORY DRILL-DOWN VIEW */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveType(null)}
                  className="w-8 h-8 rounded-full bg-[var(--c-surface-low)] border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text-primary)] hover:bg-[var(--c-surface-high)] transition-colors"
                  aria-label="Back to Categories"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <div>
                  <h3 className="font-headline-md text-lg text-[var(--c-text-primary)] font-bold">
                    {activeCategoryObject?.label || 'Chords'}
                  </h3>
                  <span className="text-xs text-[var(--c-text-secondary)]">
                    {filteredByType.length} Chords
                  </span>
                </div>
              </div>
            </div>

            {/* Root note quick filter pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
              {ROOT_NOTES.map((root) => {
                const isSelected = selectedRootFilter === root;
                return (
                  <button
                    key={root}
                    onClick={() => setSelectedRootFilter(root)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--c-accent-from, #679cff)'
                        : 'var(--c-surface-low)',
                      color: isSelected ? '#ffffff' : 'var(--c-text-secondary)',
                      border: isSelected
                        ? '1px solid transparent'
                        : '1px solid var(--c-border)',
                    }}
                  >
                    {root}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredByType.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => handleChordClick(c.id)}
                  className="bento-card p-4 flex items-center justify-between hover:bg-[var(--c-surface-high)] transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                    <div>
                      <h4
                        className="font-bold text-[var(--c-text-primary)] text-base truncate"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {c.name}
                      </h4>
                      <span className="text-[10px] text-[var(--c-text-secondary)] block truncate mt-0.5">
                        {c.notes.join(' · ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--c-accent-from)] bg-[var(--c-surface-lowest)] px-1.5 py-0.5 rounded">
                        {c.type}
                      </span>
                      <RelatedPlayBtn guitar={c.guitar} accent={accent} isLight={isLight} />
                    </div>
                  </div>
                  <HeroChordRecess chordData={c.guitar} className="w-14 h-14 rounded-lg flex-none" style={{ width: '56px', height: '56px' }} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* MAIN LIBRARY DASHBOARD */
          <>
            {/* Chord of the Day Bento Card */}
            {chordOfTheDay && (
              <section className="bento-card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--c-accent-from)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <span className="font-label-caps text-[10px] text-[var(--c-accent-from)] uppercase tracking-wider font-bold block mb-1">
                      Chord of the Day
                    </span>
                    <h3
                      className="text-4xl md:text-5xl font-extrabold text-[var(--c-text-primary)] leading-none tracking-tight"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {chordOfTheDay.name}
                    </h3>
                  </div>
                  <button
                    onClick={handlePlayDayChord}
                    className="w-12 h-12 rounded-full bg-[var(--c-surface-high)] flex items-center justify-center hover:bg-[var(--c-surface-highest)] transition-colors active:scale-95 border border-[var(--c-border)] shadow-lg"
                    aria-label="Play chord of the day"
                  >
                    <span
                      className="material-symbols-outlined text-[var(--c-text-primary)] text-2xl"
                      data-icon="play_arrow"
                      style={{ fontVariationSettings: dayChordPlaying ? "'FILL' 1" : "'FILL' 1" }}
                    >
                      {dayChordPlaying ? 'stop' : 'play_arrow'}
                    </span>
                  </button>
                </div>

                <div className="flex items-end justify-between relative z-10 gap-4">
                  {/* Dynamic Mini Fretboard Recess */}
                  <HeroChordRecess chordData={chordOfTheDay.guitar} />

                  <button
                    onClick={() => handleChordClick(chordOfTheDay.id)}
                    className="bg-[var(--c-accent-from, #679cff)] text-white dark:text-black font-body-md font-bold px-6 py-3 rounded-full hover:opacity-95 shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Practice</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}

            {/* Recently Practiced Chords */}
            {recentChords.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-headline-md text-base text-[var(--c-text-primary)] font-bold px-1">
                  Recently Practiced
                </h3>
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-1 snap-x">
                  {recentChords.slice(0, 6).map((rcId: string) => {
                    const rc = getChordById(rcId);
                    if (!rc) return null;
                    return (
                      <div
                        key={rcId}
                        onClick={() => handleChordClick(rcId)}
                        className="bento-card p-3.5 flex-shrink-0 w-32 snap-start cursor-pointer hover:bg-[var(--c-surface-high)] transition-all active:scale-95 relative flex flex-col justify-between h-28"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-[var(--c-text-muted)] uppercase tracking-wider">
                            {rc.type}
                          </span>
                          <span className="material-symbols-outlined text-xs text-[var(--c-text-muted)] opacity-50">
                            history
                          </span>
                        </div>
                        <span
                          className="text-2xl font-extrabold text-[var(--c-text-primary)]"
                          style={{ fontFamily: 'var(--font-headline)' }}
                        >
                          {rc.name}
                        </span>
                        <span className="text-[9px] text-[var(--c-text-secondary)] truncate">
                          {rc.notes.join(' · ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Categories Grid Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-headline-md text-xl text-[var(--c-text-primary)] font-bold">
                  Categories
                </h3>
                <span className="text-xs text-[var(--c-text-secondary)] font-medium">
                  {CATEGORIES.length} Harmonic Flavors
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {visibleCategories.map((cat) => (
                  <div
                    key={cat.type}
                    onClick={() => setActiveType(cat.type)}
                    className="bento-card p-4 flex items-center justify-between hover:bg-[var(--c-surface-high)] transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                      <h4
                        className="font-body-lg text-base font-bold text-[var(--c-text-primary)] truncate"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {cat.label}
                      </h4>
                      <span className="font-label-caps text-[10px] text-[var(--c-text-secondary)] font-semibold mt-1">
                        {cat.variations}
                      </span>
                    </div>
                    <CategoryMiniRecess dots={cat.dots} />
                  </div>
                ))}
              </div>

              {/* Show All / Show Less Toggle Button */}
              <button
                onClick={toggleShowAllCategories}
                className="w-full mt-4 py-3.5 bento-card text-[var(--c-accent-from, #679cff)] font-body-md font-semibold flex items-center justify-center gap-2 hover:bg-[var(--c-surface-high)] transition-all active:scale-98 cursor-pointer shadow-sm"
              >
                <span>{showAllCategories ? 'Show Less' : `Show All (${CATEGORIES.length} Categories)`}</span>
                <span className="material-symbols-outlined text-lg" data-icon={showAllCategories ? 'expand_less' : 'expand_more'}>
                  {showAllCategories ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

