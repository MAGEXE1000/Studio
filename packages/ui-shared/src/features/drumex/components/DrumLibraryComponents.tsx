import React, { memo } from 'react';
import {
  type DrumInstrument,
  type LibraryPattern,
  type LibraryCategory,
  type LibraryGenre,
  useDrumStore,
  INSTRUMENT_COLOR,
  useIsWebDesktop,
} from '@workspace/studio-core';

const getInstrumentColor = (inst: DrumInstrument, isLight: boolean, noteColor: string): string => {
  if (isLight) {
    switch (inst) {
      case 'kick':
      case 'snare':
        return '#09090b';
      case 'hihat-closed':
      case 'hihat-open':
      case 'hihat-foot':
        return '#27272a';
      case 'tom-high':
      case 'tom-mid':
      case 'tom-floor':
        return '#3f3f46';
      case 'crash':
      case 'ride':
        return '#52525b';
      default:
        return '#09090b';
    }
  }
  return INSTRUMENT_COLOR[inst] ?? noteColor;
};

const LIB_INSTS: DrumInstrument[] = [
  'hihat-closed',
  'snare',
  'kick',
  'crash',
  'tom-high',
  'tom-mid',
  'tom-floor',
];

const LibMiniGrid = memo(function LibMiniGrid({
  lp,
  isLight,
}: {
  lp: LibraryPattern;
  isLight: boolean;
}) {
  const totalSteps = lp.subdivision === 16 ? 16 : 8;
  const m0 = lp.measures[0];
  if (!m0) return null;
  const usedInsts = LIB_INSTS.filter((inst) => m0.hits[inst]?.length);
  return (
    <div
      style={{
        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.35)',
        borderRadius: 10,
        padding: '8px 6px',
        overflow: 'hidden',
      }}
    >
      {usedInsts.slice(0, 4).map((inst) => {
        const instHits = m0.hits[inst] ?? [];
        const color = getInstrumentColor(inst, isLight, '#888');
        const hitSet = new Set(instHits.map((h) => h.step));
        const ghostSet = new Set(
          instHits.filter((h) => h.variation === 'ghost').map((h) => h.step)
        );
        return (
          <div key={inst} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            {Array.from({ length: totalSteps }, (_, s) => {
              const isHit = hitSet.has(s);
              const isGhost = ghostSet.has(s);
              return (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: isHit ? (isGhost ? 4 : 6) : 3,
                    borderRadius: 2,
                    background: isHit
                      ? isGhost
                        ? `${color}55`
                        : color
                      : isLight
                        ? 'rgba(0,0,0,0.06)'
                        : 'rgba(255,255,255,0.05)',
                    opacity: isHit ? (isGhost ? 0.6 : 0.85) : 1,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

interface LibCardProps {
  lp: LibraryPattern;
  isPreviewPlaying: boolean;
  accent: { from: string; to: string };
  isLight: boolean;
  onPreview: (lp: LibraryPattern) => void;
  onReplace: (lp: LibraryPattern) => void;
  onInsert: (lp: LibraryPattern) => void;
}

const LibCard = memo(function LibCard({
  lp,
  isPreviewPlaying,
  accent,
  isLight,
  onPreview,
  onReplace,
  onInsert,
}: LibCardProps) {
  const isWebDesktop = useIsWebDesktop();
  return (
    <div
      style={{
        background: isWebDesktop ? (isLight ? '#ffffff' : '#000000') : 'var(--app-bg)',
        borderRadius: isWebDesktop ? 12 : 14,
        overflow: 'hidden',
        border: isWebDesktop
          ? isLight
            ? '1px solid #e4e4e7'
            : '1px solid rgba(255,255,255,0.10)'
          : '1px solid rgba(128,128,128,0.06)',
        transition: 'border-color 200ms',
      }}
      className="group hover:border-zinc-800"
    >
      <div style={{ padding: '14px 14px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: isLight ? '#09090b' : '#ffffff',
                fontFamily: 'var(--studio-font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {lp.name}
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: '#71717a',
                marginTop: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--studio-font-body)',
                fontWeight: 700,
              }}
            >
              {lp.category} · {lp.genre} · {lp.bpm} BPM
            </div>
          </div>
          <button
            onClick={() => onPreview(lp)}
            title={isPreviewPlaying ? 'Stop Preview' : 'Preview Groove'}
            className="btn-smooth cursor-pointer"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPreviewPlaying
                ? `linear-gradient(135deg,${accent.from},${accent.to})`
                : isLight
                  ? '#f4f4f5'
                  : '#18181b',
              color: isPreviewPlaying ? '#fff' : isLight ? '#27272a' : '#a1a1aa',
              transition: 'all 160ms',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {isPreviewPlaying ? 'stop' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        <LibMiniGrid lp={lp} isLight={isLight} />
      </div>
      <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6 }}>
        <button
          onClick={() => onReplace(lp)}
          title="Replace current pattern with this groove"
          className="btn-smooth cursor-pointer"
          style={{
            flex: 1,
            padding: '7px',
            borderRadius: 8,
            background: isLight ? '#f4f4f5' : '#09090b',
            border: isLight ? '1px solid #e4e4e7' : '1px solid #18181b',
            color: isLight ? '#27272a' : '#e4e4e7',
            fontSize: 10.5,
            fontWeight: 800,
            fontFamily: 'var(--type-button-font, var(--studio-font-body))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            transition: 'all 160ms',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            file_download
          </span>
          <span>USE</span>
        </button>
        <button
          onClick={() => onInsert(lp)}
          title="Append this groove to the end of the pattern"
          className="btn-smooth cursor-pointer"
          style={{
            flex: 1,
            padding: '7px',
            borderRadius: 8,
            background: isLight ? '#f4f4f5' : '#09090b',
            border: isLight ? '1px solid #e4e4e7' : '1px solid #18181b',
            color: isLight ? '#27272a' : '#e4e4e7',
            fontSize: 10.5,
            fontWeight: 800,
            fontFamily: 'var(--type-button-font, var(--studio-font-body))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            transition: 'all 160ms',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            playlist_add
          </span>
          <span>APPEND</span>
        </button>
      </div>
    </div>
  );
});

const VISIBLE_BATCH = 20;

export { LIB_INSTS, LibMiniGrid, LibCard, VISIBLE_BATCH };
