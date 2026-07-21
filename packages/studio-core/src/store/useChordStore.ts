import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Chord, Instrument, ChordType } from '../data/chords';
import { detectDeviceLanguage, type Language as I18nLanguage } from '../lib/i18n';
import { secureReadLocal, secureWriteLocal } from '../lib/security';

import { type NavigationRoute } from '../lib/navigation/navigationTypes';
import { useSettingsStore, settingsController, type Theme, type AccentColor, type AnimationSpeed, type DisplayDensity, type Language, type ActivePanel, type AppKey, type PerAppVisuals, type AppSettings, type SettingsStore } from './useSettingsStore';
import { NavigationDispatcher } from '../lib/navigation/NavigationDispatcher';


// Re-exported from i18n.ts so the store and the translation system always
// agree on the supported language set. v3.0.57 added: de, fr, zh, pt, it, ja, ko.

export interface Progression {
  id: string;
  name: string;
  chords: string[];
  createdAt: number;
}

export interface BarreDef {
  fret: number;
  fromString: number; // 1-indexed
  toString: number; // 1-indexed
}

export interface CustomChord {
  id: string; // "custom-{timestamp}-{random}"
  name: string; // user-defined name
  instrument: 'guitar' | 'piano' | 'bass';
  frets?: number[]; // per string: -1=muted, 0=open, n=fret (guitar/bass)
  barres?: BarreDef[]; // barre chord definitions
  pianoKeys?: number[]; // chromatic indices 0–11 (piano)
  notes: string[]; // computed note names (display)
  createdAt: number;
}

export interface SongSection {
  id: string;
  name: string;
  chords: string[];
}

export interface SongPreset {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  key: string;
  notes: string;
  chords: string[]; // flat list — used when no sections
  sections?: SongSection[]; // optional section-based organisation
  createdAt: number;
  updatedAt: number;
}

interface ChordStore {
  selectedChordId: string | null;
  favorites: string[];
  recentChords: string[];
  progressions: Progression[];
  currentProgressionChords: string[];

  multiSelectChords: string[];
  isMultiChordMode: boolean;
  presets: SongPreset[];
  activePresetId: string | null;
  transpositions: Record<string, number>; // presetId → semitone offset (view-only, not stored in preset)
  customChords: CustomChord[];
  chordUsage: Record<string, number>;
  activityLog?: any[];
  libraryActiveType: ChordType | 'all' | null;

  settings: AppSettings;
  settingsController: typeof settingsController;
  setLastSession: (patch: Partial<SettingsStore['lastSession']>) => void;
  currentApp: string;

  /**
   * Persisted "where was the user last?" snapshot — used at app launch to
   * restore the prior session (last opened app, sub-screen, etc.). Project
   * IDs (activePresetId, activePatternId, etc.) live in their own stores
   * and are restored independently. Optional fields default to undefined,
   * in which case launch falls back to settings.startupApp / 'hub'.
   */

  selectChord: (chordId: string) => void;
  trackChordUsage: (chordId: string) => void;
  setLibraryActiveType: (type: ChordType | 'all' | null) => void;
  toggleFavorite: (chordId: string) => void;
  isFavorite: (chordId: string) => boolean;

  addToProgression: (chordId: string) => void;
  removeFromProgression: (index: number) => void;
  reorderProgression: (from: number, to: number) => void;
  clearProgression: () => void;
  saveProgression: (name: string) => void;
  loadProgression: (id: string) => void;
  deleteProgression: (id: string) => void;

  toggleMultiChordMode: () => void;
  toggleMultiSelectChord: (chordId: string) => void;
  clearMultiSelect: () => void;

  // Transposition
  setTranspose: (presetId: string, semitones: number) => void;
  resetTranspose: (presetId: string) => void;

  // Custom chords
  saveCustomChord: (chord: CustomChord) => void;
  updateCustomChord: (id: string, patch: Partial<CustomChord>) => void;
  deleteCustomChord: (id: string) => void;

