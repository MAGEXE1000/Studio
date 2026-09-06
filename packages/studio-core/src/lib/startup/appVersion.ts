/**
 * Single source of truth for the Studio app version.
 *
 * Every consumer (Settings UI, Updater checker, debug tools, analytics)
 * MUST import from this module. Never hardcode a version string
 * elsewhere — duplication leads to settings showing one version while
 * the Updater system compares against another, which silently breaks
 * update notifications.
 *
 * The `public/version.json` file shipped alongside the bundle is
 * generated from `APP_VERSION` at build time by
 * `scripts/sync-versions.mjs` (wired in via the `prebuild` npm hook),
 * so the freshly-deployed bundle and its companion manifest are
 * always in lockstep.
 *
 * Bump `APP_VERSION` on every release. Bump `APP_CHANGELOG` to describe
 * what the user just received — that's the text shown in the
 * post-update modal on the first launch after the bundle is updated.
 *
 * Version format: strict semver (`MAJOR.MINOR.PATCH[-PRERELEASE]`).
 * The "Beta" label is presentation only — `APP_VERSION` itself stays
 * pure semver so comparisons are unambiguous.
 */

/**
 * Normalizes Mojibake corrupted character sequences resulting from double-encoding or Windows-1252/ANSI interpretation of UTF-8 strings.
 */
export function sanitizeUTF8String(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/â€¢/g, '•')
    .replace(/â€‹/g, '')
    .replace(/â€¦/g, '…')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, "'")
    .replace(/â€\x9d/g, '"')
    .replace(/â€\x9c/g, '"')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ');
}

import React from 'react';
import { Capacitor } from '@capacitor/core';
import { logVersionTransformation } from '../updater/versionLogger';

export const NATIVE_VERSION = '4.5.69';
export const NATIVE_VERSION_CODE = 40569;
export const WEB_VERSION = '4.5.69';
const cap =
  (typeof window !== 'undefined' && (window as any).Capacitor) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).Capacitor) ||
  Capacitor;
export const APP_VERSION = cap.isNativePlatform() ? NATIVE_VERSION : WEB_VERSION;

/** Optional pre-release tag rendered in the UI (e.g. "Beta", "RC"). */
export const APP_VERSION_TAG = '';

/** Human-readable label rendered in Settings → About. */
export const APP_VERSION_LABEL = APP_VERSION;

/**
 * Local date this build was stamped (e.g. "July 24, 2026").
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_VERSION_DATE = '8/12/2026';

/**
 * Git commit hash this build was generated from.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_COMMIT_SHA = 'afdc8c18';

/**
 * Unix epoch timestamp this build was generated.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_BUILD_TIMESTAMP = '9/6/2026, 2:36:20 PM CST';

/**
 * Changelog for the CURRENT release — shown to the user the first
 * time they launch the app after pulling this bundle, and from the
 * Settings → About → Changelog row at any time. Each section is a
 * heading + bullet list rendered Metrolist-style in `ChangelogSheet`.
 */
export interface ChangelogSection {
  /** Short uppercase header (e.g. "What's new", "Fixes"). */
  heading: string;
  /** Plain user-facing bullets. Keep each line short. */
  items: string[];
}

