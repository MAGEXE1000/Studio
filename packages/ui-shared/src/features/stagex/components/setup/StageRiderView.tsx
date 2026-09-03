import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type RiderNeed } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { StageSetupStatsStrip } from './StageSetupStatsStrip';
import { StageSetupEmptyState } from './StageSetupEmptyState';
import { useSettingsStore } from '@workspace/studio-core';

interface StageRiderViewProps {
  onBack: () => void;
  isLight?: boolean;
}

const TYPE_CONFIG = {
  foh: { label: 'FOH & Audio', color: '#38bdf8', icon: 'graphic_eq' },
  monitor: { label: 'Monitors & IEM', color: '#c084fc', icon: 'headphones' },
  power: { label: 'Power & Distro', color: '#facc15', icon: 'bolt' },
  hospitality: { label: 'Hospitality', color: '#4ade80', icon: 'local_cafe' },
  custom: { label: 'Custom Note', color: '#94a3b8', icon: 'sticky_note_2' },
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
    riderMixes,
  } = useStagexStore();

  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<RiderNeed['type']>('foh');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredNeeds = useMemo(() => {
    if (selectedCategory === 'all') return riderNeeds;
    return riderNeeds.filter((n) => n.type === selectedCategory);
  }, [riderNeeds, selectedCategory]);

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

  const statItems = [
    {
      label: 'Channels',
      value: riderChannels.length,
      accentColor: '#38bdf8',
    },
    {
      label: 'Stage Specs',
      value: riderNeeds.length,
      accentColor: '#ec4899',
    },
    {
      label: 'IEM Mixes',
      value: riderMixes.length,
      accentColor: '#c084fc',
    },
    {
      label: 'Distro / Pwr',
      value: riderNeeds.filter((n) => n.type === 'power').length,
      accentColor: '#facc15',
    },
  ];

  return (
    <StageSetupDetailLayout
      title="Technical Rider"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-sm"
          style={{
            backgroundColor: isAdding
              ? '#ec4899'
              : isLight
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isAdding
              ? '#ec4899'
              : isLight
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.08)',
            color: isAdding ? '#ffffff' : isLight ? '#09090b' : '#ffffff',
          }}
          title={isAdding ? 'Cancel' : 'Add Requirement'}
          aria-label={isAdding ? 'Cancel' : 'Add Requirement'}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform duration-200"
            style={{ transform: isAdding ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            add
          </span>
        </button>
      }
    >
      {/* Compact Statistics Summary Strip */}
      <StageSetupStatsStrip items={statItems} isLight={isLight} />

      {/* Production Contact & Venue Card */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--c-bg-card, #0e0e12)',
          borderColor: isLight
            ? 'rgba(0, 0, 0, 0.08)'
            : 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{ color: isLight ? '#09090b' : '#ffffff' }}
            >
              badge
            </span>
          </div>
          <div>
            <h3
              className="text-[14px] font-bold tracking-tight"
              style={{
                color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Production Contact & Venue
            </h3>
            <p
              className="text-[11.5px]"
              style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
            >
              Sound engineer, stage manager & venue details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[10.5px] font-bold uppercase tracking-wider mb-1"
              style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
            >
              Production Contact
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Miller (FOH)"
              value={riderConfig.contactName || ''}
              onChange={(e) => updateRiderConfig({ contactName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#09090b' : '#ffffff',
              }}
            />
          </div>

          <div>
            <label
              className="block text-[10.5px] font-bold uppercase tracking-wider mb-1"
              style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
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
                borderColor: isLight ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#09090b' : '#ffffff',
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="block text-[10.5px] font-bold uppercase tracking-wider mb-1"
              style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
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
                borderColor: isLight ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#09090b' : '#ffffff',
              }}
            />
          </div>
        </div>
      </div>

      {/* Technical Requirements Card */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--c-bg-card, #0e0e12)',
          borderColor: isLight
            ? 'rgba(0, 0, 0, 0.08)'
            : 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                className="material-symbols-outlined text-[17px]"
                style={{ color: isLight ? '#09090b' : '#ffffff' }}
              >
                alt_route
              </span>
            </div>
            <div>
              <h3
                className="text-[14px] font-bold tracking-tight"
                style={{
                  color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Technical Requirements
              </h3>
              <p
                className="text-[11.5px]"
                style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
              >
                Specifications for the venue sound & stage crew
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{
              backgroundColor: isAdding
                ? isLight
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.12)'
                : isLight
                  ? '#09090b'
                  : '#ffffff',
              color: isAdding ? (isLight ? '#09090b' : '#ffffff') : isLight ? '#ffffff' : '#09090b',
            }}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isAdding ? 'close' : 'add'}
            </span>
            <span>{isAdding ? 'Cancel' : 'Add Spec'}</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            style={{
              backgroundColor:
                selectedCategory === 'all'
                  ? isLight
                    ? '#09090b'
                    : '#ffffff'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.05)',
              color:
                selectedCategory === 'all'
                  ? isLight
                    ? '#ffffff'
                    : '#09090b'
                  : isLight
                    ? '#71717a'
                    : '#a1a1aa',
            }}
          >
            All ({riderNeeds.length})
          </button>
          {(Object.keys(TYPE_CONFIG) as Array<RiderNeed['type']>).map((type) => {
            const count = riderNeeds.filter((n) => n.type === type).length;
            const isCatActive = selectedCategory === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedCategory(type)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                style={{
                  backgroundColor: isCatActive
                    ? TYPE_CONFIG[type].color
                    : isLight
                      ? 'rgba(0, 0, 0, 0.04)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: isCatActive ? '#000000' : isLight ? '#71717a' : '#a1a1aa',
                }}
              >
                <span>{TYPE_CONFIG[type].label}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Expandable Inline Add Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="p-4 rounded-[16px] border mb-4 overflow-hidden flex flex-col gap-3"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Object.keys(TYPE_CONFIG) as Array<RiderNeed['type']>).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: newType === type ? TYPE_CONFIG[type].color : 'transparent',
                      color: newType === type ? '#000000' : isLight ? '#71717a' : '#a1a1aa',
                      border: `1px solid ${
                        newType === type
                          ? TYPE_CONFIG[type].color
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
                  placeholder="e.g. Dante Primary/Secondary @ 96kHz or 2x 20A circuits"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
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

        {/* Requirements List */}
        <div className="flex flex-col gap-2">
          {filteredNeeds.length === 0 ? (
            <StageSetupEmptyState
              icon="alt_route"
              title="No requirements found"
              description="Add specifications for audio, monitors, power distribution, or hospitality"
              actionLabel="Add Specification"
              onAction={() => setIsAdding(true)}
              iconColor="#38bdf8"
              isLight={isLight}
            />
          ) : (
            filteredNeeds.map((need) => {
              const cfg = TYPE_CONFIG[need.type] || TYPE_CONFIG.custom;
              return (
                <div
                  key={need.id}
                  className="flex items-center justify-between p-3 rounded-[14px] border transition-all"
                  style={{
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        borderColor: `${cfg.color}30`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-[17px]"
                        style={{ color: cfg.color }}
                      >
                        {cfg.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                      >
                        {need.value}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRiderNeed(need.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                    title="Delete specification"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Technical Notes Card */}
      <div
        className="p-5 rounded-[20px] border shadow-sm"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--c-bg-card, #0e0e12)',
          borderColor: isLight
            ? 'rgba(0, 0, 0, 0.08)'
            : 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{ color: isLight ? '#09090b' : '#ffffff' }}
            >
              notes
            </span>
          </div>
          <div>
            <h3
              className="text-[14px] font-bold tracking-tight"
              style={{
                color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Stage & Production Notes
            </h3>
            <p
              className="text-[11.5px]"
              style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
            >
              Load-in schedule, parking, or specific stage instructions
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="e.g. Load-in at loading dock B. Sound check strictly at 4:30 PM."
          value={riderConfig.notes || ''}
          onChange={(e) => updateRiderConfig({ notes: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors"
          style={{
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
            borderColor: isLight ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.08)',
            color: isLight ? '#09090b' : '#ffffff',
          }}
        />
      </div>
    </StageSetupDetailLayout>
  );
};
