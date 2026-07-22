import { create } from 'zustand';
import type { AppKey } from '../../store/useSettingsStore';
import { useBottomNavigationStore } from './useBottomNavigationStore.js';

export type TransitionState =
  | 'IDLE'
  | 'PREPARING'
  | 'PRELOADING_DESTINATION'
  | 'LOGO_FORMATION'
  | 'FORMATION_COMPLETE'
  | 'ZOOM_TRANSITION'
  | 'OVERLAY_DISMISS'
  | 'INTERACTION_ENABLE';

interface ApplicationTransitionState {
  state: TransitionState;
  launchingApp: AppKey | null;
  appPreloaded: boolean;
  logoFormed: boolean;
  
  requestTransition: (targetApp: AppKey) => boolean;
  setAppPreloaded: (preloaded: boolean) => void;
  setLogoFormed: (formed: boolean) => void;
  startZoom: () => void;
  completeTransition: () => void;
  reset: () => void;
}

export const useApplicationTransitionStore = create<ApplicationTransitionState>((set, get) => ({
  state: 'IDLE',
  launchingApp: null,
  appPreloaded: false,
  logoFormed: false,

  requestTransition: (targetApp) => {
    let { state, launchingApp } = get();
    
    // Clear bottom navigation store states immediately during transition preparation
    const navStore = useBottomNavigationStore.getState();
    navStore.setSwitcherOpen(false);
    navStore.setVisible(false);
    navStore.setItems([]);

    if (state !== 'IDLE') {
      if (launchingApp === targetApp) {
        return true;
      }
      get().reset();
      state = 'IDLE';
    }

    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }
    
    (window as any).__transitionWatchdog = setTimeout(() => {
      get().reset();
    }, 4500);

    set({
      state: 'PREPARING',
      launchingApp: targetApp,
      appPreloaded: false,
      logoFormed: targetApp === 'hub',
    });
    
    setTimeout(() => {
      const current = get();
      if (current.state === 'PREPARING') {
        set({ state: 'LOGO_FORMATION' });
        if (current.appPreloaded && current.logoFormed) {
          get().startZoom();
        }
      }
    }, 20);
    return true;
  },

  setAppPreloaded: (preloaded) => {
    const { state, logoFormed } = get();
    if (state === 'IDLE') return;

    set({ appPreloaded: preloaded });

    if (preloaded && logoFormed && (state === 'PREPARING' || state === 'LOGO_FORMATION' || state === 'FORMATION_COMPLETE')) {
      get().startZoom();
    }
  },

  setLogoFormed: (formed) => {
    const { state, appPreloaded } = get();
    if (state === 'IDLE') return;

    set({ logoFormed: formed });

    if (formed) {
      if (appPreloaded && (state === 'PREPARING' || state === 'LOGO_FORMATION' || state === 'FORMATION_COMPLETE')) {
        get().startZoom();
      } else {
        set({ state: 'FORMATION_COMPLETE' });
      }
    }
  },

  startZoom: () => {
    const { state } = get();
    if (state === 'ZOOM_TRANSITION' || state === 'OVERLAY_DISMISS') return;
    set({ state: 'FORMATION_COMPLETE' });
    
    setTimeout(() => {
      const current = get();
      if (current.state === 'FORMATION_COMPLETE' && current.appPreloaded) {
        set({ state: 'ZOOM_TRANSITION' });
      }
    }, 180);
  },

  completeTransition: () => {
    const { state } = get();
    if (state === 'IDLE' || state === 'OVERLAY_DISMISS' || state === 'INTERACTION_ENABLE') return;
    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }

    // Reset bottom navigation store states and restore visibility for IDLE
    const navStore = useBottomNavigationStore.getState();
    navStore.setSwitcherOpen(false);
    navStore.setVisible(true);

    set({
      state: 'IDLE',
      launchingApp: null,
      appPreloaded: false,
      logoFormed: false,
    });
  },

  reset: () => {
    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }

    const navStore = useBottomNavigationStore.getState();
    navStore.setSwitcherOpen(false);
    navStore.setVisible(true);

    set({
      state: 'IDLE',
      launchingApp: null,
      appPreloaded: false,
      logoFormed: false,
    });
  },
}));
