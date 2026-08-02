import { RoomService } from './RoomService';
import { PresenceService } from './PresenceService';
import { FirestoreSync } from './FirestoreSync';
import { ConflictResolver } from './ConflictResolver';
import { OperationQueue } from './OperationQueue';
import { deserializeStage } from './StageDeserializer';
import { CollaboratorRoom, Participant, StageOperation, CollabConnectionState } from './Types';
import { Unsubscribe } from 'firebase/firestore';

function mapFirestoreError(error: any): Error {
  const rawMsg = error?.message || String(error);
  const code = error?.code || 'unknown';
  const name = error?.name || 'Error';
  const msg = rawMsg.toLowerCase();
  
  let friendly = 'Unable to connect to the collaboration server. Please try again.';
  if (msg.includes('offline') || msg.includes('network') || msg.includes('unavailable') || msg.includes('failed to get document')) {
    friendly = 'Connection lost. Please check your internet connection and try again.';
  } else if (msg.includes('permission') || msg.includes('denied')) {
    friendly = 'Access denied. You do not have permission to join this room.';
  } else if (msg.includes('not-found') || msg.includes('invalid') || msg.includes('expired') || msg.includes('not found')) {
    friendly = 'Room does not exist or has expired.';
  }
  
  return new Error(`${friendly} (Raw: ${name}[${code}]: ${rawMsg})`);
}

export class CollaborationService {
  private static instance: CollaborationService | null = null;

  private activeRoom: CollaboratorRoom | null = null;
  private connectionState: CollabConnectionState = 'disconnected';
  private participants: Participant[] = [];
  private currentUserId: string = '';
  private currentUserData: { displayName: string; avatar: string } = { displayName: 'Anonymous', avatar: '' };

  private iframe: HTMLIFrameElement | null = null;
  private originalPushHistory: any = null;

  // Cached state for local-to-remote diffing
  private cachedElements = new Map<string, any>();
  private cachedConnections: any[] = [];
  private cachedSceneIdx: number = 0;
  private cachedSelectedId: string | null = null;

  // Queue and Resolver
  private opQueue = new OperationQueue();
  private conflictResolver = new ConflictResolver();

  // Firestore Subscriptions
  private unsubOps: Unsubscribe | null = null;
  private unsubPresence: Unsubscribe | null = null;

  // Heartbeat loop
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Callback listeners
  private connectionListeners = new Set<(state: CollabConnectionState) => void>();
  private roomListeners = new Set<(room: CollaboratorRoom | null) => void>();
  private presenceListeners = new Set<(participants: Participant[]) => void>();

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  // ── Connection state ────────────────────────────────────────────────────────

  getConnectionState(): CollabConnectionState {
    return this.connectionState;
  }

  getActiveRoom(): CollaboratorRoom | null {
    return this.activeRoom;
  }

  getParticipants(): Participant[] {
    return this.participants;
  }

