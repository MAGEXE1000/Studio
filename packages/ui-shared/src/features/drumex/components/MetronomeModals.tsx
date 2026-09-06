import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  MetronomeTimeSignature,
  MetronomeSubdivision,
  MetronomeTempoRampConfig,
} from '@workspace/studio-core';

interface TimeSignatureModalProps {
  isOpen: boolean;
  value: MetronomeTimeSignature;
  onSelect: (sig: MetronomeTimeSignature) => void;
  onClose: () => void;
}

interface TimeSignatureOption {
  signature: MetronomeTimeSignature;
  name: string;
  description: string;
  beats: number;
}

const TIME_SIGNATURE_OPTIONS: TimeSignatureOption[] = [
  { signature: '2/4', name: '2/4 Duple', description: '2 beats • Simple duple meter', beats: 2 },
  { signature: '3/4', name: '3/4 Waltz', description: '3 beats • Simple triple meter', beats: 3 },
  {
    signature: '4/4',
    name: '4/4 Common',
    description: '4 beats • Standard rock/pop meter',
    beats: 4,
  },
  {
    signature: '5/4',
    name: '5/4 Asymmetric',
    description: '5 beats • Quintuple odd meter',
    beats: 5,
  },
  {
    signature: '6/8',
    name: '6/8 Compound',
    description: '6 beats • Slow shuffle / blues meter',
    beats: 6,
  },
  {
    signature: '7/8',
    name: '7/8 Complex',
    description: '7 beats • Septuple progressive meter',
    beats: 7,
  },
  {
    signature: '9/8',
    name: '9/8 Compound',
    description: '9 beats • Compound triple meter',
    beats: 9,
  },
  {
    signature: '12/8',
    name: '12/8 Blues Ballad',
    description: '12 beats • Slow 4-pulse compound meter',
    beats: 12,
  },
];

