# Studio Changelog

Each release on the OTA channel is described in its own section below.
The release script (`scripts/release-firebase.mjs`) reads this file and
copies the bullet list under the section that matches the current
`APP_VERSION` into `version.json`'s `changelog` field, so the in-app
"Update available" modal always shows the actual changes that ship in
that bundle.

Conventions:
- One H2 heading per version: `## X.Y.Z` (no leading `v`).
- Bullets start with `- ` and use plain English a non-technical user
  can parse. Keep each line short — the modal's text area is narrow.

## 4.1.6

### Added
- Redesigned the Chordex Library dashboard layout with Chord of the Day, Recently Practiced cards, and Categories grid.
- Redesigned the Chordex Songs setlist search bar, circular action buttons, and modernized empty states.
- Implemented the Ink Toggle Dark Mode transition with metaball liquid teardrop physics and upward rising wave compositing.
- Simplified navigation by deprecating the redundant Chords tab and panel routes.

## 4.1.5

### Added
- Debounced lifecycle logging `localStorage` writes using an in-memory queue to eliminate UI thread blocking disk I/O.
- Deferred Web Cache Storage clearing and Service Worker unregistration out of the critical startup path to a 6-second timeout.
- Deferred `tolgee.run()` translations initialization to a 4-second delay to free up execution cycles during bootstrap.
- Deferred return-to-hub watchdog diagnostics `localStorage` writes by 4 seconds.

## 4.1.4

### Added
- Deferred StudioHub and sub-app wrapper chunk-loading and mounting until the logo drawing phase completes.
- Eliminated reveal stage checking timers by introducing fully event-driven 'studio-startup-complete' listeners.
- Prevented JavaScript thread scheduling pauses during logo forming, locking frame pacing to native hardware limits.

## 4.1.3

### Added
- Implemented dynamic startup prioritization on GPU composition by turning off blurs and shadows during startup animation.
- Removed outer expanding circular outlines and blue flash background bursts from the zoom transition.
- Configured hardware acceleration styles (willChange, backface-visibility, preserve-3d) to support high-refresh rates (90Hz / 120Hz).
- Enlarged the zoom travel scale target to scale(120) with path thinning to simulate a camera move inside the logo.

## 4.1.2

### Added
- Removed all experimental launch animation presets, keeping only the production Fluid Surface Reveal animation.
- Simplified Motion Playground to show only the Fluid Surface Reveal telemetry and preview.
- Fixed startup skeleton leak by enforcing solid background rendering styles on first paint frame.
- Resolved final transition flash by checking __studioStartupComplete and linking onComplete to onAnimationComplete.
- Implemented Bottom Navigation watchdog failsafe to recover visibility on route change, window focus, visibility change, resize, and orientation change.

## 4.1.1

### Added
- Unified cold-boot launch with Motion Playground, enabling the full spring-driven logo path drawing sequence on startup.
- Removed app-container opacity locks to allow background Hub mounting and painting underneath the launch animation.
- Restored the Top App Bar header inside the Home tab structure to eliminate transition visual shifts.
- Implemented dynamic stacking context management to clear translate3d and willChange styles only when search is active.

## 4.1.0

### Added
- Unified production launch experience with Motion Playground's LaunchAnimationEngine, ensuring identical physics and curve parity.
- Implemented physical zoom fly-through: logo scales to scale(100) and its strokes thin down during transition to reveal the Hub.
- Fixed global search touch bugs by moving the Top App Bar header to the root layout outside scroll stacking contexts.
- Added automatic search overlay dismissal on all search clicks, suggested action triggers, and pinned item selections.
- Replaced multiple CSS blur layers with a single backdropFilter blur, achieving a locked 60 FPS animation.
- Enhanced Liquid Glass styling with 25% higher transparency and sharp top border edge inner reflections.

## 4.0.99

### Added
- Shifted the launch experiences logo drawing path animation to play immediately via CSS in index.html (first painted frame).
- Implemented high-performance vanilla JS zoom-in reveal transitions inside index.html for direct overlay dismissal.
- Added duplicate React launch overlay bypass, allowing the Hub to mount and paint directly underneath the HTML splash.

## 4.0.98

### Added
- Integrated launch experience preset persistence bypass, loading the saved default preset instantly on cold boot.
- Optimized bottom navigation auto-hide responsiveness: reduced gesture jitter threshold and scroll delta windows.
- Refined Liquid Glass styling: increased transparency by an additional 25% for a naturally floating panel.
- Enhanced bottom navigation icon tactile interactions with immediate compression scale and spring feedback.
- Updated Chordex preferences/settings icon to 'tune' for exact visual consistency with Groovex preferences.

## 4.0.97

### Added
- Implemented premium scroll-driven auto-hide on SharedNavigationBar responding progressively to velocity.
- Added smooth, spring-driven transition animations following scroll direction gesture reversals instantly.
- Refined Liquid Glass visual styling: increased transparency slightly and enhanced shadows for deeper floating depth.
- Fixed Chordex bottom navigation Settings redirect to target its own local Settings Panel instead of the Hub Settings.
- Removed redundant header back buttons and containers from all Vocalex tabs (Monitor, Exercises, Takes, Record, Preferences).
- Refined the launch experience: added cinematic logo zoom-in transitions and instant vanilla-splash handshakes.

## 4.0.96

### Added
- Redesigned launch experience on Android with a premium, spring-driven logo reveal sequence.
- Enforced clean branding by removing all text ("Livex", "by Mag") from the cold boot splash screen.
- Unified five distinct motion concepts under a single, high-performance Launch Animation Engine.
- Implemented an interactive Developer Options Motion Playground for looping, previewing, and comparing launch animations.
- Integrated live telemetry telemetry (FPS, frame drop, frame time) to track performance in the playground.

## 4.0.95

### Added
- Unified bottom navigation architecture across all applications using SharedNavigationBar.
- Completely removed legacy BottomNav.tsx wrapper and all custom navigation bar containers.
- Redesigned Hub layout to feature exactly three tabs: Notifications, Home, and Settings.
- Integrated premium spring-driven gesture compression on tab pointer down and bounce-back.
- Added smooth spring active scaling transitions to selected navigation icons.

## 4.0.94

### Added
- Snappy search morph animations deferring storage index tasks off the critical path.
- Borderless search and close icons naturally integrated into the floating top bar.
- Snappy spring physics and haptic touch ripples for all interactive pill search states.
- Reusable SharedBottomNavigation component styled with floating liquid glass and progressive blur.
- Unified bottom navigation menus across Chordex, Stagex, and Hub with no labels.
- Redesigned Settings Home, Language selection, and Theme Mode Appearance sub-pages.

## 4.0.93

### Added
- Deferred search index scanning off the critical path to achieve stutter-free 60 FPS morph animations.
- Designed and built a reusable ActionButton component with spring tap physics and haptic ripples.
- Replaced multiple diagnostic copy buttons in the Emergency Debug Overlay with ActionButtons.
- Integrated the interactive live-mode eye visibility toggle button in Stagex editor FAB.
- Tuned progressive blur to render behind the floating search surface only, leaving result texts sharp.

## 4.0.92

### Added
- Spotlight-style floating search bar morph interaction, preserving original pill dimensions.
- Centered floating dropdown container for search results positioned directly below the top bar.
- Subtle full-screen progressive blur backdrop keeping the Hub visible underneath.
- Compact result rows with custom brand icons, titles, subtitles, and destination tags.
- Completely removed Recent Sessions section from the Hub tab layout.

## 4.0.91

### Added
- Implemented flagship morphing top bar and stack progressive blur for search experience on Android.
- Added central search index registry and dynamic local storage scanning.
- Integrated performance auto-scaling for backdrop filter layers.

## 4.0.90

### Added
- Rebranded the Hub as Livex and aligned design elements for maximum premium appeal.
- Centralized all user profile, sync, authentication, and logout options under the Profile avatar in the top-right app bar.
- Reconstructed the Settings sub-pages to open instantly by removing heavy navigation re-renders.
- Implemented a fuzzy-matched Global Search overlay to index all applications, settings options, and developer tools.
- Replaced static action buttons with a premium Quick Actions sheet overlay containing a customizable shortcut picker.
- Fixed Groovex highlight indicator persistence.
- Removed fake session placeholders and introduced a premium empty state illustration for recent sessions.

## 4.0.89

### Added
- Major visual redesign of the Studio Hub with a center-aligned floating top app bar and warm greetings.
- Integrated a premium quick actions horizontal shortcuts gallery and independent branded module cards.
- Integrated the Settings tab directly into the Profile screen, streamlining main Hub navigation.
- Upgraded the bottom navigation bar to a floating, premium M3 surface with progressive blur backgrounds and spring active indicators.
- Implemented high-performance Progressive Blur across floating sheets, dialogs, and navigation panels.
- Upgraded transitions to fluid, spring-driven Shared Axis, Container Transform, and Emphasized motion curves.

## 4.0.88

### Added
- Integrated full Material 3 Motion System and centralized Motion Engine.
- Standardized bottom navigation bar sizing and radius across Chords, Vocalex, and Hub.
- Implemented M3 Emphasized sliding pill transitions for active tab selection.
- Added settings entrance keyframe animations (settings-content-fade-in) for settings panels.

### Improved
- Scoped interactive hover styles inside media-hover blocks to prevent sticky WebView touch states.
- Polished Groovex library list rows and chip radii to match M3 curves.
- Optimized performance by utilizing GPU-promoted will-change layer styles.

### Fixed
- Resolved touch interaction sticking state bugs on cards, buttons, and settings rows.

## 4.0.87

### Improved
- Fixed sticky hover pointer states on Android touch screens.
- Standardized bottom navigation bar sizing and radii across Chords, Vocalex, and Hub.
- Unified sliding navigation pill transition ease and speed to match M3 Emphasized curves.
- Registered missing keyframe entry transitions (settings-content-fade-in) for settings panels.
- Scoped CSS hover rules inside media-hover blocks to prevent WebView sticky taps.
- Polished Groovex library list row/chip padding, radii, and grid margins.

## 4.0.86

### Improved
- Migrated remaining settings, controls, and search inputs to Material 3 design.
- Integrated unified SearchBar component into SongsPanel and GroovexLibrary.
- Refactored GroovexPreferences and DrumEditor components to consume centralized Toggle and SegmentedControl elements.
- Verified layout projection and animated SVG switch transitions perform smoothly on Android.

## 4.0.85

### Improved
- Migrated Studio transitions to a centralized Material 3 Motion System.
- Refactored dialog, bottom sheet, and page animations to consume unified duration and curve tokens.
- Ensured robust prefers-reduced-motion and user speed preferences scaling across native and web platforms.
- Promoted animation layers to GPU via will-change styles to resolve WebView rendering stutter.

## 4.0.84

### Added
- Implemented the Stitch Material 3 redesign for Help & Support on Android.
- Implemented the Stitch Material 3 redesign for Chords Home screen on Android.
- Preserved existing diagnostics, search, and core features under Capacitor native isolation.

## 4.0.83

### Added
- Overhauled internal tab transitions using a unified fade-through engine.
- Redesigned Chordex landing page using Material Design 3 Expressive motion and cards.
- Fixed rapid tab-switching and navigation state race conditions.
- Preserved scroll offset and view state on tab transitions.

## 4.0.82

### Added
- Overhauled and renamed the Updater debug tool to Updater Diagnostics everywhere.
- Fixed layout overflows in portrait, landscape, and tablet screens.
- Integrated the diagnostics page inline with native settings scaffold, animations, and back button behaviors.
- Added full support for application theme coloring, light/dark modes, and custom accent styles.

## 4.0.81

### Added
- Prioritized Firebase update metadata manifest queries to eliminate CORS and network console warnings.
- Overhauled the Engineering Tools Updater section into a dark, premium cockpit theme.
- Exposed real-time diagnostics, download progress trackers, and virtualized log history.
- Added operational debugger actions (verify signatures, validate download url, simulation lab controls).

## 4.0.80

### Added
- Implemented static installer locking and session synchronization to block concurrent PackageInstaller requests.
- Added automatic native cleanup to force-abandon orphaned/interrupted installer sessions on app load and update start.
- Resolved installer active-session rejections by gracefully recovering and returning the active session ID.
- Switched the bottom navigation tabs to a fluid Material horizontal fade-through transition (24px shift + scale + crossfade).
- Removed clashing inline slide animations from the Profile tab to eliminate double transitions and layout stutter.

## 4.0.79

### Added
- Removed floating pill/banner notifications to immediately show full-screen update dialog.
- Center-locked the update modal dialog and disabled vertical bouncing.
- Added a unified, fluid progress bar that tracks the entire download and verification cycle.
- Fixed back transition animations to slide out correctly when leaving Profile or Settings views.
- Wired global transition state into the navigation container for consistent Android gesture transitions.

## 4.0.78

