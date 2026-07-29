import React, { lazy, Suspense } from 'react';
import { useScrollHide } from '@workspace/studio-core';
import { EmptyState } from '../../../shared/design-system/StudioDesignSystem';
import { SongPracticeView } from './SongPracticeView';
import { SaxophonePracticePanel } from './SaxophonePracticePanel';
import { useLibraryState } from './useLibraryState';
import { LibraryMainView, LibraryChordDetail } from './LibraryUI';

const CustomChordBuilder = lazy(() => import('../components/CustomChordBuilder'));
const ProgressionGenerator = lazy(() => import('../components/ProgressionGenerator'));

export default function LibraryPanel() {
  const state = useLibraryState();

  const {
    settings,
    isWebDesktop,
    selectedChordId,
    selectChord,
    showFinder,
    setShowFinder,
    showGenerator,
    setShowGenerator,
    activePracticeSong,
    setActivePracticeSong,
    accent,
    chord
  } = state;

  useScrollHide(state.scrollRef);

  if (settings.instrument === 'saxophone') {
    return <SaxophonePracticePanel />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden app-bg" style={{ position: 'relative' }}>
      {isWebDesktop ? (
        <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* Left Column: Explorer */}
          <div
            style={{
              width: '380px',
              borderRight: '1px solid var(--c-border)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <LibraryMainView state={state} />
          </div>
          {/* Right Column: Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {chord ? (
              <LibraryChordDetail state={state} />
            ) : (
              <EmptyState message="Select a chord to view details" icon="music_note" />
            )}
          </div>
        </div>
      ) : // Mobile view - either details or main list
      selectedChordId ? (
        <div className="flex flex-col h-full overflow-hidden">
          <header className="flex-none px-4 pt-4 pb-2 border-b border-white/5 flex items-center gap-3">
            <button
              onClick={() => selectChord(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
            <span
              className="font-extrabold text-sm text-zinc-300"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Back to Library
            </span>
          </header>
          <LibraryChordDetail state={state} />
        </div>
      ) : (
        <LibraryMainView state={state} />
      )}

      {/* Floating Action Modals */}
      {showFinder && (
        <Suspense fallback={null}>
          <CustomChordBuilder accent={accent} mode="find" onClose={() => setShowFinder(false)} />
        </Suspense>
      )}
      {showGenerator && (
        <Suspense fallback={null}>
          <ProgressionGenerator accent={accent} onClose={() => setShowGenerator(false)} />
        </Suspense>
      )}

      {activePracticeSong && (
        <SongPracticeView song={activePracticeSong} onClose={() => setActivePracticeSong(null)} />
      )}
    </div>
  );
}
