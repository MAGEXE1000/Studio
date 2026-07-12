### Fixed
- Fixed continuous React component re-renders (App & StudioHub) that caused main-thread blocking.
- Eliminated BackDispatcher handler churn (unregister/register loops).
- Hardened performance diagnostics to accurately report render, paint, and layout counts.
