import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStagexStore, type SetlistSong } from '../../state/useStagexStore';

interface StageSetlistViewProps {
  onBack: () => void;
}

export const StageSetlistView: React.FC<StageSetlistViewProps> = ({ onBack }) => {
  const { setlist, addSong, updateSong, removeSong, reorderSongs } = useStagexStore();
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className="p-3.5 rounded-2xl border text-center"
          style={{
            backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.75))',
            borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Total Songs
          </span>
          <p className="text-xl font-extrabold text-white mt-0.5">{setlist.length}</p>
        </div>
        <div
          className="p-3.5 rounded-2xl border text-center"
          style={{
            backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.75))',
            borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Total Duration
          </span>
          <p className="text-xl font-extrabold text-purple-400 mt-0.5">{totalDuration}</p>
        </div>
        <div
          className="p-3.5 rounded-2xl border text-center"
          style={{
            backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.75))',
            borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Avg Energy
          </span>
          <p className="text-xl font-extrabold text-amber-400 mt-0.5">
            {setlist.length > 0 ? `${avgEnergy}/100` : '—'}
          </p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Song Order & Cues</h3>
          <p className="text-xs text-neutral-400">
            Reorder songs, view keys, and monitor tempo flow
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isAdding ? 'close' : 'add'}
          </span>
          {isAdding ? 'Cancel' : 'Add Song'}
        </motion.button>
      </div>

      {/* Add Song Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSong}
            className="p-4 rounded-2xl border mb-6 overflow-hidden flex flex-col gap-3"
            style={{
              backgroundColor: 'rgba(39, 39, 42, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Song Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                autoFocus
                required
              />
              <input
                type="text"
                placeholder="Artist (optional)"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Key (e.g. Am)"
                value={songKey}
                onChange={(e) => setSongKey(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="number"
                placeholder="BPM (e.g. 120)"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="text"
                placeholder="Duration (3:45)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Energy (1-100)"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs border bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim()}
              className="mt-1 self-end px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-neutral-200 disabled:opacity-40 transition-colors"
            >
              Add to Setlist
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Song List */}
      <div className="flex flex-col gap-2">
        {setlist.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-sm">No songs in setlist yet.</div>
        ) : (
          setlist.map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center justify-between p-3.5 rounded-xl border group transition-all"
              style={{
                backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.6))',
                borderColor: 'var(--c-border, rgba(255, 255, 255, 0.06))',
              }}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <span className="text-xs font-mono font-bold text-neutral-500 w-5 text-right shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{song.title}</p>
                    {song.key && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                        {song.key}
                      </span>
                    )}
                    {song.bpm && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                        {song.bpm} BPM
                      </span>
                    )}
                  </div>
                  {song.artist && (
                    <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-neutral-400 mr-2">{song.duration}</span>

                <button
                  onClick={() => reorderSongs(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 hover:bg-white/5 transition-colors"
                  title="Move Up"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_upward
                  </span>
                </button>
                <button
                  onClick={() => reorderSongs(idx, idx + 1)}
                  disabled={idx === setlist.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 hover:bg-white/5 transition-colors"
                  title="Move Down"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_downward
                  </span>
                </button>
                <button
                  onClick={() => removeSong(song.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Song"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