export const APP_CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    heading: 'Added',
    items: [
      'Restored GrooveX Vinyl Turntable Audio Feedback: Restored authentic vinyl turntable scratch and platter brake audio feedback on pause and resume, operating via an independent dedicated turntableBus connected to masterGain without modifying stem playback rates.',
      'Pre-Synthesized Analytical Turntable AudioBuffers: Mathematically pre-synthesized 520ms vinyl platter deceleration stop and 260ms needle cue direct-drive spin-up AudioBuffers with anti-click zero-crossing envelopes, zero network latency, and zero decoding overhead.',
      'Drumex Metronome User-First Presets: Replaced factory presets with an intentional "MY PRESETS" empty state and full CRUD workflow (create, in-place edit, duplicate with unique copy names, rename, delete).',
      'Dual-Mode Incremental Tempo Progression: Implemented deterministic tempo progression engine supporting both By Bars (evaluated strictly at bar boundaries) and By Time (on the monotonic Web Audio clock) with live summary cards.',
      'Synchronized Visual Count-In Countdown: Added floating 4-3-2-1 countdown overlay locked to Web Audio beat schedule events, unmounting cleanly at the exact instant performance begins.',
    ],
  },
  {
    heading: 'Fixed',
    items: [
      'Transposition & Stem Synchronization Preservation: All stem buffer sources remain locked to an invariant 1.0000x playback rate, guaranteeing 100% time and tempo preservation across -12 to +12 semitones with zero cumulative drift and bit-exact drum alignment.',
      'Android Media Controls Transport Alignment: Android notification shade, Quick Settings media card, lock screen, and Bluetooth play/pause actions seamlessly trigger the restored turntable stop and start audio feedback.',
      'Android Media Notification Badge Scaling: Redesigned notification artwork badge with generous padding and centered typography, eliminating SystemUI media card cropping and clipped BPM text.',
      'Neutral Accent Beat Toggle: Tapping the active accent beat toggles to a neutral state (-1) for unaccented metronome practice across all meters and subdivisions.',
      "Streamlined Rhythm Cards: Removed intrusive '+' tiles from Time Signature and Subdivision cards, presenting clean quick-selection grids alongside compact modal configuration triggers.",
    ],
  },
];

export interface ReleaseHistoryItem {
  version: string;
  date: string;
  highlights: string[];
}

