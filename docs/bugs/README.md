# Livex Bug Knowledge Base

This directory is the **permanent engineering knowledge base** for all significant bugs encountered, investigated, and resolved across the Livex platform. It is a living document that must be maintained continuously across releases, sessions, and contributors.

---

## Purpose

1. **Prevent Repeated Failures**: Before investigating any bug, check this directory first. Do not repeat failed solutions.
2. **Accelerate Resolution**: Use previous root-cause analyses and investigation notes to fast-track diagnosis of similar issues.
3. **Preserve Institutional Knowledge**: Bugs, their root causes, and architectural lessons must survive between chats, releases, and contributors.

---

## Rules

- Every significant bug gets its own markdown document.
- Documents must follow the standard template (see [TEMPLATE.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/TEMPLATE.md)).
- When a bug is resolved, update its document immediately — do not defer.
- When a similar bug appears, read the existing documentation first.
- Cross-reference related bugs using markdown links.

---

## Bug Index

| Document                                                                                                                                                 | Area                       | Severity | Status            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------- | ----------------- |
| [hub-transition-black-screen.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/hub-transition-black-screen.md)           | Navigation / Transitions   | Critical | Resolved (v4.2.1) |
| [bottom-navigation-overlap.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/bottom-navigation-overlap.md)               | Navigation / UI            | High     | Resolved (v4.2.4) |
| [back-navigation-cross-app.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/back-navigation-cross-app.md)               | Navigation / History       | High     | Resolved (v4.2.4) |
| [app-switcher-capsule-deformation.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/app-switcher-capsule-deformation.md) | Bottom Navigation / UI     | Medium   | Resolved (v4.2.1) |
| [theme-transition-jank.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/theme-transition-jank.md)                       | Theme Engine / Performance | Medium   | Resolved (v4.2.1) |
| [notification-center-scope-error.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/bugs/notification-center-scope-error.md)   | Hub / TypeScript           | Low      | Resolved (v4.2.4) |

---

## How to Add a New Bug Document

1. Copy `TEMPLATE.md` into this directory with a descriptive kebab-case filename.
2. Fill in every applicable section. Leave sections as "N/A" if truly not applicable.
3. Add an entry to the **Bug Index** table above.
4. Commit the new document alongside the fix.
