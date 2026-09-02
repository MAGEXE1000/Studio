import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type GearItem } from '../../state/useStagexStore';

interface StageGearViewProps {
  onBack: () => void;
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

export const StageGearView: React.FC<StageGearViewProps> = ({ onBack }) => {
  const { gear, addGearItem, removeGearItem } = useStagexStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GearItem['category']>('mics');
  const [model, setModel] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');

  const filteredGear = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gear;
    return gear.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.model && g.model.toLowerCase().includes(q)) ||
        (g.notes && g.notes.toLowerCase().includes(q)) ||
        g.category.toLowerCase().includes(q)
    );
  }, [gear, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addGearItem({
      name: name.trim(),
      category,
      model: model.trim() || undefined,
      qty: qty ? parseInt(qty, 10) : 1,
      notes: notes.trim() || undefined,
    });
    setName('');
    setModel('');
    setQty('1');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Search & Add Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <span
            className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            style={{ fontSize: 18 }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search gear by name, model or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-black/40 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isAdding ? 'close' : 'add'}
          </span>
          {isAdding ? 'Cancel' : 'Add Gear'}
        </motion.button>
      </div>

      {/* Add Gear Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="p-4 rounded-2xl border mb-6 overflow-hidden flex flex-col gap-3"
            style={{
              backgroundColor: 'rgba(39, 39, 42, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Item Name (e.g. Shure SM58) *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                autoFocus
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GearItem['category'])}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                {GEAR_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key} className="bg-neutral-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Model / Spec (optional)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="text"
                placeholder="Notes / Assignee (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-40 transition-colors"
            >
              Add Item
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Gear List Grouped by Category */}
      <div className="flex flex-col gap-6">
        {GEAR_CATEGORIES.map((cat) => {
          const itemsInCat = filteredGear.filter((g) => g.category === cat.key);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span
                  className="material-symbols-outlined"
                  style={{ color: cat.color, fontSize: 18 }}
                >
                  {cat.icon}
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {cat.label} ({itemsInCat.length})
                </h4>
              </div>

              <div className="flex flex-col gap-2">
                {itemsInCat.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border group transition-all"
                    style={{
                      backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.6))',
                      borderColor: 'var(--c-border, rgba(255, 255, 255, 0.06))',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/5 text-neutral-300 shrink-0">
                        {item.qty || 1}x
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{item.name}</p>
                          {item.model && (
                            <span className="text-xs text-neutral-400 truncate">
                              ({item.model})
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-neutral-500 truncate">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeGearItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Delete Gear Item"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        delete
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredGear.length === 0 && (
          <div className="py-12 text-center text-neutral-500 text-sm">
            {search ? 'No gear items matching search.' : 'No gear inventory added yet.'}
          </div>
        )}
      </div>
    </div>
  );
};
