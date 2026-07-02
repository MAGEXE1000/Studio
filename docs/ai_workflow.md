# Chordex Studio — AI Engineering Workflow

This document defines the mandatory, enforceable operating procedures, context loading strategies, execution models, and silent verification rules for all AI sessions in the project. Compliance with this workflow is required before any task.

---

## 1. Context Loading Strategy

To conserve context window usage, reduce token cost, and prevent model attention drift, the AI must load **only** the minimum documentation required for the current task scope. Never load unnecessary documents.

### Task Category Mapping

| Task Category | Minimum Required Documentation |
|---|---|
| **Bug Fix** | `engineering_guide.md` • `ai_workflow.md` • `debugging.md` • `ai-context-map.md` |
| **Large Feature** | `engineering_guide.md` • `ai_workflow.md` • `engineering_checklists.md` • `project-structure.md` |
| **OTA Subsystem** | `engineering_guide.md` • `ai_workflow.md` • `ota_updater.md` • `firebase.md` |
| **Android / APK** | `engineering_guide.md` • `ai_workflow.md` • `android.md` • `coding_standards.md` |
| **Web / Netlify** | `engineering_guide.md` • `ai_workflow.md` • `web.md` • `coding_standards.md` |
| **Documentation** | `engineering_guide.md` • `ai_workflow.md` • `documentation_validation.md` |
| **Architecture** | `engineering_guide.md` • `ai_workflow.md` • `architecture.md` • `architecture_decisions.md` |
| **Release / CI** | `engineering_guide.md` • `ai_workflow.md` • `release_process.md` |
| **Performance** | `engineering_guide.md` • `ai_workflow.md` • `performance.md` |
| **Refactor** | `engineering_guide.md` • `ai_workflow.md` • `coding_standards.md` • `codebase-size-report.md` |

Source:
* [engineering_guide.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/engineering_guide.md#L115-L129)

---

## 2. Session Start Checklist (MANDATORY)

Before writing any code or modifying any file, the AI must output this completed checklist:

- [ ] **1. Identify Category**: Classify the task into a standard category from Section 1.
- [ ] **2. Load Minimum Docs**: Load only the specific documents mapped to that category.
- [ ] **3. Verify Scope**: Confirm boundaries (Android in `apps/studio-android`, Web in `apps/studio-web`, Shared in `packages/studio-core`).
- [ ] **4. Check Knowledge Base**: Verify if the target logic is already explained in documentation (refer to Section 6: Knowledge Reuse).
- [ ] **5. Generate Plan**: Write a concise, 1-page implementation plan (refer to Section 4).

---

## 3. Session Execution Model (8-Step Order)

To minimize error rates and avoid wasteful edit/validate loops, sessions must proceed linearly through these 8 steps:

1.  **Context Load**: Load the minimum required documents (Section 1).
2.  **Implementation Plan**: Produce a concise, maximum 1-page plan.
3.  **Approval Gate**: Wait for user/system approval if in planning mode.
4.  **Repository Analysis**: Perform all code searches, file inspections, and root-cause analysis first.
5.  **Implementation**: Execute all code changes in one clean pass. Do not write partial code.
6.  **Validations**: Run the compilers, test suites, and documentation validators.
7.  **Commit**: Create a staged commit using semantic commit formatting.
8.  **Push**: Push directly to the current working branch.

---

## 4. Planning Rule

The Implementation Plan must be concise (maximum 1 page) and detail:
- **Problem**: Short description of the issue or feature.
- **Root Cause**: The exact files and lines identified during analysis.
- **Files Affected**: Target filepaths to modify.
- **Implementation Strategy**: A step-by-step list of modifications.
- **Validation Plan**: Test commands (`pnpm test:web`, `pnpm docs:validate`) to execute.

---

## 5. Silent Execution Mode

To conserve tokens and reduce chat noise, the AI must operate silently. 

- **Do NOT Output Chatty Narrative**: Avoid conversational updates like "Let's inspect...", "Wonderful, now let's verify...", "I will check...".
- **Allowed Outputs**: The AI is permitted to expose only:
  1. The Session Start Checklist and Implementation Plan.
  2. Concise progress checkpoints (e.g. updating task status files).
  3. The final, structured Engineering Report (refer to Section 7).

---

## 6. Knowledge Reuse Policy

AI sessions must never spend time or context rediscovering information already documented in the repository.

- **Docs First**: If a configuration parameter, system component, or native bridge design is already described in the documentation, use it immediately.
- **Outdated Code Scans**: Only inspect code files to double check details if the local documentation appears outdated or explicitly requests future validation.

Source:
* [coding_standards.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/coding_standards.md#L7-L17)

---

## 7. Output Quality (Engineering Report Format)

The final response must consist only of a structured report containing:

*   **Summary**: A concise description of the completed work.
*   **Files Modified / Created**: Explicit list of filepaths.
*   **Validation**: Commands executed and results.
*   **Commit Hash**: The generated commit hash.
*   **Risks**: Any potential platform boundaries or regression impacts.
*   **Recommendations**: Clean future improvements.

Remove all conversational filler and narrative summaries.

---

## 8. Failure Recovery Protocol

If two implementation attempts fail to compile or build:
1.  **Stop Coding**: Halt all code modifications immediately.
2.  **Collect Evidence**: Gather compiler error traces.
3.  **Independent Review**: Explicitly recommend a logical review by **Claude Opus** before making any further edits.

Source:
* [troubleshooting.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/troubleshooting.md)
