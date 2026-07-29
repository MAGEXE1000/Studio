import { SongMeta } from './catalogParser';
import { fetchSongCatalog } from './catalogFetcher';

let cachedCatalog: SongMeta[] | null = null;

export function getCachedCatalog(): SongMeta[] {
  if (!cachedCatalog) {
    cachedCatalog = fetchSongCatalog();
  }
  return cachedCatalog;
}

export function clearCatalogCache(): void {
  cachedCatalog = null;
}
