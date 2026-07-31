import { SharedAppShell } from '@workspace/ui-shared/src/shared/layout/SharedAppShell';
import { type AppKey } from '@workspace/studio-core';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useChordStore, ACCENT_COLORS, useIsWebDesktop, useStudioPreferences, logActivity, resetNav, setNavHidden, setNavLocked, BackDispatcher, useStatusBar, recordNavigation, getNavigationEntries, NATIVE_VERSION, tolgee, addLog, useBackHandler, StartupCoordinator, useNavigationStore, NavigationDispatcher, type ActivePanel, navDiagnosticsRegistry, useApplicationTransitionStore, ThemeTransitionEngine, useBottomNavigationStore, subscribeSyncStatus, syncNow, useSettingsStore, authRepository, EasingPresets } from "@workspace/studio-core";

import { TolgeeProvider } from '@tolgee/react';

import { StudioHubSkeleton } from '@workspace/ui-shared/src/shared/loading/StudioSkeleton';
import { ErrorBoundary } from '@workspace/ui-shared/src/shared/feedback/ErrorBoundary';
import { AppEntryTransition, useAnimationSpeed,  } from '@workspace/ui-shared/src/features/hub/animations/AppAnimationSystem';
import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer, LaunchAnimationEngine, ApplicationTransitionEngine, BottomNavigationController,  } from '@workspace/ui-shared';
import { ChordexLogo, DrumexLogo, StagexLogoIcon, GroovexLogo, VocalexLogo,  } from '@workspace/ui-shared/src/features/chordex/icons/ChordexLogo';

const SharedNavigationBar = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SharedNavigationBar }))
);
const StudioHub = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.StudioHub }))
);
const LibraryPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.LibraryPanel }))
);
const SettingsPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SettingsPanel }))
);
const SaxophonePracticePanel = lazy(() =>
  import('@workspace/ui-shared').then((m: any) => ({ default: m.SaxophonePracticePanel }))
);
const SongsPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SongsPanel }))
);
const DrumEditor = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.DrumEditor }))
);
const GroovexApp = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.GroovexApp }))
);
const VocalexApp = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.VocalexApp }))
);
const StageCorePanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.StageCorePanel }))
);
import { Capacitor } from '@capacitor/core';

import './index.css';

if (typeof window !== 'undefined') {
  (window as any).__preloadUIModules = () => {
    void import('@workspace/ui-shared');
    void import('@workspace/ui-android');
  };
}

const isDebugModeEnabled =
  typeof window !== 'undefined' &&
  (localStorage.getItem('studio_debug_mode') === 'true' ||
    (window as any).__studio_debug_mode === true);

type AccountState =
  | { phase: 'unknown' }
  | { phase: 'signedOut' }
  | {
      phase: 'active';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
    }
  | {
      phase: 'pending';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
      scheduledAtMs: number;
    }
  | {
      phase: 'disabled';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
    };

const ALL_PANELS = ['songs', 'library', 'settings'] as const;

function getVisualStateForElement(selector: string) {
  const el = document.querySelector(selector);
  if (!el) {
    return {
      exists: false,
      visibility: 'none',
      opacity: 'none',
      display: 'none',
      pointerEvents: 'none',
      transform: 'none',
      filter: 'none',
      backdropFilter: 'none',
      zIndex: 'none',
    };
  }
  const style = window.getComputedStyle(el);
  return {
    exists: true,
    visibility: style.visibility || 'none',
    opacity: style.opacity || 'none',
    display: style.display || 'none',
    pointerEvents: style.pointerEvents || 'none',
    transform: style.transform || 'none',
    filter: style.filter || 'none',
    backdropFilter: style.backdropFilter || (style as any).webkitBackdropFilter || 'none',
    zIndex: style.zIndex || 'none',
  };
}

