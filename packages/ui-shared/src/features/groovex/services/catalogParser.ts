import { SONG_CATALOG, type StemInfo, type SongMeta } from './catalogFetcher';
export type { StemInfo, SongMeta };


export function getArtists(): string[] {
  const set = new Set(SONG_CATALOG.map((s) => s.artist));
  return [...set].sort();
}


export function getGenres(): string[] {
  const set = new Set(SONG_CATALOG.map((s) => s.genre));
  return [...set].sort();
}
