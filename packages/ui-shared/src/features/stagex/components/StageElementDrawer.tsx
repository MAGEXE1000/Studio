import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StageLibraryItem } from '../types';
import { STAGEX_LIBRARY, STAGEX_ICON_MAP } from '../constants';

export interface StageHistoryItem {
  index: number;
  label: string;
  time?: number;
}

export interface StageElementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (item: StageLibraryItem) => void;
  isLight: boolean;
  isAmoled: boolean;
  accent: { from: string; to: string };
  // Multi-mode bottom panel support
  mode?: 'elements' | 'history';
  onModeChange?: (mode: 'elements' | 'history') => void;
  // History state & actions
  historyEntries?: StageHistoryItem[];
  currentIndex?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onJumpToHistory?: (index: number) => void;
  isSpanish?: boolean;
}

interface DrawerCategory {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: DrawerCategory[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'mics', label: 'Mics', icon: 'mic' },
  { key: 'inst', label: 'Instruments', icon: 'electric_bolt' },
  { key: 'drums', label: 'Drums', icon: 'music_note' },
  { key: 'amps', label: 'Amps', icon: 'speaker' },
  { key: 'mon', label: 'Monitors', icon: 'volume_up' },
  { key: 'util', label: 'DI & Gear', icon: 'settings_input_component' },
  { key: 'people', label: 'People', icon: 'person' },
];

