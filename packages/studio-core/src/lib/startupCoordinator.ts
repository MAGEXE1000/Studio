import { Capacitor } from '@capacitor/core';
import { useChordStore } from '../store/useChordStore';
import { syncStatusBar } from './useStatusBar';
import { applyThemeTokens } from './themeEngine';
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
  retryCount?: number;
  timeout?: number;
  result?: 'success' | 'failure';
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

  // Cancellation and Cleanup Registry
  private currentRunId = 0;
  private activeTimers: any[] = [];
  private activeListeners: Array<{ target: EventTarget; type: string; handler: any }> = [];
  private cancellationReason = '';

  // Zustand Store unsubscribe token
  private storeUnsubscribe: (() => void) | null = null;
  private hifpsRafId = 0;

  // Watchdog
  private watchdogTimer: any = null;

  // Lifecycle Coordination Queuing
  private queuedEvents: Array<{ type: string; trigger?: string; reason?: string; payload?: any }> = [];

  // Polling Scheduler
  private pollingTimer: any = null;

  // Lifecycle Debouncing
  private debouncedLifecycleTimer: any = null;
  private pendingLifecycleEvents: Array<{ type: string; trigger: string; reason: string; payload?: any }> = [];

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

  // Timer helper that registers for cleanup
  private setTimeout(fn: () => void, delay: number): any {
    const timer = setTimeout(fn, delay);
    this.activeTimers.push(timer);
    return timer;
  }

  // Listener helper that registers for cleanup
  private addEventListener(target: EventTarget, type: string, handler: any) {
    target.addEventListener(type, handler);
    this.activeListeners.push({ target, type, handler });
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, phaseName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = this.setTimeout(() => {
        reject(new Error(`Phase "${phaseName}" timed out after ${ms}ms`));
      }, ms);

      promise
        .then((res) => {
          // Remove timer from active timers list
          const idx = this.activeTimers.indexOf(timer);
          if (idx !== -1) this.activeTimers.splice(idx, 1);
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          const idx = this.activeTimers.indexOf(timer);
          if (idx !== -1) this.activeTimers.splice(idx, 1);
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private async executePhase(
    phaseId: string,
    timeoutMs: number,
    fn: () => Promise<void>,
    maxRetries = 1
  ): Promise<boolean> {
    const phase = this.phases[phaseId];
    const runId = this.currentRunId;
    phase.status = 'executing';
    phase.startTime = performance.now();
    phase.timeout = timeoutMs;
    phase.retryCount = 0;
    this.notify();

    let attempt = 0;
    while (attempt <= maxRetries) {
      if (this.currentRunId !== runId) {
        console.warn(`[StartupCoordinator] Phase ${phaseId} execution cancelled due to active run ID change.`);
        return false;
      }
      try {
        await this.withTimeout(fn(), timeoutMs, phase.name);
        if (this.currentRunId !== runId) return false;
        phase.status = 'completed';
        phase.result = 'success';
        phase.endTime = performance.now();
        phase.duration = phase.endTime - (phase.startTime || phase.endTime);
        this.notify();
        return true;
      } catch (err: any) {
        attempt++;
        phase.retryCount = attempt;
        console.warn(`[StartupCoordinator] Phase ${phaseId} failed (attempt ${attempt}):`, err);
        if (attempt > maxRetries) {
          phase.status = 'failed';
          phase.result = 'failure';
          phase.error = err.message || String(err);
          phase.endTime = performance.now();
          phase.duration = phase.endTime - (phase.startTime || phase.endTime);
          this.notify();
          return false;
        }
      }
    }
    return false;
  }

  async run(onHubShow: () => void) {
    if (this.isStarted) return;
    this.isStarted = true;
    this.isCompleted = false;
    this.cancellationReason = '';
    const runId = this.currentRunId;

    console.log(`[StartupCoordinator] Starting boot pipeline run ${runId}`);

    // Setup lifecycle event registration
    this.setupLifecycleListeners();

    // Start state-aware watchdog
    this.startWatchdog();

    // Phase 1: Native initialization
    const p1Success = await this.executePhase('1', 5000, async () => {
      const isNative = Capacitor.isNativePlatform();
      console.log(`[StartupCoordinator] Native check: isNativePlatform=${isNative}`);
      if (typeof window !== 'undefined') {
        (window as any).__nativeBootTimings = {
          checked: true,
          platform: Capacitor.getPlatform()
        };
      }
    });
    if (!p1Success || this.currentRunId !== runId) return;

    // Phase 2: Theme & settings initialization (synchronous apply)
    const p2Success = await this.executePhase('2', 5000, async () => {
      const settings = useChordStore.getState().settings;
      this.syncSettings(settings);
      this.startStoreSync();
    });
    if (!p2Success || this.currentRunId !== runId) return;

    // Phase 3: Navigation initialization & Preloading
    const p3Success = await this.executePhase('3', 5000, async () => {
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

      // Eagerly preload heavy UI modules to eliminate delayed Hub visibility
      if (typeof window !== 'undefined' && typeof (window as any).__preloadUIModules === 'function') {
        console.log('[StartupCoordinator] Triggering eager preloading of UI packages...');
        (window as any).__preloadUIModules();
      }
    });
    if (!p3Success || this.currentRunId !== runId) return;

    // Wait for orbits intro splash transition to finish
    await this.waitForIntroDone();
    if (this.currentRunId !== runId) return;

    // Phase 4: Updater initialization
    const p4Success = await this.executePhase('4', 10000, async () => {
      // 1. Enforce startup recovery (restores installer session state)
      await enforceStartupRecovery();

      // 2. Initialize OTA update listener registry
      initializeGlobalOtaListeners();
    });
    if (!p4Success || this.currentRunId !== runId) return;

    // Phase 5: Hub initialization
    const p5Success = await this.executePhase('5', 5000, async () => {
      if (typeof window !== 'undefined' && (window as any).__bootTimings) {
        (window as any).__bootTimings.hubVisible = performance.now();
        console.log("[LivexBoot] Hub fully visible: " + (window as any).__bootTimings.hubVisible.toFixed(2) + "ms");
      }

      // Set complete gate to true (enables OTA listener checks)
      if (typeof window !== 'undefined') {
        (window as any).__studioStartupComplete = true;
      }
      
      // Dispatch UI mounting events and flush queued events
      onHubShow();
      this.isCompleted = true;
      this.flushQueuedEvents();
    });
    if (!p5Success || this.currentRunId !== runId) return;

    // Run Phases 6 & 7 asynchronously after the Hub is visible and interactive
    void this.runPhase6(runId);
    void this.runPhase7(runId);
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
      const doneTimer = this.setTimeout(() => {
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
          const idx = this.activeTimers.indexOf(doneTimer);
          if (idx !== -1) this.activeTimers.splice(idx, 1);
          clearTimeout(doneTimer);
          window.removeEventListener('studio-intro-done', handleIntro);
          // Small debounce to allow intro DOM fade out transition to execute
          this.setTimeout(resolve, 500);
        }
      };

      window.addEventListener('studio-intro-done', handleIntro);
    });
  }

  private async runPhase6(runId: number) {
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
      this.setTimeout(async () => {
        if (this.currentRunId !== runId) return;
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

  private async runPhase7(runId: number) {
    await this.executePhase('7', 5000, async () => {
      // Setup window handlers and watchdogs
      (window as any).__runFailsafeRecovery = (checkpointName: string) => {
        const checkRoot = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
        if (checkRoot) return;
        console.warn(`[StartupCoordinator Failsafe] Hub DOM not mounted at ${checkpointName}! Running active recovery...`);
        if (typeof (window as any).__forceRerenderApp === 'function') {
          (window as any).__forceRerenderApp();
        }
      };
    });
  }

  // --- Cancellation and Cleanup Methods ---
  cancel(reason: string) {
    console.log(`[StartupCoordinator] Cancelling startup run ${this.currentRunId}. Reason: ${reason}`);
    this.currentRunId++; // Invalidate running executePhase promises
    this.cancellationReason = reason;
    this.isStarted = false;
    this.isCompleted = false;

    // Clear active timers and listeners
    this.cleanup();

    // Reset status back to idle
    for (const phase of Object.values(this.phases)) {
      phase.status = 'idle';
      phase.error = undefined;
      phase.duration = undefined;
      phase.result = undefined;
    }

    if (typeof window !== 'undefined') {
      (window as any).__studioStartupComplete = false;
    }

    this.notify();
  }

  restart(reason: string, onHubShow?: () => void) {
    this.cancel(`restart_request: ${reason}`);
    const handler = onHubShow || (() => {
      if (typeof (window as any).__forceRerenderApp === 'function') {
        (window as any).__forceRerenderApp();
      }
    });
    void this.run(handler);
  }

  private cleanup() {
    this.stopPeriodicUpdatePolling();
    if (this.debouncedLifecycleTimer) {
      clearTimeout(this.debouncedLifecycleTimer);
      this.debouncedLifecycleTimer = null;
    }
    this.pendingLifecycleEvents = [];

    this.activeTimers.forEach((t) => clearTimeout(t));
    this.activeTimers = [];

    this.activeListeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.activeListeners = [];

    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    this.stopHiFpsTick();
    this.stopWatchdog();
  }

  // --- Store settings synchronization logic ---
  private startStoreSync() {
    if (this.storeUnsubscribe) return;
    this.storeUnsubscribe = useChordStore.subscribe((state, prevState) => {
      if (state.settings === prevState.settings) return;
      this.syncSettings(state.settings);
    });
  }

  private startHiFpsTick() {
    if (this.hifpsRafId) return;
    const tick = () => {
      this.hifpsRafId = requestAnimationFrame(tick);
    };
    this.hifpsRafId = requestAnimationFrame(tick);
  }

  private stopHiFpsTick() {
    if (this.hifpsRafId) {
      cancelAnimationFrame(this.hifpsRafId);
      this.hifpsRafId = 0;
    }
  }

  private syncSettings(settings: any) {
    applyThemeTokens(settings);
    if (settings.highRefreshRate) {
      this.startHiFpsTick();
    } else {
      this.stopHiFpsTick();
    }
  }

  // --- Lifecycle Coordination & Polling ---
  private setupLifecycleListeners() {
    this.addEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleLifecycleEvent('visibilitychange', 'lifecycle_visibility', 'visibilitychange visible');
      }
    });

    this.addEventListener(window, 'focus', () => {
      this.handleLifecycleEvent('focus', 'lifecycle_focus', 'window focus');
    });
    this.addEventListener(window, 'pageshow', () => {
      this.handleLifecycleEvent('pageshow', 'lifecycle_focus', 'window focus');
    });
    this.addEventListener(window, 'online', () => {
      this.handleLifecycleEvent('online', 'lifecycle_focus', 'window focus');
    });

    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (s) => {
          if (s.isActive) {
            this.startPeriodicUpdatePolling();
            this.handleLifecycleEvent('appStateChange', 'lifecycle_appstate', 'native app active', s);
          } else {
            this.stopPeriodicUpdatePolling();
            // Cancel mid-boot if app goes to background
            if (!this.isCompleted) {
              console.warn('[StartupCoordinator] App backgrounded mid-boot! Cancelling startup.');
              this.cancel('app_backgrounded');
            }
          }
        }).then((h) => {
          this.activeListeners.push({
            target: { removeEventListener: () => h.remove() } as any,
            type: 'appStateChange',
            handler: null
          });
        });
      }).catch(() => {});
    }
  }

  private startPeriodicUpdatePolling() {
    if (this.pollingTimer) return;
    
    const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes
    this.pollingTimer = setInterval(() => {
      const autoCheck = useChordStore.getState().settings.otaAutoCheck ?? true;
      if (autoCheck && (typeof document === 'undefined' || document.visibilityState === 'visible')) {
        console.log('[StartupCoordinator] Triggering periodic update check...');
        void this.triggerOtaUpdateCheck('polling', 'periodic foreground poll');
      }
    }, POLL_INTERVAL);
  }

  private stopPeriodicUpdatePolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private handleLifecycleEvent(type: string, trigger: string, reason: string, payload?: any) {
    if (!this.isCompleted) {
      console.log(`[StartupCoordinator] Queuing lifecycle event during boot: type=${type}`);
      this.queuedEvents.push({ type, trigger, reason, payload });
      this.notify();
      return;
    }

    const autoCheck = useChordStore.getState().settings.otaAutoCheck ?? true;
    if (!autoCheck) return;

    // Coalesce events to prevent trigger storms (e.g. visibilitychange + focus on resume)
    this.pendingLifecycleEvents.push({ type, trigger, reason, payload });
    
    if (this.debouncedLifecycleTimer) {
      clearTimeout(this.debouncedLifecycleTimer);
    }
    
    this.debouncedLifecycleTimer = setTimeout(() => {
      this.debouncedLifecycleTimer = null;
      this.flushPendingLifecycleEvents();
    }, 200);
  }

  private flushPendingLifecycleEvents() {
    if (this.pendingLifecycleEvents.length === 0) return;
    
    const events = [...this.pendingLifecycleEvents];
    this.pendingLifecycleEvents = [];
    
    const types = events.map(e => e.type);
    console.log(`[StartupCoordinator] Processing coalesced lifecycle events: ${types.join(', ')}`);
    
    const hasTriggerEvent = events.some((evt) => 
      evt.type === 'visibilitychange' || evt.type === 'focus' || evt.type === 'pageshow' || evt.type === 'online' || evt.type === 'appStateChange'
    );
    
    if (hasTriggerEvent) {
      const primaryEvent = events.find(e => e.type === 'appStateChange') || 
                           events.find(e => e.type === 'visibilitychange') || 
                           events[0];
      void this.triggerOtaUpdateCheck(primaryEvent.trigger, `Coalesced: ${primaryEvent.reason}`);
    }
  }

  private async triggerOtaUpdateCheck(trigger: string, reason: string) {
    try {
      const { checkForUpdate } = await import('./otaUpdate');
      void checkForUpdate(false, trigger, reason);
    } catch (err) {
      console.error('[StartupCoordinator] Failed to trigger update check:', err);
    }
  }

  private flushQueuedEvents() {
    console.log(`[StartupCoordinator] Flushing queued lifecycle events (count=${this.queuedEvents.length}).`);
    
    const hasTriggerEvent = this.queuedEvents.some((evt) => 
      evt.type === 'visibilitychange' || evt.type === 'focus' || evt.type === 'pageshow' || evt.type === 'online' || evt.type === 'appStateChange'
    );
    
    this.queuedEvents = [];
    this.notify();

    // Trigger update check and start periodic update polling on startup completion
    this.startPeriodicUpdatePolling();

    if (hasTriggerEvent) {
      console.log('[StartupCoordinator] Triggering single update check from queued lifecycle triggers.');
      void this.triggerOtaUpdateCheck('queued_lifecycle', 'flushed boot events');
    } else {
      console.log('[StartupCoordinator] Triggering initial update check on startup completion.');
      void this.triggerOtaUpdateCheck('startup', 'app_boot_complete');
    }
  }

  // --- Watchdog Redesign ---
  private startWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(() => {
      this.checkWatchdogStatus();
    }, 2000);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private checkWatchdogStatus() {
    const now = performance.now();

    if (this.isCompleted) {
      const hubDom = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
      if (!hubDom) {
        console.warn('[Watchdog] Startup marked completed but Hub DOM is missing. Stalled!');
        this.triggerRecovery('HUB_DOM_MISSING_AFTER_COMPLETION');
      }
      return;
    }

    // Check if startup is stalled in an executing phase
    let activePhaseId: string | null = null;
    for (const [id, phase] of Object.entries(this.phases)) {
      if (phase.status === 'executing') {
        activePhaseId = id;
        break;
      }
    }

    if (activePhaseId) {
      const phase = this.phases[activePhaseId];
      const elapsed = now - (phase.startTime || now);
      const budget = phase.timeout || 5000;
      // Stalled if elapsed time exceeds phase budget by more than 1.5x
      if (elapsed > budget * 1.5) {
        console.warn(`[Watchdog] Startup stalled in Phase ${activePhaseId} (${phase.name}). Elapsed: ${elapsed.toFixed(0)}ms (Budget: ${budget}ms)`);
        this.triggerRecovery(`STALLED_IN_PHASE_${activePhaseId}`);
      }
    }
  }

  private triggerRecovery(reason: string) {
    console.error(`[Watchdog] Triggering startup recovery. Reason: ${reason}`);
    this.restart(`Watchdog recovery: ${reason}`);
  }

  // --- Diagnostics Output ---
  getDiagnostics() {
    const currentPhase = Object.entries(this.phases).find(([_, p]) => p.status === 'executing')?.[1].name || 'none';
    const completedPhases = Object.values(this.phases).filter(p => p.status === 'completed').map(p => p.name);
    const pendingPhases = Object.values(this.phases).filter(p => p.status === 'idle').map(p => p.name);
    const phaseDurations = Object.entries(this.phases).reduce((acc, [_, p]) => {
      acc[p.name] = p.duration || 0;
      return acc;
    }, {} as Record<string, number>);

    let totalDuration = 0;
    const p1 = this.phases['1'];
    const p5 = this.phases['5'];
    if (p1.startTime && p5.endTime) {
      totalDuration = p5.endTime - p1.startTime;
    } else if (p1.startTime) {
      totalDuration = performance.now() - p1.startTime;
    }

    return {
      currentPhase,
      completedPhases,
      pendingPhases,
      phaseDurations,
      startupDuration: totalDuration,
      startupState: this.isCompleted ? 'completed' : (this.isStarted ? 'running' : 'idle'),
      cancellationReason: this.cancellationReason,
      watchdogStatus: this.watchdogTimer ? 'active' : 'inactive',
      queuedEventsCount: this.queuedEvents.length,
      queuedEvents: [...this.queuedEvents]
    };
  }
}

export const StartupCoordinator = new StartupCoordinatorClass();
