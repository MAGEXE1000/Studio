export type SyncPhase = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  phase: SyncPhase;
  lastSyncedAt: number | null;
  lastError: string | null;
  pendingCount: number;
}

type SyncStateListener = (state: SyncState) => void;

class SyncOrchestratorClass {
  private state: SyncState = {
    phase: 'idle',
    lastSyncedAt: null,
    lastError: null,
    pendingCount: 0,
  };

  private listeners = new Set<SyncStateListener>();
  private inFlightRunPromise: Promise<void> | null = null;
  private hasPendingFollowup = false;
  private currentEpoch = 0;

  public getState(): SyncState {
    return { ...this.state };
  }

  public incrementEpoch(): number {
    this.currentEpoch++;
    return this.currentEpoch;
  }

  public getEpoch(): number {
    return this.currentEpoch;
  }

  public updateState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  public subscribe(listener: SyncStateListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async enqueueRun(runFn: () => Promise<void>): Promise<void> {
    if (this.inFlightRunPromise) {
      if (!this.hasPendingFollowup) {
        this.hasPendingFollowup = true;
      }
      return this.inFlightRunPromise;
    }

    this.updateState({ phase: 'syncing', lastError: null });

    this.inFlightRunPromise = (async () => {
      try {
        await runFn();
        this.updateState({ phase: 'success', lastSyncedAt: Date.now() });

        // Auto revert back to idle phase after 1.8s
        setTimeout(() => {
          if (this.state.phase === 'success') {
            this.updateState({ phase: 'idle' });
          }
        }, 1800);
      } catch (err: any) {
        this.updateState({ phase: 'error', lastError: err?.message || String(err) });
      } finally {
        this.inFlightRunPromise = null;
        if (this.hasPendingFollowup) {
          this.hasPendingFollowup = false;
          void this.enqueueRun(runFn);
        }
      }
    })();

    return this.inFlightRunPromise;
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }
}

export const SyncOrchestrator = new SyncOrchestratorClass();
