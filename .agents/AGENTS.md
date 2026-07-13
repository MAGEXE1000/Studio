# Project Rules

## Permanent Android Signing Invariant
The production Android signing identity is a PERMANENT PROJECT INVARIANT.
- NEVER change the production signing certificate.
- NEVER change the production keystore.
- NEVER generate a new production keystore.
- NEVER replace the production signing key.
- NEVER publish an APK signed with any certificate other than the established production certificate.
- The production fingerprint is immutable. Every future release MUST use EXACTLY the same production signing identity.
- If the signing configuration is missing, invalid, unavailable, or cannot be verified:
  - STOP THE RELEASE.
  - Do NOT build.
  - Do NOT publish.
  - Do NOT upload.
  - Do NOT update Firebase metadata.
  - Do NOT create a GitHub Release.
  - Fail immediately with a clear error explaining why.
- The release pipeline must refuse to continue if the generated APK fingerprint differs by even one character from the production fingerprint.
- This rule must become part of the permanent release pipeline and must never be bypassed by modifying validation scripts or predeploy hooks.
- No debug keystore, temporary keystore, locally generated keystore, CI-generated keystore, fallback keystore, or alternate signing identity may EVER be used for a production release.

## Permanent APK Architecture Rule
- OTA updates are permanently deprecated. 
- The APK updater is now the single source of truth.
- Whenever a repository-wide architectural migration permanently removes a subsystem (like OTA), that subsystem must never be silently reintroduced.
- Do NOT replace dead code with compatibility wrappers.
- Fix root causes only.

## Permanent Architecture Migration Rule
Whenever a subsystem is permanently removed from Studio, AI agents must completely migrate the repository.

Removing the primary implementation is not sufficient.

Agents must also remove:
- obsolete interfaces
- obsolete enums
- obsolete settings
- obsolete release scripts
- obsolete diagnostics
- obsolete tests
- obsolete documentation
- obsolete feature flags
- obsolete workflows
- obsolete migrations
- obsolete compatibility code
- obsolete helper utilities

The repository must not contain historical remnants of removed architectures.
Future implementations must never recreate removed architectures unless explicitly instructed by the user.
