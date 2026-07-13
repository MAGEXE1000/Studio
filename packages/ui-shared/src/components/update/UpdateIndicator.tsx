import { Capacitor } from '@capacitor/core';
import { useAppUpdate, type StructuredReleaseNotes, updateDiagnostics, updateDebugLogs, APP_VERSION_LABEL, compareSemver, normalizeSemver, applyUpdate, fadeToBlackAndReload, useChordStore, isAppInstallerAvailable, AppInstaller, UpdaterFlightRecorder } from '@workspace/studio-core';
import { applyUpdateDirect, shareDownloadedApk, getDiagnosticsReport, recordUpToDatePopup, recordCloseEvent, logTimelineEvent, clearInstallationJustCompleted, endPostInstallSession } from '@workspace/studio-core';
/**
 * Floating "update available" indicator — top of the Hub.
 *
 * Two-phase behaviour:
 *  1. BANNER — when an update is first detected, a wide pill drops in
 *     from the top of the screen, CENTERED horizontally, announcing
 *     "Version X.Y.Z available" with a minimize button. Stays for
 *     ~6 seconds (or until the user taps minimize), then…
 *  2. PILL — smoothly morphs into a small circular badge that travels
 *     to the top-right corner. Tapping the pill re-opens the modal.
 *     The pill STAYS VISIBLE FOREVER until the user actually updates
 *     (or a newer remote version replaces this one). "Later" only
 *     suppresses the auto-opening of the modal — it does NOT hide
 *     the pill, so the user always has a one-tap path back.
 *
 * Theme integration:
 *   The indicator pulls its accent from the Studio-wide theme variables
 *   `--accent-from` / `--accent-to` set on <html> by App.tsx. Whatever
 *   accent color the user picked in Studio settings (blue, purple, etc.)
 *   automatically tints the banner / pill / modal. The `accentFrom`
 *   and `accentTo` props are kept as fallbacks for the rare boot frame
 *   where the CSS vars haven't been written yet.
 *
 * Skip-version semantics:
 *   The Updater detector always reports the LATEST remote version. A user
 *   on 3.0.21 with 3.0.24 published will be offered 3.0.24 directly —
 *   they never have to walk through 3.0.22 / 3.0.23. The Updater bundle
 *   download is also a single shot to the newest manifest.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StudioSpinner from '../animata/progress/spinner';
import AnimatedActionButton from '../animata/container/animated-border-trail';
import StudioUpdateScreen from '../sheets/StudioUpdateScreen';
import UpdateDiagnosticsSheet from '../sheets/UpdateDiagnosticsSheet';
import ChangelogSheet from '../sheets/ChangelogSheet';
import { DialogScaffold } from '../layout/StudioLayoutSystem';
import { DownloadIcon } from '../icons/DownloadIcon';
import {
  enableLiquidGlass,
  tagLiquidTarget,
  untagLiquidTarget,
} from '@workspace/studio-core';

const isUpdateInProgress = (state: string) => {
  const isSim = false;
  return [
    'FETCH_APK_INFORMATION',
    'DOWNLOAD_APK',
    'VERIFY_SHA256',
    'PREPARING_INSTALL',
    'WAITING_USER_CONFIRMATION',
    'PACKAGEINSTALLER_VISIBLE',
    'INSTALLING',
    'INSTALL_SUCCESS'
  ].includes(state);
};

function CheckIconSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="#22c55e"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GithubIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function SpinnerSvg({ cFrom, cTo, size = 14, strokeWidth = 3.2 }: { cFrom: string; cTo: string; size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={{
        animation: 'lg-spin-spinner 1s linear infinite',
        flexShrink: 0,
      }}
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth={strokeWidth} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#lg-spinner-grad-indicator)" strokeWidth={strokeWidth} />
      <defs>
        <linearGradient id="lg-spinner-grad-indicator" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cFrom} />
          <stop offset="100%" stopColor={cTo} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** How long the full banner stays visible before auto-minimizing. */
const BANNER_AUTO_MINIMIZE_MS = 6000;

/** Session flag so the banner shows at most once per page session. */
const BANNER_SHOWN_KEY = 'studio:updateBannerShown';

/**
 * localStorage key recording the latest version for which the user
 * tapped "Later". This SUPPRESSES the auto-open of the modal so we
 * stop nagging — but the corner pill remains visible so they can tap
 * it whenever they decide they're ready. A NEWER remote version
 * resets this and the modal auto-opens once again.
 */
const LATER_VERSION_KEY = 'studio:laterUpdateVersion';

/** sessionStorage key recording the latest version for which we have
 *  already auto-opened the update modal IN THIS SESSION. */
const AUTO_OPENED_VERSION_KEY = 'studio:autoOpenedUpdateVersion';

/** Legacy key from before "Later" stopped hiding the pill. We wipe
 *  it on mount so old installs aren't stuck with a hidden indicator. */
const LEGACY_DISMISSED_KEY = 'studio:dismissedUpdateVersion';

function readAutoOpenedVersion(): string | null {
  try {
    const raw = sessionStorage.getItem(AUTO_OPENED_VERSION_KEY);
    if (!raw || normalizeSemver(raw) === null) return null;
    return raw;
  } catch { return null; }
}
function writeAutoOpenedVersion(v: string): void {
  try { sessionStorage.setItem(AUTO_OPENED_VERSION_KEY, v); } catch { /* ignore */ }
  try { localStorage.removeItem(AUTO_OPENED_VERSION_KEY); } catch { /* ignore */ }
}

function readLaterVersion(): string | null {
  try {
    const raw = sessionStorage.getItem(LATER_VERSION_KEY);
    if (!raw || normalizeSemver(raw) === null) return null;
    return raw;
  } catch { return null; }
}
function writeLaterVersion(v: string): void {
  try { sessionStorage.setItem(LATER_VERSION_KEY, v); } catch { /* quota / privacy */ }
}
function clearLegacyDismissed(): void {
  try {
    localStorage.removeItem(LEGACY_DISMISSED_KEY);
    localStorage.removeItem(LATER_VERSION_KEY); // Also clean up any stale legacy persisted storage entry
  } catch { /* ignore */ }
}

type Phase = 'banner' | 'pill';

function readInitialPhase(): Phase {
  return 'banner';
}

function markBannerShown(): void {
  try {
    sessionStorage.setItem(BANNER_SHOWN_KEY, '1');
  } catch {
    /* private mode / quota — silently ignore */
  }
}

function getSavedReleaseNotesAsSections(): any[] | undefined {
  try {
    const saved = localStorage.getItem('studio:last_installed_release_notes');
    if (saved) {
      const rn = JSON.parse(saved);
      if (Array.isArray(rn)) {
        return [{ heading: "What's New", items: rn }];
      }
      if (typeof rn === 'object') {
        const sections: any[] = [];
        if (rn.added && rn.added.length > 0) {
          sections.push({ heading: "Added", items: rn.added });
        }
        if (rn.improved && rn.improved.length > 0) {
          sections.push({ heading: "Improved", items: rn.improved });
        }
        if (rn.fixed && rn.fixed.length > 0) {
          sections.push({ heading: "Fixed", items: rn.fixed });
        }
        if (rn.changed && rn.changed.length > 0) {
          sections.push({ heading: "Changed", items: rn.changed });
        }
        return sections.length > 0 ? sections : undefined;
      }
    }
  } catch (_) {}
  return undefined;
}

