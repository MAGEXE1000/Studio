import {
  useT,
  useScrollHide,
  useIsWebDesktop,
  useChordStore,
  NavigationDispatcher,
  useSettingsStore,
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useMemo, useRef } from 'react';
import NoResultsLottie from '../../../shared/lottie/NoResultsLottie';
import { SONG_CATALOG, getArtists, getGenres } from '../services/songCatalog';
import type { SongMeta } from '../services/songCatalog';
import { useGroovexStore } from '../state/useGroovexStore';
import { StaggeredReveal } from '../../../shared/animation';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { SearchBar } from '../../../shared/design-system/StudioDesignSystem';

export default function GroovexLibrary() {
  const searchQuery = useGroovexStore(useShallow((s) => s.searchQuery));
  const setSearchQuery = useGroovexStore(useShallow((s) => s.setSearchQuery));
  const filterArtist = useGroovexStore(useShallow((s) => s.filterArtist));
  const setFilterArtist = useGroovexStore(useShallow((s) => s.setFilterArtist));
  const filterGenre = useGroovexStore(useShallow((s) => s.filterGenre));
  const setFilterGenre = useGroovexStore(useShallow((s) => s.setFilterGenre));
  const sortBy = useGroovexStore(useShallow((s) => s.sortBy));
  const setSortBy = useGroovexStore(useShallow((s) => s.setSortBy));
  const setActiveSong = useGroovexStore(useShallow((s) => s.setActiveSong));
  const addRecentSong = useGroovexStore(useShallow((s) => s.addRecentSong));
  const recentSongs = useGroovexStore(useShallow((s) => s.recentSongs));
  const settings = useSettingsStore(useShallow((s) => s.settings));
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const t = useT();
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);

  const artists = useMemo(() => getArtists(), []);
  const genres = useMemo(() => getGenres(), []);

  const filteredSongs = useMemo(() => {
    let songs = [...SONG_CATALOG];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q)
      );
    }
    if (filterArtist) songs = songs.filter((s) => s.artist === filterArtist);
    if (filterGenre) songs = songs.filter((s) => s.genre === filterGenre);

    if (sortBy === 'title') songs.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'artist')
      songs.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
    else if (sortBy === 'recent') {
      songs.sort((a, b) => {
        const ai = recentSongs.indexOf(a.id);
        const bi = recentSongs.indexOf(b.id);
        if (ai === -1 && bi === -1) return a.title.localeCompare(b.title);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    return songs;
  }, [searchQuery, filterArtist, filterGenre, sortBy, recentSongs]);

  const grouped = useMemo(() => {
    if (sortBy === 'artist') {
      const map = new Map<string, SongMeta[]>();
      filteredSongs.forEach((s) => {
        if (!map.has(s.artist)) map.set(s.artist, []);
        map.get(s.artist)!.push(s);
      });
      return [...map.entries()];
    }
    return [['', filteredSongs]] as [string, SongMeta[]][];
  }, [filteredSongs, sortBy]);

  function openSong(song: SongMeta) {
    setActiveSong(song.id);
    addRecentSong(song.id);
    NavigationDispatcher.push({ app: 'groovex', page: 'player' });
  }

  const sortLabel =
    sortBy === 'title'
      ? t.groovex.sortAZ
      : sortBy === 'artist'
        ? t.groovex.sortArtist
        : t.groovex.sortRecent;

  const isWebDesktop = useIsWebDesktop();

  return (
    <div
      ref={scrollRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      <div
        style={{
          padding: '0 var(--page-header-inset-h, var(--page-inset-h, 24px))',
          paddingBottom: 'var(--content-bottom-pad)',
        }}
      >
        <StudioHeader
          title={t.groovex.libraryTitle}
          subtitle={t.groovex.sessionsAvailable(SONG_CATALOG.length)}
          disableHorizontalPadding={true}
          subtitleStyle={{
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
          }}
        />

        <section style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={t.groovex.searchPlaceholder}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                const idx = ['artist', 'title', 'recent'].indexOf(sortBy);
                setSortBy((['artist', 'title', 'recent'] as const)[(idx + 1) % 3]);
              }}
              className="btn-smooth"
              style={{
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                sort
              </span>
              <span>{sortLabel}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-smooth"
              style={{
                background:
                  filterArtist || filterGenre
                    ? 'rgba(37,99,235,0.15)'
                    : isLight
                      ? 'rgba(0,0,0,0.03)'
                      : 'rgba(255,255,255,0.03)',
                border:
                  filterArtist || filterGenre
                    ? '1px solid rgba(37,99,235,0.4)'
                    : isLight
                      ? '1px solid rgba(0,0,0,0.1)'
                      : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: filterArtist || filterGenre ? '#3b82f6' : 'var(--c-text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                tune
              </span>
              <span>{t.groovex.filter}</span>
            </button>
            {(filterArtist || filterGenre) && (
              <button
                onClick={() => {
                  setFilterArtist('');
                  setFilterGenre('');
                }}
                className="btn-smooth"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.groovex.clear}
              </button>
            )}
          </div>
        </section>

        {showFilters && (
          <section
            style={{
              marginBottom: 20,
              background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: 'var(--c-text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              {t.groovex.artist}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <FilterChip
                label={t.groovex.all}
                active={!filterArtist}
                onClick={() => setFilterArtist('')}
                isLight={isLight}
              />
              {artists.map((a) => (
                <FilterChip
                  key={a}
                  label={a}
                  active={filterArtist === a}
                  onClick={() => setFilterArtist(filterArtist === a ? '' : a)}
                  isLight={isLight}
                />
              ))}
            </div>
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: 'var(--c-text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              {t.groovex.genre}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <FilterChip
                label={t.groovex.all}
                active={!filterGenre}
                onClick={() => setFilterGenre('')}
                isLight={isLight}
              />
              {genres.map((g) => (
                <FilterChip
                  key={g}
                  label={g}
                  active={filterGenre === g}
                  onClick={() => setFilterGenre(filterGenre === g ? '' : g)}
                  isLight={isLight}
                />
              ))}
            </div>
          </section>
        )}

        {filteredSongs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--c-text-muted)' }}>
            <NoResultsLottie size={44} style={{ marginBottom: 6 }} />
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--c-text-primary)',
                margin: '0 0 4px',
              }}
            >
              {t.groovex.noSongsFound}
            </p>
            <p style={{ fontSize: 12, margin: 0 }}>{t.groovex.noSongsHint}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([group, songs]) => (
            <div key={group || 'all'}>
              {group && (
                <p
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: 'var(--c-text-muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px 4px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {group} <span style={{ opacity: 0.5 }}>({songs.length})</span>
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <StaggeredReveal staggerInterval={40}>
                  {songs.map((song) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      onOpen={() => openSong(song)}
                      isLight={isLight}
                    />
                  ))}
                </StaggeredReveal>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SongRow({
  song,
  onOpen,
  isLight,
}: {
  song: SongMeta;
  onOpen: () => void;
  isLight: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onOpen}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="btn-smooth"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: pressed
          ? isLight
            ? 'rgba(0,0,0,0.06)'
            : 'rgba(255,255,255,0.05)'
          : isLight
            ? 'rgba(0,0,0,0.02)'
            : 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'background 100ms ease, transform 80ms ease',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            flexShrink: 0,
            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: isLight ? 'var(--c-text-muted)' : '#a1a1aa' }}
          >
            album
          </span>
          {song.hasStems && (
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                fontSize: 11,
                color: '#3b82f6',
                background: isLight ? '#ffffff' : '#000000',
                borderRadius: 9999,
                padding: 1,
              }}
            >
              cloud_done
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--c-text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {song.title}
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'var(--c-text-secondary)',
              margin: '2px 0 0',
              fontFamily: 'var(--font-body)',
            }}
          >
            {song.artist}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {song.stems.slice(0, 3).map((s) => (
            <span
              key={s.name}
              style={{
                padding: '2px 6px',
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                borderRadius: 4,
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                fontSize: 8,
                fontFamily: 'var(--font-body)',
                color: isLight ? 'var(--c-text-secondary)' : '#a1a1aa',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {s.name.slice(0, 3)}
            </span>
          ))}
          {song.stems.length > 3 && (
            <span
              style={{
                padding: '2px 6px',
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                borderRadius: 4,
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                fontSize: 8,
                fontFamily: 'var(--font-body)',
                color: isLight ? 'var(--c-text-secondary)' : '#a1a1aa',
                fontWeight: 700,
              }}
            >
              +{song.stems.length - 3}
            </span>
          )}
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: isLight ? 'var(--c-text-muted)' : '#71717a', opacity: 0.5 }}
        >
          chevron_right
        </span>
      </div>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  isLight,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  isLight: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-smooth"
      style={{
        padding: '5px 12px',
        borderRadius: 8,
        background: active
          ? 'rgba(37,99,235,0.15)'
          : isLight
            ? 'rgba(0,0,0,0.03)'
            : 'rgba(255,255,255,0.03)',
        color: active ? '#3b82f6' : isLight ? 'var(--c-text-secondary)' : '#a1a1aa',
        border: active
          ? '1px solid rgba(37,99,235,0.4)'
          : isLight
            ? '1px solid rgba(0,0,0,0.06)'
            : '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
        transition: 'all 120ms ease',
      }}
    >
      {label}
    </button>
  );
}