function getBoundingClientRectForElement(selector: string) {
  const el = document.querySelector(selector);
  if (!el) {
    return { exists: false, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  const rect = el.getBoundingClientRect();
  return {
    exists: true,
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    right: Math.round(rect.right),
    bottom: Math.round(rect.bottom),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function getViewportAudit() {
  const vv = window.visualViewport;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualViewport: vv
      ? {
          width: Math.round(vv.width),
          height: Math.round(vv.height),
          scale: vv.scale,
          offsetLeft: Math.round(vv.offsetLeft),
          offsetTop: Math.round(vv.offsetTop),
        }
      : null,
    dpr: window.devicePixelRatio || 1,
    orientation: screen.orientation
      ? {
          type: screen.orientation.type,
          angle: screen.orientation.angle,
        }
      : {
          type: window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary',
          angle: 0,
        },
  };
}

function estimateCompositedLayers(): number {
  try {
    const all = document.querySelectorAll('*');
    let layers = 0;
    all.forEach((el) => {
      const style = window.getComputedStyle(el);
      const hasTransform = style.transform && style.transform !== 'none';
      const hasWillChange =
        style.willChange && style.willChange !== 'auto' && style.willChange !== 'none';
      const hasFilter = style.filter && style.filter !== 'none';
      const hasBackdrop =
        ((style as any).backdropFilter && (style as any).backdropFilter !== 'none') ||
        ((style as any).webkitBackdropFilter && (style as any).webkitBackdropFilter !== 'none');
      const hasFixed = style.position === 'fixed';
      const isComposited = hasTransform || hasWillChange || hasFilter || hasBackdrop || hasFixed;
      if (isComposited) {
        layers++;
      }
    });
    return layers;
  } catch (_) {
    return 0;
  }
}

function isElementVisuallyEmpty(el: Element): boolean {
  if (el.textContent && el.textContent.trim().length > 0) {
    const style = window.getComputedStyle(el);
    if (
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      parseFloat(style.opacity || '1') > 0.01
    ) {
      return false; // Has visible text content!
    }
  }
  if (el.querySelector('img, svg, canvas, video')) {
    return false; // Has visible media components!
  }
  return true;
}

function getComputedAccumulatedColor(el: Element): {
  isBlackOrTransparent: boolean;
  color: string;
} {
  let current: Element | null = el;
  while (current) {
    const style = window.getComputedStyle(current);
    const bg = style.backgroundColor;
    const bgImg = style.backgroundImage;
    const opacity = parseFloat(style.opacity || '1');

    if (bgImg && bgImg !== 'none') {
      return { isBlackOrTransparent: false, color: `image: ${bgImg}` };
    }

    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

        if (a > 0.05 && opacity > 0.05) {
          // Check if color is black or very dark
          const isBlack = r < 15 && g < 15 && b < 15;
          if (!isBlack) {
            return { isBlackOrTransparent: false, color: bg };
          }
        }
      }
    }

    current = current.parentElement;
  }
  return { isBlackOrTransparent: true, color: 'transparent_or_black' };
}

function getVisuallyEmptyProbe() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const points = [
    { label: 'center', x: Math.round(w / 2), y: Math.round(h / 2) },
    { label: 'topLeft', x: Math.round(w * 0.1), y: Math.round(h * 0.1) },
    { label: 'topRight', x: Math.round(w * 0.9), y: Math.round(h * 0.1) },
    { label: 'bottomLeft', x: Math.round(w * 0.1), y: Math.round(h * 0.9) },
    { label: 'bottomRight', x: Math.round(w * 0.9), y: Math.round(h * 0.9) },
  ];

  const results: Record<
    string,
    {
      point: string;
      element: string;
      status: 'empty' | 'painted';
      color: string;
      hasContent: boolean;
    }
  > = {};

  points.forEach((pt) => {
    try {
      const el = document.elementFromPoint(pt.x, pt.y);
      if (!el) {
        results[pt.label] = {
          point: `${pt.x},${pt.y}`,
          element: 'none',
          status: 'empty',
          color: 'transparent',
          hasContent: false,
        };
        return;
      }
      const hasContent = !isElementVisuallyEmpty(el);
      const colorAudit = getComputedAccumulatedColor(el);
      const empty = !hasContent && colorAudit.isBlackOrTransparent;

      results[pt.label] = {
        point: `${pt.x},${pt.y}`,
        element: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`,
        status: empty ? 'empty' : 'painted',
        color: colorAudit.color,
        hasContent,
      };
    } catch (_) {
      results[pt.label] = {
        point: `${pt.x},${pt.y}`,
        element: 'error',
        status: 'empty',
        color: 'error',
        hasContent: false,
      };
    }
  });

  const allEmpty = Object.values(results).every((res) => res.status === 'empty');

  return {
    results,
    allEmpty,
  };
}

function getWebViewRenderAudit() {
  const rootSelector = '#root';
  const hubSelector = '[data-livex-hub-root="true"], #hub-root';

  const getAuditForEl = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return { exists: false };
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      exists: true,
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      display: style.display || 'none',
      visibility: style.visibility || 'none',
      opacity: style.opacity || '1',
      transform: style.transform || 'none',
      filter: style.filter || 'none',
      contain: style.contain || 'none',
      isolation: style.isolation || 'none',
      overflow: style.overflow || 'visible',
    };
  };

  return {
    root: getAuditForEl(rootSelector),
    hub: getAuditForEl(hubSelector),
    layerCount: estimateCompositedLayers(),
  };
}

function takeForensicSnapshot(stage: string) {
  const currentAppMode = useSettingsStore.getState().settings.appMode || 'hub';
  const stableKey = (window as any).__studioStableKey || 'none';
  const transitionActive = (window as any).studioTransitionActive || false;
  const visualProbe = getVisuallyEmptyProbe();
  const renderAudit = getWebViewRenderAudit();

  const hubRoot =
    document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
  const hubDomState = {
    mounted: !!hubRoot,
    htmlLength: hubRoot ? hubRoot.outerHTML.length : 0,
    elementCount: hubRoot ? hubRoot.getElementsByTagName('*').length : 0,
    textContentLength: hubRoot ? (hubRoot.textContent || '').trim().length : 0,
    id: hubRoot ? hubRoot.id : '',
    className: hubRoot ? hubRoot.className : '',
  };

  const getRectSafe = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      top: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };

  const bounds = {
    root: getRectSafe('#root'),
    'app-container': getRectSafe('.app-container'),
    'app-main-layout': getRectSafe('.app-main-layout'),
    'hub-root': getRectSafe('[data-livex-hub-root="true"], #hub-root'),
    'hub-content': getRectSafe('[data-livex-hub-content="true"], .gb-wrap'),
    'subapp-wrapper': getRectSafe('.sc-subapp-wrapper'),
    'subapp-container': getRectSafe('.app-sub-app-container'),
  };

  const getStylesSafe = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return {
      display: s.display || 'none',
      visibility: s.visibility || 'hidden',
      opacity: s.opacity || '1',
      transform: s.transform || 'none',
      filter: s.filter || 'none',
      contain: s.contain || 'none',
      isolation: s.isolation || 'none',
      overflow: s.overflow || 'visible',
      zIndex: s.zIndex || 'auto',
      position: s.position || 'static',
    };
  };

  const computedStyles = {
    root: getStylesSafe('#root'),
    'app-container': getStylesSafe('.app-container'),
    'app-main-layout': getStylesSafe('.app-main-layout'),
    'hub-root': getStylesSafe('[data-livex-hub-root="true"], #hub-root'),
    'hub-content': getStylesSafe('[data-livex-hub-content="true"], .gb-wrap'),
    'subapp-wrapper': getStylesSafe('.sc-subapp-wrapper'),
  };

  const topmostElementsStack = (() => {
    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return Array.from(document.elementsFromPoint(w / 2, h / 2)).map((el) => {
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || '',
          zIndex: s.zIndex || 'auto',
          opacity: s.opacity || '1',
          pointerEvents: s.pointerEvents || 'auto',
          display: s.display || 'block',
          visibility: s.visibility || 'visible',
        };
      });
    } catch (_) {
      return [];
    }
  })();

  const visibilityState = document.visibilityState || 'unknown';

  const webViewMetrics = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth || 24,
    orientation: screen.orientation
      ? {
          type: screen.orientation.type,
          angle: screen.orientation.angle,
        }
      : {
          type: window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary',
          angle: 0,
        },
    visualViewport: window.visualViewport
      ? {
          width: Math.round(window.visualViewport.width),
          height: Math.round(window.visualViewport.height),
          offsetLeft: Math.round(window.visualViewport.offsetLeft),
          offsetTop: Math.round(window.visualViewport.offsetTop),
          scale: window.visualViewport.scale,
        }
      : null,
    layerCount: estimateCompositedLayers(),
  };

  return {
    timestamp: Date.now(),
    stage,
    appMode: currentAppMode,
    activeSubApp: currentAppMode !== 'hub' ? currentAppMode : 'none',
    stableKey,
    transitionActive,
    elements: {
      root: getVisualStateForElement('#root'),
      'app-container': getVisualStateForElement('.app-container'),
      'app-main-layout': getVisualStateForElement('.app-main-layout'),
      'hub-root': getVisualStateForElement('[data-livex-hub-root="true"], #hub-root'),
      'hub-shell': getVisualStateForElement('.hub-shell'),
      'hub-content': getVisualStateForElement('[data-livex-hub-content="true"], .gb-wrap'),
      'subapp-wrapper': getVisualStateForElement('.sc-subapp-wrapper'),
      'subapp-container': getVisualStateForElement('.app-sub-app-container'),
    },
    bounds,
    computedStyles,
    topmostElementsStack,
    visibilityState,
    webViewMetrics,
    viewport: getViewportAudit(),
    visualProbe,
    renderAudit,
    hubDomState,
  };
}

async function runPaintVerification(scaleFactor = 0.1) {
  const el =
    document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('root');
  if (!el) {
    return {
      domExists: false,
      paintState: 'error',
      blackPercent: 0,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: '',
    };
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el as HTMLElement, {
      logging: false,
      useCORS: true,
      scale: scaleFactor,
    });
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let blackCount = 0;
    let darkCount = 0;
    let midCount = 0;
    let brightCount = 0;
    const total = canvas.width * canvas.height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      if (r < 15 && g < 15 && b < 15) {
        blackCount++;
      }

      if (gray <= 15) {
        // already counted in black
      } else if (gray <= 64) {
        darkCount++;
      } else if (gray <= 180) {
        midCount++;
      } else {
        brightCount++;
      }
    }

    const blackPercent = total > 0 ? Math.round((blackCount / total) * 100) : 0;
    const isVisuallyBlack = blackPercent > 98;

    let thumbnail = '';
    try {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 60;
      thumbCanvas.height = 100;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, 60, 100);
        thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.2);
      } else {
        thumbnail = canvas.toDataURL('image/jpeg', 0.1);
      }
    } catch (_) {
      try {
        thumbnail = canvas.toDataURL('image/jpeg', 0.1);
      } catch (_) {}
    }

    return {
      domExists: true,
      paintState: isVisuallyBlack ? 'visually_black' : 'painted',
      blackPercent,
      histogram: {
        black: blackCount,
        dark: darkCount,
        mid: midCount,
        bright: brightCount,
      },
      totalPixels: total,
      thumbnail,
    };
  } catch (err) {
    console.error('Paint verification failed:', err);
    return {
      domExists: true,
      paintState: 'error',
      blackPercent: 0,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: '',
    };
  }
}

function captureTimelineCheckpoint(captureId: number, key: string) {
  try {
    const snap = takeForensicSnapshot(key);

    const currentTimelineStr = localStorage.getItem('studio_current_navigation_timeline');
    let timeline = currentTimelineStr ? JSON.parse(currentTimelineStr) : null;

    if (!timeline || timeline.id !== captureId) {
      timeline = {
        id: captureId,
        timestamp: Date.now(),
        appVersion: NATIVE_VERSION,
        versionCode: 95,
        snapshots: {},
        result: 'pending',
        reason: '',
      };
    } else {
      timeline.appVersion = NATIVE_VERSION;
      timeline.versionCode = 95;
    }

    timeline.snapshots[key] = snap;
    localStorage.setItem('studio_current_navigation_timeline', JSON.stringify(timeline));

    const listStr = localStorage.getItem('studio_forensic_captures') || '[]';
    const list = JSON.parse(listStr);
    const index = list.findIndex((c: any) => c.id === captureId);
    if (index !== -1) {
      list[index].snapshots = list[index].snapshots || {};
      list[index].snapshots[key] = snap;
      localStorage.setItem('studio_forensic_captures', JSON.stringify(list));
    } else {
      list.push(timeline);
      while (list.length > 20) {
        list.shift();
      }
      localStorage.setItem('studio_forensic_captures', JSON.stringify(list));
    }

    runPaintVerification()
      .then((paintData) => {
        const currentTimelineStrLatest = localStorage.getItem('studio_current_navigation_timeline');
        let tLatest = currentTimelineStrLatest ? JSON.parse(currentTimelineStrLatest) : null;
        if (tLatest && tLatest.id === captureId) {
          tLatest.snapshots[key].paintVerification = paintData;
          localStorage.setItem('studio_current_navigation_timeline', JSON.stringify(tLatest));
        }

        const listStrLatest = localStorage.getItem('studio_forensic_captures') || '[]';
        const listLatest = JSON.parse(listStrLatest);
        const idxLatest = listLatest.findIndex((c: any) => c.id === captureId);
        if (
          idxLatest !== -1 &&
          listLatest[idxLatest].snapshots &&
          listLatest[idxLatest].snapshots[key]
        ) {
          listLatest[idxLatest].snapshots[key].paintVerification = paintData;
          localStorage.setItem('studio_forensic_captures', JSON.stringify(listLatest));
        }
      })
      .catch((err) => {
        console.error(`Failed to capture paint verification for checkpoint ${key}:`, err);
      });
  } catch (err) {
    console.error(`Failed to capture checkpoint ${key}:`, err);
  }
}

let memoryLifecycleLogs: any[] = [];
let lifecycleFlushTimer: any = null;

function logLifecycleEvent(name: string, event: 'mount' | 'unmount') {
  const timestampStr = new Date().toISOString();
  const currentAppMode = useSettingsStore.getState().settings.appMode || 'hub';
  const isTransitioning = useNavigationStore.getState().isTransitioning;
  if (!isDebugModeEnabled) {
    return;
  }
  try {
    const timestamp = Date.now();
    const appMode = useSettingsStore.getState().settings.appMode || 'hub';
    const activeSubApp = (window as any).__lastActiveSubApp || 'none';
    const stableKey = (window as any).__lastStableKey || 'none';
    const activeAppToRender = (window as any).__lastActiveAppToRender || 'none';
    const cachedAppRef = (window as any).__lastCachedAppRef || 'none';
    const transitionActive = (window as any).studioTransitionActive || false;
    const hubRenderKey = (window as any).__lastHubRenderKey || 0;
    const previousAppMode = (window as any).__lastPreviousAppMode || 'none';

    let lastNavigationAction = 'none';
    const stack = new Error().stack || 'unknown';

    const logEntry = {
      timestamp,
      name,
      event,
      appMode,
      activeSubApp,
      stableKey,
      activeAppToRender,
      cachedAppRef,
      transitionActive,
      hubRenderKey,
      previousAppMode,
      lastNavigationAction,
      stack,
    };

    memoryLifecycleLogs.push(logEntry);
    if (memoryLifecycleLogs.length > 100) {
      memoryLifecycleLogs.shift();
    }

    if (lifecycleFlushTimer) {
      clearTimeout(lifecycleFlushTimer);
    }
    lifecycleFlushTimer = setTimeout(() => {
      try {
        const logsStr = localStorage.getItem('studio_root_lifecycle_logs') || '[]';
        let logs: any[] = JSON.parse(logsStr);
        logs = logs.concat(memoryLifecycleLogs);
        localStorage.setItem('studio_root_lifecycle_logs', JSON.stringify(logs.slice(-100)));
        memoryLifecycleLogs = [];
      } catch (_) {}
    }, 4000);
  } catch (err) {
    console.error('Failed to log lifecycle event:', err);
  }
}

function LifecycleTracker({ name }: { name: string }) {
  useEffect(() => {
    logLifecycleEvent(name, 'mount');
    return () => {
      logLifecycleEvent(name, 'unmount');
    };
  }, [name]);
  return null;
}

function TolgeeSuspenseFallback() {
  useEffect(() => {
    if (!isDebugModeEnabled) return;
    const errorLog = {
      timestamp: Date.now(),
      type: 'SUSPENSE_FALLBACK_RENDERED',
      stack: new Error().stack || 'unknown',
    };
    try {
      const logs = JSON.parse(localStorage.getItem('studio_root_lifecycle_logs') || '[]');
      logs.push(errorLog);
      localStorage.setItem('studio_root_lifecycle_logs', JSON.stringify(logs.slice(-50)));
    } catch (_) {}
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: '#121214',
        color: '#eaeaea',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box',
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
        Loading Translation Resources...
      </h3>
      <p
        style={{
          margin: '0 0 24px',
          fontSize: 13,
          color: '#a0a0a5',
          maxWidth: 360,
          lineHeight: 1.5,
        }}
      >
        Please wait while language assets are being initialized. If this screen persists, return to
        the Studio Hub.
      </p>
      <button
        onClick={() => {
          if (typeof (window as any).returnToStudioHub === 'function') {
            (window as any).returnToStudioHub();
          }
        }}
        style={{
          padding: '10px 20px',
          background: '#3b5bdb',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Return to Hub
      </button>
    </div>
  );
}
function getInitialLaunchPreset() {
  try {
    const raw = localStorage.getItem('chord-explorer-storage-v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.settings?.launchAnimationPreset) {
        return parsed.state.settings.launchAnimationPreset;
      }
    }
  } catch (e) {}
  return 'fluid_surface';
}


export default function App() {
  const settings = useSettingsStore((s) => s.settings);
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);
  const initialPresetRef = useRef<any>(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'default'
      : 'default'
  );

  const [route, setRoute] = useState('/app');
  const navigateTo = (path: string) => {
    if (path === '/') return; // Never route to landing page on Android
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  useEffect(() => {
    const handleIntroDone = () => {
      // Preflight checks
    };
    window.addEventListener('studio-intro-done', handleIntroDone);
    return () => window.removeEventListener('studio-intro-done', handleIntroDone);
  }, []);

  /* Note: safe-area-inset-top is handled by ScreenScaffold */

  return (
    <SharedAppShell
      isWeb={false}
      wrapProviders={(children) => (
        <TolgeeProvider tolgee={tolgee} fallback={null}>
          {children}
        </TolgeeProvider>
      )}
      renderLaunchOverlay={showLaunchOverlay ? () => (
        <LaunchAnimationEngine
          preset={initialPresetRef.current}
          skipIntro={false}
          onComplete={() => setShowLaunchOverlay(false)}
          isLight={
            settings.theme === 'light' ||
            (settings.theme === 'system' &&
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: light)').matches)
          }
          isAmoled={settings.perApp?.hub?.amoledMode}
        />
      ) : undefined}
      renderBottomNav={() => <BottomNavigationController />}
      hubElement={<StudioHub />}
      subApps={{
        groovex: <GroovexApp />,
        vocalex: <VocalexApp />,
        stage: <StageCorePanel />,
        drums: <DrumEditor />,
        chords: {
          sidebar: null,
          songs: <SongsPanel />,
          practice: <SaxophonePracticePanel />,
          library: <LibraryPanel />,
          settings: <SettingsPanel />,
        }
      }}
    />
  );
}