  subscribeConnectionState(listener: (state: CollabConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  subscribeRoom(listener: (room: CollaboratorRoom | null) => void): () => void {
    this.roomListeners.add(listener);
    return () => this.roomListeners.delete(listener);
  }

  subscribePresence(listener: (participants: Participant[]) => void): () => void {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  private setConnectionState(state: CollabConnectionState) {
    this.connectionState = state;
    this.connectionListeners.forEach(l => l(state));
  }

  private setRoom(room: CollaboratorRoom | null) {
    this.activeRoom = room;
    this.roomListeners.forEach(l => l(room));
  }

  private setParticipants(participants: Participant[]) {
    this.participants = participants;
    this.presenceListeners.forEach(l => l(participants));
  }

  // ── Heartbeat Loop ─────────────────────────────────────────────────────────

  private startHeartbeat(roomId: string, cursorColor: string) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (this.connectionState !== 'connected') return;
      try {
        await RoomService.updateRoomHeartbeat(roomId);
        await PresenceService.updatePresence(
          roomId,
          { id: this.currentUserId, ...this.currentUserData },
          this.getDeviceType(),
          cursorColor,
          true
        );
        await PresenceService.pruneDeadParticipants(roomId);
      } catch (e) {
        console.warn('[CollaborationService] Heartbeat update failed:', e);
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Room Join / Leave / Create ─────────────────────────────────────────────

  async createRoom(
    userId: string, 
    userData: { displayName: string; avatar: string },
    cursorColor: string
  ): Promise<CollaboratorRoom> {
    console.log('[CollaborationService] createRoom START for userId:', userId, 'userData:', userData);
    this.setConnectionState('connecting');
    this.currentUserId = userId;
    this.currentUserData = userData;

    try {
      console.log('[CollaborationService] Creating room via RoomService...');
      const room = await RoomService.createRoom(userId);
      console.log('[CollaborationService] Room created successfully. roomId:', room.roomId, 'code:', room.shortCode);
      this.setRoom(room);
      this.setConnectionState('connected');

      console.log('[CollaborationService] Updating presence for host...');
      await PresenceService.updatePresence(room.roomId, userId ? { id: userId, ...userData } : { id: 'host', ...userData }, this.getDeviceType(), cursorColor, true);
      console.log('[CollaborationService] Presence updated successfully.');

      console.log('[CollaborationService] Setting up realtime subscriptions...');
      this.setupSubscriptions(room.roomId);
      console.log('[CollaborationService] Realtime subscriptions active.');
      this.startHeartbeat(room.roomId, cursorColor);
      console.log('[CollaborationService] Heartbeat started.');

      console.log('[CollaborationService] createRoom COMPLETE. Success!');
      return room;
    } catch (e: any) {
      console.error('[CollaborationService] createRoom failed with raw error:', e);
      console.error('[CollaborationService] Raw error details:', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        stack: e?.stack,
      });
      this.setConnectionState('disconnected');
      throw mapFirestoreError(e);
    }
  }

  async joinRoom(
    shortCode: string, 
    userId: string, 
    userData: { displayName: string; avatar: string },
    cursorColor: string
  ): Promise<CollaboratorRoom> {
    console.log('[CollaborationService] joinRoom START with code:', shortCode, 'userId:', userId);
    this.setConnectionState('connecting');
    this.currentUserId = userId;
    this.currentUserData = userData;

    try {
      console.log(`[CollaborationService] Looking up roomId from code: ${shortCode}`);
      const roomId = await RoomService.getRoomIdFromCode(shortCode.toUpperCase().trim());
      console.log(`[CollaborationService] getRoomIdFromCode resolved to: ${roomId}`);
      if (!roomId) throw new Error('Invalid or expired room code');

      console.log(`[CollaborationService] Fetching room details for roomId: ${roomId}`);
      const room = await RoomService.getRoom(roomId);
      if (!room) throw new Error('Room details not found');

      // Restore stage snapshot from room host
      if (room.snapshot) {
        console.log('[CollaborationService] Restoring stage snapshot from host room...');
        deserializeStage(room.snapshot, this.iframe, userId);
        console.log('[CollaborationService] Stage snapshot restored successfully.');
      }

      this.setRoom(room);
      this.setConnectionState('connected');

      console.log('[CollaborationService] Updating presence for joint user...');
      await PresenceService.updatePresence(roomId, { id: userId, ...userData }, this.getDeviceType(), cursorColor, true);
      console.log('[CollaborationService] Presence updated successfully.');

      console.log('[CollaborationService] Setting up realtime subscriptions...');
      this.setupSubscriptions(roomId);
      console.log('[CollaborationService] Realtime subscriptions active.');
      this.startHeartbeat(roomId, cursorColor);
      console.log('[CollaborationService] Heartbeat started.');

      console.log('[CollaborationService] joinRoom COMPLETE. Success!');
      return room;
    } catch (e: any) {
      console.error('[CollaborationService] joinRoom failed with raw error:', e);
      console.error('[CollaborationService] Raw error details:', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        stack: e?.stack,
      });
      this.setConnectionState('disconnected');
      throw mapFirestoreError(e);
    }
  }

  async leaveRoom() {
    this.stopHeartbeat();
    this.clearSubscriptions();
    
    if (this.activeRoom && this.currentUserId) {
      try {
        await PresenceService.removePresence(this.activeRoom.roomId, this.currentUserId);
      } catch (e) { /* ignore */ }
    }

    this.unhijackIframeHistory();
    this.opQueue.clear();
    this.conflictResolver.clear();

    this.setRoom(null);
    this.setParticipants([]);
    this.setConnectionState('disconnected');
  }

  // ── Firestore Listeners ───────────────────────────────────────────────────

  private setupSubscriptions(roomId: string) {
    this.clearSubscriptions();

    this.unsubOps = FirestoreSync.subscribeOperations(roomId, (op) => {
      this.applyRemoteOperation(op);
    });

    this.unsubPresence = FirestoreSync.subscribePresence(roomId, (participants) => {
      this.setParticipants(participants);
    });
  }

  private clearSubscriptions() {
    if (this.unsubOps) {
      this.unsubOps();
      this.unsubOps = null;
    }
    if (this.unsubPresence) {
      this.unsubPresence();
      this.unsubPresence = null;
    }
  }

  // ── Iframe Interception / Hijacking ────────────────────────────────────────

  registerIframe(iframe: HTMLIFrameElement | null) {
    this.iframe = iframe;
    if (iframe && this.connectionState === 'connected') {
      this.hijackIframeHistory();
    }
  }

  private hijackIframeHistory() {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const win = this.iframe.contentWindow as any;
    
    // Guard against double hijacking
    if (win.__pushHistoryHijacked) return;

    this.originalPushHistory = win.pushHistory;
    
    // Initialize caches
    this.cacheIframeState();

    win.pushHistory = (...args: any[]) => {
      // Execute the original pushHistory
      if (this.originalPushHistory) {
        this.originalPushHistory.apply(win, args);
      }
      // Inspect state changes and generate ops
      this.diffLocalChanges();
    };

    if (typeof win.undo === 'function' && !win.__undoHijacked) {
      win.__origUndo = win.undo;
      win.undo = (...args: any[]) => {
        win.__origUndo.apply(win, args);
        this.diffLocalChanges();
      };
      win.__undoHijacked = true;
    }

    if (typeof win.redo === 'function' && !win.__redoHijacked) {
      win.__origRedo = win.redo;
      win.redo = (...args: any[]) => {
        win.__origRedo.apply(win, args);
        this.diffLocalChanges();
      };
      win.__redoHijacked = true;
    }

    win.__pushHistoryHijacked = true;
    console.log('[CollaborationService] Successfully hijacked iframe history, undo, and redo');
  }

  private unhijackIframeHistory() {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const win = this.iframe.contentWindow as any;
    if (win.__pushHistoryHijacked && this.originalPushHistory) {
      win.pushHistory = this.originalPushHistory;
      delete win.__pushHistoryHijacked;
      console.log('[CollaborationService] Restored iframe history');
    }
    if (win.__undoHijacked && win.__origUndo) {
      win.undo = win.__origUndo;
      delete win.__undoHijacked;
      delete win.__origUndo;
    }
    if (win.__redoHijacked && win.__origRedo) {
      win.redo = win.__origRedo;
      delete win.__redoHijacked;
      delete win.__origRedo;
    }
    this.originalPushHistory = null;
  }

  private cacheIframeState() {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const win = this.iframe.contentWindow as any;
    const state = win.state;
    if (!state) return;

    this.cachedElements.clear();
    if (Array.isArray(state.elements)) {
      state.elements.forEach((el: any) => {
        this.cachedElements.set(el.id, JSON.parse(JSON.stringify(el)));
      });
    }

    this.cachedConnections = Array.isArray(state.connections) 
      ? JSON.parse(JSON.stringify(state.connections)) 
      : [];

    this.cachedSceneIdx = typeof state.currentSceneIdx === 'number' 
      ? state.currentSceneIdx 
      : 0;

    this.cachedSelectedId = state.selectedId || null;
  }

  // ── Local Change Detection & Diffing ───────────────────────────────────────

  private diffLocalChanges() {
    if (!this.iframe || !this.iframe.contentWindow || !this.activeRoom) return;
    const win = this.iframe.contentWindow as any;
    const state = win.state;
    if (!state) return;

    const currentElements = state.elements || [];
    const currentElementsMap = new Map<string, any>(currentElements.map((el: any) => [el.id, el]));

    // 1. Detect creations and mutations
    currentElements.forEach((el: any) => {
      const cached = this.cachedElements.get(el.id);
      if (!cached) {
        // Element created
        this.broadcastLocalOperation('create', { ...el });
      } else {
        // Element modified: compare properties
        if (el.x !== cached.x || el.y !== cached.y) {
          this.broadcastLocalOperation('move', { id: el.id, x: el.x, y: el.y });
        } else if (el.scale !== cached.scale) {
          this.broadcastLocalOperation('resize', { id: el.id, scale: el.scale });
        } else if (el.rotation !== cached.rotation) {
          this.broadcastLocalOperation('rotate', { id: el.id, rotation: el.rotation });
        } else if (el.name !== cached.name) {
          this.broadcastLocalOperation('rename', { id: el.id, name: el.name });
        } else if (JSON.stringify(el) !== JSON.stringify(cached)) {
          // Fallback property changes
          this.broadcastLocalOperation('property', { id: el.id, properties: { ...el } });
        }
      }
    });

    // 2. Detect deletions
    this.cachedElements.forEach((cached, id) => {
      if (!currentElementsMap.has(id)) {
        this.broadcastLocalOperation('delete', { id });
      }
    });

    // 3. Detect layer reorder
    const currentIds = currentElements.map((el: any) => el.id);
    const cachedIds = Array.from(this.cachedElements.keys());
    if (currentIds.length === cachedIds.length && JSON.stringify(currentIds) !== JSON.stringify(cachedIds)) {
      this.broadcastLocalOperation('reorder', { ids: currentIds });
    }

    // 4. Detect Selection swap
    if (state.selectedId !== this.cachedSelectedId) {
      this.broadcastLocalOperation('selection', { id: state.selectedId || null });
    }

    // 5. Detect Scene swap
    if (state.currentSceneIdx !== this.cachedSceneIdx) {
      this.broadcastLocalOperation('scene', { currentSceneIdx: state.currentSceneIdx });
    }

    // 6. Update local caches
    this.cacheIframeState();
  }

  private broadcastLocalOperation(
    type: StageOperation['type'], 
    payload: any
  ) {
    if (!this.activeRoom) return;

    const op: StageOperation = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      authorId: this.currentUserId,
      timestamp: Date.now(),
      type,
      payload,
    };

    // Register op in conflict resolver to avoid applying our own echo
    this.conflictResolver.checkAndRegisterOp(op.id);
    
    // Register local mutation timestamp in ConflictResolver for LWW
    const elementId = payload?.id || payload?.elementId;
    if (elementId) {
      this.conflictResolver.registerLocalMutation(elementId);
    }

    // Push into Firestore queue
    this.opQueue.enqueue(op, this.activeRoom.roomId);
  }

  // ── Remote Operation Application ──────────────────────────────────────────

  private applyRemoteOperation(op: StageOperation) {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const win = this.iframe.contentWindow as any;
    const state = win.state;
    if (!state) return;

    // Filter incoming operation
    if (!this.conflictResolver.shouldApplyOperation(op, this.currentUserId)) {
      return;
    }

    console.log(`[CollaborationService] Applying remote operation: ${op.type}`, op.payload);

    let needsRender = false;

    switch (op.type) {
      case 'create':
        if (state.elements) {
          state.elements.push(op.payload);
          needsRender = true;
        }
        break;

      case 'delete':
        if (state.elements) {
          state.elements = state.elements.filter((el: any) => el.id !== op.payload.id);
          if (state.selectedId === op.payload.id) {
            state.selectedId = null;
          }
          needsRender = true;
        }
        break;

      case 'move':
        if (state.elements) {
          const el = state.elements.find((e: any) => e.id === op.payload.id);
          if (el) {
            el.x = op.payload.x;
            el.y = op.payload.y;
            needsRender = true;
          }
        }
        break;

      case 'resize':
        if (state.elements) {
          const el = state.elements.find((e: any) => e.id === op.payload.id);
          if (el) {
            el.scale = op.payload.scale;
            needsRender = true;
          }
        }
        break;

      case 'rotate':
        if (state.elements) {
          const el = state.elements.find((e: any) => e.id === op.payload.id);
          if (el) {
            el.rotation = op.payload.rotation;
            needsRender = true;
          }
        }
        break;

      case 'rename':
        if (state.elements) {
          const el = state.elements.find((e: any) => e.id === op.payload.id);
          if (el) {
            el.name = op.payload.name;
            needsRender = true;
          }
        }
        break;

      case 'scene':
        if (typeof win.switchScene === 'function' && typeof op.payload.currentSceneIdx === 'number') {
          win.switchScene(op.payload.currentSceneIdx);
          needsRender = true;
        }
        break;

      case 'property':
        if (state.elements && op.payload.properties) {
          const idx = state.elements.findIndex((e: any) => e.id === op.payload.id);
          if (idx >= 0) {
            state.elements[idx] = { ...state.elements[idx], ...op.payload.properties };
            needsRender = true;
          }
        }
        break;

      case 'reorder':
        if (state.elements && Array.isArray(op.payload.ids)) {
          const idMap = new Map<string, any>(state.elements.map((el: any) => [el.id, el]));
          state.elements = op.payload.ids
            .map((id: string) => idMap.get(id))
            .filter(Boolean);
          needsRender = true;
        }
        break;

      case 'selection':
        if (!state.remoteSelections) {
          state.remoteSelections = {};
        }
        if (op.payload.id) {
          state.remoteSelections[op.authorId] = op.payload.id;
        } else {
          delete state.remoteSelections[op.authorId];
        }
        needsRender = true;
        break;
    }

    if (needsRender) {
      try {
        // Sync our local caches to match the new remote state before redrawing
        this.cacheIframeState();
        
        // Redraw canvas
        if (typeof win.renderAll === 'function') {
          win.renderAll();
        }
      } catch (err) {
        console.warn('[CollaborationService] Error redrawing iframe canvas after remote operation:', err);
      }
    }
  }

  // ── Helper functions ──────────────────────────────────────────────────────

  getPendingOperationsCount(): number {
    return this.opQueue.getPendingCount();
  }

  private getDeviceType(): Participant['device'] {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return 'android';
    }
    return 'web';
  }
}
