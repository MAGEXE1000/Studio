import { create } from 'zustand';
import {
  metronomeAudioEngine,
  type MetronomeTimeSignature,
  type MetronomeSubdivision,
  type MetronomeSoundId,
} from '../lib/audio/metronomeAudio';

export interface MetronomePreset {
  id: string;
  name: string;
  bpm: number;
  timeSignature: MetronomeTimeSignature;
  subdivision: MetronomeSubdivision;
  sound: MetronomeSoundId;
  volume: number;
  countInEnabled: boolean;
  icon?: string;
  createdAt: number;
}

export const SOUND_LABELS: Record<MetronomeSoundId, string> = {
  woodblock: 'Acoustic Woodblock',
  click: 'Acoustic Click',
  digital: 'Digital Beep',
  cowbell: 'Cowbell',
  rimshot: 'Rimshot',
  soft: 'Soft Click',
};

export const DEFAULT_PRESETS: MetronomePreset[] = [
  {
    id: 'preset-rock-4-4',
    name: 'Rock 4/4 Groove',
    bpm: 120,
    timeSignature: '4/4',
    subdivision: '1/16',
    sound: 'woodblock',
    volume: 85,
    countInEnabled: true,
    icon: 'music_note',
    createdAt: 1,
  },
  {
    id: 'preset-warm-up',
    name: 'Warm Up',
    bpm: 90,
    timeSignature: '4/4',
    subdivision: '1/4',
    sound: 'click',
    volume: 85,
    countInEnabled: true,
    icon: 'directions_run',
    createdAt: 2,
  },
  {
    id: 'preset-speed-chops',
    name: 'Speed & Chops Drill',
    bpm: 155,
    timeSignature: '4/4',
    subdivision: '3let',
    sound: 'digital',
    volume: 85,
    countInEnabled: true,
    icon: 'bolt',
    createdAt: 3,
  },
  {
    id: 'preset-blues-shuffle',
    name: 'Blues Shuffle',
    bpm: 108,
    timeSignature: '6/8',
    subdivision: '3let',
    sound: 'cowbell',
    volume: 85,
    countInEnabled: true,
    icon: 'queue_music',
    createdAt: 4,
  },
  {
    id: 'preset-odd-meter',
    name: 'Odd Meter 7/8',
    bpm: 144,
    timeSignature: '2/4',
    subdivision: '1/8',
    sound: 'rimshot',
    volume: 85,
    countInEnabled: true,
    icon: 'timelapse',
    createdAt: 5,
  },
  {
    id: 'preset-ballad',
    name: 'Ballad Tempo',
    bpm: 68,
    timeSignature: '3/4',
    subdivision: '1/8',
    sound: 'soft',
    volume: 85,
    countInEnabled: true,
    icon: 'nightlife',
    createdAt: 6,
  },
];

const PRESETS_STORAGE_KEY = 'studio-metronome-presets';
const SETTINGS_STORAGE_KEY = 'studio-metronome-settings';

