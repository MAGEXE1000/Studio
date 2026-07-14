export interface AppSection {
  id: string;
  labelKey: string;
  icon: string;
}

export const APP_SECTIONS: Record<string, AppSection[]> = {
  chords: [
    { id: 'songs', labelKey: 'songs', icon: 'music_note' },
    { id: 'library', labelKey: 'library', icon: 'folder_open' },
    { id: 'chord', labelKey: 'chords', icon: 'grid_view' },
  ],
  drums: [
    { id: 'songs', labelKey: 'drumSongs', icon: 'queue_music' },
    { id: 'patterns', labelKey: 'drumPatterns', icon: 'grid_view' },
    { id: 'prefs', labelKey: 'drumPreferences', icon: 'tune' },
  ],
  groovex: [
    { id: 'library', labelKey: 'groovexLibrary', icon: 'library_music' },
    { id: 'preferences', labelKey: 'groovexPreferences', icon: 'tune' },
  ],
  vocalex: [
    { id: 'coach', labelKey: 'vocalexCoach', icon: 'school' },
    { id: 'recorder', labelKey: 'vocalexRecorder', icon: 'mic' },
    { id: 'takes', labelKey: 'vocalexTakes', icon: 'history' },
    { id: 'preferences', labelKey: 'vocalexPreferences', icon: 'tune' },
  ],
  stage: [
    { id: 'Editor', labelKey: 'stagexStage', icon: 'grid_view' },
    { id: 'Setup', labelKey: 'stagexSetup', icon: 'folder_open' },
    { id: 'Preferences', labelKey: 'stagexPreferences', icon: 'tune' },
  ],
};
