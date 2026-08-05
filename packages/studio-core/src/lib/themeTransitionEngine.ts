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

    // Direct synchronization of core color tokens for layout responsiveness
    const isLightMode = nextTheme === 'light';
    const bg = isLightMode ? '#f4f4f5' : amoled ? '#000000' : '#09090b';
    const lowest = isLightMode ? '#e4e4e7' : amoled ? '#000000' : '#0e0e11';
    const low = isLightMode ? '#ececed' : amoled ? '#030303' : '#131316';
    const mid = isLightMode ? '#f4f4f5' : amoled ? '#080808' : '#191a1e';
    const high = isLightMode ? '#fafafa' : amoled ? '#0d0d0d' : '#1f2025';
    const highest = isLightMode ? '#ffffff' : amoled ? '#121212' : '#25262c';

    root.style.setProperty('--c-background', bg);
    root.style.setProperty('--c-surface-lowest', lowest);
    root.style.setProperty('--c-surface-low', low);
    root.style.setProperty('--c-surface-mid', mid);
    root.style.setProperty('--c-surface-high', high);
    root.style.setProperty('--c-surface-highest', highest);

    // 4. Remove active transition state once theme colors have settled
    setTimeout(() => {
      root.classList.remove('theme-transition-active');
    }, 200);
  }
}

export const ThemeTransitionEngine = new ThemeTransitionEngineImpl();
