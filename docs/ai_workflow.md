# Chordex Studio — AI Engineering Workflow

This document establishes the mandatory engineering workflow, model responsibility allocations, and anti-hallucination protocols for all future AI agents (including ChatGPT, Claude, and Antigravity) participating in the project.

---

## 1. Purpose

This workflow exists to ensure that every future code modification, debugging session, refactoring task, and documentation update maintains the highest level of architectural integrity. In the Chordex Studio project:
* **Quality over Speed**: Correctness, type safety, platform boundaries, and regression testing must always be prioritized over implementation speed.
* **Source of Truth**: The documentation files in `docs/` (specifically `engineering_guide.md`) are the sole sources of architectural truth. Coding must never precede a thorough audit of these files.

Source:
* `docs/engineering_guide.md`

---

## 2. AI Roles & Responsibilities

To optimize execution and validation quality, tasks are distributed across models:

### ChatGPT
* **Responsibilities**: High-level systems architecture design, implementation planning, technical planning analysis, prompt synthesis, and strategy review.
* **Constraint**: Must not edit the codebase files directly.

### Antigravity (Gemini)
* **Responsibilities**: Code implementation, repository navigation, refactoring executions, build verifications, testing suite execution, file documentation, and Git staging/commit/push commands.
* **Rule**: Must read the core engineering documents, understand platform scopes, and run verification builds before editing code.

### Claude Opus
* **Responsibilities**: Independent senior code audits, logical error analysis, deep debugging path validation, and architectural regression checks.
* **Rule**: Acts as an independent reviewer. Must not be used for massive repository-wide code updates.

Source:
* `docs/coding_standards.md`

---

## 3. Standard Implementation Workflow

Every feature implementation or system update must follow these 13 steps in exact order:

1. **Read**: Review `docs/engineering_guide.md`.
2. **Review Specific Docs**: Read platform-specific documentation matching the task (e.g. `android.md`, `ota_updater.md`, `firebase.md`).
3. **Understand**: Formulate a clear definition of the problem and desired behaviors.
4. **Locate Root Cause**: Isolate where the existing system deviates from specifications.
5. **Create Implementation Plan**: Outline file additions/modifications and alternatives.
6. **Validate Assumptions**: Double check type systems, API behaviors, and configs.
7. **Implement**: Write clean, modular, and refactored code.
8. **Build**: Execute target builds (e.g. `pnpm run build:android:web`).
9. **Test**: Run unit and integration tests (`pnpm run test:web`, `pnpm run test:android`).
10. **Regression Test**: Manually verify previous app behaviors and offline data cache access.
11. **Commit**: Stage files explicitly and write a semantic commit message.
12. **Push**: Push commits to the current remote branch.
13. **Produce Report**: Output a detailed engineering report summarizing the task.

Source:
* `docs/debugging.md`
* `docs/testing.md`

---

## 4. Bug Investigation Workflow

Never attempt to resolve bugs by applying trial-and-error changes.
* **Stop and Research**: Gather logs (`jsLogs`, `nativeLogsList`), check states (`globalOtaState`), and read related architecture files.
* **Isolate Root Cause**: Prove the exact line or transaction sequence causing the error.
* **Avoid Workarounds**: Do not wrap buggy blocks in conditional escapes. Refactor the underlying logic to fix the root cause.

Source:
* `docs/debugging.md`
* `docs/troubleshooting.md`

---

## 5. Large Feature Workflow

Before executing large features:
* **Identify Reusable Logic**: Extend existing components and hooks rather than duplicating CSS layouts or database layers.
* **Enforce Platform Boundaries**: Verify that Web-only features remain under `apps/studio-web` and `packages/ui-web`, while Android Capacitor code remains in `apps/studio-android` and `packages/ui-android`.

Source:
* `docs/architecture.md`
* `docs/coding_standards.md`

---

## 6. Documentation Rules

* **Documentation First**: When an architectural change is planned, document it in `docs/architecture_decisions.md` and update `engineering_guide.md` before making any code modifications.
* **Metadata Sources**: Important factual statements must include a `Source:` annotation at the end of the section citing the file path from which the information was derived.

Source:
* `docs/architecture_decisions.md`

---

## 7. Commit & Release Rules

### Git Commit Guidelines
* **No wildcards**: Do not run `git add .` or `git add -A`. Stage files individually.
* **Semantic Commits**: Messages must be prefixed with `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, followed by a lowercase description.

### Release Workflow
Before any release trigger:
* Confirm `versionCode` increments by exactly `+1`.
* Verify `versionName` semantic tags match.
* Run regression tests and confirm remote public CDN endpoints (`version.json`, `app-release.json`) update correctly.

Source:
* `docs/release_process.md`

---

## 8. Anti-Hallucination & Regression Rules

* **Do Not Invent**: Never invent libraries, stores, Capacitor interfaces, CSS variables, or APIs.
* **Flag Unknowns**: If a system parameter or configuration cannot be proven directly from repository files, explicitly label it as `"Current documented assumption (requires future validation)"` or remove it.
* **Cross-Platform Verification**: Verify that fixing a bug on Android does not break Web execution, and vice versa.

Source:
* `docs/known_issues.md`
