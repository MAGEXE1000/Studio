### Fixed
- Replaced timer-based auto-close after installation with a lifecycle-synchronized post-install session that stays active until Android confirms the process transition.
- The updater success screen now remains visible until the app process is replaced, the user taps Done, or a 5-minute safety timeout expires.
- All automatic update checks, lifecycle triggers, and state resets are blocked during the post-install session using process boot ID detection.
- Added detailed process-level instrumentation for post-install lifecycle events.
