export interface StageLibraryItem {
  id?: string;
  name: string;
  type: string;
  icon: string;
  category?: string;
  color?: string;
  isCustom?: boolean;
  imageData?: string;
  emoji?: string;
}

export type StageWin = Window & {
  stageGoBack?: () => boolean;
  openPresetsPanel?: () => void;
  switchView?: (v: string) => void;
  __onViewChange?: (view: string) => void;
  scActivateMeasure?: () => void;
  scToggleZones?: () => void;
  scToggleCableLength?: () => void;
  openTimelinePanel?: () => void;
  exportPDFWithOptions?: (o: { name: string; includeBackdrop: boolean }) => Promise<void>;
  updateCanvasBg?: (c: string) => void;
  addItemToStage?: (item: StageLibraryItem) => void;
  stageHasOpenOverlay?: () => boolean;
  openCustomElementModal?: () => void;
  __getSceneInfo?: () => { count: number; currentIdx: number; names: string[] };
  setStageShape?: (shape: 'rectangular' | 'square') => void;
  resetView?: () => void;
  setSnapToGrid?: (val: boolean) => void;
  setGridVisible?: (val: boolean) => void;
  setGridSize?: (size: number) => void;
  setConnectionsVisible?: (val: boolean) => void;
  setLabelsVisible?: (val: boolean) => void;
  setShowCableLength?: (val: boolean) => void;
  setAutoWire?: (val: boolean) => void;
  setStageBalanceVisible?: (val: boolean) => void;
  setStageUnits?: (units: 'meters' | 'feet') => void;
  setReducedAnimations?: (val: boolean) => void;
  syncAllPreferences?: (prefs: any) => void;
  state?: any;
};