  // Song preset operations
  createPreset: (data: Omit<SongPreset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePreset: (id: string, data: Partial<SongPreset>) => void;
  deletePreset: (id: string) => void;
  setActivePreset: (id: string | null) => void;
  addChordToPreset: (presetId: string, chordId: string) => void;
  removeChordFromPreset: (presetId: string, index: number) => void;
  reorderPresetChords: (presetId: string, from: number, to: number) => void;
  duplicateChordInPreset: (presetId: string, index: number) => void;

  // Section operations
  addSection: (presetId: string, name: string) => void;
  updateSection: (presetId: string, sectionId: string, name: string) => void;
  deleteSection: (presetId: string, sectionId: string) => void;
  addChordToSection: (presetId: string, sectionId: string, chordId: string) => void;
  removeChordFromSection: (presetId: string, sectionId: string, index: number) => void;
  reorderSectionChords: (presetId: string, sectionId: string, from: number, to: number) => void;
  duplicateChordInSection: (presetId: string, sectionId: string, index: number) => void;
  reorderSection: (presetId: string, fromIdx: number, toIdx: number) => void;
  convertToSections: (presetId: string) => void;
  deduplicatePresetChords: (presetId: string) => void;
  deduplicateAllPresets: () => void;
}

export const useChordStore = create<ChordStore>()(
  persist(
    (set, get) => ({
      selectedChordId: 'C-major',
      libraryActiveType: null,
      favorites: [],
      recentChords: ['C-major'],
      progressions: [],
      currentProgressionChords: [],
      multiSelectChords: [],
      isMultiChordMode: false,
      presets: [],
      activePresetId: null,
      transpositions: {},
      customChords: [],
      chordUsage: {},
      activityLog: [],

      get settings() {
        return useSettingsStore.getState().settings;
      },
      get settingsController() {
        return settingsController;
      },
      setLastSession: (patch) => {
        useSettingsStore.getState().setLastSession(patch);
      },
      get currentApp() {
        return NavigationDispatcher.currentApp();
      },

      trackChordUsage: (chordId) => {
        set((state) => ({
          chordUsage: { ...state.chordUsage, [chordId]: (state.chordUsage[chordId] ?? 0) + 1 },
        }));
      },

      selectChord: (chordId) => {
        set((state) => {
          if (!chordId) {
            return { selectedChordId: null };
          }
          const recent = [chordId, ...state.recentChords.filter((id) => id !== chordId)].slice(
            0,
            10
          );
          return { selectedChordId: chordId, recentChords: recent };
        });
      },

      setLibraryActiveType: (type) => set({ libraryActiveType: type }),

      toggleFavorite: (chordId) => {
        set((state) => {
          const isFav = state.favorites.includes(chordId);
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== chordId)
              : [...state.favorites, chordId],
          };
        });
      },

      isFavorite: (chordId) => get().favorites.includes(chordId),

      addToProgression: (chordId) => {
        set((state) => ({
          currentProgressionChords: [...state.currentProgressionChords, chordId],
        }));
      },
      removeFromProgression: (index) => {
        set((state) => ({
          currentProgressionChords: state.currentProgressionChords.filter((_, i) => i !== index),
        }));
      },
      reorderProgression: (from, to) => {
        set((state) => {
          const chords = [...state.currentProgressionChords];
          const [moved] = chords.splice(from, 1);
          chords.splice(to, 0, moved);
          return { currentProgressionChords: chords };
        });
      },
      clearProgression: () => set({ currentProgressionChords: [] }),
      saveProgression: (name) => {
        set((state) => {
          const progression: Progression = {
            id: `prog-${Date.now()}`,
            name,
            chords: [...state.currentProgressionChords],
            createdAt: Date.now(),
          };
          return { progressions: [...state.progressions, progression] };
        });
      },
      loadProgression: (id) => {
        const prog = get().progressions.find((p) => p.id === id);
        if (prog) set({ currentProgressionChords: [...prog.chords] });
      },
      deleteProgression: (id) => {
        set((state) => ({ progressions: state.progressions.filter((p) => p.id !== id) }));
      },

      toggleMultiChordMode: () => {
        set((state) => ({ isMultiChordMode: !state.isMultiChordMode, multiSelectChords: [] }));
      },
      toggleMultiSelectChord: (chordId) => {
        set((state) => {
          const selected = state.multiSelectChords.includes(chordId);
          return {
            multiSelectChords: selected
              ? state.multiSelectChords.filter((id) => id !== chordId)
              : [...state.multiSelectChords, chordId],
          };
        });
      },
      clearMultiSelect: () => set({ multiSelectChords: [] }),

      // ── Transposition ──
      setTranspose: (presetId, semitones) => {
        const clamped = Math.max(-11, Math.min(11, semitones));
        set((state) => ({
          transpositions: { ...state.transpositions, [presetId]: clamped },
        }));
      },
      resetTranspose: (presetId) => {
        set((state) => {
          const next = { ...state.transpositions };
          delete next[presetId];
          return { transpositions: next };
        });
      },

      // ── Custom chords ──
      saveCustomChord: (chord) =>
        set((state) => ({
          customChords: [...state.customChords.filter((c) => c.id !== chord.id), chord],
        })),
      updateCustomChord: (id, patch) =>
        set((state) => ({
          customChords: state.customChords.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCustomChord: (id) =>
        set((state) => ({
          customChords: state.customChords.filter((c) => c.id !== id),
        })),

      // ── Song Preset operations ──
      createPreset: (data) => {
        const id = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const now = Date.now();
        const preset: SongPreset = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({ presets: [...state.presets, preset], activePresetId: id }));
        import('../lib/activityLogger')
          .then(({ logActivity }) => {
            logActivity('project_create', `Created ${preset.name}`, 'Chordex');
          })
          .catch(() => {});
        return id;
      },

      updatePreset: (id, data) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          activePresetId: state.activePresetId === id ? null : state.activePresetId,
        }));
      },

