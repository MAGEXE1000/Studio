import React, { lazy, Suspense } from 'react';
import { useScrollHide } from '@workspace/studio-core';
import { EmptyState } from '../../../shared/design-system/StudioDesignSystem';
import { SongPracticeView } from './SongPracticeView';
import { SaxophonePracticePanel } from './SaxophonePracticePanel';
import { useLibraryState } from './useLibraryState';
import { LibraryMainView, LibraryChordDetail } from './LibraryUI';
import { SharedFloatingHeader } from '../../../shared/layout/StudioLayoutSystem';

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
        <div className="flex flex-col h-full overflow-hidden relative">
          <SharedFloatingHeader
            title={chord?.name || 'Chord Details'}
            onBack={() => selectChord(null)}
          />
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)',
            }}
          >
            <LibraryChordDetail state={state} />
          </div>
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
