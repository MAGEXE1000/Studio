# How To Implement Features

> **Purpose**: Step-by-step recipes for common modification patterns.  
> **Usage**: Before implementing a change, find the matching recipe below.

---

## Adding a New Settings Option

1. **Add the setting field** to the store:
   - If it's an app-wide setting: `packages/studio-core/src/store/useChordStore.ts` — add the field to the settings interface and default value
   - If it's a settings-specific concern: `packages/studio-core/src/store/useSettingsStore.ts`
2. **Add the UI control** to the settings panel:
   - Global settings: `packages/ui-shared/src/panels/SettingsPanel.tsx`
   - Hub settings: `packages/ui-shared/src/features/hub/StudioHubSettingsPanel.tsx`
   - Per-app settings: `packages/ui-shared/src/features/<appname>/` (e.g., `ChordexSettingsPanel.tsx`)
   - Reuse existing controls from `packages/ui-shared/src/components/SettingControls.tsx`
3. **Add translations** for the setting label:
   - `packages/studio-core/src/i18n/en.json` and `es.json`
4. **Persistence is automatic** — Zustand `persist` middleware handles it through `secureWriteLocal`
5. **Sync**: If the setting should sync across devices, add it to the sync domain mapping in the sync module

---

## Adding a New App Mode

1. **Add the app key** to `NavigationRoute.app` union type in `packages/studio-core/src/lib/navigation/navigationTypes.ts`
2. **Add default route** in `packages/studio-core/src/lib/navigation/NavigationCoordinator.ts`
3. **Add app sections** to `APP_SECTIONS` in `packages/studio-core/src/lib/navigation/appRegistry.ts`
4. **Create the feature module** under `packages/ui-shared/src/features/<appname>/`
5. **Add the app component** to `StudioHub.tsx` rendering logic
6. **Add the icon** to `packages/ui-shared/src/components/icons/bakaiIconLibrary.ts`
7. **Register in the bottom nav** (if mobile): `packages/ui-shared/src/navigation/SharedNavigationBar.tsx`
8. **Export from barrel**: `packages/ui-shared/src/features/index.ts` and `packages/ui-shared/src/index.ts`
9. **Add sync domain** (if the app has persistent data): `packages/studio-core/src/lib/sync/`
10. **Add architecture docs**: `docs/architecture/<appname>.md`

---

## Adding a New Navigation Route

1. **Define the route shape** — routes are `{ app, tab?, page?, subView?, id?, type? }` in `navigationTypes.ts`
2. **Push the route** from your component: `NavigationDispatcher.push({ app: 'chords', page: 'myNewPage' })`
3. **Handle the route** in the parent component's render logic (usually in the feature module or StudioHub)
4. **Add back handling** if needed — use `useBackHandler` hook from `studio-core`

---

## Adding a New Sync Domain

1. **Create a serializer** in `packages/studio-core/src/lib/sync/` for the new data shape
2. **Register the domain** in the sync orchestrator (follow existing patterns for chords, drums, vocalex)
3. **Add hash comparison** to prevent redundant writes
4. **Test with**: `pnpm test:android` (updater + smoke tests)

---

## Adding a New Design Token

1. **Add the token** to `packages/studio-core/src/lib/designTokens.ts`
2. **Apply via theme engine** — tokens are CSS custom properties applied to `document.documentElement`
3. **Use in CSS**: Reference as `var(--token-name)` in component styles
4. **Per-theme variants**: Add to the theme map in `themeEngine.ts`

---

## Adding a New Icon to the Bottom Navigation

1. **Add the SVG path** to `packages/ui-shared/src/components/icons/bakaiIconLibrary.ts`
   - Find the icon name and add its SVG `d` path data
2. **Reference the icon** by name in `APP_SECTIONS` (`packages/studio-core/src/lib/navigation/appRegistry.ts`)
3. **Add animation** (optional): Add a case in `AnimatedIcon.tsx` for hover/tap animations

---

## Adding a New Locale

1. **Create the locale file**: `packages/studio-core/src/i18n/<locale>.json` (copy from `en.json`)
2. **Register the language** in `packages/studio-core/src/lib/i18n.ts` → language definitions
3. **Add to i18next resources** in `packages/studio-core/src/lib/i18nSetup.ts`
4. **Translate all keys** in the new locale file

---

## Modifying the Bottom Navigation

> ⚠️ The bottom navigation bar is a highly tuned system. Changes can break animations, scroll-hide, and touch interactions.

**Files involved** (in order of risk):
1. `ui-shared/src/navigation/SharedNavigationBar.tsx` — Bar layout and rendering
2. `studio-core/src/lib/navigation/navScroll.ts` — Scroll-hide and pill-collapse engine
3. `ui-shared/src/navigation/BottomNavigationController.tsx` — Controller logic
4. `ui-shared/src/components/icons/AnimatedIcon.tsx` — Icon animations
5. `studio-core/src/lib/navigation/useBottomNavigationStore.ts` — Nav state

**Testing**: Run `node scripts/test-shared-navigation.mjs` after changes.

---

## Adding a New Lottie Animation

1. **Add the JSON file** to `packages/ui-shared/src/lottie/`
2. **Create a wrapper component** in `packages/ui-shared/src/components/lottie/`
3. **Export from barrel**: `packages/ui-shared/src/index.ts`

---

## Platform Rules (What NOT to Do)

- **Never import ui-web from Android** or ui-android from Web
- **Never import from apps/** in packages (dependency only flows down)
- **Never import from packages/** in lib (standalone libraries)
- **Never use `git add .`** — stage files explicitly
- **Never bump versions silently** — use the version manager
- Validate with: `pnpm scope:check`
