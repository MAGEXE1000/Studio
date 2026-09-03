import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type RiderNeed } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { useSettingsStore, useT } from '@workspace/studio-core';
import { ExportPdfDialog } from '../dialogs/ExportPdfDialog';
import { StageBridge } from '../../services/StageBridgeService';

interface StageRiderViewProps {
  onBack: () => void;
  isLight?: boolean;
}

const TYPE_CONFIG = {
  foh: { label: 'FOH Protocol', color: '#38bdf8', icon: 'graphic_eq' },
  monitor: { label: 'Monitor / IEM', color: '#c084fc', icon: 'headphones' },
  power: { label: 'Power Requirement', color: '#facc15', icon: 'bolt' },
  hospitality: { label: 'Hospitality', color: '#4ade80', icon: 'local_cafe' },
  custom: { label: 'Production Spec', color: '#94a3b8', icon: 'sticky_note_2' },
};

export const StageRiderView: React.FC<StageRiderViewProps> = ({ onBack, isLight: isLightProp }) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;
  const t = useT();
  const tr = t as any;

  const {
    projectName,
    elements,
    scenes,
    currentSceneIdx,
    riderNeeds,
    addRiderNeed,
    removeRiderNeed,
    riderConfig,
    updateRiderConfig,
    riderChannels,
    members,
    gear,
  } = useStagexStore();

  // Dialog export state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(
    `${(projectName || 'StagePlot').replace(/\s+/g, '_')}_Technical_Rider`
  );
  const [pdfSceneChoice, setPdfSceneChoice] = useState<'current' | 'all' | number>('current');

  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<RiderNeed['type']>('foh');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const defaultNotes =
    'Artist provides all instruments, IEM transmitters, and playback rack. Venue supplies microphones, stands, and XLR cabling. PA must sustain 105 dB continuous at FOH.';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    addRiderNeed({
      type: newType,
      value: newValue.trim(),
    });
    setNewValue('');
    setIsAdding(false);
  };

  const handleExportClick = () => {
    const cleanName = `${(projectName || 'StagePlot').replace(/\s+/g, '_')}_Rider_${new Date().toISOString().slice(0, 10)}`;
    setPdfFileName(cleanName);
    setPdfDialogOpen(true);
  };

  const executeExport = async (share: boolean) => {
    setPdfBusy(true);
    try {
      const iframe = StageBridge.getActiveIframe();
      await StageBridge.exportPdf(iframe, {
        name: (pdfFileName.trim() || 'TechnicalRider') + '.pdf',
        includeBackdrop: true,
        action: share ? 'share' : 'save',
        scene: pdfSceneChoice,
      } as any);
      setPdfDialogOpen(false);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setPdfBusy(false);
    }
  };

  // Scene metadata
  const currentScene = scenes[currentSceneIdx] || { name: 'Scene 1' };
  const sceneInfo = useMemo(() => {
    return {
      count: scenes.length || 1,
      currentIdx: currentSceneIdx,
      names: scenes.map((s, i) => s.name || `Scene ${i + 1}`),
    };
  }, [scenes, currentSceneIdx]);

  // Derive audio input channels from riderChannels or from stage elements
  const patchList = useMemo(() => {
    if (riderChannels && riderChannels.length > 0) {
      return riderChannels;
    }
    if (!elements || elements.length === 0) return [];
    return elements.map((el, idx) => ({
      ch: idx + 1,
      name: el.label || el.name || el.type || `Input ${idx + 1}`,
      transducer:
        el.transducer ||
        (el.type?.includes('mic')
          ? 'Dynamic Mic'
          : el.type?.includes('di')
            ? 'Direct Box (DI)'
            : 'Line / XLR'),
      phantom: Boolean(el.phantom || el.type?.includes('condenser')),
      mix: el.mix || `Mix ${(idx % 4) + 1}`,
    }));
  }, [riderChannels, elements]);

  const cardBg = isLight ? '#ffffff' : 'var(--c-bg-card, #0d0d11)';
  const cardBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'var(--c-border, rgba(255, 255, 255, 0.08))';
  const textPrimary = isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff';
  const textSecondary = isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa';

  return (
    <StageSetupDetailLayout
      title="Technical Rider"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{
              backgroundColor: '#ec4899',
              borderColor: '#ec4899',
              color: '#ffffff',
            }}
            title="Export Rider to PDF"
            aria-label="Export Rider to PDF"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Export</span>
          </button>
        </div>
      }
    >
      {/* ── DOCUMENT COVER / HEADER BANNER ────────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          background: isLight
            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.04) 0%, #ffffff 100%)'
            : 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(20, 20, 26, 0.95) 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span
              className="text-[9.5px] font-black uppercase tracking-widest block mb-1 text-pink-500"
              style={{ letterSpacing: '0.12em' }}
            >
              TECHNICAL RIDER & STAGE SPECIFICATION
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
              style={{ color: textPrimary, fontFamily: 'var(--font-headline)' }}
            >
              {projectName || 'Main Stage'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border"
              style={{
                backgroundColor: isLight ? '#09090b' : '#ffffff',
                color: isLight ? '#ffffff' : '#09090b',
                borderColor: isLight ? '#09090b' : '#ffffff',
              }}
            >
              {currentScene.name || 'Scene 1'}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                color: textSecondary,
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.10)',
              }}
            >
              {new Date()
                .toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
                .toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed max-w-2xl" style={{ color: textSecondary }}>
          Comprehensive live production rider detailing stage plot arrangement, audio input patch
          list, monitoring channels, power distribution, and crew specifications.
        </p>
      </div>

      {/* ── 1. STAGE ELEMENTS & PLOT LAYOUT CARD ──────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: textPrimary, letterSpacing: '0.08em' }}
          >
            Stage Plot Elements & Layout
          </h3>
          <span
            className="text-[10.5px] font-bold px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              color: textSecondary,
            }}
          >
            {elements.length} {elements.length === 1 ? 'Element' : 'Elements'} on Stage
          </span>
        </div>

        {elements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {elements.map((el, i) => (
              <div
                key={el.id || i}
                className="p-3 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[17px]"
                      style={{ color: isLight ? '#09090b' : '#ffffff' }}
                    >
                      {el.type?.includes('drum')
                        ? 'album'
                        : el.type?.includes('mic')
                          ? 'mic'
                          : el.type?.includes('amp')
                            ? 'speaker'
                            : el.type?.includes('key')
                              ? 'piano'
                              : 'queue_music'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                      {el.label || el.name || el.type || `Element ${i + 1}`}
                    </p>
                    <span className="text-[10px] font-medium" style={{ color: textSecondary }}>
                      Position: X {Math.round(el.x || 0)}% · Y {Math.round(el.y || 0)}%
                    </span>
                  </div>
                </div>

                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    color: textSecondary,
                  }}
                >
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div
              className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-3 border shadow-sm"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ color: isLight ? '#09090b' : '#ffffff' }}
              >
                alt_route
              </span>
            </div>
            <h4
              className="text-xs font-black uppercase tracking-wider mb-1.5"
              style={{ color: textPrimary, letterSpacing: '0.08em' }}
            >
              No Stage Elements Placed
            </h4>
            <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: textSecondary }}>
              Add instruments, microphones, and monitors in the Stage plot editor to populate this
              section.
            </p>
          </div>
        )}

        {/* Divider & Metrics Strip */}
        <div
          className="w-full h-px my-2"
          style={{ backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}
        />

        <div className="grid grid-cols-3 pt-3 text-left">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Channels
            </span>
            <p
              className="text-[18px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {patchList.length}
            </p>
          </div>

          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Elements
            </span>
            <p
              className="text-[18px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {elements.length}
            </p>
          </div>

          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Band / Crew
            </span>
            <p
              className="text-[18px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {members.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. INPUT CHANNELS & PATCH LIST CARD ────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: textPrimary, letterSpacing: '0.08em' }}
          >
            Input Channel & Patch List
          </h3>
          <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
            {patchList.length} Active Channels
          </span>
        </div>

        {patchList.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
                >
                  <th
                    className="py-2 px-2 font-black uppercase text-[9.5px] tracking-wider"
                    style={{ color: textSecondary, width: 40 }}
                  >
                    CH
                  </th>
                  <th
                    className="py-2 px-2 font-black uppercase text-[9.5px] tracking-wider"
                    style={{ color: textSecondary }}
                  >
                    Source / Instrument
                  </th>
                  <th
                    className="py-2 px-2 font-black uppercase text-[9.5px] tracking-wider"
                    style={{ color: textSecondary }}
                  >
                    Transducer / Mic / DI
                  </th>
                  <th
                    className="py-2 px-2 font-black uppercase text-[9.5px] tracking-wider text-center"
                    style={{ color: textSecondary, width: 50 }}
                  >
                    +48V
                  </th>
                  <th
                    className="py-2 px-2 font-black uppercase text-[9.5px] tracking-wider text-right"
                    style={{ color: textSecondary, width: 90 }}
                  >
                    Monitor Mix
                  </th>
                </tr>
              </thead>
              <tbody>
                {patchList.map((ch, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }}
                  >
                    <td
                      className="py-2.5 px-2 font-black text-[11px]"
                      style={{ color: textPrimary }}
                    >
                      {ch.ch || idx + 1}
                    </td>
                    <td className="py-2.5 px-2 font-bold" style={{ color: textPrimary }}>
                      {ch.name}
                    </td>
                    <td className="py-2.5 px-2 font-medium" style={{ color: textSecondary }}>
                      {ch.transducer || 'Dynamic Mic'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: ch.phantom
                            ? '#10b981'
                            : isLight
                              ? 'rgba(0,0,0,0.1)'
                              : 'rgba(255,255,255,0.1)',
                        }}
                        title={ch.phantom ? '48V Active' : '48V Off'}
                      />
                    </td>
                    <td
                      className="py-2.5 px-2 text-right font-medium"
                      style={{ color: textSecondary }}
                    >
                      {ch.mix || 'Mix 1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs py-3 text-center" style={{ color: textSecondary }}>
            No channels defined. Add instruments to the stage to generate the input patch list.
          </p>
        )}
      </div>

      {/* ── 3. TECHNICAL REQUIREMENTS CARD ─────────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: textPrimary, letterSpacing: '0.08em' }}
          >
            Technical Requirements
          </h3>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer border"
            style={{
              backgroundColor: isAdding
                ? isLight
                  ? 'rgba(0,0,0,0.06)'
                  : 'rgba(255,255,255,0.1)'
                : isLight
                  ? 'rgba(0,0,0,0.03)'
                  : 'rgba(255,255,255,0.05)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              color: textPrimary,
            }}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isAdding ? 'close' : 'add'}
            </span>
            <span>{isAdding ? 'Cancel' : 'Add Need'}</span>
          </button>
        </div>

        {/* Inline Add Need Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="p-3.5 rounded-[16px] border mb-4 overflow-hidden flex flex-col gap-3"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Object.keys(TYPE_CONFIG) as Array<RiderNeed['type']>).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        newType === type ? (isLight ? '#09090b' : '#ffffff') : 'transparent',
                      color: newType === type ? (isLight ? '#ffffff' : '#09090b') : textSecondary,
                      border: `1px solid ${
                        newType === type
                          ? isLight
                            ? '#09090b'
                            : '#ffffff'
                          : isLight
                            ? 'rgba(0,0,0,0.08)'
                            : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                  >
                    {TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Dante Primary/Secondary @ 96kHz"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: textPrimary,
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newValue.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  style={{
                    backgroundColor: isLight ? '#09090b' : '#ffffff',
                    color: isLight ? '#ffffff' : '#09090b',
                  }}
                >
                  Save
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Requirements Rows */}
        <div className="flex flex-col gap-2">
          {riderNeeds.map((need) => {
            const cfg = TYPE_CONFIG[need.type] || TYPE_CONFIG.custom;
            const isExpanded = expandedId === need.id;
            return (
              <div
                key={need.id}
                className="p-3.5 rounded-[14px] border transition-all cursor-pointer"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => setExpandedId(isExpanded ? null : need.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span
                      className="text-[9.5px] font-black uppercase tracking-wider block"
                      style={{ color: textSecondary, letterSpacing: '0.06em' }}
                    >
                      {cfg.label}
                    </span>
                    <p
                      className="text-xs font-medium truncate mt-0.5"
                      style={{ color: isLight ? '#27272a' : '#e4e4e7' }}
                    >
                      {need.value}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRiderNeed(need.id);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer"
                      style={{ color: textSecondary }}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                    <span
                      className="material-symbols-outlined text-[18px] transition-transform duration-200"
                      style={{
                        color: textSecondary,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    >
                      chevron_right
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. TECHNICAL NOTES CARD ────────────────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <h3
          className="text-[11px] font-black uppercase tracking-wider mb-2.5"
          style={{ color: textPrimary, letterSpacing: '0.08em' }}
        >
          Technical Notes
        </h3>
        <textarea
          rows={3}
          value={riderConfig.notes !== undefined ? riderConfig.notes : defaultNotes}
          onChange={(e) => updateRiderConfig({ notes: e.target.value })}
          className="w-full p-3 rounded-xl text-xs leading-relaxed border focus:outline-none transition-colors"
          style={{
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
            borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)',
            color: textSecondary,
          }}
        />
      </div>

      {/* ── 5. PRODUCTION CONTACT & VENUE CARD ─────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <h3
          className="text-[11px] font-black uppercase tracking-wider mb-3"
          style={{ color: textPrimary, letterSpacing: '0.08em' }}
        >
          Production Contact & Venue
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: textSecondary }}
            >
              Contact Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Miller (FOH)"
              value={riderConfig.contactName || ''}
              onChange={(e) => updateRiderConfig({ contactName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)',
                color: textPrimary,
              }}
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: textSecondary }}
            >
              Phone / Email
            </label>
            <input
              type="text"
              placeholder="e.g. +1 555-0192 / alex@crew.org"
              value={riderConfig.contactPhone || ''}
              onChange={(e) => updateRiderConfig({ contactPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)',
                color: textPrimary,
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="block text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: textSecondary }}
            >
              Venue / Festival
            </label>
            <input
              type="text"
              placeholder="e.g. The Paramount Theater, Main Stage"
              value={riderConfig.venue || ''}
              onChange={(e) => updateRiderConfig({ venue: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)',
                color: textPrimary,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 6. BAND & CREW SUMMARY CARD ────────────────────────── */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: textPrimary, letterSpacing: '0.08em' }}
          >
            Band & Crew Roster
          </h3>
          <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
            {members.length} Members
          </span>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl border flex items-center gap-2.5"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                  borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                  style={{ backgroundColor: '#ec4899', color: '#fff' }}
                >
                  {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                    {m.name}
                  </p>
                  <p className="text-[10.5px] truncate" style={{ color: textSecondary }}>
                    {m.role || 'Performer'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs py-2 text-center" style={{ color: textSecondary }}>
            No band or crew members added yet.
          </p>
        )}
      </div>

      {/* ── 7. GEAR & LOAD-IN SUMMARY CARD ─────────────────────── */}
      <div
        className="p-5 rounded-[20px] border shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: textPrimary, letterSpacing: '0.08em' }}
          >
            Gear Inventory & Load-In Summary
          </h3>
          <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
            {gear.length} Items Listed
          </span>
        </div>

        {gear.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {gear.slice(0, 6).map((g) => (
              <div
                key={g.id}
                className="py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <span className="font-medium truncate pr-2" style={{ color: textPrimary }}>
                  {g.name}
                </span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: g.packed
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    color: g.packed ? '#10b981' : '#f59e0b',
                  }}
                >
                  {g.packed ? 'packed' : 'pending'}
                </span>
              </div>
            ))}
            {gear.length > 6 && (
              <span className="text-[10.5px] text-center pt-1" style={{ color: textSecondary }}>
                + {gear.length - 6} more gear items in Inventory
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs py-2 text-center" style={{ color: textSecondary }}>
            No gear items listed in inventory.
          </p>
        )}
      </div>

      {/* Export PDF Dialog */}
      <ExportPdfDialog
        open={pdfDialogOpen}
        onClose={() => !pdfBusy && setPdfDialogOpen(false)}
        title={tr.stagex?.pdfSheetTitle || 'Export Technical Rider & Plot'}
        nameLabel={tr.stagex?.pdfSheetNameLabel || 'Document Name'}
        fileName={pdfFileName}
        setFileName={setPdfFileName}
        busy={pdfBusy}
        sceneInfo={sceneInfo}
        sceneChoice={pdfSceneChoice}
        setSceneChoice={setPdfSceneChoice}
        sceneCurrentLabel={tr.stagex?.pdfSheetSceneCurrent || 'Current Scene'}
        sceneAllLabel={tr.stagex?.pdfSheetSceneAll || 'All Scenes'}
        canShare={typeof navigator !== 'undefined' && Boolean(navigator.share)}
        onSave={() => executeExport(false)}
        onShare={() => executeExport(true)}
        saveLabel={tr.stagex?.pdfSheetSave || 'Save PDF'}
        shareLabel={tr.stagex?.pdfSheetShare || 'Share PDF'}
        cancelLabel={tr.stagex?.pdfSheetCancel || 'Cancel'}
      />
    </StageSetupDetailLayout>
  );
};