### Added
- Reorganized Updater screen to display the update checker card above official downloads recovery.
- Redesigned Vocalex Coach segmented control with a centered modern sliding pill indicator layout.
- Implemented native Android microphone permissions request and Settings redirect recovery flow.
- Synchronized Vocalex Preferences default tab selector icons to use bottom navigation React icon components.
- Swapped Profile and Settings view order to resolve reversed page transition directions.
- Moved heavy UI modules preloading to startup Phase 6 to resolve intro animation freezes.
- Downgraded generated urls updater diagnostics expected warning to debug log level.

## 4.0.77

### Added
- Merged Vocalex Pitch + Practice views into a unified Coach panel.
- Implemented sequential, stutter-free transitions for Stagex tab changes.
- Integrated SharedNavigationContainer transitions inside Developer Tools.
- Redesigned and simplified the Updater UI.
- Fixed Settings routing for Help Center, FAQ, Terms, and Privacy screens on Android.

## 4.0.76

### Added
- Implemented per-app Start On settings for Vocalex under its own Preferences tab.
- Removed deprecated Version Downgrade selection and confirmation overlays from Hub Updater page.
- Relocated the Official Release Downloads section into Settings -> Updater.
- Stabilized Vocalex Pitch monitor microphone concurrency initialization and background resume behaviors.

## 4.0.75

### Fixed
- Fixed CommonJS module dynamic import interop in AppLottie to resolve React Error #306.
- Restored handleOpenGitHub and ViewState definitions to resolve compile-time warnings and errors.

## 4.0.74

### Fixed
- Fixed React Error #306 crash inside Vocalex TakesPanel (Lottie dynamic import).
- Fixed Microphone initialization crashes on unsupported devices.
- Restored missing TakeDetailView component and cleaned up Vocalex components.

## 4.0.74

### Fixed
- Fixed React Error #306 crash inside Vocalex TakesPanel (Lottie dynamic import).
- Fixed Microphone initialization crashes on unsupported devices.
- Restored missing TakeDetailView component and cleaned up Vocalex components.

## 4.0.73

### Fixed
- Fixed memory leak and 4-second delay during Groovex startup.
- Resolved crash in Vocalex recording view.
- Relocated Official Release Downloads to Updater Settings panel.

## 4.0.72

### Fixed
- Fixed Groovex module crash by restoring ACCENT_COLORS reference.
- Fixed React Error #306 in Vocalex by unconditionally executing hooks in AppModeMenuLogo.
- Removed legacy OTA updater subsystem and all obsolete references.

## 4.0.71

### Added
- Finalized Phase 3-8 architecture updates and Start On persistence.

## 4.0.70

### Changed
- Complete performance optimizations across Settings, Navigation, Chordex, Stagex, and Updater.
- Major diagnostics improvements.
- Permanent removal of the OTA architecture and all its obsolete subsystems.
- Roll-up of numerous bug fixes and stability improvements.

## 4.0.69

### Fixed
- Fixed critical startup regression causing a permanent black screen on native platforms due to incorrect Capacitor.isNativePlatform() double invocation.

## 4.0.68

### Fixed
- Complete redesign of the Release Pipeline for determinism.
- Prevent duplicate GitHub Actions workflows.
- Dynamically resolve versions in CI pipeline.

## 4.0.67
### Improved
- 120Hz Native Performance Sprint Continuation
- Advanced optimization of the app updater and Settings panels.

## 4.0.35
### Improved
- 120Hz Native Performance Sprint
- Eliminated massive UI layout thrashing by implementing useShallow Zustand selectors.
- Decoupled Updater subsystem from critical rendering path to stop background freeze.
- Removed SharedNavigationContainer inside Stagex iframe to eliminate tab switching delays.
- Implemented O(N) keep-alive rendering optimizations for the Settings subsystem.

## 4.0.34
### Improved
- Performance and UX optimization pass.
- Fixed layout thrashing in the updater modal.
- Cleaned up detached memory references for background tasks.
- Improved startup time by deferring heavy module preloading.

## 4.0.33

### Added
- Architecture and tech debt reduction pass.
- Removed dead code and unused exports.
- Resolved circular dependencies.
- Extracted constants from massive UI components.

## 4.0.30

### Added
- Complete SDK modernization verification release.
- Validated compatibility of Capacitor 8, Android SDK 35, AGP 8.8.0, and Gradle 8.12.
- Verified zero native compilation warnings under JDK 21.

## 4.0.29

### Added
- Test release validation build with no functional code changes to verify the complete release pipeline.

## 4.0.28

### Added
- Concurrent update check resolver querying both Firebase Hosting and GitHub Releases concurrently.
- Strict fallback version check logic to prevent stale CDN cache or metadata replication lag from bypassing updates.
- Resolved diagnostics FSM transition count inconsistency by aligning it with persisted Flight Recorder state.
- Cleaned up background version check timeout resource leaks.

## 4.0.27

### Added
- Test release validation build with no functional code changes.

## 4.0.26

### Fixed
- Fixed recursive logging loop in native Android OTA instrumentation.
- Ensured strict unidirectional logging flow without re-entrant native calls.
## 4.0.25

### Added
- Native Android OTA instrumentation logging.
- Flight recorder categorized events (NATIVE, LIFECYCLE, PIPELINE, STATE).
- FSM transition instrumentation tracking.

## 4.0.24

### Added
- Native Android OTA instrumentation logging.
- Flight recorder categorized events (NATIVE, LIFECYCLE, PIPELINE, STATE).
- FSM transition instrumentation tracking.

## 4.0.23

### Added
- Test release with updater pipeline architectural fixes.

## 4.0.22

### Added
- Overhauled Updater Diagnostics UI into 4 high-density collapsible sections.
- Added real-time Live Timeline with filter, search, pause/resume, copy/export controls.
- Implemented Capacitor AppInstaller plugin Proxy guard to guarantee simulated updates never trigger native installations.
- Redesigned Updater Flight Recorder with 300 events ring buffer, size limits, severity levels, and automated session pruning.

## 4.0.21

### Added
- Refined diagnostic console header typography, spacing, and back button alignment.
- Added sticky Back button when desktop view is active.
- Enhanced simulation workflow testing to run the standard download-then-apply flow.

## 4.0.20

### Added
- Redesigned the diagnostics dashboard into a high-density, professional engineering console.
- Created sticky console statistics strip containing only critical versions, states, and counts.
- Replaced tab sheets with 4 collapsible segments utilizing rotating chevrons and lazy rendering.
- Upgraded Copy Everything report to loop over all sessions and export histories.

## 4.0.19

### Added
- Exposed a persistent local flight recorder that logs updater transitions and PackageInstaller events.
- Integrated a compact workflow testing scenarios panel inside the real updater diagnostics page.
- Added automatic verdict analysis for state machine anomalies and listener leaks.

## 4.0.18

### Added
- Implemented compact workflow testing scenarios in the diagnostics panel.
- Enhanced real-time Live Workflow Timeline with elapsed durations, transition sources, and error highlights.
- Expanded Copy Everything into a comprehensive Markdown engineering report for debugging.

## 4.0.17

### Added
- Isolated developer simulation modes cleanly from the production updater pipeline.
- Implemented dynamically generated simulation target versions based on the currently installed version.
- Restored visual progression pacing and a 1.5s simulated confirmation wait to the Simulation Lab.

## 4.0.16

### Fixed
- Fixed native PackageInstaller handoff so the app remains on the Installing screen during update instead of resetting or hiding the updater.
- Restored comprehensive updater workflow simulation and timeline diagnostics to the developer diagnostics dashboard.
- Ensured changelog displayed post-update matches the target release notes perfectly using saved localStorage release notes.

## 4.0.15

### Fixed
- Verification of fix for premature 'Studio is up to date' bug on real device without the 2500ms auto-close timer.

## 4.0.14

### Fixed
- Replaced timer-based auto-close after installation with a lifecycle-synchronized post-install session that stays active until Android confirms the process transition.
- The updater success screen now remains visible until the app process is replaced, the user taps Done, or a 5-minute safety timeout expires.
- All automatic update checks, lifecycle triggers, and state resets are blocked during the post-install session using process boot ID detection.
- Added detailed process-level instrumentation for post-install lifecycle events.

## 4.0.13

### Fixed
- Fixed premature "Studio is up to date" message appearing while Android is still installing the update.
- Prevented the auto-close timer from resetting the installation lock after a successful install, which allowed stale update checks to run in the old app process.
- Added a safety guard to dismissUpdate so it cannot reset state while the PackageInstaller is actively running.

## 4.0.12

### Fixed
- Fixed Stagex splash and logo freeze when navigating away from the Stagex panel.
- Optimized iframe keep-alive limits inside Stagex by category-mapping views, reducing active background WebGL instances from 8 to at most 4.
- Added watchdog recovery callbacks to the launch transition system to force-dismiss the splash screen if a sub-app unmount takes longer than 4000ms.
- Unified native and web English changelogs to read from a single synchronized source of truth.

## 4.0.11

### Fixed
- Fixed a race condition that caused "Studio is up to date" to appear prematurely during Android APK installation.
- The updater now waits for the native PackageInstaller result query to fully resolve before triggering any automatic update check on app resume.
- Eliminated the timing window where a 200ms-debounced update check could read the installation-lock state before the native IPC response had set it, triggering a false version-match comparison.
- Installation lock diagnostics now record `RACE_BLOCKED` events in the install lock timeline for production visibility.

## 4.0.10

### Fixed
- Fixed navigation transition directions globally so they always match the logical layout/order.
- Corrected Chordex panel order mismatches to resolve reverse sliding tab animations.
- Eliminated previous-screen ghosting and flashing artifacts by introducing dynamic z-index overlays and solid background wrappers on view transition layers.
- Integrated SharedNavigationContainer transitions inside Stagex for setups, Rider, scene editor, and settings screens.
- Redesigned the App Switcher pill overlay to inherit the premium Kyant0 Liquid Glass visual language.

## 4.0.9

### Fixed
- Fixed updater prematurely showing "Studio is up to date" while the Android PackageInstaller was still active installing the update.
- Introduced an installation lock (`isInstallationLocked`) that prevents any automatic update check from running during or immediately after a system installation session.
- Prevented `StartupCoordinator` from resetting the startup pipeline while the PackageInstaller dialog is visible — the system was treating the installer overlay as an app-backgrounded event and incorrectly re-triggering a full startup cycle.
- Added `installationJustCompleted` flag that remains active from `INSTALL_SUCCESS` until the user dismisses the completion screen (or a 60-second safety timeout fires), closing the race window between session cleanup and startup update checks.
- Added installation lock diagnostic timeline (`installLockTimeline`) to every rejected automatic check for full production auditability.

## 4.0.8

### Optimized
- Modernized the Chords home screen: visually refreshed Quick Categories grid with custom colored squircle badges, hover scale elevation, dynamic borders, and enhanced spacing/alignment.
- Eagerly preloaded Tolgee translations on application startup, eliminating the "Loading translation resources" text modal for a seamless native boot experience.

## 4.0.7

### Fixed
- Aligned Chordex layout top offsets correctly using the shared ScreenScaffold system, fixing overlapping content with the status bar on Android.
- Fixed Chordex tab routing to navigate internally inside Chordex instead of launching Hub settings.
- Removed transition locked guards (cooldown) from NavigationDispatcher to make spam clicks and rapid tab transitions instant everywhere.
- Replaced the custom copy-pasted animation logic in Android project with SharedNavigationContainer to unify transition performance.

## 4.0.6

### Optimized
- Implemented zero-latency navigation tab state retention across the entire application workspace.
- Optimized SharedNavigationContainer to keep visited panels alive in the DOM using display: none, avoiding costly unmounting/re-mounting.
- Tuned Zustand subscription selectors across all sub-apps to return literal state strings directly, eliminating redundant parent component re-renders.
- Stabilized bottom navigation setTab callback reference to prevent child re-rendering overhead.

## 4.0.5

### Added
- Unified the navigation experience across all Studio apps using the Drumex slide-transition animation standard.
- Integrated the SharedNavigationContainer into Chordex, Drumex, Groovex, Vocalex, and StudioHub.
- Isolated page-level scroll states across tabs to prevent navigation scroll sharing issues.
- Optimized Chordex layout top padding and resolved transition flashing issues.

## 4.0.3

### Fixed
- Fixed post-update startup check loop by invalidating session caches when local version matches target.
- Restored and reorganized Developer Options Diagnostics page into 11 distinct sections.
- Restored simulation overrides, chronological timelines, PackageInstaller telemetry, and clipboard tools.

## 4.0.2

### Added
- Redesigned updater dialog utilizing premium centered layout and blurred backdrop overlay.
- Added live download speed, remaining time, and package size metrics calculation in Javascript.
- Integrated automatic close timer and unified installation status tracking behind PackageInstaller.

## 4.0.1

### Added
- Push test update to version 4.0.1 for verification.
- Verified in-app updater behavior under clean state.

## 3.7.97

