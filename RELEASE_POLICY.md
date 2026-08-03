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
ENGINEERING RELEASE
==================================================

Engineering Releases are repository maintenance only.

Examples:
- update dependencies
- update Node versions
- update GitHub Actions
- update Gradle
- update pnpm
- update scripts
- refactor tooling
- documentation
- CI improvements
- lint improvements
- test improvements
- build improvements
- repository cleanup

Engineering Releases NEVER modify the shipped application.

Engineering Releases MUST NEVER:
❌ bump versionName
❌ bump versionCode
❌ modify version.json
❌ modify app-release.json
❌ modify release metadata
❌ generate release-notes
❌ create Git tags
❌ create temporary tags
❌ delete tags
❌ recreate tags
❌ publish GitHub Releases
❌ execute Release Pipeline
❌ upload APKs
❌ publish OTA metadata
❌ deploy Firebase release metadata

Engineering Releases finish after:
Commit -> Push to main -> Final engineering report.
Release Pipeline is FORBIDDEN.

==================================================
APPLICATION RELEASE
==================================================

Application Releases modify the shipped application.

Application Releases may:
✓ bump version
✓ update changelog
✓ create GitHub Release
✓ create Git tag
✓ execute Release Pipeline
✓ publish APK
✓ publish OTA metadata
✓ update version.json
✓ update app-release.json

BUT ONLY IF THE USER EXPLICITLY REQUESTS A RELEASE.

==================================================
TAG POLICY & RELEASE TITLE POLICY
==================================================

Git tags represent public application releases.
Engineering commits MUST NEVER generate tags.
GitHub Release titles must contain ONLY the version number (e.g., 4.3.60).
Branding (Studio / Livex) in release titles is strictly forbidden.

==================================================
RELEASE IMMUTABILITY POLICY
==================================================

Published releases are immutable.
Never edit old releases, replace published APKs, overwrite release assets, or move release tags.
If a published release is incorrect, create a NEW application release with the next version.