      setActivePreset: (id) => set({ activePresetId: id }),

      addChordToPreset: (presetId, chordId) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === presetId ? { ...p, chords: [...p.chords, chordId], updatedAt: Date.now() } : p
          ),
        }));
      },

      removeChordFromPreset: (presetId, index) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            const chords = [...p.chords];
            chords.splice(index, 1);
            return { ...p, chords, updatedAt: Date.now() };
          }),
        }));
      },

      reorderPresetChords: (presetId, from, to) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            const chords = [...p.chords];
            const [moved] = chords.splice(from, 1);
            chords.splice(to, 0, moved);
            return { ...p, chords, updatedAt: Date.now() };
          }),
        }));
      },

      duplicateChordInPreset: (presetId, index) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            const chords = [...p.chords];
            chords.splice(index + 1, 0, chords[index]);
            return { ...p, chords, updatedAt: Date.now() };
          }),
        }));
      },

      addSection: (presetId, name) => {
        const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id !== presetId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  sections: [...(p.sections ?? []), { id, name, chords: [] }],
                }
          ),
        }));
      },

      updateSection: (presetId, sectionId, name) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id !== presetId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  sections: (p.sections ?? []).map((s) =>
                    s.id === sectionId ? { ...s, name } : s
                  ),
                }
          ),
        }));
      },

      deleteSection: (presetId, sectionId) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id !== presetId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  sections: (p.sections ?? []).filter((s) => s.id !== sectionId),
                }
          ),
        }));
      },

      addChordToSection: (presetId, sectionId, chordId) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id !== presetId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  sections: (p.sections ?? []).map((s) =>
                    s.id === sectionId ? { ...s, chords: [...s.chords, chordId] } : s
                  ),
                }
          ),
        }));
      },

      removeChordFromSection: (presetId, sectionId, index) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            return {
              ...p,
              updatedAt: Date.now(),
              sections: (p.sections ?? []).map((s) => {
                if (s.id !== sectionId) return s;
                const chords = [...s.chords];
                chords.splice(index, 1);
                return { ...s, chords };
              }),
            };
          }),
        }));
      },

      reorderSectionChords: (presetId, sectionId, from, to) => {
        if (from === to) return;
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            return {
              ...p,
              updatedAt: Date.now(),
              sections: (p.sections ?? []).map((s) => {
                if (s.id !== sectionId) return s;
                const chords = [...s.chords];
                const [moved] = chords.splice(from, 1);
                chords.splice(to, 0, moved);
                return { ...s, chords };
              }),
            };
          }),
        }));
      },

      duplicateChordInSection: (presetId, sectionId, index) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            return {
              ...p,
              updatedAt: Date.now(),
              sections: (p.sections ?? []).map((s) => {
                if (s.id !== sectionId) return s;
                const chords = [...s.chords];
                chords.splice(index + 1, 0, chords[index]);
                return { ...s, chords };
              }),
            };
          }),
        }));
      },

      reorderSection: (presetId, fromIdx, toIdx) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId || !p.sections) return p;
            const secs = [...p.sections];
            const [moved] = secs.splice(fromIdx, 1);
            secs.splice(toIdx, 0, moved);
            return { ...p, updatedAt: Date.now(), sections: secs };
          }),
        }));
      },

      convertToSections: (presetId) => {
        set((state) => ({
          presets: state.presets.map((p) => {
            if (p.id !== presetId) return p;
            const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
            return {
              ...p,
              updatedAt: Date.now(),
              sections: [{ id, name: 'Verse', chords: [...p.chords] }],
              chords: [],
            };
          }),
        }));
      },

      deduplicatePresetChords: (presetId) => {
        const state = get();
        const preset = state.presets.find((p) => p.id === presetId);
        if (!preset) return;
        const uniqueFlat = [...new Set(preset.chords)];
        const uniqueSections = preset.sections?.map((s) => ({
          ...s,
          chords: [...new Set(s.chords)],
        }));
        const changed =
          uniqueFlat.length !== preset.chords.length ||
          (uniqueSections ?? []).some(
            (s, i) => s.chords.length !== (preset.sections?.[i]?.chords.length ?? 0)
          );
        if (!changed) return;
        set({
          presets: state.presets.map((p) =>
            p.id === presetId
              ? { ...p, chords: uniqueFlat, sections: uniqueSections, updatedAt: Date.now() }
              : p
          ),
        });
      },

      deduplicateAllPresets: () => {
        const state = get();
        let anyChanged = false;
        const newPresets = state.presets.map((p) => {
          const uniqueFlat = [...new Set(p.chords)];
          const uniqueSections = p.sections?.map((s) => ({
            ...s,
            chords: [...new Set(s.chords)],
          }));
          const changed =
            uniqueFlat.length !== p.chords.length ||
            (uniqueSections ?? []).some(
              (s, i) => s.chords.length !== (p.sections?.[i]?.chords.length ?? 0)
            );
          if (!changed) return p;
          anyChanged = true;
          return { ...p, chords: uniqueFlat, sections: uniqueSections, updatedAt: Date.now() };
        });
        if (!anyChanged) return;
        set({ presets: newPresets });
      },
    }),
    {
      name: 'chord-explorer-storage-v3',

      version: 13,
      migrate: (stored: unknown, fromVersion: number) => {
        const s = stored as Record<string, unknown>;
        if (fromVersion < 1) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            settings.startupApp = 'hub';
            settings.hubUserName = settings.hubUserName ?? '';
          }
        }
        if (fromVersion < 2) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            const theme = (settings.theme as Theme) ?? 'dark';
            const accentColor = (settings.accentColor as AccentColor) ?? 'blue';
            const amoledMode = (settings.amoledMode as boolean) ?? false;
            settings.perApp = {
              hub: { theme, accentColor, amoledMode },
              chords: { theme, accentColor, amoledMode },
              drums: { theme, accentColor, amoledMode },
              stage: { theme, accentColor, amoledMode },
            };
          }
        }
        if (fromVersion < 3) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            const perApp = settings.perApp as Record<string, unknown> | undefined;
            if (perApp && !perApp.groovex) {
              const hubVis = perApp.hub as PerAppVisuals | undefined;
              perApp.groovex = hubVis
                ? { ...hubVis }
                : { theme: 'dark', accentColor: 'blue', amoledMode: false };
            }
          }
        }
        if (fromVersion < 4) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            const perApp = settings.perApp as Record<string, unknown> | undefined;
            if (perApp && !perApp.vocalex) {
              const hubVis = perApp.hub as PerAppVisuals | undefined;
              perApp.vocalex = hubVis
                ? { ...hubVis }
                : { theme: 'dark', accentColor: 'blue', amoledMode: false };
            }
          }
        }
        // NOTE: a previous v5 migration unconditionally rewrote
        // `settings.language = 'es'`, which silently undid every user's
        // language pick after each Updater update. Removed permanently —
        // the language is now whatever the user last chose, period.
        if (fromVersion < 5) {
          // intentionally no-op; left as a marker so older builds with
          // a stored persist version of 4 still bump cleanly through to 6+.
        }
        if (fromVersion < 6) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (typeof settings.highRefreshRate !== 'boolean') {
              settings.highRefreshRate = false;
            }
            if (typeof settings.lowLatencyMode !== 'boolean') {
              settings.lowLatencyMode = false;
            }
            if (typeof settings.performanceMode !== 'boolean') {
              settings.performanceMode = false;
            }
            // Drop legacy `hubChimeEnabled` from older persisted state — the
            // Studio Chime feature was removed entirely. Leaving the property
            // around is harmless but pointless; remove it on rehydrate so
            // old installs don't carry dead config forever.
            if ('hubChimeEnabled' in settings) {
              delete (settings as Record<string, unknown>).hubChimeEnabled;
            }
          }
        }
        if (fromVersion < 7) {
          // Switch the default language from 'es' to 'en'. Only resets users
          // who still have the old hardcoded default — anyone who explicitly
          // chose a different language keeps their choice.
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (settings.language === 'es') {
              settings.language = 'en';
            }
          }
        }
        if (fromVersion < 8) {
          // v3.0.57: 7 new languages added. No-op for existing users —
          // they keep whatever they had picked. New installs get device
          // language via the initial state in the store. Marker only.
        }
        if (fromVersion < 9) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (typeof settings.privacyAnalytics !== 'boolean') settings.privacyAnalytics = false;
            if (typeof settings.privacyCrashReports !== 'boolean')
              settings.privacyCrashReports = false;
            if (typeof settings.privacyPerfReports !== 'boolean')
              settings.privacyPerfReports = false;
            if (typeof settings.autoBackup !== 'boolean') settings.autoBackup = false;
            if (typeof settings.syncAcrossDevices !== 'boolean') settings.syncAcrossDevices = false;
            if (typeof settings.backupFrequency !== 'string') settings.backupFrequency = 'manual';
            if (typeof settings.backupRetention !== 'string') settings.backupRetention = 'forever';
            if (typeof settings.autoCleanTemp !== 'boolean') settings.autoCleanTemp = false;
            if (typeof settings.lastExportDate !== 'string')
              settings.lastExportDate = 'Never exported';
          }
        }
        if (fromVersion < 10) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (typeof settings.developerMode !== 'boolean') {
              settings.developerMode = false;
            }
          }
        }
        if (fromVersion < 11) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (typeof settings.syncBackendProvider !== 'string') {
              settings.syncBackendProvider = 'supabase-realtime';
            }
          }
        }
        if (fromVersion < 12) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            settings.syncBackendProvider = 'supabase-realtime';
          }
        }
        if (fromVersion < 13) {
          if (s.settings && typeof s.settings === 'object') {
            const settings = s.settings as Record<string, unknown>;
            if (typeof settings.autoHideSidebarInApps !== 'boolean') {
              settings.autoHideSidebarInApps = true;
            }
          }
        }
        return s;
      },
      partialize: (state) => {
        // Exclude transient and legacy states from persistence
        const {
          multiSelectChords,
          isMultiChordMode,
          transpositions, // view-only
          activityLog,
          libraryActiveType,
          settings, // legacy
          lastSession, // legacy
          ...rest
        } = state as any;
        return rest;
      },
      storage: createJSONStorage(() => ({
        getItem: (name) => secureReadLocal(name),
        setItem: (name, value) => secureWriteLocal(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);