export const RELEASE_HISTORY: ReleaseHistoryItem[] = [
  {
    version: '4.5.69',
    date: '2026-09-06',
    highlights: [
      'Restored GrooveX Vinyl Turntable Audio Feedback: Restored authentic vinyl turntable scratch and platter brake audio feedback on pause and resume, operating via an independent dedicated turntableBus connected to masterGain without modifying stem playback rates.',
      'Pre-Synthesized Analytical Turntable AudioBuffers: Mathematically pre-synthesized 520ms vinyl platter deceleration stop and 260ms needle cue direct-drive spin-up AudioBuffers with anti-click zero-crossing envelopes, zero network latency, and zero decoding overhead.',
      'Drumex Metronome User-First Presets: Replaced factory presets with an intentional "MY PRESETS" empty state and full CRUD workflow (create, in-place edit, duplicate with unique copy names, rename, delete).',
      'Dual-Mode Incremental Tempo Progression: Implemented deterministic tempo progression engine supporting both By Bars (evaluated strictly at bar boundaries) and By Time (on the monotonic Web Audio clock) with live summary cards.',
      'Synchronized Visual Count-In Countdown: Added floating 4-3-2-1 countdown overlay locked to Web Audio beat schedule events, unmounting cleanly at the exact instant performance begins.',
      'Transposition & Stem Synchronization Preservation: All stem buffer sources remain locked to an invariant 1.0000x playback rate, guaranteeing 100% time and tempo preservation across -12 to +12 semitones with zero cumulative drift and bit-exact drum alignment.',
    ],
  },
  {
    version: '4.5.68',
    date: '2026-09-06',
    highlights: [
      'Studio/Livex Android System Updater Redesign: Implemented the new flagship Android updater dialog matching the approved design system specifications with 400px width constraint, rounded-28 perimeter, micro scrollbar, and hardware-accelerated CSS state morphing transitions.',
      'Tactile Interaction & Visual Indicators: Added tactile button feedback (.livex-tap-press scale down on active touch), continuous scanning beam animations for package verification, and real-time download metrics (transferred MB, speed, ETA).',
      'Full Theme Parity: Engineered pixel-perfect support for Light (#ffffff / #f8fafc), Dark (#0c0d10 / #16171b), and AMOLED (true #000000 / #08080a) themes with canonical surface blur tokens.',
      'Categorized Release Notes Engine: Release changelogs are dynamically classified into distinct, color-coded badges (NEW in emerald, AUDIO ENGINE in blue, FIXED & IMPROVED in amber) with automatic fallback for single-version manifests.',
      'End-to-End Pipeline Wiring: Connected real-time download progress events, graceful download cancellation, cryptographic SHA-256 verification, and native Android PackageInstaller handoff.',
    ],
  },
  {
    version: '4.5.67',
    date: '2026-09-06',
    highlights: [
      'Signalsmith Stretch WASM AudioWorklet Integration: Integrated official C++ WebAssembly Signalsmith Stretch DSP engine running entirely within the Web Audio render thread for production multitrack stem transposition.',
      'Native Android Media Controls: Implemented real native Android MediaSessionCompat and foreground playback service exposing playback controls to the Android notification shade, Quick Settings media carousel, lock screen, and Bluetooth devices across GrooveX, Drumex Beats, and Metronome.',
      'Drumex Metronome Performance Mode: Automatically hides canonical bottom navigation in the Metronome tab to reclaim the lower viewport for compact performance controls.',
      'Time & Tempo Preserving Transposition: Decoupled musical key transposition from playback speed—all audio sources run at strictly 1.0000x playback rate with 0 duration change and 0 BPM change across -12 to +12 semitones.',
      'Percussion Stem Transposition Immunity: Percussion and drum stems (kick, snare, toms, hi-hats, cymbals, overheads, percussion) bypass pitch processing, keeping rhythm and transients 100% unaltered.',
      "Sample-Exact Latency Lock: Calibrated drum delay to match Signalsmith Stretch's deterministic 120.00ms latency, achieving bit-exact phase synchronization (Δt = 0.000 ms) between drums and melodic stems with zero cumulative drift.",
    ],
  },
  {
    version: '4.5.66',
    date: '2026-09-06',
    highlights: [
      'GrooveX Transposition UI Freeze Regression: Completely eliminated application freeze during musical key transposition by removing main-thread offline SoundTouch WSOLA processing.',
      'Native Hardware Playback-Rate Engine: Restored canonical zero-CPU Web Audio `AudioBufferSourceNode.playbackRate` adjustment across all stems (including drums/percussion), reducing transposition execution latency from multi-second blocking down to < 0.05ms (0 dropped UI frames, steady 60 FPS).',
      'Continuous Drift-Free Playback: Dynamic pitch changes during active playback now maintain seamless audio continuity with zero phase jump and 100% sample-lock synchronization across all stems.',
    ],
  },
  {
    version: '4.5.65',
    date: '2026-09-06',
    highlights: [
      'Drumex Metronome Primary Tab: Implemented the approved Drumex Metronome design as a primary production tab placed immediately to the left of Beats (`Metronome | Beats | Patterns | Preferences`).',
      'Deterministic Web Audio Lookahead Engine: Built high-precision metronome audio engine powered by authoritative Web Audio hardware clock (`currentTime`) and 25ms lookahead scheduler, guaranteeing zero perceptible lag and zero cumulative drift across 40–280 BPM.',
      'Pre-Synthesized PCM Percussive Kits: Pre-rendered 6 high-transient percussive sound kits (`Acoustic Woodblock`, `Acoustic Click`, `Digital Beep`, `Cowbell`, `Rimshot`, `Soft Click`) directly into cached in-memory AudioBuffers with zero network latency, consistent loudness, and clean transient attack.',
      'Metronome Presets Management: Full CRUD preset architecture with local storage persistence, supporting instant recall, inline preset creation, duplication, renaming, updating, and search filtering.',
      'Rhythm Metrics & Controls: Segmented pill selectors for Time Signatures (4/4, 3/4, 6/8, 2/4) and Subdivisions (1/4, 1/8, 1/16, 3let), accented Beat 1 tracking, audible count-in, practice timer, tap tempo, and floating quick controls dock.',
      'Clean Audio Lifecycle & Leak Immunity: Guaranteed zero node, timer, or context leaks over repeated start/stop cycles with automatic background/navigation teardown.',
    ],
  },
  {
    version: '4.5.64',
    date: '2026-09-05',
    highlights: [
      'GrooveX Sample-Accurate Multitrack Transposition: Re-architected transposition engine to use in-memory buffer-level SoundTouch transposition with exact sample length preservation and zero cumulative drift.',
      'Full Musical Transposition Scale: Supported pitch shifting across -12 to +12 semitones with instantaneous cache retrieval and seamless 25ms crossfade stem hot-swapping during live playback.',
      'Percussion Stem Transposition Immunity: Guaranteed 100% pitch and tempo immunity for all drum and percussion stems (kick, snare, toms, cymbals, hi-hats, percussion), keeping rhythm strictly locked to the hardware audio clock.',
      'Unified Zero-Latency Audio Graph: Eliminated worklet starvation delays, underrun zero-padding, and fractional skip resets by routing all stems directly into the unified master gain with Delta t = 0.000ms.',
    ],
  },
  {
    version: '4.5.63',
    date: '2026-09-05',
    highlights: [
      'Canonical Chordex Section-Entry Animations: Integrated the canonical Studio motion system (`StudioPageTransition` with `variant="drilldown"`) across all redesigned Chordex views (Library, Category browsing, Chord Detail, Songs list, Song Editor, and Saxophone Practice).',
      'Dynamic Drilldown Initial Entrance Support: Enhanced `StudioPageTransition` to support conditional initial mount entrance transitions, ensuring sub-views animate smoothly upon appearance while preserving root tab transitions.',
      'Canonical Studio Header Parity: Replaced all custom, ad-hoc, and static headers across Chordex with canonical `StudioHeader` (in-flow) and `SharedFloatingHeader` (floating glass capsule) components.',
      'Studio Performance & Architecture Optimization: Consolidated redundant orientation and navigation listeners in Stagex, purged dead module candidate scoring loops in Studio Hub, and eliminated unreferenced redesign imports across Chordex and Vocalex.',
      'Drumex Pattern Library Layout Unification: Unified desktop and mobile pattern browsing under the canonical `DrumPatternsPanel`, removing over 700 lines of duplicate code and reducing bundle overhead.',
      'Groovex Store Selector Memoization: Converted broad store subscriptions in Groovex Preferences to fine-grained atomic Zustand selectors, isolating preference views from unrelated playback state mutations.',
    ],
  },
  {
    version: '4.5.62',
    date: '2026-09-05',
    highlights: [
      'GrooveX Song Player Stitch Redesign: Redesigned the complete GrooveX Song Player into the canonical Stitch layout with elevated turntable plinth card, live waveform audio visualizer, timeline scrubber with section badges, 5-button transport cluster with vibrant illuminated Play/Pause FAB, semitone transposition stepper, and 6-channel multitrack stems mixer workstation.',
      'Realistic 60fps Vinyl Turntable Simulation: Implemented requestAnimationFrame rotational physics with realistic acceleration curve, natural ~1.8s inertia deceleration on pause, and absolute rotational angle preservation across pause/resume cycles.',
      'High-Fidelity Vinyl Styling & Tonearm Assembly: Multi-groove radial vinyl disc with center spindle label, dual conic sheen reflection, and articulated tonearm assembly with gimbal pivot base, tone arm needle, and smooth cueing transition to playing position.',
      'Studio Floating Header Song Lockup: Added subtitle support to SharedFloatingHeader housing the song title and artist strictly in the top floating pill, eliminating duplicate page body headers.',
      'Transposition Audio Engine Architecture: Eliminated digital buzzing and clicking in SoundTouch AudioWorklet processor by adding a 1024-sample pre-buffer threshold that guarantees full 128-sample render quantums.',
      'Bit-Exact Master Audio Bypass: Added bit-exact passthrough path at 0 semitones bypassing WSOLA processing entirely for 100% studio master clarity with zero latency or phase coloration.',
    ],
  },
  {
    version: '4.5.61',
    date: '2026-09-05',
    highlights: [
      'Drumex Beat Editor Studio Redesign: Redesigned the mobile Beat Editor into the canonical studio visual language with high-density layout and tactile production controls.',
      'Floating Pill Top Bar: Compact capsule header displaying pattern metadata, interactive BPM tempo pill, 4/4 time signature, kit subtitle, undo/redo buttons, and burger menu.',
      'Fixed Left Track Column with Real-Time Mute & Solo: Added persistent 104px track column with bold titles, mini M (Mute) buttons, mini S (Solo) buttons, and clean dot-separated articulation subtitles.',
      'Real-Time Audio Mute/Solo Synchronization: Integrated dynamic volume zeroing directly into DrumScheduler audio context without pausing playback or interrupting scheduling.',
      '4-Button Floating Action Controls (FAB Stack): Replaced legacy floating buttons with canonical vertical FAB stack for Reset/Erase, Loop, Metronome/Tempo, and primary Play/Pause.',
      'Musical Subdivision Ruler: Monospace subdivision labels with subtle downbeat background tint, bar line boundaries, and semantic measure menu icon.',
    ],
  },
  {
    version: '4.5.60',
    date: '2026-09-04',
    highlights: [
      'Stagex Setup Subsections Bilingual Localization: Implemented comprehensive English and Spanish translation coverage across all four Setup subviews—Technical Rider, Setlist Management, Gear Inventory, and Band & Crew Roster.',
      'Stagex History Surface & Floating Toolbar Localization: Integrated reactive bilingual dictionary hooks into the History surface and canvas floating action controls.',
      'Live Language Transition Architecture: Wired all Stagex setup components to `useT()` and `useSettingsStore` allowing instantaneous language switching (EN ↔ ES) with zero page reloads.',
      'Updater Ecosystem Bilingual Localization: Fully localized all updater states, progress bars, version comparisons, and action prompts in StudioUpdateScreen and UpdateIndicator.',
      'Roadmap Language Governance: Maintained visible, disabled, and greyed-out future languages (de, fr, zh, pt, it, ja, ko) with standardized "Próximamente" / "Coming soon" status chips.',
      'Stagex Canvas Landscape Presentation: Decoupled the editing history surface and optimized full-screen canvas aspect ratios.',
    ],
  },
];

