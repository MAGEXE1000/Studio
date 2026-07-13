# Chordex Studio — Repository Health & Architecture Audit Report

This document reports the findings of the independent systems health, security, and architectural audit of the Chordex Studio monorepo.

---

## 1. Critical Issues (Highest Risk / Immediate Action Required)

This section provides comprehensive details and reference specifications.

### C-01: Supabase Realtime Sync Backend Bypasses Billing & Permissions Roles
*   **Priority**: Critical
*   **Category**: Authentication & Security Architecture
*   **Affected Files**:
    *   `packages/studio-core/src/lib/permissions.ts`
    *   `packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts`
*   **Description**: In `permissions.ts`, `syncProfileListener` checks if `syncBackendProvider` is NOT `firebase-firestore-legacy` (i.e. is the default `supabase-realtime`). If so, it returns a default profile setting the role to `'free'` (or `'admin'` if the UID exists in the hardcoded `adminUIDs` array). It never queries the Supabase database to fetch subscription status or user roles.
*   **Root Cause**: The permissions listener was only implemented for the legacy Firebase provider. The Supabase sync provider does not fetch or manage user roles/billing states.
*   **Architecture Impact**: Prevents paid users from unlocking Core, Pro, Beta Tester, or other features when Supabase Realtime is the default active sync provider.
*   **Risk if Ignored**: Paid users remain locked out of purchased capabilities, rendering paid subscription tiers non-functional.
*   **Recommended Direction**: Implement a user profile query and subscription listener inside `supabaseRealtime.ts` that triggers `notifyProfileChange` on status changes.
*   **Estimated Complexity**: Medium

Source:
* `packages/studio-core/src/lib/permissions.ts#L66-L78`

---

### C-02: Massive Code Duplication in Stagex Wrapper Components
*   **Priority**: Critical
*   **Category**: Code Duplication / Maintainability
*   **Affected Files**:
    *   `packages/ui-android/src/components/StageCorePanel.tsx` (3,078 lines)
    *   `packages/ui-shared/src/components/StageCorePanel.tsx` (2,883 lines)
*   **Description**: The monorepo has two extremely large, nearly identical implementations of the Stagex iframe postMessage bridge, canvas layout tracking, coordinate transformations, and preset management.
*   **Root Cause**: Copied-and-pasted code to satisfy minor layout variations between Web and Android rather than abstracting bridge interactions.
*   **Architecture Impact**: Severe maintenance risk. If a bug is fixed or a coordinate transform is updated in one wrapper, it is easily missed in the other.
*   **Risk if Ignored**: Mismatches between Web and Android canvas rendering coordinates, broken postMessage commands, and double the review overhead.
*   **Recommended Direction**: Extract the common iframe messaging, coordinate calculation, and canvas event logic into a custom React hook (e.g. `useStagexBridge`) or a shared base component under `packages/ui-shared`.
*   **Estimated Complexity**: High

Source:
* `docs/codebase-size-report.md#L62-L63`

---

### C-03: Oversized Components & Monolithic UI Views
*   **Priority**: Critical
*   **Category**: Code Size / Readability
*   **Affected Files**:
    *   `packages/ui-shared/src/components/StudioHub.tsx` (6,868 lines)
    *   `packages/ui-shared/src/panels/DrumEditor.tsx` (5,547 lines)
    *   `packages/ui-shared/src/components/AccountCard.tsx` (4,711 lines)
    *   `packages/ui-shared/src/components/DevToolsDashboard.tsx` (4,382 lines)
    *   `apps/studio-android/src/EmergencyDebugOverlay.tsx` (3,949 lines)
    *   `packages/ui-shared/src/panels/SongsPanel.tsx` (3,880 lines)
*   **Description**: UI components regularly exceed several thousand lines, housing internal hooks, data grids, API transactions, and deep nested child render structures in single files.
*   **Root Cause**: Lack of file modularization guidelines and component decomposition rules.
*   **Architecture Impact**: High context cost for AI engines, poor reviewability for developers, and high probability of rule-of-hooks violations.
*   **Risk if Ignored**: Render performance degradation, high developer friction, and React hook sequence compile failures on edits.
*   **Recommended Direction**: Decompose large components into sub-folders containing discrete sub-views (e.g. split `AccountCard.tsx` into pricing models, invoices tables, and payment inputs).
*   **Estimated Complexity**: High

Source:
* `docs/codebase-size-report.md#L7-L57`

---

## 2. High Priority Issues (Major Architecture Weaknesses)

This section provides comprehensive details and reference specifications.

### H-01: Monolithic Sync Engine in `sync.ts`
*   **Priority**: High
*   **Category**: Single Responsibility Principle (SRP) Violation
*   **Affected Files**:
    *   `packages/studio-core/src/lib/sync.ts` (2,866 lines)
*   **Description**: `sync.ts` acts as a monolith handling device session registrations, classify session states, photo asset uploading, heartbeat interval timers, and local storage writes.
*   **Root Cause**: Organic growth of utility helpers inside the primary sync transactions file.
*   **Architecture Impact**: Hard to test individual components (e.g. heartbeat tracking) in isolation.
*   **Risk if Ignored**: Concurrency locks deadlock sync loops, and file changes risk breaking unrelated features.
*   **Recommended Direction**: Split `sync.ts` into specific modules under a new directory: `packages/studio-core/src/lib/sync/` (e.g. `heartbeat.ts`, `sessionManager.ts`, `imageUploader.ts`).
*   **Estimated Complexity**: Medium

Source:
* `packages/studio-core/src/lib/sync.ts`

---

