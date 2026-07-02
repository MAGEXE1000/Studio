# Reusable Knowledge — OTA State Machine

This document details OTA checker states.

---

## Checker Priority Gating
- central updater monitors current downloading/verifying transitions.
- Watchdog timeouts interrupt hanging threads.
- Manual triggers cancel auto-checks via sequential `latestCheckId`.

Source:
* [ota_updater.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/ota_updater.md#L35-L60)
