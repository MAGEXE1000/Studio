import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { StageSetupStatsStrip } from './StageSetupStatsStrip';
import { StageSetupEmptyState } from './StageSetupEmptyState';
import { useSettingsStore } from '@workspace/studio-core';

interface StageMembersViewProps {
  onBack: () => void;
  isLight?: boolean;
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

export const StageMembersView: React.FC<StageMembersViewProps> = ({
  onBack,
  isLight: isLightProp,
}) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;

  const { members, addMember, removeMember } = useStagexStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const isAtLimit = members.length >= 8;

  const performersCount = useMemo(() => {
    const crewKeywords = ['foh', 'sound', 'tech', 'engineer', 'manager', 'crew', 'light', 'video'];
    return members.filter((m) => {
      const r = m.role.toLowerCase();
      return !crewKeywords.some((k) => r.includes(k));
    }).length;
  }, [members]);

  const crewCount = useMemo(() => {
    return members.length - performersCount;
  }, [members, performersCount]);

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

  const statItems = [
    {
      label: 'Roster Capacity',
      value: `${members.length} / 8`,
      accentColor: isAtLimit ? '#f87171' : isLight ? '#09090b' : '#ffffff',
    },
    {
      label: 'Performers',
      value: performersCount,
      accentColor: '#10b981',
    },
    {
      label: 'Crew & Tech',
      value: crewCount,
      accentColor: '#38bdf8',
    },
    {
      label: 'Spots Available',
      value: Math.max(0, 8 - members.length),
      accentColor: '#a855f7',
    },
  ];

  return (
    <StageSetupDetailLayout
      title="Band & Crew"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <button
          type="button"
          onClick={() => !isAtLimit && setIsAdding((prev) => !prev)}
          disabled={isAtLimit}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={{
            backgroundColor: isAdding
              ? '#10b981'
              : isLight
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isAdding
              ? '#10b981'
              : isLight
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.08)',
            color: isAdding ? '#000000' : isLight ? '#09090b' : '#ffffff',
          }}
          title={isAtLimit ? 'Capacity reached' : isAdding ? 'Cancel' : 'Add Member'}
          aria-label={isAdding ? 'Cancel' : 'Add Member'}
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

      {/* Capacity Warning Banner */}
      {isAtLimit && (
        <div
          className="p-3.5 rounded-[16px] border text-xs mb-4 flex items-center gap-2.5 shadow-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.10)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: '#f87171',
          }}
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span className="font-semibold">
            Maximum band & crew capacity reached (8 / 8 members). Remove a member to add another.
          </span>
        </div>
      )}

      {/* Main Members Card */}
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
              <span className="material-symbols-outlined text-[17px]" style={{ color: '#10b981' }}>
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
                Band & Crew Roster
              </h3>
              <p
                className="text-[11.5px]"
                style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
              >
                Performers, production crew & stage assignments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !isAtLimit && setIsAdding(!isAdding)}
            disabled={isAtLimit}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
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
            <span>{isAdding ? 'Cancel' : 'Add Member'}</span>
          </button>
        </div>

        {/* Expandable Inline Add Form */}
        <AnimatePresence>
          {isAdding && !isAtLimit && (
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
                  placeholder="Member Name *"
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
                <input
                  type="text"
                  placeholder="Role (e.g. Lead Vocals, FOH Engineer) *"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                  required
                />
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-2 py-1">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-wider mr-1"
                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                >
                  Badge Color:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {MEMBER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full border-2 transition-transform cursor-pointer"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? '#ffffff' : 'transparent',
                        transform: color === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: color === c ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
                <input
                  type="text"
                  placeholder="Stage Assignment / Notes"
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
                disabled={!name.trim() || !role.trim()}
                className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#09090b' : '#ffffff',
                  color: isLight ? '#ffffff' : '#09090b',
                }}
              >
                Add Member
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.length === 0 ? (
            <div className="col-span-full">
              <StageSetupEmptyState
                icon="badge"
                title="No band or crew members yet"
                description="Add performers, audio engineers, and stage crew to assign roles and gear"
                actionLabel="Add First Member"
                onAction={() => setIsAdding(true)}
                iconColor="#10b981"
                isLight={isLight}
              />
            </div>
          ) : (
            members.map((member) => {
              const initials = member.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 rounded-[16px] border transition-all"
                  style={{
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: member.color || '#3b82f6' }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="text-xs font-bold truncate"
                        style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                      >
                        {member.name}
                      </p>
                      <span
                        className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold mt-0.5 truncate"
                        style={{
                          backgroundColor: `${member.color || '#3b82f6'}20`,
                          color: member.color || '#3b82f6',
                        }}
                      >
                        {member.role}
                      </span>
                      {(member.phone || member.email) && (
                        <p
                          className="text-[10px] truncate mt-0.5"
                          style={{ color: isLight ? '#71717a' : '#71717a' }}
                        >
                          {member.phone || member.email}
                        </p>
                      )}
                      {member.notes && (
                        <p
                          className="text-[10px] italic truncate mt-0.5"
                          style={{ color: isLight ? '#a1a1aa' : '#52525b' }}
                        >
                          {member.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                    title="Remove Member"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </StageSetupDetailLayout>
  );
};
