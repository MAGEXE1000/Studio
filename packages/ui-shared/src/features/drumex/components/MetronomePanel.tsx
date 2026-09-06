import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  useMetronomeStore,
  SOUND_LABELS,
  useBackHandler,
  type MetronomeTimeSignature,
  type MetronomeSubdivision,
  type MetronomeSoundId,
  type MetronomePreset,
} from '@workspace/studio-core';

interface MetronomePanelProps {
  onBack?: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function MetronomePanel({ onBack, onScroll }: MetronomePanelProps) {
  const {
    bpm,
    timeSignature,
    subdivision,
    sound,
    accentBeat,
    volume,
    isMuted,
    countInEnabled,
    isPlaying,
    activeBeat,
    activeSubdivision,
    userPresets,
    factoryPresets,
    presets,
    activePresetId,
    practiceTimerActive,
    practiceTimerMinutes,
    practiceSecondsRemaining,
    setBpm,
    adjustBpm,
    setTimeSignature,
    setSubdivision,
    setSound,
    setAccentBeat,
    setVolume,
    toggleMute,
    toggleCountIn,
    togglePlay,
    tapTempo,
    loadPreset,
    saveNewPreset,
    updateCurrentPreset,
    duplicatePreset,
    deletePreset,
    togglePracticeTimer,
  } = useMetronomeStore();

  // Local UI state
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [activePresetMenuId, setActivePresetMenuId] = useState<string | null>(null);

  const newPresetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewPresetForm && newPresetInputRef.current) {
      newPresetInputRef.current.focus();
    }
  }, [showNewPresetForm]);

  useBackHandler(
    'overlay',
    () => {
      if (isPresetsOpen) {
        setIsPresetsOpen(false);
        return true;
      }
      if (showSoundMenu) {
        setShowSoundMenu(false);
        return true;
      }
      return false;
    },
    [isPresetsOpen, showSoundMenu]
  );

  // Tempo descriptor
  const { tempoDescriptor, tempoTag } = useMemo(() => {
    if (bpm < 60) return { tempoDescriptor: 'Largo / Grave', tempoTag: '• Slow & Solemn' };
    if (bpm < 80) return { tempoDescriptor: 'Adagio', tempoTag: '• Leisurely Pace' };
    if (bpm < 108) return { tempoDescriptor: 'Andante', tempoTag: '• Walking Pace' };
    if (bpm < 130)
      return { tempoDescriptor: 'Moderato / Allegretto', tempoTag: '• Standard Tempo' };
    if (bpm < 168) return { tempoDescriptor: 'Allegro', tempoTag: '• Fast & Bright' };
    if (bpm < 200) return { tempoDescriptor: 'Vivace', tempoTag: '• Lively & Quick' };
    return { tempoDescriptor: 'Presto', tempoTag: '• Extremely Fast' };
  }, [bpm]);

  // Active preset
  const activePreset = useMemo(() => {
    return [...userPresets, ...factoryPresets].find((p) => p.id === activePresetId) ?? null;
  }, [userPresets, factoryPresets, activePresetId]);

  // Number of beats for the tracker strip
  const beatsCount = useMemo(() => {
    switch (timeSignature) {
      case '3/4':
        return 3;
      case '6/8':
        return 6;
      case '2/4':
        return 2;
      case '4/4':
      default:
        return 4;
    }
  }, [timeSignature]);

  // Filtered presets separated by user and factory
  const { filteredUserPresets, filteredFactoryPresets } = useMemo(() => {
    if (!presetSearch.trim()) {
      return { filteredUserPresets: userPresets, filteredFactoryPresets: factoryPresets };
    }
    const q = presetSearch.toLowerCase();
    const filterFn = (p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.timeSignature.includes(q) ||
      SOUND_LABELS[p.sound]?.toLowerCase().includes(q);
    return {
      filteredUserPresets: userPresets.filter(filterFn),
      filteredFactoryPresets: factoryPresets.filter(filterFn),
    };
  }, [userPresets, factoryPresets, presetSearch]);

  const handleCreatePreset = () => {
    const name = newPresetName.trim() || 'My Custom Groove';
    saveNewPreset(name);
    setNewPresetName('');
    setShowNewPresetForm(false);
  };

  const formatTimerTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fb] dark:bg-[#000000] text-[#0e0e0e] dark:text-white font-sans antialiased select-none relative overflow-hidden">
      <style>{`
        /* Custom Range Slider */
        .metronome-range {
          -webkit-appearance: none;
          background: transparent;
        }
        .metronome-range:focus {
          outline: none;
        }
        .metronome-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #007aff;
          box-shadow: 0 3px 10px rgba(0, 122, 255, 0.4);
          cursor: pointer;
          margin-top: -8px;
          border: 2.5px solid #ffffff;
          transition: transform 0.1s ease;
        }
        .metronome-range::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        .metronome-range::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .dark .metronome-range::-webkit-slider-runnable-track {
          background: #27272a;
        }
        .tap-press:active {
          transform: scale(0.96);
        }
        .tap-press {
          transition: transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 122, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
          }
        }
        .pulse-active {
          animation: pulse-ring 0.6s infinite cubic-bezier(0.2, 0, 0.4, 1);
        }
      `}</style>

      {/* ── Top Navigation Header ────────────────────────────────────────── */}
      <header
        className="px-4 pb-2 flex-shrink-0"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        }}
      >
        <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between relative">
          <button
            aria-label="Go back"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition tap-press focus:outline-none z-10 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-zinc-100 font-manrope leading-none">
              METRONOME
            </span>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium tracking-tight mt-0.5 leading-none">
              {activePreset ? activePreset.name : SOUND_LABELS[sound]} • {timeSignature}
            </p>
          </div>
          <div aria-hidden="true" className="w-8 h-8 pointer-events-none" />
        </div>
      </header>

      {/* ── Main Live Performance Scroll Area ────────────────────────────── */}
      <main
        onScroll={onScroll}
        className="flex-1 px-4 flex flex-col gap-3.5 pt-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(max(16px, env(safe-area-inset-bottom, 16px)) + 68px)',
        }}
      >
        {/* 1. BEAT TRACKER STRIP */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-slate-200/80 dark:border-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase font-manrope">
              BEAT TRACKER • {timeSignature}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400">
                Accent Beat {accentBeat + 1}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#007aff]" />
            </div>
          </div>

          {/* Visual Pulsing Cells */}
          <div
            className={`grid gap-2 py-1 ${
              beatsCount === 6
                ? 'grid-cols-6'
                : beatsCount === 3
                  ? 'grid-cols-3'
                  : beatsCount === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-4'
            }`}
          >
            {Array.from({ length: beatsCount }).map((_, idx) => {
              const isCurrent = isPlaying && activeBeat === idx;
              const isAccentBeat = accentBeat === idx;

              if (isCurrent) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAccentBeat(idx)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center font-manrope font-extrabold relative overflow-hidden pulse-active cursor-pointer ${
                      isAccentBeat
                        ? 'bg-[#007aff] text-white shadow-[0_4px_14px_rgba(0,122,255,0.35)]'
                        : 'bg-blue-500 text-white shadow-[0_4px_14px_rgba(0,122,255,0.25)]'
                    }`}
                  >
                    <span className="text-lg leading-none">{idx + 1}</span>
                    <span className="text-[8px] font-bold tracking-widest uppercase opacity-90">
                      {isAccentBeat ? 'ACCENT' : 'NORMAL'}
                    </span>
                    {isAccentBeat && (
                      <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAccentBeat(idx)}
                  className={`h-12 rounded-xl border flex flex-col items-center justify-center font-manrope font-bold transition cursor-pointer relative ${
                    isAccentBeat
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 text-[#007aff] border-[#007aff]/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/40'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-lg leading-none">{idx + 1}</span>
                  <span
                    className={`text-[8px] ${
                      isAccentBeat
                        ? 'font-bold text-[#007aff]'
                        : 'font-medium text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {isAccentBeat ? 'ACCENT' : 'NORMAL'}
                  </span>
                  {isAccentBeat && (
                    <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#007aff]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Subdivision Visual Dots */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500">
              Subdivisions
            </span>
            <div className="flex items-center gap-1.5">
              {subdivision === '1/16' ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 0
                        ? 'bg-[#007aff]'
                        : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 1
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 2
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 3
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                    1 e &amp; a
                  </span>
                </>
              ) : subdivision === '3let' ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 0
                        ? 'bg-[#007aff]'
                        : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 1
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 2
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                    1 trip let
                  </span>
                </>
              ) : subdivision === '1/8' ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 0
                        ? 'bg-[#007aff]'
                        : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPlaying && activeSubdivision === 1
                        ? 'bg-blue-400'
                        : 'bg-slate-200 dark:bg-zinc-700'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                    1 &amp;
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isPlaying ? 'bg-[#007aff]' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  />
                  <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                    1
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 2. GIANT BPM DISPLAY & CONTROLS */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-[0_8px_28px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden">
          {/* Tempo Description */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/70 dark:border-zinc-700">
              {tempoDescriptor}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
              {tempoTag}
            </span>
          </div>

          {/* Steppers & Giant BPM */}
          <div className="w-full flex items-center justify-between my-2 px-1">
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Decrease BPM by 5"
                onClick={() => adjustBpm(-5)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-manrope font-bold text-xs flex items-center justify-center border border-slate-200/70 dark:border-zinc-700 tap-press cursor-pointer"
                type="button"
              >
                -5
              </button>
              <button
                aria-label="Decrease BPM by 1"
                onClick={() => adjustBpm(-1)}
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 flex items-center justify-center shadow-xs border border-slate-200 dark:border-zinc-700 tap-press cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
            </div>

            <div className="flex flex-col items-center cursor-pointer select-none">
              <span className="text-6xl sm:text-7xl font-extrabold font-manrope tracking-tighter text-[#0e0e0e] dark:text-zinc-100 leading-none">
                {bpm}
              </span>
              <span className="text-[11px] font-extrabold tracking-widest text-[#007aff] uppercase font-manrope mt-1">
                BPM
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Increase BPM by 1"
                onClick={() => adjustBpm(1)}
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 flex items-center justify-center shadow-xs border border-slate-200 dark:border-zinc-700 tap-press cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
              <button
                aria-label="Increase BPM by 5"
                onClick={() => adjustBpm(5)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-manrope font-bold text-xs flex items-center justify-center border border-slate-200/70 dark:border-zinc-700 tap-press cursor-pointer"
                type="button"
              >
                +5
              </button>
            </div>
          </div>

          {/* Precision Slider */}
          <div className="w-full mt-2 px-1">
            <input
              type="range"
              min={40}
              max={280}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="metronome-range w-full h-2 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 px-0.5 font-mono">
              <span>40 LARGO</span>
              <span>120 MODERATO</span>
              <span>280 PRESTO</span>
            </div>
          </div>

          {/* Tap Tempo Button */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-center gap-3">
            <button
              aria-label="Tap Tempo"
              onClick={tapTempo}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/90 dark:border-zinc-700 flex items-center justify-center gap-2 text-slate-800 dark:text-zinc-200 font-manrope font-bold text-xs tracking-tight shadow-xs tap-press cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-[#007aff]">
                touch_app
              </span>
              TAP TEMPO{' '}
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                (Tap 4 times)
              </span>
            </button>
          </div>
        </section>

        {/* 3. RHYTHM METRICS (Segmented Pills) */}
        <section className="grid grid-cols-2 gap-2.5">
          {/* Time Signature */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase font-manrope tracking-wider">
                TIME SIGNATURE
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-zinc-500">
                straighten
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['4/4', '3/4', '6/8', '2/4'] as MetronomeTimeSignature[]).map((sig) => {
                const isSelected = timeSignature === sig;
                return (
                  <button
                    key={sig}
                    onClick={() => setTimeSignature(sig)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold font-manrope tap-press cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#007aff] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {sig}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subdivision */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase font-manrope tracking-wider">
                SUBDIVISION
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-zinc-500">
                music_note
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['1/4', '1/8', '1/16', '3let'] as MetronomeSubdivision[]).map((sub) => {
                const isSelected = subdivision === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setSubdivision(sub)}
                    className={`py-1.5 rounded-lg text-[11px] font-extrabold font-manrope tap-press cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#007aff] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. AUDIO CONTROLS & COUNT-IN ROW */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col gap-3 relative">
          <div className="flex items-center justify-between">
            {/* Click Sound Selector */}
            <div className="flex items-center gap-2 relative">
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#007aff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
              </div>
              <div className="cursor-pointer" onClick={() => setShowSoundMenu(!showSoundMenu)}>
                <div className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase font-manrope">
                  CLICK SOUND
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {SOUND_LABELS[sound]}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Sound Dropdown Popover */}
              {showSoundMenu && (
                <div className="absolute top-10 left-0 z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-1 min-w-[170px] flex flex-col gap-0.5">
                  {(Object.keys(SOUND_LABELS) as MetronomeSoundId[]).map((sId) => (
                    <button
                      key={sId}
                      onClick={() => {
                        setSound(sId);
                        setShowSoundMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        sound === sId
                          ? 'bg-[#007aff] text-white'
                          : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{SOUND_LABELS[sId]}</span>
                      {sound === sId && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Count-in Toggle & Bars */}
            <div
              onClick={toggleCountIn}
              className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 rounded-xl px-2.5 py-1 cursor-pointer tap-press"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-zinc-400">
                timelapse
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 leading-none uppercase">
                  Count-In
                </span>
                <span className="text-[11px] font-extrabold text-[#007aff] leading-none mt-0.5">
                  1 Bar (4 beats)
                </span>
              </div>
              <button
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ml-0.5 transition-colors ${
                  countInEnabled
                    ? 'bg-[#007aff] text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-transparent'
                }`}
                type="button"
              >
                ✓
              </button>
            </div>
          </div>

          {/* Volume Slider & Mute */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition cursor-pointer"
              title="Mute/Unmute"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="metronome-range w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 w-8 text-right">
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </section>
      </main>

      {/* ── COMPACT FLOATING QUICK CONTROLS DOCK ──────────────────────────── */}
      <div
        className="fixed inset-x-0 flex justify-center items-center pointer-events-none z-40"
        style={{
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <aside
          aria-label="Metronome quick controls"
          className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-200/80 dark:border-zinc-800 flex items-center gap-2"
        >
          {/* Mute Toggle */}
          <button
            aria-label="Mute or Sound Toggle"
            onClick={toggleMute}
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition tap-press focus:outline-none cursor-pointer ${
              isMuted
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
            }`}
            title="Sound"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>

          {/* Practice Timer */}
          <button
            aria-label="Practice Timer"
            onClick={togglePracticeTimer}
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition tap-press focus:outline-none cursor-pointer relative ${
              practiceTimerActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007aff]'
                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
            }`}
            title={
              practiceTimerActive
                ? `Timer: ${formatTimerTime(practiceSecondsRemaining)}`
                : 'Practice Timer'
            }
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">timer</span>
            {practiceTimerActive && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-[#007aff] text-white text-[8px] font-bold rounded-full">
                {Math.ceil(practiceSecondsRemaining / 60)}m
              </span>
            )}
          </button>

          {/* Presets Bottom Sheet Trigger */}
          <button
            aria-label="Presets"
            onClick={() => setIsPresetsOpen(true)}
            className="w-[38px] h-[38px] rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition tap-press focus:outline-none relative cursor-pointer"
            title="Presets"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">bookmark</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#007aff] ring-2 ring-white dark:ring-zinc-900" />
          </button>

          {/* Start/Stop FAB */}
          <button
            aria-label="Start or Stop Metronome"
            onClick={togglePlay}
            className={`w-[44px] h-[44px] rounded-full text-white shadow-md flex items-center justify-center transition tap-press focus:outline-none ml-0.5 cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 active:scale-95'
                : 'bg-[#007aff] hover:bg-blue-600 shadow-blue-500/25 active:scale-95'
            }`}
            title={isPlaying ? 'Stop' : 'Start'}
            type="button"
          >
            <span className={`material-symbols-outlined text-[24px] ${isPlaying ? '' : 'ml-0.5'}`}>
              {isPlaying ? 'stop' : 'play_arrow'}
            </span>
          </button>
        </aside>
      </div>

      {/* ── PRESETS BOTTOM SHEET MODAL ────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out ${
          isPresetsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dimmed backdrop */}
        <div
          onClick={() => setIsPresetsOpen(false)}
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Sheet container */}
        <div
          className={`absolute inset-x-0 bottom-0 max-w-md mx-auto transform transition-transform duration-300 ease-out flex flex-col max-h-[88vh] bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.18)] border-t border-x border-slate-200/90 dark:border-zinc-800 overflow-hidden ${
            isPresetsOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          }}
        >
          {/* Drag pill handle */}
          <div className="pt-3 pb-1 flex justify-center items-center cursor-grab">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
          </div>

          {/* Modal Header */}
          <div className="px-5 pt-1.5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold font-manrope text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
                  Metronome Presets
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-[#007aff] border border-blue-100 dark:border-blue-900">
                  {userPresets.length} saved
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                Quickly recall tempo, signature &amp; sound
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {/* New Preset Button */}
              <button
                onClick={() => setShowNewPresetForm(!showNewPresetForm)}
                className="h-8 px-3 rounded-full bg-[#007aff] hover:bg-blue-600 text-white text-xs font-extrabold font-manrope flex items-center gap-1 shadow-sm shadow-blue-500/20 tap-press focus:outline-none cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">add</span>
                <span>New</span>
              </button>
              {/* Close Button */}
              <button
                aria-label="Close presets"
                onClick={() => setIsPresetsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition tap-press focus:outline-none cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Collapsible New Preset Box */}
          {showNewPresetForm && (
            <div className="bg-slate-50/90 dark:bg-zinc-800/80 border-b border-slate-200/80 dark:border-zinc-700 px-5 py-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold font-manrope uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Save Current Settings
                </span>
                <button
                  onClick={() => setShowNewPresetForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-semibold cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
              </div>
              <input
                ref={newPresetInputRef}
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePreset();
                }}
                placeholder="e.g., Fast Paradiddle Drill"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl font-medium text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-[#007aff]"
                type="text"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-zinc-700 font-mono">
                <span>
                  Tempo: <b className="text-[#007aff]">{bpm} BPM</b>
                </span>
                <span>
                  Sig: <b className="text-slate-700 dark:text-zinc-200">{timeSignature}</b>
                </span>
                <span>
                  Sub: <b className="text-slate-700 dark:text-zinc-200">{subdivision}</b>
                </span>
              </div>
              <button
                onClick={handleCreatePreset}
                className="w-full py-2 bg-[#007aff] text-white font-manrope font-bold text-xs rounded-xl shadow-xs tap-press hover:bg-blue-600 transition cursor-pointer"
                type="button"
              >
                Save Preset
              </button>
            </div>
          )}

          {/* Search / Filter bar */}
          <div className="px-5 pt-3 pb-1">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 pointer-events-none">
                search
              </span>
              <input
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                placeholder="Search presets..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/60 focus:bg-white dark:focus:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 transition focus:outline-none focus:border-[#007aff]"
                type="text"
              />
            </div>
          </div>

          {/* Presets List */}
          <div className="flex-1 overflow-y-auto px-5 py-2.5 flex flex-col gap-4 no-scrollbar pb-8">
            {/* 1. SAVED USER PRESETS SECTION */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-manrope">
                  My Saved Presets ({filteredUserPresets.length})
                </span>
              </div>

              {filteredUserPresets.length === 0 ? (
                <div className="py-6 px-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-dashed border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[24px] text-slate-400 dark:text-zinc-500">
                    bookmark_border
                  </span>
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    No saved presets yet
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs">
                    Save current tempo and rhythmic settings with &quot;+ New&quot; to build your
                    library.
                  </p>
                </div>
              ) : (
                filteredUserPresets.map((p) => {
                  const isCurrent = activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        loadPreset(p.id);
                        setTimeout(() => setIsPresetsOpen(false), 220);
                      }}
                      className={`relative p-3 rounded-2xl flex items-center justify-between transition tap-press cursor-pointer ${
                        isCurrent
                          ? 'bg-white dark:bg-zinc-900 border-2 border-[#007aff] shadow-[0_4px_16px_rgba(0,122,255,0.08)]'
                          : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-manrope font-extrabold text-sm border flex-shrink-0 ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007aff] border-blue-100 dark:border-blue-900'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {p.icon || 'bookmark'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-extrabold font-manrope text-slate-900 dark:text-zinc-100 leading-tight">
                              {p.name}
                            </h3>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#007aff] text-[9px] font-extrabold uppercase tracking-wide">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-bold text-slate-700 dark:text-zinc-200">
                              {p.timeSignature}
                            </span>
                            <span>•</span>
                            <span>{p.subdivision} Note</span>
                            <span>•</span>
                            <span className="truncate max-w-[90px]">{SOUND_LABELS[p.sound]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-lg font-manrope text-xs ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007aff] font-extrabold'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold'
                          }`}
                        >
                          {p.bpm} <span className="text-[9px]">BPM</span>
                        </span>
                        <div className="relative">
                          <button
                            aria-label="Preset options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePresetMenuId(activePresetMenuId === p.id ? null : p.id);
                            }}
                            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">more_vert</span>
                          </button>

                          {/* Options menu popover */}
                          {activePresetMenuId === p.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 min-w-[130px] flex flex-col"
                            >
                              <button
                                onClick={() => {
                                  updateCurrentPreset();
                                  setActivePresetMenuId(null);
                                }}
                                className="px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                              >
                                Update with current
                              </button>
                              <button
                                onClick={() => {
                                  duplicatePreset(p.id);
                                  setActivePresetMenuId(null);
                                }}
                                className="px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  deletePreset(p.id);
                                  setActivePresetMenuId(null);
                                }}
                                className="px-3 py-1.5 text-left text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. FACTORY PRESETS SECTION */}
            {filteredFactoryPresets.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-manrope">
                    Factory Presets ({filteredFactoryPresets.length})
                  </span>
                </div>

                {filteredFactoryPresets.map((p) => {
                  const isCurrent = activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        loadPreset(p.id);
                        setTimeout(() => setIsPresetsOpen(false), 220);
                      }}
                      className={`relative p-3 rounded-2xl flex items-center justify-between transition tap-press cursor-pointer ${
                        isCurrent
                          ? 'bg-white dark:bg-zinc-900 border-2 border-[#007aff] shadow-[0_4px_16px_rgba(0,122,255,0.08)]'
                          : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-manrope font-extrabold text-sm border flex-shrink-0 ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007aff] border-blue-100 dark:border-blue-900'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {p.icon || 'bookmark'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-extrabold font-manrope text-slate-900 dark:text-zinc-100 leading-tight">
                              {p.name}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-wide">
                              Factory
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#007aff] text-[9px] font-extrabold uppercase tracking-wide">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-bold text-slate-700 dark:text-zinc-200">
                              {p.timeSignature}
                            </span>
                            <span>•</span>
                            <span>{p.subdivision} Note</span>
                            <span>•</span>
                            <span className="truncate max-w-[90px]">{SOUND_LABELS[p.sound]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-lg font-manrope text-xs ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-[#007aff] font-extrabold'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold'
                          }`}
                        >
                          {p.bpm} <span className="text-[9px]">BPM</span>
                        </span>
                        <div className="relative">
                          <button
                            aria-label="Preset options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePresetMenuId(activePresetMenuId === p.id ? null : p.id);
                            }}
                            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">more_vert</span>
                          </button>

                          {/* Options menu popover for factory presets */}
                          {activePresetMenuId === p.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 min-w-[130px] flex flex-col"
                            >
                              <button
                                onClick={() => {
                                  loadPreset(p.id);
                                  setActivePresetMenuId(null);
                                  setIsPresetsOpen(false);
                                }}
                                className="px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => {
                                  duplicatePreset(p.id);
                                  setActivePresetMenuId(null);
                                }}
                                className="px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                              >
                                Duplicate to saved
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetronomePanel;