export default function UpdateIndicator({
  accentFrom,
  accentTo,
}: {
  /** Boot-frame fallback only — actual color comes from --accent-from. */
  accentFrom: string;
  /** Boot-frame fallback only — actual color comes from --accent-to. */
  accentTo: string;
}) {
  const updater = useAppUpdate();

  // Record render of UpdateIndicator during active install states
  const installStates = ['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING', 'INSTALL_SUCCESS'];
  if (installStates.includes(updater.updateState)) {
    UpdaterFlightRecorder.record({
      thread: 'ui',
      sessionId: null,
      workflowId: null,
      eventType: 'UpdateIndicatorRender',
      caller: 'UpdateIndicator',
      reason: `Rendered UpdateIndicator in state: ${updater.updateState} with progress: ${Math.round(updater.progress * 100)}%`
    });
  }

  const [phase, setPhase] = useState<Phase>(readInitialPhase);
  const [open, setOpen] = useState(() => isUpdateInProgress(updater.updateState));
  const [installFailedReason, setInstallFailedReason] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [laterVersion, setLaterVersion] = useState<string | null>(readLaterVersion);

  const checkRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const settings = useChordStore(s => s.settings);
  const hubVis = settings.perApp?.hub ?? { theme: settings.theme ?? 'dark', amoledMode: settings.amoledMode ?? false };
  const isLight = (() => {
    if (hubVis.theme === 'light') return true;
    if (hubVis.theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    if (hubVis.theme === 'dynamic') {
      const h = new Date().getHours();
      const lightStart = settings.dynamicLightStart ?? 7;
      const lightEnd   = settings.dynamicLightEnd   ?? 20;
      return h >= lightStart && h < lightEnd;
    }
    return false;
  })();

  const [successNotificationVersion, setSuccessNotificationVersion] = useState<string | null>(null);
  const [showChangelogSheet, setShowChangelogSheet] = useState(false);

  useEffect(() => {
    console.log('[INSTRUMENTATION] [REACT] UpdateIndicator component mounted!');
    clearLegacyDismissed();
    if (typeof (window as any).logDiagnosticEvent === 'function') {
      (window as any).logDiagnosticEvent('UPDATE_UI_MOUNTED');
    }

    if (typeof window !== 'undefined') {
      (window as any).__triggerStudioUpdatedToast = (ver: string) => {
        setSuccessNotificationVersion(ver);
      };
    }

    if (Capacitor.isNativePlatform() && isAppInstallerAvailable()) {
      (async () => {
        try {
          const { AppInstaller } = await import('@workspace/studio-core');
          const result = await AppInstaller['getLastInstallResult']();
          console.log('[UpdateIndicator Startup] Checked last native result:', result);
          if (result.statusCode === 0) {
            const expectedVerName = result.expectedVersionName;
            const currentAppVer = APP_VERSION_LABEL;
            if (expectedVerName && expectedVerName === currentAppVer) {
              const lastShownDone = localStorage.getItem('studio:lastShownDoneVersion');
              if (lastShownDone !== currentAppVer) {
                setShowChangelogSheet(true);
                localStorage.setItem('studio:lastShownDoneVersion', currentAppVer);
                updater.dismissUpdate();
              }
            }
          }
        } catch (e) {
          console.warn('[UpdateIndicator Startup] Failed to run startup install status verification:', e);
        }
      })();
    }

    return () => {
      console.log('[INSTRUMENTATION] [REACT] UpdateIndicator component unmounted!');
      if (typeof (window as any).logDiagnosticEvent === 'function') {
        (window as any).logDiagnosticEvent('UPDATE_UI_UNMOUNTED');
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__studioVisibleModal = open ? 'UpdateModal' : 'none';
    }
    if (open) {
      try {
        logTimelineEvent('UI', 'SHOW_INSTALL_SCREEN', 'Update modal opened');
      } catch (_) {}
    } else {
      try {
        recordCloseEvent('Update modal closed');
      } catch (_) {}
    }
  }, [open]);

  useEffect(() => {
    if (isUpdateInProgress(updater.updateState)) {
      console.log('[Updater UI] Active session. Keeping update modal open.');
      setOpen(true);
    }
  }, [updater.updateState]);

  useEffect(() => {
    if (updater.validApkExists && updater.remoteVersion) {
      if (updater.shouldShowRecoveryReminder(updater.remoteVersion)) {
        console.log('[Smart Recovery] Valid APK exists on startup and reminder policy allows it. Opening modal.');
        setOpen(true);
      } else {
        console.log('[Smart Recovery] Valid APK exists on startup, but suppressed by reminder policy.');
      }
    }
  }, [updater.validApkExists, updater.remoteVersion]);

  useEffect(() => {
    console.log('[INSTRUMENTATION] [REACT] Add open-update-dialog event listener');
    const id = requestAnimationFrame(() => setEntered(true));
    const handleOpen = () => {
      console.log('[INSTRUMENTATION] [REACT] studio:open-update-dialog event fired');
      setOpen(true);
    };
    window.addEventListener('studio:open-update-dialog', handleOpen);
    return () => {
      console.log('[INSTRUMENTATION] [REACT] Remove open-update-dialog event listener');
      cancelAnimationFrame(id);
      window.removeEventListener('studio:open-update-dialog', handleOpen);
    };
  }, []);



  useEffect(() => {
    const isFailed = updater.updateState === 'INSTALL_FAILED' || updater.updateState === 'RECOVERY';
    if (isFailed && updater.error) {
      setInstallFailedReason(updater.error);
    }
  }, [updater.updateState, updater.error]);

  // Auto-minimize disabled per user request so the banner remains fully visible.

  // Auto-OPEN the update modal is disabled to protect the application startup sequence.
  // The user will see a subtle pill in the corner, or they can click Check for Updates in settings.

  // WEB-ONLY: track whether the user dismissed the web refresh banner this session
  const [webBannerDismissed, setWebBannerDismissed] = useState(() => {
    if (Capacitor.isNativePlatform()) return false;
    try {
      const dismissed = sessionStorage.getItem('studio:web-update-dismissed');
      return dismissed === updater.remoteVersion;
    } catch { return false; }
  });

  // CHECK-STATUS PILL ─────────────────────────────────────────────────
  // When there's NO update available we still want the user to see that
  // the app actually checked. Phases:
  //   'checking'  — spinner + "Checking…" while updater.loading is true
  //   'ok'        — green check + "Up to date" for ~1.6 s
  //   'fading'    — spins 360° while shrinking + fading away (~700 ms)
  //   'gone'      — unmounted
  // If an update IS available, this whole branch is skipped and the
  // existing banner/pill flow takes over.
  const [checkPhase, setCheckPhase] = useState<
    'checking' | 'ok' | 'fading' | 'gone'
  >('checking');
  useEffect(() => {
    if (updater.updateAvailable) {
      setCheckPhase('gone');
      return;
    }
    if (updater.loading) {
      setCheckPhase('checking');
      return;
    }
    setCheckPhase('ok');
    try {
      const isAuto = !updateDebugLogs.triggerComponent?.toLowerCase().includes('manual');
      recordUpToDatePopup('checkPhase transitioned to ok', isAuto);
    } catch (_) {}
    const tFade = window.setTimeout(() => setCheckPhase('fading'), 1600);
    const tGone = window.setTimeout(() => setCheckPhase('gone'), 1600 + 920);
    return () => {
      window.clearTimeout(tFade);
      window.clearTimeout(tGone);
    };
  }, [updater.loading, updater.updateAvailable]);

  // Tag "Up to date" check indicator with Liquid Glass
  useEffect(() => {
    const el = checkRef.current;
    if (!el) return;
    enableLiquidGlass();
    tagLiquidTarget(el);
    return () => {
      untagLiquidTarget(el);
    };
  }, [checkPhase]);

  // Tag "Update available" indicator with Liquid Glass
  useEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    enableLiquidGlass();
    tagLiquidTarget(el);
    return () => {
      untagLiquidTarget(el);
    };
  }, [phase, updater.updateAvailable]);

  if (!updater.updateAvailable) {
    if (!open) return null;
    // Only show the full update modal on native
    if (!Capacitor.isNativePlatform()) return null;
    return (
      <UpdateModal
        fromLabel={APP_VERSION_LABEL}
        toVersion={updater.remoteVersion ?? '—'}
        mandatory={updater.mandatory}
        downloadUrl={updater.downloadUrl}
        accentFrom={`var(--accent-from, ${accentFrom})`}
        accentTo={`var(--accent-to, ${accentTo})`}
        onLater={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          const isFailed = updater.updateState === 'INSTALL_FAILED' || updater.updateState === 'RECOVERY';
          if (isFailed) {
            updater.dismissUpdate();
          }
        }}
        installFailedReason={installFailedReason}
        setInstallFailedReason={setInstallFailedReason}
      />
    );
  }

  /* ── WEB-ONLY: slim non-blocking refresh banner ─────────────────────── */
  if (!Capacitor.isNativePlatform()) {
    if (webBannerDismissed) return null;
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 40,
            background: `linear-gradient(135deg, var(--accent-from, ${accentFrom}), var(--accent-to, ${accentTo}))`,
            color: '#fff',
            fontFamily: 'Manrope, Inter, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            animation: 'web-refresh-bar-enter 400ms cubic-bezier(0.34, 1.12, 0.64, 1) both',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, opacity: 0.9 }}
          >
            system_update
          </span>
          <span>
            {updater.remoteVersion
              ? `Studio v${updater.remoteVersion} available`
              : 'New version available'}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.22)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 12px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
              backdropFilter: 'blur(6px)',
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setWebBannerDismissed(true);
              try {
                if (updater.remoteVersion) {
                  sessionStorage.setItem('studio:web-update-dismissed', updater.remoteVersion);
                }
              } catch { /* ignore */ }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
        <style>{`
          @keyframes web-refresh-bar-enter {
            from { transform: translateY(-100%); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  const minimize = () => {
    setPhase('pill');
    markBannerShown();
  };

  const handleLater = () => {
    // Stop auto-opening the modal for this version, but KEEP the
    // pill visible in the corner so the user always has a one-tap
    // path back to update.
    setOpen(false);
    updater.dismissUpdate();
    if (updater.remoteVersion) {
      writeLaterVersion(updater.remoteVersion);
      setLaterVersion(updater.remoteVersion);
      updater.recordDismissal(updater.remoteVersion);
      try {
        const key = 'studio:dismissedVersions';
        const val = localStorage.getItem(key);
        const list = val ? JSON.parse(val) : [];
        if (!list.includes(updater.remoteVersion)) {
          list.push(updater.remoteVersion);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('[Updater] Failed to write dismissedVersion:', err);
      }
    }
    setPhase('pill');
    markBannerShown();
  };

  const isBanner = phase === 'banner';

  // Use theme CSS vars when available (Studio user-chosen accent),
  // fall back to the props during the brief boot frame before App.tsx
  // has written them. Wrapping in `var(--name, fallback)` makes the
  // swap atomic and cross-fades correctly when the user changes their
  // accent in Studio settings.
  const cFrom = `var(--accent-from, ${accentFrom})`;
  const cTo   = `var(--accent-to, ${accentTo})`;
  // For tinted backgrounds we need an alpha-mixed version. color-mix
  // is supported on every Android Chrome WebView ≥ 111 (we ship Updater
  // on a far newer baseline) so we can mix the live CSS var directly.
  const tint  = (pct: number) => `color-mix(in srgb, ${cTo} ${pct}%, transparent)`;
  const tintFrom = (pct: number) => `color-mix(in srgb, ${cFrom} ${pct}%, transparent)`;

  const amoledBg = isLight
    ? 'rgba(255, 255, 255, 0.40)'
    : 'rgba(26, 26, 30, 0.72)';
  const fallbackBorder = isLight
    ? '1px solid rgba(0, 0, 0, 0.08)'
    : '1px solid rgba(255, 255, 255, 0.28)';
  const fallbackShadow = isBanner
    ? (isLight ? '0 16px 40px rgba(0, 0, 0, 0.12), inset 0 1.5px 0 rgba(255, 255, 255, 0.70)' : '0 16px 40px rgba(0, 0, 0, 0.40), inset 0 1.5px 0 rgba(255, 255, 255, 0.08)')
    : (isLight ? '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1.5px 0 rgba(255, 255, 255, 0.70)' : '0 12px 48px rgba(0, 0, 0, 0.50), inset 0 1.5px 0 rgba(255, 255, 255, 0.08)');

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          isBanner
            ? `New update available — version ${updater.remoteVersion ?? ''} — tap for details`
            : 'Update available'
        }
        style={{
          position: 'fixed',
          top: isBanner ? 'calc(env(safe-area-inset-top) + 14px)' : 'calc(env(safe-area-inset-top) + 28px)',
          right: isBanner ? '50%' : '20px',
          zIndex: 8900,
          width: isBanner ? 'min(360px, calc(100vw - 28px))' : 36,
          height: isBanner ? 52 : 36,
          padding: isBanner ? '0 12px 0 14px' : 0,
          borderRadius: isBanner ? 16 : 999,
          display: 'flex',
          alignItems: 'center',
          gap: isBanner ? 10 : 0,
          justifyContent: isBanner ? 'flex-start' : 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          background: amoledBg,
          border: fallbackBorder,
          color: 'var(--c-text-primary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: fallbackShadow,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          textAlign: 'left',
          cursor: 'pointer',
          opacity: entered ? 1 : 0,
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: [
            isBanner ? 'translateX(50%)' : 'translateX(0)',
            entered ? 'translateY(0)' : 'translateY(-16px)',
          ].join(' '),
          transition: [
            'top 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'right 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'width 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'height 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'padding 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'border-radius 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'gap 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
            'background 380ms ease',
            'border-color 380ms ease',
            'box-shadow 620ms ease',
            'opacity 380ms ease',
            'transform 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
          ].join(', '),
          willChange: 'right, width, height, transform, border-radius',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isBanner ? 18 : 20,
            height: isBanner ? 18 : 20,
            flexShrink: 0,
            filter: isBanner ? undefined : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))',
            animation: isBanner ? undefined : 'pill-download-bounce 1.6s ease-in-out infinite',
            transition: 'width 620ms cubic-bezier(0.34, 1.12, 0.64, 1), height 620ms cubic-bezier(0.34, 1.12, 0.64, 1)',
          }}
        >
          <DownloadIcon size={isBanner ? 18 : 20} color={isLight ? cTo : '#fff'} />
        </span>

        <span
          style={{
            position: isBanner ? 'static' : 'absolute',
            flex: isBanner ? 1 : undefined,
            opacity: isBanner ? 1 : 0,
            transform: isBanner ? 'translateX(0)' : 'translateX(-8px)',
            transition: isBanner
              ? 'opacity 280ms 200ms ease, transform 280ms 200ms ease'
              : 'opacity 200ms ease, transform 200ms ease',
            pointerEvents: isBanner ? 'auto' : 'none',
          }}
        >
          {updater.remoteVersion ? `Studio update v${updater.remoteVersion} available` : 'Studio update available'}
        </span>

        <span
          role="button"
          tabIndex={isBanner ? 0 : -1}
          aria-label="Minimize"
          onClick={(e) => {
            e.stopPropagation();
            if (isBanner) minimize();
          }}
          onKeyDown={(e) => {
            if (!isBanner) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              minimize();
            }
          }}
          className="material-symbols-outlined"
          style={{
            position: isBanner ? 'static' : 'absolute',
            fontSize: 18,
            color: 'var(--c-text-secondary)',
            flexShrink: 0,
            cursor: isBanner ? 'pointer' : 'default',
            padding: 4,
            borderRadius: 8,
            opacity: isBanner ? 0.6 : 0,
            transform: isBanner ? 'scale(1)' : 'scale(0.7)',
            transition: isBanner
              ? 'opacity 240ms 180ms ease, transform 240ms 180ms ease'
              : 'opacity 160ms ease, transform 160ms ease',
            pointerEvents: isBanner ? 'auto' : 'none',
          }}
        >
          close
        </span>
      </button>

      {open && (
        <UpdateModal
          fromLabel={APP_VERSION_LABEL}
          toVersion={updater.remoteVersion ?? '—'}
          mandatory={updater.mandatory}
          downloadUrl={updater.downloadUrl}
          accentFrom={cFrom}
          accentTo={cTo}
          onLater={handleLater}
          onClose={() => {
            setOpen(false);
            const isFailed = updater.updateState === 'INSTALL_FAILED' || updater.updateState === 'RECOVERY';
            if (isFailed) {
              updater.dismissUpdate();
            }
            if (phase === 'banner') {
              setPhase('pill');
              markBannerShown();
            }
            if (updater.remoteVersion) {
              updater.recordDismissal(updater.remoteVersion);
            }
          }}
          installFailedReason={installFailedReason}
          setInstallFailedReason={setInstallFailedReason}
        />
      )}

      {/* Lightweight boot-up update success toast */}
      <AnimatePresence>
        {successNotificationVersion && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: 'calc(env(safe-area-inset-top) + 16px)',
              left: '50%',
              x: '-50%',
              zIndex: 99999,
              width: 'min(360px, calc(100vw - 32px))',
              background: 'rgba(20, 20, 25, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '12px 16px',
              boxSizing: 'border-box',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CheckIconSvg />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 13, color: 'var(--c-text-primary)' }}>
                Studio updated
              </span>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--c-text-secondary)' }}>
                Version v{successNotificationVersion} installed successfully
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setShowChangelogSheet(true);
                localStorage.setItem('studio:lastShownDoneVersion', APP_VERSION_LABEL);
                setSuccessNotificationVersion(null);
                updater.dismissUpdate();
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: `var(--accent-from, ${accentFrom})`,
                fontFamily: 'Manrope',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              View changelog
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('studio:lastShownDoneVersion', APP_VERSION_LABEL);
                setSuccessNotificationVersion(null);
                updater.dismissUpdate();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--c-text-secondary)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangelogSheet
        open={showChangelogSheet}
        onClose={() => {
          setShowChangelogSheet(false);
          try {
            localStorage.removeItem('studio:last_installed_release_notes');
          } catch (_) {}
        }}
        version={successNotificationVersion || APP_VERSION_LABEL}
        sections={getSavedReleaseNotesAsSections()}
      />

      <style>{`
        @keyframes pill-pulse {
          0%, 100% { box-shadow: 0 4px 14px ${tint(19)}; }
          50%      { box-shadow: 0 4px 14px ${tint(19)}, 0 0 0 6px ${tint(12)}; }
        }
        @keyframes pill-download-bounce {
          0%   { transform: translateY(-3px); opacity: 0.55; }
          45%  { transform: translateY(2px);  opacity: 1; }
          60%  { transform: translateY(2px);  opacity: 1; }
          100% { transform: translateY(-3px); opacity: 0.55; }
        }
        @keyframes lg-spin-spinner {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes lg-indeterminate-progress {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </>
  );
}

function ActionButton({
  style,
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        ...style,
        outline: 'none',
        border: style?.border || 'none',
        transition: 'opacity 200ms ease, background-color 200ms ease, border-color 200ms ease, transform 200ms ease',
      }}
    >
      {children}
    </motion.button>
  );
}