### Fixed
- Fixed version metadata parsing to support multiple tag formats (v3.7.96, Version 3.7.96, refs/tags/v3.7.96).
- Centralized version parsing and formatting logic across all updater screens and modules.
- Robust release detection to prevent fallback errors on non-standard remote versions.

## 3.7.96

### Fixed
- Fixed critical bug where the updater prematurely exited with "Studio is up to date" after clicking Update Now.
- Added strict transition controls and update session locks during PackageInstaller execution.
- Added enhanced diagnostics logs capture whenever the up-to-date state is reached.

## 3.7.95

### Added
- Multi-tab Developer Diagnostics Page (Overview, Current Session, Workflow Timeline, Update History, Diagnostics, Performance, Simulation).
- Live Frame Rate (FPS) tracker utilizing requestAnimationFrame.
- Timeline log enhancement tracking updater lifecycleState, packageInstallerStatus, and progress.

### Fixed
- Fixed update session persistence using localStorage to withstand app restarts and rebuilds.
- Fixed checking updates collision where manual checks can supersede active background check sessions.
- Resolved type safety and session naming collisions.

## 3.7.94

### Added
- Performance Diagnostics 2.0 section displaying CPU/Memory average and peaks.
- Renders, paints, and layout passes tracked via useLayoutEffect and Performance APIs.
- Callback roundtrip latency metrics inside Telemetry grid dashboard.

### Fixed
- Hardened PackageInstaller background installation recovery checks upon app reopen.
- Fast simulated update loops running in less than 300ms total.

## 3.7.92

### Added
- Persistent diagnostics update session selector to inspect past update logs.
- Transition timeline tables mapping state changes, timings, and exceptions.
- Tracing for closure events and up-to-date popups with caller stack trace capture.
- Multi-format copy and download actions for diagnostic session subsets.

### Fixed
- Simulation mode to mock full installation progress sequences.
- Bypassed file signature and eligibility checks when simulating updates.

## 3.7.91

### Added
- Interactive Update Session Diagnostics UI section in the Help Center.
- Diagnostics logging tracing updater events, timing offsets, states, and recovery attempts.
- Security guards checking for and blocking illegal background check calls during active installer sessions.

### Fixed
- Navigation white flashing issue when expanding the bottom navigation bar after scrolling.
- Redundant web-centric references in the Help Center settings view, replacing them with native Android & hardware troubleshooting guides.
- APK installer session callback sequence checks to ensure the Installing screen remains active until completion.

## 3.7.90

### Fixed
- Native updater validation update check.

## 3.7.89

### Fixed
- Native updater dialog redirection issues during active installations.
- Fake progress indicators and timers by exposing real native PackageInstaller progress stages (Preparing, Launching, Installing, Optimizing, Finalizing).
- Aurora background animation frame drops by converting linear gradient movement to GPU-accelerated transforms.
- CPU overhead and React rendering storms by throttling progress callbacks to a 100ms interval.

## 3.7.88

### Added
- Collective Set-based scroll hide registration system supporting multiple container scopes.

### Fixed
- Bottom Navigation sticky collapsed states by auto-expanding when all visible containers are at top or disconnected.
- Frame rate stuttering and layout thrashing by implementing pure percentage-based sliding pill calculations.
- CPU overhead by removing computed style checks on global body MutationObserver events.

## 3.7.87

### Added
- Sleek glassmorphic Native Updater interface with continuous card resizing transforms.
- Active stage indicators during Android package installation to cycle through status steps.
- Float and pulse animations to the installing status icon to indicate background activity.
- Tactile ActionButton touch-down scaling microinteractions across all updater dialog states.

### Fixed
- Lightweight non-intrusive post-update startup toast notification instead of fullscreen overlay.

## 3.7.86

### Added
- Global bottom navigation scroll hiding registration system.
- Synchronous render-phase page transition direction tracking.

### Fixed
- Solid opaque page slide transitions matching native Android behavior.
- Profile and root Settings page scroll hiding triggers.

## 3.7.85

### Added
- Navigation Session Token verification for all state modification callbacks.
- Route transition lifecycle synchronization for active scroll owners.

### Fixed
- Eliminate asynchronous callback race conditions in bottom navigation.

## 3.7.84

### Added
- Keep collapsed gesture pill permanently visible above the bottom safe area.
- Propagate scroll-collapse behavior globally to settings and developer options.

### Fixed
- Optimize morph transition duration to 250ms using a premium easing curve.
- Resolve Stagex bottom navigation transform alignment and visibility bugs.

## 3.7.83

### Added
- Implement responsive bottom navigation gesture pill morphing on scroll.
- Add event-driven passive watchdog recovery system.

### Fixed
- Optimize bottom navigation motion speed to 200ms with emphasized cubic-bezier curve.
- Remove continuous watchdog polling loops to minimize idle CPU usage.

## 3.7.82

### Fixed
- Resolve native package installer UX bug where the updater screen would close or reset to "up to date" immediately after tapping UPDATE.
- Prevent transient native installer status codes from corrupting Javascript state machine recovery on application resume.

## 3.7.81

### Fixed
- Stabilize cross-app navigation and transition lockups.
- Remove polling timers, replacing them with deterministic lifecycle mount-ready completions.
- Redesign Developer Tools diagnostics views with real performance instrumentation and badged metrics.
- Overhaul diagnostics copy reports into structured interpreted documents with a Technical Appendix.
- Smooth global bottom navigation bar collapse-to-indicator animations on scroll down.

## 3.7.80

### Fixed
- Restore top-right Copy Everything button on mobile sub-pages.
- Fix global bottom navigation overlays in hub mode.
- Stabilize native update PackageInstaller session completion flow.

## 3.7.79

### Fixed
- Sprint 20 Release: Consolidates Developer Tools diagnostics screen headers.
- Integrates global Copy Everything and Copy Section utilities.
- Extracts and unifies scroll-driven Bottom Navigation auto-hide/reveal behaviors.

## 3.7.78

### Fixed
- Finalized native Android PackageInstaller stabilization and UI synchronization.
- Resolved duplicate confirmation dialogs prompting users twice.
- Configured persistent installer screens during package replacement.
- Removed the legacy startup success screens to boot directly to the main Hub.

## 3.7.77

### Fixed
- Test release with no changes to verify PackageInstaller flow.

## 3.7.76

### Fixed
- Resolved duplicate PackageInstaller dialog prompting users twice during installation.
- Synchronized native installation states to keep the installing screen active with a spinner.
- Added a final completion screen upon successful background package replacement.
- Configured the Done action button to cleanly terminate the app process.

## 3.7.75

### Fixed
- Completed System Diagnostics page redesign to match the premium Developer Tools theme.
- Added Copy Everything and Copy Section utilities to all diagnostics screens.
- Fixed PackageInstaller state sync where updater screen reset prematurely on resume.

## 3.7.74

### Fixed
- Stabilized cross-app navigation and transitions between Hub and sub-apps.
- Fixed navigation store state mismatches, logo freezes, and unmount cleanups.
- Added modals/sheets cleanup inside sub-app unmount callbacks.

## 3.7.73

### Fixed
- Finalized native Android APK installation pipeline to prevent Hub flashes and UI unmounts.
- Fixed duplicate confirmation intents and session creations natively in PackageInstaller.
- Added comprehensive diagnostic trace logging for installation lifecycle events.

## 3.7.72

### Added
- Integrated comprehensive navigation logging instrumentation across the entire routing stack.
- Enabled real-time state and action tracking for store mutations, gestures, and back-handlers.
- Added diagnostics dump utility to reconstruct timeline events upon navigation validation failures.

## 3.7.71

### Added
- Resolved critical sub-app closing regression and navigation deadlocks.
- Implemented premium slide-reveal transitions for all sub-app pages.
- Upgraded bottom navigation auto-hide scrollers to filter jitter and ignore overscroll.
- Added automatic bottom navigation expansion upon tab and view switches.
- Restructured Android app shells to use unified Zustand navigation states.

## 3.7.70

### Added
- Resolved critical sub-app closing regression that immediately exited nested modules after splash screen.
- Integrated NavigationDispatcher.push routing synchronously with appMode triggers on Hub app launch.
- Propagated scroll-driven collapse state notifications properly via setNavCollapsed in useScrollHide hook.
- Implemented robust callback polling listener inside useScrollHide to prevent React late-mounting ref traps.
- Unified sliding translation animations using premium CSS transforms across all sub-app navigation bars.

## 3.7.69

### Added
- Standardized settings menu pages and consolidated terms, privacy policies, and credits under a unified About view.
- Removed permanent Report a Bug feedback option from settings screen, keeping it accessible via dev diagnostics.
- Hardened in-app updater watchdog transitions to preserve diagnostics failure details on state resets.
- Fixed Capacitor mock isolation and dynamic ESM module override traps during regression test suites.
- Completed full production UX audit across Chordex, Stagex, Drumex, Groovex, Vocalex, and settings modules.

## 3.7.68

### Added
- Removed the gray Settings header and restored the transparent sub-navigation bar design.
- Optimised page transitions to slide in faster and more snappily.
- Improved startup coordination by verifying the Hub DOM mounts and paints before completing boot.
- Unified dynamic import preloading to reduce dynamic chunk loading bottlenecks.
- Fixed background OTA updater lifecycle race conditions.

## 3.7.67

### Added
- Unified all custom overlay sheets, modals, and screen scaffolding using DialogScaffold to standardize bottom offsets and transitions.
- Optimized boot lifecycle, startup coordination, and lazy loading to resolve layout shifts and startup lag.
- Consolidated duplicate design system primitives and pruned unreferenced components from ui-web and ui-shared.

## 3.7.66

