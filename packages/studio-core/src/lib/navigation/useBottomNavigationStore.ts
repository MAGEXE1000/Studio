import { create } from 'zustand';

export type BottomNavMotionState =
  | 'Idle'
  | 'Scrolling'
  | 'Hidden'
  | 'Visible'
  | 'Dragging'
  | 'SwitchingApp'
  | 'ReturningToHub'
  | 'Transitioning'
  | 'Restoring';

export interface BottomNavItem {
  key: string;
  icon: string | React.JSX.Element;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface BottomNavigationStore {
  motionState: BottomNavMotionState;
  visible: boolean;
  collapsed: boolean;
  isSwitcherOpen: boolean;
  isProfileMenuOpen: boolean;
  isSearchOpen: boolean;
  items: BottomNavItem[];
  isLight: boolean;
  debugLog: boolean;

  // Actions
  setMotionState: (state: BottomNavMotionState) => void;
  setVisible: (visible: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  setSwitcherOpen: (open: boolean) => void;
  setProfileMenuOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  closeAllOverlays: () => void;
  setItems: (items: BottomNavItem[]) => void;
  setIsLight: (isLight: boolean) => void;
  setDebugLog: (enabled: boolean) => void;
  logState: (action: string) => void;
}

export const useBottomNavigationStore = create<BottomNavigationStore>((set, get) => ({
  motionState: 'Idle',
  visible: true,
  collapsed: false,
  isSwitcherOpen: false,
  isProfileMenuOpen: false,
  isSearchOpen: false,
  items: [],
  isLight: false,
  debugLog: true,

  setMotionState: (motionState) => {
    const prev = get().motionState;
    if (prev === motionState) return;
    set({ motionState });
    get().logState(`state: ${prev} -> ${motionState}`);
  },
  setVisible: (visible) => {
    const prev = get().visible;
    if (prev === visible) return;
    set({ visible });
    get().setMotionState(visible ? 'Visible' : 'Hidden');
  },
  setCollapsed: (collapsed) => {
    const prev = get().collapsed;
    if (prev === collapsed) return;
    set({ collapsed });
    get().setMotionState(collapsed ? 'Hidden' : 'Visible');
  },
  setSwitcherOpen: (isSwitcherOpen) => {
    set({
      isSwitcherOpen,
      isProfileMenuOpen: isSwitcherOpen ? false : get().isProfileMenuOpen,
      isSearchOpen: isSwitcherOpen ? false : get().isSearchOpen,
    });
    get().setMotionState(isSwitcherOpen ? 'SwitchingApp' : 'Visible');
  },
  setProfileMenuOpen: (isProfileMenuOpen) => {
    set({
      isProfileMenuOpen,
      isSwitcherOpen: isProfileMenuOpen ? false : get().isSwitcherOpen,
      isSearchOpen: isProfileMenuOpen ? false : get().isSearchOpen,
    });
  },
  toggleProfileMenu: () => {
    const next = !get().isProfileMenuOpen;
    get().setProfileMenuOpen(next);
  },
  setSearchOpen: (isSearchOpen) => {
    set({
      isSearchOpen,
      isProfileMenuOpen: isSearchOpen ? false : get().isProfileMenuOpen,
      isSwitcherOpen: isSearchOpen ? false : get().isSwitcherOpen,
    });
  },
  toggleSearch: () => {
    const next = !get().isSearchOpen;
    get().setSearchOpen(next);
  },
  closeAllOverlays: () => {
    set({
      isSwitcherOpen: false,
      isProfileMenuOpen: false,
      isSearchOpen: false,
    });
  },
  setItems: (items) => {
    set({ items });
  },
  setIsLight: (isLight) => set({ isLight }),
  setDebugLog: (debugLog) => set({ debugLog }),
  logState: (action) => {
    if (get().debugLog) {
    }
  },
}));
