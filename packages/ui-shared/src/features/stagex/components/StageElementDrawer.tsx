import React from 'react';
import type { StageLibraryItem } from '../types';
import { StageBottomPanelSlot } from './StageBottomPanelSlot';
import { StageElementLibrarySurface } from './StageElementLibrarySurface';
import { StageHistorySurface, type StageHistoryItem } from './StageHistorySurface';

export type { StageHistoryItem };

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

export const StageElementDrawer: React.FC<StageElementDrawerProps> = ({
  isOpen,
  onClose,
  onSelectElement,
  isLight,
  isAmoled,
  accent,
  mode = 'elements',
  historyEntries = [],
  currentIndex = -1,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onJumpToHistory,
  isSpanish = false,
}) => {
  const isHistoryMode = mode === 'history';

  return (
    <StageBottomPanelSlot
      isOpen={isOpen}
      onClose={onClose}
      isLight={isLight}
      isAmoled={isAmoled}
      ariaLabel={isHistoryMode ? 'Stage History Panel' : 'Stage Element Catalog'}
      testId="stagex-element-drawer"
    >
      {isHistoryMode ? (
        <StageHistorySurface
          onClose={onClose}
          historyEntries={historyEntries}
          currentIndex={currentIndex}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onJumpToHistory={onJumpToHistory}
          isLight={isLight}
          isAmoled={isAmoled}
          isSpanish={isSpanish}
        />
      ) : (
        <StageElementLibrarySurface
          onClose={onClose}
          onSelectElement={onSelectElement}
          isLight={isLight}
          isAmoled={isAmoled}
          accent={accent}
        />
      )}
    </StageBottomPanelSlot>
  );
};
