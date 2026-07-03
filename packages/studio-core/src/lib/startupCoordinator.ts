import { Capacitor } from '@capacitor/core';
import { useChordStore } from '../store/useChordStore';
import { syncStatusBar } from './useStatusBar';
import { enforceStartupRecovery, initializeGlobalOtaListeners } from './otaUpdate';
import { seedAudioAssets } from './assetCache';
import { ensureNotificationPermission } from './capgoUpdater';

export interface StartupPhase {
  name: string;
  status: 'idle' | 'executing' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

type Listener = (phases: Record<string, StartupPhase>) => void;

class StartupCoordinatorClass {
  private phases: Record<string, StartupPhase> = {
    '1': { name: 'Native initialization', status: 'idle' },
    '2': { name: 'Theme initialization', status: 'idle' },
    '3': { name: 'Navigation initialization', status: 'idle' },
    '4': { name: 'Updater initialization', status: 'idle' },
    '5': { name: 'Hub initialization', status: 'idle' },
    '6': { name: 'Background services', status: 'idle' },
    '7': { name: 'Developer tools', status: 'idle' },
  };

  private listeners = new Set<Listener>();
  private isStarted = false;
  private isCompleted = false;

  subscribe(l: Listener) {
    this.listeners.add(l);
    l({ ...this.phases });
    return () => {
      this.listeners.delete(l);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.phases }));
  }

  getPhases() {
    return { ...this.phases };
  }

  isStartupComplete() {
    return this.isCompleted;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, phaseName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Phase "${phaseName}" timed out after ${ms}ms`));
      }, ms);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private async executePhase(phaseId: string, timeoutMs: number, fn: () => Promise<void>) {
    const phase = this.phases[phaseId];
    console.log(`[StartupCoordinator] Starting Phase ${phaseId}: ${phase.name}`);
    phase.status = 'executing';
    phase.startTime = performance.now();
    this.notify();

    try {
      await this.withTimeout(fn(), timeoutMs, phase.name);
      phase.status = 'completed';
      console.log(`[StartupCoordinator] Phase ${phaseId} completed.`);
    } catch (err: any) {
      phase.status = 'failed';
      phase.error = err.message || String(err);
      console.error(`[StartupCoordinator] Phase ${phaseId} failed:`, err);
    } finally {
      phase.endTime = performance.now();
      phase.duration = phase.endTime - phase.startTime;
      this.notify();
    }
  }

  async run(onHubShow: () => void) {
    if (this.isStarted) return;
    this.isStarted = true;

    // Phase 1: Native initialization
    await this.executePhase('1', 5000, async () => {
      const isNative = Capacitor.isNativePlatform();
      console.log(`[StartupCoordinator] Native check: isNativePlatform=${isNative}`);
      if (typeof window !== 'undefined') {
        (window as any).__nativeBootTimings = {
          checked: true,
          platform: Capacitor.getPlatform()
        };
      }
    });

    // Phase 2: Theme initialization
    await this.executePhase('2', 3000, async () => {
      const storeState = useChordStore.getState();
      const settings = storeState.settings;
      const appMode = settings.appMode || 'hub';
      
      const activeVis = settings.perApp?.[appMode] ?? {
        theme: settings.theme ?? 'dark',
        accentColor: settings.accentColor ?? 'blue',
        amoledMode: settings.amoledMode ?? false,
      };

      const root = document.documentElement;
      
      // AMOLED Apply
      if (activeVis.amoledMode) {
        root.classList.add('amoled');
      } else {
        root.classList.remove('amoled');
      }

      // Theme Apply
      root.classList.remove('light', 'theme-system');
      if (activeVis.theme === 'light') {
        root.classList.add('light');
      } else if (activeVis.theme === 'system') {
        root.classList.add('theme-system');
      }

      // Sync CSS Accent Variables
      const ACCENT_COLORS = {
        blue:   { from: '#679cff', mid: '#4d8ef7', to: '#007aff' },
        purple: { from: '#a855f7', mid: '#8b5cf6', to: '#7c3aed' },
        green:  { from: '#4ade80', mid: '#10b981', to: '#059669' },
        orange: { from: '#fb923c', mid: '#f97316', to: '#ea580c' },
        pink:   { from: '#f472b6', mid: '#ec4899', to: '#db2777' },
        teal:   { from: '#2dd4bf', mid: '#14b8a6', to: '#0d9488' }
      };

      const hubAccentKey = activeVis.accentColor ?? 'blue';
      const accent = hubAccentKey === 'custom'
        ? {
            from: `hsl(${settings.customAccentHue ?? 220}, 75%, 65%)`,
            mid: `hsl(${settings.customAccentHue ?? 220}, 80%, 55%)`,
            to: `hsl(${((settings.customAccentHue ?? 220) + 25) % 360}, 85%, 42%)`
          }
        : ((ACCENT_COLORS as any)[hubAccentKey] ?? ACCENT_COLORS.blue);

      root.style.setProperty('--accent-from', accent.from);
      root.style.setProperty('--accent-to',   accent.to);
      root.style.setProperty('--accent-mid',  accent.mid);

      // Sync native status bar style
      await syncStatusBar(activeVis.theme, activeVis.amoledMode);

      // Sync Font size, density, animation classes
      const sizes = {
        small:  { base: '13px', sm: '11px', xs: '9px',  lg: '16px', xl: '20px', hero: '2.2rem' },
        medium: { base: '14px', sm: '12px', xs: '10px', lg: '18px', xl: '24px', hero: '2.8rem' },
        large:  { base: '16px', sm: '13px', xs: '11px', lg: '20px', xl: '26px', hero: '3.2rem' },
      };
      const s = (sizes as any)[settings.fontSize] || sizes.medium;
      root.style.setProperty('--font-base', s.base);
      root.style.setProperty('--font-sm',   s.sm);
      root.style.setProperty('--font-xs',   s.xs);
      root.style.setProperty('--font-lg',   s.lg);
      root.style.setProperty('--font-xl',   s.xl);
      root.style.setProperty('--font-hero', s.hero);

      const densities = {
        compact:     { pad: '10px', rowPad: '10px 20px', gap: '8px',  cardGap: '6px'  },
        comfortable: { pad: '16px', rowPad: '14px 20px', gap: '12px', cardGap: '10px' },
        spacious:    { pad: '22px', rowPad: '20px 24px', gap: '18px', cardGap: '16px' },
      };
      const d = (densities as any)[settings.displayDensity] || densities.comfortable;
      root.style.setProperty('--density-pad',      d.pad);
      root.style.setProperty('--density-row-pad',  d.rowPad);
      root.style.setProperty('--density-gap',      d.gap);
      root.style.setProperty('--density-card-gap', d.cardGap);

      const isReduced = settings.animationSpeed === 'reduced';
      root.setAttribute('data-anim', isReduced ? 'reduced' : settings.animationSpeed);

      if (settings.performanceMode) root.setAttribute('data-perf-mode', 'on');
      else root.removeAttribute('data-perf-mode');
    });

    // Phase 3: Navigation initialization
    await this.executePhase('3', 3000, async () => {
      const storeState = useChordStore.getState();
      const settings = storeState.settings;

      // Restore last session check
      if (!settings.restoreLastSession) {
        const defaultApp = settings.startupApp || 'hub';
        console.log(`[StartupCoordinator] restoreLastSession is false. Resetting appMode to ${defaultApp}.`);
        storeState.updateSettings({ appMode: defaultApp });
      }

      // Seed navigation trace
      const active = useChordStore.getState().settings.appMode || 'hub';
      (window as any).__navigationTraceHistory = (window as any).__navigationTraceHistory || [];
      (window as any).__navigationTraceHistory.push({
        fromApp: 'none',
        toApp: active,
        timestamp: Date.now(),
        transitionDuration: 0,
        lockState: false,
        recoveredViaFailsafe: false
      });
    });

    // Defer heavy updates, network requests, and backgrounds until after the splash settle animation finishes
    await this.waitForIntroDone();

    // Phase 4: Updater initialization
    await this.executePhase('4', 10000, async () => {
      // 1. Enforce startup recovery (restores installer session state)
      await enforceStartupRecovery();

      // 2. Initialize OTA update listener registry
      initializeGlobalOtaListeners();
    });

    // Phase 5: Hub initialization
    await this.executePhase('5', 5000, async () => {
      if (typeof window !== 'undefined' && (window as any).__bootTimings) {
        (window as any).__bootTimings.hubVisible = performance.now();
        console.log("[LivexBoot] Hub fully visible: " + (window as any).__bootTimings.hubVisible.toFixed(2) + "ms");
      }

      // Set complete gate to true (enables OTA listener checks)
      if (typeof window !== 'undefined') {
        (window as any).__studioStartupComplete = true;
      }
      
      // Dispatch UI mounting events
      onHubShow();
      this.isCompleted = true;
    });

    // Run Phases 6 & 7 asynchronously after the Hub is visible and interactive
    void this.runPhase6();
    void this.runPhase7();
  }

  private waitForIntroDone(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      if ((window as any).__introDone || sessionStorage.getItem('studio-intro-shown') === 'true') {
        resolve();
        return;
      }

      let resolved = false;
      const doneTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('studio-intro-done', handleIntro);
          console.warn('[StartupCoordinator] Safety timeout reached waiting for studio-intro-done event.');
          resolve();
        }
      }, 2500);

      const handleIntro = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(doneTimer);
          window.removeEventListener('studio-intro-done', handleIntro);
          // Small debounce to allow intro DOM fade out transition to execute
          setTimeout(resolve, 500);
        }
      };

      window.addEventListener('studio-intro-done', handleIntro);
    });
  }

  private async runPhase6() {
    await this.executePhase('6', 15000, async () => {
      // Supabase Authentication setup
      try {
        const { supabase } = await import('./supabaseClient');
        if (supabase) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          console.log('[StartupCoordinator] Supabase session loaded:', !!currentSession);
        }
      } catch (err) {
        console.error('[StartupCoordinator] Supabase session retrieval error:', err);
      }

      // Defer non-critical background services
      setTimeout(async () => {
        try {
          await ensureNotificationPermission();
        } catch (_) {}

        try {
          await seedAudioAssets();
        } catch (_) {}

        // Clean up visual repaints log
        try {
          const diagnosticsLog = localStorage.getItem('studio_visual_repaints_log') || '[]';
          const list = JSON.parse(diagnosticsLog);
          if (list.length > 10) {
            localStorage.setItem('studio_visual_repaints_log', JSON.stringify(list.slice(-10)));
          }
        } catch (_) {}
      }, 2000);
    });
  }

  private async runPhase7() {
    await this.executePhase('7', 3000, async () => {
      // Setup window handlers and watchdogs
      (window as any).__runFailsafeRecovery = (checkpointName: string) => {
        const checkRoot = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
        if (checkRoot) return;
        console.warn(`[StartupCoordinator Failsafe] Hub DOM not mounted at ${checkpointName}! Running active recovery...`);
        // Trigger page refresh / mount recovery
        if (typeof (window as any).__forceRerenderApp === 'function') {
          (window as any).__forceRerenderApp();
        }
      };
    });
  }
}

export const StartupCoordinator = new StartupCoordinatorClass();