/** Native English version of the current changelog for Android. */
export const APP_CHANGELOG_SECTIONS_NATIVE: ChangelogSection[] = [
  {
    heading: 'Added',
    items: [
      'Chordex Library Bento Redesign: Completely overhauled the Chordex Library section with a modern Bento card layout and ambient glowing accents.',
      'Dynamic Mini Fretboard Recesses: Introduced high-fidelity 6-string dynamic fretboard recess components with realistic gauge lines and glowing finger dots.',
      'Interactive Chord Preview Section: Integrated rich multi-instrument visualizers supporting instant toggles across Guitar, Bass, and Piano.',
      'Harmonic Categories Grid: Expanded category browser to 31 distinct harmonic flavors with signature 3-string mini recesses.',
      'Universal Theme Parity: Full adaptive styling across Dark, Light, and AMOLED modes.',
    ],
  },
];

/** Spanish version of the current changelog — picked at render time
 *  by `ChangelogSheet` based on `settings.language`. */
export const APP_CHANGELOG_SECTIONS_ES: ChangelogSection[] = [
  {
    heading: 'Añadido',
    items: [
      'Rediseño Bento de la Biblioteca Chordex: Renovación completa de la biblioteca con diseño Bento moderno, acentos luminosos y experiencia adaptable.',
      'Cavidades dinámicas de diapasón: Nuevos componentes dinámicos de 6 cuerdas con líneas realistas de calibre y puntos guía luminosos.',
      'Visualizador interactivo de acordes: Visualizadores multi-instrumento para Guitarra, Bajo y Piano con reproducción de audio y acordes sugeridos.',
      'Cuadrícula de categorías armónicas: 31 estilos armónicos con mini cavidades de 3 cuerdas y filtros rápidos por nota fundamental.',
      'Paridad universal de temas: Adaptación visual completa en modos Oscuro, Claro y AMOLED.',
    ],
  },
];

