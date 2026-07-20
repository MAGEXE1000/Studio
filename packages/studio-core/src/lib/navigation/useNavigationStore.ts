import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureReadLocal, secureWriteLocal } from '../security.js';
import {
  type NavigationRoute,
  type NavigationHistory,
  type TransitionType,
  type GestureState,
} from './navigationTypes';

export interface BackHandlerInfo {
  id: string;
  priority: string;
  fn: () => boolean;
}

export interface NavigationStore {
  history: NavigationHistory;
  transitionType: TransitionType | null;
  isTransitioning: boolean;
  gestureState: GestureState;
  predictiveProgress: number;
  activeHandlers: BackHandlerInfo[];

  setHistory: (history: NavigationHistory) => void;
  setTransition: (type: TransitionType | null, active: boolean) => void;
  setGestureState: (state: GestureState, progress: number) => void;
  registerHandler: (id: string, priority: string, fn: () => boolean) => void;
  unregisterHandler: (id: string) => void;
  resetStore: () => void;
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      history: [{ app: 'hub', tab: 'home' }],
      transitionType: null,
      isTransitioning: false,
      gestureState: 'idle',
      predictiveProgress: 0,
      activeHandlers: [],

      setHistory: (history) => {
        const prev = useNavigationStore.getState().history;
        set({ history });
      },
      setTransition: (transitionType, isTransitioning) => {
        const store = useNavigationStore.getState();
        set({ transitionType, isTransitioning });
      },
      setGestureState: (gestureState, predictiveProgress) => {
        const store = useNavigationStore.getState();
        set({ gestureState, predictiveProgress });
      },
      registerHandler: (id, priority, fn) => {
        set((state) => ({
          activeHandlers: [
            ...state.activeHandlers.filter((h) => h.id !== id),
            { id, priority, fn },
          ],
        }));
      },
      unregisterHandler: (id) => {
        set((state) => ({
          activeHandlers: state.activeHandlers.filter((h) => h.id !== id),
        }));
      },
      resetStore: () => {
        set({
          history: [{ app: 'hub', tab: 'home' }],
          transitionType: null,
          isTransitioning: false,
          gestureState: 'idle',
          predictiveProgress: 0,
          activeHandlers: [],
        });
      },
    }),
    {
      name: 'studio-navigation-storage-v1',
      partialize: (state) => ({
        history: state.history,
      }),
      storage: createJSONStorage(() => ({
        getItem: (name) => secureReadLocal(name),
        setItem: (name, value) => secureWriteLocal(name, value),
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(name);
          }
        },
      })),
    }
  )
);


export const useCurrentApp = (): NavigationRoute['app'] => {
  return useNavigationStore((state) => {
    const route = state.history[state.history.length - 1];
    return route ? route.app : 'hub';
  });
};
