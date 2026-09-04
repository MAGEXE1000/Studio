import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
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

const QUICK_ROLES = [
  'Lead Vocals',
  'Guitar',
  'Bass',
  'Drums',
  'Keys',
  'FOH Engineer',
  'Stage Tech',
];

export const StageMembersView: React.FC<StageMembersViewProps> = ({
  onBack,
  isLight: isLightProp,
}) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;

  const { members, addMember, removeMember, elements, preferences } = useStagexStore();
  const isAmoled = preferences?.amoled || false;
  const prefersReducedMotion = useReducedMotion();

  const inputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Lead Vocals');
  const [customRole, setCustomRole] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  const isAtLimit = members.length >= 8;

  // Real Reactive Metrics (2x2 Structure)
  const assignedMembersCount = useMemo(() => {
    return members.filter((m) => elements && elements.some((el: any) => el.memberId === m.id))
      .length;
  }, [members, elements]);

  const unassignedMembersCount = useMemo(() => {
    return Math.max(0, members.length - assignedMembersCount);
  }, [members.length, assignedMembersCount]);

  const stageElementsCount = useMemo(() => {
    return elements ? elements.length : 0;
  }, [elements]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isAtLimit) return;

    const resolvedRole = customRole.trim() || selectedRole || 'Band Member';
    const ok = addMember({
      name: name.trim(),
      role: resolvedRole,
      color,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (ok) {
      setName('');
      setCustomRole('');
      setPhone('');
      setEmail('');
      setNotes('');
      setShowExtraDetails(false);
      // Auto-cycle color for next entry
      setColor(MEMBER_COLORS[(members.length + 1) % MEMBER_COLORS.length]);
      inputRef.current?.focus();
    }
  };

  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Theme Design Tokens
  const cardBg = isLight ? '#ffffff' : isAmoled ? '#000000' : 'var(--c-bg-card, #0d0d11)';
  const cardBorder = isLight
    ? '#eaecef'
    : isAmoled
      ? 'rgba(255, 255, 255, 0.12)'
      : 'var(--c-border, rgba(255, 255, 255, 0.08))';
  const inputBg = isLight
    ? 'rgba(246, 246, 247, 0.8)'
    : isAmoled
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(255, 255, 255, 0.05)';
  const inputBorder = isLight
    ? 'rgba(0, 0, 0, 0.08)'
    : isAmoled
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.08)';

  const textPrimary = isLight ? '#09090b' : '#ffffff';
  const textSecondary = isLight ? '#71717a' : '#a1a1aa';
  const textMuted = isLight ? '#a1a1aa' : '#71717a';

  return (
    <StageSetupDetailLayout
      title="Band & Crew"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <button
          type="button"
          onClick={handleFocusInput}
          disabled={isAtLimit}
          className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            backgroundColor: isLight ? '#000000' : '#ffffff',
            color: isLight ? '#ffffff' : '#000000',
          }}
          title={isAtLimit ? 'Capacity reached' : 'Add Member'}
          aria-label="Add Member"
          data-testid="btn-quick-add-member"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      }
    >
      <div className="space-y-4 pb-8">
        {/* ── CAPACITY WARNING BANNER (8-MEMBER TIER LIMIT) ────────── */}
        {isAtLimit && (
          <div
            className="p-3.5 rounded-[18px] border text-xs flex items-center gap-2.5 shadow-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.22)',
              color: '#ef4444',
            }}
            data-testid="banner-capacity-warning"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="font-semibold leading-relaxed">
              Maximum member limit reached for this tier (8 members).
            </span>
          </div>
        )}

        {/* ── 1. LIGHTWEIGHT EMPTY STATE (STITCH PARITY) ────────────── */}
        {members.length === 0 && (
          <section className="text-center py-6 px-4" data-testid="band-crew-empty-state">
            <h2
              className="text-sm font-bold tracking-[0.2em] uppercase mb-2 font-sans"
              style={{ color: textSecondary }}
            >
              NO MEMBERS YET
            </h2>
            <p className="text-[15px] font-medium" style={{ color: textMuted }}>
              Enter a name and tap Add to get started.
            </p>
          </section>
        )}

        {/* ── 2. MEMBER LIST / CURRENT ROSTER (STITCH PARITY) ───────── */}
        {members.length > 0 && (
          <section className="flex flex-col space-y-2.5" data-testid="member-roster-section">
            <div className="flex items-center justify-between px-1">
              <span
                className="text-[11px] font-bold tracking-wider uppercase font-sans"
                style={{ color: textSecondary }}
              >
                Current Roster
              </span>
              <span
                className="text-xs font-semibold font-mono"
                style={{ color: textSecondary }}
                data-testid="roster-badge"
              >
                {members.length} / 8
              </span>
            </div>

            <div className="space-y-2" data-testid="member-cards-container">
              <AnimatePresence initial={false}>
                {members.map((member) => {
                  const initials = member.name
                    .trim()
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const assignedElements = elements
                    ? elements.filter((el: any) => el.memberId === member.id)
                    : [];
                  const isAssigned = assignedElements.length > 0;
                  const assignedLabels = assignedElements
                    .map((e: any) => e.label || e.name || 'Stage Element')
                    .join(', ');

                  return (
                    <motion.div
                      key={member.id}
                      data-testid={`member-item-${member.id}`}
                      layout={!prefersReducedMotion}
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-2xl p-3.5 border shadow-card flex items-center justify-between transition-colors"
                      style={{
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      }}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: member.color
                              ? `${member.color}20`
                              : isLight
                                ? '#f4f4f5'
                                : '#1f1f23',
                            borderColor: member.color || cardBorder,
                            color: member.color || textPrimary,
                          }}
                        >
                          {initials || '?'}
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <p
                            className="font-bold text-sm leading-tight truncate"
                            style={{ color: textPrimary }}
                          >
                            {member.name}
                          </p>
                          <p
                            className="text-[11px] font-medium truncate mt-0.5"
                            style={{
                              color: isAssigned ? (isLight ? '#2563eb' : '#60a5fa') : textMuted,
                            }}
                          >
                            {isAssigned
                              ? `Assigned: ${assignedLabels}`
                              : member.role
                                ? `${member.role} • Unassigned`
                                : 'Unassigned position'}
                          </p>
                          {(member.phone || member.email) && (
                            <p
                              className="text-[10px] truncate mt-0.5"
                              style={{ color: textSecondary }}
                            >
                              {[member.phone, member.email].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 hover:bg-red-500/10 hover:text-red-500"
                        style={{ color: textSecondary }}
                        title="Remove member"
                        aria-label={`Remove ${member.name}`}
                        data-testid={`btn-remove-member-${member.id}`}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ── 3. ADD MEMBER CARD (STITCH PARITY) ────────────────────── */}
        <section
          className="rounded-3xl p-6 border shadow-card"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          data-testid="add-member-card"
        >
          <h3
            className="text-xs font-bold tracking-wider uppercase mb-3.5 font-sans"
            style={{ color: textSecondary }}
          >
            ADD MEMBER
          </h3>

          <form onSubmit={handleAdd} className="space-y-3">
            {/* Rounded Text Input with Integrated Add Button */}
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                autoComplete="off"
                disabled={isAtLimit}
                className="w-full h-14 pl-4 pr-24 py-3 text-[15px] font-medium rounded-2xl border transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textPrimary,
                }}
                data-testid="input-member-name"
              />

              <button
                type="submit"
                disabled={!name.trim() || isAtLimit}
                className="absolute right-2 h-10 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#09090b' : '#ffffff',
                  color: isLight ? '#ffffff' : '#09090b',
                }}
                id="btn-add-member"
                data-testid="btn-add-member"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add</span>
              </button>
            </div>

            {/* Quick Role Selector Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {QUICK_ROLES.map((r) => {
                const isSelected = selectedRole === r && !customRole;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setCustomRole('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border active:scale-95"
                    style={{
                      backgroundColor: isSelected
                        ? isLight
                          ? '#09090b'
                          : '#ffffff'
                        : isLight
                          ? 'rgba(0, 0, 0, 0.03)'
                          : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isSelected ? (isLight ? '#09090b' : '#ffffff') : inputBorder,
                      color: isSelected ? (isLight ? '#ffffff' : '#09090b') : textSecondary,
                    }}
                    data-testid={`role-tag-${r.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {r}
                  </button>
                );
              })}

              {/* Extra Details Toggle Button */}
              <button
                type="button"
                onClick={() => setShowExtraDetails((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border active:scale-95 flex items-center gap-1"
                style={{
                  backgroundColor: showExtraDetails
                    ? isLight
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'rgba(255, 255, 255, 0.08)'
                    : 'transparent',
                  borderColor: inputBorder,
                  color: textSecondary,
                }}
                data-testid="btn-toggle-extra-details"
              >
                <span>{showExtraDetails ? 'Fewer details' : '+ Details'}</span>
              </button>
            </div>

            {/* Optional Extended Details Drawer */}
            <AnimatePresence>
              {showExtraDetails && (
                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  className="space-y-3 pt-2 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Custom Role (overrides tags)"
                      className="h-10 px-3 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textPrimary,
                      }}
                      data-testid="input-custom-role"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="h-10 px-3 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textPrimary,
                      }}
                      data-testid="input-member-phone"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="h-10 px-3 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textPrimary,
                      }}
                      data-testid="input-member-email"
                    />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes / Position specs"
                      className="h-10 px-3 text-xs rounded-xl border focus:outline-none"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: textPrimary,
                      }}
                      data-testid="input-member-notes"
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-wider"
                      style={{ color: textSecondary }}
                    >
                      Avatar Accent:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {MEMBER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className="w-5 h-5 rounded-full border-2 transition-transform cursor-pointer"
                          style={{
                            backgroundColor: c,
                            borderColor:
                              color === c ? (isLight ? '#09090b' : '#ffffff') : 'transparent',
                            transform: color === c ? 'scale(1.2)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* ── 4. 2x2 METRICS GRID (STITCH PARITY) ────────────────────── */}
        <section className="grid grid-cols-2 gap-3.5" data-testid="metrics-grid">
          {/* MEMBERS */}
          <article
            className="rounded-2xl p-5 border shadow-card flex flex-col justify-between min-h-[104px]"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            data-testid="metric-card-members"
          >
            <span
              className="text-xs font-bold tracking-wider uppercase font-sans"
              style={{ color: textSecondary }}
            >
              MEMBERS
            </span>
            <div className="flex items-baseline mt-3">
              <span
                className="text-3xl font-extrabold tracking-tight leading-none font-sans"
                style={{ color: textPrimary }}
                id="metric-members-count"
                data-testid="metric-members-count"
              >
                {members.length}
              </span>
              <span
                className="text-xl font-bold leading-none ml-0.5 font-sans"
                style={{ color: textSecondary }}
              >
                /8
              </span>
            </div>
          </article>

          {/* ASSIGNED */}
          <article
            className="rounded-2xl p-5 border shadow-card flex flex-col justify-between min-h-[104px]"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            data-testid="metric-card-assigned"
          >
            <span
              className="text-xs font-bold tracking-wider uppercase font-sans"
              style={{ color: textSecondary }}
            >
              ASSIGNED
            </span>
            <div className="mt-3">
              <span
                className="text-3xl font-extrabold tracking-tight leading-none font-sans"
                style={{ color: textPrimary }}
                id="metric-assigned-count"
                data-testid="metric-assigned-count"
              >
                {assignedMembersCount}
              </span>
            </div>
          </article>

          {/* STAGE ELEMENTS */}
          <article
            className="rounded-2xl p-5 border shadow-card flex flex-col justify-between min-h-[104px]"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            data-testid="metric-card-stage-elements"
          >
            <span
              className="text-xs font-bold tracking-wider uppercase font-sans"
              style={{ color: textSecondary }}
            >
              STAGE ELEMENTS
            </span>
            <div className="mt-3">
              <span
                className="text-3xl font-extrabold tracking-tight leading-none font-sans"
                style={{ color: textPrimary }}
                id="metric-elements-count"
                data-testid="metric-elements-count"
              >
                {stageElementsCount}
              </span>
            </div>
          </article>

          {/* UNASSIGNED */}
          <article
            className="rounded-2xl p-5 border shadow-card flex flex-col justify-between min-h-[104px]"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            data-testid="metric-card-unassigned"
          >
            <span
              className="text-xs font-bold tracking-wider uppercase font-sans"
              style={{ color: textSecondary }}
            >
              UNASSIGNED
            </span>
            <div className="mt-3">
              <span
                className="text-3xl font-extrabold tracking-tight leading-none font-sans"
                style={{ color: textPrimary }}
                id="metric-unassigned-count"
                data-testid="metric-unassigned-count"
              >
                {unassignedMembersCount}
              </span>
            </div>
          </article>
        </section>
      </div>
    </StageSetupDetailLayout>
  );
};