export const StageElementDrawer: React.FC<StageElementDrawerProps> = ({
  isOpen,
  onClose,
  onSelectElement,
  isLight,
  isAmoled,
  accent,
  mode = 'elements',
  onModeChange,
  historyEntries = [],
  currentIndex = -1,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onJumpToHistory,
  isSpanish = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  // Scroll element list back to start when category changes
  useEffect(() => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeCategory]);

  // Scroll active history item into view when entering history mode or changing index
  useEffect(() => {
    if (mode === 'history' && historyContainerRef.current && currentIndex >= 0) {
      const activeEl = historyContainerRef.current.querySelector<HTMLElement>(
        `[data-testid="history-item-${currentIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [mode, currentIndex]);

  // Flattened elements for "All" or selected category items
  const activeItems = useMemo(() => {
    if (activeCategory === 'all') {
      const all: StageLibraryItem[] = [];
      Object.keys(STAGEX_LIBRARY).forEach((catKey) => {
        all.push(...(STAGEX_LIBRARY[catKey] || []));
      });
      return all;
    }
    return STAGEX_LIBRARY[activeCategory] || [];
  }, [activeCategory]);

  const renderIcon = (item: StageLibraryItem) => {
    const iconPath = STAGEX_ICON_MAP[item.icon as keyof typeof STAGEX_ICON_MAP] || item.icon;
    if (
      iconPath &&
      (iconPath.endsWith('.png') || iconPath.endsWith('.webp') || iconPath.endsWith('.svg'))
    ) {
      return (
        <img
          src={iconPath}
          alt={item.name}
          className="w-7 h-7 object-contain pointer-events-none"
          style={{
            filter: isLight ? undefined : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}
        />
      );
    }
    return (
      <span className="material-symbols-outlined text-[22px]">{item.icon || 'music_note'}</span>
    );
  };

  const isHistoryMode = mode === 'history';

  return (
    <>
      {/* Tap Outside Backdrop */}
      {isOpen && (
        <div
          data-testid="stagex-drawer-backdrop"
          className="fixed inset-0 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Floating Bottom Production Tool Palette (Unified Geometry) */}
      <div
        data-testid="stagex-element-drawer"
        role="region"
        aria-label={isHistoryMode ? 'Stage History Panel' : 'Stage Element Catalog'}
        className="fixed z-40 flex flex-col pointer-events-auto"
        style={{
          bottom: 'calc(max(10px, env(safe-area-inset-bottom, 0px)) + 4px)',
          left: 'calc(max(10px, env(safe-area-inset-left, 0px)) + 4px)',
          right: 'calc(max(10px, env(safe-area-inset-right, 0px)) + 4px)',
          maxWidth: '680px',
          margin: '0 auto',
          background: isAmoled
            ? 'rgba(10, 10, 14, 0.94)'
            : isLight
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(18, 18, 24, 0.92)',
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
          padding: '10px 12px 12px 12px',
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0px) scale(1)' : 'translateY(12px) scale(0.98)',
          transition:
            'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── 1. ELEMENTS MODE ────────────────────────────────────── */}
        {!isHistoryMode && (
          <div
            data-testid="stagex-panel-mode-elements"
            className="flex flex-col w-full"
            style={{
              transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header: Category Horizontal Selector + History Switcher + Close Button */}
            <div className="flex items-center justify-between gap-2 pb-2">
              <div
                data-testid="drawer-categories-row"
                className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1 py-0.5"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      data-testid={`drawer-cat-${cat.key}`}
                      onClick={() => setActiveCategory(cat.key)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all active:scale-95 cursor-pointer"
                      style={{
                        background: isActive
                          ? isLight
                            ? '#09090b'
                            : '#ffffff'
                          : isLight
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.06)',
                        color: isActive
                          ? isLight
                            ? '#ffffff'
                            : '#09090b'
                          : isLight
                            ? '#52525b'
                            : '#a1a1aa',
                        border: isActive
                          ? isLight
                            ? '1px solid #09090b'
                            : '1px solid #ffffff'
                          : isLight
                            ? '1px solid rgba(0, 0, 0, 0.04)'
                            : '1px solid rgba(255, 255, 255, 0.04)',
                        fontWeight: isActive ? 700 : 600,
                      }}
                    >
                      <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mode Switcher to History */}
              <button
                type="button"
                data-testid="stagex-switch-to-history-btn"
                onClick={() => onModeChange?.('history')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all active:scale-95 cursor-pointer"
                style={{
                  background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                  color: isLight ? '#52525b' : '#a1a1aa',
                  border: isLight
                    ? '1px solid rgba(0, 0, 0, 0.06)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
                title={isSpanish ? 'Historial de Cambios' : 'History'}
                aria-label={isSpanish ? 'Historial' : 'History'}
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span className="hidden sm:inline">{isSpanish ? 'Historial' : 'History'}</span>
              </button>

              {/* Dedicated Close Button */}
              <button
                type="button"
                data-testid="stagex-drawer-close-btn"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 transition-all"
                style={{
                  background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                  color: isLight ? '#52525b' : '#a1a1aa',
                  border: isLight
                    ? '1px solid rgba(0, 0, 0, 0.06)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
                aria-label="Close Element Drawer"
                title="Close"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Elements Horizontal Scrolling Shelf */}
            <div
              ref={itemsContainerRef}
              data-testid="drawer-elements-row"
              className="flex items-center gap-2 overflow-x-auto pt-0.5"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {activeItems.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  data-testid={`drawer-item-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    onSelectElement(item);
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 flex-shrink-0 cursor-pointer group"
                  style={{
                    width: '74px',
                    height: '74px',
                    background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.07)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                  title={`Add ${item.name}`}
                >
                  <div className="w-7 h-7 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
                    {renderIcon(item)}
                  </div>
                  <span
                    className="text-[9.5px] font-semibold text-center w-full truncate px-0.5 leading-tight"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: isLight ? '#27272a' : '#d4d4d8',
                    }}
                  >
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. HISTORY MODE ─────────────────────────────────────── */}
        {isHistoryMode && (
          <div
            data-testid="stagex-panel-mode-history"
            className="flex flex-col w-full"
            style={{
              transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header: Back to Elements + Title + Undo/Redo + Close */}
            <div className="flex items-center justify-between gap-2 pb-2">
              {/* Back to Elements Button */}
              <button
                type="button"
                data-testid="stagex-history-back-btn"
                onClick={() => onModeChange?.('elements')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all active:scale-95 cursor-pointer"
                style={{
                  background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                  color: isLight ? '#27272a' : '#e4e4e7',
                  border: isLight
                    ? '1px solid rgba(0, 0, 0, 0.06)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
                title={isSpanish ? 'Volver a Elementos' : 'Back to Elements'}
                aria-label={isSpanish ? 'Elementos' : 'Elements'}
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                <span>{isSpanish ? 'Elementos' : 'Elements'}</span>
              </button>

              {/* Center Title & Step Counter */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-[12px] font-bold tracking-tight truncate"
                  style={{
                    color: isLight ? '#09090b' : '#ffffff',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {isSpanish ? 'Historial de Edición' : 'Editing History'}
                </span>
                {historyEntries.length > 0 && (
                  <span
                    data-testid="stagex-history-step-badge"
                    className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)',
                      color: isLight ? '#52525b' : '#a1a1aa',
                    }}
                  >
                    {Math.max(0, currentIndex + 1)} / {historyEntries.length}
                  </span>
                )}
              </div>

              {/* Undo & Redo Actions + Close */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  data-testid="stagex-panel-undo-btn"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: canUndo
                      ? isLight
                        ? 'rgba(0, 0, 0, 0.06)'
                        : 'rgba(255, 255, 255, 0.10)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'rgba(255, 255, 255, 0.03)',
                    color: canUndo
                      ? isLight
                        ? '#09090b'
                        : '#ffffff'
                      : isLight
                        ? '#a1a1aa'
                        : '#52525b',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    opacity: canUndo ? 1 : 0.4,
                    cursor: canUndo ? 'pointer' : 'not-allowed',
                  }}
                  title={isSpanish ? 'Deshacer (Undo)' : 'Undo'}
                  aria-label={isSpanish ? 'Deshacer' : 'Undo'}
                >
                  <span className="material-symbols-outlined text-[15px]">undo</span>
                  <span className="hidden xs:inline">{isSpanish ? 'Deshacer' : 'Undo'}</span>
                </button>

                <button
                  type="button"
                  data-testid="stagex-panel-redo-btn"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: canRedo
                      ? isLight
                        ? 'rgba(0, 0, 0, 0.06)'
                        : 'rgba(255, 255, 255, 0.10)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'rgba(255, 255, 255, 0.03)',
                    color: canRedo
                      ? isLight
                        ? '#09090b'
                        : '#ffffff'
                      : isLight
                        ? '#a1a1aa'
                        : '#52525b',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    opacity: canRedo ? 1 : 0.4,
                    cursor: canRedo ? 'pointer' : 'not-allowed',
                  }}
                  title={isSpanish ? 'Rehacer (Redo)' : 'Redo'}
                  aria-label={isSpanish ? 'Rehacer' : 'Redo'}
                >
                  <span className="material-symbols-outlined text-[15px]">redo</span>
                  <span className="hidden xs:inline">{isSpanish ? 'Rehacer' : 'Redo'}</span>
                </button>

                <button
                  type="button"
                  data-testid="stagex-drawer-close-btn"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 transition-all"
                  style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                    color: isLight ? '#52525b' : '#a1a1aa',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  aria-label="Close History"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            {/* History Horizontal Scrolling Shelf (74px height matching elements row) */}
            <div
              ref={historyContainerRef}
              data-testid="drawer-history-row"
              className="flex items-center gap-2 overflow-x-auto pt-0.5"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {historyEntries.length === 0 ? (
                <div
                  className="w-full flex items-center justify-center text-[11px] font-medium"
                  style={{
                    height: '74px',
                    color: isLight ? '#71717a' : '#a1a1aa',
                  }}
                >
                  {isSpanish ? 'Sin acciones en el historial todavía' : 'No history yet'}
                </div>
              ) : (
                historyEntries.map((entry) => {
                  const isCurrent = entry.index === currentIndex;
                  const isPast = entry.index < currentIndex;
                  const isFuture = entry.index > currentIndex;

                  const timeStr = entry.time
                    ? new Date(entry.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : `Step ${entry.index + 1}`;

                  return (
                    <button
                      key={entry.index}
                      type="button"
                      data-testid={`history-item-${entry.index}`}
                      onClick={() => onJumpToHistory?.(entry.index)}
                      className="flex flex-col justify-between p-2.5 rounded-2xl transition-all active:scale-95 flex-shrink-0 cursor-pointer text-left relative overflow-hidden group"
                      style={{
                        width: '150px',
                        height: '74px',
                        background: isCurrent
                          ? isLight
                            ? 'rgba(37, 99, 235, 0.08)'
                            : 'rgba(37, 99, 235, 0.16)'
                          : isLight
                            ? 'rgba(0, 0, 0, 0.03)'
                            : 'rgba(255, 255, 255, 0.04)',
                        border: isCurrent
                          ? `1.5px solid ${accent.from || '#2563eb'}`
                          : isFuture
                            ? isLight
                              ? '1px dashed rgba(0, 0, 0, 0.12)'
                              : '1px dashed rgba(255, 255, 255, 0.12)'
                            : isLight
                              ? '1px solid rgba(0, 0, 0, 0.07)'
                              : '1px solid rgba(255, 255, 255, 0.07)',
                        opacity: isFuture ? 0.6 : 1,
                      }}
                      title={entry.label}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: isCurrent
                                ? accent.from || '#2563eb'
                                : isPast
                                  ? isLight
                                    ? '#10b981'
                                    : '#34d399'
                                  : isLight
                                    ? '#9ca3af'
                                    : '#6b7280',
                              boxShadow: isCurrent
                                ? `0 0 8px ${accent.from || '#2563eb'}`
                                : undefined,
                            }}
                          />
                          <span
                            className="text-[9px] font-mono font-medium truncate"
                            style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                          >
                            {timeStr}
                          </span>
                        </div>

                        {isCurrent && (
                          <span
                            data-testid="history-item-current-badge"
                            className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-extrabold uppercase tracking-wider"
                            style={{
                              background: accent.from || '#2563eb',
                              color: '#ffffff',
                            }}
                          >
                            {isSpanish ? 'ACTUAL' : 'NOW'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 w-full mt-1">
                        <div
                          className="text-[11px] font-bold truncate leading-tight"
                          style={{
                            color: isCurrent
                              ? isLight
                                ? '#1d4ed8'
                                : '#60a5fa'
                              : isLight
                                ? '#18181b'
                                : '#f4f4f5',
                          }}
                        >
                          {entry.label}
                        </div>
                        <div
                          className="text-[9px] font-mono truncate mt-0.5"
                          style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                        >
                          {isCurrent
                            ? isSpanish
                              ? 'Estado actual'
                              : 'Active state'
                            : isPast
                              ? isSpanish
                                ? '← Deshacer aquí'
                                : '← Undo to here'
                              : isSpanish
                                ? 'Rehacer aquí →'
                                : 'Redo to here →'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
