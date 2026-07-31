Release Date: 2026-07-31

## Fixed
- Fixed application startup mixed-theme regression by implementing synchronous `<head>` theme restoration in `index.html` and immediate module-level token binding in `useSettingsStore.ts`.
- Restored frame-0 theme consistency across root application container, dialogs, and Bottom Navigation bar before initial layout paint.

## Improved
- Hardened Version Consistency Pipeline (`verify-versions-consistency.mjs`, `sync-version.mjs`) to automatically synchronize `root package.json`, `apps/studio-web/package.json`, `apps/studio-android/package.json`, `appVersion.ts`, `build.gradle`, and version manifests in lockstep across the monorepo.
