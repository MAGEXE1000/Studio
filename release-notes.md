Release Date: 2026-07-25

## Fixed
- Fixed StudioToggle double-firing and flickering by eliminating `<label>` wrapping `<button>` structure and implementing smooth 60 FPS CSS spring transitions.
- Fixed Freeze UI interaction leaking: injected airtight global CSS rules and capturing event listeners to block 100% of application touches, clicks, scrolls, gestures, navigation, and keyboard inputs while leaving Developer Inspector controls fully active.

## Improved
- Redesigned Debug Panel to a sleek Samsung Edge Panel style collapsible right-side drawer with translucent handle, 60 FPS spring slide transition, and blurred backdrop filter.
- Standardized all Copy buttons across the Developer Inspector with a shared `CopyButton` component featuring spring scale animations, crossfade icons (`content_copy` -> `check`), label swaps, 1.4s auto-revert, and fallback clipboard handling.
- Global Report Compression: introduced `compressReportText(...)` utility to ensure all copied diagnostic reports remain concise (< 10 pages / < 250 lines).
