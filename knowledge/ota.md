# Reusable Knowledge — Over-the-Air (OTA) Updates

This document describes the native OTA state transition guards and client-side failover mechanics.

---

## 1. OTA Updater State Machine
All dynamic swaps and updater sessions are governed by a centralized state machine to prevent race conditions:
- **Watchdog Timeouts**: Monitor downloading and verifying states with watchdog timers. If transient states hang, abort the transaction to avoid lockup.
- **Priority Checking**: User-triggered manual updates immediately override and cancel background checker executions using a sequential `latestCheckId` counter.

Source:
* [ota_updater.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/ota_updater.md#L35-L60)

---

## 2. Client-Side Rollback Fallbacks
If an installed bundle fails to boot:
- **Failure Threshold**: The native initialization wrapper monitors booting states. If it detects `consecutiveFailures: 5`, it automatically rolls back, purges cached binaries, and restarts with the default stable bundle.

Source:
* [troubleshooting.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/troubleshooting.md#L65-L77)
