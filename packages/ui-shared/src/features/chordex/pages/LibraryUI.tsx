import React, { useState, useCallback } from 'react';
import {
  getChordById,
  getRelatedChords,
  playChord,
  stopChordPlayback,
  type GuitarChordData,
  useSettingsStore,
  useT
} from '@workspace/studio-core';
import ChordDiagram from '../diagrams/ChordDiagram';
import GuitarDiagram from '../diagrams/GuitarDiagram';
import PianoDiagram from '../diagrams/PianoDiagram';
import FourStringDiagram from '../diagrams/FourStringDiagram';
import { CATEGORIES } from './LibraryCategories';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { Button, ActionButton } from '../../../shared/design-system/buttons';

export function RelatedPlayBtn({
  guitar,
  accent,
  isLight,
}: {
  guitar: GuitarChordData;
  accent: { from: string; to: string; mid: string };
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
      aria-label="Play chord"
      onClick={handlePlay}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: playing
          ? `${accent.from}30`
          : isLight
            ? 'rgba(0,0,0,0.06)'
            : 'rgba(255,255,255,0.07)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'background 200ms ease',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '13px',
          color: playing ? accent.from : 'var(--c-text-secondary)',
          fontVariationSettings: "'FILL' 1",
          transition: 'color 200ms ease',
        }}
      >
        {playing ? 'stop' : 'play_arrow'}
      </span>
    </button>
  );
}

