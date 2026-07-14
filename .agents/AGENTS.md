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

## Performance Baseline Contract (Permanent)

### Purpose
Studio has reached a performance and responsiveness level that is now considered the permanent engineering baseline.
This baseline represents the minimum acceptable user experience.
Every future implementation must preserve or improve it.
Performance regressions are considered architectural regressions.

### User Experience Contract
Studio must feel instantaneous.
Users should never perceive unnecessary waiting.
Navigation should feel immediate.
Animations should remain smooth.
The application should always feel responsive.

### Performance Goals
Target experience:
- Instant startup
- Instant application switching
- Instant tab switching
- Instant Settings navigation
- Instant Preferences navigation
- Instant Updater navigation
- Instant modal opening
- Instant sheet opening
- Stable rendering
- No visible freezes
- No navigation lag
- No animation stutter
- No unnecessary loading indicators
The objective is to maintain a native 120 Hz experience whenever the hardware allows it.

### Architectural Principle
Performance is a feature.
Every implementation must attempt to reduce:
- render count
- allocations
- subscriptions
- listeners
- layout invalidations
- paint operations
- React reconciliation work
- Zustand updates
- startup work
- synchronous storage operations
- unnecessary component mounting
- unnecessary component recreation
- memory growth
- main-thread blocking

### Mandatory Performance Review
Every implementation must evaluate whether it:
reduces latency
reduces rendering
reduces memory
reduces startup work
reduces navigation work
reduces blocking work
If a better implementation exists with equal functionality and lower cost, it should be preferred.

### Regression Policy
The following are considered regressions:
- slower startup
- slower navigation
- slower app switching
- slower tab switching
- additional loading delays
- additional freezes
- dropped frames
- animation jitter
- black screens
- render storms
- unnecessary rerenders
- additional listeners
- additional subscriptions
- memory leaks
- long tasks
- layout thrashing
Regression fixes take priority over new features.

### Baseline Validation
Before every release verify:
- Startup remains equal or faster.
- Navigation remains equal or faster.
- Settings remain instantaneous.
- Updater remains responsive.
- Stagex remains responsive.
- Chordex remains responsive.
- Drumex remains responsive.
- Groovex remains responsive.
- Vocalex remains responsive.
- Hub remains responsive.
If any area becomes slower than the established baseline, the implementation must stop and resolve the regression before release.

### Engineering Philosophy
Never optimize only one screen.
Optimize the entire application continuously.
Small improvements accumulated across every subsystem are preferred over isolated micro-optimizations.
Every implementation should leave Studio faster than it was before.

## Performance Budget Rule

Every Pull Request, commit, feature, refactor or bug fix must leave the application in one of these states:
- Faster
- Equal performance

Never slower.

If performance becomes worse, the implementation is incomplete.
The agent must identify the regression, fix it, and revalidate before publishing.

## Repository-Wide Performance Audit Rule

Before considering any optimization complete, perform a repository-wide performance audit.
Do not optimize only the modified screen.

Evaluate the impact on:
- Startup
- Hub
- Navigation
- Settings
- Updater
- Chordex
- Drumex
- Groovex
- Stagex
- Vocalex

The optimization is complete only if no subsystem regresses.
