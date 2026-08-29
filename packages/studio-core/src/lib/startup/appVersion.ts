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

export const NATIVE_VERSION = '4.5.48';
export const NATIVE_VERSION_CODE = 40548;
export const WEB_VERSION = '4.5.48';
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
export const APP_COMMIT_SHA = '12839fb1';

/**
 * Unix epoch timestamp this build was generated.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_BUILD_TIMESTAMP = '8/28/2026, 10:14:09 PM CST';

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
      'Stagex & Studio 2D Fluid Color Picker: Redesigned the color picker into a production-grade 2D control with continuous saturation-value field, 360° rainbow hue spectrum slider, checkerboard alpha transparency slider, circular draggable handles, HEX and opacity input validation, and full Light/Dark/AMOLED theme parity.',
    ],
  },
  {
    heading: 'Fixed',
    items: [
      'Stagex Android Viewport Layout & Sizing: Fixed stage canvas sizing and scaling on mobile viewports so that the stage surface properly occupies available phone screen space.',
      'Stagex Tab Navigation & State Preservation: Resolved disappearing/blank stage regressions across tab transitions (`Stage` ↔ `Setup` ↔ `Preferences`) by restoring canvas opacity immediately and resetting layout cache.',
      'Drumex Android Viewport Sizing: Corrected viewport height and safe-area margins in Drumex pattern library and editor screens.',
      'Conservative Performance Optimizations: Eliminated broad subtree mutation storms during stage element dragging, prevented synchronous layout recalculation in PA sound coverage, cached theme engine CSS variable mutations, and isolated sub-app re-render boundaries in `SharedAppShell`.',
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
    version: '4.5.48',
    date: '2026-08-28',
    highlights: [
      'Stagex & Studio 2D Fluid Color Picker: Redesigned the color picker into a production-grade 2D control with continuous saturation-value field, 360° rainbow hue spectrum slider, checkerboard alpha transparency slider, circular draggable handles, HEX and opacity input validation, and full Light/Dark/AMOLED theme parity.',
      'Stagex Android Viewport Layout & Sizing: Fixed stage canvas sizing and scaling on mobile viewports so that the stage surface properly occupies available phone screen space.',
      'Stagex Tab Navigation & State Preservation: Resolved disappearing/blank stage regressions across tab transitions (`Stage` ↔ `Setup` ↔ `Preferences`) by restoring canvas opacity immediately and resetting layout cache.',
      'Drumex Android Viewport Sizing: Corrected viewport height and safe-area margins in Drumex pattern library and editor screens.',
      'Conservative Performance Optimizations: Eliminated broad subtree mutation storms during stage element dragging, prevented synchronous layout recalculation in PA sound coverage, cached theme engine CSS variable mutations, and isolated sub-app re-render boundaries in `SharedAppShell`.',
    ],
  },
  {
    version: '4.5.47',
    date: '2026-08-28',
    highlights: [
      'Global Accent Color System: Introduced a dedicated Accent Color configuration under Settings → Appearance with 9 curated design-system presets, custom RGB color picker, real-time live preview across all sub-apps, and full decoupling from individual sub-app identity branding.',
      'Dynamic Accent Theme Engine: Integrated `resolveAccent()` in `studio-core` to calculate contrast text, glow, borders, and gradient variants directly on `:root` custom properties.',
      'App Identity Decoupling: Removed hardcoded `[data-app-key]` theme overrides to ensure Drumex, Stagex, Groovex, Vocalex, and Chordex share the global interactive accent while preserving authentic app brand identity colors on Hub cards and logos.',
      'Desktop Logging Resilience: Enhanced host language server log stream handling to prevent unhandled stream write exceptions during high-throughput agent operations.',
      'Release Pipeline Verification: Added automated GitHub CLI keyring authentication fallback and strengthened end-to-end multi-manifest synchronization.',
    ],
  },
  {
    version: '4.5.46',
    date: '2026-08-28',
    highlights: [
      'Event-Driven Architecture Modernization: Eliminated untyped synthetic `CustomEvent` and `window.dispatchEvent` patterns across navigation, tab switching, quick actions, settings navigation, and lifecycle events in favor of type-safe Zustand stores and typed subscription primitives.',
      'Unified Navigation & Deep Linking: Replaced `studio:navigate-to-app`, `studio:navigate-to-tab`, `studio:set-active-tab`, `studio:trigger-quick-action`, `studio:open-settings-section`, and `studio:open-auth` with direct calls to `NavigationDispatcher.push(...)` and `useBottomNavigationStore`.',
      'User Profile & Cover Subscriptions: Replaced custom avatar and cover photo events with canonical `getUserCover`, `setUserCover`, and `subscribeUserCover` primitives.',
      'Startup & Lifecycle Coordination: Extended `StartupCoordinator` with typed subscribers `subscribeStartupComplete` and `subscribeIntroDone`, replacing window event dispatches across entry points and launch animation engines.',
      'Developer Diagnostics Performance Optimization: Optimized `PerformanceProfiler.getGPULayerCount()` by replacing unthrottled full-DOM traversals with targeted composited selectors and a 3-second cache. Consolidated duplicate logging in `EmergencyDebugOverlay` to use canonical `getLogs()`. Batched diagnostics listeners with `requestAnimationFrame` micro-batching to eliminate UI thread render thrashing.',
    ],
  },
  {
    version: '4.5.45',
    date: '2026-08-27',
    highlights: [
      'Chordex Library Bento Redesign: Completely overhauled the Chordex Library section with a modern Bento card layout, ambient glowing accents, and responsive split-view desktop / full-screen mobile experience.',
      'Dynamic Mini Fretboard Recesses: Introduced high-fidelity 6-string dynamic fretboard recess components (`HeroChordRecess`) with realistic gauge lines, fret lines, nut bar, base fret indicators, muted/open markers, and glowing finger dots (`.finger-dot`).',
      'Interactive Chord Preview Section: Integrated rich multi-instrument visualizers supporting instant toggles across Guitar (interactive fretboard diagram with note names/intervals and left-handed mode), Bass (4/5-string diagram), and Piano (2-octave keyboard), with strum audio playback and related chord suggestions.',
      'Harmonic Categories Grid: Expanded the category browser to 31 distinct harmonic flavors with signature 3-string mini recesses, root note quick filter pills, and a smooth expand/collapse toggle.',
      'Universal Theme Parity: Full adaptive styling across Dark, Light, and AMOLED modes with zero hardcoded styling regressions.',
    ],
  },
  {
    version: '4.5.44',
    date: '2026-08-26',
    highlights: [
      'Android Updater Changelog Correlation: Resolved long-standing static update dialog changelog display across releases. Implemented dynamic per-version release notes extraction in `studio-core` and wired `UpdateIndicator` to display release notes specific to the version being offered.',
      'Navigation Icon Mapping: Eliminated remaining `AnimatedNavigationIcon` unmapped warnings for `profile`, `user`, `account`, `drumex`, `stagex`, and `disc` by standardizing normalization routes and comprehensive `FILLED_VARIANTS_SUPPORT` coverage.',
      'Navigation Re-Render Optimization: Memoized animation context and tab icons in `NavigationAnimationProvider` and `AnimatedNavigationIcon`, eliminating redundant re-renders and false transition triggers during tab changes.',
      'Component Resolution Cache: Implemented module-level $O(1)$ component lookup caching in `AnimatedIcon`, removing per-render string parsing and Lucide reflection overhead.',
      'Livex Tab Animation Parity: Standardized tab-change animations to a unified 200ms cubic-bezier transition across all five Livex applications.',
      'Unified Subsection Top Bar: Finalized and unified the shared top bar structure across Chordex, Drumex, Stagex, Groovex, and Vocalex.',
    ],
  },
  {
    version: '4.5.43',
    date: '2026-08-25',
    highlights: [
      'Modal Surface Transparency: Eliminated excessive transparency across modal, alert, and dialog surfaces across all five Livex applications (Chordex, Drumex, Stagex, Groovex, Vocalex) by introducing canonical `--surface-dialog-bg` and `--surface-modal-surface` theme tokens and multi-layered elevation shadows.',
      'Navigation Icon Mapping: Resolved unmapped icon warnings for `drumex`, `stagex`, and `disc` in `AnimatedNavigationIcon` through normalized routing and complete filled variant support tables.',
      "Deprecated Vocalex Back Navigation: Migrated legacy `setVocalexBack` calls across Practice, Recording, Take Detail, and Mixer Lab panels to canonical priority-based `useBackHandler('nested', ...)` hooks.",
      'Theme System Integration: Standardized CSS token inheritance for interactive controls and floating headers across Light, Dark, and AMOLED themes.',
    ],
  },
  {
    version: '4.5.42',
    date: '2026-08-24',
    highlights: [
      "Developer Inspector Usability: Fixed broken refresh behavior to re-inspect the active DOM node's React fiber, bounds, and computed styles without resetting selection. Added quick target shortcuts for App Shell, Active View Container, and Navigation Bars.",
      'Interactive Component Subtree Tree Browser: Added real-time component search filtering, category filter pills (Interactive, React, DOM, Containers), collapsible tree nodes, and 1-tap inspection.',
      'Visual CSS Box Model: Added live nested Box Model visualization for Margin, Border, Padding, and Content dimensions with categorized CSS property tables (Layout, Typography, Surface/Effects).',
      'Performance Diagnostics Layout Overflow: Applied flexWrap and responsive truncation across component lifecycle profiler, frame pacing histograms, memory gauges, and GPU renderer strings to eliminate horizontal overflow on narrow Android viewports.',
      'Network Sniffer Consolidation: Consolidated standalone Network Sniffer into Logs, removing redundant subview routing while preserving full HTTP request inspection and 404 diagnostics.',
      'Tap-to-select capturing handler in Developer Inspector overlay for seamless element selection and automatic exit on select.',
    ],
  },
  {
    version: '4.5.41',
    date: '2026-08-23',
    highlights: [
      "Global HeroUI Dialog & Modal Migration: Unified all application dialogs, confirmation dialogs, and modal overlays under HeroUI's AlertDialog compound components (AlertDialog, Backdrop, Container, Dialog, CloseTrigger, Header, Icon, Heading, Body, Footer) across Stagex, Chordex, Drumex, Vocalex, and Hub.",
      'Destructive Confirmation Safety: Applied danger status and enforced backdrop dismissal prevention on destructive operations to avoid accidental data loss.',
      'Global HeroUI Button & ButtonGroup System: Replaced custom buttons and standalone action triggers with HeroUI Button, and unified paired/connected actions (measure/timeline tools, regenerate/random templates, clear/copy logs) under HeroUI ButtonGroup.',
      'Verifiable Developer Diagnostics: Rebuilt Developer Options (System, Apps, Performance, Logs) with real, verifiable runtime telemetry for Android OS, WebView version, battery, storage, display characteristics, network Wi-Fi filters, and live memory metrics.',
    ],
  },
  {
    version: '4.5.40',
    date: '2026-08-23',
    highlights: [
      'Global AMOLED True Black: Fixed StageCorePanel settings fallback and replaced hardcoded near-black surfaces with var(--app-bg) to guarantee true #000000 black base across all internal apps, Hub, and Settings.',
      'Dark Mode Surface Polish: Darkened dark surface scale and glass tint to eliminate gray wash across bottom sheets, DrumEditor, SongsPanel, and AccountProfileHeader.',
      'Appearance Theme Mode Icons: Corrected Theme Toggle icon mapping to Light Mode -> Sun, Dark Mode -> Moon, and AMOLED Mode -> Eclipse with live spring transitions.',
      'Appearance Component Theming: Added --control-track-bg token and theme-adaptive borders/backgrounds across SegmentedControl, SettingRow, SettingSection, BentoSettingCard, and Language selector.',
      'Restored About Section in Settings: Restored About and Developer Options destinations in Settings > System & About with full theme support and seamless back navigation.',
      'App Changer Layout Overflow: Replaced asymmetrical 3-column grid with a centered responsive flex dock respecting horizontal safe-area insets, preventing clipping and viewport overflow across all Android screen sizes.',
    ],
  },
  {
    version: '4.5.39',
    date: '2026-08-23',
    highlights: [
      'Harmonized Liquid Glass surface material and backdrop blur tokens across Bento cards, Bento setting controls, Profile metric containers, and Studio Auth surfaces.',
      'Unified optical backdrop filtering with single-pass CSS custom property tokens, preventing Android WebView compositing overhead and rendering jank.',
      'Synchronized tactile micro-interactions with SpringPresets physics across interactive glass surfaces, modal dismiss controls, and navigation buttons.',
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
