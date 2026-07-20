# Livex Global Engineering Workflow

This workflow is **mandatory for every task**. Never skip any step.

---

## 1. Understand the Request

Before making any code changes:

- Fully understand the requested feature or bug.
- Identify affected systems.
- Determine whether the request belongs to a shared system (see [Architectural Invariant](architectural-invariant.md)).
- Never begin implementation immediately.

## 2. Read Project Documentation

Before touching code, always read the relevant documentation inside:

- [`docs/architecture/`](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/README.md) — System architecture
- [`docs/bugs/`](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/README.md) — Bug knowledge base
- [`docs/workflows/`](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/workflows/README.md) — Engineering workflows
- [`docs/decisions/`](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/decisions/README.md) — Architectural decisions

Treat these documents as the project's source of truth. If documentation is outdated, update it before completing the task.

## 3. Investigate Before Implementing

Search the project for:

- Existing implementations
- Shared components, controllers, and services
- Design tokens and utility functions
- Reusable hooks

**Never duplicate existing functionality.** Prefer extending an existing system.

## 4. Shared-First Development

Always ask: *"Can this become a shared implementation?"*

If the answer is yes, implement it once. Every application should consume the shared implementation. Avoid per-app implementations unless absolutely necessary.

## 5. Root Cause First

Never stack fixes on top of previous fixes. Identify the real architectural cause. Fix the root cause. Temporary workarounds are not acceptable.

## 6. Implement in Small Phases

Break work into independent checkpoints. Each checkpoint must:

- Compile
- Preserve existing functionality
- Avoid regressions
- Be independently verifiable

## 7. Self Audit

After each checkpoint, perform an engineering audit. Review:

- Architecture quality
- Maintainability
- Duplicated code, controllers, or state
- Performance
- User experience
- Visual consistency with the Livex Design System

Correct issues before continuing.

## 8. Performance Review

Always inspect for:

- Unnecessary React renders
- Duplicated state or listeners
- Duplicated animation controllers
- Unnecessary effects
- Layout recalculations
- Synchronous work on the main thread
- Memory waste

Optimize whenever appropriate without sacrificing maintainability.

## 9. Update Project Memory

Whenever architecture changes → update `docs/architecture/`

Whenever an important bug is solved → update `docs/bugs/`

Whenever a new engineering workflow is discovered → update `docs/workflows/`

Whenever an important architectural decision is made → update `docs/decisions/`

**Never leave documentation outdated.**

## 10. Final Product Owner Review

Before finishing, review the work as the Livex Product Owner. Evaluate:

- User experience
- Visual consistency
- Scalability and maintainability
- Technical debt
- Performance
- Edge cases
- Future extensibility

If the implementation would not be approved for production, improve it before finishing.

## 11. Validation

Do not assume success. Verify:

- Affected functionality
- Related functionality
- TypeScript compilation (`pnpm typecheck:libs`, `pnpm typecheck:web`, `pnpm typecheck:android`)
- Production builds (`pnpm build:web`, `pnpm build:android:web`)
- No regressions

## 12. Completion

When everything is complete:

- Update documentation.
- Stage **only** modified files (never use `git add .`).
- Create a descriptive commit.
- Push to the current working branch.

If the task includes a release:

- Build Android.
- Publish the next version via `scripts/publish-release.ps1`.
- Verify OTA metadata and release assets.

---

## Core Engineering Principles

Always follow:

| Principle | Description |
|---|---|
| **SOLID** | Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion |
| **DRY** | Don't repeat yourself — one implementation, multiple consumers |
| **KISS** | Keep it simple — avoid unnecessary abstractions |
| **Clean Architecture** | Separation of concerns, dependency direction |
| **Clean Code** | Readable, self-documenting, well-named |
| **Composition over Duplication** | Compose shared primitives instead of duplicating logic |
| **Shared-First** | Shared systems over per-app systems |
| **Root-Cause Fixes** | Root-cause fixes over workarounds |
| **Long-Term Maintainability** | Long-term maintainability over short-term speed |

The objective is to keep Livex unified, maintainable, scalable, and production-ready for years.
