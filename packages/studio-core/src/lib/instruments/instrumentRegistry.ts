import type { Instrument } from '../../data/chords';

export type InstrumentStatus = 'active' | 'coming_soon';

export interface InstrumentConfig {
  id: Instrument;
  name: string;
  subtitle: string;
  status: InstrumentStatus;
  icon: string;
  badge?: string;
  navTabs: string[];
  defaultTab: string;
}

export const INSTRUMENT_REGISTRY: Record<Instrument, InstrumentConfig> = {
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    subtitle: 'Acoustic & Electric 6-String',
    status: 'active',
    icon: 'music_note',
    navTabs: ['songs', 'library', 'settings'],
    defaultTab: 'songs',
  },
  saxophone: {
    id: 'saxophone',
    name: 'Saxophone',
    subtitle: 'Alto, Tenor & Baritone Fingering Chart',
    status: 'active',
    badge: 'NEW',
    icon: 'graphic_eq',
    navTabs: ['practice', 'library', 'settings'],
    defaultTab: 'practice',
  },
  piano: {
    id: 'piano',
    name: 'Piano',
    subtitle: '88-Key Grand & Electric Keyboard',
    status: 'coming_soon',
    badge: 'SOON',
    icon: 'piano',
    navTabs: ['songs', 'library', 'settings'],
    defaultTab: 'songs',
  },
  bass: {
    id: 'bass',
    name: 'Bass',
    subtitle: '4-String & 5-String Bass Guitar',
    status: 'coming_soon',
    badge: 'SOON',
    icon: 'piano_off',
    navTabs: ['songs', 'library', 'settings'],
    defaultTab: 'songs',
  },
};

export function getInstrumentConfig(inst: Instrument): InstrumentConfig {
  return INSTRUMENT_REGISTRY[inst] || INSTRUMENT_REGISTRY.guitar;
}

export function getNavTabsForInstrument(inst: Instrument): string[] {
  return getInstrumentConfig(inst).navTabs;
}