export function LibraryChordDetail({ state }: { state: any }) {
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
    isLight
  } = state;
  const t = useT();

  if (!chord) return null;
  const favorite = favorites.includes(chord.id);
  const notesStr = chord.notes.join(' - ');
  const typeStr = chord.type.charAt(0).toUpperCase() + chord.type.slice(1) + ' Chord';
  const relatedChords = getRelatedChords(chord);

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
      return (
        <FourStringDiagram
          chordData={chord.guitar}
          {...props}
          instrument={settings.instrument}
          fiveString={settings.bassFiveString}
        />
      );
    } else {
      return <PianoDiagram chordData={chord.piano} {...props} />;
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar p-6"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {t.chord.instruments[settings.instrument as keyof typeof t.chord.instruments]}
            </p>
            <h2
              className="text-3xl font-extrabold tracking-tighter text-[var(--c-text-primary)]"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {chord.name}
            </h2>
            <p
              className="text-xs text-[var(--c-text-secondary)] mt-1"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {notesStr} ({typeStr})
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handlePlayChord}
              style={{ borderRadius: '50%', width: 40, height: 40, padding: 0 }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  fontVariationSettings: chordPlaying ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {chordPlaying ? 'stop' : 'play_arrow'}
              </span>
            </Button>
            <ActionButton
              variant="favorite"
              isFavorite={favorite}
              onClick={() => toggleFavorite(chord.id)}
              iconSize={20}
              style={{ borderRadius: '50%', width: 40, height: 40, padding: 0 }}
            />
            <Button
              variant="secondary"
              onClick={() => addToProgression(chord.id)}
              icon="add"
              style={{ height: 40, borderRadius: '20px' }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl p-6 flex justify-center items-center">
          {renderDetailDiagram()}
        </div>

        {settings.chordAssistant &&
          settings.assistantSmartSuggestions &&
          relatedChords.length > 0 && (
            <div className="space-y-3">
              <h3
                className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-500"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t.chord.voicings}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {relatedChords.slice(0, 2).map((related) => (
                  <button
                    key={related.id}
                    onClick={() => handleChordClick(related.id)}
                    className="block text-left p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all cursor-pointer w-full relative"
                  >
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
                      <RelatedPlayBtn guitar={related.guitar} accent={accent} isLight={isLight} />
                    </div>
                    <span
                      className="font-bold text-[var(--c-text-primary)] text-xs block mb-2"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
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
    recentChords,
  } = state;
  const t = useT();

  const tunings = [
    { label: t.settings.tunings.standard, value: 'Standard (EADGBE)' },
    { label: t.settings.tunings.dropD, value: 'Drop D (DADGBE)' },
    { label: t.settings.tunings.openG, value: 'Open G (DGDGBD)' },
    { label: t.settings.tunings.openD, value: 'Open D (DADF#AD)' },
    { label: 'DADGAD', value: 'DADGAD' },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef}>
      <StudioHeader
        title="Library"
        subtitle={`Explore ${allChords.length} Chords`}
      />

      <div className="px-6 mb-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFinder(true)}
          icon="add_circle"
          style={{ flex: 1, height: 44, borderRadius: '12px' }}
        >
          Chord Finder
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowGenerator(true)}
          icon="auto_awesome"
          style={{ flex: 1, height: 44, borderRadius: '12px' }}
        >
          Generator
        </Button>
      </div>

      <div className="sticky top-0 z-30 px-6 mb-8 pt-4 pb-2 bg-black/85 backdrop-blur-xl">
        <div className="glass-surface rounded-full h-14 flex items-center px-6 gap-4 border border-white/5 relative">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            className="bg-transparent border-none outline-none flex-1 text-on-surface placeholder:text-on-surface-variant/40 font-body-lg"
            placeholder="Search chords..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTuningMenu((p: boolean) => !p)}
            style={{ width: 40, height: 40, color: 'var(--c-accent-from)' }}
            icon="tune"
          />

          {showTuningMenu && (
            <div className="absolute right-4 top-[calc(100%+8px)] w-60 rounded-2xl border border-zinc-850 bg-zinc-900 p-2 shadow-2xl z-50">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 px-3 py-2">
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
                      background: isCurrent ? 'var(--c-surface-high, #27272a)' : 'transparent',
                      color: isCurrent ? 'var(--c-text-primary, #ffffff)' : 'var(--c-text-secondary, #a1a1aa)',
                      borderRadius: '8px',
                    }}
                  >
                    <span>{tu.label}</span>
                    {isCurrent && (
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {query ? (
        <div className="px-6 mb-8">
          <h2 className="font-title-md text-sm text-on-surface mb-4 uppercase tracking-wider">
            Search Results
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-zinc-500">No matching chords found</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => handleChordClick(c.id)}
                  className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all text-left cursor-pointer flex items-center justify-between h-[110px] w-full"
                >
                  <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                    <div>
                      <span
                        className="font-bold text-[var(--c-text-primary)] text-xs block truncate"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="text-[10px] text-zinc-500 block mt-1 truncate"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {c.notes.join(' · ')}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mt-2">
                      {c.type}
                    </span>
                  </div>
                  <div className="w-16 h-16 flex-none bg-black/40 rounded-xl p-1.5 overflow-hidden flex items-center justify-center">
                    <ChordDiagram data={c.guitar} accentFrom={accent.from} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeType ? (
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setActiveType(null)}
              style={{ borderRadius: '50%', width: 32, height: 32 }}
              icon="arrow_back"
            />
            <h2 className="font-title-md text-sm text-on-surface uppercase tracking-wider">
              {activeCategoryObject?.label || 'Chords'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredByType.map((c: any) => (
              <button
                key={c.id}
                onClick={() => handleChordClick(c.id)}
                className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all text-left cursor-pointer flex items-center justify-between h-[110px] w-full"
              >
                <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                  <div>
                    <span
                      className="font-bold text-[var(--c-text-primary)] text-xs block truncate"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {c.name}
                    </span>
                    <span
                      className="text-[10px] text-zinc-500 block mt-1 truncate"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {c.notes.join(' · ')}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mt-2">
                    {c.type}
                  </span>
                </div>
                <div className="w-16 h-16 flex-none bg-black/40 rounded-xl p-1.5 overflow-hidden flex items-center justify-center">
                  <ChordDiagram data={c.guitar} accentFrom={accent.from} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {chordOfTheDay && (
            <section className="px-6 mb-10">
              <div className="glass-surface rounded-3xl p-6 relative overflow-hidden border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className="text-primary font-label-md text-[10px] uppercase tracking-[0.2em] mb-2 block"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      Chord of the Day
                    </span>
                    <h2
                      className="text-4xl font-display-lg text-on-surface"
                      style={{ fontFamily: 'var(--font-headline)', fontWeight: 800 }}
                    >
                      {chordOfTheDay.name.split(' ')[0]}{' '}
                      <span className="text-primary">
                        {chordOfTheDay.name.split(' ').slice(1).join(' ')}
                      </span>
                    </h2>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => {
                      playChord(chordOfTheDay.guitar);
                    }}
                    style={{ borderRadius: '50%', width: 48, height: 48 }}
                  >
                    <span
                      className="material-symbols-outlined text-primary text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                  </Button>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 max-w-[200px]">
                    <ChordDiagram data={chordOfTheDay.guitar} accentFrom={accent.from} />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleChordClick(chordOfTheDay.id)}
                    style={{ marginLeft: 'auto' }}
                  >
                    Practice
                  </Button>
                </div>
              </div>
            </section>
          )}

          {recentChords.length > 0 && (
            <section className="relative z-10 mb-10">
              <div className="px-6 mb-4 flex justify-between items-center">
                <h2
                  className="font-title-md text-lg text-on-surface font-extrabold"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Recently Practiced
                </h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x pb-2">
                {recentChords.slice(0, 4).map((rcId: string) => {
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
                        <span
                          className="text-on-surface-variant text-[8px] uppercase tracking-widest mb-1"
                          style={{ fontFamily: 'var(--font-headline)' }}
                        >
                          {rc.name}
                        </span>
                        <span
                          className="text-4xl font-display-lg text-primary drop-shadow-[0_0_15px_rgba(173,198,255,0.3)]"
                          style={{ fontFamily: 'var(--font-headline)', fontWeight: 800 }}
                        >
                          {rc.name.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="relative z-10 px-6 mb-12">
            <h2
              className="font-title-md text-lg text-on-surface mb-6 font-extrabold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Categories
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const previewChord = allChords.find((c: any) => c.type === cat.type);
                return (
                  <div
                    key={cat.type}
                    onClick={() => setActiveType(cat.type)}
                    className="glass-surface rounded-2xl p-4 h-24 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex flex-col justify-between h-full flex-1 min-w-0 pr-2">
                      <h3
                        className="text-sm text-on-surface font-extrabold truncate"
                        style={{ fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}
                      >
                        {cat.label}
                      </h3>
                      <p
                        className="text-[10px] text-on-surface-variant opacity-60 mt-1"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {cat.variations}
                      </p>
                    </div>
                    {previewChord && (
                      <div className="w-16 h-16 flex-none bg-black/40 rounded-xl p-1.5 overflow-hidden flex items-center justify-center">
                        <ChordDiagram data={previewChord.guitar} accentFrom={accent.from} />
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
}
