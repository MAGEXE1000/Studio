import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStagexStore } from '../../state/useStagexStore';
import { ExportPdfDialog } from '../dialogs/ExportPdfDialog';
import { useBackHandler } from '@workspace/studio-core';
import { STAGEX_ICON_MAP } from '../../constants';
import { projectProductionDocumentData } from '../../services/projectProductionDocumentData';
import { generateProductionDocumentPdf } from '../../services/generateProductionDocumentPdf';

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
  const store = useStagexStore();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportBusy, setIsExportBusy] = useState(false);
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

  // Compute canonical document data projection
  const data = useMemo(() => {
    return projectProductionDocumentData(store, pdfSceneChoice);
  }, [store, pdfSceneChoice]);

  const [pdfFileName, setPdfFileName] = useState(
    () =>
      `${(data.projectName || 'Main_Stage').replace(/\s+/g, '_')}_Production_Document_${new Date().toISOString().slice(0, 10)}`
  );

  // Scene info for export dialog
  const sceneInfo = useMemo(
    () => ({
      count: data.totalScenes || 1,
      currentIdx: data.sceneIdx || 0,
      names:
        store.scenes && store.scenes.length > 0
          ? store.scenes.map((s, i) => s.name || `Scene ${i + 1}`)
          : [data.sceneName],
    }),
    [data.totalScenes, data.sceneIdx, data.sceneName, store.scenes]
  );

  // PDF Export Execution
  const executeExport = useCallback(
    async (share: boolean) => {
      setIsExportBusy(true);
      try {
        await generateProductionDocumentPdf(data, {
          fileName: pdfFileName,
          share,
        });
        setIsExportDialogOpen(false);
      } catch (err) {
        console.error('Failed to generate production document PDF:', err);
      } finally {
        setIsExportBusy(false);
      }
    },
    [data, pdfFileName]
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
              data-testid="production-document-back-btn"
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
              data-testid="production-document-title"
              className="text-[14px] font-bold tracking-tight select-none"
              style={{
                color: isLight ? '#09090b' : '#ffffff',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Production Document
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
              data-testid="stage-export-btn"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={isExportBusy}
              aria-label="Export Production Document"
              title="Export Production Document"
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
        {/* ── PRODUCTION IDENTITY SECTION ──────────────────────────── */}
        <section className="space-y-3 pt-2" data-purpose="production-identity">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-bold tracking-wider text-blue-500 uppercase">
                Live Stage Production Document
              </div>
              <span
                data-testid="production-document-id"
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-500 uppercase tracking-widest"
              >
                {data.documentId}
              </span>
            </div>

            <h1
              data-testid="export-doc-project-name"
              className="text-3xl font-black tracking-tight uppercase"
              style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
            >
              {data.projectName || 'MAIN STAGE'}
            </h1>

            <p className="text-[13px] font-medium text-zinc-500 tracking-tight">
              {data.projectName} · {data.sceneName}
            </p>
          </div>

          <div
            className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono font-semibold"
            style={{ color: textDim }}
          >
            <span className="uppercase" style={{ color: textPrimary }}>
              ELEMENTS {data.elements.length}
            </span>
            <span>•</span>
            <span className="uppercase">CHANNELS {data.channels.length}</span>
            <span>•</span>
            <span className="uppercase">{data.date}</span>
          </div>

          {/* Metadata Grid Strip (Venue & Contact) */}
          <div
            className="grid grid-cols-2 border-t border-b mt-4 select-none"
            style={{ borderColor: borderCol }}
          >
            <div
              className="py-2.5 pr-4 border-r flex flex-col gap-0.5"
              style={{ borderColor: borderCol }}
            >
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">
                Venue / Stage
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {data.venue || 'Production Stage'}
              </span>
            </div>
            <div className="py-2.5 pl-4 flex flex-col gap-0.5">
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase text-zinc-400">
                Production Contact
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {data.contactName
                  ? `${data.contactName} (${data.contactPhone || 'FOH'})`
                  : 'Stage Director'}
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
              SCALE: 1:50 · {data.stageDimensions}
            </span>
          </div>

          {/* Literal Stage Plot Canvas Container */}
          {data.elements.length === 0 ? (
            <div
              data-testid="stage-plot-empty"
              className="w-full flex items-center justify-center rounded-lg border border-dashed select-none"
              style={{
                height: data.isSquare ? '280px' : '200px',
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
                data.isSquare ? 'aspect-square max-h-[420px]' : 'aspect-[16/9] max-h-[360px]'
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
                {data.connections.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {data.connections.map((conn: any, cIdx: number) => {
                      const fromEl = data.elements.find((e: any) => e.id === conn.fromId);
                      const toEl = data.elements.find((e: any) => e.id === conn.toId);
                      if (!fromEl || !toEl) return null;
                      const x1 = Math.min(94, Math.max(6, (fromEl.x / data.refW) * 100));
                      const y1 = Math.min(94, Math.max(6, (fromEl.y / data.refH) * 100));
                      const x2 = Math.min(94, Math.max(6, (toEl.x / data.refW) * 100));
                      const y2 = Math.min(94, Math.max(6, (toEl.y / data.refH) * 100));
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
                {data.elements.map((el: any, idx: number) => {
                  const rawPctX = (el.x / data.refW) * 100;
                  const rawPctY = (el.y / data.refH) * 100;
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
                Input Channel &amp; Patch List
              </h2>
            </div>
            <span
              className="text-[10px] font-mono tracking-tight font-semibold"
              style={{ color: textDim }}
            >
              {data.channels.length} Active Channels
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
            {data.channels.length > 0 ? (
              data.channels.map((ch, idx) => (
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
                    {ch.source}
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
                    {ch.mic}
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
                No channels configured — add stage elements or patch channels to populate
              </div>
            )}
          </div>
        </section>

        {/* ── 03 // TECHNICAL REQUIREMENTS ───────────────────────── */}
        <section className="space-y-3" data-purpose="connectivity-protocols">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">03 //</span>
                Technical Requirements
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold" style={{ color: textDim }}>
              {data.totalRequirementsCount} Specs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
              <div className="text-[12px] font-bold" style={{ color: textPrimary }}>
                {data.requirements.foh[0] || 'Dante 96kHz'}
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
              <div className="text-[12px] font-bold" style={{ color: textPrimary }}>
                {data.requirements.monitor[0] || 'Stereo IEM Mixes'}
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
              <div className="text-[12px] font-bold" style={{ color: textPrimary }}>
                {data.requirements.power[0] || '2× 20A Circuits'}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 // PRODUCTION & TECHNICAL NOTES ─────────────────── */}
        <section className="space-y-3" data-purpose="technical-notes">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">04 //</span>
                Production &amp; Technical Notes
              </h2>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border text-[12px] leading-relaxed select-none"
            style={{
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: borderCol,
              color: textSecondary,
            }}
          >
            {data.notes}
          </div>
        </section>

        {/* ── 05 // SETLIST RUNNING ORDER ────────────────────────── */}
        <section className="space-y-3" data-purpose="setlist-running-order">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">05 //</span>
                Setlist Running Order
              </h2>
            </div>
            {data.setlist.length > 0 && (
              <span
                className="text-[10px] font-mono tracking-tight font-semibold"
                style={{ color: textDim }}
              >
                TOTAL {data.totalSetlistMinutes} MIN
              </span>
            )}
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {data.setlist.length > 0 ? (
              data.setlist.map((song, idx) => (
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
                    {song.artist && (
                      <span className="text-[11px]" style={{ color: textDim }}>
                        · {song.artist}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: textDim }}>
                    {song.key ? `${song.key} · ` : ''}
                    {song.bpm ? `${song.bpm} BPM · ` : ''}
                    {song.duration || '04:00'}
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

        {/* ── 06 // GEAR / LOAD-IN CHECKLIST ─────────────────────── */}
        <section className="space-y-3" data-purpose="load-in-checklist">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">06 //</span>
                Gear / Load-In Checklist
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold" style={{ color: textDim }}>
              {data.totalGearUnits} Units ({data.packedGearUnits} Packed)
            </span>
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {data.gear.length > 0 ? (
              data.gear.map((item, idx) => (
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
                    <span className="text-[11px]" style={{ color: textDim }}>
                      ({item.category || 'General'}) · {item.qty || 1}x
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

        {/* ── 07 // BAND & CREW ROSTER ───────────────────────────── */}
        <section className="space-y-3" data-purpose="band-crew-roster">
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-[14px] font-extrabold tracking-tight uppercase"
                style={{ color: textPrimary, fontFamily: "'Manrope', sans-serif" }}
              >
                <span className="text-blue-500 font-mono text-[11px] mr-1.5">07 //</span>
                Band &amp; Crew Roster
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold" style={{ color: textDim }}>
              {data.totalMembers} Members ({data.assignedMembersCount} Assigned)
            </span>
          </div>

          <div
            className="border rounded-lg overflow-hidden divide-y select-none"
            style={{ borderColor: borderCol }}
          >
            {data.members.length > 0 ? (
              data.members.map((member, idx) => (
                <div
                  key={member.id || idx}
                  className="py-2.5 px-3 flex items-center justify-between text-[12px]"
                  style={{ borderTopColor: borderSubtle }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border shrink-0"
                      style={{
                        backgroundColor: member.color ? `${member.color}20` : 'rgba(0,0,0,0.05)',
                        borderColor: member.color || borderCol,
                        color: member.color || textPrimary,
                      }}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold block" style={{ color: textPrimary }}>
                        {member.name}
                      </span>
                      <span className="text-[10px]" style={{ color: textDim }}>
                        {member.role || 'Band Member'} ·{' '}
                        {member.assignedElements.length > 0
                          ? `Assigned: ${member.assignedElements.join(', ')}`
                          : 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {(member.phone || member.email) && (
                    <span className="text-[10px] font-mono" style={{ color: textDim }}>
                      {[member.phone, member.email].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                No members added — visit the Band &amp; Crew tab to build your roster.
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
              Professional Stage Plot &amp; Production Document Editor
            </p>
          </div>
          <div className="text-right">
            <span>{data.date.toUpperCase()}</span>
            <p className="text-[8.5px] uppercase tracking-wider mt-0.5 text-zinc-400">
              Last Updated: {data.date.toUpperCase()} - {data.time}
            </p>
          </div>
        </footer>
      </main>

      {/* ── EXPORT PDF DIALOG MODAL ──────────────────────────────── */}
      <ExportPdfDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        title="Export Production Document"
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
