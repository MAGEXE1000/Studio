# Chordex Studio — Coding Standards

This document establishes the mandatory engineering rules, directory ownership principles, and code quality expectations for the project.

---

## 1. Core Engineering Principles

### Root-Cause-First Resolution
* Do not apply band-aids, conditional bypasses, or quick visual overrides.
* Always isolate the underlying root cause of a defect (e.g., event listeners leaking memory, concurrent database access locks, out-of-order state updates).
* Redesign and refactor the core system if a bug reveals architectural gaps.

### Refactoring & Code Grooming
* Refactor existing functions instead of copying logic or creating parallel helpers.
* Prefer clean, descriptive naming conventions. Maintain comments and docstrings.

---

## 2. Code Quality & Modularity

### Modularization Limits
* **File Length Limit**: Keep code files under `1000` lines of code. If a file grows beyond this threshold, split components, helpers, or hooks into separate module directories.
* **Component Splitting**: Do not define functional components inside rendering loops or nested helper functions. Define them at the file or module level to avoid DOM reconstruction and state loss during renders.

### Strict Typing Rules
* **No `any`**: Explicitly declare type interfaces or aliases. Avoid using `any` unless absolutely necessary (such as wrapping external untyped JavaScript libraries).
* **Strict Null Checks**: Safely handle undefined/null states by utilizing optional chaining (`?.`) and nullish coalescing (`??`) operators.
* **Store Actions**: Decouple state mutations from components by declaring them inside store actions (e.g., in Zustand).

---

## 3. Platform Boundaries & Isolation

To prevent compiler leaks or runtime exceptions across different platforms:

* **Conditional API Checks**: Never import or invoke Capacitor native interfaces without running environment checks (`isNative()`).
* **Web Boundaries**: Netlify config modifications, web landing docks, and Vite web scripts must remain in web-specific packages (`apps/studio-web` and `packages/ui-web`). They must not leak into Android packages.
* **Android Boundaries**: Native Android Gradle keys, native views, and Capacitor plugin dependencies must remain in Android packages (`apps/studio-android` and `packages/ui-android`).
* **Shared Logic**: General helpers and platform-neutral components belong in `packages/studio-core` and `packages/ui-shared`.

---

## 4. Hook Safety Rules

To comply with the React **Rules of Hooks**:

* Hooks (`useState`, `useRef`, `useEffect`, etc.) must only be called at the root of React functional components.
* Never call hooks inside conditional branches (`if`), loops, or nested rendering functions.
* Clean up hooks: `useEffect` blocks that establish listeners, register watchers, or spin up timers must return a cleanup function to release resource handles and avoid memory leaks.
  ```typescript
  useEffect(() => {
    const handle = registerListener();
    return () => {
      handle.remove();
    };
  }, []);
  ```
