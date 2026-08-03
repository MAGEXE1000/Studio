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
RELEASE STATE MACHINE & EXECUTION MODES
==================================================

The release validator implements a deterministic Release State Machine:

1. MODE 1: NORMAL RELEASE (default)
   - Zero-tolerance execution.
   - Any repository inconsistency (missing release/tag/APK/metadata mismatch) MUST STOP execution immediately.
   - Automatic recovery or silent fallbacks are strictly prohibited.
   - Concludes with explicit "Repository Status: CONSISTENT" or "Repository Status: INCONSISTENT".

2. MODE 2: RECOVERY MODE (`RECOVERY_MODE=true` / `--repair`)
   - Explicit developer-triggered repair mode only.
   - Audits inconsistencies, performs repairs, and outputs `release_recovery_report.md`.

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
