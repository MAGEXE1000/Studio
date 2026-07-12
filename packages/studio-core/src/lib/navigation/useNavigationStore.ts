import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { diagnosticsMiddleware } from '../diagnostics/storeProfiler';
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
  owner?: string;
}

export interface NavigationStore {
  history: NavigationHistory;
  transitionType: TransitionType | null;
  isTransitioning: boolean;
  gestureState: GestureState;
  predictiveProgress: number;

  setHistory: (history: NavigationHistory) => void;
  setTransition: (type: TransitionType | null, active: boolean) => void;
  setGestureState: (state: GestureState, progress: number) => void;
  resetStore: () => void;
}

export const activeBackHandlers: BackHandlerInfo[] = [];

export const useNavigationStore = create<NavigationStore>()(
  diagnosticsMiddleware(
    persist(
      (set) => ({
      history: [{ app: 'hub', tab: 'home' }],
      transitionType: null,
      isTransitioning: false,
      gestureState: 'idle',
      predictiveProgress: 0,

      setHistory: (history) => {
        const prev = useNavigationStore.getState().history;
        console.log(`[NavigationStore] [${new Date().toISOString()}] setHistory | Prev: ${JSON.stringify(prev)} -> Next: ${JSON.stringify(history)}`);
        set({ history });
      },
      setTransition: (transitionType, isTransitioning) => {
        const store = useNavigationStore.getState();
        console.log(`[NavigationStore] [${new Date().toISOString()}] setTransition | type: ${transitionType}, active: ${isTransitioning} | Prev: {type: ${store.transitionType}, active: ${store.isTransitioning}}`);
        set({ transitionType, isTransitioning });
      },
      setGestureState: (gestureState, predictiveProgress) => {
        const store = useNavigationStore.getState();
        console.log(`[NavigationStore] [${new Date().toISOString()}] setGestureState | State: ${gestureState}, Progress: ${predictiveProgress} | Prev: {state: ${store.gestureState}, progress: ${store.predictiveProgress}}`);
        set({ gestureState, predictiveProgress });
      },
      resetStore: () => {
        console.log(`[NavigationStore] [${new Date().toISOString()}] resetStore`);
        set({
          history: [{ app: 'hub', tab: 'home' }],
          transitionType: null,
          isTransitioning: false,
          gestureState: 'idle',
          predictiveProgress: 0,
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
  ), 'NavigationStore')
);
