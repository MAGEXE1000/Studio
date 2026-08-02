import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  type Unsubscribe 
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { StageOperation, Participant } from './Types';

export class FirestoreSync {
  private static getDb() {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore is not configured');
    return db;
  }

  static subscribeOperations(
    roomId: string, 
    onOpAdded: (op: StageOperation) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const db = this.getDb();
    const opsCol = collection(db, 'rooms', roomId, 'operations');
    const opsQuery = query(opsCol, orderBy('timestamp', 'asc'));

    return onSnapshot(opsQuery, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const op = change.doc.data() as StageOperation;
          onOpAdded(op);
        }
      });
    }, (err) => {
      console.warn(`[FirestoreSync] Operations subscription error:`, err);
      onError?.(err);
    });
  }

  static subscribePresence(
    roomId: string,
    onPresenceChange: (participants: Participant[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const db = this.getDb();
    const presenceCol = collection(db, 'rooms', roomId, 'presence');

    return onSnapshot(presenceCol, (snap) => {
      const participants: Participant[] = [];
      snap.forEach((doc) => {
        participants.push(doc.data() as Participant);
      });
      onPresenceChange(participants);
    }, (err) => {
      console.warn(`[FirestoreSync] Presence subscription error:`, err);
      onError?.(err);
    });
  }
}
