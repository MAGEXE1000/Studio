import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
import { StageSetupStatsStrip } from './StageSetupStatsStrip';
import { StageSetupEmptyState } from './StageSetupEmptyState';
import { useSettingsStore } from '@workspace/studio-core';

interface StageSetlistViewProps {
  onBack: () => void;
  isLight?: boolean;
}

export const StageSetlistView: React.FC<StageSetlistViewProps> = ({
  onBack,
  isLight: isLightProp,
}) => {
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.stagex;
  const isLight =
    isLightProp !== undefined ? isLightProp : activeVis ? activeVis.theme === 'light' : false;

  const { setlist, addSong, removeSong, reorderSongs } = useStagexStore();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [duration, setDuration] = useState('3:30');
  const [energy, setEnergy] = useState('75');

  // Compute stats
  const totalDuration = useMemo(() => {
    let totalSecs = 0;
    for (const song of setlist) {
      if (!song.duration) continue;
      const parts = song.duration.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        totalSecs += parts[0] * 60 + parts[1];
      }
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [setlist]);

  const avgEnergy = useMemo(() => {
    if (!setlist.length) return 0;
    const total = setlist.reduce((acc, s) => acc + (s.energy || 50), 0);
    return Math.round(total / setlist.length);
  }, [setlist]);

  const tempoRange = useMemo(() => {
    const bpms = setlist
      .map((s) => s.bpm)
      .filter((b): b is number => typeof b === 'number' && !isNaN(b));
    if (!bpms.length) return '—';
    const min = Math.min(...bpms);
    const max = Math.max(...bpms);
    return min === max ? `${min} BPM` : `${min} - ${max} BPM`;
  }, [setlist]);

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addSong({
      title: title.trim(),
      artist: artist.trim() || undefined,
      key: songKey.trim() || undefined,
      bpm: bpm ? parseInt(bpm, 10) : undefined,
      duration: duration.trim() || '3:30',
      energy: energy ? parseInt(energy, 10) : 75,
    });
    setTitle('');
    setArtist('');
    setSongKey('');
    setBpm('');
    setDuration('3:30');
    setEnergy('75');
    setIsAdding(false);
  };

  const statItems = [
    {
      label: 'Total Songs',
      value: setlist.length,
      accentColor: isLight ? '#09090b' : '#ffffff',
    },
    {
      label: 'Set Duration',
      value: totalDuration,
      accentColor: '#c084fc',
    },
    {
      label: 'Avg Energy',
      value: setlist.length > 0 ? `${avgEnergy}/100` : '—',
      accentColor: '#f59e0b',
    },
    {
      label: 'Tempo Flow',
      value: tempoRange,
      accentColor: '#38bdf8',
    },
  ];

  return (
    <StageSetupDetailLayout
      title="Setlist"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-sm"
          style={{
            backgroundColor: isAdding
              ? '#a855f7'
              : isLight
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isAdding
              ? '#a855f7'
              : isLight
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.08)',
            color: isAdding ? '#ffffff' : isLight ? '#09090b' : '#ffffff',
          }}
          title={isAdding ? 'Cancel' : 'Add Song'}
          aria-label={isAdding ? 'Cancel' : 'Add Song'}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform duration-200"
            style={{ transform: isAdding ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            add
          </span>
        </button>
      }
    >
      {/* Compact Statistics Summary Strip */}
      <StageSetupStatsStrip items={statItems} isLight={isLight} />

      {/* Main Setlist Card */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--c-bg-card, #0e0e12)',
          borderColor: isLight
            ? 'rgba(0, 0, 0, 0.08)'
            : 'var(--c-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="material-symbols-outlined text-[17px]" style={{ color: '#a855f7' }}>
                format_list_numbered
              </span>
            </div>
            <div>
              <h3
                className="text-[14px] font-bold tracking-tight"
                style={{
                  color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Song Order & Cues
              </h3>
              <p
                className="text-[11.5px]"
                style={{ color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa' }}
              >
                Order songs, monitor keys, and track performance timing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{
              backgroundColor: isAdding
                ? isLight
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.12)'
                : isLight
                  ? '#09090b'
                  : '#ffffff',
              color: isAdding ? (isLight ? '#09090b' : '#ffffff') : isLight ? '#ffffff' : '#09090b',
            }}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isAdding ? 'close' : 'add'}
            </span>
            <span>{isAdding ? 'Cancel' : 'Add Song'}</span>
          </button>
        </div>

        {/* Expandable Inline Add Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddSong}
              className="p-4 rounded-[16px] border mb-4 overflow-hidden flex flex-col gap-3"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Song Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                  autoFocus
                  required
                />
                <input
                  type="text"
                  placeholder="Artist / Composer (optional)"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#09090b' : '#ffffff',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                  >
                    Musical Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Am, G, Dm"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#09090b' : '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                  >
                    BPM Tempo
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#09090b' : '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                  >
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3:45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#09090b' : '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                  >
                    Energy (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 75"
                    value={energy}
                    onChange={(e) => setEnergy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#09090b' : '#ffffff',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!title.trim()}
                className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#09090b' : '#ffffff',
                  color: isLight ? '#ffffff' : '#09090b',
                }}
              >
                Add to Setlist
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Song List */}
        <div className="flex flex-col gap-2">
          {setlist.length === 0 ? (
            <StageSetupEmptyState
              icon="queue_music"
              title="No songs in setlist"
              description="Add songs, assign keys and tempos, and map your performance flow"
              actionLabel="Add First Song"
              onAction={() => setIsAdding(true)}
              iconColor="#a855f7"
              isLight={isLight}
            />
          ) : (
            setlist.map((song, idx) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 rounded-[14px] border transition-all"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span
                    className="text-xs font-mono font-bold w-5 text-right shrink-0"
                    style={{ color: isLight ? '#71717a' : '#71717a' }}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p
                        className="text-xs font-bold truncate"
                        style={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                      >
                        {song.title}
                      </p>
                      {song.key && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-bold"
                          style={{
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                          }}
                        >
                          {song.key}
                        </span>
                      )}
                      {song.bpm && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-bold"
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                          }}
                        >
                          {song.bpm} BPM
                        </span>
                      )}
                    </div>
                    {song.artist && (
                      <p
                        className="text-[11px] truncate mt-0.5"
                        style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                      >
                        {song.artist}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[11px] font-mono mr-1"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                  >
                    {song.duration}
                  </span>

                  <button
                    type="button"
                    onClick={() => reorderSongs(idx, idx - 1)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                    title="Move Up"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => reorderSongs(idx, idx + 1)}
                    disabled={idx === setlist.length - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ color: isLight ? '#71717a' : '#a1a1aa' }}
                    title="Move Down"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeSong(song.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    style={{ color: isLight ? '#a1a1aa' : '#71717a' }}
                    title="Delete Song"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StageSetupDetailLayout>
  );
};
