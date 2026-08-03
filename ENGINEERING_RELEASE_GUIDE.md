# Studio Engineering Release Guide

This document is the authoritative guide to the Studio Release Infrastructure, Release State Machine, Execution Modes, E2E Release Pipeline Simulator, diagnostic tooling, and release workflows.

---

## E2E Release Pipeline Simulator (`pnpm release:e2e`)

The E2E Release Pipeline Simulator validates the complete 10-step release lifecycle inside an isolated sandbox (`.temp/release-e2e/`) without modifying any production resources:

```
                  ┌─────────────────────────────────────┐
                  │ 1. Preflight Repository Audit       │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 2. Temporary Manifest Generation    │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 3. In-Memory GitHub Release         │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 4. Sandbox Firebase & OTA Simulation│
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 5. Rollback & Interrupted Recovery  │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 6. Contract Verification & Reports  │
                  └─────────────────────────────────────┘
```

### Subsystem Commands
- `pnpm release:e2e` — Runs complete 10-step simulated release pipeline inside `.temp/release-e2e/`. Outputs `release-e2e-report.md`, `release-e2e-report.html`, `release-e2e-summary.json`, and `release-e2e-manifest.json`.
- `pnpm test:release-e2e` — Automated test suite for release E2E simulation scenarios.

---

## Governance & Execution Modes

1. **MODE 1: NORMAL RELEASE (default)**: Zero-tolerance validation. If ANY repository inconsistency (missing tag, missing APK asset, metadata mismatch) is detected, execution stops immediately with status `BLOCKED` (exit code 1). Automatic fallbacks or silent recoveries are strictly forbidden.
2. **MODE 2: RECOVERY MODE (`RECOVERY_MODE=true` or `--repair`)**: Only executes when explicitly requested by a developer or CI repair workflow. Audits inconsistency, performs repairs or metadata alignment, and generates `release_recovery_report.md`.

---

## Subsystem Inventory

- `apps/studio-android/scripts/release/`: Canonical release utilities (GitHub API, Firebase fetcher, asset discovery, diagnostics, manifest, failure reporter).
- `apps/studio-android/scripts/releaseDoctor/`: Ecosystem health checker (`pnpm release:doctor`).
- `apps/studio-android/scripts/releaseDryRun/`: Pre-publication dry run engine (`pnpm release:dry-run`).
- `apps/studio-android/scripts/releaseTimeline/`: Historical release alignment viewer (`pnpm release:timeline`).
- `apps/studio-android/scripts/releaseLint/`: Architecture linter (`pnpm release:lint`).
- `apps/studio-android/scripts/releaseAudit/`: Governance auditor (`pnpm release:audit`).
- `apps/studio-android/scripts/releaseE2E/`: E2E Release Pipeline Simulator (`pnpm release:e2e`).
