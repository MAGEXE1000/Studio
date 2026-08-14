export interface ThemeTransitionOptions {
  nextTheme: string;
  amoled: boolean;
  startX: number;
  startY: number;
  updateFn: () => void;
}

class ThemeTransitionEngineImpl {
  public startTransition(options: ThemeTransitionOptions) {
    const { nextTheme, amoled, updateFn } = options;
    const root = document.documentElement;

    // 1. Temporarily activate premium native CSS variable transitions
    root.classList.add('theme-transition-active');

    // 2. Perform DOM mutations and execute the theme update immediately
    updateFn();

    // 3. Mutate theme utility classes on root HTML element synchronously
    if (nextTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    if (amoled) {
      root.classList.add('amoled');
    } else {
      root.classList.remove('amoled');
    }

    // Direct synchronization of core color tokens for layout responsiveness is now handled completely by CSS via class mutations

    // 4. Remove active transition state once theme colors have settled
    setTimeout(() => {
      root.classList.remove('theme-transition-active');
    }, 200);
  }
}

export const ThemeTransitionEngine = new ThemeTransitionEngineImpl();
