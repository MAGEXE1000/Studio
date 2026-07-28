export interface BakaiIconPath {
  d: string;
  fill?: boolean;
  type?: 'path' | 'circle' | 'rect';
  circleProps?: { cx: number; cy: number; r: number };
  rectProps?: { x: number; y: number; width: number; height: number; rx?: number };
}

export interface BakaiIconDef {
  name: string;
  viewBox?: string;
  paths: BakaiIconPath[];
}

export const BAKAI_ICON_LIBRARY: Record<string, BakaiIconDef> = {
  home: {
    name: 'home',
    paths: [
      { d: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z' }
    ]
  },
  songs: {
    name: 'songs',
    paths: [
      { d: 'M9 18V5l12-2v13' },
      { type: 'circle', circleProps: { cx: 6, cy: 18, r: 3 }, d: '' },
      { type: 'circle', circleProps: { cx: 18, cy: 16, r: 3 }, d: '' }
    ]
  },
  library: {
    name: 'library',
    paths: [
      { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' },
      { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
      { d: 'M8 7h8' },
      { d: 'M8 11h6' }
    ]
  },
  practice: {
    name: 'practice',
    paths: [
      { d: 'M12 3v18' },
      { d: 'M8 7v10' },
      { d: 'M16 7v10' },
      { d: 'M4 10v4' },
      { d: 'M20 10v4' }
    ]
  },
  settings: {
    name: 'settings',
    paths: [
      { type: 'circle', circleProps: { cx: 12, cy: 12, r: 3 }, d: '' },
      { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' }
    ]
  },
  profile: {
    name: 'profile',
    paths: [
      { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
      { type: 'circle', circleProps: { cx: 12, cy: 7, r: 4 }, d: '' }
    ]
  },
  search: {
    name: 'search',
    paths: [
      { type: 'circle', circleProps: { cx: 11, cy: 11, r: 8 }, d: '' },
      { d: 'M21 21l-4.35-4.35' }
    ]
  },
  notifications: {
    name: 'notifications',
    paths: [
      { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
      { d: 'M13.73 21a2 2 0 0 1-3.46 0' }
    ]
  },
  update: {
    name: 'update',
    paths: [
      { d: 'M21.5 2v6h-6' },
      { d: 'M2.5 22v-6h6' },
      { d: 'M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8' },
      { d: 'M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16' }
    ]
  },
  stage: {
    name: 'stage',
    paths: [
      { d: 'M12 2L2 7l10 5 10-5-10-5z' },
      { d: 'M2 17l10 5 10-5' },
      { d: 'M2 12l10 5 10-5' }
    ]
  },
  chord: {
    name: 'chord',
    paths: [
      { d: 'M3 5h18' },
      { d: 'M3 19h18' },
      { d: 'M6 5v14' },
      { d: 'M12 5v14' },
      { d: 'M18 5v14' },
      { type: 'circle', circleProps: { cx: 6, cy: 9, r: 1.5 }, d: '' },
      { type: 'circle', circleProps: { cx: 12, cy: 14, r: 1.5 }, d: '' },
      { type: 'circle', circleProps: { cx: 18, cy: 9, r: 1.5 }, d: '' }
    ]
  },
  groove: {
    name: 'groove',
    paths: [
      { type: 'rect', rectProps: { x: 3, y: 3, width: 7, height: 7, rx: 2 }, d: '' },
      { type: 'rect', rectProps: { x: 14, y: 3, width: 7, height: 7, rx: 2 }, d: '' },
      { type: 'rect', rectProps: { x: 14, y: 14, width: 7, height: 7, rx: 2 }, d: '' },
      { type: 'rect', rectProps: { x: 3, y: 14, width: 7, height: 7, rx: 2 }, d: '' }
    ]
  },
  vocal: {
    name: 'vocal',
    paths: [
      { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z' },
      { d: 'M19 10v2a7 7 0 0 1-14 0v-2' },
      { d: 'M12 19v3' },
      { d: 'M8 22h8' }
    ]
  },
  discover: {
    name: 'discover',
    paths: [
      { type: 'circle', circleProps: { cx: 12, cy: 12, r: 10 }, d: '' },
      { d: 'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z' }
    ]
  },
  inspector: {
    name: 'inspector',
    paths: [
      { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.9a6 6 0 0 1 7.94-7.94l-3.76 3.76z' }
    ]
  },
  diagnostics: {
    name: 'diagnostics',
    paths: [
      { d: 'M22 12h-4l-3 9L9 3l-3 9H2' }
    ]
  },
  network: {
    name: 'network',
    paths: [
      { d: 'M5 12.55a11 11 0 0 1 14.08 0' },
      { d: 'M1.42 9a16 16 0 0 1 21.16 0' },
      { d: 'M8.53 16.11a6 6 0 0 1 6.95 0' },
      { type: 'circle', circleProps: { cx: 12, cy: 20, r: 1 }, d: '' }
    ]
  },
  performance: {
    name: 'performance',
    paths: [
      { d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' }
    ]
  },
  projects: {
    name: 'projects',
    paths: [
      { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }
    ]
  },
  activity: {
    name: 'activity',
    paths: [
      { d: 'M22 12h-4l-3 9L9 3l-3 9H2' }
    ]
  },
  sync: {
    name: 'sync',
    paths: [
      { d: 'M21.5 2v6h-6' },
      { d: 'M2.5 22v-6h6' },
      { d: 'M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8' },
      { d: 'M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16' }
    ]
  },
  backup: {
    name: 'backup',
    paths: [
      { d: 'M19 18a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.42-1.9 4 4 0 0 0-6.08 4.9 3.5 3.5 0 0 0 1 7h14z' },
      { d: 'M12 12v6' },
      { d: 'M9 15l3-3 3 3' }
    ]
  },
  copy: {
    name: 'copy',
    paths: [
      { type: 'rect', rectProps: { x: 9, y: 9, width: 13, height: 13, rx: 2 }, d: '' },
      { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }
    ]
  },
  check: {
    name: 'check',
    paths: [
      { d: 'M20 6L9 17l-5-5' }
    ]
  },
  close: {
    name: 'close',
    paths: [
      { d: 'M18 6L6 18' },
      { d: 'M6 6l12 12' }
    ]
  },
  menu: {
    name: 'menu',
    paths: [
      { d: 'M3 12h18' },
      { d: 'M3 6h18' },
      { d: 'M3 18h18' }
    ]
  },
  chevron_left: {
    name: 'chevron_left',
    paths: [
      { d: 'M15 18l-6-6 6-6' }
    ]
  },
  chevron_right: {
    name: 'chevron_right',
    paths: [
      { d: 'M9 18l6-6-6-6' }
    ]
  },
  volume: {
    name: 'volume',
    paths: [
      { d: 'M11 5L6 9H2v6h4l5 4V5z' },
      { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' },
      { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }
    ]
  },
  play: {
    name: 'play',
    paths: [
      { d: 'M5 3l14 9-14 9V3z' }
    ]
  },
  pause: {
    name: 'pause',
    paths: [
      { d: 'M6 4h4v16H6z' },
      { d: 'M14 4h4v16h-4z' }
    ]
  },
  stop: {
    name: 'stop',
    paths: [
      { type: 'rect', rectProps: { x: 4, y: 4, width: 16, height: 16, rx: 2 }, d: '' }
    ]
  },
  warning: {
    name: 'warning',
    paths: [
      { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
      { d: 'M12 9v4' },
      { type: 'circle', circleProps: { cx: 12, cy: 17, r: 0.5 }, d: '' }
    ]
  },
  error: {
    name: 'error',
    paths: [
      { type: 'circle', circleProps: { cx: 12, cy: 12, r: 10 }, d: '' },
      { d: 'M15 9l-6 6' },
      { d: 'M9 9l6 6' }
    ]
  },
  info: {
    name: 'info',
    paths: [
      { type: 'circle', circleProps: { cx: 12, cy: 12, r: 10 }, d: '' },
      { d: 'M12 16v-4' },
      { d: 'M12 8h.01' }
    ]
  },
  sparkles: {
    name: 'sparkles',
    paths: [
      { d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z' },
      { d: 'M19 17l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z' }
    ]
  },
  graphic_eq: {
    name: 'graphic_eq',
    paths: [
      { d: 'M12 3v18' },
      { d: 'M8 7v10' },
      { d: 'M16 7v10' },
      { d: 'M4 10v4' },
      { d: 'M20 10v4' }
    ]
  },
  piano: {
    name: 'piano',
    paths: [
      { type: 'rect', rectProps: { x: 3, y: 4, width: 18, height: 16, rx: 2 }, d: '' },
      { d: 'M7 4v16' },
      { d: 'M11 4v16' },
      { d: 'M15 4v16' },
      { d: 'M19 4v16' }
    ]
  },
  trash: {
    name: 'trash',
    paths: [
      { d: 'M3 6h18' },
      { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }
    ]
  },
  edit: {
    name: 'edit',
    paths: [
      { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
      { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }
    ]
  },
  filter: {
    name: 'filter',
    paths: [
      { d: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z' }
    ]
  },
  arrow_up: {
    name: 'arrow_up',
    paths: [
      { d: 'M12 19V5' },
      { d: 'M5 12l7-7 7 7' }
    ]
  },
  arrow_down: {
    name: 'arrow_down',
    paths: [
      { d: 'M12 5v14' },
      { d: 'M19 12l-7 7-7-7' }
    ]
  },
  arrow_right: {
    name: 'arrow_right',
    paths: [
      { d: 'M5 12h14' },
      { d: 'M12 5l7 7-7 7' }
    ]
  }
};

export function getBakaiIcon(name: string): BakaiIconDef {
  return BAKAI_ICON_LIBRARY[name] || BAKAI_ICON_LIBRARY.info;
}
