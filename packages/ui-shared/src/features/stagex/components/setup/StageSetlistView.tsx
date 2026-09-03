import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore } from '../../state/useStagexStore';
import { StageSetupDetailLayout } from './StageSetupDetailLayout';
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
    if (!setlist.length) return null;
    const total = setlist.reduce((acc, s) => acc + (s.energy || 50), 0);
    return Math.round(total / setlist.length);
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

  const cardBg = isLight ? '#ffffff' : 'var(--c-bg-card, #0d0d11)';
  const cardBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'var(--c-border, rgba(255, 255, 255, 0.08))';
  const textPrimary = isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff';
  const textSecondary = isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa';

  return (
    <StageSetupDetailLayout
      title="Setlist"
      onBack={onBack}
      isLight={isLight}
      toolbarActions={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{
              backgroundColor: isAdding
                ? '#a855f7'
                : isLight
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.06)',
              borderColor: isAdding
                ? '#a855f7'
                : isLight
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.10)',
              color: isAdding ? '#ffffff' : textPrimary,
            }}
            title={isAdding ? 'Cancel' : 'Add Track'}
            aria-label={isAdding ? 'Cancel' : 'Add Track'}
          >
            <span
              className="material-symbols-outlined text-[15px] transition-transform duration-200"
              style={{ transform: isAdding ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              add
            </span>
            <span className="hidden min-[380px]:inline">{isAdding ? 'Cancel' : 'Add Track'}</span>
          </button>
        </div>
      }
    >
      {/* 1. Setlist Card */}
      <div
        className="p-5 rounded-[20px] border mb-4 shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        {/* Inline Add Song Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddSong}
              className="p-4 rounded-[16px] border mb-5 overflow-hidden flex flex-col gap-3"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
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
                    color: textPrimary,
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
                    color: textPrimary,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: textSecondary }}
                  >
                    Musical Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Am"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.45)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                      color: textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: textSecondary }}
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
                      color: textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: textSecondary }}
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
                      color: textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: textSecondary }}
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
                      color: textPrimary,
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

        {setlist.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div
              className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-3 border"
              style={{
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ color: '#a855f7' }}>
                queue_music
              </span>
            </div>
            <h4
              className="text-xs font-black uppercase tracking-wider mb-1"
              style={{ color: textPrimary, letterSpacing: '0.08em' }}
            >
              No Songs Yet
            </h4>
            <p
              className="text-[12px] max-w-xs leading-relaxed mb-4"
              style={{ color: textSecondary }}
            >
              Tap Add New Track to start your setlist.
            </p>

            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              style={{
                backgroundColor: isLight ? '#09090b' : '#ffffff',
                color: isLight ? '#ffffff' : '#09090b',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Add New Track</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {setlist.map((song, idx) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 rounded-[14px] border transition-all"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span
                    className="text-xs font-mono font-bold w-5 text-right shrink-0"
                    style={{ color: textSecondary }}
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
                      <p className="text-[11px] truncate mt-0.5" style={{ color: textSecondary }}>
                        {song.artist}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-mono mr-1" style={{ color: textSecondary }}>
                    {song.duration}
                  </span>

                  <button
                    type="button"
                    onClick={() => reorderSongs(idx, idx - 1)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ color: textSecondary }}
                    title="Move Up"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => reorderSongs(idx, idx + 1)}
                    disabled={idx === setlist.length - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ color: textSecondary }}
                    title="Move Down"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeSong(song.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    style={{ color: textSecondary }}
                    title="Delete Song"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider & Bottom Metrics Strip */}
        <div
          className="w-full h-px my-2"
          style={{ backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)' }}
        />

        <div className="grid grid-cols-3 pt-3 text-left">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Songs Count
            </span>
            <p
              className="text-[20px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {setlist.length}
            </p>
          </div>

          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Total Duration
            </span>
            <p
              className="text-[20px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {totalDuration}
            </p>
          </div>

          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: textSecondary }}
            >
              Avg Energy
            </span>
            <p
              className="text-[20px] font-black tracking-tight mt-0.5"
              style={{ color: textPrimary, fontFamily: 'Manrope, sans-serif' }}
            >
              {avgEnergy !== null ? `${avgEnergy}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Setlist Insights Card */}
      <div
        className="p-5 rounded-[20px] border shadow-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <h3
          className="text-[11px] font-black uppercase tracking-wider mb-3"
          style={{ color: textPrimary, letterSpacing: '0.08em' }}
        >
          Setlist Insights
        </h3>

        <div className="flex flex-col gap-2.5">
          <div
            className="flex items-center justify-between py-1 border-b"
            style={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)' }}
          >
            <span className="text-xs font-medium" style={{ color: textSecondary }}>
              Tempo Stability
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: textPrimary }}>
              —
            </span>
          </div>

          <div
            className="flex items-center justify-between py-1 border-b"
            style={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)' }}
          >
            <span className="text-xs font-medium" style={{ color: textSecondary }}>
              Key Variety
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: textPrimary }}>
              —
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium" style={{ color: textSecondary }}>
              Transition Fluidity
            </span>
            <span className="text-xs font-mono font-bold" style={{ color: textPrimary }}>
              —
            </span>
          </div>
        </div>
      </div>
    </StageSetupDetailLayout>
  );
};