const DownloadProgressIndicator = React.memo(({ updater, toVersion, accentFrom, accentTo, isLight }: any) => {
  const [downloadMetrics, setDownloadMetrics] = useState({
    downloadedMB: 0,
    totalMB: 0,
    speedMBs: 0,
    remainingSeconds: 0,
  });

  const lastProgressRef = useRef(0);
  const lastTimeRef = useRef(0);
  const smoothedSpeedRef = useRef(0);

  useEffect(() => {
    const isDownloading = updater.updateState === 'DOWNLOAD_APK' || updater.updateState === 'FETCH_APK_INFORMATION';
    if (isDownloading) {
      const totalBytes = updater.apkSizeBytes || 56194057;
      const downloadedBytes = totalBytes * updater.progress;
      
      const now = Date.now();
      const lastTime = lastTimeRef.current;
      const lastProgress = lastProgressRef.current;
      
      let speed = 0;
      let remaining = 0;
      
      if (lastTime > 0 && now > lastTime && updater.progress > lastProgress) {
        const timeDiffSec = (now - lastTime) / 1000;
        const bytesDiff = totalBytes * (updater.progress - lastProgress);
        const currentSpeed = bytesDiff / timeDiffSec;
        
        if (smoothedSpeedRef.current === 0) {
          smoothedSpeedRef.current = currentSpeed;
        } else {
          smoothedSpeedRef.current = 0.3 * currentSpeed + 0.7 * smoothedSpeedRef.current;
        }
        
        speed = smoothedSpeedRef.current;
      }
      
      lastTimeRef.current = now;
      lastProgressRef.current = updater.progress;
      
      if (speed > 0) {
        const remainingBytes = totalBytes - downloadedBytes;
        remaining = remainingBytes / speed;
      }
      
      setDownloadMetrics({
        downloadedMB: downloadedBytes / (1024 * 1024),
        totalMB: totalBytes / (1024 * 1024),
        speedMBs: speed / (1024 * 1024),
        remainingSeconds: remaining,
      });
    } else {
      lastProgressRef.current = 0;
      lastTimeRef.current = 0;
      smoothedSpeedRef.current = 0;
    }

    return () => {
      lastProgressRef.current = 0;
      lastTimeRef.current = 0;
      smoothedSpeedRef.current = 0;
    };
  }, [updater.progress, updater.updateState, updater.apkSizeBytes]);

  const pct = Math.round(updater.progress * 100);

  return (
    <div style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: isLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)' }}>
        <span>Downloading update</span>
        <span>{pct}%</span>
      </div>
      
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
        <div 
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
            transition: 'width 200ms ease-out',
          }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontFamily: 'Inter, monospace', color: isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.55)' }}>
        <span>
          {downloadMetrics.downloadedMB > 0 && downloadMetrics.totalMB > 0 
            ? `${downloadMetrics.downloadedMB.toFixed(1)} MB / ${downloadMetrics.totalMB.toFixed(1)} MB` 
            : 'Calculating size...'}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          {downloadMetrics.speedMBs > 0 && (
            <span>
              {downloadMetrics.speedMBs >= 1 
                ? `${downloadMetrics.speedMBs.toFixed(1)} MB/s` 
                : `${(downloadMetrics.speedMBs * 1024).toFixed(0)} KB/s`}
            </span>
          )}
          {downloadMetrics.remainingSeconds > 0 && (
            <span>
              • {downloadMetrics.remainingSeconds < 60 
                ? `${Math.round(downloadMetrics.remainingSeconds)}s remaining` 
                : `${Math.floor(downloadMetrics.remainingSeconds / 60)}m ${Math.round(downloadMetrics.remainingSeconds % 60)}s remaining`}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}, (prev: any, next: any) => {
  return prev.updater.progress === next.updater.progress && prev.updater.updateState === next.updater.updateState && prev.isLight === next.isLight;
});

