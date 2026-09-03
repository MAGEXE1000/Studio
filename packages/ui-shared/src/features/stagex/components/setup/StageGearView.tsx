import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type GearItem } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { StageSetupStatsStrip } from './StageSetupStatsStrip';
import { StageSetupEmptyState } from './StageSetupEmptyState';
import { useSettingsStore } from '@workspace/studio-core';

interface StageGearViewProps {
  onBack: () => void;
  isLight?: boolean;
}

const GEAR_CATEGORIES: Array<{
  key: GearItem['category'];
  label: string;
  icon: string;
  color: string;
}> = [
  { key: 'mics', label: 'Microphones', icon: 'mic', color: '#38bdf8' },
  { key: 'inst', label: 'Instruments', icon: 'piano', color: '#a855f7' },
  { key: 'amps', label: 'Amplifiers & Cabs', icon: 'speaker', color: '#f97316' },
  { key: 'mon', label: 'Monitoring & IEM', icon: 'headphones', color: '#10b981' },
  { key: 'util', label: 'Utilities & Power', icon: 'power', color: '#facc15' },
  { key: 'cables', label: 'Cabling & Snakes', icon: 'cable', color: '#94a3b8' },
  { key: 'misc', label: 'Miscellaneous', icon: 'category', color: '#ec4899' },
];

