import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InspectorTab =
  | 'info'
  | 'props'
  | 'styles'
  | 'animation'
  | 'render'
  | 'tree'
  | 'measure'
  | 'export';

export type GridOverlayMode =
  | 'none'
  | '4dp'
  | '8dp'
  | 'baseline'
  | 'safeArea'
  | 'touchTargets';

export interface ComponentFiberInfo {
  displayName: string;
  tagName: string;
  props: Record<string, any>;
  state: Record<string, any>;
  hooks: any[];
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  renderCount: number;
  lastRenderTime?: number;
  memoized: boolean;
  ownerName?: string;
  parentName?: string;
  childrenCount: number;
  siblingCount: number;
  renderDepth: number;
}

export interface InspectorStoreState {
  isEnabled: boolean;
  isLiveSelecting: boolean;
  isFrozen: boolean;
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
  selectedFiberInfo: ComponentFiberInfo | null;
  activeTab: InspectorTab;
  searchQuery: string;
  gridOverlay: GridOverlayMode;
  measurePair: [HTMLElement | null, HTMLElement | null];
  showBoxModel: boolean;
  showParentOutline: boolean;
  showChildrenOutline: boolean;
  
  // Actions
  setIsEnabled: (enabled: boolean) => void;
  setIsLiveSelecting: (selecting: boolean) => void;
  setIsFrozen: (frozen: boolean) => void;
  setSelectedElement: (el: HTMLElement | null, fiberInfo?: ComponentFiberInfo | null) => void;
  setHoveredElement: (el: HTMLElement | null) => void;
  setActiveTab: (tab: InspectorTab) => void;
  setSearchQuery: (query: string) => void;
  setGridOverlay: (grid: GridOverlayMode) => void;
  setMeasurePair: (pair: [HTMLElement | null, HTMLElement | null]) => void;
  setShowBoxModel: (show: boolean) => void;
  setShowParentOutline: (show: boolean) => void;
  setShowChildrenOutline: (show: boolean) => void;
  resetInspector: () => void;
}

export const useDeveloperInspectorStore = create<InspectorStoreState>()(
  persist(
    (set) => ({
      isEnabled: false,
      isLiveSelecting: false,
      isFrozen: false,
      selectedElement: null,
      hoveredElement: null,
      selectedFiberInfo: null,
      activeTab: 'info',
      searchQuery: '',
      gridOverlay: 'none',
      measurePair: [null, null],
      showBoxModel: true,
      showParentOutline: true,
      showChildrenOutline: true,

      setIsEnabled: (isEnabled) =>
        set((state) => {
          if (!isEnabled) {
            return {
              isEnabled: false,
              isLiveSelecting: false,
              isFrozen: false,
              selectedElement: null,
              hoveredElement: null,
              selectedFiberInfo: null,
              measurePair: [null, null],
            };
          }
          return { isEnabled: true };
        }),

      setIsLiveSelecting: (isLiveSelecting) => set({ isLiveSelecting }),
      setIsFrozen: (isFrozen) => set({ isFrozen }),
      setSelectedElement: (selectedElement, selectedFiberInfo = null) =>
        set({ selectedElement, selectedFiberInfo }),
      setHoveredElement: (hoveredElement) => set({ hoveredElement }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setGridOverlay: (gridOverlay) => set({ gridOverlay }),
      setMeasurePair: (measurePair) => set({ measurePair }),
      setShowBoxModel: (showBoxModel) => set({ showBoxModel }),
      setShowParentOutline: (showParentOutline) => set({ showParentOutline }),
      setShowChildrenOutline: (showChildrenOutline) => set({ showChildrenOutline }),

      resetInspector: () =>
        set({
          isLiveSelecting: false,
          isFrozen: false,
          selectedElement: null,
          hoveredElement: null,
          selectedFiberInfo: null,
          activeTab: 'info',
          searchQuery: '',
          gridOverlay: 'none',
          measurePair: [null, null],
        }),
    }),
    {
      name: 'livex_developer_inspector_v1',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        showBoxModel: state.showBoxModel,
        showParentOutline: state.showParentOutline,
        showChildrenOutline: state.showChildrenOutline,
      }),
    }
  )
);