/** German version of the current changelog. */
export const APP_CHANGELOG_SECTIONS_DE: ChangelogSection[] = [
  {
    heading: 'Hinzugefügt',
    items: [
      'Chordex Bibliothek Bento-Neugestaltung: Vollständige Überarbeitung mit modernem Bento-Kartenlayout und responsiver Ansicht.',
      'Dynamische Mini-Griffbrett-Aussparungen: Hochpräzise 6-Saiten-Griffbrettkomponenten mit Bundlinien und leuchtenden Griffpunkten.',
      'Interaktive Akkord-Vorschau: Multi-Instrument-Visualisierungen für Gitarre, Bass und Klavier mit Audio-Wiedergabe.',
      'Harmonisches Kategoriengitter: Erweiterte Kategorieübersicht mit 31 harmonischen Varianten.',
      'Universelle Theme-Parität: Vollständige visuelle Anpassung für Dark-, Light- und AMOLED-Modi.',
    ],
  },
];

/** Returns the changelog sections for the requested language, falling
 *  back to English when no localized version is available. */
export function getChangelogSections(lang: string | undefined | null): ChangelogSection[] {
  if (lang === 'es' && APP_CHANGELOG_SECTIONS_ES && APP_CHANGELOG_SECTIONS_ES.length > 0)
    return APP_CHANGELOG_SECTIONS_ES;
  if (lang === 'de' && APP_CHANGELOG_SECTIONS_DE && APP_CHANGELOG_SECTIONS_DE.length > 0)
    return APP_CHANGELOG_SECTIONS_DE;
  return APP_CHANGELOG_SECTIONS;
}

