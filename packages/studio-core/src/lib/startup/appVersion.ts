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

export const NATIVE_VERSION = '4.5.64';
export const NATIVE_VERSION_CODE = 40564;
export const WEB_VERSION = '4.5.64';
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
export const APP_COMMIT_SHA = 'e47600d8';

/**
 * Unix epoch timestamp this build was generated.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_BUILD_TIMESTAMP = '9/5/2026, 5:50:57 PM CST';

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
      'GrooveX Sample-Accurate Multitrack Transposition: Re-architected transposition engine to use in-memory buffer-level SoundTouch transposition with exact sample length preservation and zero cumulative drift.',
      'Full Musical Transposition Scale: Supported pitch shifting across -12 to +12 semitones with instantaneous cache retrieval and seamless 25ms crossfade stem hot-swapping during live playback.',
    ],
  },
  {
    heading: 'Improved',
    items: [
      'Percussion Stem Transposition Immunity: Guaranteed 100% pitch and tempo immunity for all drum and percussion stems (kick, snare, toms, cymbals, hi-hats, percussion), keeping rhythm strictly locked to the hardware audio clock.',
      'Unified Zero-Latency Audio Graph: Eliminated worklet starvation delays, underrun zero-padding, and fractional skip resets by routing all stems directly into the unified master gain with Delta t = 0.000ms.',
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
  {
    version: '4.5.59',
    date: '2026-09-04',
    highlights: [
      'Stagex History Bottom Panel Redesign: Replaced the floating popup modal with an integrated bottom library panel mode, featuring direct jump navigation, dynamic undo/redo badges, state tracking, and responsive desktop/mobile parity.',
      'Stagex Production Document Single Long-Page PDF Redesign: Implemented continuous single-page vector jsPDF document export with synchronized preview parity across desktop and mobile, standardized typography, high-DPI rasterization for stage plots, and complete technical rider details.',
      'Stage Canvas Interaction: Unified StageBridgeService history synchronization between React and vanilla canvas engine, ensuring seamless state rollbacks, forward redo, and immediate visual canvas reconciliation.',
      'Export Dialog & Document Layout: Standardized multi-section production document geometry with crisp section headers, channel mapping, logistic notes, gear inventory, and band & crew personnel tables.',
    ],
  },
  {
    version: '4.5.58',
    date: '2026-09-04',
    highlights: [
      'Comprehensive Bilingual Localization: Complete English and Spanish (en/es) translation coverage across all Studio tools and Stagex screens, with reactive language selector sheet and persistent locale storage.',
      'Stagex Clean Element Data Defaults: Completely eliminated phantom production data defaults on new stage elements (performer names, microphones, DIs, wireless packs, and boilerplate logistics notes).',
      'Strict +48V Phantom Power Invariant: Hardened phantom power defaults to false across in-app inspectors, projection adapters, and PDF export sheets, showing canonical em-dash (`—`) when unassigned.',
      'Stagex Canvas Centering & Menu Anchoring: Fixed canvas vertical positioning, toolbar layout hierarchy, and element menu anchor stability.',
      'External Link Security Hardening: Enforced `rel="noopener noreferrer"` across all external anchor elements in share dialogs.',
      'Theme-Governed Canvas Appearance: Deprecated manual canvas background color selection in Preferences in favor of strict system theme alignment (Light, AMOLED pure black, and Dark).',
    ],
  },
  {
    version: '4.5.57',
    date: '2026-09-04',
    highlights: [
      'Stagex Preferences Real-Time Canvas Functionality: Fully integrated all 12 exposed canvas preferences (Canvas Background presets, dynamic Grid Size, Stage Plot Shape, Snap to Grid with dynamic interval calculation, Cable Length badges, Auto Wire, Stage Balance Visualizer, Measurement Units in meters and feet, Reduced Animations, Grid Overlay, Cable Connections, and Element Labels) into the canvas engine with window bridge setters and automatic synchronization.',
      'Complete AMOLED Pitch Black Hardening: Standardized all Stagex Setup screens (Setup Hub, Technical Rider, Setlist, Gear Inventory, Band & Crew, and Preferences) to pure black `#000000` with zero dark-navy bleed.',
      'Uniform Floating Header Material & Geometry: Unified floating headers across all Setup detail views to canonical 58px height, 9999px pill geometry, safe-area top insets, and consistent frosted glass elevation.',
      'Stage Canvas Experience: Seamless full-bleed canvas overlay layout without top clipping seams, removal of redundant Stagex title header, 5-button toolbar hierarchy with canonical center focus icon, Scene 1 deletion protection, and perfect three-dot control vertical centering.',
    ],
  },
  {
    version: '4.5.56',
    date: '2026-09-03',
    highlights: [
      'Stagex Production Document PDF Export Engine: Built native vector jsPDF export engine replacing legacy html2canvas rasterizer, delivering full Setup data parity across stage plot coordinate mapping, audio patch sheet with phantom power (+48V) and IEM mixes, logistics, technical requirements, notes, running setlist, gear inventory, and band & crew roster.',
      'Production Document Disambiguation: Established distinct "Production Document" naming across toolbar actions, canvas pills, dialogs, and exported documents, completely separating it from Setup > Technical Rider.',
      'Stagex Setlist Redesign: Aligned Setup > Setlist with Stitch mobile reference, featuring floating header, arrangement subheaders, 2x2 metrics strip, key/tempo badges, and setlist insights.',
      'Stagex Gear Inventory Redesign: Upgraded Setup > Gear Inventory with crisp vector icons, 2x2 stats grid, verification status tracking, and lightweight empty state.',
      'Stagex Band & Crew Redesign: Enhanced Setup > Band & Crew with 8-member capacity guard, integrated quick-add member card, 2x2 personnel metrics, assigned stage elements tracking, and refined empty states.',
    ],
  },
  {
    version: '4.5.55',
    date: '2026-09-03',
    highlights: [
      'Stagex Touch Dragging Pipeline: Optimized Android element dragging with unified W3C pointer capture (`setPointerCapture`), zero-deadzone touch responsiveness, and `requestAnimationFrame`-coalesced visual commits, eliminating drag latency, stepping, and stutter.',
      'Actions Menu Layering & Independence: Portaled the Stagex element Actions menu to `document.body` with viewport edge collision detection and smart vertical positioning, ensuring the menu is never clipped by collapsed or expanded Advanced Specs.',
      'Multi-Touch Gestures & Stage Sync: Seamlessly transitioned between element manipulation and two-finger pinch-to-zoom on Android, guaranteeing authoritative final coordinate synchronization with React state and PDF Export.',
      'Design Token Compliance: Normalized typography tokens in AccentColorPicker with canonical CSS variables.',
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
