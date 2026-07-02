# Chordex Studio — Permissions & Feature Gating Guide

This document describes the design of the user authorization system, pricing roles, feature gates, administrative bypasses, and security constraints.

---

## 1. Roles & Pricing Plans

Chordex Studio maps authorization parameters to the user profile via five distinct roles:

*   **`free`**: Default tier. Restricts access to standard chord charts and offline sequencing.
*   **`core`**: Access to core chords generators and custom practice lists.
*   **`pro`**: Premium tier. Grants full access to advanced sequencing, multitrack mixers, and tuning monitors.
*   **`beta_tester`**: Grants access to experimental feature previews.
*   **`admin`**: System administrator. Complete bypass of all feature locks.

Source:
* [permissions.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/permissions.ts#L6-L16)

---

## 2. Feature Keys & Gating Definitions

The system registers specific feature identifier tags (`FeatureKey`) mapped to roles in the gate helper:

| Feature Key | Required Role(s) | Subscription Status | Description |
|---|---|---|---|
| **`generate_progression`** | `core` or `pro` | `'active'` or `'past_due'` | AI-generated chord progressions |
| **`advanced_stage_plots`** | `core` or `pro` | `'active'` or `'past_due'` | Sandbox layout editors |
| **`ultra_drum_kits`** | `pro` | `'active'` or `'past_due'` | Extended sampling drumkits |
| **`drum_effects_plugins`** | `pro` | `'active'` or `'past_due'` | Sampler EQ, saturation, and reverb |
| **`multitrack_mixing`** | `pro` | `'active'` or `'past_due'` | Groovex stem practice mixers |
| **`vocal_pitch_monitor`** | `pro` | `'active'` or `'past_due'` | Realtime frequency wave monitors |
| **`beta_experimental`** | `beta_tester` or `pro` | `'active'` or `'past_due'` | Beta tester dashboard tools |
| **`future_unreleased`** | `admin` (Absolute) | N/A | Restricted development features |

Source:
* [permissions.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/permissions.ts#L18-L26)

---

## 3. Gating Logic (`canUseFeature`)

To determine if a feature should render or be accessible, modules call the gate function:
```typescript
export function canUseFeature(featureKey: FeatureKey): boolean
```

### Authorization Rules:
1.  **Admin Bypass**: If the user's Firebase UID exists in the hardcoded `adminUIDs` array, or if `currentProfile.role` equals `'admin'`, the function returns `true` immediately.
2.  **Subscription Grace Period Check**: Access to paid features requires `subscriptionStatus` to be either `'active'` or `'past_due'` (allowing a grace period for billing issues). Other statuses (`'inactive'`, `'cancelled'`) return `false`.
3.  **Cascading Roles**: Evaluates the requested `featureKey` against the active role. For example, `pro` has access to `core` features, and `pro` users also have access to `beta_tester` features.

Source:
* [permissions.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/permissions.ts#L203-L240)

---

## 4. Administrative Authorization (`adminConfig.ts`)

Absolute system-wide bypasses are defined in a hardcoded list of Firebase Auth UIDs. 

```typescript
export const adminUIDs: string[] = [
  'ZAYV4Ue84BOMs8FPtjKXATFoVQt2',
  'WG8QzCUf3cbSvCTQmi6ezAUzAnr1',
  'yUgSQR5oEhTeftpCNfiBEbI56Nw1',
  'Y8UjTOUIjfeMOUG63MikYY7e5Eg1',
  'qpMDvMbm1eQgU8l59y9WMf6Oxas1',
];
```

*Note: Changes to this file require updating build files and explicit approval.*

Source:
* [adminConfig.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/adminConfig.ts#L10-L16)

---

## 5. Billing Integration Details

When using the legacy Firebase backend, the app registers a real-time listener on the Firestore path `users/{uid}`. This document contains:
- `role`: string mapping the user tier.
- `plan`: string identifying the product SKU.
- `subscriptionStatus`: status code checked by the gate.
- `subscriptionId`: Stripe identifier.
- `currentPeriodEnd`: billing period timestamp.

Source:
* [permissions.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/permissions.ts#L122-L136)

---

## 6. Current Architectural Limitations & Security Risks

> [!WARNING]
> The permissions architecture currently contains two high-priority security and functional limitations:

1.  **Supabase Backend Permissions Bypass**:
    When `syncBackendProvider` is configured as `'supabase-realtime'` (the default sync backend), `syncProfileListener` returns a default profile setting the role to `'free'` (unless the UID is in `adminUIDs`). It does not query the Supabase database. Paid users are locked to the free tier by default under Supabase.
2.  **Firestore Client-Side Self-Elevation**:
    Under Firestore (`firebase-firestore-legacy`), the rules in `firestore.rules` allow users full write access to the `users/{userId}` path:
    ```javascript
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    ```
    An authenticated client can write `{ role: 'pro', subscriptionStatus: 'active' }` directly to Firestore and bypass billing locks.

Source:
* [permissions.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/permissions.ts#L66-L78)
* [firestore.rules](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/firestore.rules#L4-L10)
