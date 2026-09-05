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
    chord,
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
              width: '420px',
              minWidth: '380px',
              maxWidth: '480px',
              borderRight: '1px solid var(--c-border)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <LibraryMainView state={state} />
          </div>
          {/* Right Column: Interactive Chord Preview */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {chord ? (
              <LibraryChordDetail state={state} />
            ) : state.chordOfTheDay ? (
              <LibraryChordDetail
                state={{ ...state, chord: state.chordOfTheDay }}
                isDefaultPreview={true}
              />
            ) : (
              <EmptyState message="Select a chord to view details" icon="music_note" />
            )}
          </div>
        </div>
      ) : // Mobile view - either details or main list
      selectedChordId ? (
        <LibraryChordDetail state={state} onBack={() => selectChord(null)} />
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
