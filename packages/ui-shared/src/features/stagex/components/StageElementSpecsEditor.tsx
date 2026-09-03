import React, { useState, useMemo } from 'react';
import { useBackHandler } from '@workspace/studio-core';
import { useStagexStore } from '../state/useStagexStore';
import { STAGEX_ICON_MAP } from '../constants';
import {
  StagexSpecsPicker,
  SpecsSelectorControl,
  SpecsPickerType,
  SpecsPickerOption,
  CANONICAL_SOURCES,
  CANONICAL_DESTINATIONS,
} from './StagexSpecsPicker';

export interface StageElementSpecsEditorProps {
  isOpen: boolean;
  element: any | null;
  onClose: () => void;
  onUpdateElement: (updates: Record<string, any>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onTogglePin: () => void;
  onSavePreset: () => void;
  onAddMicNearby: () => void;
  onAssignChannel: () => void;
  bandMembers?: Array<{ id: string; name: string }>;
  isLight: boolean;
  isAmoled: boolean;
  accent: { from: string; to: string };
}

const COLOR_SWATCHES = [
  { hex: '#6B97FF', name: 'Blue' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#EC4899', name: 'Rose' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#FF3B30', name: 'Red' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#000000', name: 'Black' },
];

export const StageElementSpecsEditor: React.FC<StageElementSpecsEditorProps> = ({
  isOpen,
  element,
  onClose,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onToggleLock,
  onTogglePin,
  onSavePreset,
  onAddMicNearby,
  onAssignChannel,
  bandMembers = [],
  isLight,
  isAmoled,
}) => {
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moreFieldsExpanded, setMoreFieldsExpanded] = useState(false);
  const [activePicker, setActivePicker] = useState<SpecsPickerType | null>(null);

  // Read existing domain sources of truth
  const storeMembers = useStagexStore((s) => s.members);
  const riderChannels = useStagexStore((s) => s.riderChannels);
  const riderMixes = useStagexStore((s) => s.riderMixes);
  const allElements = useStagexStore((s) => s.elements);

  // Android hardware back handler: dismiss active picker first, then specs editor
  useBackHandler(
    'overlay',
    () => {
      if (activePicker) {
        setActivePicker(null);
        return true;
      }
      return false;
    },
    [activePicker]
  );

  // Icon preview helper
  const iconContent = useMemo(() => {
    if (!element) return null;
    const iconKey = element.icon || 'mic';
    const iconPath = STAGEX_ICON_MAP[iconKey as keyof typeof STAGEX_ICON_MAP] || iconKey;
    if (
      iconPath &&
      (iconPath.endsWith('.png') || iconPath.endsWith('.webp') || iconPath.endsWith('.svg'))
    ) {
      return (
        <img
          src={iconPath}
          alt={element.name}
          className="w-6 h-6 object-contain pointer-events-none"
          style={{
            filter: isLight ? undefined : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}
        />
      );
    }
    return (
      <span className="material-symbols-outlined text-[20px] text-pink-400">
        {element.icon || 'music_note'}
      </span>
    );
  }, [element, isLight]);

  // ── OPTION LISTS FOR SELECTORS ──────────────────────────────────────

  // 1. Performer Options
  const performerOptions: SpecsPickerOption[] = useMemo(() => {
    const opts: SpecsPickerOption[] = [
      {
        id: '__none__',
        value: '',
        label: '— None / Unassigned —',
        detail: 'No performer assigned to this element',
        icon: 'person_off',
      },
    ];

    const seen = new Set<string>();
    const combinedMembers = [...(storeMembers || []), ...(bandMembers || [])];

    combinedMembers.forEach((m: any) => {
      const name = m.name || m.label;
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      opts.push({
        id: m.id || name,
        value: name,
        label: name,
        detail: m.role || 'Band & Crew Member',
        color: m.color,
        icon: 'person',
      });
    });

    const currentP = (element?.performer || element?.memberId || '').trim();
    if (currentP && !seen.has(currentP.toLowerCase())) {
      opts.push({
        id: '__current_performer__',
        value: currentP,
        label: currentP,
        detail: 'Current Selection',
        icon: 'person',
      });
    }

    return opts;
  }, [storeMembers, bandMembers, element?.performer, element?.memberId]);

  // 2. Channel Options
  const channelOptions: SpecsPickerOption[] = useMemo(() => {
    const opts: SpecsPickerOption[] = [
      {
        id: '__none__',
        value: '',
        label: '— None / Unassigned —',
        detail: 'No console channel assigned',
        icon: 'block',
      },
    ];

    const occupiedMap = new Map<string, string>();
    (allElements || []).forEach((e: any) => {
      if (e.id !== element?.id) {
        const ch = (e.channelId || e.chid || '').trim();
        if (ch) occupiedMap.set(ch.toUpperCase(), e.label || e.name || 'Stage Element');
      }
    });

    const seenChannels = new Set<string>();

    // Add rider channels first if configured in Setup
    if (riderChannels && riderChannels.length > 0) {
      riderChannels.forEach((rc) => {
        const chStr = 'CH-' + String(rc.ch).padStart(2, '0');
        seenChannels.add(chStr);
        const occupiedBy = occupiedMap.get(chStr.toUpperCase());
        opts.push({
          id: chStr,
          value: chStr,
          label: chStr,
          detail: occupiedBy
            ? `Occupied (${occupiedBy})`
            : rc.source + (rc.mic ? ` (${rc.mic})` : ''),
          disabled: Boolean(occupiedBy),
          badge: occupiedBy ? 'In Use' : undefined,
          icon: 'tune',
        });
      });
    }

    // Standard 24 console channels
    for (let i = 1; i <= 24; i++) {
      const chStr = 'CH-' + String(i).padStart(2, '0');
      if (!seenChannels.has(chStr)) {
        seenChannels.add(chStr);
        const occupiedBy = occupiedMap.get(chStr.toUpperCase());
        opts.push({
          id: chStr,
          value: chStr,
          label: chStr,
          detail: occupiedBy ? `Occupied (${occupiedBy})` : 'Console Preamp Channel',
          disabled: Boolean(occupiedBy),
          badge: occupiedBy ? 'In Use' : undefined,
          icon: 'tune',
        });
      }
    }

    const currentCh = (element?.channelId || '').trim();
    if (currentCh && !seenChannels.has(currentCh)) {
      opts.push({
        id: '__custom_channel__',
        value: currentCh,
        label: currentCh,
        detail: 'Custom Channel',
        icon: 'tune',
      });
    }

    return opts;
  }, [riderChannels, allElements, element?.id, element?.channelId]);

  // 3. Source Options
  const sourceOptions: SpecsPickerOption[] = useMemo(() => {
    const opts: SpecsPickerOption[] = [
      {
        id: '__none__',
        value: '',
        label: '— Direct / Unassigned —',
        detail: 'Direct line / no stage drop assigned',
        icon: 'cable',
      },
    ];

    const seenSources = new Set<string>();

    CANONICAL_SOURCES.forEach((s) => {
      seenSources.add(s.id.toUpperCase());
      opts.push({
        id: s.id,
        value: s.id,
        label: `${s.label} · ${s.desc}`,
        detail: s.type.toUpperCase() + ' Interface',
        icon: s.type === 'wireless' ? 'sensors' : s.type === 'dante' ? 'lan' : 'cable',
      });
    });

    (riderChannels || []).forEach((rc) => {
      if (rc.source && !seenSources.has(rc.source.toUpperCase())) {
        seenSources.add(rc.source.toUpperCase());
        opts.push({
          id: rc.source,
          value: rc.source,
          label: rc.source,
          detail: 'Rider Source Input',
          icon: 'cable',
        });
      }
    });

    const currentSrc = (element?.source || '').trim();
    if (currentSrc && !seenSources.has(currentSrc.toUpperCase())) {
      opts.push({
        id: '__custom_src__',
        value: currentSrc,
        label: currentSrc,
        detail: 'Custom Source',
        icon: 'cable',
      });
    }

    return opts;
  }, [riderChannels, element?.source]);

  // 4. Destination Options
  const destinationOptions: SpecsPickerOption[] = useMemo(() => {
    const opts: SpecsPickerOption[] = [
      {
        id: '__none__',
        value: '',
        label: '— Default / Unassigned —',
        detail: 'Standard console routing',
        icon: 'volume_off',
      },
    ];

    const seenDests = new Set<string>();

    CANONICAL_DESTINATIONS.forEach((d) => {
      seenDests.add(d.id.toUpperCase());
      opts.push({
        id: d.id,
        value: d.id,
        label: `${d.label} · ${d.desc}`,
        detail: d.type.toUpperCase() + ' Route',
        icon: d.type === 'iem' ? 'headphones' : d.type === 'wedge' ? 'speaker' : 'volume_up',
      });
    });

    (riderMixes || []).forEach((m) => {
      if (m.name && !seenDests.has(m.name.toUpperCase())) {
        seenDests.add(m.name.toUpperCase());
        opts.push({
          id: m.name,
          value: m.name,
          label: m.name,
          detail: m.type === 'iem' ? 'Stereo IEM Mix' : 'Stage Wedge Mix',
          icon: m.type === 'iem' ? 'headphones' : 'speaker',
        });
      }
    });

    const currentDest = (element?.output || '').trim();
    if (currentDest && !seenDests.has(currentDest.toUpperCase())) {
      opts.push({
        id: '__custom_dest__',
        value: currentDest,
        label: currentDest,
        detail: 'Custom Destination',
        icon: 'volume_up',
      });
    }

    return opts;
  }, [riderMixes, element?.output]);

  if (!isOpen || !element) {
    return null;
  }

  const rotation = typeof element.rotation === 'number' ? element.rotation : 0;
  const scale = typeof element.scale === 'number' ? element.scale : 100;
  const currentColor = (element.color || '#6B97FF').toUpperCase();

  const currentPerformerVal = element.performer || element.memberId || '';
  const currentChannelVal = element.channelId || '';
  const currentSourceVal = element.source || '';
  const currentDestinationVal = element.output || '';

  const handlePickerSelect = (val: string) => {
    if (activePicker === 'performer') {
      onUpdateElement({ performer: val, memberId: val });
    } else if (activePicker === 'channel') {
      onUpdateElement({ channelId: val });
    } else if (activePicker === 'source') {
      onUpdateElement({ source: val });
    } else if (activePicker === 'destination') {
      onUpdateElement({ output: val });
    }
    setActivePicker(null);
  };

  const getSourceDisplay = (val: string) => {
    if (!val) return '';
    const match = CANONICAL_SOURCES.find((s) => s.id === val);
    return match ? `${match.label} · ${match.desc}` : val;
  };

  const getDestinationDisplay = (val: string) => {
    if (!val) return '';
    const match = CANONICAL_DESTINATIONS.find((d) => d.id === val);
    return match ? `${match.label} · ${match.desc}` : val;
  };

  return (
    <>
      {/* Tap Outside Backdrop */}
      <div
        data-testid="stagex-specs-backdrop"
        className="fixed inset-0 z-30"
        onClick={() => {
          if (activePicker) {
            setActivePicker(null);
            return;
          }
          setActionsMenuOpen(false);
          setShowDeleteConfirm(false);
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Floating Specs Editor Panel */}
      <div
        data-testid="stagex-specs-editor"
        role="dialog"
        aria-label="Element Specs Editor"
        className="fixed z-40 flex flex-col pointer-events-auto"
        style={{
          bottom: 'calc(max(10px, env(safe-area-inset-bottom, 0px)) + 4px)',
          left: 'calc(max(10px, env(safe-area-inset-left, 0px)) + 4px)',
          right: 'calc(max(10px, env(safe-area-inset-right, 0px)) + 4px)',
          maxWidth: '680px',
          margin: '0 auto',
          background: isAmoled
            ? 'rgba(10, 10, 14, 0.96)'
            : isLight
              ? 'rgba(255, 255, 255, 0.96)'
              : 'rgba(18, 18, 24, 0.94)',
          border: isAmoled
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isLight
            ? '0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)'
            : '0 16px 40px rgba(0, 0, 0, 0.65), 0 2px 10px rgba(0, 0, 0, 0.40)',
          borderRadius: '24px',
          padding: '12px 14px',
          transition:
            'opacity 0.20s cubic-bezier(0.16, 1, 0.3, 1), transform 0.20s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {activePicker ? (
          /* ── IN-APP SELECTION SURFACE ───────────────────────────── */
          <StagexSpecsPicker
            type={activePicker}
            currentValue={
              activePicker === 'performer'
                ? currentPerformerVal
                : activePicker === 'channel'
                  ? currentChannelVal
                  : activePicker === 'source'
                    ? currentSourceVal
                    : currentDestinationVal
            }
            options={
              activePicker === 'performer'
                ? performerOptions
                : activePicker === 'channel'
                  ? channelOptions
                  : activePicker === 'source'
                    ? sourceOptions
                    : destinationOptions
            }
            onSelect={handlePickerSelect}
            onBack={() => setActivePicker(null)}
            isLight={isLight}
            isAmoled={isAmoled}
          />
        ) : (
          /* ── REGULAR SPECS FORM ─────────────────────────────────── */
          <>
            {/* Header: Identity, Overflow Actions, and Close */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
              {/* Element Identity */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {iconContent}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[13px] font-bold truncate leading-tight"
                      style={{
                        color: isLight ? '#09090b' : '#ffffff',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {element.name || 'Element'}
                    </span>
                    {element.locked && (
                      <span className="text-[11px]" title="Locked">
                        🔒
                      </span>
                    )}
                    {element.pinned && (
                      <span className="text-[11px]" title="Pinned">
                        📌
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[9.5px] font-semibold uppercase tracking-wider truncate"
                    style={{
                      color: isLight ? '#71717a' : '#a1a1aa',
                    }}
                  >
                    {element.type || 'Stage Element'}{' '}
                    {element.channelId ? `· ${element.channelId}` : ''}
                  </div>
                </div>
              </div>

              {/* Header Controls: Actions Dropdown Trigger + Close */}
              <div className="relative flex items-center gap-1.5 flex-shrink-0">
                {/* Secondary Actions Button */}
                <button
                  type="button"
                  data-testid="specs-actions-menu-btn"
                  onClick={() => setActionsMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                  style={{
                    background: actionsMenuOpen
                      ? '#ec4899'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.05)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color: actionsMenuOpen ? '#ffffff' : isLight ? '#3f3f46' : '#d4d4d8',
                    border: actionsMenuOpen
                      ? '1px solid #ec4899'
                      : isLight
                        ? '1px solid rgba(0, 0, 0, 0.06)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  title="Secondary Actions"
                >
                  <span className="material-symbols-outlined text-[15px]">more_horiz</span>
                  <span>Actions</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  data-testid="stagex-specs-close-btn"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                    color: isLight ? '#52525b' : '#a1a1aa',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  aria-label="Close Specs"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>

                {/* Secondary Actions Overflow Popover */}
                {actionsMenuOpen && (
                  <div
                    data-testid="specs-actions-popup"
                    className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl py-1 z-50 shadow-2xl flex flex-col"
                    style={{
                      background: isAmoled ? '#121216' : isLight ? '#ffffff' : '#1e1e26',
                      border: isLight
                        ? '1px solid rgba(0, 0, 0, 0.12)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <button
                      type="button"
                      data-testid="action-duplicate"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onDuplicate();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        content_copy
                      </span>
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      data-testid="action-add-mic"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onAddMicNearby();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        mic
                      </span>
                      <span>Add Mic Nearby</span>
                    </button>

                    <button
                      type="button"
                      data-testid="action-assign-channel"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onAssignChannel();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        tune
                      </span>
                      <span>Assign Channel</span>
                    </button>

                    <div className="h-px bg-white/5 my-1" />

                    <button
                      type="button"
                      data-testid="action-toggle-lock"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onToggleLock();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        {element.locked ? 'lock_open' : 'lock'}
                      </span>
                      <span>{element.locked ? 'Unlock' : 'Lock'}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="action-toggle-pin"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onTogglePin();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        push_pin
                      </span>
                      <span>{element.pinned ? 'Unpin Element' : 'Pin Element'}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="action-save-preset"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        onSavePreset();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[15px] text-zinc-400">
                        bookmark
                      </span>
                      <span>Save as Preset</span>
                    </button>

                    <div className="h-px bg-white/5 my-1" />

                    <button
                      type="button"
                      data-testid="action-delete"
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-left text-red-400 hover:bg-red-500/10 active:bg-red-500/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-red-400">
                        delete
                      </span>
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Confirmation Banner */}
            {showDeleteConfirm && (
              <div
                data-testid="delete-confirm-overlay"
                className="my-2 p-2.5 rounded-2xl flex items-center justify-between gap-3 border border-red-500/30"
                style={{
                  background: isLight ? 'rgba(254, 242, 242, 0.95)' : 'rgba(50, 15, 20, 0.90)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-red-400 text-[18px]">
                    warning
                  </span>
                  <span
                    className="text-[11px] font-semibold truncate"
                    style={{ color: isLight ? '#991b1b' : '#fecaca' }}
                  >
                    Delete {element.label || element.name}?
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    data-testid="confirm-delete-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-semibold cursor-pointer active:scale-95"
                    style={{
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                      color: isLight ? '#3f3f46' : '#d4d4d8',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-delete-btn"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDelete();
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-red-500 text-white cursor-pointer active:scale-95 shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Primary Editable Properties Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 pb-1">
              {/* Label Input */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="specs-input-label"
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                >
                  Label
                </label>
                <input
                  id="specs-input-label"
                  data-testid="input-specs-label"
                  type="text"
                  value={element.label || ''}
                  onChange={(e) => onUpdateElement({ label: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl text-[11px] font-semibold outline-none transition-all"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isLight ? '#09090b' : '#ffffff',
                    height: '32px',
                  }}
                  placeholder="e.g. Lead Vox"
                />
              </div>

              {/* Performer Selectable Control */}
              <SpecsSelectorControl
                label="Performer"
                testId="input-specs-performer"
                value={currentPerformerVal}
                displayValue={currentPerformerVal}
                placeholder="— Unassigned —"
                icon="person"
                onClick={() => setActivePicker('performer')}
                isLight={isLight}
              />

              {/* Channel Selectable Control */}
              <SpecsSelectorControl
                label="Channel"
                testId="input-specs-channel"
                value={currentChannelVal}
                displayValue={currentChannelVal}
                placeholder="— Unassigned —"
                icon="tune"
                onClick={() => setActivePicker('channel')}
                isLight={isLight}
              />

              {/* Color Swatches */}
              <div className="flex flex-col gap-1" data-testid="specs-color-swatches">
                <label
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                >
                  Color
                </label>
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl h-[32px]"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {COLOR_SWATCHES.map((swatch) => {
                    const active = currentColor === swatch.hex.toUpperCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        data-testid={`specs-color-${swatch.name.toLowerCase()}`}
                        onClick={() => onUpdateElement({ color: swatch.hex })}
                        className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer transition-all active:scale-90"
                        style={{
                          background: swatch.hex,
                          outline: active ? '2px solid #ec4899' : 'none',
                          outlineOffset: '1.5px',
                        }}
                        title={swatch.name}
                      />
                    );
                  })}
                  <label
                    className="relative w-4 h-4 rounded-full flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background:
                        'conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                      outline: COLOR_SWATCHES.some((s) => s.hex.toUpperCase() === currentColor)
                        ? 'none'
                        : '2px solid #ec4899',
                      outlineOffset: '1.5px',
                    }}
                    title="Custom Color"
                  >
                    <input
                      type="color"
                      data-testid="specs-color-custom"
                      value={element.color || '#6B97FF'}
                      onChange={(e) => onUpdateElement({ color: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Rotation Stepper */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                >
                  Rotation ({rotation}°)
                </label>
                <div
                  className="flex items-center rounded-xl h-[32px] overflow-hidden"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <button
                    type="button"
                    data-testid="specs-rot-minus"
                    onClick={() => onUpdateElement({ rotation: (rotation - 45 + 360) % 360 })}
                    className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                    title="-45°"
                  >
                    <span className="material-symbols-outlined text-[15px]">rotate_left</span>
                  </button>
                  <input
                    data-testid="input-specs-rotation"
                    type="number"
                    value={rotation}
                    onChange={(e) =>
                      onUpdateElement({ rotation: parseInt(e.target.value, 10) || 0 })
                    }
                    className="flex-1 min-w-0 text-center text-[11px] font-bold bg-transparent outline-none"
                    style={{ color: isLight ? '#09090b' : '#ffffff' }}
                  />
                  <button
                    type="button"
                    data-testid="specs-rot-plus"
                    onClick={() => onUpdateElement({ rotation: (rotation + 45) % 360 })}
                    className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                    title="+45°"
                  >
                    <span className="material-symbols-outlined text-[15px]">rotate_right</span>
                  </button>
                </div>
              </div>

              {/* Scale Stepper */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                >
                  Scale ({scale}%)
                </label>
                <div
                  className="flex items-center rounded-xl h-[32px] overflow-hidden"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <button
                    type="button"
                    data-testid="specs-scale-minus"
                    onClick={() => onUpdateElement({ scale: Math.max(30, scale - 10) })}
                    className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                    title="Smaller"
                  >
                    <span className="material-symbols-outlined text-[15px]">remove</span>
                  </button>
                  <input
                    data-testid="input-specs-scale"
                    type="number"
                    value={scale}
                    onChange={(e) =>
                      onUpdateElement({
                        scale: Math.max(30, Math.min(250, parseInt(e.target.value, 10) || 100)),
                      })
                    }
                    className="flex-1 min-w-0 text-center text-[11px] font-bold bg-transparent outline-none"
                    style={{ color: isLight ? '#09090b' : '#ffffff' }}
                  />
                  <button
                    type="button"
                    data-testid="specs-scale-plus"
                    onClick={() => onUpdateElement({ scale: Math.min(250, scale + 10) })}
                    className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                    title="Larger"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced / Secondary Specs */}
            <div className="pt-1.5 border-t border-white/5">
              <button
                type="button"
                data-testid="specs-more-toggle"
                onClick={() => setMoreFieldsExpanded((prev) => !prev)}
                className="flex items-center justify-between w-full py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                style={{ color: '#ec4899' }}
              >
                <span>Advanced Specs</span>
                <span
                  className="material-symbols-outlined text-[16px] transition-transform"
                  style={{ transform: moreFieldsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </button>

              {moreFieldsExpanded && (
                <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                  {/* Phantom Power Toggle */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                    >
                      48V Phantom
                    </label>
                    <button
                      type="button"
                      data-testid="input-specs-phantom"
                      onClick={() => onUpdateElement({ phantom: !element.phantom })}
                      className="w-full h-[32px] rounded-xl flex items-center justify-between px-3 text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                      style={{
                        background: element.phantom
                          ? 'rgba(236, 72, 153, 0.20)'
                          : isLight
                            ? 'rgba(0, 0, 0, 0.04)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: element.phantom
                          ? '1px solid #ec4899'
                          : isLight
                            ? '1px solid rgba(0, 0, 0, 0.08)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                        color: element.phantom ? '#ec4899' : isLight ? '#52525b' : '#a1a1aa',
                      }}
                    >
                      <span>48V Power</span>
                      <span className="text-[10px]">{element.phantom ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* Input Source Selectable Control */}
                  <SpecsSelectorControl
                    label="Source"
                    testId="input-specs-source"
                    value={currentSourceVal}
                    displayValue={getSourceDisplay(currentSourceVal)}
                    placeholder="— Direct / None —"
                    icon="cable"
                    onClick={() => setActivePicker('source')}
                    isLight={isLight}
                  />

                  {/* Output Destination Selectable Control */}
                  <SpecsSelectorControl
                    label="Destination"
                    testId="input-specs-destination"
                    secondaryTestId="input-specs-output"
                    value={currentDestinationVal}
                    displayValue={getDestinationDisplay(currentDestinationVal)}
                    placeholder="— Default / FOH —"
                    icon="volume_up"
                    onClick={() => setActivePicker('destination')}
                    isLight={isLight}
                  />

                  {/* Notes Input */}
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                    >
                      Notes
                    </label>
                    <input
                      data-testid="input-specs-notes"
                      type="text"
                      value={element.notes || ''}
                      onChange={(e) => onUpdateElement({ notes: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl text-[11px] font-semibold outline-none transition-all"
                      style={{
                        background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                        border: isLight
                          ? '1px solid rgba(0, 0, 0, 0.08)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isLight ? '#09090b' : '#ffffff',
                        height: '32px',
                      }}
                      placeholder="e.g. Wireless IEM"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
