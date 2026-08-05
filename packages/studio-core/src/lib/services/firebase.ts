import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import bundledConfig from '../../../firebase.config.json';

const env = import.meta.env;
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
    _auth = getAuth(_app);
    _db = initializeFirestore(_app, {
      experimentalForceLongPolling: true,
    });
    // Enable offline persistence so reads don't fail with 'unavailable' during
    // momentary network interruptions (especially on Android/Capacitor).
    enableMultiTabIndexedDbPersistence(_db).then(() => {
      _firestoreReadyResolver();
    }).catch((err) => {
      console.warn('[firebase] offline persistence not enabled:', err.code || err.message);
      _firestoreReadyResolver();
    });
    _storage = getStorage(_app);
    setPersistence(_auth, browserLocalPersistence).catch(console.warn);
  } catch (err: any) {
    _initError = err.message || String(err);
    console.error('[firebase] initialization failed:', err);
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

export function incrementFirestoreListeners() {}
export function decrementFirestoreListeners() {}
export function incrementFirestoreWrites() {}
export function decrementFirestoreWrites() {}
export function setFirestoreLastError(error: string) {}
export function getFirestoreDiagnostics() {
  return {
    syncProvider: 'supabase-realtime',
    firestoreRuntimeActive: false,
    firestoreListenChannels: 0,
    firestoreWriteChannels: 0,
    firestoreLastError: 'none',
    firestoreInitStack: 'none',
  };
}
