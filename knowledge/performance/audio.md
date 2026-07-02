# Reusable Knowledge — Audio & Multitrack Caching

This document covers local database caching setups for multitracks.

---

## IndexedDB Stem Caching
- Stems downloaded for practice multitracks are stored in IndexedDB.
- Reduces duplicate network bandwidth downloads.
- Queue uses exponential retry timeouts (max 2 retries, 120s limit).

Source:
* [README.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/README.md#L68)
