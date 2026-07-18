### Added
- Debounced lifecycle logging `localStorage` writes using an in-memory queue to eliminate UI thread blocking disk I/O.
- Deferred Web Cache Storage clearing and Service Worker unregistration out of the critical startup path to a 6-second timeout.
- Deferred `tolgee.run()` translations initialization to a 4-second delay to free up execution cycles during bootstrap.
- Deferred return-to-hub watchdog diagnostics `localStorage` writes by 4 seconds.
