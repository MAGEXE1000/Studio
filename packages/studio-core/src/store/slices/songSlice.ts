export interface SongSection {
  id: string;
  name: string;
  chords: string[];
}

export interface SongPreset {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  key: string;
  notes: string;
  chords: string[];
  sections?: SongSection[];
  createdAt: number;
  updatedAt: number;
}

export interface SongSliceState {
  presets: SongPreset[];
  activePresetId: string | null;
  transpositions: Record<string, number>;
}
