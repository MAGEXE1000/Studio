# Chordex Studio — Supabase Synchronization Guide

This document describes the Supabase Realtime synchronization architecture, database schema, Row Level Security (RLS) policies, storage configuration, and relationship with the core sync engine.

---

## 1. Architecture Overview

Chordex Studio implements a dual-backend sync architecture where **Supabase Realtime** serves as the default sync provider, replacing the legacy Firebase Firestore backend. 

```
┌─────────────────────────────────┐
│     Firebase Authentication     │
└────────────────┬────────────────┘
                 │ (Fetches JWT / ID Token)
                 ▼
┌─────────────────────────────────┐
│   Supabase Third-Party Bridge   │
│  - JWT Bearer Header injection  │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Supabase DB │   │   Supabase   │
│  (Postgres)  │   │  Object Storage│
└──────────────┘   └──────────────┘
```

Source:
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L41-L64)

---

## 2. Authentication Integration (The Firebase-to-Supabase Bridge)

Supabase does **not** manage user credentials directly in this application. Instead, it relies on **Firebase Authentication** as the identity provider. 

1. **Token Retrieval**: On auth state changes, the sync engine queries Firebase Auth to get the user's current JWT ID Token:
   ```typescript
   const token = await rawUser.getIdToken();
   ```
2. **Token Injection**: The token is stored in the Supabase Client module:
   ```typescript
   setFirebaseIdToken(token);
   ```
3. **Outbound Authorization**: The custom Supabase HTTP client headers getter automatically attaches this token as a Bearer Auth header for all subsequent API requests:
   ```typescript
   global: {
     headers: {
       get Authorization() {
         return currentFirebaseToken ? `Bearer ${currentFirebaseToken}` : '';
       }
     }
   }
   ```
4. **JWT Verification**: Supabase decodes the Firebase JWT using the public signing keys of the target Firebase project to authenticate the client session and supply the user's UID to PostgreSQL RLS policies.

Source:
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L250-L281)
* [supabaseClient.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/supabaseClient.ts#L28-L48)

---

## 3. Database Schema & Tables

The Supabase synchronization PostgreSQL schema is managed under the `public` schema. It contains 8 active tables initialized during migration:

| Table Name | Primary Key | Key Columns | Purpose |
|---|---|---|---|
| **`user_profiles`** | `user_id` | `display_name`, `photo_url`, `avatar_icon` | Synchronizes profile details |
| **`user_appearance_settings`** | `user_id` | `theme`, `accent_color`, `palette`, `language` | User theme options and UI configs |
| **`user_preferences`** | `user_id` | `studio_preferences`, `module_preferences` | User practice parameters and custom stores |
| **`user_devices`** | `id` | `user_id`, `device_id`, `platform`, `build_type` | Tracks active client instances and heartbeats |
| **`sync_probe`** | `id` | `user_id`, `device_id`, `nonce`, `updated_at` | Validates client write capability |
| **`debug_writes`** | `id` | `user_id`, `device_id`, `nonce`, `test_name` | Telemetry target for manual sync tests |
| **`user_app_state`** | `id` | `user_id`, `app_key`, `kind`, `body` | Generic sub-app settings configurations |
| **`user_backups`** | `id` | `user_id`, `device_id`, `label`, `data` | Manual or scheduled database snapshots |

Source:
* [init_sync.sql](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/supabase/migrations/20260605000000_init_sync.sql#L3-L192)

---

## 4. Row Level Security (RLS) Policies

Every sync table enforces Row Level Security. By default, client write/read operations are restricted to rows matching the caller's Firebase User ID.

### Policy Pattern
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_policy ON user_profiles
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);
```
This policy is applied identically to all 8 tables. The check casting `auth.uid()::text` resolves the custom Firebase UID claim inside the authenticated JWT.

Source:
* [init_sync.sql](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/supabase/migrations/20260605000000_init_sync.sql#L104-L192)

---

## 5. Realtime Channel Subscription & Synchronization

The sync provider uses a hybrid approach to synchronize changes between the local store and the cloud DB:

### A. Postgres Changes Listeners
On authentication, the provider registers a Realtime channel listening to Postgres changes in the `public` schema. It filters events where the `user_id` matches the active user ID:
```typescript
this.realtimeChannel = supabase.channel(`sync-realtime:${userId}`);

this.realtimeChannel
  .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${userId}` }, () => {
    this.refetchAllData(userId, 'realtime-user-profiles-event');
  })
  // (Identical listeners for user_appearance_settings, user_preferences, user_devices, sync_probe)
  .subscribe();
```
Upon receiving any PostgreSQL change event, the client immediately runs `refetchAllData()`, executing standard SQL queries (`supabase.from(table).select('*')`) to update local stores.

### B. Fallback Polling Loop
If network sockets drop or the Realtime connection stalls, the client runs a background fallback timer every **15 seconds** to fetch all data manually:
```typescript
this.refetchInterval = setInterval(() => {
  this.refetchAllData(userId, 'periodic-fallback');
}, 15000);
```

Source:
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L399-L404)
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L562-L606)

---

## 6. Object Storage Configuration

User avatars and media assets are stored inside **Supabase Storage**.

1. **Target Bucket**: The provider uses the `avatars` storage bucket.
2. **Operations**:
   - **Upload**: `uploadProfilePhoto()` clears the existing avatar path first and uploads the fresh image blob:
     ```typescript
     await supabase.storage.from('avatars').remove([filePath]);
     await supabase.storage.from('avatars').upload(filePath, file);
     ```
   - **Retrieve URL**: It generates a public URL using the bucket's public access policy:
     ```typescript
     const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
     ```

Source:
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L1137-L1165)

---

## 7. Relationship with sync.ts and syncEngine.ts

The Supabase provider serves as a platform implementation of the `SyncBackendProvider` interface.

* **Interface Mapping**: `supabaseRealtime.ts` maps required synchronization hooks: `pushLocalSettingsToCloud`, `pullCloudSettings`, `subscribeDevices`, and `uploadProfilePhoto`.
* **State Management**: The core engine in `sync.ts` delegates state writes to the active backend provider. It checks `syncBackendProvider` from `useChordStore` settings to route writes.
* **Stable Device ID**: Shared helper methods (such as `classifyDeviceSession` and `getDeviceDetails`) are imported by the Supabase provider directly from `syncEngine.ts` to ensure consistency with the legacy Firebase code path.

Source:
* [sync.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/sync.ts#L10-L15)
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L20-L24)

---

## 8. Operational Troubleshooting

Refer to these steps to resolve issues with the Supabase client:

### 1. `Supabase URL/anon key missing` error in Diagnostics
* **Problem**: The client defaults to Firebase Sync or reports client is not ready.
* **Resolution**: Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are defined in the target build environment `.env` file.

### 2. Realtime Channel fails to connect (`SUBSCRIBED` status never reached)
* **Problem**: The Diagnostics Panel reports `realtimeConnected: false`.
* **Resolution**: Verify database connections and ensure the user's authenticated Firebase JWT token is not expired (refresh occurs automatically via `subscribeAuth` listeners).
