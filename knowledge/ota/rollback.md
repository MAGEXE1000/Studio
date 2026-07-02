# Reusable Knowledge — OTA Failovers

This document tracks OTA failure fallbacks.

---

## Failure Watchdogs
- Monitors consecutive boot initialization errors.
- Failure threshold: `consecutiveFailures: 5`
- Purges corrupt binary folders and falls back to baseline bundles.

Source:
* [troubleshooting.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/troubleshooting.md#L65-L77)
