import React, { useState, useMemo, useCallback } from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageBridge } from '../../services/StageBridgeService';
import { ExportPdfDialog } from '../dialogs/ExportPdfDialog';
import { useBackHandler } from '@workspace/studio-core';

export interface StageExportPdfViewProps {
  onBack: () => void;
  isLight?: boolean;
  isAmoled?: boolean;
}

export const StageExportPdfView: React.FC<StageExportPdfViewProps> = ({
  onBack,
  isLight = false,
  isAmoled = false,
}) => {
  const {
    projectName,
    elements,
    scenes,
    currentSceneIdx,
    riderChannels,
    riderNeeds,
    riderConfig,
    setlist,
    gear,
    members,
    preferences,
  } = useStagexStore();

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportBusy, setIsExportBusy] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(
    () =>
      `${(projectName || 'Main_Stage').replace(/\s+/g, '_')}_Rider_${new Date().toISOString().slice(0, 10)}`
  );
  const [pdfSceneChoice, setPdfSceneChoice] = useState<'current' | 'all' | number>('current');

  const sceneInfo = useMemo(
    () => ({
      count: scenes.length || 1,
      currentIdx: currentSceneIdx || 0,
      names: scenes.map((s, i) => s.name || `Scene ${i + 1}`),
    }),
    [scenes, currentSceneIdx]
  );

  // Hardware Back Handler
  useBackHandler(
    'nested',
    () => {
      onBack();
      return true;
    },
    [onBack]
  );

  // Current Scene Metadata
  const currentScene = scenes[currentSceneIdx] || { name: 'Main Stage Scene' };
  const activeSceneName = currentScene.name || 'Main Stage Scene';
  const stageDimensions = preferences.stageShape === 'square' ? "28' × 28'" : "32' × 24'";
  const fohProtocol =
    riderNeeds
      .find((n) => n.type === 'foh')
      ?.value?.split('@')[0]
      ?.trim() || 'Dante @ 96kHz';
  const updatedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Patch List derivation
  const patchList = useMemo(() => {
    if (riderChannels && riderChannels.length > 0) {
      return riderChannels.map((c, i) => ({
        ch: String(c.ch || i + 1).padStart(2, '0'),
        input: c.source || `Channel ${i + 1}`,
        performer: members[i % (members.length || 1)]?.name || 'Band',
        micDi: c.mic || 'Direct / Mic',
        phantom: Boolean(c.phantom),
        notes: c.notes || c.stand || 'FOH Mix',
      }));
    }
    if (!elements || elements.length === 0) {
      return [];
    }
    return elements.map((el, idx) => {
      const typeStr = (el.type || '').toLowerCase();
      const labelStr = (el.label || el.name || '').toLowerCase();
      const isMic = typeStr.includes('mic') || labelStr.includes('vocal');
      const isAmp =
        typeStr.includes('amp') || labelStr.includes('guitar') || labelStr.includes('bass');
      const isKey =
        typeStr.includes('key') || labelStr.includes('synth') || labelStr.includes('piano');
      const isDrum = typeStr.includes('drum');

      let micDi = 'Direct Line / DI';
      if (isMic) micDi = labelStr.includes('lead') ? 'Axient KSM9 (Wireless)' : 'Shure Beta 58A';
      else if (isDrum) micDi = labelStr.includes('kick') ? 'Shure Beta 91A' : 'Audix DP7 Pack';
      else if (isAmp)
        micDi = labelStr.includes('bass') ? 'Radial J48 Active DI' : 'Sennheiser e609';
      else if (isKey) micDi = 'Radial ProD2 Stereo';

      const performerName =
        el.performer ||
        members[idx % (members.length || 1)]?.name ||
        (isMic ? 'Lead Vocalist' : isDrum ? 'Drummer' : isAmp ? 'Guitar/Bass' : 'Keys / Synth');

      return {
        ch: String(idx + 1).padStart(2, '0'),
        input: el.label || el.name || `Input ${idx + 1}`,
        performer: performerName,
        micDi: el.transducer || micDi,
        phantom: Boolean(el.phantom || isKey || micDi.includes('91A') || micDi.includes('J48')),
        notes:
          el.mix ||
          (isMic ? 'Wireless RF' : isDrum ? 'Bound. mic' : isAmp ? 'Pre-EQ drop' : 'Ch Pair'),
      };
    });
  }, [riderChannels, elements, members]);

  // Setlist Total Duration
  const totalSetlistMinutes = useMemo(() => {
    if (!setlist || setlist.length === 0) return 0;
    return setlist.reduce((acc, s) => {
      const dur = s.duration || '04:00';
      const parts = dur.split(':').map((p) => parseInt(p, 10) || 0);
      const mins = parts.length === 2 ? parts[0] + parts[1] / 60 : 4;
      return acc + mins;
    }, 0);
  }, [setlist]);

  // Technical Requirements
  const requirementsList = useMemo(() => {
    if (riderNeeds && riderNeeds.length > 0) {
      return riderNeeds.map((need) => {
        let cat = 'TECHNICAL REQUIREMENT';
        let detail = 'Standard verified production protocol.';
        if (need.type === 'foh') {
          cat = 'FOH PROTOCOL';
          detail = 'Cat6 EtherCON dual-run homerun to front-of-house mixing position.';
        } else if (need.type === 'monitor') {
          cat = 'MONITOR / IEM SYSTEMS';
          detail = 'Minimum 4 discrete stereo wireless IEM mixes (Shure PSM1000 or equivalent).';
        } else if (need.type === 'power') {
          cat = 'AC ELECTRICAL DROPS';
          detail =
            'Direct transformer-isolated drops located Stage Left for backline and playback racks.';
        } else if (need.type === 'hospitality') {
          cat = 'HOSPITALITY';
          detail =
            'Clean bottled water, fresh stage towels, and green room access prior to soundcheck.';
        }
        return {
          id: need.id,
          category: cat,
          title: need.value,
          detail,
        };
      });
    }
    return [
      {
        id: 'rn1',
        category: 'FOH PROTOCOL',
        title: 'Dante Primary & Secondary Redundant @ 96kHz / 24-bit',
        detail: 'Cat6 EtherCON dual-run homerun to front-of-house mixing position.',
      },
      {
        id: 'rn2',
        category: 'MONITOR / IEM SYSTEMS',
        title: 'Minimum 4 discrete stereo wireless IEM mixes',
        detail: 'Shure PSM1000 or equivalent. Antenna combiner & passive directional paddle.',
      },
      {
        id: 'rn3',
        category: 'AC ELECTRICAL DROPS',
        title: '2× 20A isolated clean technical circuits',
        detail:
          'Direct transformer-isolated drops located Stage Left for backline and playback racks.',
      },
    ];
  }, [riderNeeds]);

  // PDF Export Trigger
  const handleExportClick = () => {
    setIsExportDialogOpen(true);
  };

  const executeExport = useCallback(
    async (share: boolean) => {
      setIsExportBusy(true);
      try {
        const activeIframe = StageBridge.getActiveIframe();
        const finalName = (pdfFileName.trim() || 'StagePlot') + '.pdf';
        await StageBridge.exportPdf(activeIframe, {
          name: finalName,
          includeBackdrop: true,
        });
        setIsExportDialogOpen(false);
      } catch (err) {
        console.error('Export to PDF failed', err);
      } finally {
        setIsExportBusy(false);
      }
    },
    [pdfFileName]
  );

  // Helper for normalizing coordinate percentages
  const getPercent = (coord: any): number => {
    if (typeof coord !== 'number') return 50;
    if (coord >= 0 && coord <= 100) return Math.min(92, Math.max(8, coord));
    return Math.min(92, Math.max(8, (coord / 800) * 100));
  };

  // Dynamic Theme Variables
  const bgMain = isLight ? '#f9f9fb' : isAmoled ? '#000000' : '#060606';
  const textPrimary = isLight ? '#09090b' : '#ffffff';
  const textSecondary = isLight ? '#52525b' : '#d4d4d8';
  const textMuted = isLight ? '#71717a' : '#a1a1aa';
  const textDim = isLight ? '#a1a1aa' : '#71717a';
  const borderCol = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const borderSubtle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
  const blueprintBg = isLight ? '#ebecee' : '#0a0a0a';
  const headerBg = isLight
    ? 'rgba(255, 255, 255, 0.88)'
    : isAmoled
      ? 'rgba(0, 0, 0, 0.92)'
      : 'rgba(10, 10, 10, 0.85)';

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col overflow-y-auto selection:bg-white selection:text-black"
      style={{
        backgroundColor: bgMain,
        color: textSecondary,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Manrope', sans-serif",
      }}
    >
      <style>{`
        .stage-blueprint-grid {
          background-size: 20px 20px;
          background-image: ${
            isLight
              ? 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)'
          };
        }
      `}</style>

      {/* ── TOP NAVIGATION ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full transition-all border-b"
        style={{
          backgroundColor: headerBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: borderCol,
        }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Back Action */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Go Back"
            className="p-1.5 -ml-1.5 transition-colors active:opacity-60 flex items-center gap-1.5 cursor-pointer"
            style={{ color: textMuted }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Centered Document Identity */}
          <div className="flex flex-col items-center select-none">
            <span
              className="text-[13px] font-semibold tracking-tight"
              style={{ color: textPrimary }}
            >
              Technical Rider
            </span>
            <span
              className="text-[10px] tracking-wider uppercase font-mono"
              style={{ color: textDim }}
            >
              {projectName || 'StageX'} Touring Doc
            </span>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPreviewMode((prev) => !prev)}
              className="text-[12px] font-medium px-2.5 py-1 rounded transition-all active:opacity-60 cursor-pointer"
              style={{
                color: isPreviewMode ? textPrimary : textMuted,
                backgroundColor: isPreviewMode
                  ? isLight
                    ? 'rgba(0,0,0,0.06)'
                    : 'rgba(255,255,255,0.08)'
                  : 'transparent',
                border: isPreviewMode ? `1px solid ${borderCol}` : '1px solid transparent',
              }}
            >
              {isPreviewMode ? 'Full View' : 'Preview'}
            </button>

            <button
              type="button"
              onClick={handleExportClick}
              disabled={isExportBusy}
              className="text-[12px] font-semibold px-3.5 py-1 rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
              style={{
                backgroundColor: isLight ? '#09090b' : '#ffffff',
                color: isLight ? '#ffffff' : '#000000',
              }}
            >
              {isExportBusy ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </header>

      {/* ── EDITORIAL DOCUMENT BODY ───────────────────────────────── */}
      <main
        className={`w-full max-w-2xl mx-auto px-5 pt-8 pb-16 space-y-14 transition-all ${
          isPreviewMode
            ? isLight
              ? 'my-6 p-8 bg-white border rounded-sm shadow-xl'
              : 'my-6 p-8 bg-[#0a0a0c] border border-white/10 rounded-sm shadow-2xl'
            : ''
        }`}
      >
        {/* ── RIDER IDENTITY SECTION ─────────────────────────────── */}
        <section className="space-y-3" data-purpose="rider-identity">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-mono tracking-[0.2em] uppercase"
                style={{ color: textDim }}
              >
                Doc Ref
              </span>
              <span className="text-[9px] font-mono font-medium" style={{ color: textMuted }}>
                STG-{new Date().getFullYear()}-X{currentSceneIdx + 1}
              </span>
              <span className="text-[10px]" style={{ color: textDim }}>
                /
              </span>
              <span className="text-[9px] font-mono text-emerald-400/90 tracking-wider uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-[2px] border border-emerald-500/20 font-medium">
                Verified
              </span>
            </div>

            <h1
              className="text-4xl font-bold tracking-tight uppercase"
              style={{ color: textPrimary }}
            >
              {projectName || 'MAIN STAGE'}
            </h1>

            <p className="text-[14px] font-normal tracking-tight" style={{ color: textMuted }}>
              {activeSceneName}{' '}
              <span className="mx-1" style={{ color: textDim }}>
                •
              </span>{' '}
              Technical Rider{' '}
              <span className="mx-1" style={{ color: textDim }}>
                •
              </span>{' '}
              Rev 1.{scenes.length || 1}
            </p>
          </div>

          <div
            className="pt-3 flex flex-wrap items-center gap-y-1.5 text-[11px] font-mono"
            style={{ color: textDim }}
          >
            <span style={{ color: textSecondary }}>{elements.length} elements</span>
            <span className="mx-2" style={{ color: textDim }}>
              •
            </span>
            <span style={{ color: textSecondary }}>{patchList.length} channels</span>
            <span className="mx-2" style={{ color: textDim }}>
              •
            </span>
            <span className="font-medium" style={{ color: textPrimary }}>
              {fohProtocol}
            </span>
            <span className="mx-2" style={{ color: textDim }}>
              •
            </span>
            <span>Updated {updatedDate}</span>
          </div>

          <div className="h-px w-full mt-6" style={{ backgroundColor: borderCol }}></div>
        </section>

        {/* ── 01 STAGE PLOT BLUEPRINT ────────────────────────────── */}
        <section className="space-y-3.5" data-purpose="stage-plot-blueprint">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  borderColor: borderCol,
                  color: textPrimary,
                }}
              >
                01
              </span>
              <h2
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: textPrimary }}
              >
                Stage Plot
              </h2>
            </div>
            <span className="text-[10px] font-mono tracking-tight" style={{ color: textDim }}>
              SCALE 1:50{' '}
              <span className="mx-1" style={{ color: textDim }}>
                •
              </span>{' '}
              {stageDimensions}
            </span>
          </div>

          <div
            className="relative w-full aspect-[4/3] border rounded-lg overflow-hidden stage-blueprint-grid p-3 flex flex-col justify-between select-none"
            style={{
              backgroundColor: blueprintBg,
              borderColor: borderCol,
            }}
          >
            {/* Top Blueprint Boundary */}
            <div
              className="w-full flex items-center justify-between text-[8.5px] font-mono tracking-wider uppercase"
              style={{ color: textDim }}
            >
              <span>Stage Left (SL)</span>
              <span
                className="border-b pb-0.5 font-medium"
                style={{
                  borderColor: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)',
                  color: textMuted,
                }}
              >
                ▲ Upstage / Backline Wall
              </span>
              <span>Stage Right (SR)</span>
            </div>

            {/* Elements Plot Plane */}
            <div className="relative flex-1 my-2 w-full h-full overflow-hidden">
              {elements && elements.length > 0 ? (
                elements.map((el, i) => {
                  const px = getPercent(el.x);
                  const py = getPercent(el.y);
                  const typeStr = (el.type || '').toLowerCase();
                  const labelStr = (el.label || el.name || '').toLowerCase();

                  // 1. Drum / Riser
                  if (typeStr.includes('drum') || labelStr.includes('drum')) {
                    return (
                      <div
                        key={el.id || i}
                        className="absolute flex flex-col items-center justify-center rounded-[2px] transition-transform select-none"
                        style={{
                          left: `${px}%`,
                          top: `${py}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 104,
                          height: 60,
                          border: isLight
                            ? '1px solid rgba(0,0,0,0.45)'
                            : '1px solid rgba(255,255,255,0.4)',
                          backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          className="text-[9px] font-mono font-medium tracking-tight"
                          style={{ color: textPrimary }}
                        >
                          {el.label || 'DRUM RISER'}
                        </span>
                        <span className="text-[7px] font-mono" style={{ color: textDim }}>
                          8' × 8' × 18"
                        </span>
                        <div
                          className="w-6 h-6 mt-1 rounded-full flex items-center justify-center text-[7px] font-mono"
                          style={{
                            border: isLight
                              ? '1px dashed rgba(0,0,0,0.4)'
                              : '1px dashed rgba(255,255,255,0.4)',
                            color: textSecondary,
                          }}
                        >
                          Kit
                        </div>
                      </div>
                    );
                  }

                  // 2. Vocal / Mic
                  if (typeStr.includes('mic') || labelStr.includes('vocal')) {
                    return (
                      <div
                        key={el.id || i}
                        className="absolute flex flex-col items-center justify-center transition-transform select-none"
                        style={{
                          left: `${px}%`,
                          top: `${py}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{
                            border: isLight
                              ? '1px solid rgba(0,0,0,0.6)'
                              : '1px solid rgba(255,255,255,0.7)',
                            backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                            boxShadow: isLight ? 'none' : '0 0 10px rgba(255,255,255,0.12)',
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: textPrimary }}
                          />
                        </div>
                        <span
                          className="text-[8px] font-mono font-medium tracking-wider uppercase mt-1"
                          style={{ color: textPrimary }}
                        >
                          {el.label || 'Lead Vox (RF)'}
                        </span>
                      </div>
                    );
                  }

                  // 3. Amp / Backline
                  if (
                    typeStr.includes('amp') ||
                    labelStr.includes('guitar') ||
                    labelStr.includes('bass')
                  ) {
                    const isBass = labelStr.includes('bass');
                    return (
                      <div
                        key={el.id || i}
                        className="absolute rounded-[2px] flex flex-col items-center justify-center p-1 transition-transform select-none"
                        style={{
                          left: `${px}%`,
                          top: `${py}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 56,
                          height: 38,
                          border: isLight
                            ? '1px solid rgba(0,0,0,0.35)'
                            : '1px solid rgba(255,255,255,0.3)',
                          backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span
                          className="text-[8.5px] font-mono font-medium leading-none"
                          style={{ color: textPrimary }}
                        >
                          {isBass ? 'BASS' : 'GTR'}
                        </span>
                        <span
                          className="text-[7px] font-mono mt-0.5 truncate max-w-[50px]"
                          style={{ color: textDim }}
                        >
                          {el.label || (isBass ? 'SVT Rig' : 'Cab 4x12')}
                        </span>
                      </div>
                    );
                  }

                  // 4. Keys / Synth
                  if (
                    typeStr.includes('key') ||
                    labelStr.includes('piano') ||
                    labelStr.includes('synth')
                  ) {
                    return (
                      <div
                        key={el.id || i}
                        className="absolute rounded-[2px] flex flex-col items-center justify-center p-1 transition-transform select-none"
                        style={{
                          left: `${px}%`,
                          top: `${py}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 62,
                          height: 38,
                          border: isLight
                            ? '1px solid rgba(0,0,0,0.35)'
                            : '1px solid rgba(255,255,255,0.3)',
                          backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span
                          className="text-[8px] font-mono font-medium leading-tight"
                          style={{ color: textSecondary }}
                        >
                          KEYS
                        </span>
                        <span
                          className="text-[6.5px] font-mono truncate max-w-[56px]"
                          style={{ color: textDim }}
                        >
                          {el.label || 'Stage Synth'}
                        </span>
                      </div>
                    );
                  }

                  // 5. Default Blueprint Element
                  return (
                    <div
                      key={el.id || i}
                      className="absolute rounded-[2px] flex flex-col items-center justify-center p-1 transition-transform select-none"
                      style={{
                        left: `${px}%`,
                        top: `${py}%`,
                        transform: 'translate(-50%, -50%)',
                        minWidth: 50,
                        height: 32,
                        border: isLight
                          ? '1px solid rgba(0,0,0,0.3)'
                          : '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span
                        className="text-[7.5px] font-mono font-medium truncate max-w-[65px]"
                        style={{ color: textPrimary }}
                      >
                        {el.label || el.name || 'STAGE ELEMENT'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[10px] font-mono"
                  style={{ color: textDim }}
                >
                  No elements placed on stage plot. Add elements in Editor.
                </div>
              )}
            </div>

            {/* Bottom Blueprint Boundary */}
            <div
              className="w-full flex items-center justify-between text-[8.5px] font-mono tracking-wider uppercase border-t pt-1.5"
              style={{
                borderColor: borderCol,
                color: textDim,
              }}
            >
              <span>Downstage Edge</span>
              <span className="tracking-normal" style={{ color: textDim }}>
                ▼ FOH / Audience Line
              </span>
              <span>Centerline (CL)</span>
            </div>
          </div>

          {/* Blueprint Legend Footer */}
          <div
            className="flex items-center justify-between text-[10px] font-mono px-1 pt-1"
            style={{ color: textDim }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 border"
                  style={{
                    borderColor: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                  }}
                />{' '}
                Backline / Amp
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full border"
                  style={{
                    borderColor: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  }}
                />{' '}
                Vocal / Transceiver
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 border border-dashed"
                  style={{
                    borderColor: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                  }}
                />{' '}
                Drum Riser
              </span>
            </div>
            <span className="text-[9px]" style={{ color: textDim }}>
              Drawing Ref: 01-A
            </span>
          </div>
        </section>

        {/* ── 02 INPUT LIST / PATCH ──────────────────────────────── */}
        <section className="space-y-3" data-purpose="input-patch-sheet">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  borderColor: borderCol,
                  color: textPrimary,
                }}
              >
                02
              </span>
              <h2
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: textPrimary }}
              >
                Input List &amp; Patch
              </h2>
            </div>
            <span className="text-[10px] font-mono tracking-tight" style={{ color: textDim }}>
              {patchList.length} Active Channels
            </span>
          </div>

          <div
            className="border-t border-b divide-y"
            style={{
              borderColor: borderCol,
              borderTopColor: borderCol,
              borderBottomColor: borderCol,
            }}
          >
            {/* Header Row */}
            <div
              className="grid grid-cols-12 py-2 text-[9.5px] font-mono tracking-wider uppercase"
              style={{ color: textDim }}
            >
              <div className="col-span-1">CH</div>
              <div className="col-span-3">Input</div>
              <div className="col-span-2">Performer</div>
              <div className="col-span-3">Mic / DI</div>
              <div className="col-span-1 text-center">48V</div>
              <div className="col-span-2 text-right">Notes</div>
            </div>

            {/* Channels Rows */}
            {patchList.length > 0 ? (
              patchList.map((ch, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 py-2.5 items-center text-[12px] font-normal tracking-tight transition-colors"
                  style={{
                    borderTop: `1px solid ${borderSubtle}`,
                  }}
                >
                  <div className="col-span-1 font-mono text-[11px]" style={{ color: textDim }}>
                    {ch.ch}
                  </div>
                  <div className="col-span-3 font-medium" style={{ color: textPrimary }}>
                    {ch.input}
                  </div>
                  <div
                    className="col-span-2 text-[11px] font-mono truncate"
                    style={{ color: textDim }}
                  >
                    {ch.performer}
                  </div>
                  <div
                    className="col-span-3 font-mono text-[11px]"
                    style={{ color: textSecondary }}
                  >
                    {ch.micDi}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {ch.phantom ? (
                      <span className="text-[8.5px] font-mono font-medium text-white bg-white/10 px-1.5 py-0.5 rounded-[2px] border border-white/20 leading-none">
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        className="text-center font-mono text-[10px]"
                        style={{ color: textDim }}
                      >
                        —
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right text-[11px]" style={{ color: textDim }}>
                    {ch.notes}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-[11px] font-mono" style={{ color: textDim }}>
                No active input channels configured.
              </div>
            )}
          </div>
        </section>

        {/* ── 03 CONNECTIVITY & TECHNICAL REQUIREMENTS ───────────── */}
        <section className="space-y-3" data-purpose="connectivity-protocols">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  borderColor: borderCol,
                  color: textPrimary,
                }}
              >
                03
              </span>
              <h2
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: textPrimary }}
              >
                Connectivity &amp; Technical Requirements
              </h2>
            </div>
            <span className="text-[10px] font-mono tracking-tight" style={{ color: textDim }}>
              INFRASTRUCTURE
            </span>
          </div>

          <div
            className="border-t border-b divide-y"
            style={{
              borderColor: borderCol,
              borderTopColor: borderCol,
              borderBottomColor: borderCol,
            }}
          >
            {requirementsList.map((req, i) => (
              <div
                key={req.id || i}
                className="py-3.5 flex flex-col gap-1"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${borderSubtle}` }}
              >
                <div
                  className="text-[9.5px] font-mono tracking-wider uppercase"
                  style={{ color: textDim }}
                >
                  {req.category}
                </div>
                <div
                  className="text-[13px] font-medium tracking-tight"
                  style={{ color: textPrimary }}
                >
                  {req.title}
                </div>
                <div className="text-[11.5px] font-mono" style={{ color: textMuted }}>
                  {req.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 04 SETLIST & RUNNING ORDER ─────────────────────────── */}
        {setlist && setlist.length > 0 && (
          <section className="space-y-3" data-purpose="setlist-running-order">
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                  style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    borderColor: borderCol,
                    color: textPrimary,
                  }}
                >
                  04
                </span>
                <h2
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: textPrimary }}
                >
                  Setlist &amp; Running Order
                </h2>
              </div>
              <span className="text-[10px] font-mono tracking-tight" style={{ color: textDim }}>
                TOTAL {Math.round(totalSetlistMinutes)} MIN
              </span>
            </div>

            <div
              className="border-t border-b divide-y"
              style={{
                borderColor: borderCol,
                borderTopColor: borderCol,
                borderBottomColor: borderCol,
              }}
            >
              {setlist.map((song, idx) => (
                <div
                  key={song.id || idx}
                  className="py-3 flex items-center justify-between text-[12px] transition-colors"
                  style={{ borderTop: idx === 0 ? 'none' : `1px solid ${borderSubtle}` }}
                >
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-[11px]" style={{ color: textDim }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium" style={{ color: textPrimary }}>
                      {song.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: textDim }}>
                    {song.bpm || 120} BPM{' '}
                    <span className="mx-1" style={{ color: textDim }}>
                      •
                    </span>{' '}
                    {song.key || 'C'}{' '}
                    <span className="mx-1" style={{ color: textDim }}>
                      •
                    </span>{' '}
                    {song.duration || '04:00'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 05 TECHNICAL NOTES ─────────────────────────────────── */}
        <section className="space-y-3" data-purpose="technical-notes">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  borderColor: borderCol,
                  color: textPrimary,
                }}
              >
                05
              </span>
              <h2
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: textPrimary }}
              >
                Technical Notes
              </h2>
            </div>
            <span
              className="text-[10px] font-mono uppercase tracking-tight"
              style={{ color: textDim }}
            >
              Mandatory Compliance
            </span>
          </div>

          <div
            className="border-t border-b py-4"
            style={{
              borderColor: borderCol,
              borderTopColor: borderCol,
              borderBottomColor: borderCol,
            }}
          >
            <p
              className="text-[13px] leading-relaxed font-normal tracking-tight"
              style={{ color: textSecondary }}
            >
              {riderConfig?.notes ||
                'Artist provides all core instruments, IEM wireless transmitters, and stage playback system rack. The host venue must provide all microphones, stands, and balanced XLR cabling strictly as specified in the channel list. The house PA system must achieve 105dBA continuous SPL cleanly at the FOH position without distortion. Dedicated front-fills are mandatory for the first 3 audience rows. All RF wireless frequencies must be coordinated prior to load-in.'}
            </p>
          </div>
        </section>

        {/* ── 06 GEAR & LOAD-IN CHECKLIST ────────────────────────── */}
        {gear && gear.length > 0 && (
          <section className="space-y-3" data-purpose="load-in-checklist">
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                  style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    borderColor: borderCol,
                    color: textPrimary,
                  }}
                >
                  06
                </span>
                <h2
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: textPrimary }}
                >
                  Gear &amp; Load-In Checklist
                </h2>
              </div>
              <span
                className="text-[10px] font-mono uppercase tracking-tight"
                style={{ color: textDim }}
              >
                Venue Supply / Inventory
              </span>
            </div>

            <div
              className="border-t border-b divide-y"
              style={{
                borderColor: borderCol,
                borderTopColor: borderCol,
                borderBottomColor: borderCol,
              }}
            >
              {gear.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="py-3 flex items-center justify-between text-[12px] transition-colors"
                  style={{ borderTop: idx === 0 ? 'none' : `1px solid ${borderSubtle}` }}
                >
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-[11px]" style={{ color: textDim }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium" style={{ color: textPrimary }}>
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-[8.5px] font-mono font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-[2px] border ${
                      item.packed
                        ? 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                    }`}
                  >
                    {item.packed ? 'Verified' : 'Required'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── DOCUMENT FOOTER ────────────────────────────────────── */}
        <footer
          className="pt-4 pb-8 space-y-2 border-t text-[10px] font-mono"
          style={{
            borderColor: borderCol,
            color: textDim,
          }}
        >
          <div className="flex justify-between items-center">
            <span>STAGE-CORE DOCUMENT ENGINE</span>
            <span>VER 4.5.54</span>
          </div>
          <div className="flex justify-between items-center">
            <span>© {new Date().getFullYear()} STAGEX EDITORIAL SUITE</span>
            <span>DOC HASH: 9B7-X902</span>
          </div>
        </footer>
      </main>

      {/* ── EXPORT PDF DIALOG MODAL ──────────────────────────────── */}
      <ExportPdfDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export PDF"
        nameLabel="Document Name"
        fileName={pdfFileName}
        setFileName={setPdfFileName}
        busy={isExportBusy}
        sceneInfo={sceneInfo}
        sceneChoice={pdfSceneChoice}
        setSceneChoice={setPdfSceneChoice}
        sceneCurrentLabel="Current Scene"
        sceneAllLabel="All Scenes"
        canShare={typeof navigator !== 'undefined' && Boolean(navigator.share)}
        onSave={() => executeExport(false)}
        onShare={() => executeExport(true)}
        saveLabel="Save to device"
        shareLabel="Share"
        cancelLabel="Cancel"
      />
    </div>
  );
};
export default StageExportPdfView;
