### Fixed
- Aligned Chordex layout top offsets correctly using the shared ScreenScaffold system, fixing overlapping content with the status bar on Android.
- Fixed Chordex tab routing to navigate internally inside Chordex instead of launching Hub settings.
- Removed transition locked guards (cooldown) from NavigationDispatcher to make spam clicks and rapid tab transitions instant everywhere.
- Replaced the custom copy-pasted animation logic in Android project with SharedNavigationContainer to unify transition performance.
