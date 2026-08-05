# Firestore Offline Error During StageX Collaboration

## Symptoms
When users attempt to "Host Room" or "Join Room" in StageX collaboration, they frequently encounter:
`FirebaseError[unavailable]: Failed to get document because the client is offline.`

The error persists even when the device has a strong internet connection, and despite earlier fixes to operation queues and offline persistence configuration.

## Root Cause
The root cause is a race condition in `src/lib/services/firebase.ts` between Firestore's persistence initialization and the first network call.

The `init()` function configures Firestore synchronously, but calls `enableMultiTabIndexedDbPersistence(_db)` without awaiting its Promise. The function returns immediately, making `getFirebaseDb()` hand back a Firestore instance whose internal persistence layer is still initializing.

When `RoomService.createRoom()` immediately calls `getDoc()` on that instance, the Firestore SDK:
1. Cannot serve from cache (IndexedDB not ready)
2. Cannot serve from network (the `experimentalForceLongPolling: true` setting takes several seconds to establish a connection, which hasn't happened yet)

As a result, the SDK assumes it is offline and throws the `unavailable` error. 

This issue exclusively affects the collaboration module because it's the only subsystem that triggers lazy initialization of Firestore and immediately attempts a read. The main cloud sync engine uses Supabase Realtime, avoiding this path.

## Fix Implemented
Introduced an initialization gate in `firebase.ts`:
```typescript
export function waitForFirestoreReady(): Promise<void> {
  init();
  return _firestoreReadyPromise || Promise.resolve();
}
```

This Promise resolves only after `enableMultiTabIndexedDbPersistence` completes or fails. The following services were updated to `await waitForFirestoreReady()` before requesting the Firestore DB and executing operations:
- `RoomService.ts`
- `PresenceService.ts`
- `FirestoreSync.ts`
- `OperationQueue.ts`

This ensures that the SDK has fully initialized its internal state before the first network call is attempted, entirely mitigating the race condition without impacting the synchronous `getFirebaseDb()` API for other potential consumers.
