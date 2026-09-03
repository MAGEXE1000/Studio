import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type RiderNeed } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { useSettingsStore } from '@workspace/studio-core';

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

  const {
    riderNeeds,
    addRiderNeed,
    removeRiderNeed,
    riderConfig,
    updateRiderConfig,
    riderChannels,
  } = useStagexStore();

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
        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-sm"
          style={{
            backgroundColor: isAdding
              ? '#ec4899'
              : isLight
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isAdding
              ? '#ec4899'
              : isLight
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.10)',
            color: isAdding ? '#ffffff' : textPrimary,
          }}
          title={isAdding ? 'Cancel' : 'Add Need'}
          aria-label={isAdding ? 'Cancel' : 'Add Need'}
        >
          <span
            className="material-symbols-outlined text-[16px] transition-transform duration-200"
            style={{ transform: isAdding ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            add
          </span>
          <span className="hidden min-[380px]:inline">{isAdding ? 'Cancel' : 'Add Need'}</span>
        </button>
      }
    >
      {/* 1. Stage Elements & Channels Card */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
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
            No Stage Elements Yet
          </h4>
          <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: textSecondary }}>
            Add elements to the stage — they appear here in order.
          </p>
        </div>

        {/* Divider & Bottom Metrics Strip */}
        <div
          className="w-full h-px my-2"
          style={{ backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}
        />

        <div className="grid grid-cols-2 pt-3 text-left">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Channels
            </span>
            <p
              className="text-[20px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {riderChannels.length} / 32
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
              className="text-[20px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              0
            </p>
          </div>
        </div>
      </div>

      {/* 2. Technical Requirements Card */}
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

      {/* 3. Technical Notes Card */}
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

      {/* 4. Production Contact & Venue Card */}
      <div
        className="p-5 rounded-[20px] border shadow-sm"
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
    </StageSetupDetailLayout>
  );
};
