# Studio Engineering & Application Release Policy

This document is mandatory for all implementation agents (Antigravity, Claude, Gemini, Jules, Codex, etc.).

Failure to follow these rules is considered a failed implementation.

==================================================
STEP 0 — CLASSIFY THE REQUEST
==================================================

Every task MUST be classified BEFORE doing any work.

Allowed classifications:
1. ENGINEERING RELEASE
2. APPLICATION RELEASE
3. MIXED REQUEST

The classification MUST appear at the beginning of every implementation report.

==================================================
ENGINEERING RELEASE GOVERNANCE
==================================================

Engineering Releases are repository maintenance only.

Engineering Releases MUST NEVER:
❌ bump versionName or versionCode
❌ modify version.json, app-release.json, or OTA metadata
❌ create Git tags, temporary tags, or delete tags
❌ publish GitHub Releases or upload APKs
❌ execute Release Pipeline or Firebase deployment

Engineering Releases finish after:
Commit -> Push to main -> Final engineering report.
Release Pipeline is FORBIDDEN.

==================================================
APPLICATION RELEASE GOVERNANCE
==================================================

Application Releases modify the shipped application.

Application Releases MUST:
✓ Require Release Pipeline execution
✓ Require version and versionCode bump
✓ Require Release Doctor and Dry Run PASS
✓ Publish APK, OTA metadata, and Firebase metadata

BUT ONLY IF THE USER EXPLICITLY REQUESTS A RELEASE.

==================================================
RELEASE TITLE & IMMUTABILITY GOVERNANCE
==================================================

- GitHub Release titles MUST equal version numbers ONLY (e.g. 4.3.72).
- Branding (Studio / Livex) or prefixes (Release / Version) in release titles are strictly forbidden.
- Published releases, tags, and binaries are permanent and immutable.

==================================================
ARCHITECTURE LOCK & ENTRY POINT
==================================================

- Single Version Source: packages/studio-core/src/lib/startup/appVersion.ts
- Single Release Orchestrator: apps/studio-android/scripts/release-firebase.mjs
- Single Manifest: release-manifest.json
- Direct publication logic outside the official orchestrator is forbidden.
