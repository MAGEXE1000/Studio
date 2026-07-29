import { SONG_CATALOG } from './catalogFetcher';
export interface StemInfo {
  name: string;
  label: string;
  icon: string;
}
export interface SongMeta {
  id: string;
  title: string;
  artist: string;
  source: string;
  bpm: number;
  key: string;
  duration: string;
  stems: StemInfo[];
  genre: string;
  hasStems: boolean;
}


export function getArtists(): string[] {
  const set = new Set(SONG_CATALOG.map((s) => s.artist));
  return [...set].sort();
}


export function getGenres(): string[] {
  const set = new Set(SONG_CATALOG.map((s) => s.genre));
  return [...set].sort();
}
