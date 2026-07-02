# Reusable Knowledge — React Development Rules

This document outlines code quality standards, hook safety rules, and rendering rules.

---

## 1. Rules of Hooks
To comply with functional component render behaviors and prevent memory leak vulnerabilities:
- **Root Invocation Only**: Hooks (e.g., `useState`, `useRef`, `useEffect`) must only be called at the top level of functional components.
- **No Conditional Hooks**: Hooks must never be nested inside loop structures, conditional checks (`if`), or helper rendering methods.
- **Resource Cleanup**: Any `useEffect` block setting up event listeners, periodic interval timers, or subscription handles must return a cleanup function:
  ```typescript
  useEffect(() => {
    const handle = addListener();
    return () => handle.remove();
  }, []);
  ```

Source:
* [coding_standards.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/coding_standards.md#L59-L74)

---

## 2. Component Structure
- **No Inline Functional Declarations**: Do not declare sub-components inside rendering cycles or loop return methods. Define components independently at the module level to prevent full DOM tree reconstruction on renders.

Source:
* [coding_standards.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/coding_standards.md#L29-L30)
