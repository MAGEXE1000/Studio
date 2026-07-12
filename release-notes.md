### Added
- Concurrent update check resolver querying both Firebase Hosting and GitHub Releases concurrently.
- Strict fallback version check logic to prevent stale CDN cache or metadata replication lag from bypassing updates.
- Resolved diagnostics FSM transition count inconsistency by aligning it with persisted Flight Recorder state.
- Cleaned up background version check timeout resource leaks.