export function TimeSignatureModal({ isOpen, value, onSelect, onClose }: TimeSignatureModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Dimmed Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Centered Modern Card Surface */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-sig-modal-title"
          initial={{ scale: 0.94, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 6 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h3
                id="time-sig-modal-title"
                className="text-base font-extrabold font-manrope text-slate-900 dark:text-zinc-100 tracking-tight"
              >
                Time Signature
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Select active meter configuration
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Options Grid */}
          <div className="p-4 overflow-y-auto space-y-2 no-scrollbar">
            {TIME_SIGNATURE_OPTIONS.map((opt) => {
              const isSelected = value === opt.signature;
              return (
                <button
                  key={opt.signature}
                  type="button"
                  onClick={() => {
                    onSelect(opt.signature);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#007aff] text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-manrope font-extrabold text-sm border ${
                        isSelected
                          ? 'bg-[#007aff] text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {opt.signature}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold font-manrope leading-tight">
                        {opt.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#007aff] text-white flex items-center justify-center text-[11px] font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-manrope font-bold text-xs tracking-tight shadow-md transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface SubdivisionModalProps {
  isOpen: boolean;
  value: MetronomeSubdivision;
  onSelect: (sub: MetronomeSubdivision) => void;
  onClose: () => void;
}

interface SubdivisionOption {
  subdivision: MetronomeSubdivision;
  name: string;
  description: string;
  pulses: string;
  iconText: string;
}

const SUBDIVISION_OPTIONS: SubdivisionOption[] = [
  {
    subdivision: '1/4',
    name: 'Quarter Note',
    description: '1 pulse per beat • Steady primary pulse',
    pulses: '1 pulse',
    iconText: '1/4',
  },
  {
    subdivision: '1/8',
    name: 'Eighth Notes',
    description: '2 pulses per beat • Duple subdivision (1 &)',
    pulses: '2 pulses',
    iconText: '1/8',
  },
  {
    subdivision: '1/16',
    name: 'Sixteenth Notes',
    description: '4 pulses per beat • Quadruple (1 e & a)',
    pulses: '4 pulses',
    iconText: '1/16',
  },
  {
    subdivision: '1/32',
    name: 'Thirty-Second Notes',
    description: '8 pulses per beat • Rapid high-density subdivision',
    pulses: '8 pulses',
    iconText: '1/32',
  },
  {
    subdivision: '3let',
    name: 'Eighth Triplets',
    description: '3 pulses per beat • Swing / triplet feel',
    pulses: '3 pulses',
    iconText: '3let',
  },
  {
    subdivision: '6let',
    name: 'Sixteenth Sextuplets',
    description: '6 pulses per beat • Double-time triplet subdivision',
    pulses: '6 pulses',
    iconText: '6let',
  },
];

export function SubdivisionModal({ isOpen, value, onSelect, onClose }: SubdivisionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Dimmed Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Centered Modern Card Surface */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="subdivision-modal-title"
          initial={{ scale: 0.94, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 6 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h3
                id="subdivision-modal-title"
                className="text-base font-extrabold font-manrope text-slate-900 dark:text-zinc-100 tracking-tight"
              >
                Subdivisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Select pulse density per metronome beat
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Options Grid */}
          <div className="p-4 overflow-y-auto space-y-2 no-scrollbar">
            {SUBDIVISION_OPTIONS.map((opt) => {
              const isSelected = value === opt.subdivision;
              return (
                <button
                  key={opt.subdivision}
                  type="button"
                  onClick={() => {
                    onSelect(opt.subdivision);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#007aff] text-slate-900 dark:text-zinc-100 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-manrope font-extrabold text-xs border ${
                        isSelected
                          ? 'bg-[#007aff] text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {opt.iconText}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold font-manrope leading-tight">
                        {opt.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#007aff] text-white flex items-center justify-center text-[11px] font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-manrope font-bold text-xs tracking-tight shadow-md transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export interface TempoRampModalProps {
  isOpen: boolean;
  config: MetronomeTempoRampConfig;
  currentBpm: number;
  onSave: (config: MetronomeTempoRampConfig) => void;
  onClose: () => void;
}

function formatDurationLabel(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function TempoRampModal({
  isOpen,
  config,
  currentBpm,
  onSave,
  onClose,
}: TempoRampModalProps) {
  const [enabled, setEnabled] = React.useState(config.enabled);
  const [startBpm, setStartBpm] = React.useState(config.startBpm || currentBpm);
  const [targetBpm, setTargetBpm] = React.useState(
    config.targetBpm || Math.min(280, currentBpm + 20)
  );
  const [startDelaySec, setStartDelaySec] = React.useState(config.startDelaySec ?? 0);
  const [durationSec, setDurationSec] = React.useState(config.durationSec ?? 120);
  const [holdFinalBpm, setHoldFinalBpm] = React.useState(config.holdFinalBpm ?? true);

  React.useEffect(() => {
    if (isOpen) {
      setEnabled(config.enabled);
      setStartBpm(config.startBpm || currentBpm);
      setTargetBpm(config.targetBpm || Math.min(280, currentBpm + 20));
      setStartDelaySec(config.startDelaySec ?? 0);
      setDurationSec(config.durationSec ?? 120);
      setHoldFinalBpm(config.holdFinalBpm ?? true);
    }
  }, [isOpen, config, currentBpm]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      enabled,
      startBpm: Math.max(40, Math.min(280, Math.round(startBpm))),
      targetBpm: Math.max(40, Math.min(280, Math.round(targetBpm))),
      startDelaySec: Math.max(0, Math.round(startDelaySec)),
      durationSec: Math.max(5, Math.round(durationSec)),
      holdFinalBpm,
    });
    onClose();
  };

  const DELAY_PRESETS = [0, 15, 30, 60, 120];
  const DURATION_PRESETS = [30, 60, 120, 180, 300];

  const tempoDirectionText =
    startBpm < targetBpm
      ? 'Accelerates'
      : startBpm > targetBpm
        ? 'Decelerates'
        : 'Maintains tempo at';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Dimmed Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Centered Modern Card Surface */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tempo-ramp-modal-title"
          initial={{ scale: 0.94, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 6 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h3
                id="tempo-ramp-modal-title"
                className="text-base font-extrabold font-manrope text-slate-900 dark:text-zinc-100 tracking-tight"
              >
                Incremental Tempo
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Ramp tempo over practice time
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto space-y-4 no-scrollbar">
            {/* Enable Toggle Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold font-manrope text-slate-900 dark:text-zinc-100">
                  Enable Progression
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {enabled ? 'Active during playback' : 'Metronome plays at steady BPM'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer flex items-center px-0.5 ${
                  enabled ? 'bg-[#007aff]' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <motion.div
                  animate={{ x: enabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-6 h-6 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>

            {/* Start & Target BPM */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Start BPM */}
              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Start BPM
                </span>
                <div className="flex items-center gap-1.5 my-1">
                  <button
                    type="button"
                    onClick={() => setStartBpm((v) => Math.max(40, v - 5))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-zinc-600 active:scale-95 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-slate-900 dark:text-zinc-100 min-w-[48px] text-center">
                    {startBpm}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStartBpm((v) => Math.min(280, v + 5))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-zinc-600 active:scale-95 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStartBpm(currentBpm)}
                  className="text-[10px] font-semibold text-[#007aff] hover:underline mt-1 cursor-pointer"
                >
                  Set to {currentBpm}
                </button>
              </div>

              {/* Target BPM */}
              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Target BPM
                </span>
                <div className="flex items-center gap-1.5 my-1">
                  <button
                    type="button"
                    onClick={() => setTargetBpm((v) => Math.max(40, v - 5))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-zinc-600 active:scale-95 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-slate-900 dark:text-zinc-100 min-w-[48px] text-center">
                    {targetBpm}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetBpm((v) => Math.min(280, v + 5))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-zinc-600 active:scale-95 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetBpm(Math.min(280, startBpm + 20))}
                  className="text-[10px] font-semibold text-[#007aff] hover:underline mt-1 cursor-pointer"
                >
                  +20 BPM
                </button>
              </div>
            </div>

            {/* Start Delay */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold font-manrope text-slate-700 dark:text-zinc-300">
                  Start Delay
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                  {formatDurationLabel(startDelaySec)}
                </span>
              </div>
              <div className="flex gap-1.5">
                {DELAY_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setStartDelaySec(sec)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      startDelaySec === sec
                        ? 'bg-[#007aff] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {sec === 0 ? '0s' : formatDurationLabel(sec)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold font-manrope text-slate-700 dark:text-zinc-300">
                  Ramp Duration
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                  {formatDurationLabel(durationSec)}
                </span>
              </div>
              <div className="flex gap-1.5">
                {DURATION_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSec(sec)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      durationSec === sec
                        ? 'bg-[#007aff] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {formatDurationLabel(sec)}
                  </button>
                ))}
              </div>
            </div>

            {/* Hold Final BPM Toggle */}
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold font-manrope text-slate-900 dark:text-zinc-100">
                  Hold Final BPM
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Keep target tempo after progression finishes
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={holdFinalBpm}
                onClick={() => setHoldFinalBpm(!holdFinalBpm)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex items-center px-0.5 ${
                  holdFinalBpm ? 'bg-[#007aff]' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <motion.div
                  animate={{ x: holdFinalBpm ? 16 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>

            {/* Summary Box */}
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#007aff] shrink-0 mt-0.5">
                info
              </span>
              <div className="text-[11px] leading-relaxed">
                {tempoDirectionText} <span className="font-bold font-mono">{startBpm}</span> to{' '}
                <span className="font-bold font-mono">{targetBpm} BPM</span> over{' '}
                <span className="font-bold">{formatDurationLabel(durationSec)}</span>
                {startDelaySec > 0 ? ` (after ${formatDurationLabel(startDelaySec)} delay)` : ''}.
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-manrope font-bold text-xs tracking-tight transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-manrope font-bold text-xs tracking-tight shadow-md transition cursor-pointer"
            >
              Save Progression
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
