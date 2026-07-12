### Fixed
- Fixed continuous React component re-renders (App & StudioHub) that caused main-thread blocking during local sub-app navigation.
- Eliminated BackDispatcher handler churn by memoizing sheets.
- Sub-panels are now memoized to prevent render cascade.
