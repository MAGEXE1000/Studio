# Chordex Studio — AI Engineering Workflow

This document defines the mandatory, enforceable operating procedures, model responsibilities, and verification rules for all AI sessions in the project. Compliance with this workflow is required before any code modification, refactoring, or documentation task.

---

## 1. Purpose

This workflow exists to guarantee that every implementation preserves the project's architecture, prevents regressions, and isolates root causes directly.
* **Strict Quality Focus**: Correctness and structural integrity always take priority over implementation speed.
* **Repository as Truth**: The codebase configuration and source files are the ultimate source of truth. Documentation must accurately mirror the codebase.

Source:
* `docs/engineering_guide.md`

---

## 2. Session Start Checklist (MANDATORY)

Before writing any code or modifying any file, the AI must complete and output this checklist:

1. [ ] **Read Master Guide**: Read `docs/engineering_guide.md`.
2. [ ] **Read Workflow Rules**: Read `docs/ai_workflow.md` to establish current constraints.
3. [ ] **Read Relevant Documentation**: Read the platform-specific documentation corresponding to the task (e.g., `android.md`, `ota_updater.md`, `firebase.md`).
4. [ ] **Understand Platform Boundaries**: Confirm where the changes belong (Web-only under `apps/studio-web` and `packages/ui-web`, Android-only under `apps/studio-android` and `packages/ui-android`).
5. [ ] **Identify Affected Modules**: List the specific directories, packages, and files involved.
6. [ ] **Generate Implementation Plan**: Formulate a step-by-step plan details document (described in Section 4).

Source:
* `docs/engineering_guide.md`

---

## 3. The Evidence Rule (MANDATORY)

Every architectural or system statement written by the AI must be backed by concrete repository evidence.
* **Source Citations**: Whenever presenting facts, config values, or API behaviors, include a `Source:` reference mapping the relative repository file paths.
* **Handling Unknowns**: If evidence cannot be found directly in the repository code or configs, the AI must explicitly state that the parameter is unknown. **Never invent configurations, stores, variables, or system dependencies.**

Source:
* `docs/coding_standards.md`

---

## 4. Planning Rule (MANDATORY)

Before changing code, the AI must outline and print a structured implementation plan containing:

* **Problem**: A concise summary of the observed bug or the requested feature.
* **Root Cause**: The isolated line of code or structural defect causing the issue.
* **Files Affected**: The precise paths of the target files to modify.
* **Implementation Strategy**: A step-by-step description of the refactoring and coding approach.
* **Regression Risks**: Potential impacts on secondary systems (such as offline caches, database states, auth tokens, or cross-platform execution).
* **Validation Plan**: The tests, builds, and manual verification steps to execute.

Source:
* `docs/debugging.md`

---

## 5. Architecture Protection Rule (MANDATORY)

* **focused fixes**: Never replace or re-create large modules, libraries, or updater state machines when a focused fix, refactor, or simple extraction is sufficient.
* **No Redundancy**: Extend existing utilities, hooks, and services rather than introducing duplicate helper functions or parallel architectures.

Source:
* `docs/coding_standards.md`

---

## 6. Context Optimization Rule (MANDATORY)

To conserve model context limits and prevent attention drift:
* **Selective File Reads**: Read only the files necessary to perform the task.
* **Reuse Existing Code**: Check existing packages (`packages/studio-core/` and `packages/ui-shared/`) before importing third-party libraries.
* **Limit Global Scans**: Avoid scanning the entire repository unless major architectural mappings are required.

Source:
* `docs/performance.md`

---

## 7. Repository Truth Rule (MANDATORY)

* **Alignment**: Documentation files under `docs/` must align with the current state of the repository.
* **Discrepancy Resolution**: If documentation and code disagree, the AI must investigate the discrepancy first. Never overwrite code or documentation blindly. Document the resolved behavior in `docs/architecture_decisions.md`.

Source:
* `docs/architecture_decisions.md`

---

## 8. Failure Recovery Protocol (MANDATORY)

If two implementation attempts fail to compile, build, or pass regression tests:
1. **Stop Coding**: Halt all code modifications immediately.
2. **Collect Evidence**: Compile the compiler logs, state dumps, and test traces.
3. **Review Architecture**: Re-examine the baseline code design to isolate the incorrect assumption.
4. **Independent Review**: Explicitly request a code review and validation audit by **Claude Opus** before attempting further code changes.

Source:
* `docs/debugging.md`
* `docs/troubleshooting.md`

---

## 9. Commit & Release Rules (MANDATORY)

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

## 10. Post-Implementation Checklist (MANDATORY)

A task is only complete and ready to report when the following checks are met and output:

* [ ] **Build Success**: The workspace builds successfully (`pnpm build`).
* [ ] **TypeScript Type Safety**: All TypeScript checks pass with zero errors (`pnpm run typecheck:libs`).
* [ ] **No Linter Regressions**: The code complies with codebase conventions and import boundaries.
* [ ] **Android Compilation**: Native Web view builds compile cleanly without warnings.
* [ ] **Web Compilation**: Web SPA builds compile cleanly without warnings.
* [ ] **Architecture Preserved**: Reused existing hooks, stores, and utilities. No duplicate code remains.
* [ ] **Documentation Updated**: The relevant documents in `docs/` and `docs/architecture_decisions.md` have been updated.
* [ ] **Staging Verified**: Staged only modified documentation/source files explicitly.
* [ ] **Commit Created**: Semantic commit message matches guidelines.
* [ ] **Push Completed**: Pushed code directly to the active remote branch.
* [ ] **Report Output**: A detailed engineering report is produced.

Source:
* `docs/testing.md`
