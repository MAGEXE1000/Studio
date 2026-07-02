# Reusable Knowledge — Firebase Configuration

This document specifies the Firebase client architecture, security rules, and environment overrides.

---

## 1. Client Configuration Resolution
Firebase initializes client credentials via a two-layer resolution mechanism:
1.  **Environment Variables**: If variables like `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, and `VITE_FIREBASE_PROJECT_ID` are present in `.env` files, they override all default configurations. This supports targeting development or staging databases without altering source code.
2.  **Bundled Configuration**: If environment overrides are absent, credentials fallback to a committed workspace JSON file located at `packages/studio-core/firebase.config.json` to make APK builds work out of the box.

Source:
* [firebase.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/firebase.ts#L24-L52)

---

## 2. Firestore Security Rules
All Firestore databases must enforce authentication checks and document path gating rules:
- **Profile Matching**: Document paths under `users/{userId}` must restrict read and write permissions to sessions where `request.auth.uid == userId`.
- **Global Write Gates**: Modify rules only with explicit approval. Ensure no-op rules are rejected to prevent unauthorized profile elevations.

Source:
* [firestore.rules](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/firestore.rules#L4-L10)
