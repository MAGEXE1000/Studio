import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { StageOperation } from './Types';

export class OperationQueue {
  private queue: StageOperation[] = [];
  private processing = false;
  private isOffline = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOffline = false;
        this.flush();
      });
      window.addEventListener('offline', () => {
        this.isOffline = true;
      });
      this.isOffline = !navigator.onLine;
    }
  }

  enqueue(op: StageOperation, roomId: string) {
    (op as any)._roomId = roomId;
    this.queue.push(op);
    this.flush(roomId);
  }

  private async flush(roomId?: string) {
    if (this.processing || this.isOffline || this.queue.length === 0) {
      return;
    }
    this.processing = true;

    try {
      const db = getFirebaseDb();
      if (!db) throw new Error('Firestore is not configured');

      while (this.queue.length > 0 && !this.isOffline) {
        const op = this.queue[0];
        const rId = roomId || (op as any)._roomId;
        if (!rId) {
          this.queue.shift();
          continue;
        }

        const opRef = doc(db, 'rooms', rId, 'operations', op.id);
        
        await setDoc(opRef, {
          id: op.id,
          authorId: op.authorId,
          timestamp: op.timestamp,
          type: op.type,
          payload: op.payload,
        });

        this.queue.shift();
      }
    } catch (e) {
      console.warn('[OperationQueue] Failed to write operation to Firestore, retrying later:', e);
    } finally {
      this.processing = false;
      if (this.queue.length > 0 && !this.isOffline) {
        setTimeout(() => this.flush(roomId), 1000);
      }
    }
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }
}
