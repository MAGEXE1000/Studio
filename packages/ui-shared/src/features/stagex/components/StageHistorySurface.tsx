import React, { useRef, useEffect } from 'react';
import { useSettingsStore, useT } from '@workspace/studio-core';

export interface StageHistoryItem {
  index: number;
  label: string;
  time?: number;
}

export interface StageHistorySurfaceProps {
  onClose: () => void;
  historyEntries?: StageHistoryItem[];
  currentIndex?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onJumpToHistory?: (index: number) => void;
  isLight: boolean;
  isAmoled: boolean;
  isSpanish?: boolean;
}

export const StageHistorySurface: React.FC<StageHistorySurfaceProps> = ({
  onClose,
  historyEntries = [],
  currentIndex = -1,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onJumpToHistory,
  isLight,
  isSpanish: isSpanishProp,
}) => {
  const t = useT();
  const tr = t as any;
  const settingsLang = useSettingsStore((s) => s.settings.language);
  const isSpanish =
    isSpanishProp !== undefined
      ? isSpanishProp
      : settingsLang === 'es' || tr.nav?.stagexStage === 'Escenario';
  const historyContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active history card into view
  useEffect(() => {
    if (historyContainerRef.current && currentIndex >= 0) {
      const activeEl = historyContainerRef.current.querySelector<HTMLElement>(
        `[data-testid="history-item-${currentIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const totalSteps = Math.max(historyEntries.length, 1);
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 1;
  const stepText = isSpanish
    ? `Paso ${currentStep} de ${totalSteps}`
    : `Step ${currentStep} of ${totalSteps}`;

  return (
    <div
      data-testid="stagex-history-surface"
      className="flex flex-col w-full"
      style={{
        transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header: Title + Step Badge (Left) & Undo/Redo + Close (Right) */}
      <div className="flex items-center justify-between gap-3 pb-2">
        {/* Left: Un-truncated Title & Step Counter */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="material-symbols-outlined text-[18px] text-pink-500 flex-shrink-0">
            history
          </span>
          <span
            data-testid="stagex-history-title"
            className="text-[13px] font-bold tracking-tight whitespace-nowrap"
            style={{
              color: isLight ? '#09090b' : '#ffffff',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {isSpanish ? 'Historial de Edición' : 'History'}
          </span>
          <span
            data-testid="stagex-history-step-badge"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)',
              color: isLight ? '#52525b' : '#a1a1aa',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.05)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {stepText}
          </span>
        </div>

        {/* Right: Balanced Undo, Redo, and Close Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Undo Button */}
          <button
            type="button"
            data-testid="stagex-panel-undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-95"
            style={{
              background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              color: canUndo ? (isLight ? '#09090b' : '#ffffff') : isLight ? '#a1a1aa' : '#52525b',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.06)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            title={isSpanish ? 'Deshacer' : 'Undo'}
            aria-label={isSpanish ? 'Deshacer' : 'Undo'}
          >
            <span className="material-symbols-outlined text-[17px]">undo</span>
          </button>

          {/* Redo Button */}
          <button
            type="button"
            data-testid="stagex-panel-redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-95"
            style={{
              background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              color: canRedo ? (isLight ? '#09090b' : '#ffffff') : isLight ? '#a1a1aa' : '#52525b',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.06)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            title={isSpanish ? 'Rehacer' : 'Redo'}
            aria-label={isSpanish ? 'Rehacer' : 'Redo'}
          >
            <span className="material-symbols-outlined text-[17px]">redo</span>
          </button>

          <div
            className="w-[1px] h-3.5 mx-0.5"
            style={{ background: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.14)' }}
          />

          {/* Dedicated Close Button */}
          <button
            type="button"
            data-testid="stagex-history-close-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 transition-all"
            style={{
              background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              color: isLight ? '#52525b' : '#a1a1aa',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.06)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
            aria-label={isSpanish ? 'Cerrar panel de historial' : 'Close History Panel'}
            title={isSpanish ? 'Cerrar' : 'Close'}
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* History Horizontal Scrolling Shelf */}
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
            data-testid="stagex-history-empty"
            className="w-full flex items-center justify-center py-5 text-[11px] font-medium"
            style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
          >
            {isSpanish ? 'No hay acciones registradas aún' : 'No history recorded yet'}
          </div>
        ) : (
          historyEntries.map((entry) => {
            const isCurrent = entry.index === currentIndex;
            const timeStr = entry.time
              ? new Date(entry.time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <button
                key={`history-${entry.index}`}
                type="button"
                data-testid={`history-item-${entry.index}`}
                onClick={() => onJumpToHistory?.(entry.index)}
                className="flex flex-col items-start justify-between p-2 rounded-2xl transition-all active:scale-95 flex-shrink-0 cursor-pointer text-left relative"
                style={{
                  width: '136px',
                  height: '74px',
                  background: isCurrent
                    ? isLight
                      ? 'rgba(236, 72, 153, 0.09)'
                      : 'rgba(236, 72, 153, 0.16)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.04)',
                  border: isCurrent
                    ? '1.5px solid #ec4899'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.07)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                  color: isLight ? '#09090b' : '#ffffff',
                }}
                title={isSpanish ? `Ir a ${entry.label}` : `Jump to ${entry.label}`}
              >
                {/* Top: Step Badge + Current Indicator */}
                <div className="w-full flex items-center justify-between gap-1">
                  <span
                    className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.2 rounded"
                    style={{
                      background: isCurrent
                        ? '#ec4899'
                        : isLight
                          ? 'rgba(0, 0, 0, 0.06)'
                          : 'rgba(255, 255, 255, 0.10)',
                      color: isCurrent ? '#ffffff' : isLight ? '#71717a' : '#a1a1aa',
                    }}
                  >
                    #{entry.index + 1}
                  </span>
                  {isCurrent && (
                    <span
                      data-testid="stagex-history-now-badge"
                      className="text-[8.5px] font-black uppercase tracking-wider text-pink-500 flex items-center gap-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                      {isSpanish ? 'ACTUAL' : 'NOW'}
                    </span>
                  )}
                  {timeStr && !isCurrent && (
                    <span
                      className="text-[9px] font-medium"
                      style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                    >
                      {timeStr}
                    </span>
                  )}
                </div>

                {/* Bottom: Action Label */}
                <span
                  className="text-[10px] font-bold w-full line-clamp-2 leading-snug"
                  style={{
                    color: isCurrent
                      ? isLight
                        ? '#09090b'
                        : '#ffffff'
                      : isLight
                        ? '#3f3f46'
                        : '#d4d4d8',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {entry.label || (isSpanish ? 'Acción' : 'Action')}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
