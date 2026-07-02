# Reusable Knowledge — Performance Optimization

This document outlines key parameters for React component optimizations and Audio context caching.

---

## 1. React Component Performance
- **Selective Rendering**: Optimize components by decoupling UI hooks from deep state selectors. Use shallow selectors to prevent unnecessary parent re-renders.
- **Listeners Purge**: Clean up event listeners in `useEffect` returns to avoid heap leaks.

Source:
* [coding_standards.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/coding_standards.md#L65-L73)

---

## 2. Audio Context & Stem Caching
- **Retry Backoff**: Downloader queues implement automatic retries (up to 2x) with exponential backoff and a 120s timeout per stem to bypass network latency issues.
- **Local IndexedDB**: Stems downloaded for multitrack practice are cached locally in IndexedDB to avoid repeated HTTP requests.

Source:
* [README.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/README.md#L68)
