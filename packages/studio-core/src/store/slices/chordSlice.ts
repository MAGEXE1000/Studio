import type { ChordType } from '../../data/chords';

export interface Progression {
  id: string;
  name: string;
  chords: string[];
  createdAt: number;
}

export interface BarreDef {
  fret: number;
  fromString: number;
  toString: number;
}

export interface CustomChord {
  id: string;
  name: string;
  instrument: 'guitar' | 'piano' | 'bass';
  frets?: number[];
  barres?: BarreDef[];
  pianoKeys?: number[];
  notes: string[];
  createdAt: number;
}

export interface ChordSliceState {
  selectedChordId: string | null;
  favorites: string[];
  recentChords: string[];
  progressions: Progression[];
  currentProgressionChords: string[];
  multiSelectChords: string[];
  isMultiChordMode: boolean;
  customChords: CustomChord[];
  chordUsage: Record<string, number>;
  libraryActiveType: ChordType | 'all' | null;
}
