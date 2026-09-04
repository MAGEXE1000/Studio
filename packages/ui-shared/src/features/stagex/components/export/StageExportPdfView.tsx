import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageBridge } from '../../services/StageBridgeService';
import { ExportPdfDialog } from '../dialogs/ExportPdfDialog';
import { useBackHandler } from '@workspace/studio-core';
import { STAGEX_ICON_MAP } from '../../constants';

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

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportBusy, setIsExportBusy] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(
    () =>
      `${(projectName || 'Main_Stage').replace(/\s+/g, '_')}_Rider_${new Date().toISOString().slice(0, 10)}`
  );
  const [pdfSceneChoice, setPdfSceneChoice] = useState<'current' | 'all' | number>('current');

  // Reload latest storage data on mount to ensure fresh state
  useEffect(() => {
    useStagexStore.getState().reloadFromStorage();
  }, []);

  // Hardware Back Handler
  useBackHandler(
    'nested',
    () => {
      onBack();
      return true;
    },
    [onBack]
  );

  // Authoritative live state from canvas iframe (if mounted)
  const liveWin = StageBridge.getWin();
  const liveState = liveWin?.state;

  const activeSceneIdx =
    typeof liveState?.currentSceneIdx === 'number'
      ? liveState.currentSceneIdx
      : typeof currentSceneIdx === 'number'
        ? currentSceneIdx
        : 0;

  const activeScenes = liveState?.scenes && liveState.scenes.length > 0 ? liveState.scenes : scenes;

  const currentScene = activeScenes[activeSceneIdx] ||
    scenes[currentSceneIdx] || { name: 'Main Stage' };
  const activeSceneName = currentScene.name || `Scene ${activeSceneIdx + 1}`;

  // Current elements: liveState.elements if matching active scene, otherwise scene's elements
  const currentElements: any[] = useMemo(() => {
    if (liveState?.elements && liveState.currentSceneIdx === activeSceneIdx) {
      return liveState.elements;
    }
    if (currentScene && Array.isArray(currentScene.elements)) {
      return currentScene.elements;
    }
    return elements || [];
  }, [liveState?.elements, liveState?.currentSceneIdx, activeSceneIdx, currentScene, elements]);

  // Current connections
  const currentConnections: any[] = useMemo(() => {
    if (liveState?.connections && liveState.currentSceneIdx === activeSceneIdx) {
      return liveState.connections;
    }
    if (currentScene && Array.isArray(currentScene.connections)) {
      return currentScene.connections;
    }
    return [];
  }, [liveState?.connections, liveState?.currentSceneIdx, activeSceneIdx, currentScene]);

  // Canvas dimensions for 1:1 relative mapping
  const isSquare = preferences.stageShape === 'square';
  const refW =
    liveState?.canvasW && liveState.canvasW > 0 ? liveState.canvasW : isSquare ? 500 : 650;
  const refH =
    liveState?.canvasH && liveState.canvasH > 0 ? liveState.canvasH : isSquare ? 500 : 420;

  const sceneInfo = useMemo(
    () => ({
      count: activeScenes.length || 1,
      currentIdx: activeSceneIdx,
      names: activeScenes.map((s: any, i: number) => s.name || `Scene ${i + 1}`),
    }),
    [activeScenes, activeSceneIdx]
  );

  const stageDimensions = isSquare ? "28' × 28'" : "32' × 24'";
  const fohProtocol =
    riderNeeds.find((n) => n.type === 'foh')?.value || 'Dante Primary/Secondary @ 96kHz';
  const monitorProtocol =
    riderNeeds.find((n) => n.type === 'monitor')?.value || 'Minimum 4 discrete stereo IEM mixes';
  const powerProtocol =
    riderNeeds.find((n) => n.type === 'power')?.value || '2× 20A circuits, distro Stage Left';
  const updatedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }, []);

  const timeString = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
    if (!currentElements || currentElements.length === 0) {
      return [];
    }
    return currentElements.map((el, idx) => {
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
        input: (el.label || el.name || `Input ${idx + 1}`).toUpperCase(),
        performer: performerName,
        micDi: el.transducer || micDi,
        phantom: Boolean(el.phantom || isKey || micDi.includes('91A') || micDi.includes('J48')),
        notes:
          el.mix ||
          (isMic ? 'Wireless RF' : isDrum ? 'Bound. mic' : isAmp ? 'Pre-EQ drop' : 'Ch Pair'),
      };
    });
  }, [riderChannels, currentElements, members]);

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

  // Dynamic Theme Colors
  const bgMain = isLight ? '#f9f9fb' : isAmoled ? '#000000' : '#08080a';
  const textPrimary = isLight ? '#09090b' : '#ffffff';
  const textSecondary = isLight ? '#52525b' : '#d4d4d8';
  const textDim = isLight ? '#a1a1aa' : '#71717a';
  const borderCol = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const borderSubtle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
  const blueprintBg = isLight ? '#f4f4f6' : isAmoled ? '#050507' : '#0c0c0e';

  return (
    <div
      data-testid="stage-export-pdf-view"
      className="w-full h-full min-h-screen flex flex-col overflow-y-auto selection:bg-blue-500 selection:text-white"
      style={{
        backgroundColor: bgMain,
        color: textSecondary,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Manrope', sans-serif",
      }}
    >
      <style>{`
        .stage-blueprint-grid {
          background-size: 24px 24px;
          background-image: ${
            isLight
              ? 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
          };
        }
      `}</style>

      {/* ── 1. COMPACT TOP BAR ────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full flex-shrink-0"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
          paddingBottom: '8px',
        }}
      >
        <div
          data-testid="export-pdf-top-bar"
          className="w-full max-w-2xl mx-auto h-12 px-2.5 rounded-full grid grid-cols-[1fr_auto_1fr] items-center"
          style={{
            background: isLight
              ? 'rgba(255, 255, 255, 0.92)'
              : isAmoled
                ? 'rgba(10, 10, 14, 0.94)'
                : 'rgba(20, 20, 26, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isLight
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.10)',
            boxShadow: isLight
              ? '0 4px 20px rgba(0, 0, 0, 0.06)'
              : '0 8px 24px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Left: Back Action */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              data-testid="export-pdf-back-btn"
              onClick={onBack}
              aria-label="Go Back"
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{
                background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                color: isLight ? '#18181b' : '#f4f4f5',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          {/* Center: Mathematically Centered Title Across Entire Top Bar */}
          <div className="flex items-center justify-center whitespace-nowrap px-2">
            <span
              data-testid="export-pdf-title"
              className="text-[14px] font-bold tracking-tight select-none"
              style={{
                color: isLight ? '#09090b' : '#ffffff',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Export to PDF
            </span>
          </div>

          {/* Right: Preferences and Export Actions */}
          <div className="flex items-center justify-end gap-1.5">
            {/* Preferences / Settings Control */}
            <button
              type="button"
              data-testid="export-pdf-preferences-btn"
              onClick={() => setIsExportDialogOpen(true)}
              aria-label="Export Settings"
              title="Export Settings"
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{
                background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                color: isLight ? '#18181b' : '#f4f4f5',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
              </svg>
            </button>

            {/* Export / Share Control */}
            <button
              type="button"
              data-testid="export-pdf-action-btn"
              onClick={handleExportClick}
              disabled={isExportBusy}
              aria-label="Export / Share"
              title="Export / Share"
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{
                background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                color: isLight ? '#18181b' : '#f4f4f5',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. EDITORIAL DOCUMENT BODY ─────────────────────────────── */}
      <main
        className="w-full max-w-2xl mx-auto px-5 pt-3 space-y-10"
        style={{
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 64px)',
        }}
      >
        {/* ── RIDER IDENTITY SECTION ─────────────────────────────── */}
        <section className="space-y-3 pt-2" data-purpose="rider-identity">
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold tracking-wider text-blue-500 uppercase">
              Technical Rider Export
            </div>

            <h1
              data-testid="export-doc-project-name"
              className="text-3xl font-black tracking-tight uppercase"
              style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
            >
              {projectName || 'MAIN STAGE'}
            </h1>

            <p className="text-[13px] font-medium text-zinc-500 tracking-tight">
              {projectName || 'Main Stage'} · {activeSceneName}
            </p>
          </div>

          <div
            className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono font-semibold"
            style={{ color: textDim }}
          >
            <span className="uppercase" style={{ color: textPrimary }}>
              ELEMENTS {currentElements.length}
            </span>
            <span>•</span>
            <span className="uppercase">VER V1</span>
            <span>•</span>
            <span className="uppercase">{updatedDate}</span>
          </div>

          {/* Metadata Grid Strip */}
          <div
            className="grid grid-cols-2 border-t border-b mt-4 select-none"
            style={{ borderColor: borderCol }}
          >
            <div
              className="py-2.5 pr-4 border-r flex flex-col gap-0.5"
              style={{ borderColor: borderCol }}
            >
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">
                Document ID
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                STAGE-CORE
              </span>
            </div>
            <div className="py-2.5 pl-4 flex flex-col gap-0.5">
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">
                Last Updated
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {updatedDate.toUpperCase()} - {timeString}
              </span>
            </div>
          </div>
        </section>

        {/* ── 01 // STAGE PLOT (LITERAL STAGE PREVIEW) ────────────── */}
        <section className="space-y-3" data-purpose="stage-plot-blueprint">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">01 //</span>
                Stage Plot
              </h2>
            </div>
            <span
              className="text-[10px] font-mono tracking-tight font-semibold"
              style={{ color: textDim }}
            >
              SCALE: 1:50 · {stageDimensions}
            </span>
          </div>

          {/* Literal Stage Plot Canvas Container */}
          {currentElements.length === 0 ? (
            <div
              data-testid="stage-plot-empty"
              className="w-full flex items-center justify-center rounded-lg border border-dashed select-none"
              style={{
                height: isSquare ? '280px' : '200px',
                backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                borderColor: borderCol,
              }}
            >
              <span
                className="text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase"
                style={{ color: textDim }}
              >
                No elements placed on stage
              </span>
            </div>
          ) : (
            <div
              data-testid="stage-plot-preview-container"
              className={`relative w-full border rounded-xl overflow-hidden stage-blueprint-grid p-2.5 flex flex-col justify-between select-none ${
                isSquare ? 'aspect-square max-h-[420px]' : 'aspect-[16/9] max-h-[360px]'
              }`}
              style={{
                backgroundColor: blueprintBg,
                borderColor: borderCol,
              }}
            >
              {/* Upstage Boundary Header */}
              <div
                className="w-full flex items-center justify-between text-[8px] font-mono font-bold tracking-wider uppercase z-10 select-none"
                style={{ color: textDim }}
              >
                <span>Stage Left (SL)</span>
                <span
                  className="border-b pb-0.5"
                  style={{
                    borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                    color: textPrimary,
                  }}
                >
                  ▲ Upstage / Backline Wall
                </span>
                <span>Stage Right (SR)</span>
              </div>

              {/* Elements Plot Plane */}
              <div className="relative flex-1 w-full h-full overflow-hidden my-1">
                {/* Active Connection Lines */}
                {currentConnections.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {currentConnections.map((conn: any, cIdx: number) => {
                      const fromEl = currentElements.find((e: any) => e.id === conn.fromId);
                      const toEl = currentElements.find((e: any) => e.id === conn.toId);
                      if (!fromEl || !toEl) return null;
                      const x1 = Math.min(94, Math.max(6, (fromEl.x / refW) * 100));
                      const y1 = Math.min(94, Math.max(6, (fromEl.y / refH) * 100));
                      const x2 = Math.min(94, Math.max(6, (toEl.x / refW) * 100));
                      const y2 = Math.min(94, Math.max(6, (toEl.y / refH) * 100));
                      return (
                        <line
                          key={conn.id || cIdx}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke={conn.color || '#7aafff'}
                          strokeWidth="1.5"
                          strokeDasharray={
                            conn.style === 'dashed'
                              ? '4 3'
                              : conn.style === 'dotted'
                                ? '2 2'
                                : undefined
                          }
                          opacity={0.6}
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Literal Elements Rendered from State */}
                {currentElements.map((el: any, idx: number) => {
                  const rawPctX = (el.x / refW) * 100;
                  const rawPctY = (el.y / refH) * 100;
                  const pctX = Math.min(94, Math.max(6, rawPctX));
                  const pctY = Math.min(94, Math.max(6, rawPctY));
                  const rotation = el.rotation || 0;
                  const scale = (el.scale || 100) / 100;
                  const color = el.color || '#7aafff';
                  const labelText = (el.label || el.name || '').toUpperCase();
                  const iconKey = el.icon || 'mic';
                  const mappedIcon = STAGEX_ICON_MAP[iconKey];

                  return (
                    <div
                      key={el.id || idx}
                      data-testid={`preview-element-${el.id || idx}`}
                      className="absolute flex flex-col items-center justify-center select-none pointer-events-none"
                      style={{
                        left: `${pctX}%`,
                        top: `${pctY}%`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                      }}
                    >
                      {/* Rotated Icon Wrapper */}
                      <div
                        className="relative flex items-center justify-center"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        {el.imageData ? (
                          <img
                            src={el.imageData}
                            alt={labelText}
                            className="w-7 h-7 object-contain"
                            style={{
                              filter: isLight
                                ? undefined
                                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                            }}
                          />
                        ) : mappedIcon ? (
                          <img
                            src={mappedIcon}
                            alt={labelText}
                            className="w-7 h-7 object-contain"
                            style={{
                              filter: isLight
                                ? undefined
                                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                            }}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[24px]" style={{ color }}>
                            {iconKey === 'mic'
                              ? 'mic'
                              : iconKey === 'piano'
                                ? 'piano'
                                : 'music_note'}
                          </span>
                        )}

                        {/* Micro Lock Badge */}
                        {el.locked && (
                          <div
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{
                              background: isLight
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(20, 20, 24, 0.9)',
                              border: '1px solid rgba(245, 158, 11, 0.7)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                              color: '#f59e0b',
                            }}
                          >
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                          </div>
                        )}

                        {/* Micro Pin Badge */}
                        {el.pinned && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{
                              background: isLight
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(20, 20, 24, 0.9)',
                              border: '1px solid rgba(236, 72, 153, 0.7)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                              color: '#ec4899',
                            }}
                          >
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Standardized Canonical Label */}
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-[0.05em] text-center truncate max-w-[85px] leading-tight select-none mt-1"
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          color: isLight ? '#18181b' : '#ffffff',
                        }}
                      >
                        {labelText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Downstage Boundary Footer */}
              <div
                className="w-full flex items-center justify-between text-[8px] font-mono font-bold tracking-wider uppercase border-t pt-1 z-10 select-none"
                style={{
                  borderColor: borderCol,
                  color: textDim,
                }}
              >
                <span>Downstage Edge</span>
                <span style={{ color: textPrimary }}>▼ FOH / Audience Line</span>
                <span>Centerline (CL)</span>
              </div>
            </div>
          )}
        </section>

        {/* ── 02 // INPUT LIST & PATCH ───────────────────────────── */}
        <section className="space-y-3" data-purpose="input-patch-sheet">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">02 //</span>
                Input List
              </h2>
            </div>
            <span
              className="text-[10px] font-mono tracking-tight font-semibold"
              style={{ color: textDim }}
            >
              {patchList.length} Active Channels
            </span>
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {/* Table Header Strip */}
            <div
              className="grid grid-cols-12 py-2 px-3 text-[9px] font-mono font-bold tracking-wider uppercase"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                color: textDim,
              }}
            >
              <div className="col-span-1">CH#</div>
              <div className="col-span-3">INSTRUMENT</div>
              <div className="col-span-2">PERFORMER</div>
              <div className="col-span-3">MIC / DI</div>
              <div className="col-span-1 text-center">48V</div>
              <div className="col-span-2 text-right">NOTES</div>
            </div>

            {/* Channels Rows */}
            {patchList.length > 0 ? (
              patchList.map((ch, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 py-2 px-3 items-center text-[11.5px] font-normal tracking-tight"
                  style={{
                    borderTopColor: borderSubtle,
                  }}
                >
                  <div
                    className="col-span-1 font-mono text-[11px] font-bold"
                    style={{ color: textDim }}
                  >
                    {ch.ch}
                  </div>
                  <div className="col-span-3 font-bold truncate" style={{ color: textPrimary }}>
                    {ch.input}
                  </div>
                  <div
                    className="col-span-2 text-[11px] truncate font-medium"
                    style={{ color: textDim }}
                  >
                    {ch.performer}
                  </div>
                  <div
                    className="col-span-3 font-mono text-[11px] truncate"
                    style={{ color: textSecondary }}
                  >
                    {ch.micDi}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {ch.phantom ? (
                      <span className="text-[8px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 leading-none">
                        48V
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
                  <div
                    className="col-span-2 text-right text-[11px] truncate"
                    style={{ color: textDim }}
                  >
                    {ch.notes}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                Add elements in the editor to populate this list
              </div>
            )}
          </div>
        </section>

        {/* ── 04 // CONNECTIVITY ─────────────────────────────────── */}
        <section className="space-y-3" data-purpose="connectivity-protocols">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">04 //</span>
                Connectivity
              </h2>
            </div>
          </div>

          <div className="text-[9.5px] font-mono uppercase tracking-wider font-semibold text-blue-500 mb-2">
            Technical Requirements
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* FOH Protocol Card */}
            <div
              className="p-3.5 rounded-lg border flex flex-col gap-1"
              style={{
                backgroundColor: isLight ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.05)',
                borderColor: isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.25)',
                borderLeftWidth: '3px',
                borderLeftColor: '#3b82f6',
              }}
            >
              <div className="text-[9px] font-mono tracking-wider font-bold uppercase text-blue-500">
                FOH Protocol
              </div>
              <div className="text-[13px] font-bold text-zinc-900 dark:text-white">
                {fohProtocol}
              </div>
            </div>

            {/* Monitor / IEM Card */}
            <div
              className="p-3.5 rounded-lg border flex flex-col gap-1"
              style={{
                backgroundColor: isLight ? 'rgba(249, 115, 22, 0.03)' : 'rgba(249, 115, 22, 0.05)',
                borderColor: isLight ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.25)',
                borderLeftWidth: '3px',
                borderLeftColor: '#f97316',
              }}
            >
              <div className="text-[9px] font-mono tracking-wider font-bold uppercase text-orange-500">
                Monitor / IEM
              </div>
              <div className="text-[13px] font-bold text-zinc-900 dark:text-white">
                {monitorProtocol}
              </div>
            </div>

            {/* Power Requirements Card */}
            <div
              className="p-3.5 rounded-lg border flex flex-col gap-1"
              style={{
                backgroundColor: isLight ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.05)',
                borderColor: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)',
                borderLeftWidth: '3px',
                borderLeftColor: '#10b981',
              }}
            >
              <div className="text-[9px] font-mono tracking-wider font-bold uppercase text-emerald-500">
                Power Requirements
              </div>
              <div className="text-[13px] font-bold text-zinc-900 dark:text-white">
                {powerProtocol}
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 // SETLIST ──────────────────────────────────────── */}
        <section className="space-y-3" data-purpose="setlist-running-order">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">05 //</span>
                Setlist
              </h2>
            </div>
            {setlist && setlist.length > 0 && (
              <span
                className="text-[10px] font-mono tracking-tight font-semibold"
                style={{ color: textDim }}
              >
                TOTAL {Math.round(totalSetlistMinutes)} MIN
              </span>
            )}
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {setlist && setlist.length > 0 ? (
              setlist.map((song, idx) => (
                <div
                  key={song.id || idx}
                  className="py-2.5 px-3 flex items-center justify-between text-[12px]"
                  style={{ borderTopColor: borderSubtle }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] font-bold" style={{ color: textDim }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold" style={{ color: textPrimary }}>
                      {song.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: textDim }}>
                    {song.bpm || 120} BPM · {song.key || 'C'} · {song.duration || '04:00'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                No songs added to setlist
              </div>
            )}
          </div>
        </section>

        {/* ── 06 // TECHNICAL NOTES ──────────────────────────────── */}
        <section className="space-y-3" data-purpose="technical-notes">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">06 //</span>
                Technical Notes
              </h2>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-zinc-400">
              Click to Edit
            </span>
          </div>

          <div
            className="p-4 rounded-lg border text-[12px] leading-relaxed select-none"
            style={{
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: borderCol,
              color: textSecondary,
            }}
          >
            {riderConfig?.notes ||
              'Artist provides all instruments, IEM transmitters, and playback rack. Venue must provide all microphones, stands, and XLR cabling as per the input list. PA system must be capable of 105dB continuous at FOH without distortion. Front-fills are mandatory for the first 3 rows. All wireless systems must be frequency-coordinated prior to load-in.'}
          </div>
        </section>

        {/* ── 07 // GEAR / LOAD-IN CHECKLIST ─────────────────────── */}
        <section className="space-y-3" data-purpose="load-in-checklist">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">07 //</span>
                Gear / Load-In Checklist
              </h2>
            </div>
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {gear && gear.length > 0 ? (
              gear.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="py-2.5 px-3 flex items-center justify-between text-[12px]"
                  style={{ borderTopColor: borderSubtle }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] font-bold" style={{ color: textDim }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold" style={{ color: textPrimary }}>
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-[8.5px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                      item.packed
                        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                    }`}
                  >
                    {item.packed ? 'Verified' : 'Required'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                No gear items added — visit the Gear tab to build your list.
              </div>
            )}
          </div>
        </section>

        {/* ── DOCUMENT FOOTER ────────────────────────────────────── */}
        <footer
          className="pt-6 pb-4 border-t text-[10px] font-mono flex justify-between items-center select-none"
          style={{
            borderColor: borderCol,
            color: textDim,
          }}
        >
          <div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">STAGEX</span>
            <p className="text-[8.5px] uppercase tracking-wider mt-0.5 text-zinc-400">
              Professional Stage Plot &amp; Technical Rider Editor
            </p>
          </div>
          <div className="text-right">
            <span>{updatedDate.toUpperCase()}</span>
            <p className="text-[8.5px] uppercase tracking-wider mt-0.5 text-zinc-400">
              Last Updated: {updatedDate.toUpperCase()} - {timeString}
            </p>
          </div>
        </footer>
      </main>

      {/* ── EXPORT PDF DIALOG MODAL ──────────────────────────────── */}
      <ExportPdfDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export to PDF"
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
