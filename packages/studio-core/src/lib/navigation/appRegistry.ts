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
    { id: 'settings', labelKey: 'settings', icon: 'tune' },
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
    { id: 'SetupHub', labelKey: 'stagexSetup', icon: 'folder_open' },
    { id: 'Preferences', labelKey: 'stagexPreferences', icon: 'tune' },
  ],
};


export interface AppManifest {
  id: 'hub' | 'chords' | 'drums' | 'stage' | 'groovex' | 'vocalex';
  labelKey: string;
  icon: string;
  themeColor?: string;
}

export const REGISTERED_APPS: AppManifest[] = [
  { id: 'chords', labelKey: 'Chords', icon: 'music_note', themeColor: '#3b82f6' },
  { id: 'drums', labelKey: 'Drums', icon: 'album', themeColor: '#f59e0b' },
  { id: 'stage', labelKey: 'Stage', icon: 'grid_view', themeColor: '#8b5cf6' },
  { id: 'groovex', labelKey: 'GrooveX', icon: 'library_music', themeColor: '#ec4899' },
  { id: 'vocalex', labelKey: 'Vocalex', icon: 'mic', themeColor: '#10b981' },
];
