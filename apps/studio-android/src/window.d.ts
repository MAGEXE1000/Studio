declare global {
  interface Window {
    __forceRerenderApp?: () => void;
    studioTransitionActive?: boolean;
  }
}

export {};
