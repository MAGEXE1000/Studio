import { create } from 'zustand';
import { AppKey } from '../../store/useChordStore';

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
    const { state } = get();
    if (state !== 'IDLE') {
      console.warn(`[TransitionEngine] Transition request to ${targetApp} ignored. State is currently ${state}`);
      return false;
    }

    console.log(`[TransitionEngine] Requesting transition: IDLE -> PREPARING to ${targetApp}`);
    
    // Clear any active safety watchdog
    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }
    
    // Set 3.5s safety watchdog timer
    (window as any).__transitionWatchdog = setTimeout(() => {
      console.warn(`[TransitionEngine] Watchdog triggered. Resetting to IDLE to prevent stuck screens.`);
      get().reset();
    }, 3500);

    set({
      state: 'PREPARING',
      launchingApp: targetApp,
      appPreloaded: false,
      logoFormed: false,
    });
    
    // Switch to preloading and logo formation
    setTimeout(() => {
      set({ state: 'LOGO_FORMATION' });
    }, 20);
    return true;
  },

  setAppPreloaded: (preloaded) => {
    const { state, logoFormed } = get();
    console.log(`[TransitionEngine] setAppPreloaded(${preloaded}) | state: ${state}, logoFormed: ${logoFormed}`);
    if (state === 'IDLE') return;

    set({ appPreloaded: preloaded });

    // If preloaded is true, and logo is already formed, trigger formation completion hold!
    if (preloaded && logoFormed && (state === 'LOGO_FORMATION' || state === 'FORMATION_COMPLETE')) {
      get().startZoom();
    }
  },

  setLogoFormed: (formed) => {
    const { state, appPreloaded } = get();
    console.log(`[TransitionEngine] setLogoFormed(${formed}) | state: ${state}, appPreloaded: ${appPreloaded}`);
    if (state === 'IDLE') return;

    set({ logoFormed: formed });

    if (formed) {
      if (appPreloaded) {
        get().startZoom();
      } else {
        set({ state: 'FORMATION_COMPLETE' });
      }
    }
  },

  startZoom: () => {
    const { state } = get();
    console.log(`[TransitionEngine] starting zoom transition from state ${state}`);
    
    set({ state: 'FORMATION_COMPLETE' });
    setTimeout(() => {
      const current = get();
      if (current.state === 'FORMATION_COMPLETE' && current.appPreloaded) {
        console.log(`[TransitionEngine] Brief completion hold ended. Beginning zoom.`);
        set({ state: 'ZOOM_TRANSITION' });
      }
    }, 200); // 200ms brief completion hold
  },

  completeTransition: () => {
    const { state } = get();
    console.log(`[TransitionEngine] completeTransition | Current state: ${state} -> OVERLAY_DISMISS`);
    
    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }

    set({ state: 'OVERLAY_DISMISS' });

    setTimeout(() => {
      set({ state: 'INTERACTION_ENABLE' });
      setTimeout(() => {
        console.log(`[TransitionEngine] Transition complete. Returning to IDLE`);
        set({
          state: 'IDLE',
          launchingApp: null,
          appPreloaded: false,
          logoFormed: false,
        });
      }, 50);
    }, 300); // 300ms overlay dismiss fade animation
  },

  reset: () => {
    console.log(`[TransitionEngine] Force reset transition engine to IDLE`);
    const existing = (window as any).__transitionWatchdog;
    if (existing) {
      clearTimeout(existing);
      (window as any).__transitionWatchdog = null;
    }

    set({
      state: 'IDLE',
      launchingApp: null,
      appPreloaded: false,
      logoFormed: false,
    });
  }
}));
