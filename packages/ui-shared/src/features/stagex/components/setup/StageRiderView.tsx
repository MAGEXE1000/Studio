import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type RiderNeed } from '../../state/useStagexStore';

interface StageRiderViewProps {
  onBack: () => void;
}

const TYPE_CONFIG = {
  foh: { label: 'FOH & Audio', color: '#38bdf8', icon: 'graphic_eq' },
  monitor: { label: 'Monitors & IEM', color: '#c084fc', icon: 'headphones' },
  power: { label: 'Power & Distro', color: '#facc15', icon: 'bolt' },
  hospitality: { label: 'Hospitality', color: '#4ade80', icon: 'local_cafe' },
  custom: { label: 'Custom Note', color: '#94a3b8', icon: 'sticky_note_2' },
};

export const StageRiderView: React.FC<StageRiderViewProps> = ({ onBack }) => {
  const { riderNeeds, addRiderNeed, removeRiderNeed, riderConfig, updateRiderConfig } =
    useStagexStore();
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<RiderNeed['type']>('foh');
  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Contact & Venue Bar */}
      <div
        className="p-4 rounded-2xl border mb-6"
        style={{
          backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.75))',
          borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Production Contact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Contact Name"
            value={riderConfig.contactName || ''}
            onChange={(e) => updateRiderConfig({ contactName: e.target.value })}
            className="px-3.5 py-2 rounded-xl text-sm border bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <input
            type="text"
            placeholder="Phone / Email"
            value={riderConfig.contactPhone || ''}
            onChange={(e) => updateRiderConfig({ contactPhone: e.target.value })}
            className="px-3.5 py-2 rounded-xl text-sm border bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          />
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Technical Requirements</h3>
          <p className="text-xs text-neutral-400">
            Specifications provided to the venue sound & stage crew
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isAdding ? 'close' : 'add'}
          </span>
          {isAdding ? 'Cancel' : 'Add Spec'}
        </motion.button>
      </div>

      {/* Inline Add Spec Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="p-4 rounded-2xl border mb-6 overflow-hidden"
            style={{
              backgroundColor: 'rgba(39, 39, 42, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {(Object.keys(TYPE_CONFIG) as Array<RiderNeed['type']>).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewType(type)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        newType === type ? TYPE_CONFIG[type].color : 'rgba(255, 255, 255, 0.05)',
                      color: newType === type ? '#000000' : '#a1a1aa',
                    }}
                  >
                    {TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2x 20A dedicated circuits Stage Left"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newValue.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List of Specs */}
      <div className="flex flex-col gap-2.5">
        {riderNeeds.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-sm">
            No technical requirements added yet.
          </div>
        ) : (
          riderNeeds.map((need) => {
            const cfg = TYPE_CONFIG[need.type] || TYPE_CONFIG.custom;
            return (
              <div
                key={need.id}
                className="flex items-center justify-between p-3.5 rounded-xl border group transition-all"
                style={{
                  backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.6))',
                  borderColor: 'var(--c-border, rgba(255, 255, 255, 0.06))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cfg.color}18` }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: cfg.color, fontSize: 18 }}
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
                    <p className="text-sm font-medium text-neutral-200 truncate">{need.value}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeRiderNeed(need.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Delete specification"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    delete
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