function loadStoredPresets(): MetronomePreset[] {
  if (typeof window === 'undefined') return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

function saveStoredPresets(presets: MetronomePreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

function loadStoredSettings() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSettings(settings: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export interface MetronomeState {
  // Current settings
  bpm: number;
  timeSignature: MetronomeTimeSignature;
  subdivision: MetronomeSubdivision;
  sound: MetronomeSoundId;
  volume: number; // 0 - 100
  isMuted: boolean;
  countInEnabled: boolean;
  countInBars: number;

  // Active playhead
  isPlaying: boolean;
  activeBeat: number; // 0 to N-1, or -1
  activeSubdivision: number; // 0 to sub-1
  isAccent: boolean;
  isCountIn: boolean;

  // Presets
  activePresetId: string | null;
  presets: MetronomePreset[];

  // Practice Timer
  practiceTimerActive: boolean;
  practiceTimerMinutes: number; // 0 = off, 5, 10, 15, 20, 30
  practiceSecondsRemaining: number;

  // Actions
  start: () => void;
  stop: () => void;
  togglePlay: () => void;
  setBpm: (bpm: number) => void;
  adjustBpm: (delta: number) => void;
  setTimeSignature: (sig: MetronomeTimeSignature) => void;
  setSubdivision: (sub: MetronomeSubdivision) => void;
  setSound: (sound: MetronomeSoundId) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleCountIn: () => void;
  tapTempo: () => void;

  // Presets CRUD
  loadPreset: (id: string) => void;
  saveNewPreset: (name: string) => string;
  updateCurrentPreset: () => void;
  duplicatePreset: (id: string) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;

  // Practice Timer Actions
  setPracticeTimerMinutes: (minutes: number) => void;
  togglePracticeTimer: () => void;
}

const tapTimes: number[] = [];
let practiceTimerInterval: any = null;

export const useMetronomeStore = create<MetronomeState>((set, get) => {
  const stored = loadStoredSettings();
  const initialPresets = loadStoredPresets();

  const initialBpm = stored?.bpm ?? 120;
  const initialSig = stored?.timeSignature ?? '4/4';
  const initialSub = stored?.subdivision ?? '1/16';
  const initialSound = stored?.sound ?? 'woodblock';
  const initialVol = stored?.volume ?? 85;
  const initialCountIn = stored?.countInEnabled ?? true;

  // Configure audio engine with initial settings
  metronomeAudioEngine.setBpm(initialBpm);
  metronomeAudioEngine.setTimeSignature(initialSig);
  metronomeAudioEngine.setSubdivision(initialSub);
  metronomeAudioEngine.setSound(initialSound);
  metronomeAudioEngine.setVolume(initialVol / 100);
  metronomeAudioEngine.setCountIn(initialCountIn, 1);

  // Wire up audio engine callbacks to sync React store
  metronomeAudioEngine.onBeat = (event) => {
    set({
      activeBeat: event.beatIndex,
      activeSubdivision: event.subdivisionIndex,
      isAccent: event.isAccent,
      isCountIn: event.isCountIn,
    });
  };

  metronomeAudioEngine.onPlayStateChange = (playing) => {
    set({
      isPlaying: playing,
      activeBeat: playing ? get().activeBeat : -1,
      activeSubdivision: 0,
      isAccent: false,
      isCountIn: false,
    });

    if (playing) {
      // Start practice timer countdown if active
      if (get().practiceTimerActive && !practiceTimerInterval) {
        practiceTimerInterval = setInterval(() => {
          const rem = get().practiceSecondsRemaining;
          if (rem <= 1) {
            get().stop();
            clearInterval(practiceTimerInterval);
            practiceTimerInterval = null;
            set({ practiceSecondsRemaining: 0, practiceTimerActive: false });
          } else {
            set({ practiceSecondsRemaining: rem - 1 });
          }
        }, 1000);
      }
    } else {
      if (practiceTimerInterval) {
        clearInterval(practiceTimerInterval);
        practiceTimerInterval = null;
      }
    }
  };

  const persistSettings = () => {
    const s = get();
    saveStoredSettings({
      bpm: s.bpm,
      timeSignature: s.timeSignature,
      subdivision: s.subdivision,
      sound: s.sound,
      volume: s.volume,
      countInEnabled: s.countInEnabled,
    });
  };

  return {
    bpm: initialBpm,
    timeSignature: initialSig,
    subdivision: initialSub,
    sound: initialSound,
    volume: initialVol,
    isMuted: false,
    countInEnabled: initialCountIn,
    countInBars: 1,

    isPlaying: false,
    activeBeat: -1,
    activeSubdivision: 0,
    isAccent: false,
    isCountIn: false,

    activePresetId: initialPresets[0]?.id ?? null,
    presets: initialPresets,

    practiceTimerActive: false,
    practiceTimerMinutes: 0,
    practiceSecondsRemaining: 0,

    start: () => {
      metronomeAudioEngine.start();
    },

    stop: () => {
      metronomeAudioEngine.stop();
    },

    togglePlay: () => {
      metronomeAudioEngine.togglePlay();
    },

    setBpm: (val: number) => {
      const clamped = Math.max(40, Math.min(280, Math.round(val)));
      metronomeAudioEngine.setBpm(clamped);
      set({ bpm: clamped });
      persistSettings();
    },

    adjustBpm: (delta: number) => {
      const current = get().bpm;
      const next = Math.max(40, Math.min(280, current + delta));
      metronomeAudioEngine.setBpm(next);
      set({ bpm: next });
      persistSettings();
    },

    setTimeSignature: (sig: MetronomeTimeSignature) => {
      metronomeAudioEngine.setTimeSignature(sig);
      set({ timeSignature: sig });
      persistSettings();
    },

    setSubdivision: (sub: MetronomeSubdivision) => {
      metronomeAudioEngine.setSubdivision(sub);
      set({ subdivision: sub });
      persistSettings();
    },

    setSound: (sound: MetronomeSoundId) => {
      metronomeAudioEngine.setSound(sound);
      set({ sound });
      persistSettings();
    },

    setVolume: (volume: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(volume)));
      metronomeAudioEngine.setVolume(clamped / 100);
      set({ volume: clamped });
      persistSettings();
    },

    toggleMute: () => {
      const next = !get().isMuted;
      metronomeAudioEngine.setMuted(next);
      set({ isMuted: next });
    },

    toggleCountIn: () => {
      const next = !get().countInEnabled;
      metronomeAudioEngine.setCountIn(next, get().countInBars);
      set({ countInEnabled: next });
      persistSettings();
    },

    tapTempo: () => {
      const now = performance.now();
      tapTimes.push(now);
      if (tapTimes.length > 4) tapTimes.shift();

      if (tapTimes.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < tapTimes.length; i++) {
          intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avg > 0) {
          const calculatedBpm = Math.round(60000 / avg);
          if (calculatedBpm >= 40 && calculatedBpm <= 280) {
            get().setBpm(calculatedBpm);
          }
        }
      }
    },

    loadPreset: (id: string) => {
      const preset = get().presets.find((p) => p.id === id);
      if (!preset) return;

      get().setBpm(preset.bpm);
      get().setTimeSignature(preset.timeSignature);
      get().setSubdivision(preset.subdivision);
      get().setSound(preset.sound);
      get().setVolume(preset.volume);
      if (preset.countInEnabled !== undefined) {
        metronomeAudioEngine.setCountIn(preset.countInEnabled, 1);
        set({ countInEnabled: preset.countInEnabled });
      }

      set({ activePresetId: id });
    },

    saveNewPreset: (name: string) => {
      const s = get();
      const newId = `preset-${Date.now()}`;
      const newPreset: MetronomePreset = {
        id: newId,
        name: name.trim() || 'Custom Groove',
        bpm: s.bpm,
        timeSignature: s.timeSignature,
        subdivision: s.subdivision,
        sound: s.sound,
        volume: s.volume,
        countInEnabled: s.countInEnabled,
        icon: 'bookmark',
        createdAt: Date.now(),
      };

      const updated = [newPreset, ...s.presets];
      saveStoredPresets(updated);
      set({ presets: updated, activePresetId: newId });
      return newId;
    },

    updateCurrentPreset: () => {
      const s = get();
      if (!s.activePresetId) return;

      const updated = s.presets.map((p) => {
        if (p.id === s.activePresetId) {
          return {
            ...p,
            bpm: s.bpm,
            timeSignature: s.timeSignature,
            subdivision: s.subdivision,
            sound: s.sound,
            volume: s.volume,
            countInEnabled: s.countInEnabled,
          };
        }
        return p;
      });

      saveStoredPresets(updated);
      set({ presets: updated });
    },

    duplicatePreset: (id: string) => {
      const s = get();
      const target = s.presets.find((p) => p.id === id);
      if (!target) return;

      const copy: MetronomePreset = {
        ...target,
        id: `preset-${Date.now()}`,
        name: `${target.name} (Copy)`,
        createdAt: Date.now(),
      };

      const updated = [copy, ...s.presets];
      saveStoredPresets(updated);
      set({ presets: updated, activePresetId: copy.id });
    },

    deletePreset: (id: string) => {
      const s = get();
      const updated = s.presets.filter((p) => p.id !== id);
      saveStoredPresets(updated);
      set({
        presets: updated,
        activePresetId: s.activePresetId === id ? (updated[0]?.id ?? null) : s.activePresetId,
      });
    },

    renamePreset: (id: string, name: string) => {
      const s = get();
      const updated = s.presets.map((p) => (p.id === id ? { ...p, name: name.trim() } : p));
      saveStoredPresets(updated);
      set({ presets: updated });
    },

    setPracticeTimerMinutes: (minutes: number) => {
      const totalSec = minutes * 60;
      set({
        practiceTimerMinutes: minutes,
        practiceSecondsRemaining: totalSec,
        practiceTimerActive: minutes > 0,
      });
    },

    togglePracticeTimer: () => {
      const cur = get().practiceTimerMinutes;
      // Cycle: 0 (Off) -> 5m -> 10m -> 15m -> 30m -> 0
      const nextMin = cur === 0 ? 5 : cur === 5 ? 10 : cur === 10 ? 15 : cur === 15 ? 30 : 0;
      get().setPracticeTimerMinutes(nextMin);
    },
  };
});
