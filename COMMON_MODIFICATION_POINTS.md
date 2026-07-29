# Common Modification Points

> **Purpose**: For each type of change, lists the files most commonly modified and what to watch out for.

---

## UI Changes (Visual / Layout)

### Changing a component's appearance
- **Modify**: The component's `.tsx` file under `packages/ui-shared/src/`
- **Watch**: Check both web and Android rendering — they share the same components
- **Watch**: Design tokens in `studio-core/src/lib/designTokens.ts` may override CSS

### Changing the bottom navigation
- **Modify**: `ui-shared/src/navigation/SharedNavigationBar.tsx`
- **Watch**: `navScroll.ts` (scroll-hide logic), `AnimatedIcon.tsx` (icon animations)
- **Test**: `node scripts/test-shared-navigation.mjs`

### Changing the app hub layout
- **Modify**: `ui-shared/src/components/StudioHub.tsx` (re-export shim → actual hub component)
- **Watch**: This is a massive component — locate the specific section before editing

### Adding/changing an icon
- **Modify**: `ui-shared/src/components/icons/bakaiIconLibrary.ts` (append SVG path)
- **Watch**: `appRegistry.ts` references icons by name

---

## State Changes

### Adding a new setting
- **Modify**: `studio-core/src/store/useChordStore.ts` (add field + default)
- **Modify**: Settings panel in `ui-shared/src/panels/SettingsPanel.tsx` or feature settings
- **Watch**: Persistence is automatic via `zustand/persist` — new fields get default values

### Adding a new store
- **Create**: `studio-core/src/store/useNewStore.ts`
- **Export**: `studio-core/src/index.ts`
- **Watch**: If persisted, configure `secureWriteLocal` / `secureReadLocal`

---

## Navigation Changes

### Adding a new route
- **Modify**: `navigationTypes.ts` (type), `NavigationCoordinator.ts` (defaults)
- **Modify**: Feature component to handle the route
- **Watch**: Route validation in `validation.ts`

### Changing back behavior
- **Modify**: `BackDispatcher.ts` or use `useBackHandler` hook in your component
- **Watch**: Priority queue — multiple handlers can compete

---

## Data Changes

### Adding a new chord/progression
- **Modify**: `studio-core/src/data/chords.ts` or `progressions.ts`
- **Watch**: Bundle size — these are large static files

### Adding a new song
- **Modify**: `studio-core/src/data/songs.ts`

---

## Auth & Sync Changes

### Changing auth flow
- **Modify**: `studio-core/src/lib/auth.ts` → actual auth module
- **Watch**: Sync engine attaches/detaches on auth changes — test sync after auth changes

### Adding a new sync domain
- **Modify**: Sync module in `studio-core/src/lib/sync/`
- **Watch**: Epoch counter, hash comparison, timeout settings

---

## Build & Release Changes

### Bumping version
- **Modify**: `studio-core/src/lib/appVersion.ts` → actual version in `startup/`
- **Modify**: `apps/studio-android/package.json` (version)
- **Modify**: `apps/studio-android/android/app/build.gradle` (versionCode, versionName)
- **Watch**: Use `node scripts/verify-versions-consistency.mjs` to verify

### Changing CI workflows
- **Modify**: `.github/workflows/`
- **Watch**: Platform scope — don't mix web and Android CI triggers

---

## Files That Should RARELY Be Modified

| File | Why |
|------|-----|
| `studio-core/src/lib/appVersion.ts` | Version SoT — changes trigger OTA checks |
| `studio-core/src/lib/navigation/navigationTypes.ts` | Breaking type changes affect all navigation |
| `studio-core/src/lib/security.ts` | Encryption — bugs corrupt persisted data |
| `apps/studio-android/android/app/build.gradle` | Production signing — DO NOT weaken |
| `tsconfig.base.json` | Affects all packages — do not modify without instruction |
| `pnpm-workspace.yaml` | Package registration — affects dependency resolution |

---

## Files That Are Frequently Modified (Safe)

| File | Typical Change |
|------|----------------|
| Feature components under `ui-shared/src/features/` | UI updates, bug fixes |
| `studio-core/src/store/useChordStore.ts` | New settings fields |
| `studio-core/src/i18n/*.json` | Translation updates |
| `ui-shared/src/components/icons/bakaiIconLibrary.ts` | New icons |
| `docs/architecture/*.md` | Documentation updates |
| `CHANGELOG.md` | Release notes |