### H-02: Conflicting Sync Backend Logic & Code Duplication
*   **Priority**: High
*   **Category**: DRY (Don't Repeat Yourself) Violation
*   **Affected Files**:
    *   `packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts` (1,354 lines)
    *   `packages/studio-core/src/lib/syncBackends/firebaseLegacy.ts` (1,332 lines)
*   **Description**: Both backend providers duplicate device heartbeats, classifying metadata, session revocations, and registration checks.
*   **Root Cause**: Bumping legacy Firebase to Supabase Realtime without abstracting shared logic to the base class level.
*   **Risk if Ignored**: Redundant database queries, inconsistent device registration rules.
*   **Recommended Direction**: Move device registration, heartbeat intervals, and session classification logic to the base `SyncBackendProvider` or abstract helpers.
*   **Estimated Complexity**: Medium

Source:
* `packages/studio-core/src/lib/syncBackends/index.ts`

---

### H-03: Memory & Timer Leaks in DevTools UI Panels
*   **Priority**: High
*   **Category**: Memory leaks
*   **Affected Files**:
    *   `packages/ui-shared/src/components/DevToolsDashboard.tsx`
*   **Description**: Toast alerts called via `showToast()` trigger `setTimeout` calls that have no clear cleanup hooks, referencing state variables directly.
*   **Root Cause**: Unsafe async callbacks scheduled without ref-clear tracking.
*   **Architecture Impact**: Potential memory leaks when the dashboard unmounts before timeouts complete.
*   **Risk if Ignored**: Leaks and warning logs on rapid dashboard toggles during local testing.
*   **Recommended Direction**: Refactor toasts to use standard React ref timer handles cleared in `useEffect` unmount scopes.
*   **Estimated Complexity**: Low

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx#L630-L633`

---

## 3. Medium Priority Issues (Styling & Performance Risks)

This section provides comprehensive details and reference specifications.

### M-01: Synchronously Loaded Large Progression Maps Data
*   **Priority**: Medium
*   **Category**: Performance / Bundle Optimization
*   **Affected Files**:
    *   `packages/studio-core/src/data/progressions.ts` (2,201 lines)
*   **Description**: Contains massive nested arrays mapping lyrics and chord tracks loaded synchronously into JS bundles.
*   **Root Cause**: Hardcoding static databases directly inside TypeScript variables.
*   **Architecture Impact**: Bloats initial JavaScript bundle download sizes, increasing startup parse times on low-end Android mobile devices.
*   **Risk if Ignored**: Increased time-to-interactive metrics.
*   **Recommended Direction**: Convert `progressions.ts` to a JSON data asset loaded dynamically on-demand inside the Chordex view.
*   **Estimated Complexity**: Medium

Source:
* `docs/codebase-size-report.md#L67`

---

### M-02: Absence of Global Design System Tokens
*   **Priority**: Medium
*   **Category**: Maintainability / Code Smell
*   **Affected Files**: All UI packages
*   **Description**: CSS hex styles (e.g. cards and buttons) are hardcoded inline (e.g., `#0e0e0e`, `#007aff`) instead of mapping to central CSS variables.
*   **Root Cause**: Inline Tailwind styles bypass unified stylesheets.
*   **Architecture Impact**: Hard to implement alternative themes (such as light themes or dynamic contrast).
*   **Risk if Ignored**: Layouts look inconsistent on newer panel edits.
*   **Recommended Direction**: Declare standard Material 3 colors in a central CSS stylesheet (such as `apps/studio-android/src/index.css`) and reference them.
*   **Estimated Complexity**: Medium

---

## 4. Low Priority Issues & Quick Wins

This section provides comprehensive details and reference specifications.

### L-01: Legacy Firebase Sync Backend Preservation
*   **Priority**: Low
*   **Category**: Technical Debt
*   **Affected Files**:
    *   `packages/studio-core/src/lib/syncBackends/firebaseLegacy.ts`
*   **Description**: This legacy file is preserved as an optional fallback sync provider but is outdated and complex.
*   **Recommended Direction**: Deprecate and remove `firebaseLegacy.ts` once Supabase Realtime synchronization is validated for all paid roles.
*   **Estimated Complexity**: Low

---

## 5. Recommended Implementation Roadmap

```
  [Phase 1: Security & DR]       [Phase 2: Modular Core]      [Phase 3: UI Splitting]
  - Resolve Supabase Roles    ───> - Split sync.ts Heartbeat ───> - Extract Stagex Bridge
  - Fix Dashboard Leaks            - JSON dynamic data            - Split StudioHub / AccountCard
```

This section provides comprehensive details and reference specifications.

### Phase 1: Security & Lifecycle Protection (Target: Next Sprint)
*   **Action**: Resolve Supabase user role query logic (C-01) and clear timer leaks in `DevToolsDashboard` (H-03).
*   **Effort**: Low (approx. 2 days)
*   **Risk**: Low
*   **Impact**: High (Restores paid tiers capability under default configuration).
*   **Dependencies**: None.

### Phase 2: Core Modularization (Target: Mid-Term)
*   **Action**: Split `sync.ts` (H-01), unify backend heartbeat managers (H-02), and move static progression maps to lazy-loaded JSON assets (M-01).
*   **Effort**: Medium (approx. 1 week)
*   **Risk**: Medium (Required thorough regression checking on database writes).
*   **Impact**: Medium (Improves startup speeds and code testability).
*   **Dependencies**: Phase 1 verification.

### Phase 3: Component Decomposition (Target: Long-Term)
*   **Action**: Unify Stagex wrappers (C-02) and modularize giant UI views like `StudioHub.tsx` (C-03).
*   **Effort**: High (approx. 2 weeks)
*   **Risk**: High (Visual refactoring requires safe notches and safe gesture layouts testing).
*   **Impact**: High (Reduces developer friction and model context footprint).
*   **Dependencies**: Phase 2 verification.
