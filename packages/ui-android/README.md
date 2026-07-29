# @workspace/ui-android

> **Platform scope**: APK  
> **Entry point**: `src/index.ts`  
> **Consumers**: studio-android only

## Purpose

Android-only component overrides and re-exports. Provides an Android-specific StageCorePanel override and a DOM paint verification watchdog. Re-exports a subset of ui-shared components for Android consumption.

## Internal Structure

```
src/
├── index.ts                           # Public barrel
├── components/
│   └── StageCorePanel.tsx             # Android-specific Stage panel override
└── watchdog/
    └── paintVerification.ts           # HTML5 Canvas DOM paint verification
```

## Exports

```typescript
// Re-exports from ui-shared
export { SharedNavigationBar, UpdateIndicator, UpdateDiagnosticsSheet, StudioUpdateScreen } from '@workspace/ui-shared';

// Android-specific
export { default as StageCorePanel } from './components/StageCorePanel';
export { runPaintVerification } from './watchdog/paintVerification';
export type { PaintVerificationResult } from './watchdog/paintVerification';
```

## Dependencies

- **Workspace**: `@workspace/ui-shared`
- **External**: react, @capacitor/core

## Platform Rules

- This package is **APK scope only**
- Never import from `@workspace/ui-web`
- All web-incompatible code belongs here
