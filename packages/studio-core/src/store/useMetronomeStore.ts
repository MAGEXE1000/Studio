import { create } from 'zustand';
import {
  metronomeAudioEngine,
  type MetronomeTimeSignature,
  type MetronomeSubdivision,
  type MetronomeSoundId,
} from '../lib/audio/metronomeAudio';
import { mediaSessionCoordinator } from '../lib/audio/mediaSessionCoordinator';

export interface MetronomePreset {
  id: string;
  name: string;
  bpm: number;
  timeSignature: MetronomeTimeSignature;
  subdivision: MetronomeSubdivision;
  sound: MetronomeSoundId;
  volume: number;
  countInEnabled: boolean;
  accentBeat?: number; // 0-indexed measure beat (0 = Beat 1)
  isFactory?: boolean; // Immutable factory preset flag
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

export const FACTORY_PRESETS: MetronomePreset[] = [
  {
    id: 'preset-rock-4-4',
    name: 'Rock 4/4 Groove',
    bpm: 120,
    timeSignature: '4/4',
    subdivision: '1/16',
    sound: 'woodblock',
    volume: 85,
    countInEnabled: true,
    accentBeat: 0,
    isFactory: true,
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
    accentBeat: 0,
    isFactory: true,
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
    accentBeat: 0,
    isFactory: true,
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
    accentBeat: 0,
    isFactory: true,
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
    accentBeat: 0,
    isFactory: true,
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
    accentBeat: 0,
    isFactory: true,
    icon: 'nightlife',
    createdAt: 6,
  },
];

export const DEFAULT_PRESETS: MetronomePreset[] = FACTORY_PRESETS;

const PRESETS_STORAGE_KEY = 'studio-metronome-presets';
const SETTINGS_STORAGE_KEY = 'studio-metronome-settings';

function loadStoredPresets(): MetronomePreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p: any) => !p.isFactory && !FACTORY_PRESETS.some((f) => f.id === p.id))
      : [];
  } catch {
    return [];
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
  accentBeat: number; // 0 to N-1 (default 0 for Beat 1)
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
  userPresets: MetronomePreset[];
  factoryPresets: MetronomePreset[];
  presets: MetronomePreset[]; // Canonical saved presets (userPresets)

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
  setAccentBeat: (beatIndex: number) => void;
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
  const initialUserPresets = loadStoredPresets();

  const initialBpm = stored?.bpm ?? 120;
  const initialSig = stored?.timeSignature ?? '4/4';
  const initialSub = stored?.subdivision ?? '1/16';
  const initialSound = stored?.sound ?? 'woodblock';
  const initialAccent = stored?.accentBeat ?? 0;
  const initialVol = stored?.volume ?? 85;
  const initialCountIn = stored?.countInEnabled ?? true;

  // Configure audio engine with initial settings
  metronomeAudioEngine.setBpm(initialBpm);
  metronomeAudioEngine.setTimeSignature(initialSig);
  metronomeAudioEngine.setSubdivision(initialSub);
  metronomeAudioEngine.setSound(initialSound);
  metronomeAudioEngine.setAccentBeat(initialAccent);
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

    syncMediaSession(playing);
  };

  const syncMediaSession = (playing?: boolean) => {
    const s = get();
    const isCurrentlyPlaying = playing !== undefined ? playing : s.isPlaying;
    const allPresets = [...s.userPresets, ...FACTORY_PRESETS];
    const preset = allPresets.find((p) => p.id === s.activePresetId);
    // PRIMARY TITLE is ALWAYS the current BPM!
    const title = `${s.bpm} BPM`;
    const artist = 'Drumex Metronome';
    const album = `${s.timeSignature} · ${SOUND_LABELS[s.sound] || 'Metronome'}${preset ? ` · ${preset.name}` : ''}`;

    if (isCurrentlyPlaying) {
      mediaSessionCoordinator.registerProvider({
        id: 'drumex-metronome',
        getMetadata: () => {
          const state = get();
          const p = [...state.userPresets, ...FACTORY_PRESETS].find(
            (pr) => pr.id === state.activePresetId
          );
          return {
            title: `${state.bpm} BPM`,
            artist: 'Drumex Metronome',
            album: `${state.timeSignature} · ${SOUND_LABELS[state.sound] || 'Metronome'}${p ? ` · ${p.name}` : ''}`,
          };
        },
        getPlaybackState: () => ({
          state: get().isPlaying ? 'playing' : 'paused',
          speed: 1.0,
        }),
        onPlay: () => get().start(),
        onPause: () => get().stop(),
        onStop: () => {
          get().stop();
          mediaSessionCoordinator.stopSession('drumex-metronome');
        },
        onSkipForward: () => get().adjustBpm(5),
        onSkipBackward: () => get().adjustBpm(-5),
        onNext: () => {
          const list = get().userPresets;
          if (!list || list.length === 0) {
            // Zero saved presets: safely do nothing!
            return;
          }
          const currentId = get().activePresetId;
          const idx = list.findIndex((p) => p.id === currentId);
          const nextIdx = idx === -1 ? 0 : (idx + 1) % list.length;
          const next = list[nextIdx];
          if (next) get().loadPreset(next.id);
        },
        onPrevious: () => {
          const list = get().userPresets;
          if (!list || list.length === 0) {
            // Zero saved presets: safely do nothing!
            return;
          }
          const currentId = get().activePresetId;
          const idx = list.findIndex((p) => p.id === currentId);
          const prevIdx = idx === -1 ? list.length - 1 : (idx - 1 + list.length) % list.length;
          const prev = list[prevIdx];
          if (prev) get().loadPreset(prev.id);
        },
      });

      mediaSessionCoordinator.updateMetadata('drumex-metronome', {
        title,
        artist,
        album,
      });

      mediaSessionCoordinator.updatePlaybackState('drumex-metronome', {
        state: 'playing',
        speed: 1.0,
      });
    } else {
      mediaSessionCoordinator.updatePlaybackState('drumex-metronome', {
        state: 'paused',
        speed: 1.0,
      });
      // Synchronize metadata when paused so BPM changes reflect immediately in notification
      if (mediaSessionCoordinator.getActiveProviderId() === 'drumex-metronome') {
        mediaSessionCoordinator.updateMetadata('drumex-metronome', {
          title,
          artist,
          album,
        });
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
      accentBeat: s.accentBeat,
      countInEnabled: s.countInEnabled,
    });
  };

  return {
    bpm: initialBpm,
    timeSignature: initialSig,
    subdivision: initialSub,
    sound: initialSound,
    accentBeat: initialAccent,
    volume: initialVol,
    isMuted: false,
    countInEnabled: initialCountIn,
    countInBars: 1,

    isPlaying: false,
    activeBeat: -1,
    activeSubdivision: 0,
    isAccent: false,
    isCountIn: false,

    activePresetId: initialUserPresets[0]?.id ?? null,
    userPresets: initialUserPresets,
    factoryPresets: FACTORY_PRESETS,
    presets: initialUserPresets,

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
      syncMediaSession(get().isPlaying);
    },

    adjustBpm: (delta: number) => {
      const current = get().bpm;
      const next = Math.max(40, Math.min(280, current + delta));
      metronomeAudioEngine.setBpm(next);
      set({ bpm: next });
      persistSettings();
      syncMediaSession(get().isPlaying);
    },

    setTimeSignature: (sig: MetronomeTimeSignature) => {
      metronomeAudioEngine.setTimeSignature(sig);
      const currentAccent = get().accentBeat;
      const maxBeat = metronomeAudioEngine.getBeatsPerMeasure() - 1;
      const validAccent = currentAccent > maxBeat ? 0 : currentAccent;
      if (validAccent !== currentAccent) {
        metronomeAudioEngine.setAccentBeat(validAccent);
      }
      set({ timeSignature: sig, accentBeat: validAccent });
      persistSettings();
      syncMediaSession(get().isPlaying);
    },

    setSubdivision: (sub: MetronomeSubdivision) => {
      metronomeAudioEngine.setSubdivision(sub);
      set({ subdivision: sub });
      persistSettings();
      syncMediaSession(get().isPlaying);
    },

    setSound: (sound: MetronomeSoundId) => {
      metronomeAudioEngine.setSound(sound);
      set({ sound });
      persistSettings();
      syncMediaSession(get().isPlaying);
    },

    setAccentBeat: (beatIndex: number) => {
      const maxBeat = metronomeAudioEngine.getBeatsPerMeasure() - 1;
      const clamped = Math.max(0, Math.min(maxBeat, Math.round(beatIndex)));
      metronomeAudioEngine.setAccentBeat(clamped);
      set({ accentBeat: clamped });
      persistSettings();
      syncMediaSession(get().isPlaying);
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
      const allPresets = [...get().userPresets, ...FACTORY_PRESETS];
      const preset = allPresets.find((p) => p.id === id);
      if (!preset) return;

      get().setBpm(preset.bpm);
      get().setTimeSignature(preset.timeSignature);
      get().setSubdivision(preset.subdivision);
      get().setSound(preset.sound);
      get().setVolume(preset.volume);
      get().setAccentBeat(preset.accentBeat ?? 0);
      if (preset.countInEnabled !== undefined) {
        metronomeAudioEngine.setCountIn(preset.countInEnabled, 1);
        set({ countInEnabled: preset.countInEnabled });
      }

      set({ activePresetId: id });
      syncMediaSession(get().isPlaying);
    },

    saveNewPreset: (name: string) => {
      const s = get();
      const newId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newPreset: MetronomePreset = {
        id: newId,
        name: name.trim() || 'Custom Groove',
        bpm: s.bpm,
        timeSignature: s.timeSignature,
        subdivision: s.subdivision,
        sound: s.sound,
        volume: s.volume,
        accentBeat: s.accentBeat,
        countInEnabled: s.countInEnabled,
        isFactory: false,
        icon: 'bookmark',
        createdAt: Date.now(),
      };

      const updated = [newPreset, ...s.userPresets];
      saveStoredPresets(updated);
      set({ userPresets: updated, presets: updated, activePresetId: newId });
      return newId;
    },

    updateCurrentPreset: () => {
      const s = get();
      if (!s.activePresetId) return;

      const isUserPreset = s.userPresets.some((p) => p.id === s.activePresetId);
      if (isUserPreset) {
        const updated = s.userPresets.map((p) => {
          if (p.id === s.activePresetId) {
            return {
              ...p,
              bpm: s.bpm,
              timeSignature: s.timeSignature,
              subdivision: s.subdivision,
              sound: s.sound,
              volume: s.volume,
              accentBeat: s.accentBeat,
              countInEnabled: s.countInEnabled,
            };
          }
          return p;
        });

        saveStoredPresets(updated);
        set({ userPresets: updated, presets: updated });
      } else {
        // Current active preset is a factory preset: save a custom user copy
        const factory = FACTORY_PRESETS.find((p) => p.id === s.activePresetId);
        get().saveNewPreset(`${factory?.name ?? 'Custom'} (Modified)`);
      }
    },

    duplicatePreset: (id: string) => {
      const s = get();
      const target = [...s.userPresets, ...FACTORY_PRESETS].find((p) => p.id === id);
      if (!target) return;

      const copy: MetronomePreset = {
        ...target,
        id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${target.name} (Copy)`,
        isFactory: false,
        createdAt: Date.now(),
      };

      const updated = [copy, ...s.userPresets];
      saveStoredPresets(updated);
      set({ userPresets: updated, presets: updated, activePresetId: copy.id });
    },

    deletePreset: (id: string) => {
      const s = get();
      const updated = s.userPresets.filter((p) => p.id !== id);
      saveStoredPresets(updated);
      set({
        userPresets: updated,
        presets: updated,
        activePresetId: s.activePresetId === id ? (updated[0]?.id ?? null) : s.activePresetId,
      });
    },

    renamePreset: (id: string, name: string) => {
      const s = get();
      const updated = s.userPresets.map((p) => (p.id === id ? { ...p, name: name.trim() } : p));
      saveStoredPresets(updated);
      set({ userPresets: updated, presets: updated });
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