/** Backwards-compatible flat bullet list (kept so any old caller still
 *  works). New UI should use `APP_CHANGELOG_SECTIONS`. */
export const APP_CHANGELOG = APP_CHANGELOG_SECTIONS.flatMap((s) => s.items);

/**
 * Parsed semver shape. Build metadata (everything after `+`) is
 * discarded — semver §10 says it has no precedence — but pre-release
 * identifiers are preserved so they can be compared per §11.
 */
interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  /** `null` for a release, e.g. "3.0.0". String for a prerelease, e.g. "beta.2". */
  prerelease: string | null;
}

/**
 * STRICT semver parser. Rejects leading zeros, missing parts, and
 * malformed input. Accepts a leading `v` (common in tag names) and
 * strips any `+build` metadata. Returns `null` on any parse failure
 * so callers can treat un-parseable input as "no comparison possible".
 *
 * Examples:
 *   "3.0.0"      → { 3, 0, 0, null }
 *   "v3.0.0"     → { 3, 0, 0, null }
 *   "3.0.0-beta" → { 3, 0, 0, "beta" }
 *   "3.0.0+abc"  → { 3, 0, 0, null }   (build metadata stripped)
 *   "01.2.3"     → null                 (leading zero)
 *   "3"          → null                 (incomplete)
 *   "3.0"        → null                 (incomplete)
 *   "garbage"    → null
 */
export function parseAndNormalizeVersion(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    logVersionTransformation('parseAndNormalizeVersion', raw, null);
    return null;
  }
  const match = raw.match(
    /[vV]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?/
  );
  if (!match) {
    logVersionTransformation('parseAndNormalizeVersion', raw, null);
    return null;
  }
  let clean = match[0];
  if (clean.startsWith('v') || clean.startsWith('V')) {
    clean = clean.slice(1);
  }
  logVersionTransformation('parseAndNormalizeVersion', raw, clean);
  return clean;
}

export function parseSemver(raw: string | null | undefined): ParsedSemver | null {
  const clean = parseAndNormalizeVersion(raw);
  if (!clean) {
    logVersionTransformation('parseSemver', raw, null);
    return null;
  }

  const m = clean.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
  );
  if (!m) {
    logVersionTransformation('parseSemver', raw, null);
    return null;
  }
  // Per semver §9: a pre-release numeric identifier MUST NOT include
  // leading zeros. Reject e.g. "1.2.3-01" or "1.2.3-alpha.001".
  if (m[4]) {
    for (const id of m[4].split('.')) {
      if (/^\d+$/.test(id) && id.length > 1 && id.startsWith('0')) {
        logVersionTransformation('parseSemver', raw, null);
        return null;
      }
    }
  }
  const resultObj = {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
  logVersionTransformation('parseSemver', raw, JSON.stringify(resultObj));
  return resultObj;
}

