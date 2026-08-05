import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { getFirebaseDb, waitForFirestoreReady } from '../firebase';
import { Participant } from './Types';

export class PresenceService {
  private static async getDb() {
    await waitForFirestoreReady();
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore is not configured');
    return db;
  }

  static async updatePresence(
    roomId: string, 
    user: { id: string; displayName: string; avatar: string },
    device: 'web' | 'android' | 'desktop',
    cursorColor: string,
    online = true
  ) {
    const db = await this.getDb();
    const presenceRef = doc(db, 'rooms', roomId, 'presence', user.id);
    
    const participant: Participant = {
      id: user.id,
      displayName: user.displayName || 'Anonymous User',
      avatar: user.avatar || '',
      device,
      online,
      cursorColor,
      lastSeen: Date.now(),
    };

    await setDoc(presenceRef, participant, { merge: true });
  }

  static async removePresence(roomId: string, userId: string) {
    const db = await this.getDb();
    const presenceRef = doc(db, 'rooms', roomId, 'presence', userId);
    await deleteDoc(presenceRef);
  }

  static async pruneDeadParticipants(roomId: string) {
    const db = await this.getDb();
    const now = Date.now();
    const timeoutThreshold = now - 30 * 1000; // 30 seconds of inactivity = dead

    const presenceCol = collection(db, 'rooms', roomId, 'presence');
    const queryDead = query(presenceCol, where('lastSeen', '<', timeoutThreshold));
    
    try {
      const snap = await getDocs(queryDead);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'rooms', roomId, 'presence', d.id));
        console.log(`[PresenceService] Pruned inactive participant ${d.id}`);
      }
    } catch (e) {
      console.warn('[PresenceService] Error pruning dead presence:', e);
    }
  }
}
