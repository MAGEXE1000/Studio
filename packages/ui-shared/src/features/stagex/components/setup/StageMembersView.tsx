import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type BandMember } from '../../state/useStagexStore';

interface StageMembersViewProps {
  onBack: () => void;
}

const MEMBER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

export const StageMembersView: React.FC<StageMembersViewProps> = ({ onBack }) => {
  const { members, addMember, removeMember } = useStagexStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const isAtLimit = members.length >= 8;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || isAtLimit) return;
    const ok = addMember({
      name: name.trim(),
      role: role.trim(),
      color,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setNotes('');
      setColor(MEMBER_COLORS[(members.length + 1) % MEMBER_COLORS.length]);
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Capacity & Action Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Band & Crew Roster</h3>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: isAtLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isAtLimit ? '#f87171' : '#a1a1aa',
              }}
            >
              {members.length}/8
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Performers, production crew & instrument assignments
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          disabled={isAtLimit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isAdding ? 'close' : 'add'}
          </span>
          {isAdding ? 'Cancel' : 'Add Member'}
        </motion.button>
      </div>

      {isAtLimit && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            info
          </span>
          Maximum band capacity of 8 members reached.
        </div>
      )}

      {/* Add Member Form */}
      <AnimatePresence>
        {isAdding && !isAtLimit && (
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
                placeholder="Member Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                autoFocus
                required
              />
              <input
                type="text"
                placeholder="Role (e.g. Lead Vocals, FOH Engineer) *"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                required
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <span className="text-xs text-neutral-400 mr-1">Badge Color:</span>
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#ffffff' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !role.trim()}
              className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-40 transition-colors"
            >
              Add Member
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((member) => {
          const initials = member.name
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-2xl border transition-all"
              style={{
                backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.6))',
                borderColor: 'var(--c-border, rgba(255, 255, 255, 0.06))',
              }}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: member.color || '#3b82f6' }}
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{member.name}</p>
                  <p className="text-xs font-medium text-neutral-400 truncate">{member.role}</p>
                  {(member.phone || member.email) && (
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {member.phone || member.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeMember(member.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Remove Member"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  delete
                </span>
              </button>
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 text-sm">
            No band or crew members added yet.
          </div>
        )}
      </div>
    </div>
  );
};