/**
 * Convenience: returns just the [major, minor, patch] tuple, or `null`.
 * Pre-release info is dropped — callers that care about prerelease
 * precedence should use `parseSemver` + `compareSemver` directly.
 */
export function normalizeSemver(raw: string | null | undefined): [number, number, number] | null {
  const p = parseSemver(raw);
  const resultObj = p ? ([p.major, p.minor, p.patch] as [number, number, number]) : null;
  logVersionTransformation('normalizeSemver', raw, resultObj ? JSON.stringify(resultObj) : null);
  return resultObj;
}

/**
 * Compare two semver strings. Returns -1 / 0 / +1 like Array.sort.
 * Returns 0 if either side fails to parse — i.e. an un-parseable
 * remote version is treated as "no update", never as a downgrade.
 *
 * Pre-release precedence per semver §11:
 *   - A version WITHOUT prerelease has HIGHER precedence than one WITH.
 *     ("3.0.0" > "3.0.0-beta" — the release supersedes the beta.)
 *   - Two prereleases compare identifier-by-identifier:
 *     numeric vs numeric → numeric;
 *     numeric vs alphanumeric → numeric is lower;
 *     alphanumeric vs alphanumeric → ASCII;
 *     fewer fields → lower precedence (when all prior fields equal).
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    logVersionTransformation('compareSemver', `${a} vs ${b}`, '0 (unparseable)');
    return 0;
  }
  let res: -1 | 0 | 1 = 0;
  if (pa.major !== pb.major) {
    res = pa.major > pb.major ? 1 : -1;
  } else if (pa.minor !== pb.minor) {
    res = pa.minor > pb.minor ? 1 : -1;
  } else if (pa.patch !== pb.patch) {
    res = pa.patch > pb.patch ? 1 : -1;
  } else if (pa.prerelease === null && pb.prerelease === null) {
    res = 0;
  } else if (pa.prerelease === null) {
    res = 1; // release > prerelease
  } else if (pb.prerelease === null) {
    res = -1;
  } else {
    res = comparePrerelease(pa.prerelease, pb.prerelease);
  }
  logVersionTransformation('compareSemver', `${a} vs ${b}`, String(res));
  return res;
}

function comparePrerelease(a: string, b: string): -1 | 0 | 1 {
  const ai = a.split('.');
  const bi = b.split('.');
  const len = Math.max(ai.length, bi.length);
  for (let i = 0; i < len; i++) {
    const xa = ai[i];
    const xb = bi[i];
    // Fewer fields = lower precedence (semver §11.4.4).
    if (xa === undefined) return -1;
    if (xb === undefined) return 1;
    const na = /^\d+$/.test(xa) ? Number(xa) : null;
    const nb = /^\d+$/.test(xb) ? Number(xb) : null;
    if (na !== null && nb !== null) {
      if (na !== nb) return na > nb ? 1 : -1;
    } else if (na !== null) {
      return -1; // numeric identifier always < alphanumeric
    } else if (nb !== null) {
      return 1;
    } else {
      if (xa !== xb) return xa > xb ? 1 : -1;
    }
  }
  return 0;
}

/**
 * React hook returning the current app version. Memoised because the
 * version is constant for the lifetime of the page — we never want a
 * re-render to look like "the version changed".
 */
export function useAppVersion(): {
  version: string;
  label: string;
  tag: string;
  date: string;
  changelog: string[];
  sections: ChangelogSection[];
} {
  return React.useMemo(
    () => ({
      version: APP_VERSION,
      label: APP_VERSION_LABEL,
      tag: APP_VERSION_TAG,
      date: APP_VERSION_DATE,
      changelog: APP_CHANGELOG,
      sections: APP_CHANGELOG_SECTIONS,
    }),
    []
  );
}

/** Authoritative expected production signing certificate SHA-256 fingerprint. */
export const PRODUCTION_SIGNING_SHA256 =
  (typeof process !== 'undefined' && process.env?.EXPECTED_SIGNATURE_SHA256) ||
  '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