### Added
- Implemented premium visual redesign of Developer Options dashboard (Design #1) with a 4-column live System Health grid showing App/Android versions, update statuses, and error/warning counts.
- Redesigned Engineering Tools inside Developer Options into an interactive 6-card bento grid (Apps, Performance, Logs, Network, System, Updater) with dynamic telemetry badges.
- Rebuilt Settings profile header in Main Settings (Design #2) with dynamic Pro user badge, user initials/photo, and subtle background glow.
- Created reusable BentoSettingCard and BentoSettingRow components inside SettingControls for tactile pressed animations (scale-down effect) and hover states.

### Fixed
- Stabilized bottom navigation consistency across all settings and developer pages to prevent clipping, overlaps, and disappearing states.
- Audited and resolved scrolling, clippings, and black bar layouts throughout Settings to ensure safe-area notches and keyboard padding fit perfectly.
- Replaced hardcoded color values with Studio's theme variables to support AMOLED, pure dark, light, and dynamic accent color modes.
- Overhauled App Update engine with a 16-state deterministic machine to resolve false "App is up to date" scenarios.
- Integrated explicit exception handlers and diagnostics metadata in update checker pipelines for robust recovery paths.

## 3.7.65

### Fixed
- Eliminated false "App is up to date" when remote metadata fetch failed.
- Fixed auto-check exceptions silently returning to idle instead of recovery.
- Added explicit diagnostics on every non-update path.

### Improved
- Every failure path now exposes explicit reason codes, stack traces, and timestamps.
- Version comparison populates full decision rationale in diagnostics.
- Synchronized all version sources to 3.7.65 / versionCode 193.

## 3.7.60

### Fixed
- Rebuilt the App Update subsystem state machine with 16 deterministic uppercase states.
- Re-engineered version comparison engine to explicitly validate metadata and signatures.
- Linearized check, download, and install execution pipelines to eliminate race conditions.
- Adapted UpdateIndicator UI mapping and Simulation Lab assertions to support the new state structure.

## 3.7.59

### Fixed
- Fixed layout shifting and clipping on Android's Developer Options screen when parent is scrolled.
- Removed duplicate safe area padding from subpage headers for perfect notch alignment.
- Replaced outdated "OTA" terminology with generic App Update phrasing across all menus.
- Restored missing native device and build telemetry parameters (OS Version and Version Code).
- Polished diagnostics copy report formatting with section separators and sentinel mappings.

## 3.7.58

### Fixed
- Fixed safe area top padding for all Developer Options screens, preventing status bar and notch overlap.
- Polished layouts to use AMOLED pure black theme with consistent cards and border outlines.
- Integrated diagnostics viewport with the standard floating Bottom Navigation Bar.
- Implemented single-tap Copy Everything report compiling all device, OTA, transition, and log history.
- Added explicit user-facing labels and descriptions for all copy options.

## 3.7.57

### Fixed
- Completely rebuilt Developer Options Updater Debugging section.
- Fixed clipboard size limits, preventing native process binder transaction failures.
- Unified JS log traces with native and state timeline buffers.
- Fixed state machine transition validations for pending user actions.

## 3.7.56

### Fixed
- Fixed devtools copy diagnostics scope and undefined variables.
- Added direct touch event listeners to accordion header components.
- Resolved bottom viewport layout scroll padding and navigation overlay coverage.

## 3.7.55

### Fixed
- Fixed copy buttons failing to populate contents in the diagnostics tool.
- Unified JS logs timeline to use a single console logs source of truth.
- Resolved scroll viewport clipping/truncation at the bottom of Android WebViews.
- Registered a permanent global PackageInstaller listener to eliminate missing listener warnings.
- Fixed invalid updater state machine transition rejections.
- Removed fake CDN URLs from simulations, replacing them with real release metadata.

## 3.7.54

### Fixed
- Fixed touch event interception on Android WebViews for the Updater Debug Tools.
- Constrained layout sheets to fill bounds correctly with flex direction, preventing coordinate offset mismatches.
- Added detailed button-press touch logging instrumentation across all debug buttons.

## 3.7.53

### Fixed
- Repaired the Android UI of the Updater Debug Tools screen.
- Eliminated automatic scroll-into-view viewport jumping and vertical layout shifts.
- Removed nested scrollable containers from the log console and chronological event timeline to ensure a single active scroll container, resolving touch event unreliability and gesture conflicts on Android WebViews.

## 3.7.52

### Fixed
- Repaired all production DevTools Dashboard buttons, ensuring robust handling of missing cached APK paths for Replay Last Install, Open Cached APK, and Open Download Folder.
- Satisfied TypeScript checks by ensuring all code paths in the dashboard button handlers return a value.

## 3.7.51

### Fixed
- Fixed a silent TypeError in `generateFullEngineeringReport` by using optional chaining on `import.meta.env`.
- Fixed Toast notification positioning by changing it from `absolute` to `fixed` so it is always visible on-screen.
- Ensured all copy buttons handle clipboard operations robustly.

## 3.7.50

### Fixed
- Completed full functional audit and verification of all 62 Developer Tools dashboard buttons.
- Ensured 100% end-to-end event chain execution from the UI to the native Android bridge.
- Validated native clipboard writing and sharing integrations across all diagnostic outputs.

## 3.7.49

### Fixed
- Implemented a native clipboard copy bridge to bypass WebView security restrictions on Android.
- Awaited and returned clipboard text across all 15 diagnostic export and report buttons.
- Removed obsolete OTA simulation buttons and user-facing labels.

## 3.7.48

### Fixed
- Added a comprehensive Automated Functional Audit runner to verify all 55 dashboard buttons.
- Fixed clipboard export buttons to correctly await navigator.clipboard.writeText and handle errors.
- Added simulation controls for all PackageInstaller failure codes (Storage Full, Signature Conflict, Incompatible version, Blocked by policy).

## 3.7.47

### Fixed
- Rehabilitated DevTools Dashboard with full functional updates, simulation controls, and telemetry history.
- Implemented robust clipboard validation and loading indicators for all diagnostic exports.

## 3.7.46

### Fixed
- Stabilized simulated failure button click handlers to run sequential state transitions.
- Enabled native update logic bypass for simulations on non-Android platforms.
- Added support for all-zero hash bypass on manual/custom APK integrity checks.

## 3.7.45

### Fixed
- Audited the DevTools Laboratory and stabilized diagnostic logging and test flow operations.
- Added a Clear Timeline action and detailed Copy Logs, Copy JS Logs, and Copy Native Logs buttons.
- Refactored the full export engineering report into a clean, structured Markdown layout.

## 3.7.44

### Fixed
- Fixed a Rules of Hooks violation in the DevToolsDashboard component by hoisting the conditional unifiedTimeline useMemo hook to the top level.
- Enabled source maps for production and release builds to support exact symbolication of component crash contexts and stack traces.

## 3.7.43

### Fixed
- Completely eliminated minified React errors from the Engineering Lab and DevTools by implementing an automatic inline React error decoder.
- Upgraded the global Error Boundary to capture full component Fiber contexts, including props, states, and hook dependency stacks.
- Prevented potential TypeError rendering crashes during initial Hub load by adding a robust translation fallback for the settings namespace.

## 3.7.42

### Fixed
- Fixed Android 14+ background PackageInstaller confirmation dialog block by launching the confirmation intent using the BroadcastReceiver context with FLAG_ACTIVITY_NEW_TASK.
- Permanently resolved the background activity launch (BAL) restriction on newer Android versions.
- Fully instrumented the updater pipeline with detailed native and JS telemetry logs.

## 3.7.41

### Fixed
- Fixed Android 14+ background PackageInstaller confirmation dialog block by launching the confirmation intent using the BroadcastReceiver context with FLAG_ACTIVITY_NEW_TASK.
- Permanently resolved the background activity launch (BAL) restriction on newer Android versions.
- Fully instrumented the updater pipeline with detailed native and JS telemetry logs.

## 3.7.40

### Fixed
- Fixed Android 14+ background PackageInstaller confirmation dialog launch block by routing the session callback through a Broadcast PendingIntent targeting InstallReceiver.
- Prevented duplicate update checks by implementing a synchronous promise-reuse lock in checkForUpdate.
- Enhanced native and JS updater tracing to log full stack traces, threads, callers, and timestamps.
- Fixed horizontal layout shifting in DevTools tabs and resolved GSAP animation console warnings.

## 3.7.39

### Fixed
- Fixed Android 14+ background PackageInstaller confirmation dialog launch block by routing confirmation intents through the active foreground MainActivity.
- Added automatic re-prompt resume logic on app resume to restore blocked confirmation screens.
- Enforced strict installation locks in the JS updater to prevent background polling or resume events from resetting the update state.
- Fixed horizontal layout shifting in DevTools tabs and resolved GSAP animation console warnings.

## 3.7.38

### Added
- Overhauled the Updater Laboratory UI in Developer Options by replacing all checkbox-style controls with dedicated button commands.
- Added simulation actions for injecting SHA-256 validation failures, signature conflicts, and download network timeouts directly into the real updater pipeline.
- Implemented a live, auto-scrolling execution console panel displaying unified chronological events (JS, native, state transitions).
- Created advanced engineering tools to replay installations, inspect APK manifests, recalculate SHA checksums, and export diagnostic logs.

## 3.7.37

### Fixed
- Fixed PackageInstaller background activity launch blocks on Android 14+ by using a BroadcastReceiver.
- Added comprehensive Updater Laboratory simulation tools and unified chronological event logs to Developer Options.
- Refactored index exports and added post-download certificate check robustness.

## 3.7.36

### Fixed
- Permanently fixed PackageInstaller by using BroadcastReceiver targeting InstallReceiver to launch system confirmation dialogs, preventing background activity blocks on Android 14+.
- Added Updater Laboratory simulation controls and a comprehensive Diagnostics dashboard to Developer Options.

## 3.7.35

### Added
- Release validation build for v3.7.35.
- No functional or behavioral changes.

## 3.7.34

### Fixed
- Restored native PackageInstaller session flow with corrected activity lifecycle management to prevent premature dismissal of the system confirmation dialog.

## 3.7.33

### Added
- Release validation build for v3.7.33.
- No functional, updater, startup, or UI behavior changes.

## 3.7.32

### Fixed
- Fixed critical race condition in the updater state machine where the native PackageInstaller session becoming active caused an invalid state transition, resetting the updater to idle.

## 3.7.31

### Added
- Release validation build for v3.7.31.
- No functional, updater, startup, or UI behavior changes.

## 3.7.30

### Added
- Fixed critical bug where the Android PackageInstaller prompt never appeared due to background activity start restrictions on Android 14.
- Implemented a transparent foreground InstallActivity to reliably launch the installer confirmation screen.

## 3.7.29

### Added
- Release validation build for v3.7.29.
- No functional, updater, startup, or UI behavior changes.

## 3.7.28

### Added
- Fixed critical bug where pressing the Update button incorrectly entered the 'Studio is up to date' path.
- Blocked background update checks from running when the installer is busy or in an active installation state.
- Enforced that the only valid transition from UPDATE_AVAILABLE is to DOWNLOADING in the state machine.

## 3.7.27

### Added
- Release validation build for v3.7.27.
- No functional, updater, startup, or UI behavior changes.

## 3.7.26

### Added
- Fixed critical PackageInstaller synchronization bug in the in-app APK installer.
- Implemented persistent active installation tracking in native code and SharedPreferences.
- Ensured that the fullscreen installation screen remains active during the entire installation process.

## 3.7.25

### Added
- Replaced the planets orbits intro animation with a premium minimalist centered logo fade-scale transition.
- Preserved 100% of the startup event model, reactMounted checks, and Capacitor AppInstaller integration.
- All updater and offline recovery features remain fully operational.

## 3.7.24

### Added
- Restored full orbits and flight settle splash intro animation from the stable version 3.7.15.
- Fixed black screen startup regression by coordinating early-exit and mount checks.
- All updater, offline recovery, and signature checking functionality preserved.

## 3.7.23

### Added
- Restored original splash screen dismissal behavior to synchronize with the React Hub mount.
- Eliminated the black screen regression by keeping the splash screen active until the Hub is painted.
- All updater, offline recovery, and signature checking functionality preserved.

## 3.7.22

### Added
- Rollback of the React startup state machine to restore the stable architecture of version 3.7.15.
- All startup overlay lifecycle coordination moved into a simple self-contained inline script.
- All updater enhancements (native success checks, recovery centers, signature verification) preserved.

## 3.7.21

### Added
- Authoritative Android-driven PackageInstaller success verification.
- Completely passive splash screen and linear React-owned startup transitions.
- Eliminated redundant startup transitions and late installer-handoff background listeners.

## 3.7.20

### Added
- Authoritative PackageInstaller success verification to prevent early up-to-date states.
- Completely redesigned startup flow with lightweight logo fade-scale animation.
- Optimized startup path with zero frame stalls and strictly linear transition states.

## 3.7.19

### Added
- Authoritative PackageInstaller success verification to prevent early up-to-date states.
- Completely redesigned startup flow with lightweight logo fade-scale animation.
- Optimized startup path with zero frame stalls and strictly linear transition states.

## 3.7.18

### Added
- Startup state machine stabilization with linear transitions.
- Updater native bridge status events synchronization.
- Manual dismissible success screen with clean process exit.
- Performance budget checks and zero warnings validation.

## 3.7.17

### Added
- Updater transaction consistency to prevent impossible execution paths.
- Eligibility pipeline version code validation fixes.
- State machine validation and granular verification states.
- Diagnostic error reporting improvements.

## 3.7.16

### Added
- Deterministic startup state machine to prevent visual layout shifts.
- Fast intro animation settle timings fitting strict performance budgets.
- Auto-recovery safety net for the startup overlay rendering.

## 3.7.15

### Added
- Staged updater installation progress screen flow.
- Background resume detection and failed-state recovery options.
- Enriched compositor watchdog telemetry with deep diagnostics.

## 3.7.14

### Added
- Fullscreen updater UI locking and spinner integration.
- Dedicated installing progress screen overlay.
- Complete production end-to-end update validation.
- Architectural and regression suite audits.

## 3.7.13

### Added
- Fullscreen updater experience restored.
- Dedicated installing UI state.
- Post-refactor stability validation.
- Startup pipeline and performance validation.

## 3.7.12

### Added
- Startup pipeline optimization.
- Startup performance improvements.
- False black-screen detection fixes.
- Diagnostics reliability improvements.

## 3.7.11

### Added
- Installation UX improvements.
- Persistent installation stage.
- Improved PackageInstaller handoff.
- Recovery reminder persistence.
- Continue Installation improvements.

## 3.7.10

### Added
- Recovery Center.
- Smart Installation Recovery.
- Continue Installation action.
- Intelligent cache validation.
- Recovery workflow improvements.

## 3.7.9

### Added
- Official GitHub Release Fallback.
- Manual Recovery Path.

### Fixed
- Completed modular refactoring of the updater subsystem into decoupled components under the new architecture.
- Integrated a single authoritative state machine with strict validation guards and transient state watchdogs.
- Added a priority check queue to ensure manual update checks obsolete background checks automatically.
- Created and validated a permanent 10-point automated regression test suite covering Android 14, 15, and 16.
- Update Failure Recovery Improvements.

## 3.7.8

### Fixed
- Fixed update check hangs by implementing a strict timeout race in version metadata queries.
- Enhanced updater diagnostics by prefixing error messages with the exact failing stage (e.g., Download, SHA Verification, Eligibility, PackageInstaller).
- Replaced JS alert popups with native themed modal states for up-to-date and failure outcomes.
- Upgraded the failed state retry button to dynamically retry update checks or downloads.

## 3.7.7

### Fixed
- Fixed critical updater system regressions by enforcing a strict deterministic state machine.
- Added native PackageInstaller active session checks on startup to prevent boot deadlocks and blank screens.
- Implemented robust watchdog timers for checking, downloading, verifying, and installing states.
- Cleaned up interrupted installation behaviors to reset to idle safely when the installer session is dead.

## 3.7.6

### Added
- Added pre-deploy signature verification check preventing deployment of incorrectly signed or debug-signed APK packages to Firebase Hosting CDN channels.
- Added dynamic authoritative expected signature validation resolving directly from app version configuration files.
- Improved updater checking by validating signature fingerprints in release metadata to block mismatching packages before downloading.
- Added detailed troubleshooting diagnostics fields including certificate subject and issuer, validation stage, exact failing stage, root cause, and suggested fixes in the signature mismatch UI.

## 3.7.5

### Added
- Added multi-stage signature mismatch recovery featuring automated cache clearing, session recreation, and PendingIntent resets.
- Added direct GitHub Release package installation with SHA-256 integrity checks and signing certificate verification.
- Added detailed error dialogs containing technical/human explanations, detected cause, and current/latest version comparison.

### Fixed
- Fixed updater state machine overwrite issues to ensure signature mismatch and version checks are preserved.

## 3.7.4

### Added
- Added a premium Version Manager UI with a visual upgrade path timeline, current version highlighting, and detailed release date badges.
- Added a secure, native-styled React downgrade warning and confirmation modal explaining risks, compatibility, and reversibility.
- Significantly expanded Update Diagnostics with search, category filtering, and item expansion for performance, network, storage, and installer logs.
- Integrated animation and boot timing telemetry tracking JS engine load, native bootstrap latency, and frame rendering.

### Fixed
- Eliminated logo splashes and background flashes during Android launch for a seamless planet-intro fade-in transition.

## 3.7.3

### Added
- Added interactive Resume/Discard confirmation prompts for interrupted updater package installations.
- Added automatic cleanup of stale PackageInstaller history and cache files on up-to-date checks.

### Fixed
- Resolved checking for updates regression where manual clicks skipped checking and went directly to pending install progress.

## 3.7.2

### Added
- Implemented smart HTTP resume and partial downloadRange writing for interrupted updates.
- Added prioritized mirror failovers (GitHub Release -> Firebase Hosting -> Official Mirror).
- Created Failsafe Direct intent installer bypass using FileProvider URIs to override PackageInstaller session blocks.
- Added Recovery Mode overlay displaying version details, diagnostics log compile, and manual copy/share actions.

### Fixed
- Resolved checking for updates regression where modal would show stuck 0% download progress.
- Aligned Hub bottom navigation auto-hide animation with the rest of Studio.

## 3.7.1

### Fixed
- Resolved the "Check for updates" regression that opened the updater dialog prematurely and showed a stuck 0% progress screen.
- Restored the theme-aware, animated top-right update indicator pill/badge z-index so it doesn't render behind other elements.

### Added
- Implemented Version Manager UI under settings, allowing users to downgrade to the previous stable release (v3.7.0) or one version prior (v3.6.99).
- Added Update History tracking, recording all transition states locally in a persistent log.
- Upgraded the PackageInstaller to call setRequestDowngrade(true) to support downgrades with matching signing signatures.

## 3.7.0

### Added
- Consolidated all system updater improvements into a new stable baseline.
- Prevented Background Activity Launch (BAL) blocks on Android 14+ by instantiating explicit ActivityOptions.
- Eliminated state-overwrite race conditions and duplicate download loops via strict state transition guards.
- Streamlined PackageInstaller session commit and lifecycle callback handling.
- Enhanced updater diagnostics sheet with detailed session validation matrices, certificate signatures, and execution traces.

## 3.6.99

### Added
- Resolved Android 14+ background activity start block by configuring explicit ActivityOptions in InstallReceiver.
- Prevented double-download and progress thrashes with strict state-transition guards in the update manager.
- Fully validated system update end-to-end and successfully launched native confirmation dialog.

## 3.6.98

### Added
- Resolved PackageInstaller update handoff bug by actively launching system confirmation intent from InstallReceiver.
- Optimized native launch splash screen to use DayNight color systems to eliminate light/dark flashes.
- Made startup experience premium by transitioning directly into planets animation on WebView mount.
- Expanded Update Diagnostics Sheet to render complete PackageInstaller session logs, timestamps, elapsed times, and stack traces.

## 3.6.97

### Added
- Resolved PackageInstaller update handoff bug by actively launching system confirmation intent from InstallReceiver.
- Optimized native launch splash screen to use DayNight color systems to eliminate light/dark flashes.
- Made startup experience premium by transitioning directly into planets animation on WebView mount.
- Expanded Update Diagnostics Sheet to render complete PackageInstaller session logs, timestamps, elapsed times, and stack traces.

## 3.6.96

### Added
- Implemented deep pre-release APK certificate validation via keytool and apksigner checks.
- Deployed automated self-test utility test-updater-flow.mjs for update system pipeline verification.
- Optimized app startup time by disabling heavy stack trace captures inside production console loggers.
- Deferred active watchdog recovery to T+1000ms to eliminate false positive startup thrashes.
- Expanded Update Diagnostics Sheet with validation status matrices, certificate hashes comparison, and logs controls.

## 3.6.95

### Added
- Implemented native PackageInstaller Session API for the update system.
- Added a premium, comprehensive diagnostics system for updater failures.
- Added share, export, and retry capabilities for update logs.
- Added detailed hardware, locale, storage, and certificate comparison diagnostics.

## 3.6.94

### Fixed
- Fixed Android cold launch delay before app appears.
- Improved launch surface / first visible frame.
- Improved startup timing diagnostics.
- Restored Hub bottom nav auto-hide/show.

## 3.6.93

### Added
- Expanded guitar chord database with new qualities and 14 slash chords.
- Fixed floating chord diagram skipping and auto-scrolling issues in Practice.
- Added active segment/phrase highlighting to sync with playback timeline.
- Fixed horizontal scroll block on Discover genre chips.
- Made app entry transition and launch animations 25% faster.

## 3.6.92

### Added
- Expanded guitar chord database by adding the minor 13th (min13) quality and chord shape definitions.
- Enhanced normalization layer to support Latin roots, unicode symbols, and suffix aliases like 7M/M7/menor/maior.
- Upgraded import diagnostics and chord mapping tooltips in the preview modal for better diagram verification.
- Correctly categorized extended and new chord shapes under the right sections in Chordex Library.

## 3.6.91

### Added
- Expanded chord diagram coverage in Practice mode by auto-generating complete guitar shapes for all standard roots and extensions.
- Implemented a robust chord normalization layer converting Latin roots, unicode accidentals, and suffix aliases before resolution.
- Added slash chord fallback rendering: shows the base chord shape and details the bass note on missing slash definitions.
- Integrated a Supported Sites status checklist inside the URL Import modal showing Supported, Limited, and Blocked hosts.
- Implemented dedicated import adapters with detailed error diagnostics for E-Chords and 7 other chord search sites.

## 3.6.90

### Fixed
- Fixed Cifra Club URL importer failure in production by implementing a resilient, multi-strategy layout parser.
- Added support for both mobile and desktop Cifra Club web structures using Apollo JSON parsing and wildcard <pre> tag recognition.
- Integrated inline parser diagnostics list in the chart preview screen to display execution strategies.

## 3.6.89

### Added
- Added user-initiated Import from URL workflow for Cifra Club and generic preformatted chord charts.
- Implemented interactive Preview-Before-Save layout to inspect parsed chords and lyrics.
- Integrated imported chords directly into the Practice view and floating diagram overlays.
- Saved imported charts privately in local storage as User Imported charts.

## 3.6.88

### Removed
- Removed suggested/generated fallback chord progressions.
- Purged hand-aligned chord charts for copyrighted songs in compliance with licensing guidelines.

### Added
- Integrated custom user import and edit chord sheet fallback actions.
- Implemented premium badge indicators for Verified, User, Provider, and Unavailable states.

### Improved
- Polished Practice UI and layout when chords are unavailable (showing lyrics only).
- Disabled floating chord diagrams overlay when no verified or user chords are present.

## 3.6.87

### Added
- Implemented hand-aligned verified chord charts database for curated song lists.
- Integrated new ChordChartProvider search hierarchy prioritising user and verified charts.
- Added premium status indicators indicating chord authenticity (Verified, User, Suggested, Lyrics).

### Improved
- Aligned chord placement to lyrics with accurate timestamp interpolation.
- Refactored manual chord editor modal to easily customize, paste, or reset chord sheets.
- Polished Practice UI layout, typography, line highlights, and viewport spacing.

## 3.6.86

### Added
- Added suggested practice chords mapped to lyrics when verified chord charts are missing.
- Redesigned Chords Home with Chord of the Day, quick categories, and practice tips.

### Fixed
- Fixed Library back button navigation and improved return-to-hub transition logging.

## 3.6.85

### Added
- Implemented MetroList-style lyrics provider integration with LRCLIB auto-fetching.

## 3.6.84

### Fixed
- Matched Stagex History panel design and transitions to Layouts UI.
- Resolved Android native swipe-back gestures for PDF Export and History panel.

## 3.6.83

### Improved
- Added performance diagnostics for sub-app transitions.
- Optimized startup sequence and deferred heavy bundle compilation.
- Polished Stagex touch targets and back button navigation.
- Enhanced native OTA update installer progress tracking.

## 3.6.82

### Fixed
- Optimized startup planets animation with cached dimensions and pre-computed logo offsets.
- Expanded Stagex plot object selection hitboxes by 16px and suppressed tap highlight overlays.
- Redesigned Stagex history menu into a responsive bottom sheet and disabled undo/redo on open.
- Resolved Stagex back-gesture coverage, including presets panel and history overlay detection.
- Refactored native update progress flows with support for all 10 states and automated install.

## 3.6.81

### Fixed
- Optimized startup planets animation and throttled layout queries to prevent freezes.
- Deferred React mounting and non-critical assets load to ensure smooth initial frames.
- Implemented double-buffered loading to eliminate sub-app entry transition stutters.
- Added universal swipe-to-back navigation and root screen exit behavior setting.
- Fixed bottom nav restoration stutters upon exiting nested panels or practice mode.

## 3.6.80

### Fixed
- Fixed global i18n root causes in settings menus and Vocalex Harmonizer.
- Added authorized lyrics and chords support for public-domain songs in Chordex Practice.
- Implemented user-provided custom lyrics/charts paste, edit, and delete flows.
- Optimized floating chord overlay to make diagrams primary and chord names secondary labels.

## 3.6.79

### Fixed
- Fixed incomplete global language switching across the entire app suite.
- Removed entry animation glow and bloom effects from app entries.
- Redesigned Chordex Discover Practice UI to feel polished and native.
- Added clean empty chart placeholder with support for custom chart importing.
- Simplified Practice Settings, keeping size, spacing, and BPM controls.
- Upgraded floating chord widget to display real guitar chord diagrams.
- Scoped bottom navigation bar hiding strictly to the Chordex practice view.

## 3.6.78

### Added
- Centralized localization (i18n) architecture using a unified JSON source of truth.
- Implemented Chordex practice screen with interactive chords-above-lyrics formatting.
- Added draggable floating chord overlay with screen boundary protection and local persistence.
- Added karaoke mode with auto-scroll settings, custom text sizes, and AMOLED contrast themes.
- Expanded Discover song library with 30 detailed song charts by Enjambre.
- Polished app entry transitions with cross-fade overlays and responsive grid/flex layout scaling.

## 3.6.77

### Added
- Increased splash duration (950ms delay with 300ms fadeout) to guarantee visual presence.
- Added fully opaque, theme-adaptive splash backgrounds preventing layout bleed-through.
- Configured dynamic theme adaptation for splash logos and app name titles.
- Eliminated off-screen CPU/GPU rendering overhead of loading animations in background boundaries.
- Synced fade-out with double requestAnimationFrame to ensure browser paints first.

## 3.6.76

### Added
- Implemented dedicated per-app launch screen animations with centered logos and names when opening sub-apps from the Hub.
- Preloaded and initialized sub-app rendering in the background behind the splash screen to eliminate visually jarring entry flickers.
- Enforced a premium minimum launch screen duration (850ms) to ensure smooth transitions.

## 3.6.75

### Added
- Modified navigation forensic snapshot sequence to capture unconditionally at T+0ms, T+50ms, T+100ms, T+250ms, T+500ms, T+1000ms, and T+2000ms.
- Rendered live paint verification screenshots inside the Navigation Forensics panel of the debug overlay.
- Optimized offscreen paint capture image quality to reduce local storage footprints.

## 3.6.74

### Added
- Integrated early orbit intro dismissal bypass when returning from sub-apps via path check and sessionStorage tracking.
- Accelerated launchApp zooming timing to execute setZooming(true) immediately, aligning transition states.
- Re-aligned sub-app transition behavior with the web platform to prevent double-scaling effects.

## 3.6.73

### Added
- Restored centered app-specific loading screens showing animated logos, app names, and customized loading indicators for all sub-apps.
- Smoothed sub-app entry and exit transitions, eliminating any temporary black or blank frames during bundle loading and heavy initialization.
- Integrated persistent sub-app loading screens with Stagex iframe onload/bridge-ready hooks to prevent gray backgrounds.
- Streamlined sub-app mount performance and eliminated rendering delays on Android devices.

## 3.6.72

### Added
- Restored original smooth transition animations for sub-app entries and exits.
- Optimized navigation performance and transition frame-rates on physical Android devices.
- Memoized SubAppWrapper component to prevent unnecessary React re-renders.
- Hidden emergency debug UI, panic menu, and watchdog telemetry from production, keeping diagnostics accessible behind a debug flag.

## 3.6.71

### Fixed
- Mitigated React Error #300 hook order violation in BottomNav by hoisting hooks above conditional return statements.
- Integrated runtime React stack trace symbolicator with VLQ sourcemap decoding and online/offline mapping.
- Added COPY SYMBOLICATED REACT ERROR REPORT action to crashed boundaries and debug overlay timelines.
- Resolved WebView black screen and compositing freezes on sub-app exits with enhanced telemetry and paint validation.

## 3.6.70

### Fixed
- Prevented the visible RootApp ErrorBoundary crash panel from flashing during recoverable Chordex to Hub return transitions.
- Configured RootApp ErrorBoundary to render a neutral dark layout during return sequences, recovering silently.
- Added detailed telemetry logging for RootApp ErrorBoundary catches, recorded under local storage logs.
- Added COPY ROOTAPP ERROR LOG and COPY LAST RECOVERABLE ERROR buttons to Failed Timeline tab.
- Integrated RootApp Error counts, suppression status, and recovery duration diagnostics in Emergency Debug Overlay.

## 3.6.69

### Added
- Upgraded the root React app tree structure to render EmergencyDebugOverlay at root level.
- Refactored App.tsx layout to keep the outer app-container permanently mounted, preventing root-level unmounts.
- Integrated LifecycleTracker logging to record component mount/unmount stack traces and Suspense fallback states.
- Implemented ROOT_APP_TREE_MISSING and HUB_DOM_NOT_MOUNTED diagnostics to isolate rendering failures.
- Added COPY ROOT LIFECYCLE LOG and COPY MOUNT/UNMOUNT STACKS buttons to Failed Timeline tab.
- Fixed React Error #300 hook order violation in BottomNav by hoisting hooks above conditional return statements.
- Integrated runtime React stack trace symbolicator with VLQ sourcemap decoding and online/offline mapping.
- Added COPY SYMBOLICATED REACT ERROR REPORT action to crashed boundaries and debug overlay timelines.

## 3.6.68

### Added
- Upgraded StudioHub to mount synchronously and permanently, eliminating Suspense-induced unmounts.
- Improved the failsafe watchdog to run active DOM restoration at T+50ms, T+100ms, T+250ms, and T+500ms checkpoints.
- Added comprehensive report export options to Failed Timeline (Full Report, Timeline JSON, Summary, Checkpoints, and Recovery Log).
- Fixed the header version display to dynamically show both the current runtime and captured timeline versions.

## 3.6.67

### Added
- Upgraded StudioHub to a synchronous static import to prevent Suspense fallback unmounts.
- Added a failsafe T+50ms watchdog to force-mount StudioHub and clear transition locks if the DOM is missing.
- Updated watchdog return validation to enforce pass/fail criteria on chronological checkpoints.

## 3.6.66

### Added
- Added automated forensic snapshots at T+0ms, T+50ms, T+100ms, T+250ms, T+500ms, T+1000ms, and T+2000ms.
- Enhanced snapshot data model with topmost stack, computed CSS styles, bounding rects, and WebView metrics.
- Added visual thumbnail capture with html2canvas at every checkpoint.
- Added Last Failed Navigation Timeline panel showing chronological checkpoints.
- Added auto-open behavior of emergency overlay on startup following force-closes.

## 3.6.65

### Added
- Added Paint Verification using html2canvas to Navigation Forensics.
- Added Force WebView Repaint recovery action with multiple visual repaint cycles.
- Added Force Full Hub Rebuild recovery action to remount the Hub subtree with a new React key.
- Added Force WebView Refresh Layer compositor invalidation recovery action.
- Added automated timing forensic snapshots at LEAVING_CHORDEX, ENTERING_HUB, T+500ms, and T+2000ms.
- Integrated paint validation into the 1200ms return watchdog to detect and record compositor freeze errors automatically.

## 3.6.64

### Added
- Added pixel-level visibility probes to detect screen rendering freezes.
- Added WebView computed layout, compositing, and layer count diagnostics.
- Added Visual Repaint Recovery and React Nuclear Remount actions.
- Upgraded Navigation Forensics with timing snapshot comparison dropdowns.

## 3.6.63

### Added
- Added auto-capture forensic telemetry for returns from Chordex to Hub.
- Added side-by-side transition state comparison audits (Previous vs Current snapshot).
- Added Force Hub Repaint recovery failsafe tool to clear black screen states.

## 3.6.62

### Fixed
- Upgraded Black Screen Forensics telemetry with elementsFromPoint stacks, fullscreen overlay scanning, and React component fiber audits.
- Added one-click copy forensics report and filtered DOM snapshot buttons to the debug overlay.
- Added force fullscreen overlay removal and force hub visibility recovery controls.
- Fixed Stagex landscape viewport squashing layout mapping offsets.
- Expanded Stagex scene selection, add, and delete touch targets to a minimum of 48dp x 48dp.

## 3.6.61

### Fixed
- Hardened Hub root diagnostics using multi-fallback element selectors.
- Resolved false-positive watchdog failsafes during slow Suspense paints.
- Ensured emergency DBG button is always mounted and auto-recreated if removed.
- Expanded panic context menu with 8 one-click debug data copy actions.
- Added computed style detail printouts in DOM tree snapshots.

## 3.6.60

### Fixed
- Mounted emergency debug overlay outside the main React root via React Portal.
- Added always-visible DBG button and failsafe quick recovery panel.
- Implemented window.__emergencyOverlayHealthCheck() layout stacking audits.
- Added simulated black screen layer tool to verify diagnostic recovery.

## 3.6.59

### Fixed
- Resolved Chordex -> Hub return black screen by keeping StudioHub permanently mounted.
- Eliminated watchdog false-positives via an optimized 1.2s verification delay.
- Added separate HUB_ROOT_MISSING_CAPTURE diagnostic snapshot inside local storage.
- Preserved accurate previous mode history in failsafe recovery logs.

## 3.6.58

### Fixed
- Fixed persistent Chordex-to-Hub return black screen issue via a deterministic failsafe.
- Resolved GSAP target missing console warning.
- Improved diagnostics and trace logging.

## 3.6.57

### Added
- Added advanced WebView diagnostics for black screen analysis.
- Added automatic localStorage persistence for watchdog trace reports.

## 3.6.56

### Added
- Added black screen diagnostic capture action in Developer Tools.
- Added automatic black screen blocker detection and telemetry.

### Fixed
- Fixed Stagex scene buttons touch hitboxes alignment using concentric transparent layout.
- Enlarged delete scene buttons to 36x36px touch target.

## 3.6.55

### Added
- Integrated a "Test Stagex Scenes Input" diagnostic action in Developer Tools.

### Fixed
- Hard-gated Firestore on Android when Supabase is active to prevent runtime connections.
- Resolved Chordex-to-Hub return black screen with an opacity transition fallback.
- Fixed Stagex Scenes bar touch hitboxes by adding position: relative and CSS pseudo-element expansions.

## 3.6.54

### Added
- Added navigation trace and transition diagnostics tab under Developer Tools.

### Fixed
- Fixed false hub warnings by reclassifying diagnostics logs inside devTools.
- Resolved black screen bug when returning from Chordex to Livex Hub.
- Mapped Warnings Inspector to conform to clean WarningItem data model.

## 3.6.53

### Added
- Rebranded user-facing elements and text from "Studio" to "Livex" (Livex Hub).
- Enhanced Developer Tools Warnings view with warning copy and unified diagnostics layout.

### Fixed
- Fixed the "View Warnings" button click responsiveness and event lifecycle on Android.
- Resolved "Black Screen Return Bug" by properly clearing sub-app launch timers on Hub return.
- Polished Stagex landscape mode: zoomed out stage plot and adjusted left toolbar placement.

## 3.6.52

### Added
- Integrated Warnings Inspector inside the Logs view in Developer Tools.
- Added Missing Assets sniffer to Network Request tab to group and diagnose 404 errors.

### Fixed
- Packaged complete Drumex audio assets inside the APK, preventing 404 remote preloading issues.
- Fixed 'View Warnings' WebView touch propagation and overlay response delays on Android.
- Polished Stagex landscape mode: adjusted canvas zoom, decreased toolbar toggle size, increased scenes tab touch targets with ontouchend fast-tap, and positioned element drawer above Add button.

## 3.6.51

### Added
- Dedicated Warnings Inspector in Developer Tools with duplicate count grouping and mobile-friendly scrolling.

### Fixed
- Resolved console module parsing bug to correctly categorize system and infrastructure warnings under true source modules instead of defaulting to Studio Hub.
- Refined Stagex landscape layout, removing bottom collapse arrows, center-aligning left toolbar vertically, and elevating the vertical drawer to clear FAB/Eye buttons.

## 3.6.50

### Added
- Redesigned Developer Tools toggle switch and added live card stats.
- Added multi-app status diagnostics for Hub, Chordex, Drumex, Stagex, Groovex, and Vocalex.

### Fixed
- Resolved app switching black screen transition issue with cached views.
- Fixed startup routing restoration to prevent default sub-app recovery.
- Improved Stagex landscape layouts, Safe Area offsets, and expanded button touch targets.

## 3.6.49

### Fixed
- Optimized 120 Hz display rendering and route animations for extreme responsiveness.
- Eliminated background gray flashes by enforcing pure black (#000000) layouts and windows.
- Redesigned Developer Tools into an intuitive dashboard with dedicated sub-view cards.
- Implemented modular diagnostics copy buttons for individual diagnostic sections.

## 3.6.48

### Added
- Created an interactive Stagex Bridge Self-Test runner to verify runtime command execution.
- Added a System Health Summary card at the top of the Developer Tools dashboard for quick mobile check.
- Upgraded the log viewer with a collapsible summary list tailored for phone viewports.
- Added available and missing handlers details to the Stagex diagnostics section.

### Fixed
- Fixed Stagex runtime command system on Android by correcting syntax issues and bracket mismatches.
- Resolved the `_orig is not a function` error.
- Upgraded the iframe postMessage bridge to immediately return ACK/NACK and prevent silent timeouts.

## 3.6.47

### Added
- Upgraded the Developer Tools UI to be fully phone-adapted with collapsible sections and safe area layouts.
- Added a dedicated Stagex diagnostics panel showing detailed postMessage ACK telemetry.
- Preserved the legacy Update Diagnostics page and added sub-navigation.

### Fixed
- Fixed the Stagex iframe postMessage ACK bridge error by adding robust try-catch wrapping and diagnostics.

## 3.6.46

### Added
- Created a centralized Developer Tools / Debugging Tools system accessible via Settings.
- Support for runtime log, error, event, performance, and network sniffing.
- App-specific diagnostic panels for Chordex, Stagex, Drumex, Groovex, Vocalex, and Hub.

## 3.6.45

### Fixed
- Reverted the old Stagex restoration and adapted the modern Web Stagex design for Android.
- Fixed layout alignment to prevent bottom navigation overlaps on Samsung SM-S921B.
- Resolved cross-frame SecurityErrors by implementing asynchronous postMessage channels.
- Restored functional Stagex controls: Add picker, Setup/Preferences tabs, Save, PDF export, and Back-to-Hub navigation.

## 3.6.44

### Fixed
- Restored stable Stagex editor functionality and touch controls on Android.
- Optimized Android WebView performance and Hub transition times.
- Corrected Stagex plus-button and element-picker interaction.
- Restored Setup and Preferences tab switching within Stagex.
- Fixed elements scaling, rotation, deletion, and selection on canvas.

## 3.6.43

### Fixed
- Fixed Back-to-Hub navigation gray screen freeze.
- Reconnected Stagex controls and canvas touch events.


## 3.6.42

### Fixed
- Restored missing theme and layout CSS variables in separated platform build.
- Fixed Stagex onTouchEnd responsiveness for eye, plus, and rotate buttons on Android.
- Added transition active lock safety watchdog to prevent stuck screens.


## 3.6.41

### Fixed
- Resolved global style and layout regressions in the separated monorepo architecture.
- Added Tailwind CSS source path configuration for shared workspace packages.


## 3.6.40

### Fixed
- Fixed Stagex same-origin bridge and allowed null origins.
- Resolved ScreenOrientation.lock UI thread blocking issues.
- Fixed element picker pointer-events and touch interactions.
- Restored Stagex bottom-navigation and system back gesture handling.


## 3.6.36

### Fixed
- Restored Stagex bottom-navigation section switching.
- Corrected Stagex plus-button and element-picker interaction.
- Corrected Stagex eye/visibility control behavior.
- Corrected parent-to-iframe command delivery in Android WebView.
- Improved selected-element controls.
- Prevented transition states from leaving Studio on a black screen.
- Added recovery actions when a Studio module fails to load.

### Improved
- Unified Help Center and FAQ & Support into Help & Support.
- Added searchable support content and functional troubleshooting actions.
- Improved transition cleanup when switching between Studio apps.
- Improved Stagex interaction diagnostics and event handling.


## 3.6.35

### Added
- Added transition serialization to stabilize fast app-switching.

### Improved
- Unified Help & Support center with search, categories, and live diagnostics.
- Safeguarded sub-apps with lazy import retries and Error Boundaries.

### Fixed
- Fixed Stagex mobile controls touch responsiveness and layout re-render click loss.
- Resolved Stagex iframe cache load race conditions.


## 3.6.34

### Added
- Added Stagex native landscape rotation locking.
- Added Setup sub-section navigation corrections.
- Added Mobile-only Settings cleanup.

### Improved
- Improved orientation change transitions.
- Improved Android system Back and swipe-back gesture responsiveness.
- Improved bottom navigation stability.
- Improved Help, FAQ, Terms, Privacy, and Report a Bug pages.

### Fixed
- Fixed Stage element touch drag cancellation and freeze issues.
- Fixed stuck selection rectangle on resize and orientation change.
- Fixed Drumex black-screen safeguards on mount.


## 3.6.33

### Added
- Restored Stagex element picker and visible elements (Guitar, People/Performers, etc.).
- Restored Chordex bottom navigation for Android.
- Added version-gated native WebView Cache Storage cleanup preventatively.

### Improved
- Centered and scaled Stage plot for phone screens.
- Improved global system Back and left-edge swipe-back navigation.
- Improved Setup Back button behaviors to prevent duplicate controls.

### Fixed
- Fixed Stagex mobile layout alignment and rotation.
- Fixed Setup, Rider, Setlist, and Gear Back navigation.


## 4.0.0

### Added
- Added adaptive Web navigation rails for laptop/desktop screen widths.
- Added Web-specific internal app navigation tabs for tablet/iPad screen widths.
- Added Web-specific internal app navigation for Chordex, Drumex, Stagex, Groovex, and Vocalex.

### Improved
- Improved Web shortcuts and deep shortcuts to target sub-sections.
- Repositioned back buttons inline to prevent overlap in Web layouts.

### Fixed


## 3.6.31

**Android/mobile 3.6.31**

### Fixed
- Fixed Android native mobile layout regressions in Stagex and Setup panels.
- Fixed Stagex element visibility and same-origin protocol mismatch.
- Removed duplicate Back buttons and aligned bottom navigation in WebView.

## 3.6.30

**Android/mobile 3.6.30**

### Fixed
- Android update compatibility release using the production signing certificate.

## 3.6.29

**Android/mobile 3.6.29**

### Added
- Redesigned Stage Plot for mobile matching modern Web Stagex visuals.
- Redesigned Scenes bottom sheet and management interface for mobile devices.

### Improved
- Improved element selection outlines and scaled resize controls.
- Aligned Stagex mobile canvas colors with Light, Dark, and AMOLED Web theme definitions.
- Preserved all mobile gestures, offline capabilities, and project saving.

### Fixed
- Removed Zones from mobile UI while maintaining legacy project compatibility.

## 3.6.28

### Fixed
- Fixed Web update actions falling back to Android manual APK update states.
- Fixed legacy Web clients getting stuck in stale cache/service-worker update flows.
- Ensured Web update actions refresh Studio instead of opening Android install UI.

### Improved
- Improved Web cache and service-worker cleanup during update refresh.
- Preserved Android APK/AppInstaller updater behavior.

## 3.6.27

### Fixed
- Fixed Studio Web incorrectly showing Android manual APK update states.
- Separated Web/PWA update metadata from Android APK release metadata.
- Ensured Web uses refresh-based update behavior while Android keeps APK/AppInstaller updates.

### Improved
- Added clearer platform separation for update metadata and updater actions.
- Preserved shared Studio version and What’s New across Web and Android.

## 3.6.26

### Fixed
- Fixed issue where the web application would get stuck on old versions and fail to load updates.
- Implemented auto-cleanup of legacy push service worker instances to clear stale browser caches.
- Optimized Firebase Hosting caching configuration to prevent caching of index.html and service workers.

## 3.6.25

### Improved
- Web builds now show a slim, non-blocking refresh banner instead of the Android-style APK update modal.
- Settings → Updates page adapts for web: shows a 'Web Build' badge, Refresh button, and hides native-only controls.
- Hub and Settings layouts are now centered and constrained on desktop/laptop screens for better readability.
- Desktop hover effects added for cards, buttons, and interactive settings rows.

### Fixed
- Fixed Stagex back-navigation so that swiping back or pressing back now properly closes open panels (timeline, presets, share modal, custom elements, etc.) instead of being ignored.

## 3.6.24

### Improved
- Revamped the signed-out profile benefits page to feature a premium, list-based glassmorphic layout.
- Enhanced the sign-in success overlay checkmark animation with expanding double ripple rings and a spring overshoot drawing path.

### Fixed
- Fixed sub-app back-navigation so that swipe-back and back button gestures consume the action instead of exiting to the Studio Hub.

## 3.6.23

### Improved
- Hardened release pipeline push phase with automatic cleanup of unstaged build files before rebasing.

## 3.6.22

### Fixed
- Fixed swipe-back touch gesture inside sub-apps to never exit to the Studio Hub, only navigating back to the previous screen.
- Removed duplicate Changelog row from the Settings UI.

### Improved
- Made applications launch instantly upon clicking, delaying zoom scaling animations slightly to ensure a lag-free visual transition.

## 3.6.21

### Fixed
- Hardened release pipeline push phase with retry logic and exponential backoff to handle transient remote push conflicts.

## 3.6.20

### Fixed
- Fixed release pipeline race conditions by introducing concurrency group constraints and rebase-before-push logic in CI.

## 3.6.19

### Fixed
- Prevented accidental GitHub Pages deployment paths from being treated as active Studio update infrastructure.

### Improved
- Removed unused Replit-specific project files and references from the Studio repository.
- Cleaned deployment documentation so Firebase Hosting is clearly the active hosting target.
- Removed stale GitHub Pages references from release/update documentation and configuration.
- Added validation to prevent updater metadata from pointing to GitHub Pages.

## 3.6.18

### Fixed
- Fixed Stagex Elements menu invisible dial chips capturing clicks.
- Fixed back-navigation in sub-apps to dismiss open sheets, menus, and forms before exiting.
- Fixed swipe-back gesture to dismiss open overlays instead of exiting immediately.

### Improved
- Improved updates page layout by embedding the changelog inside the hero card.
- Improved Settings subtitle localization and Stagex accent colors to dynamically adapt to the user theme color.

## 3.6.17

### New
- Redesigned the Updates page with a hero card, structured changelog, and Stitch-inspired layout.
- Added recent releases section with expandable changelogs.

### Improved
- Changed Settings subtitle to "Studio Settings".
- Renamed the Updater navigation row to "Updates".

## 3.6.16

### Fixed
- Paused unfinished cloud sync surfaces by marking Devices & Sessions, Backup & Sync, and Storage & Export as Coming Soon.
- Fixed profile photo updates so the new image appears consistently in Profile and Settings.
- Removed the misleading uploading profile picture dialog while cloud profile photo sync is paused.
- Fixed the Settings update button alignment and sizing.
- Fixed the Stagex visibility button overlapping the Elements menu.

### Improved
- Improved account/settings clarity by hiding unfinished sync controls behind Coming Soon states.
- Improved profile avatar consistency across account surfaces.
- Improved Settings header layout on mobile.
- Improved Stagex floating controls behavior when the Elements menu is open.

## 3.6.15

### Fixed
- Completed the signing reset path for builds where the original production keystore is unavailable.
- Added explicit reinstall-required metadata for APKs signed with the new certificate.
- Improved updater messaging when Android cannot install over an app signed with a different certificate.

### Improved
- Added safer release handling for signing certificate changes.
- Improved AppInstaller diagnostics for reinstall-required builds.
- Preserved strict signature validation for normal future updates.

### Changed
- This build requires a one-time uninstall/reinstall because the original Android signing key is unavailable. After reinstalling this version, future Studio updates can continue using the new signing certificate.

## 3.6.14

### Improved
- Bumped version to 3.6.14 to resolve signature mismatch eligibility validation error.

## 3.6.13

### Added
- Added Supabase Realtime Sync integration with dynamic diagnostics and switcher UI.
- Integrated Firebase and Supabase database status fields in settings.
- Added automatic payload sanitization and write timeout safeguards.

## 3.6.12

### Added
- Added Supabase Realtime Sync provider as an option alongside Firebase Cloud.
- Added Sync Provider selector to settings to allow switching between database backends.
- Added dynamic diagnostics information for the active sync provider.

## 3.6.11

### Fixed
- Fixed Cloud Sync initialization errors where Firestore or Firebase config was missing or not resolved.
- Fixed Diagnostics UI panel issues to prevent nested scrolling and text overflow on mobile viewports.
- Fixed manual registration button to prevent false successes when Firestore is unavailable.

### Improved
- Added clear warning cards in settings when Cloud Sync is not initialized.
- Added dynamic real-time Firebase configuration metrics (Apps count, App name, services state, and init errors) to Sync Diagnostics.
- Improved clipboard copy diagnostics payload to include all newly introduced Firebase state diagnostics.

## 3.6.10

### Fixed
- Fixed Cloud Sync Probe failing on Android because Firestore rejected undefined userAgent values.
- Fixed Firestore sync writes to sanitize undefined fields before setDoc.
- Fixed Sync Diagnostics overflow on mobile by making the diagnostics section scrollable.
- Fixed Cloud Sync validation so probe errors show real Firestore failures.

### Improved
- Improved Android and Web sync diagnostics with copyable runtime reports.
- Improved Firestore payload sanitization across probe, devices, profile, and settings writes.
- Improved mobile usability for long diagnostics, paths, errors, and device metadata.

## 3.6.9

### Fixed
- Fixed unreliable Android and Web Cloud Sync connection.
- Fixed Devices & Sessions not proving whether devices were actually connected.
- Fixed current device being incorrectly classified as a previous session.
- Fixed profile, theme, accent, and photo sync relying on inconsistent local/cloud state.

### Improved
- Added a real Firebase-backed Sync Engine unifying all Firestore and Storage actions.
- Added stable device identity, heartbeat presence, and deterministic session classification.
- Added clearer sync diagnostics for Auth UID, Firebase project, listeners, writes, cache state, and probe results.
- Improved Firestore source-of-truth handling for profile and settings.

## 3.6.8

### Fixed
- Fixed duplicate properties compile typecheck error in sync diagnostics.
- Fixed incorrect device categorization in the Devices list.
- Fixed potential web connection gaps and session listener disconnects.

### Improved
- Improved device session classification utilizing deterministic categories for current device, active remotes, recent remotes, signed out, and legacy devices.
- Added periodic 30-second heartbeats for signed-in sessions to track device freshness.
- Added manual Reconnect Devices button in settings panel and developer tools.

## 3.6.7

### Fixed
- Fixed duplicate and stale device records appearing as active sessions in Devices & Sessions.
- Fixed legacy Android and Web session documents being shown as current devices.
- Fixed confusing session status combinations such as "Active just now" with "Idle."
- Fixed unknown version values appearing in main device cards.

### Improved
- Improved Devices & Sessions grouping for current device, other devices, and previous sessions.
- Improved device name normalization for Android and Web.
- Improved diagnostics for duplicate, stale, legacy, and replaced device records.
- Improved handling of older device documents created by previous Studio versions.

## 3.6.6

### Fixed
- Fixed Web/laptop devices not appearing in Devices & Sessions after Android registration was restored.
- Fixed Web device registration being skipped or not reflected across devices.
- Fixed Devices & Sessions rendering only the current device when multiple Firestore device documents exist.
- Fixed overly technical device names appearing in session cards.

### Improved
- Improved Android and Web session visibility from users/{uid}/devices.
- Improved Web device metadata handling for APK/OTA N/A cases.
- Improved device display names for cleaner session cards.
- Improved diagnostics for device IDs received, devices rendered, filtered devices, and raw technical metadata.

## 3.6.5

### Fixed
- Fixed Devices & Sessions showing no devices even when signed in.
- Fixed current device registration not writing to Firestore.
- Fixed missing device documents under users/{uid}/devices.
- Added diagnostics for device write status and listener status.
- Implemented robust device registration with 10-second write timeout and automatic retries.
- Added deep diagnostics in Devices & Sessions sheet listing 16 registration status parameters.
- Implemented automatic Firestore payload sanitization to prevent write rejections due to undefined native/platform fields.

### Improved
- Improved Devices & Sessions reliability across Android and Web.
- Improved current device detection and last active tracking.
- Improved cross-device session visibility.

## 3.6.4

### Fixed
- Fixed Devices & Sessions showing no devices even when signed in.
- Fixed current device registration not writing to Firestore.
- Fixed missing device documents under users/{uid}/devices.
- Added diagnostics for device write status and listener status.

### Improved
- Improved Devices & Sessions reliability across Android and Web.
- Improved current device detection and last active tracking.
- Improved cross-device session visibility.

## 3.6.3

### Fixed
- Fixed Android device not registering in Devices & Sessions.
- Fixed Web and Android sessions not seeing each other.
- Fixed Cloud Sync listeners appearing active without actual cross-device data updates.
- Fixed theme, accent color, profile name, and profile photo sync not propagating between devices.
- Fixed sync errors being hidden or treated as successful.

### Improved
- Added stronger Sync Diagnostics for device registration and Firestore listener state.
- Improved Devices & Sessions accuracy across Web and Android.
- Improved sync failure reporting.

## 3.6.2

### Fixed
- Fixed Cloud Sync not working correctly on Web builds.
- Fixed web/laptop sessions not registering as real devices.
- Fixed sync logic incorrectly depending on native APK/OTA fields.
- Fixed theme, accent color, and profile photo not syncing between Android and Web.
- Fixed Devices & Sessions not showing all signed-in devices.

### Added
- Added platform-aware sync diagnostics for Web and Android in Developer Options.
- Added detailed Build and platform labels for Devices & Sessions.

### Improved
- Improved cross-device sync reliability.
- Improved Devices & Sessions layout for web/browser sessions.

## 3.6.1

### Fixed
- Fixed Cloud Sync not syncing theme, accent color, and profile photo across devices.
- Fixed profile changes not updating live on other signed-in devices.
- Fixed Devices & Sessions only showing the current device.
- Fixed profile photo upload getting stuck without updating remote devices.

### Added
- Added real device registration for signed-in Studio accounts.
- Added live listeners for profile, appearance, preferences, and devices.
- Added Sync Diagnostics in Developer Options.

### Improved
- Improved account sync reliability.
- Improved cross-device settings updates.
- Improved local-first sync and offline recovery behavior.

## 3.6.0

### Added
- Added real cross-device sync for profile and account settings.
- Added live sync for theme, accent color, language, and preferences.
- Added profile photo upload and sync across devices.
- Added sync diagnostics in Developer Options.

### Improved
- Improved local-first sync behavior.
- Improved offline sync handling.
- Improved account/profile state consistency across Studio.

### Fixed
- Fixed account sync controls not actually syncing settings across devices.
- Fixed theme and accent color not appearing on other devices.
- Fixed profile photo not syncing between phone and laptop.
- Fixed Settings account card using stale local profile data.

## 3.5.0

### Added
- Added real Studio Cloud Sync for signed-in users.
- Added cross-device sync support for Studio account data.
- Added sync status, last synced time, and manual Sync Now controls.
- Added device registration for signed-in devices.
- Added local-to-cloud migration for existing data.
- Added sync diagnostics in Developer Options.

### Improved
- Improved account functionality with real backup and restore behavior.
- Improved profile/settings persistence across devices.
- Improved offline handling for syncable data.

### Fixed
- Fixed sync buttons appearing functional when sync was not actually implemented.

## 3.4.12

### Fixed
- Fixed internal Studio apps not following the selected accent color.
- Removed hardcoded blue accent styling from app controls.
- Fixed Chordex Discover genre chips appearing abruptly cut off while scrolling.

### Improved
- Unified accent color behavior across Hub, Settings, Chordex, Drumex, Stagex, Groovex, and Vocalex.
- Added polished horizontal fade behavior for scrollable chip rows.
- Improved visual consistency across the Studio ecosystem.

## 3.4.11

### Fixed
- Fixed Developer Options turning black after opening.
- Fixed profile display name changes not updating the main Settings account card.
- Removed the unnecessary floating “Up to date” badge.
- Removed technical developer/build diagnostics from the About screen.

### Improved
- Cleaned up the About screen to focus on user-facing app information.
- Moved technical build and update diagnostics into Developer Options.
- Updated the Updater Settings description to reflect Studio’s current update system.
- Improved Updater screen clarity and consistency.

## 3.4.10

### Improved
- Redesigned the APK-only updater dialog with clearer status, better spacing, and Studio visual styling.
- Improved the “What’s New” section in the update dialog.
- Replaced old OTA terminology with APK-only update wording.
- Improved Developer Options update diagnostics organization.
- Improved About screen responsiveness across phones, tablets, and desktop layouts.

### Fixed
- Fixed cramped About section layout on some devices.
- Fixed updater labels that still referenced the old OTA system.
- Fixed update dialog copy to better explain the Android installation step.

## 3.4.9

### Changed
- Migrated Studio updates to APK-only delivery.
- Removed OTA bundle application from the updater.
- Simplified update flow to use the native Android installer for every update.

### Fixed
- Fixed mixed App/OTA/APK version states.
- Fixed updates applying as OTA instead of opening the Android installer.
- Fixed black screen caused by WebView reload during updates.
- Fixed stale OTA bundle state affecting APK updates.

### Improved
- More reliable update process.
- Cleaner update diagnostics.
- Stronger APK validation before install.
- Consistent App Version and APK Version after updates.

## 3.4.8

### Fixed
- Fixed boot guard to rollback invalid OTA bundles and prevent WebView reload loops.
- Correctly cleared stale OTA bundles when a native APK wrap update is required.

### Improved
- Added detailed updater trigger, block, and final path diagnostics to Developer Options.
- Blocked developer OTA force updates on outdated native wrappers.

## 3.4.7

### Fixed
- Fixed APK-required updates to always open the native Android installer.
- Blocked silent OTA updates when the native APK version is behind the required versionCode.
- Disabled Capgo auto OTA bundle apply for APK-required releases to avoid WebView reload loop.
- Expanded pipeline guards to fail-fast if native or update-system files change in OTA releases.

### Improved
- Enhanced update diagnostics and checklists in Developer Options.
- Added detailed final update path logic for native wrappers.

## 3.4.6

### Fixed
- Fixed mixed OTA/APK version state where App Version could advance while APK Version stayed behind.
- Added required APK version enforcement.
- Prevented OTA-only updates when native APK updates are required.
- Added diagnostics for “Native APK behind” and “APK update required”.
- Improved release classification for ota/apk/both updates.

### Improved
- Safer update flow for users with older native wrappers.
- Better recovery path when APK Version is behind App/OTA Version.

## 3.4.5

### Fixed
- Fixed Android APK updates failing with “App not installed”.
- Added in-app APK install eligibility checks before launching Android installer.
- Added validation for package name, signing certificate, versionCode, and APK build type.
- Prevented invalid APK updates from being published.
- Improved update diagnostics when Android rejects an APK.

### Improved
- Strengthened automatic in-app update reliability.
- Improved consistency between GitHub APK, Firebase APK mirror, and update metadata.
- Reduced need for manual recovery installs.

## 3.4.4

### Fixed
- Fixed Android “App not installed” failure during APK updates.
- Added APK versionCode validation before release.
- Added signing certificate consistency checks.
- Added APK install eligibility diagnostics.
- Improved update failure messages for Android installer errors.

### Improved
- Strengthened APK release validation.
- Improved consistency between GitHub Release APK, Firebase APK mirror, and update metadata.

## 3.4.3

### Added
- Added automated validation for changelog structure and release note placeholders.
- Added structured releaseNotes field support to update manifests.

### Improved
- Improved updater UI to dynamically categorize and render release notes.

## 3.4.2

### Removed
- Removed Push Notifications support and related settings for now.
- Removed inactive push notification messaging from the update experience.

### Improved
- Revamped Developer Options with clearer sections and diagnostics.
- Improved Developer Options actions, statuses, confirmations, and feedback.
- Improved return-to-Hub transition to avoid black screen frames.
- Added a smoother app-to-Hub exit animation.

### Fixed
- Fixed Developer Options buttons that had incomplete or unclear behavior.
- Fixed return-to-Hub visual transition showing a black screen before the Hub appears.
- Fixed app shell visual reset during app exit.

## 3.4.0

- Moved Studio to production-signed release APKs.
- Improved APK installation trust and release signing validation.
- Added CI checks to prevent unsigned, debuggable, or incorrectly signed APKs.
- Requires a one-time clean reinstall for users coming from older debug-signed builds.
- Future updates after this install will work normally from inside Studio.

## 3.3.8

- Redesigned the update dialog with Studio’s visual style.
- Improved the update progress screen with percentage, status, and polished visuals.
- Improved the “What’s new” section layout.
- Improved the Ready to Install screen.
- Replaced generic blue update buttons with Studio accent styling.
- Improved install handoff so Studio does not intentionally reopen after launching the Android installer.
- Fixed updater overlay cleanup after install/later actions.
- Fixed potential stuck fade or black overlay states.
- Ensured only one updater dialog is used across the app.

## 3.3.7

- Added a polished account benefits section for signed-out users.
- Added clearer explanations for Cloud Sync, multi-device access, backups, personalization, recovery, and future account features.
- Added a small privacy note explaining account sync behavior.
- Improved the signed-out Account screen.
- Improved onboarding clarity for users who have not created a Studio account.
- Improved messaging around sync, backups, and cross-device use.

## 3.3.6

- Fixed black screen when returning from Studio apps back to the Hub.
- Unified app-to-hub navigation through one shared return handler.
- Added root UI fallback to prevent invalid blank/black render states.
- Improved app exit transition reliability.
- Improved Android back and predictive back recovery behavior.

## 3.3.5

- Fixed stale Firebase update manifests.
- Fixed duplicate update notifications.
- Removed legacy updater dialog conflicts.
- Fixed black screen caused by stale update dialog fade overlay.
- Unified the update dialog into one professional flow.
- Improved update state handling and retry behavior.
- Ensured manual checks always show accurate update status.
- Preserved AppInstaller runtime validation for APK updates.

## 3.3.4

- Fixed manual APK recovery downloads getting stuck at 100%.
- Added Firebase-hosted direct APK mirror for recovery installs.
- Improved manual update flow for users without AppInstaller.
- Added Copy Link and GitHub Fallback options for APK recovery.
- Improved APK download headers for Android compatibility.
- Prevented broken GitHub mobile download behavior from blocking recovery.

## 3.3.3

- Fixed repeated APK update failure when AppInstaller is unavailable.
- Fixed native AppInstaller registration reliability on Android.
- Added runtime AppInstaller availability checks before APK updates.
- Added manual recovery flow for users on older/broken APK builds.
- Prevented partial OTA/APK updates when native update support is missing.
- Added build-time validation to prevent APK releases without AppInstaller.
- Improved update diagnostics for native plugin availability.

## 3.3.2

- Added runtime capability checking for native AppInstaller plugin and its methods.
- Prevents starting corrupt downloads or partial updates if the native plugin is missing.
- Show clear manual update recovery dialog with direct download links on older APK wrapper versions.
- Added comprehensive AppInstaller diagnostics in Settings -> Developer Options -> Update Debug.

## 3.3.1

- Fixed black screen when returning from apps to Studio Hub using the top navigation.
- Fixed app exit transition state so the Hub renders correctly.
- Improved navigation reliability across Chordex, Drumex, Vocalex, Stagex, and Groovex.
- Added real system push notification support for updates using Firebase Cloud Messaging.
- Added deduplication so each update version notifies only once.
- Improved notification tap behavior to open the updater/changelog.

## 3.3.0

- Hidden Developer Options: Added a hidden settings menu with update controls, log viewing, and simulation tools.
- Advanced Diagnostics: Relocated and expanded all update diagnostics into the Developer Options menu.
- Firebase Hosting: Migrated OTA bundle and version manifest hosting from GitHub Pages to Firebase.
- SHA-256 Verification: Integrated cryptographic verification to check APK download integrity before installation.
- Size Reduction: Reduced OTA bundle download size by ~65% via optimized asset packing and WebP image formats.
- Performance & CORS: Fixed remote manifest fetch race conditions and native update CORS issues.

## 3.1.87

- WebView Permission Bypass: Automatically auto-grant WebView permission requests for WebRTC microphone streams, resolving cached site-level locks when OS permissions are active.
- In-App Direct Downloader: Added a clean warning card and button to download and install native APK updates directly from your settings panel when running an outdated shell.
- In-App Package Installer: Downloads system updates and launches the Android package installer directly inside the app, resolving 404 download errors by dynamically querying GitHub Release assets.
- Split Updater Layout: Segregated Over-the-Air (OTA) interface updates and App System Wrapper (APK) updates into explicit sections with clear descriptions detailing their differences.
- Download Progress Feedback: Added immediate visual timer feedback (1% to 15%) during downloader network handshakes to prevent the page from appearing stuck at 0%.
- Background Update Types: Updated background notifications to clearly differentiate between Interface Updates (OTA) and System Wrapper Updates (APK).
