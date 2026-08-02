import { RoomService } from './RoomService';
import { PresenceService } from './PresenceService';
import { FirestoreSync } from './FirestoreSync';
import { ConflictResolver } from './ConflictResolver';
import { OperationQueue } from './OperationQueue';
import { deserializeStage } from './StageDeserializer';
import { CollaboratorRoom, Participant, StageOperation, CollabConnectionState } from './Types';
import { Unsubscribe } from 'firebase/firestore';

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
    this.setConnectionState('connecting');
    this.currentUserId = userId;
    this.currentUserData = userData;

    try {
      // Run pruning of old rooms prior to creating a new one
      await RoomService.runTTLPruning();
      
      const room = await RoomService.createRoom(userId);
      this.setRoom(room);
      this.setConnectionState('connected');

      // Update local user's initial presence
      await PresenceService.updatePresence(room.roomId, userId ? { id: userId, ...userData } : { id: 'host', ...userData }, this.getDeviceType(), cursorColor, true);

      // Listen to room sub-collections
      this.setupSubscriptions(room.roomId);
      this.startHeartbeat(room.roomId, cursorColor);

      return room;
    } catch (e) {
      this.setConnectionState('disconnected');
      throw e;
    }
  }

  async joinRoom(
    shortCode: string, 
    userId: string, 
    userData: { displayName: string; avatar: string },
    cursorColor: string
  ): Promise<CollaboratorRoom> {
    this.setConnectionState('connecting');
    this.currentUserId = userId;
    this.currentUserData = userData;

    try {
      const roomId = await RoomService.getRoomIdFromCode(shortCode.toUpperCase().trim());
      if (!roomId) throw new Error('Invalid or expired room code');

      const room = await RoomService.getRoom(roomId);
      if (!room) throw new Error('Room details not found');

      // Restore stage snapshot from room host
      if (room.snapshot) {
        deserializeStage(room.snapshot, this.iframe, userId);
      }

      this.setRoom(room);
      this.setConnectionState('connected');

      // Update local presence
      await PresenceService.updatePresence(roomId, { id: userId, ...userData }, this.getDeviceType(), cursorColor, true);

      this.setupSubscriptions(roomId);
      this.startHeartbeat(roomId, cursorColor);

      return room;
    } catch (e) {
      this.setConnectionState('disconnected');
      throw e;
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

    win.__pushHistoryHijacked = true;
    console.log('[CollaborationService] Successfully hijacked iframe history');
  }

  private unhijackIframeHistory() {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const win = this.iframe.contentWindow as any;
    if (win.__pushHistoryHijacked && this.originalPushHistory) {
      win.pushHistory = this.originalPushHistory;
      delete win.__pushHistoryHijacked;
      console.log('[CollaborationService] Restored iframe history');
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

    // 3. Detect Scene swap
    if (state.currentSceneIdx !== this.cachedSceneIdx) {
      this.broadcastLocalOperation('scene', { currentSceneIdx: state.currentSceneIdx });
    }

    // 4. Update local caches
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

  private getDeviceType(): Participant['device'] {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return 'android';
    }
    return 'web';
  }
}
