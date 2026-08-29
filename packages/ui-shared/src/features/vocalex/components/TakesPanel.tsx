import { Dialog } from '../../../shared/design-system/dialogs';
import {
  useT,
  createAudioContext,
  useNavigationStore,
  NavigationDispatcher,
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  extractWaveformPeaks,
  blobToAudioBuffer,
  type TakeRecord,
  vocalexRepository,
} from '@workspace/studio-core';
import LoadingLottie from '../../../shared/lottie/LoadingLottie';
import SmartLoading from '../../../shared/loading/SmartLoading';
import { VocalexTakesSkeleton } from '../../../shared/loading/StudioSkeleton';
import EmptyStateLottie from '../../../shared/lottie/EmptyStateLottie';
import { analyzeAudio, type VocalAnalysis, type AnalysisLabels } from '../services/vocalAnalysis';
import HarmonizerSheet from './HarmonizerSheet';
import { clearTakeCache } from '../services/harmonyEngine';
import { Button } from '../../../shared/design-system/StudioDesignSystem';
import { StudioHeader } from '../../../shared/layout/StudioHeader';

import RecordingView from './RecordingView';
import TakeDetailView from './TakeDetailView';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDateI18n(
  ts: number,
  t: { today: string; yesterday: string; daysAgo: (n: number) => string }
): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000) {
    return `${t.today}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diff < 172800000) {
    return `${t.yesterday}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diff < 604800000) {
    return t.daysAgo(Math.floor(diff / 86400000));
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
type ViewState = { mode: 'list' } | { mode: 'recording' } | { mode: 'detail'; takeId: string };

export default function TakesPanel() {
  const t = useT();
  const [takes, setTakes] = useState<TakeRecord[]>([]);
  const currentRoute = useNavigationStore(useShallow((s) => s.history[s.history.length - 1])) || {
    app: 'hub',
  };
  const view = useMemo<ViewState>(() => {
    if (currentRoute.app === 'vocalex' && currentRoute.page === 'takes') {
      if (currentRoute.subView === 'recording') {
        return { mode: 'recording' };
      }
      if (currentRoute.subView === 'detail' && currentRoute.id) {
        return { mode: 'detail', takeId: currentRoute.id };
      }
    }
    return { mode: 'list' };
  }, [currentRoute]);
  const [loading, setLoading] = useState(true);

  const loadTakes = useCallback(async () => {
    try {
      const all = await vocalexRepository.getAllTakes();
      setTakes(all);
    } catch {
      /* empty */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTakes();
  }, [loadTakes]);

  const handleRecordingComplete = useCallback(
    async (take: TakeRecord) => {
      await vocalexRepository.saveTake(take);
      await loadTakes();
      NavigationDispatcher.push({ app: 'vocalex', page: 'takes', subView: 'detail', id: take.id });
    },
    [loadTakes]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await vocalexRepository.deleteTake(id);
      clearTakeCache(id);
      setTakes((prev) => prev.filter((t) => t.id !== id));
      if (view.mode === 'detail' && view.takeId === id) {
        NavigationDispatcher.pop();
      }
    },
    [view]
  );

  const handleSaveBounce = useCallback(
    async (newTake: TakeRecord) => {
      await vocalexRepository.saveTake(newTake);
      await loadTakes();
    },
    [loadTakes]
  );

  if (view.mode === 'recording') {
    return (
      <RecordingView
        onComplete={handleRecordingComplete}
        onCancel={() => NavigationDispatcher.pop()}
      />
    );
  }

  if (view.mode === 'detail') {
    const take = takes.find((t) => t.id === view.takeId);
    if (!take)
      return <div style={{ padding: 24, color: 'var(--vx-text-2)' }}>{t.vocalex.takeNotFound}</div>;
    return (
      <TakeDetailView
        take={take}
        onBack={() => NavigationDispatcher.pop()}
        onDelete={handleDelete}
        onSaveBounce={handleSaveBounce}
      />
    );
  }

  return (
    <div
      className="spring-in"
      style={{
        padding: '0 var(--page-header-inset-h, var(--page-inset-h, 24px)) 24px',
        minHeight: '100%',
      }}
    >
      <StudioHeader
        title={t.vocalex.takesTitle}
        subtitle={t.vocalex.takesSubtitle}
        disableHorizontalPadding={true}
        containerStyle={{ marginBottom: '12px' }}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <Button
          variant="secondary"
          style={{
            background: 'var(--vx-edge)',
            color: 'var(--vx-text)',
            borderRadius: 9999,
          }}
          icon="sort"
        >
          {t.vocalex.recent}
        </Button>
        <Button
          variant="primary"
          onClick={() => NavigationDispatcher.push({ app: 'vocalex', page: 'recorder' })}
          style={{
            background: 'var(--studio-accent)',
            color: '#fff',
            borderRadius: 9999,
            boxShadow: 'var(--studio-accent-glow)',
          }}
          icon="mic"
        >
          {t.vocalex.newTake}
        </Button>
      </div>

      {loading ? (
        <SmartLoading fallbackSkeleton={<VocalexTakesSkeleton />} />
      ) : takes.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--vx-card-2)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <EmptyStateLottie app="vocalex" size={56} style={{ marginBottom: 2 }} />
          <p
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--vx-text)',
              margin: 0,
            }}
          >
            {t.vocalex.noTakesYet}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--vx-text-2)',
              margin: 0,
            }}
          >
            {t.vocalex.noTakesHint}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {takes.map((take) => (
            <TakeListItem
              key={take.id}
              take={take}
              onOpen={() =>
                NavigationDispatcher.push({
                  app: 'vocalex',
                  page: 'takes',
                  subView: 'detail',
                  id: take.id,
                })
              }
              onDelete={() => handleDelete(take.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TakeListItem({
  take,
  onOpen,
  onDelete,
}: {
  take: TakeRecord;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      style={{
        background: 'var(--vx-edge)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          minWidth: 0,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--vx-card-2)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'var(--vx-text)' }}
          >
            play_arrow
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--vx-text)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {take.name}
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 3,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--vx-text-2)',
            }}
          >
            <span>{formatDateI18n(take.createdAt, t.vocalex)}</span>
            <span
              style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--vx-text-4)' }}
            />
            <span>{formatDuration(take.durationMs)}</span>
          </div>
        </div>
        <MiniWaveform peaks={take.waveformPeaks} />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setConfirming(true)}
        style={{
          color: 'var(--vx-text-4)',
          minWidth: 30,
          height: 30,
        }}
        icon="delete"
      />

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t.vocalex.deleteConfirmTitle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-secondary)' }}>
            {t.vocalex.deleteConfirmBody}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => setConfirming(false)} style={{ flex: 1 }}>
              {t.vocalex.cancelAction}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onDelete();
                setConfirming(false);
              }}
              style={{ flex: 1, background: 'var(--c-error, #ef4444)', color: '#fff' }}
            >
              {t.vocalex.deleteTake}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function MiniWaveform({ peaks }: { peaks: number[] }) {
  const display =
    peaks.length > 8
      ? peaks.filter((_, i) => i % Math.ceil(peaks.length / 8) === 0).slice(0, 8)
      : peaks;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: 24,
        opacity: 0.4,
        flexShrink: 0,
      }}
    >
      {display.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: `${Math.max(15, h)}%`,
            background: 'var(--vx-text)',
            borderRadius: 9999,
          }}
        />
      ))}
    </div>
  );
}