export const StageGearView: React.FC<StageGearViewProps> = ({ onBack, isLight: isLightProp }) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;

  const { gear, addGearItem, updateGearItem, removeGearItem } = useStagexStore();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GearItem['category']>('mics');
  const [model, setModel] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');

  const totalUnits = useMemo(() => {
    return gear.reduce((acc, g) => acc + (g.qty || 1), 0);
  }, [gear]);

  const packedCount = useMemo(() => {
    return gear.filter((g) => g.packed).length;
  }, [gear]);

  const activeCategoriesCount = useMemo(() => {
    const cats = new Set(gear.map((g) => g.category));
    return cats.size;
  }, [gear]);

  const filteredGear = useMemo(() => {
    let list = gear;
    if (selectedCat !== 'all') {
      list = list.filter((g) => g.category === selectedCat);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.model && g.model.toLowerCase().includes(q)) ||
        (g.notes && g.notes.toLowerCase().includes(q)) ||
        g.category.toLowerCase().includes(q)
    );
  }, [gear, selectedCat, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addGearItem({
      name: name.trim(),
      category,
      model: model.trim() || undefined,
      qty: qty ? parseInt(qty, 10) : 1,
      notes: notes.trim() || undefined,
      packed: false,
    });
    setName('');
    setModel('');
    setQty('1');
    setNotes('');
    setIsAdding(false);
  };

  const togglePacked = (item: GearItem) => {
    updateGearItem(item.id, { packed: !item.packed });
  };

  const statItems = [
    {
      label: 'Total Items',
      value: gear.length,
      accentColor: isLight ? '#09090b' : '#ffffff',
    },
    {
      label: 'Total Units',
      value: totalUnits,
      accentColor: '#f59e0b',
    },
    {
      label: 'Packed Status',
      value: gear.length > 0 ? `${packedCount} / ${gear.length}` : '0 / 0',
      accentColor: '#10b981',
      sublabel:
        gear.length > 0
          ? `${Math.round((packedCount / gear.length) * 100)}% ready`
          : 'Ready for gig',
    },
    {
      label: 'Categories',
      value: activeCategoriesCount,
      accentColor: '#38bdf8',
    },
  ];

  return (
    <StageSetupDetailLayout
      title="Gear Inventory"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-sm"
          style={{
            backgroundColor: isAdding
              ? '#f59e0b'
              : isLight
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isAdding
              ? '#f59e0b'
              : isLight
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.08)',
            color: isAdding ? '#000000' : isLight ? '#09090b' : '#ffffff',
          }}
          title={isAdding ? 'Cancel' : 'Add Gear'}
          aria-label={isAdding ? 'Cancel' : 'Add Gear'}
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

      {/* Main Gear Card */}
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
              <span className="material-symbols-outlined text-[17px]" style={{ color: '#f59e0b' }}>
                tune
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
                Gear & Load-in Checklist
              </h3>
              <p
                className="text-[11.5px]"
                style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
              >
                Track items, unit quantities, and verify packed status
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
            <span>{isAdding ? 'Cancel' : 'Add Gear'}</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              style={{ fontSize: 18 }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search gear by name, model or spec..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.35)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#09090b' : '#ffffff',
              }}
            />
          </div>

          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className="px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0"
              style={{
                backgroundColor:
                  selectedCat === 'all'
                    ? isLight
                      ? '#09090b'
                      : '#ffffff'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.04)'
                      : 'rgba(255, 255, 255, 0.05)',
                color:
                  selectedCat === 'all'
                    ? isLight
                      ? '#ffffff'
                      : '#09090b'
                    : isLight
                      ? '#71717a'
                      : '#a1a1aa',
              }}
            >
              All ({gear.length})
            </button>
            {GEAR_CATEGORIES.map((cat) => {
              const count = gear.filter((g) => g.category === cat.key).length;
              const isCatActive = selectedCat === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCat(cat.key)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  style={{
                    backgroundColor: isCatActive
                      ? cat.color
                      : isLight
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)',
                    color: isCatActive ? '#000000' : isLight ? '#71717a' : '#a1a1aa',
                  }}
                >
                  <span>{cat.label}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Shure SM58) *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                  autoFocus
                  required
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GearItem['category'])}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : '#18181b',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                >
                  {GEAR_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Model / Spec (e.g. Dynamic Cardioid)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity (e.g. 2)"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
                <input
                  type="text"
                  placeholder="Notes / Assignee (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#09090b' : '#ffffff',
                  color: isLight ? '#ffffff' : '#09090b',
                }}
              >
                Add to Inventory
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Gear List Grouped by Category */}
        <div className="flex flex-col gap-5">
          {filteredGear.length === 0 ? (
            <StageSetupEmptyState
              icon="tune"
              title={search ? 'No matching gear items' : 'No gear in inventory'}
              description="Track instruments, amplifiers, microphones, and cabling for your load-in checklist"
              actionLabel="Add Gear Item"
              onAction={() => setIsAdding(true)}
              iconColor="#f59e0b"
              isLight={isLight}
            />
          ) : (
            GEAR_CATEGORIES.map((cat) => {
              const itemsInCat = filteredGear.filter((g) => g.category === cat.key);
              if (itemsInCat.length === 0) return null;

              return (
                <div key={cat.key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ color: cat.color }}
                    >
                      {cat.icon}
                    </span>
                    <h4
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                    >
                      {cat.label} ({itemsInCat.length})
                    </h4>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {itemsInCat.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-[14px] border transition-all"
                        style={{
                          backgroundColor: isLight
                            ? item.packed
                              ? 'rgba(0, 0, 0, 0.01)'
                              : 'rgba(0, 0, 0, 0.02)'
                            : item.packed
                              ? 'rgba(255, 255, 255, 0.01)'
                              : 'rgba(255, 255, 255, 0.03)',
                          borderColor: isLight
                            ? 'rgba(0, 0, 0, 0.06)'
                            : 'rgba(255, 255, 255, 0.06)',
                          opacity: item.packed ? 0.65 : 1,
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {/* Packed Checkbox Toggle */}
                          <button
                            type="button"
                            onClick={() => togglePacked(item)}
                            className="w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0"
                            style={{
                              backgroundColor: item.packed
                                ? '#10b981'
                                : isLight
                                  ? 'rgba(0, 0, 0, 0.04)'
                                  : 'rgba(255, 255, 255, 0.06)',
                              borderColor: item.packed
                                ? '#10b981'
                                : isLight
                                  ? 'rgba(0, 0, 0, 0.15)'
                                  : 'rgba(255, 255, 255, 0.15)',
                            }}
                            title={item.packed ? 'Mark Unpacked' : 'Mark Packed'}
                          >
                            {item.packed && (
                              <span className="material-symbols-outlined text-[14px] text-black font-bold">
                                check
                              </span>
                            )}
                          </button>

                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
                            style={{
                              backgroundColor: isLight
                                ? 'rgba(0, 0, 0, 0.05)'
                                : 'rgba(255, 255, 255, 0.08)',
                              color: isLight ? '#09090b' : '#ffffff',
                            }}
                          >
                            {item.qty || 1}×
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className={`text-xs font-bold truncate ${
                                  item.packed ? 'line-through' : ''
                                }`}
                                style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                              >
                                {item.name}
                              </p>
                              {item.model && (
                                <span
                                  className="text-[11px] truncate"
                                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                                >
                                  ({item.model})
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p
                                className="text-[10.5px] truncate mt-0.5"
                                style={{ color: isLight ? '#71717a' : '#71717a' }}
                              >
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeGearItem(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                          title="Delete Gear Item"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </StageSetupDetailLayout>
  );
};
