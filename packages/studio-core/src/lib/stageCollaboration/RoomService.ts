import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { CollaboratorRoom } from './Types';
import { serializeStage } from './StageSerializer';

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class RoomService {
  private static getDb() {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore is not configured');
    return db;
  }

  static async createRoom(hostId: string): Promise<CollaboratorRoom> {
    const db = this.getDb();
    const roomId = doc(collection(db, 'rooms')).id;
    
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      shortCode = generateShortCode();
      const codeRef = doc(db, 'roomCodes', shortCode);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) {
        isUnique = true;
      }
      attempts++;
    }
    if (!shortCode) throw new Error('Failed to generate a unique room code');

    const now = Date.now();
    const currentStage = serializeStage(hostId);

    const room: CollaboratorRoom = {
      roomId,
      shortCode,
      hostId,
      currentStageVersion: 1,
      lastHeartbeat: now,
      createdAt: now,
      updatedAt: now,
      snapshot: currentStage,
    };

    await setDoc(doc(db, 'roomCodes', shortCode), { roomId, createdAt: now });
    await setDoc(doc(db, 'rooms', roomId), room);

    return room;
  }

  static async getRoomIdFromCode(shortCode: string): Promise<string | null> {
    const db = this.getDb();
    const codeRef = doc(db, 'roomCodes', shortCode.toUpperCase().trim());
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) return null;
    return codeSnap.data().roomId || null;
  }

  static async getRoom(roomId: string): Promise<CollaboratorRoom | null> {
    const db = this.getDb();
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return null;
    return roomSnap.data() as CollaboratorRoom;
  }

  static async updateRoomHeartbeat(roomId: string) {
    const db = this.getDb();
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      lastHeartbeat: Date.now(),
      updatedAt: Date.now(),
    });
  }

  static async deleteRoom(roomId: string, shortCode: string) {
    const db = this.getDb();
    await deleteDoc(doc(db, 'rooms', roomId));
    await deleteDoc(doc(db, 'roomCodes', shortCode.toUpperCase().trim()));
  }

  static async runTTLPruning() {
    const db = this.getDb();
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('lastHeartbeat', '<', twentyFourHoursAgo)
    );
    
    try {
      const snaps = await getDocs(roomsQuery);
      for (const d of snaps.docs) {
        const room = d.data() as CollaboratorRoom;
        await this.deleteRoom(room.roomId, room.shortCode);
        console.log(`[RoomService] Pruned inactive room ${room.roomId} (${room.shortCode})`);
      }
    } catch (e) {
      console.warn('[RoomService] Error pruning old rooms:', e);
    }
  }
}
