# Context Minimization Map

This map defines the absolute minimal context targets for future AI sessions. To conserve token counts and maintain model attention, future sessions must restrict file reads to the specified directories and files.

---

## 1. Context Scopes per Feature Area

### If working on OTA Updates:

- **Read only**:
  -
  -
  -
  - [knowledge/updater/packageinstaller.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/updater/packageinstaller.md)
- **Inspect directory**:
  - `packages/studio-core/src/lib/updater/`

### If working on Firebase & Sync Backend:

- **Read only**:
  - [firebase.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/firebase.md)
  - [supabase.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/supabase.md)
  - [knowledge/firebase/client.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/firebase/client.md)
  - [knowledge/firebase/security.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/firebase/security.md)
- **Inspect directory**:
  - `packages/studio-core/src/lib/syncBackends/`

### If working on Android UI & Safe Areas:

- **Read only**:
  - [android.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/android.md)
  - [knowledge/android/safe-area.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/android/safe-area.md)
  - [knowledge/android/capacitor.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/android/capacitor.md)
- **Inspect directory**:
  - `packages/ui-android/src/`

### If working on Stagex Backend integration:

- **Read only**:
  - [architecture.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture.md)
  - [knowledge/architecture/monorepo.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/architecture/monorepo.md)
- **Inspect directory**:
  - `lib/api-client-react/`

### If working on Chordex Practice suite logic:

- **Read only**:
  - [engineering_guide.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/engineering_guide.md)
  - [knowledge/react/hooks.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/react/hooks.md)
- **Inspect directory**:
  - `packages/studio-core/src/store/`

### If Debugging WebView or Database states:

- **Read only**:
  - [debugging.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/debugging.md)
  - [knowledge/debugging/webview.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/debugging/webview.md)
  - [knowledge/debugging/diagnostics-ui.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/debugging/diagnostics-ui.md)
- **Inspect file**:
  - `packages/ui-shared/src/components/DevToolsDashboard.tsx`

### If Releasing packages or updating CI:

- **Read only**:
  - [release_process.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/release_process.md)
  - [knowledge/android/build.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/android/build.md)
  - [knowledge/updater/keystore.md](file:///C:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/knowledge/updater/keystore.md)
- **Inspect directory**:
  - `.github/workflows/`

Source:

- `docs/ai_workflow.md`
