# Chordex Studio — Authentication Architecture Guide

This document describes the design of the user authentication engine, platform login flows, token synchronization bridges, and session lifecycle controls.

---

## 1. Authentication Providers

Chordex Studio relies exclusively on **Firebase Authentication** for identity management. The application supports two authentication pathways:

1.  **Google Sign-In**: Federated single sign-on.
2.  **Email & Password**: Standard password authorization (`signInEmail`, `registerEmail`, `sendPasswordReset`).

Source:

- [auth.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/auth.ts#L1-L20)

---

## 2. Platform-Specific Login Flows

Because the application runs as both a native Android APK (under Capacitor) and a desktop web application, the authentication flow forks depending on the environment:

```
                  ┌──────────────────────────┐
                  │   Trigger Login Google   │
                  └────────────┬─────────────┘
                               │
                       If isNative() Check
                       ┌───────┴───────┐
                 Yes   ▼               ▼   No
      ┌─────────────────────┐     ┌─────────────────────┐
      │   Capacitor Native  │     │   Firebase Web JS   │
      │     Auth Plugin     │     │     SDK Client      │
      └──────────┬──────────┘     └──────────┬──────────┘
                 │ (Fetches idToken)         │ (Popup or Redirect)
                 ▼                           ▼
      ┌─────────────────────┐     ┌─────────────────────┐
      │  signInWithCredential│     │  GoogleAuthProvider │
      │   Web JS SDK bridge │     │  sign-in resolution │
      └─────────────────────┘     └─────────────────────┘
```

### A. Web / PWA Flow

Standard browser authentication uses the Firebase Web JS SDK directly. It attempts `signInWithPopup` first and falls back to `signInWithRedirect` if popup blockers prevent the window from opening.

### B. Native Android APK Flow

The Firebase Web JS SDK's popup/redirect workflows fail inside Capacitor's Webview envelope because sessionStorage and initial states are lost on redirect.

1.  **Native Plugin**: The app uses `@capacitor-firebase/authentication` in `skipNativeAuth: true` mode. It launches the native Google Sign-In SDK dialog to authenticate the user and obtain an `idToken`.
2.  **JS SDK Bridge**: The native plugin passes the `idToken` to the javascript execution context, which logs in to the Firebase JS SDK via `signInWithCredential(GoogleAuthProvider.credential(idToken))`.

Source:

- [auth.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/auth.ts#L70-L157)

---

## 3. Session Lifecycle & Persistence

1.  **Session Subscription**: `subscribeAuth()` registers an `onAuthStateChanged` listener. Upon mount or auth change, this listener updates the profile metadata (`syncProfileListener`) and triggers active callbacks.
2.  **Token Synchronization**: When the Supabase Sync provider is active, the auth listener extracts the current Firebase ID Token:
    ```typescript
    const token = await rawUser.getIdToken();
    setFirebaseIdToken(token);
    ```
    This token is injected into all outgoing Supabase headers.
3.  **Token Refresh**: Firebase handles token refresh (typically every 1 hour) automatically under the hood. The Supabase sync provider catches updates and re-keys the client.
4.  **Logout**: `signOut()` executes the Firebase logout function (`fbSignOut`), clears local tokens via `setFirebaseIdToken(null)`, and invokes `clearSubscriptions()` to unsubscribe all Realtime channels.

Source:

- [auth.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/auth.ts#L42-L67)
- [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L250-L295)

---

## 4. Security Considerations & Cross-UID Protection

> [!IMPORTANT]
> To prevent data contamination during rapid logout/login cycles, the sync engine implements several lifecycle safeguards:

- **Epoch Counters**: The sync engine registers an atomic `epoch` counter incremented on every `attachSyncEngine` / `detachSyncEngine` transaction. If a write callback resolves but the `epoch` has changed, the write payload is discarded.
- **Clear on Sign-Out**: Firebase and Supabase database subscriptions are immediately destroyed on logout to prevent subsequent write events from leaking data under the previous user's UID.
- **Client Sanitization**: All client databases purge temporary caches upon provider or auth changes to prevent caching data across accounts.

Source:

- [AGENTS.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/AGENTS.md#L85-L90)
