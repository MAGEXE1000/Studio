import { syncNow, retrySync, requestFlush } from '../lib/sync/sync';

export class SyncController {
  /**
   * Forces an immediate synchronization of all app states.
   */
  public async syncNow(): Promise<void> {
    await syncNow();
  }

  /**
   * Retries synchronization after an error, logging the attempt.
   */
  public async retrySync(): Promise<void> {
    await retrySync();
  }

  /**
   * Requests a background flush (debounced).
   */
  public requestFlush(): void {
    requestFlush();
  }
}

export const syncController = new SyncController();