function UpdateModal({
  fromLabel,
  toVersion,
  mandatory,
  downloadUrl,
  accentFrom,
  accentTo,
  onClose,
  onLater,
  installFailedReason,
  setInstallFailedReason,
}: {
  fromLabel: string;
  toVersion: string;
  mandatory: boolean;
  downloadUrl: string | null;
  accentFrom: string;
  accentTo: string;
  onClose: () => void;
  onLater: () => void;
  installFailedReason: string | null;
  setInstallFailedReason: (v: string | null) => void;
}) {
  const updater = useAppUpdate();
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showGitHubConfirm, setShowGitHubConfirm] = useState(false);

  const settings = useChordStore(s => s.settings);
  const hubVis = settings.perApp?.hub ?? { theme: settings.theme ?? 'dark', amoledMode: settings.amoledMode ?? false };
  const isLight = (() => {
    if (hubVis.theme === 'light') return true;
    if (hubVis.theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    if (hubVis.theme === 'dynamic') {
      const h = new Date().getHours();
      const lightStart = settings.dynamicLightStart ?? 7;
      const lightEnd   = settings.dynamicLightEnd   ?? 20;
      return h >= lightStart && h < lightEnd;
    }
    return false;
  })();

  useEffect(() => {
    const isCompleted = updater.updateState === 'INSTALL_SUCCESS';
    if (!isCompleted) return;
    // The success screen stays visible until one of:
    // 1. Android kills this process and relaunches the new version
    // 2. The user taps the "Done" button (which calls endPostInstallSession)
    // 3. The 5-minute safety timeout in stateMachine.ts expires
    //
    // We do NOT auto-close, dismiss, or exit. The post-install session in
    // stateMachine.ts blocks ALL automatic update checks, lifecycle triggers,
    // and state resets. This eliminates the premature "Studio is up to date"
    // message that occurred when the old process was still alive after APK
    // installation.
    console.log('[Updater UI] Installation success detected. Success screen will remain visible until lifecycle transition.');
  }, [updater.updateState, updater]);

  const getDiagnosticsText = () => {
    return [
      '=== STUDIO UPDATE DIAGNOSTICS ===',
      `Failure Timestamp: ${updateDiagnostics.timestamp || 'N/A'}`,
      `Device Model/Manufacturer: ${updateDiagnostics.deviceModel || 'N/A'}`,
      `Android Version: ${updateDiagnostics.androidVersion || 'N/A'}`,
      `Permission State: ${updateDiagnostics.permissionState || 'N/A'}`,
      `Exception Message: ${updateDiagnostics.exceptionMessage || 'N/A'}`,
      `Failure Reason & Stack Trace:`,
      updateDiagnostics.failureReason || 'N/A',
      `Download URL Used: ${updateDiagnostics.downloadUrl || 'N/A'}`,
      `APK Path: ${updateDiagnostics.apkPath || 'N/A'}`,
      `File Size: ${updateDiagnostics.fileSize || 'N/A'}`,
      `SHA-256 Expected: ${updateDiagnostics.shaExpected || 'N/A'}`,
      `SHA-256 Calculated: ${updateDiagnostics.shaCalculated || 'N/A'}`,
      `Installer Result: ${updateDiagnostics.installerResult || 'N/A'}`,
      '',
      '=== COMPREHENSIVE DEBUG LOGS ===',
      `App Version (APP_VERSION): ${updateDebugLogs.appVersion}`,
      `APK Version (Wrapper): ${updateDebugLogs.nativeApkVersion || 'N/A'}`,
      `Update System: APK only`,
      `Updater System: disabled`,
      `AppInstaller Available: ${updateDebugLogs.appInstallerAvailable}`,
      `downloadApk Available: ${updateDebugLogs.downloadApkAvailable}`,
      `verifyApkSha256 Available: ${updateDebugLogs.verifyApkSha256Available}`,
      `installApk Available: ${updateDebugLogs.installApkAvailable}`,
      `openInstallPermissionSettings Available: ${updateDebugLogs.openInstallPermissionSettingsAvailable}`,
      `Registered Capacitor Plugins: ${updateDebugLogs.registeredPlugins}`,
      `Plugin Method Check: ${updateDebugLogs.pluginMethodCheck}`,
      `Fetched version.json: ${updateDebugLogs.fetchedVersionJson || 'N/A'}`,
      `Fetched app-release.json: ${updateDebugLogs.fetchedAppReleaseJson || 'N/A'}`,
      `Update Type: ${updateDebugLogs.updateType || 'N/A'}`,
      `Download Status: ${updateDebugLogs.downloadStatus || 'N/A'}`,
      `SHA Verification Status: ${updateDebugLogs.shaVerification || 'N/A'}`,
      `File Details: ${updateDebugLogs.fileDetails || 'N/A'}`,
      `Install Error / Log: ${updateDebugLogs.installError || 'N/A'}`,
      `Installer Launch Status: ${updateDebugLogs.installerLaunchStatus || 'N/A'}`,
      `Last Exception Stack Trace:`,
      updateDebugLogs.lastExceptionStackTrace || 'N/A',
      '',
      '=== ELIGIBILITY DETAILS ===',
      `Installed package: ${updateDebugLogs.installedPackageName || 'N/A'}`,
      `Installed versionName: ${updateDebugLogs.installedVersionName || 'N/A'}`,
      `Installed versionCode: ${updateDebugLogs.installedVersionCode || 'N/A'}`,
      `Installed signing SHA-256: ${updateDebugLogs.installedSigningSha256 || 'N/A'}`,
      `Installed debuggable: ${updateDebugLogs.installedDebuggable !== null ? updateDebugLogs.installedDebuggable : 'N/A'}`,
      '',
      `Downloaded package: ${updateDebugLogs.downloadedPackageName || 'N/A'}`,
      `Downloaded versionName: ${updateDebugLogs.downloadedVersionName || 'N/A'}`,
      `Downloaded versionCode: ${updateDebugLogs.downloadedVersionCode || 'N/A'}`,
      `Downloaded signing SHA-256: ${updateDebugLogs.downloadedSigningSha256 || 'N/A'}`,
      `Downloaded debuggable: ${updateDebugLogs.downloadedDebuggable !== null ? updateDebugLogs.downloadedDebuggable : 'N/A'}`,
      `Downloaded isValidApk: ${updateDebugLogs.downloadedIsValidApk !== null ? updateDebugLogs.downloadedIsValidApk : 'N/A'}`,
      `Downloaded isUniversalApk: ${updateDebugLogs.downloadedIsUniversalApk !== null ? updateDebugLogs.downloadedIsUniversalApk : 'N/A'}`,
      `Downloaded size: ${updateDebugLogs.downloadedApkSize || 'N/A'}`,
      '',
      `Eligibility package match: ${updateDebugLogs.eligibilityPackageNameMatch !== null ? updateDebugLogs.eligibilityPackageNameMatch : 'N/A'}`,
      `Eligibility signing match: ${updateDebugLogs.eligibilitySigningMatch !== null ? updateDebugLogs.eligibilitySigningMatch : 'N/A'}`,
      `Eligibility versionCode higher: ${updateDebugLogs.eligibilityVersionCodeHigher !== null ? updateDebugLogs.eligibilityVersionCodeHigher : 'N/A'}`,
      `Eligibility release build: ${updateDebugLogs.eligibilityReleaseBuild !== null ? updateDebugLogs.eligibilityReleaseBuild : 'N/A'}`,
      `Eligibility valid APK: ${updateDebugLogs.eligibilityValidApk !== null ? updateDebugLogs.eligibilityValidApk : 'N/A'}`,
      `Eligibility final install: ${updateDebugLogs.eligibilityFinalInstall || 'N/A'}`,
      `Eligibility reason: ${updateDebugLogs.eligibilityReason || 'N/A'}`
    ].join('\n');
  };

  const isApkFlow = updater.updateType === 'apk' || updater.updateType === 'both';

  // Signature purple/pink colors override
  const purpleFrom = '#b57bee';
  const purpleTo = '#db2777';

  const handleStartUpdate = async () => {
    try {
      if (Capacitor.isNativePlatform() && isAppInstallerAvailable()) {
        const { AppInstaller } = await import('@workspace/studio-core');
        await AppInstaller.clearInstallerLogHistory();
      }
      await updater.downloadUpdate('UpdateIndicator: UpdateModal');
      await updater.applyUpdate('UpdateIndicator: UpdateModal');
    } catch (err) {
      console.error('[UpdateIndicator] Start update failed:', err);
    }
  };

  const handleInstallApk = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { AppInstaller } = await import('@workspace/studio-core');
        const hasPerm = (await AppInstaller.canRequestPackageInstalls()).value;
        if (!hasPerm) {
          setPermissionBlocked(true);
          return;
        }
      }
      
      // Attempt to launch installer
      await updater.applyUpdate('UpdateIndicator: UpdateModal');
    } catch (err) {
      console.error('[UpdateIndicator] APK Install failed:', err);
    }
  };

  const handleOpenSettings = async () => {
    try {
      const { AppInstaller } = await import('@workspace/studio-core');
      await AppInstaller.openUnknownAppSourcesSettings();
    } catch (err) {
      console.error('[UpdateIndicator] Failed to open settings:', err);
    }
  };

  const handleOpenGitHub = async () => {
    try {
      const { resolveReleasePageUrl } = await import('@workspace/studio-core');
      const fallbackUrl = await resolveReleasePageUrl(updater.remoteVersion ?? undefined);
      window.open(fallbackUrl, '_system');
    } catch (err) {
      window.open('https://github.com/MAGEXE1000/Studio/releases', '_system');
    }
  };

  useEffect(() => {
    if (!permissionBlocked) return;
    let active = true;
    let nativeListener: { remove: () => Promise<void> } | undefined;

    const checkPerm = async () => {
      try {
        const { AppInstaller } = await import('@workspace/studio-core');
        const hasPerm = (await AppInstaller.canRequestPackageInstalls()).value;
        if (hasPerm && active) {
          setPermissionBlocked(false);
          await updater.applyUpdate('UpdateIndicator: UpdateModal');
        }
      } catch (err) {
        console.warn('[Permissions] Failed to query status:', err);
      }
    };

    import('@capacitor/app').then(async ({ App }) => {
      if (!active) return;
      nativeListener = await App.addListener('appStateChange', (s) => {
        if (s.isActive) checkPerm();
      });
    }).catch(() => {});

    window.addEventListener('focus', checkPerm);
    return () => {
      active = false;
      window.removeEventListener('focus', checkPerm);
      nativeListener?.remove().catch(() => {});
    };
  }, [permissionBlocked, updater]);



  // Select Icon and Colors based on State
  let iconName = 'download';
  let iconColor = purpleFrom;
  let title = 'Update available';
  let description: React.ReactNode = '';
  let showProgress = false;
  let progressVal = updater.progress;
  let showButtons = true;
  let showSpinner = false;

  const displayState = (() => {
    let s = updater.updateState;
    if (s === 'INITIALIZING' || s === 'FETCH_REMOTE_METADATA' || s === 'VALIDATE_METADATA' || s === 'COMPARE_VERSION') return 'checking';
    if (s === 'NO_UPDATE_AVAILABLE' || s === 'IDLE') return 'idle';
    if (s === 'UPDATE_AVAILABLE') return 'update_available';
    if (s === 'FETCH_APK_INFORMATION' || s === 'DOWNLOAD_APK') return 'downloading';
    if (s === 'VERIFY_SHA256') return 'verifying_sha';
    if (s === 'PREPARING_INSTALL') return 'verifying_eligibility';
    if (s === 'WAITING_USER_CONFIRMATION') return 'ready_to_install';
    if (s === 'PACKAGEINSTALLER_VISIBLE') return 'packageinstaller_visible';
    if (s === 'INSTALLING') return 'installing';
    if (s === 'INSTALL_SUCCESS') {
      const isSim = false;
      return isSim ? 'completed' : 'installing';
    }
    if (s === 'INSTALL_CANCELLED') return 'cancelled';
    if (s === 'INSTALL_FAILED') return 'failed';
    if (s === 'RECOVERY') {
      if (updater.error?.includes('Signature mismatch') || updater.error?.includes('Conflicting Package')) return 'signature_mismatch';
      if (updater.error?.includes('versionCode_low')) return 'versionCode_low';
      return 'failed';
    }
    return s;
  })();

  let state = installFailedReason
    ? 'install_failed'
    : (permissionBlocked ? 'permission_blocked' : displayState);
  if (state === 'update_available') {
    if (updater.reinstallRequired) {
      state = 'reinstall_warning';
    } else if (updater.apkUpdateRequired && !isAppInstallerAvailable()) {
      state = 'manual_apk_required';
    } else {
      state = 'available';
    }
  } else if (state === 'waiting_for_confirmation') {
    state = 'waitingForUserInstallConfirmation';
  } else if (displayState === 'ready_to_install') {
    state = 'readyForInstallPrompt';
  } else if (displayState === 'completed') {
    state = 'installedOrReady';
  } else if (displayState === 'idle') {
    if (updater.error) {
      if (updater.error.includes('Signature mismatch') || updater.error.includes('Conflicting Package')) {
        state = 'signature_mismatch';
      } else if (updater.error.includes('versionCode_low')) {
        state = 'versionCode_low';
      } else {
        state = 'failed';
      }
    } else {
      state = 'idle';
    }
  }

  // Collapsible changelog section state
  const [changelogExpanded, setChangelogExpanded] = useState(state === 'available' || state === 'reinstall_warning');

  useEffect(() => {
    setChangelogExpanded(state === 'available' || state === 'reinstall_warning');
  }, [state]);

  switch (state) {
    case 'reinstall_warning':
      iconName = 'warning';
      iconColor = '#f59e0b';
      title = 'Manual reinstall required';
      description = (
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          This update requires a manual reinstall. Android security policy prevents automatic upgrades when cryptographic keys change. Please uninstall the current app, then install the new version.
        </p>
      );
      break;

    case 'permission_blocked':
      iconName = 'security';
      iconColor = '#eab308';
      title = 'Automatic installation blocked';
      description = "Please enable the 'Install unknown apps' permission for Studio in system settings to install the update.";
      break;

    case 'checking':
      iconName = 'sync';
      iconColor = purpleFrom;
      showSpinner = true;
      title = 'Checking for updates';
      description = 'Connecting to release server...';
      showButtons = false;
      break;

    case 'idle':
      iconName = 'check_circle';
      iconColor = '#22c55e';
      title = 'Studio is up to date';
      description = 'You’re running the latest version of Studio.';
      break;

    case 'available':
      iconName = 'system_update';
      iconColor = purpleFrom;
      title = 'Studio update available';
      description = 'A new version of Studio is ready to install.';
      break;

    case 'manual_apk_required':
      iconName = 'download_for_offline';
      iconColor = '#eab308';
      title = 'Manual update required';
      description = 'This version of Studio cannot install updates automatically. Please download and install Studio manually once. Future updates will install automatically.';
      break;

    case 'preparing':
      iconName = 'sync';
      iconColor = purpleFrom;
      showSpinner = true;
      title = 'Preparing update';
      description = 'Initializing update system...';
      showButtons = false;
      break;

    case 'enteringProgressScreen':
      iconName = 'sync';
      iconColor = purpleFrom;
      showSpinner = true;
      title = 'Starting update';
      description = 'Transitioning to progress screen...';
      showButtons = false;
      break;

    case 'downloading':
      iconName = 'cloud_download';
      iconColor = purpleFrom;
      title = 'Downloading update';
      description = 'Studio is downloading the latest app package.';
      showProgress = true;
      showButtons = false;
      break;

    case 'verifying_sha':
    case 'verifying_eligibility':
    case 'verifying':
      iconName = 'verified_user';
      iconColor = purpleFrom;
      title = 'Verifying update';
      description = updater.statusText || 'Studio is checking the update package before installation.';
      showSpinner = true;
      showButtons = false;
      break;

    case 'readyForInstallPrompt':
      iconName = 'task_alt';
      iconColor = '#22c55e';
      title = 'Ready to install';
      description = 'The update package is verified. Android will now ask you to confirm the installation.';
      break;

    case 'waitingForUserInstallConfirmation':
      iconName = 'security';
      iconColor = '#eab308';
      title = 'Installation pending';
      description = 'Please follow system prompts to complete installation.';
      showSpinner = true;
      break;

    case 'packageinstaller_visible':
    case 'installing':
      iconName = 'sync';
      iconColor = purpleFrom;
      showSpinner = true;
      const isSuccess = updater.updateState === 'INSTALL_SUCCESS';
      title = isSuccess ? 'Finalizing...' : 'Installing...';
      description = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div>{isSuccess ? 'Finalizing installation...' : (updater.statusText || 'Android is installing the update.')}</div>
          <div style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>Please wait... Do not close the application.</div>
        </div>
      );
      showButtons = false;
      showProgress = false;
      break;

    case 'installedOrReady':
    case 'installed':
    case 'update_success':
    case 'completed':
      iconName = 'check_circle';
      iconColor = '#22c55e';
      title = 'Installation complete';
      description = `Version ${updater.remoteVersion || 'latest'} successfully installed.`;
      showButtons = false;
      showSpinner = false;
      break;

    case 'install_failed':
      iconName = 'error';
      iconColor = '#f87171';
      title = 'Installation Failed';
      description = installFailedReason || 'The installation could not be launched.';
      showButtons = false;
      showSpinner = false;
      break;

    case 'signature_mismatch':
      iconName = 'warning';
      iconColor = '#f87171';
      title = 'Signature Mismatch Detected';
      description = (
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          The downloaded update package signature does not match the installed app's signature. Android blocks installations when keys differ to prevent security conflicts. Please reinstall the application or use fallback download options below.
        </p>
      );
      break;

    case 'versionCode_low':
      iconName = 'error';
      iconColor = '#f87171';
      title = 'Invalid update package';
      description = 'This update cannot be installed because its Android versionCode is not newer than the installed app.';
      break;

    case 'failed':
      if (updater.recoveryMode) {
        iconName = 'healing';
        iconColor = '#eab308';
        title = 'Update Recovery Mode';
        description = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', fontSize: 13, marginTop: 4 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#eab308', lineHeight: 1.4 }}>
              Studio failed to update automatically multiple times.
            </p>
            <p style={{ margin: 0, color: 'var(--c-text-secondary)', lineHeight: 1.45 }}>
              Use the fail-safe recovery options below to install the update directly, share the update package, or download from alternative mirror sites.
            </p>
          </div>
        );
      } else {
        iconName = 'error';
        iconColor = '#f87171';
        title = 'Update download failed';
        if (updater.error && (updater.error.includes('404') || updater.error.includes('non-OK status: 404'))) {
          description = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', fontSize: 13, marginTop: 4 }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#f87171', lineHeight: 1.4 }}>
                Studio update package was not found on the release server.
              </p>
              <div style={{ background: 'rgba(128,128,128,0.05)', padding: '10px 12px', borderRadius: 10, fontFamily: 'monospace', fontSize: 11, border: '1px solid rgba(128,128,128,0.1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Target Version: {updater.remoteVersion || 'N/A'}</div>
                <div style={{ wordBreak: 'break-all' }}>APK URL: {updater.apkUrl || 'N/A'}</div>
                <div>HTTP Status: 404 (Not Found)</div>
                <div>Metadata (app-release.json) fetched: Yes</div>
              </div>
              <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: 12, lineHeight: 1.4 }}>
                <strong>Suggested action:</strong> Try again later. This usually means the release metadata was published before the APK upload completed.
              </p>
            </div>
          );
        } else {
          description = updater.error || 'Studio could not complete the update. You can try again or copy diagnostics.';
        }
      }
      break;
  }

  // Visual custom styles overrides using HSL purple/pink colors
  const primaryButtonStyle: React.CSSProperties = {
    flex: 1, height: 44, borderRadius: 12,
    background: `linear-gradient(135deg, ${purpleFrom}, ${purpleTo})`,
    border: 'none', color: 'white',
    fontFamily: 'Manrope', fontWeight: 800, fontSize: 13,
    cursor: 'pointer',
    boxShadow: `0 4px 14px color-mix(in srgb, ${purpleTo} 25%, transparent)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 200ms ease, transform 150ms ease',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    flex: 1, height: 44, borderRadius: 12,
    background: 'rgba(128, 128, 128, 0.06)',
    border: '1px solid rgba(128, 128, 128, 0.15)',
    color: 'var(--c-text-secondary)',
    fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 200ms ease, border-color 200ms ease',
  };

  const halfSecondaryButtonStyle: React.CSSProperties = {
    flex: 1, height: 42, borderRadius: 12,
    background: 'transparent',
    border: '1px solid rgba(128, 128, 128, 0.15)',
    color: 'var(--c-text-primary)',
    fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const tertiaryButtonStyle: React.CSSProperties = {
    width: '100%', height: 40, borderRadius: 12,
    background: 'transparent',
    border: 'none',
    color: 'var(--c-text-secondary)',
    fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    marginTop: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const animatedPrimaryButtonStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    background: `linear-gradient(135deg, ${purpleFrom}, ${purpleTo})`,
    fontFamily: 'Manrope', fontWeight: 800, fontSize: 13,
    cursor: 'pointer',
    boxShadow: `0 4px 14px color-mix(in srgb, ${purpleTo} 25%, transparent)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  };

  const renderButtons = () => {
    if (!showButtons) return null;

    if (state === 'permission_blocked') {
      return (
        <div style={{ display: 'flex', gap: 8, marginTop: 18, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={() => setPermissionBlocked(false)}
            style={secondaryButtonStyle}
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="button"
            onClick={handleOpenSettings}
            style={primaryButtonStyle}
          >
            Open Settings
          </ActionButton>
        </div>
      );
    }

    if (state === 'idle') {
      return (
        <div style={{ marginTop: 18, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={onClose}
            style={{ ...primaryButtonStyle, width: '100%' }}
          >
            Close
          </ActionButton>
        </div>
      );
    }

    if (state === 'reinstall_warning') {
      const copyDiagnostics = async () => {
        const diagnosticText = getDiagnosticsText();
        try {
          await navigator.clipboard.writeText(diagnosticText);
          alert('Diagnostics copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy diagnostics:', err);
        }
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={() => setShowGitHubConfirm(true)}
            style={primaryButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>download</span>
            Download Latest Release
          </ActionButton>
          
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <ActionButton
              type="button"
              onClick={copyDiagnostics}
              style={halfSecondaryButtonStyle}
            >
              Copy diagnostics
            </ActionButton>
            <ActionButton
              type="button"
              onClick={onClose}
              style={halfSecondaryButtonStyle}
            >
              I understand
            </ActionButton>
          </div>

          <ActionButton
            type="button"
            onClick={onLater}
            style={tertiaryButtonStyle}
          >
            Cancel
          </ActionButton>
        </div>
      );
    }

    if (state === 'available') {
      return (
        <div style={{ width: '100%' }}>
          {updater.validApkExists ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, width: '100%' }}>
              <ActionButton
                type="button"
                onClick={async () => {
                  try {
                    await updater.downloadUpdate('Modal: Continue Installation');
                    await updater.applyUpdate('Modal: Continue Installation');
                  } catch (err) {
                    console.error('[UpdateIndicator] Continue installation failed:', err);
                  }
                }}
                style={primaryButtonStyle}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>play_circle</span>
                Continue Installation
              </ActionButton>
              <ActionButton
                type="button"
                onClick={onLater}
                style={secondaryButtonStyle}
              >
                Later
              </ActionButton>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, width: '100%' }}>
              <ActionButton
                type="button"
                onClick={onLater}
                style={secondaryButtonStyle}
              >
                Later
              </ActionButton>
              <AnimatedActionButton
                type="button"
                onClick={handleStartUpdate}
                wrapStyle={{ flex: 1, height: 44 }}
                borderRadius={12}
                trailColor={purpleTo}
                style={animatedPrimaryButtonStyle}
              >
                Update Now
              </AnimatedActionButton>
            </div>
          )}
        </div>
      );
    }

    if (state === 'manual_apk_required') {
      const manualApkUrl = updater.manualApkUrl || `https://studio-30f44.web.app/apk/studio-${updater.remoteVersion}.bin`;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={() => window.open(manualApkUrl, '_system')}
            style={{ ...primaryButtonStyle, width: '100%' }}
          >
            Download APK
          </ActionButton>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <ActionButton
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(manualApkUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                } catch (err) {
                  console.error('Failed to copy manual APK URL:', err);
                }
              }}
              style={halfSecondaryButtonStyle}
            >
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleOpenGitHub}
              style={halfSecondaryButtonStyle}
            >
              GitHub Fallback
            </ActionButton>
          </div>
          <ActionButton
            type="button"
            onClick={onLater}
            style={tertiaryButtonStyle}
          >
            Later
          </ActionButton>
        </div>
      );
    }

    if (state === 'ready_to_install') {
      return (
        <div style={{ display: 'flex', gap: 8, marginTop: 18, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={onLater}
            style={secondaryButtonStyle}
          >
            Later
          </ActionButton>
          <ActionButton
            type="button"
            onClick={handleInstallApk}
            style={primaryButtonStyle}
          >
            Install
          </ActionButton>
        </div>
      );
    }

    if (state === 'signature_mismatch') {
      const copyDiagnostics = async () => {
        try {
          const report = await getDiagnosticsReport();
          await navigator.clipboard.writeText(report);
          alert('Diagnostics health report copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy diagnostics:', err);
        }
      };
      
      const handleRetryRecovery = async () => {
        try {
          await updater.runSignatureMismatchRecovery();
        } catch (err: any) {
          alert(`Recovery failed: ${err.message || String(err)}`);
        }
      };

      const handleGitHubInstall = async () => {
        try {
          await updater.downloadAndInstallGitHubApk();
        } catch (err: any) {
          alert(`GitHub install failed: ${err.message || String(err)}`);
        }
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <ActionButton
              type="button"
              onClick={handleRetryRecovery}
              style={halfSecondaryButtonStyle}
            >
              Retry
            </ActionButton>
            <ActionButton
              type="button"
              onClick={onLater}
              style={halfSecondaryButtonStyle}
            >
              Cancel
            </ActionButton>
          </div>

          <ActionButton
            type="button"
            onClick={handleGitHubInstall}
            style={primaryButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>download</span>
            Install Latest APK from GitHub
          </ActionButton>
          
          <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 4 }}>
            <ActionButton
              type="button"
              onClick={handleOpenGitHub}
              style={{ ...halfSecondaryButtonStyle, fontSize: 11, height: 36 }}
            >
              GitHub Release Page
            </ActionButton>
            <ActionButton
              type="button"
              onClick={copyDiagnostics}
              style={{ ...halfSecondaryButtonStyle, fontSize: 11, height: 36 }}
            >
              Copy Diagnostics
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              style={{ ...halfSecondaryButtonStyle, fontSize: 11, height: 36 }}
            >
              Diagnostics UI
            </ActionButton>
          </div>
        </div>
      );
    }

    if (state === 'versionCode_low') {
      const copyDiagnostics = async () => {
        const diagnosticText = getDiagnosticsText();
        try {
          await navigator.clipboard.writeText(diagnosticText);
          alert('Diagnostics copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy diagnostics:', err);
        }
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <ActionButton
              type="button"
              onClick={copyDiagnostics}
              style={halfSecondaryButtonStyle}
            >
              Copy Diagnostics
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              style={halfSecondaryButtonStyle}
            >
              Diagnostics UI
            </ActionButton>
          </div>

          <ActionButton
            type="button"
            onClick={onLater}
            style={primaryButtonStyle}
          >
            Later
          </ActionButton>
        </div>
      );
    }

    if (state === 'failed') {
      const copyDiagnostics = async () => {
        try {
          const report = await getDiagnosticsReport();
          await navigator.clipboard.writeText(report);
          alert('Diagnostics health report copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy diagnostics:', err);
        }
      };

      const exportDiagnostics = async () => {
        try {
          const report = await getDiagnosticsReport();
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: 'Studio Updater Diagnostics',
            text: report,
            dialogTitle: 'Export Diagnostics'
          });
        } catch (err) {
          console.error('Failed to export diagnostics, copying instead:', err);
          await copyDiagnostics();
        }
      };

      if (updater.validApkExists) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, width: '100%' }}>
            <h4 style={{ margin: '4px 0 2px', fontSize: 13, fontWeight: 800, color: 'var(--c-text-primary)', fontFamily: 'Manrope', alignSelf: 'flex-start' }}>
              Installation could not be started
            </h4>
            <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.45, textAlign: 'left' }}>
              {updater.error || 'Studio could not start the installation automatically. Please choose an option below to recover.'}
            </p>

            <ActionButton
              type="button"
              onClick={async () => {
                try {
                  await updater.downloadUpdate('Recovery Center: Retry Installation');
                  await updater.applyUpdate('Recovery Center: Retry Installation');
                } catch (err) {
                  console.error('[UpdateIndicator] Recovery retry failed:', err);
                }
              }}
              style={primaryButtonStyle}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>refresh</span>
              Retry Installation
            </ActionButton>

            <ActionButton
              type="button"
              onClick={async () => {
                try {
                  await updater.downloadUpdate('Recovery Center: Continue Installation');
                  await updater.applyUpdate('Recovery Center: Continue Installation');
                } catch (err) {
                  console.error('[UpdateIndicator] Recovery continue failed:', err);
                }
              }}
              style={secondaryButtonStyle}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>play_circle</span>
              Continue Installation
            </ActionButton>

            <ActionButton
              type="button"
              onClick={() => setShowGitHubConfirm(true)}
              style={{
                width: '100%', height: 44, borderRadius: 12,
                background: 'transparent',
                border: '1px solid rgba(128, 128, 128, 0.25)',
                color: 'var(--c-text-secondary)',
                fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background-color 200ms ease',
              }}
            >
              <GithubIcon size={18} color="var(--c-text-secondary)" />
              Download from GitHub
            </ActionButton>

            <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
              <ActionButton
                type="button"
                onClick={copyDiagnostics}
                style={halfSecondaryButtonStyle}
              >
                Copy Diagnostics
              </ActionButton>
              <ActionButton
                type="button"
                onClick={exportDiagnostics}
                style={halfSecondaryButtonStyle}
              >
                Export Diagnostics
              </ActionButton>
            </div>

            <ActionButton
              type="button"
              onClick={onLater}
              style={tertiaryButtonStyle}
            >
              Cancel
            </ActionButton>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, width: '100%' }}>
          <h4 style={{ margin: '4px 0 2px', fontSize: 13, fontWeight: 800, color: 'var(--c-text-primary)', fontFamily: 'Manrope', alignSelf: 'flex-start' }}>
            Update Recovery Center
          </h4>
          <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.45, textAlign: 'left' }}>
            {updater.error || 'Studio could not complete the update automatically. Please choose a recovery action below.'}
          </p>

          <ActionButton
            type="button"
            onClick={async () => {
              if (updater.updateAvailable) {
                await handleStartUpdate();
              } else {
                await updater.checkNow();
              }
            }}
            style={primaryButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>refresh</span>
            Retry Update
          </ActionButton>

          <ActionButton
            type="button"
            onClick={() => setShowGitHubConfirm(true)}
            style={{
              width: '100%', height: 44, borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(128, 128, 128, 0.25)',
              color: 'var(--c-text-secondary)',
              fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background-color 200ms ease',
            }}
          >
            <GithubIcon size={18} color="var(--c-text-secondary)" />
            Download Latest Release
          </ActionButton>

          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
            <ActionButton
              type="button"
              onClick={copyDiagnostics}
              style={halfSecondaryButtonStyle}
            >
              Copy Diagnostics
            </ActionButton>
            <ActionButton
              type="button"
              onClick={exportDiagnostics}
              style={halfSecondaryButtonStyle}
            >
              Export Diagnostics
            </ActionButton>
          </div>

          <ActionButton
            type="button"
            onClick={onLater}
            style={tertiaryButtonStyle}
          >
            Cancel
          </ActionButton>
        </div>
      );
    }

    if (state === 'update_success' || state === 'installed' || state === 'installedOrReady') {
      return (
        <div style={{ marginTop: 18, width: '100%' }}>
          <ActionButton
            type="button"
            onClick={async () => {
              console.log('[INSTRUMENTATION] [JS] Done button clicked. Requesting app exit.');
              try {
                // End the post-install session and clear all locks so future
                // automatic checks are not blocked on the next cold start.
                endPostInstallSession('user_done_button');
                clearInstallationJustCompleted();
                onClose();
                updater.dismissUpdate();
                if (Capacitor.isNativePlatform()) {
                  await AppInstaller.clearInstallerLogHistory();
                  const { App: CapApp } = await import('@capacitor/app');
                  await CapApp.exitApp();
                }
              } catch (err) {
                console.error('[UpdateIndicator] Done click failed:', err);
              }
            }}
            style={{ ...primaryButtonStyle, width: '100%' }}
          >
            Done
          </ActionButton>
        </div>
      );
    }

    return null;
  };

  const renderIndeterminateProgress = () => {
    return (
      <div style={{ width: '100%', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
          <span>Installing update...</span>
          <span>In progress</span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(128,128,128,0.12)', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            width: '40%', height: '100%',
            background: `linear-gradient(90deg, ${purpleFrom}, ${purpleTo})`,
            animation: 'lg-indeterminate-progress 1.5s infinite linear',
            borderRadius: 3,
          }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontFamily: 'Inter', opacity: 0.8, textAlign: 'left' }}>
          {updater.statusText || 'Waiting for system confirmation...'}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    if (state === 'installing' || state === 'installedOrReady') {
      return renderIndeterminateProgress();
    }
    if (!showProgress) return null;
    const pct = Math.round(progressVal * 100);
    const fileName = `studio-update-${toVersion || 'latest'}.apk`;
    return (
      <div style={{ width: '100%', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
          <span>Downloading update</span>
          <span>{pct}%</span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(128,128,128,0.12)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${purpleFrom}, ${purpleTo})`,
            transition: 'width 200ms ease-out',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-text-secondary)', fontFamily: 'monospace', opacity: 0.8 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%', textAlign: 'left' }}>
            {fileName}
          </span>
          {updateDebugLogs.downloadedApkSize && updateDebugLogs.downloadedApkSize !== 'N/A' && (
            <span>{updateDebugLogs.downloadedApkSize}</span>
          )}
        </div>
      </div>
    );
  };

  const renderSpinner = () => {
    if (!showSpinner) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '12px 0 6px' }}>
        <SpinnerSvg cFrom={purpleFrom} cTo={purpleTo} />
      </div>
    );
  };

  const renderIcon = () => {
    if (showSpinner) {
      return (
        <div style={{
          width: 58, height: 58, borderRadius: '50%',
          background: 'rgba(128,128,128,0.06)',
          border: '1.5px solid rgba(128,128,128,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
        }}>
          <SpinnerSvg cFrom={purpleFrom} cTo={purpleTo} size={28} strokeWidth={3.6} />
        </div>
      );
    }

    return (
      <div style={{
        width: 58, height: 58, borderRadius: '50%',
        background: `color-mix(in srgb, ${iconColor} 12%, var(--app-surface))`,
        border: `1.5px solid color-mix(in srgb, ${iconColor} 28%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 20px color-mix(in srgb, ${iconColor} 18%, transparent)`,
        marginBottom: 10,
      }}>
        {iconName === 'download' ? (
          <DownloadIcon size={26} color={iconColor} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: iconColor }}>
            {iconName}
          </span>
        )}
      </div>
    );
  };

  const renderChangelog = () => {
    const releaseNotes = updater.releaseNotes;

    // Check if we have structured release notes with at least one item
    const hasStructured = releaseNotes && typeof releaseNotes === 'object' && !Array.isArray(releaseNotes) && (
      ((releaseNotes as StructuredReleaseNotes).added && (releaseNotes as StructuredReleaseNotes).added!.length > 0) ||
      ((releaseNotes as StructuredReleaseNotes).improved && (releaseNotes as StructuredReleaseNotes).improved!.length > 0) ||
      ((releaseNotes as StructuredReleaseNotes).fixed && (releaseNotes as StructuredReleaseNotes).fixed!.length > 0) ||
      ((releaseNotes as StructuredReleaseNotes).changed && (releaseNotes as StructuredReleaseNotes).changed!.length > 0)
    );

    if (hasStructured) {
      const rn = releaseNotes as StructuredReleaseNotes;
      const categories = [
        { label: 'Added', items: rn.added },
        { label: 'Improved', items: rn.improved },
        { label: 'Fixed', items: rn.fixed },
        { label: 'Changed', items: rn.changed },
      ].filter(cat => cat.items && cat.items.length > 0);

      return (
        <div style={{
          width: '100%',
          margin: '12px 0 4px',
          borderRadius: 14,
          background: 'rgba(128, 128, 128, 0.05)',
          border: '1px solid rgba(128, 128, 128, 0.08)',
          overflow: 'hidden',
          transition: 'all 200ms ease',
        }}>
          {/* Toggle Header */}
          <button
            type="button"
            onClick={() => setChangelogExpanded(!changelogExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-primary)',
              fontFamily: 'Manrope',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: purpleFrom }}>info</span>
              <span>What's New</span>
            </div>
            <span className="material-symbols-outlined" style={{
              fontSize: 16,
              color: 'var(--c-text-secondary)',
              transform: changelogExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}>
              expand_more
            </span>
          </button>

          {/* Categories list */}
          <AnimatePresence initial={false}>
            {changelogExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                style={{
                  maxHeight: 150,
                  overflowY: 'auto',
                  padding: '0 14px 12px',
                  borderTop: '1px solid rgba(128, 128, 128, 0.06)',
                }}
              >
                {categories.map((cat, idx) => (
                  <div key={idx} style={{ marginTop: idx === 0 ? 8 : 12 }}>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: 'var(--c-text-primary)',
                      fontFamily: 'Manrope',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 4,
                    }}>
                      {cat.label}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.55 }}>
                      {cat.items!.map((item: string, itemIdx: number) => (
                        <li key={itemIdx} style={{ marginBottom: 4 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Fallback to flat list or plain text splits
    const bullets = Array.isArray(releaseNotes)
      ? (releaseNotes as string[])
      : (updater.changelog ? updater.changelog.split('\n').map(l => l.trim()).filter(Boolean) : []);

    if (bullets.length === 0) return null;

    return (
      <div style={{
        width: '100%',
        margin: '12px 0 4px',
        borderRadius: 14,
        background: 'rgba(128, 128, 128, 0.05)',
        border: '1px solid rgba(128, 128, 128, 0.08)',
        overflow: 'hidden',
        transition: 'all 200ms ease',
      }}>
        {/* Toggle Header */}
        <button
          type="button"
          onClick={() => setChangelogExpanded(!changelogExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--c-text-primary)',
            fontFamily: 'Manrope',
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: purpleFrom }}>info</span>
            <span>What's New</span>
          </div>
          <span className="material-symbols-outlined" style={{
            fontSize: 16,
            color: 'var(--c-text-secondary)',
            transform: changelogExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}>
            expand_more
          </span>
        </button>

        {/* Bullet List Container */}
        <AnimatePresence initial={false}>
          {changelogExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              style={{
                maxHeight: 150,
                overflowY: 'auto',
                padding: '0 14px 12px',
                borderTop: '1px solid rgba(128, 128, 128, 0.06)',
              }}
            >
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.55 }}>
                {bullets.map((bullet, idx) => (
                  <li key={idx} style={{ marginBottom: 5 }}>
                    {bullet.replace(/^-\s*/, '')}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  // Render buttons
  const actionButtons = renderButtons();

  if (showGitHubConfirm) {
    const gitHubButtons = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: 14 }}>
        <ActionButton
          type="button"
          onClick={async () => {
            await handleOpenGitHub();
            setShowGitHubConfirm(false);
          }}
          style={primaryButtonStyle}
        >
          Open GitHub
        </ActionButton>
        <ActionButton
          type="button"
          onClick={() => setShowGitHubConfirm(false)}
          style={secondaryButtonStyle}
        >
          Cancel
        </ActionButton>
      </div>
    );

    const gitHubDescription = (
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.55, textAlign: 'left' }}>
        The automatic updater could not complete this installation.<br /><br />
        Studio publishes every official production APK on GitHub. You can safely download the latest signed release directly from the official repository.<br /><br />
        This is the recommended recovery method whenever automatic installation cannot complete.
      </p>
    );

    return (
      <StudioUpdateScreen
        state="github_confirm"
        progress={0}
        accentFrom={purpleFrom}
        accentTo={purpleTo}
        title="Download Official Release"
        description={gitHubDescription}
        iconName="github"
        iconColor="var(--c-text-primary)"
        showSpinner={false}
        showProgress={false}
        actionButtons={gitHubButtons}
        onClose={onClose}
        isLight={isLight}
        fromVersion={fromLabel}
        toVersion={toVersion}
      />
    );
  }

  const progressComponent = showProgress ? (
    <DownloadProgressIndicator
      updater={updater}
      toVersion={toVersion}
      accentFrom={accentFrom}
      accentTo={accentTo}
      isLight={isLight}
    />
  ) : undefined;

  return (
    <StudioUpdateScreen
      state={state}
      accentFrom={accentFrom}
      accentTo={accentTo}
      title={title}
      description={description}
      iconName={iconName}
      iconColor={iconColor}
      showSpinner={showSpinner}
      actionButtons={actionButtons}
      changelog={renderChangelog()}
      isRequired={mandatory && state === 'available'}
      onClose={onClose}
      progressComponent={progressComponent}
      isLight={isLight}
      fromVersion={fromLabel}
      toVersion={toVersion}
    />
  );
}
