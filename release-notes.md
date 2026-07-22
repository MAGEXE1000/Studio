Release Date: 2026-07-21

## Added

- Production release for Studio Android v4.2.27 with unified Bottom Navigation & Login Notification stabilization.

## Fixed

- Unified Bottom Navigation Controller across Hub, Chordex, Stagex, Groovex, Drumex, Vocalex, and Settings.
- Resolved transition completion state restoration for Bottom Navigation visibility (`setVisible(true)` on `IDLE`).
- Fixed session restoration auth listener in `App.tsx` to eliminate repeated `"Signed In Successfully"` notifications on startup and restart.

## Security

- Enforced mandatory production signing key verification (`SHA-256: 900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206`) with zero debug key fallback.

## Breaking Changes

None
