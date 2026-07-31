Release Date: 2026-07-31

## Improved
- Completed Studio Theme System stabilization pass with full White (`light`), Dark (`dark`), and AMOLED (`amoled`) theme support across Updater dialogs and indicators (`StudioUpdateScreen.tsx`, `UpdateIndicator.tsx`).
- Simplified OTA download progress UI with single `Downloading update` status label above the progress bar and exact 1:1 progress precision (percentage on far right only).
- Sanitized UTF-8 encoding pipeline across release notes parsing and changelog sheets to eliminate corrupted Mojibake sequences (`•`, ``, `…`).
- Fixed Chordex tab navigation sync regression in `SubAppWrapper` (`SharedAppShell.tsx`), restoring tab switching between Songs, Practice, Library, and Settings.
- Refactored Pinned Actions UI in Studio Hub to use White Theme surface tokens instead of hardcoded dark glass backgrounds.
