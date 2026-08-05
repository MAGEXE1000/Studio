import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import bundledConfig from '../../../firebase.config.json';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
function pick(envValue: string | undefined, fallback: string | undefined): string | undefined {
  const v = (envValue ?? '').trim();
  return v ? v : fallback;
}

const config = {
  apiKey: pick(env.VITE_FIREBASE_API_KEY as string | undefined, bundledConfig.apiKey),
  authDomain: pick(env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined, bundledConfig.authDomain),
  projectId: pick(env.VITE_FIREBASE_PROJECT_ID as string | undefined, bundledConfig.projectId),
  storageBucket: pick(
    env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    bundledConfig.storageBucket,
  ),
  messagingSenderId: pick(
    env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    bundledConfig.messagingSenderId,
  ),
  appId: pick(env.VITE_FIREBASE_APP_ID as string | undefined, bundledConfig.appId),
  databaseId: pick(env.VITE_FIREBASE_DATABASE_ID as string | undefined, (bundledConfig as any).databaseId),
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _initError: string | null = null;

let _firestoreReadyResolver: () => void;
let _firestoreReadyPromise: Promise<void> | null = null;

function init() {
  if (_app || _initError) return;
  if (!isFirebaseConfigured) {
    _initError = `Missing config fields`;
    return;
  }
  
  if (!_firestoreReadyPromise) {
    _firestoreReadyPromise = new Promise<void>((resolve) => {
      _firestoreReadyResolver = resolve;
    });
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      _app = apps[0];
    } else {
      _app = initializeApp({
        apiKey: config.apiKey!,
        authDomain: config.authDomain!,
        projectId: config.projectId!,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId!,
      });
    }
    console.log('[FirebaseInit] Getting Auth instance...');
    _auth = getAuth(_app);
    console.log('[FirebaseInit] Auth instance acquired.');

    console.log('[FirebaseInit] Initializing Firestore instance...');
    // CRITICAL: On Android/Capacitor (WebView), standard WebChannel streams often get blocked
    // or fail to connect (hanging permanently in 'disconnected' state).
    // Forcing experimentalForceLongPolling: true resolves this network transport limitation completely.
    _db = config.databaseId
      ? initializeFirestore(_app, { experimentalForceLongPolling: true }, config.databaseId)
      : initializeFirestore(_app, { experimentalForceLongPolling: true });
    console.log('[FirebaseInit] Firestore instance initialized (forced long polling enabled).');

    // Enable offline persistence so reads don't fail with 'unavailable' during
    // momentary network interruptions (especially on Android/Capacitor).
    if (_db) {
      console.log('[FirebaseInit] Enabling Firestore offline persistence...');
      enableMultiTabIndexedDbPersistence(_db).then(() => {
        console.log('[FirebaseInit] Firestore multi-tab IndexedDB persistence enabled successfully.');
        _firestoreReadyResolver();
      }).catch((err) => {
        console.warn('[FirebaseInit] Firestore offline persistence could not be enabled:', err.code || err.message, err);
        _firestoreReadyResolver();
      });
    }
    console.log('[FirebaseInit] Getting Storage instance...');
    _storage = getStorage(_app);
    console.log('[FirebaseInit] Storage instance acquired.');

    console.log('[FirebaseInit] Setting Auth persistence...');
    setPersistence(_auth, browserLocalPersistence)
      .then(() => console.log('[FirebaseInit] Auth browserLocalPersistence set successfully.'))
      .catch((err) => console.warn('[FirebaseInit] Failed to set Auth persistence:', err));
  } catch (err: any) {
    _initError = err.message || String(err);
    console.error('[FirebaseInit] [ERROR] Firebase initialization failed with exception:', err);
    if (err.stack) {
      console.error('[FirebaseInit] [ERROR] Stack trace:', err.stack);
    }
    if (_firestoreReadyResolver) _firestoreReadyResolver();
  }
}

export function waitForFirestoreReady(): Promise<void> {
  init();
  return _firestoreReadyPromise || Promise.resolve();
}

export function getFirebaseApp(): FirebaseApp | null {
  init();
  return _app;
}

export function getFirebaseInitError(): string | null {
  init();
  return _initError;
}

export function getFirebaseAuth(): Auth | null {
  init();
  return _auth;
}

export function getFirebaseDb(): Firestore | null {
  init();
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  init();
  return _storage;
}

export function getFirebaseProjectId(): string {
  init();
  return _app?.options.projectId || 'Not Configured';
}

export function getFirebaseConfigDetails() {
  init();
  const app = _app;
  return {
    projectId: app?.options.projectId || 'Not Configured',
    appId: app?.options.appId || 'Not Configured',
    authDomain: app?.options.authDomain || 'Not Configured',
    storageBucket: app?.options.storageBucket || 'Not Configured',
    appName: app?.name || 'None',
    appsCount: getApps().length,
    initError: _initError || 'None',
  };
}

export const googleProvider = new GoogleAuthProvider();

let _activeListeners = 0;
let _activeWrites = 0;
let _lastError = 'none';

export function incrementFirestoreListeners() {
  _activeListeners++;
}
export function decrementFirestoreListeners() {
  _activeListeners = Math.max(0, _activeListeners - 1);
}
export function incrementFirestoreWrites() {
  _activeWrites++;
}
export function decrementFirestoreWrites() {
  _activeWrites = Math.max(0, _activeWrites - 1);
}
export function setFirestoreLastError(error: string) {
  _lastError = error;
}

export function getFirestoreDiagnostics() {
  init();
  const app = _app;
  return {
    syncProvider: 'supabase-realtime',
    firestoreRuntimeActive: Boolean(_db),
    firestoreListenChannels: _activeListeners,
    firestoreWriteChannels: _activeWrites,
    firestoreLastError: _lastError,
    firestoreInitStack: _initError || 'none',
    projectId: app?.options.projectId || 'Not Configured',
    databaseId: config.databaseId || '(default)',
    appId: app?.options.appId || 'Not Configured',
    authDomain: app?.options.authDomain || 'Not Configured',
    storageBucket: app?.options.storageBucket || 'Not Configured',
  };
}
