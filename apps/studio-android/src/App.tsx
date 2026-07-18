import { type AppKey } from '@workspace/studio-core';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  useChordStore,
  ACCENT_COLORS,
  useIsWebDesktop,
  useStudioPreferences,
  logActivity,
  resetNav,
  setNavHidden,
  setNavLocked,
  BackDispatcher,
  useStatusBar,
  recordNavigation,
  getNavigationEntries,
  NATIVE_VERSION,
  tolgee,
  addLog,
  useBackHandler,
  StartupCoordinator,
  useNavigationStore,
  NavigationDispatcher,
  type ActivePanel,
  navDiagnosticsRegistry
} from '@workspace/studio-core';

import { TolgeeProvider } from '@tolgee/react';

import { StudioHubSkeleton } from '@workspace/ui-shared/src/components/StudioSkeleton';
import { ErrorBoundary } from '@workspace/ui-shared/src/components/ErrorBoundary';
import { AppEntryTransition, useAnimationSpeed, MOTION_EASINGS } from '@workspace/ui-shared/src/components/AppAnimationSystem';
import { SubAppScaffold, ScreenScaffold, SharedNavigationContainer, LaunchAnimationEngine } from '@workspace/ui-shared';
import {
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo
} from '@workspace/ui-shared/src/components/ChordexLogo';

const SharedNavigationBar = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.SharedNavigationBar })));
const StudioHub = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.StudioHub })));
const LibraryPanel = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.LibraryPanel })));
const ChordPanel = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.ChordPanel })));
const SettingsPanel = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.SettingsPanel })));
const SongsPanel = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.SongsPanel })));
const DrumEditor = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.DrumEditor })));
const GroovexApp = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.GroovexApp })));
const VocalexApp = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.VocalexApp })));
const StageCorePanel = lazy(() => import('@workspace/ui-android').then(m => ({ default: m.StageCorePanel })));
import { Capacitor } from '@capacitor/core';

import "./index.css";

if (typeof window !== 'undefined') {
  (window as any).__preloadUIModules = () => {
    void import('@workspace/ui-shared');
    void import('@workspace/ui-android');
  };
}

const isDebugModeEnabled = typeof window !== 'undefined' && (
  localStorage.getItem('studio_debug_mode') === 'true' ||
  (window as any).__studio_debug_mode === true
);


type AccountState =
  | { phase: 'unknown' }
  | { phase: 'signedOut' }
  | { phase: 'active'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } }
  | { phase: 'pending'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }; scheduledAtMs: number }
  | { phase: 'disabled'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } };

const ALL_PANELS = ['songs', 'library', 'chord', 'settings'] as const;

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
      zIndex: 'none'
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
    zIndex: style.zIndex || 'none'
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
    height: Math.round(rect.height)
  };
}

function getViewportAudit() {
  const vv = window.visualViewport;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualViewport: vv ? {
      width: Math.round(vv.width),
      height: Math.round(vv.height),
      scale: vv.scale,
      offsetLeft: Math.round(vv.offsetLeft),
      offsetTop: Math.round(vv.offsetTop)
    } : null,
    dpr: window.devicePixelRatio || 1,
    orientation: screen.orientation ? {
      type: screen.orientation.type,
      angle: screen.orientation.angle
    } : {
      type: window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary',
      angle: 0
    }
  };
}

function estimateCompositedLayers(): number {
  try {
    const all = document.querySelectorAll('*');
    let layers = 0;
    all.forEach(el => {
      const style = window.getComputedStyle(el);
      const hasTransform = style.transform && style.transform !== 'none';
      const hasWillChange = style.willChange && style.willChange !== 'auto' && style.willChange !== 'none';
      const hasFilter = style.filter && style.filter !== 'none';
      const hasBackdrop = ((style as any).backdropFilter && (style as any).backdropFilter !== 'none') ||
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
    if (style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0.01) {
      return false; // Has visible text content!
    }
  }
  if (el.querySelector('img, svg, canvas, video')) {
    return false; // Has visible media components!
  }
  return true;
}

function getComputedAccumulatedColor(el: Element): { isBlackOrTransparent: boolean; color: string } {
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
    { label: 'bottomRight', x: Math.round(w * 0.9), y: Math.round(h * 0.9) }
  ];
  
  const results: Record<string, { point: string; element: string; status: 'empty' | 'painted'; color: string; hasContent: boolean }> = {};
  
  points.forEach(pt => {
    try {
      const el = document.elementFromPoint(pt.x, pt.y);
      if (!el) {
        results[pt.label] = {
          point: `${pt.x},${pt.y}`,
          element: 'none',
          status: 'empty',
          color: 'transparent',
          hasContent: false
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
        hasContent
      };
    } catch (_) {
      results[pt.label] = {
        point: `${pt.x},${pt.y}`,
        element: 'error',
        status: 'empty',
        color: 'error',
        hasContent: false
      };
    }
  });
  
  const allEmpty = Object.values(results).every(res => res.status === 'empty');
  
  return {
    results,
    allEmpty
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
        height: Math.round(rect.height)
      },
      display: style.display || 'none',
      visibility: style.visibility || 'none',
      opacity: style.opacity || '1',
      transform: style.transform || 'none',
      filter: style.filter || 'none',
      contain: style.contain || 'none',
      isolation: style.isolation || 'none',
      overflow: style.overflow || 'visible'
    };
  };
  
  return {
    root: getAuditForEl(rootSelector),
    hub: getAuditForEl(hubSelector),
    layerCount: estimateCompositedLayers()
  };
}

function takeForensicSnapshot(stage: string) {
  const currentAppMode = useChordStore.getState().settings.appMode || 'hub';
  const stableKey = (window as any).__studioStableKey || "none";
  const transitionActive = (window as any).studioTransitionActive || false;
  const visualProbe = getVisuallyEmptyProbe();
  const renderAudit = getWebViewRenderAudit();

  const hubRoot = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
  const hubDomState = {
    mounted: !!hubRoot,
    htmlLength: hubRoot ? hubRoot.outerHTML.length : 0,
    elementCount: hubRoot ? hubRoot.getElementsByTagName('*').length : 0,
    textContentLength: hubRoot ? (hubRoot.textContent || '').trim().length : 0,
    id: hubRoot ? hubRoot.id : '',
    className: hubRoot ? hubRoot.className : ''
  };

  const getRectSafe = (sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  };

  const bounds = {
    'root': getRectSafe('#root'),
    'app-container': getRectSafe('.app-container'),
    'app-main-layout': getRectSafe('.app-main-layout'),
    'hub-root': getRectSafe('[data-livex-hub-root="true"], #hub-root'),
    'hub-content': getRectSafe('[data-livex-hub-content="true"], .gb-wrap'),
    'subapp-wrapper': getRectSafe('.sc-subapp-wrapper'),
    'subapp-container': getRectSafe('.app-sub-app-container')
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
      position: s.position || 'static'
    };
  };

  const computedStyles = {
    'root': getStylesSafe('#root'),
    'app-container': getStylesSafe('.app-container'),
    'app-main-layout': getStylesSafe('.app-main-layout'),
    'hub-root': getStylesSafe('[data-livex-hub-root="true"], #hub-root'),
    'hub-content': getStylesSafe('[data-livex-hub-content="true"], .gb-wrap'),
    'subapp-wrapper': getStylesSafe('.sc-subapp-wrapper')
  };

  const topmostElementsStack = (() => {
    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return Array.from(document.elementsFromPoint(w / 2, h / 2)).map(el => {
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || '',
          zIndex: s.zIndex || 'auto',
          opacity: s.opacity || '1',
          pointerEvents: s.pointerEvents || 'auto',
          display: s.display || 'block',
          visibility: s.visibility || 'visible'
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
    orientation: screen.orientation ? {
      type: screen.orientation.type,
      angle: screen.orientation.angle
    } : {
      type: window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary',
      angle: 0
    },
    visualViewport: window.visualViewport ? {
      width: Math.round(window.visualViewport.width),
      height: Math.round(window.visualViewport.height),
      offsetLeft: Math.round(window.visualViewport.offsetLeft),
      offsetTop: Math.round(window.visualViewport.offsetTop),
      scale: window.visualViewport.scale
    } : null,
    layerCount: estimateCompositedLayers()
  };

  return {
    timestamp: Date.now(),
    stage,
    appMode: currentAppMode,
    activeSubApp: currentAppMode !== 'hub' ? currentAppMode : 'none',
    stableKey,
    transitionActive,
    elements: {
      'root': getVisualStateForElement('#root'),
      'app-container': getVisualStateForElement('.app-container'),
      'app-main-layout': getVisualStateForElement('.app-main-layout'),
      'hub-root': getVisualStateForElement('[data-livex-hub-root="true"], #hub-root'),
      'hub-shell': getVisualStateForElement('.hub-shell'),
      'hub-content': getVisualStateForElement('[data-livex-hub-content="true"], .gb-wrap'),
      'subapp-wrapper': getVisualStateForElement('.sc-subapp-wrapper'),
      'subapp-container': getVisualStateForElement('.app-sub-app-container')
    },
    bounds,
    computedStyles,
    topmostElementsStack,
    visibilityState,
    webViewMetrics,
    viewport: getViewportAudit(),
    visualProbe,
    renderAudit,
    hubDomState
  };
}

async function runPaintVerification(scaleFactor = 0.1) {
  const el = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('root');
  if (!el) {
    return {
      domExists: false,
      paintState: 'error',
      blackPercent: 0,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: ''
    };
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el as HTMLElement, {
      logging: false,
      useCORS: true,
      scale: scaleFactor
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
      const g = data[i+1];
      const b = data[i+2];
      
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
        bright: brightCount
      },
      totalPixels: total,
      thumbnail
    };
  } catch (err) {
    console.error('Paint verification failed:', err);
    return {
      domExists: true,
      paintState: 'error',
      blackPercent: 0,
      histogram: { black: 0, dark: 0, mid: 0, bright: 0 },
      totalPixels: 0,
      thumbnail: ''
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
        reason: ''
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

    runPaintVerification().then(paintData => {
      const currentTimelineStrLatest = localStorage.getItem('studio_current_navigation_timeline');
      let tLatest = currentTimelineStrLatest ? JSON.parse(currentTimelineStrLatest) : null;
      if (tLatest && tLatest.id === captureId) {
        tLatest.snapshots[key].paintVerification = paintData;
        localStorage.setItem('studio_current_navigation_timeline', JSON.stringify(tLatest));
      }
      
      const listStrLatest = localStorage.getItem('studio_forensic_captures') || '[]';
      const listLatest = JSON.parse(listStrLatest);
      const idxLatest = listLatest.findIndex((c: any) => c.id === captureId);
      if (idxLatest !== -1 && listLatest[idxLatest].snapshots && listLatest[idxLatest].snapshots[key]) {
        listLatest[idxLatest].snapshots[key].paintVerification = paintData;
        localStorage.setItem('studio_forensic_captures', JSON.stringify(listLatest));
      }
    }).catch(err => {
      console.error(`Failed to capture paint verification for checkpoint ${key}:`, err);
    });
  } catch (err) {
    console.error(`Failed to capture checkpoint ${key}:`, err);
  }
}

function logLifecycleEvent(name: string, event: 'mount' | 'unmount') {
  const timestampStr = new Date().toISOString();
  const currentAppMode = useChordStore.getState().settings.appMode || 'hub';
  const isTransitioning = useNavigationStore.getState().isTransitioning;
  console.log(`[Lifecycle] [${timestampStr}] ${name} ${event} | appMode: ${currentAppMode}, transitionActive: ${isTransitioning}`);
  if (!isDebugModeEnabled) {
    return;
  }
  try {
    const timestamp = Date.now();
    const appMode = useChordStore.getState().settings.appMode || 'hub';
    const activeSubApp = (window as any).__lastActiveSubApp || 'none';
    const stableKey = (window as any).__lastStableKey || 'none';
    const activeAppToRender = (window as any).__lastActiveAppToRender || 'none';
    const cachedAppRef = (window as any).__lastCachedAppRef || 'none';
    const transitionActive = (window as any).studioTransitionActive || false;
    const hubRenderKey = (window as any).__lastHubRenderKey || 0;
    const previousAppMode = (window as any).__lastPreviousAppMode || 'none';
    
    let lastNavigationAction = 'none';
    try {
      const historyStr = localStorage.getItem('studio_navigation_history') || '[]';
      const history = JSON.parse(historyStr);
      if (history.length > 0) {
        lastNavigationAction = JSON.stringify(history[history.length - 1]);
      }
    } catch (_) {}

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
      stack
    };

    const logsStr = localStorage.getItem('studio_root_lifecycle_logs') || '[]';
    let logs: any[] = [];
    try {
      logs = JSON.parse(logsStr);
    } catch (_) {
      logs = [];
    }
    logs.push(logEntry);
    localStorage.setItem('studio_root_lifecycle_logs', JSON.stringify(logs.slice(-100)));
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
      stack: new Error().stack || 'unknown'
    };
    try {
      const logs = JSON.parse(localStorage.getItem('studio_root_lifecycle_logs') || '[]');
      logs.push(errorLog);
      localStorage.setItem('studio_root_lifecycle_logs', JSON.stringify(logs.slice(-50)));
    } catch (_) {}
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%', background: '#121214', color: '#eaeaea', padding: 24, textAlign: 'center',
      fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', position: 'absolute', inset: 0, zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Loading Translation Resources...</h3>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#a0a0a5', maxWidth: 360, lineHeight: 1.5 }}>
        Please wait while language assets are being initialized. If this screen persists, return to the Studio Hub.
      </p>
      <button
        onClick={() => {
          if (typeof (window as any).returnToStudioHub === 'function') {
            (window as any).returnToStudioHub();
          }
        }}
        style={{
          padding: '10px 20px', background: '#3b5bdb', border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
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
  const activePanel = useNavigationStore(s => {
    const last = s.history[s.history.length - 1];
    return (last?.app === 'chords' && last.page ? last.page as ActivePanel : 'library');
  });
  const routeApp = useNavigationStore(s => s.history[s.history.length - 1]?.app ?? 'hub');
  const settings = useChordStore(state => state.settings);
  const updateSettings = useChordStore(state => state.updateSettings);
  const { preferences } = useStudioPreferences();
  const isWebDesktop = useIsWebDesktop();
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);
  const initialPresetRef = useRef(getInitialLaunchPreset());

  // Bi-directional synchronization between navigation stack (NavigationStore) and chord store settings
  const lastSyncedRouteAppRef = useRef<string | null>(null);
  const lastSyncedSettingsAppRef = useRef<string | null>(null);

  useEffect(() => {
    const settingsApp = settings.appMode || 'hub';

    if (routeApp !== settingsApp) {
      const routeChanged = lastSyncedRouteAppRef.current !== null && routeApp !== lastSyncedRouteAppRef.current;
      const settingsChanged = lastSyncedSettingsAppRef.current !== null && settingsApp !== lastSyncedSettingsAppRef.current;

      if (routeChanged && !settingsChanged) {
        console.log(`[Sync-Android] Navigation route changed: ${settingsApp} -> ${routeApp}. Updating settings.appMode.`);
        updateSettings({ appMode: routeApp as any });
      } else if (settingsChanged && !routeChanged) {
        console.log(`[Sync-Android] Settings appMode changed: ${routeApp} -> ${settingsApp}. Updating navigation dispatcher.`);
        if (settingsApp === 'hub') {
          NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);
        } else {
          const currentHistory = useNavigationStore.getState().history;
          const isCurrentlySubApp = currentHistory.length > 1 && currentHistory[currentHistory.length - 1].app !== 'hub';
          if (isCurrentlySubApp) {
            NavigationDispatcher.replace({ app: settingsApp as any });
          } else {
            NavigationDispatcher.push({ app: settingsApp as any });
          }
        }
      } else {
        console.log(`[Sync-Android] Resolving sync drift: ${settingsApp} -> ${routeApp} (authoritative). Updating settings.appMode.`);
        updateSettings({ appMode: routeApp as any });
      }
    }

    lastSyncedRouteAppRef.current = routeApp;
    lastSyncedSettingsAppRef.current = settingsApp;
  }, [routeApp, settings.appMode, updateSettings]);
  const [hubRenderKey, setHubRenderKey] = useState(0);
  const [showHub, setShowHub] = useState(true);
  const [showHubEnabled, setShowHubEnabled] = useState(false);

  const speedScale = useAnimationSpeed();

  // Sync animation speed scale variable with CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--motion-speed-scale', String(speedScale));
  }, [speedScale]);

  const runForceWebViewRepaint = useCallback(() => {
    console.warn('[Diagnostics] Force WebView Repaint triggered.');
    try {
      const el = document.getElementById('root') || document.body;
      const originalDisplay = el.style.display;
      const originalTransform = el.style.transform;
      const originalOpacity = el.style.opacity;
      
      // A. Opacity toggle
      el.style.opacity = '0.99';
      // B. Display toggle
      el.style.display = 'none';
      document.body.offsetHeight; // force reflow
      
      // C. requestAnimationFrame repaint sequence
      requestAnimationFrame(() => {
        el.style.display = originalDisplay || 'block';
        el.style.opacity = '0.999';
        el.style.transform = 'translateZ(0)';
        document.body.offsetHeight;
        
        requestAnimationFrame(() => {
          el.style.opacity = originalOpacity || '1';
          el.style.transform = originalTransform || 'none';
          document.body.offsetHeight;
          
          // D. Dispatch events
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('orientationchange'));
        });
      });
      
      // Log status
      setTimeout(() => {
        try {
          runPaintVerification().then(paintData => {
            const success = paintData.paintState === 'painted';
            const logStr = localStorage.getItem('studio_visual_repaints_log') || '[]';
            const log = JSON.parse(logStr);
            log.push({
              timestamp: Date.now(),
              action: 'force_repaint',
              success,
              paintData
            });
            if (log.length > 20) log.shift();
            localStorage.setItem('studio_visual_repaints_log', JSON.stringify(log));
          });
        } catch (_) {}
      }, 150);
    } catch (e) {
      console.error('Force WebView Repaint failed:', e);
    }
  }, []);

  const runForceFullHubRebuild = useCallback(() => {
    console.warn('[Diagnostics] Force Full Hub Rebuild triggered.');
    
    // Reset transition locks and subapp wrappers
    try {
      document.querySelectorAll('.sc-subapp-wrapper').forEach(el => {
        el.remove();
      });
    } catch (_) {}

    flushSync(() => {
      useNavigationStore.getState().setTransition(null, false);
      setShowHub(false);
    });

    setTimeout(() => {
      flushSync(() => {
        setHubRenderKey(k => k + 1);
        setShowHub(true);
      });

      // Log full rebuild status
      setTimeout(() => {
        try {
          runPaintVerification().then(paintData => {
            const success = paintData.paintState === 'painted';
            const logStr = localStorage.getItem('studio_nuclear_recoveries_log') || '[]';
            const log = JSON.parse(logStr);
            log.push({
              timestamp: Date.now(),
              action: 'full_rebuild',
              success,
              paintData
            });
            if (log.length > 20) log.shift();
            localStorage.setItem('studio_nuclear_recoveries_log', JSON.stringify(log));
          });
        } catch (_) {}
      }, 150);
    }, 50);

  }, []);

  const runForceWebViewRefreshLayer = useCallback(() => {
    console.warn('[Diagnostics] Force WebView Refresh Compositor Layer triggered.');
    try {
      const el = document.documentElement;
      
      // Toggle compositing triggers on HTML element
      const originalWillChange = el.style.willChange;
      const originalFilter = el.style.filter;
      const originalTransform = el.style.transform;
      
      el.style.willChange = 'transform, opacity';
      el.style.filter = 'blur(0.01px)';
      el.style.transform = 'translate3d(0, 0, 0)';
      
      document.body.offsetHeight; // force reflow
      
      requestAnimationFrame(() => {
        el.style.willChange = originalWillChange;
        el.style.filter = originalFilter;
        el.style.transform = originalTransform;
        document.body.offsetHeight;
      });
      
      // Log status
      setTimeout(() => {
        try {
          runPaintVerification().then(paintData => {
            const success = paintData.paintState === 'painted';
            const logStr = localStorage.getItem('studio_visual_repaints_log') || '[]';
            const log = JSON.parse(logStr);
            log.push({
              timestamp: Date.now(),
              action: 'refresh_layer',
              success,
              paintData
            });
            if (log.length > 20) log.shift();
            localStorage.setItem('studio_visual_repaints_log', JSON.stringify(log));
          });
        } catch (_) {}
      }, 150);
    } catch (e) {
      console.error('Force WebView Refresh Layer failed:', e);
    }
  }, []);

  useEffect(() => {
    (window as any).runPaintVerification = runPaintVerification;
    (window as any).runForceWebViewRepaint = runForceWebViewRepaint;
    (window as any).runForceFullHubRebuild = runForceFullHubRebuild;
    (window as any).runForceWebViewRefreshLayer = runForceWebViewRefreshLayer;
    
    // Backwards compatibility mappings
    (window as any).runVisualRepaintRecovery = runForceWebViewRepaint;
    (window as any).runNuclearRecovery = runForceFullHubRebuild;
    (window as any).forceHubRepaint = runForceWebViewRepaint;
    (window as any).__forceRemountHub = () => {
      setHubRenderKey(k => k + 1);
    };

    (window as any).__runRootWatchdogCheck = (name: string) => {
      const currentMode = useChordStore.getState().settings.appMode || 'hub';
      const rootNode = document.getElementById('root');
      const appContainer = document.querySelector('.app-container');

      if (currentMode === 'hub' && rootNode && !appContainer) {
        console.warn(`[Root Watchdog] ROOT_APP_TREE_MISSING detected at ${name}! Running force remount.`);
        
        const logEntry = {
          timestamp: Date.now(),
          type: 'ROOT_TREE_MISSING',
          checkpoint: name,
          action: 'FORCE_REMOUNT'
        };
        
        let recoveryLog: any[] = [];
        try {
          const recStr = localStorage.getItem('studio_hub_mount_recovery_log') || '[]';
          recoveryLog = JSON.parse(recStr);
        } catch (_) {}
        recoveryLog.push(logEntry);
        localStorage.setItem('studio_hub_mount_recovery_log', JSON.stringify(recoveryLog));

        if (typeof (window as any).__forceRerenderApp === 'function') {
          (window as any).__forceRerenderApp();
        }

        flushSync(() => {
          (window as any).studioTransitionActive = false;
          useChordStore.getState().updateSettings({ appMode: 'hub' });
        });

        requestAnimationFrame(() => {
          const checkApp = document.querySelector('.app-container');
          const checkHub = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
          const success = !!(checkApp && checkHub);
          
          const resultEntry = {
            timestamp: Date.now(),
            type: success ? 'ROOT_TREE_RESTORED' : 'ROOT_TREE_RESTORE_FAILED',
            checkpoint: name,
            appContainerExists: !!checkApp,
            hubRootExists: !!checkHub
          };

          try {
            const currentLog = JSON.parse(localStorage.getItem('studio_hub_mount_recovery_log') || '[]');
            currentLog.push(resultEntry);
            localStorage.setItem('studio_hub_mount_recovery_log', JSON.stringify(currentLog));
          } catch (_) {}
        });
      }
    };

    return () => {
      delete (window as any).runPaintVerification;
      delete (window as any).runForceWebViewRepaint;
      delete (window as any).runForceFullHubRebuild;
      delete (window as any).runForceWebViewRefreshLayer;
      delete (window as any).runVisualRepaintRecovery;
      delete (window as any).runNuclearRecovery;
      delete (window as any).forceHubRepaint;
      delete (window as any).__forceRemountHub;
      delete (window as any).__runRootWatchdogCheck;
    };
  }, [runForceWebViewRepaint, runForceFullHubRebuild, runForceWebViewRefreshLayer]);





  const [exitToast, setExitToast] = useState(false);
  const exitToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBackTime = useRef<number>(0);

  const transitionActive = useNavigationStore(s => s.isTransitioning);

  // App launch transition state machine
  const [launchingApp, setLaunchingApp] = useState<AppKey | null>(null);
  const [splashVisible, setSplashVisible] = useState(false);
  const [appPreloaded, setAppPreloaded] = useState(false);
  const [splashFullyOpaque, setSplashFullyOpaque] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if ((window as any).__startupAnimationFreezes) {
      (window as any).__startupAnimationFreezes.forEach((f: any) => {
        addLog('warn', 'perf', `Pre-mount startup planets animation freeze: at ${f.t}ms, duration ${f.dt}ms`);
      });
      delete (window as any).__startupAnimationFreezes;
    }
  }, []);

  const launchStartTimeRef = useRef<number>(0);
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longTasksRef = useRef<number[]>([]);
  const observerRef = useRef<PerformanceObserver | null>(null);

  const handleAppPreloaded = useCallback((app: AppKey) => {
    if (useChordStore.getState().settings.appMode !== app) return;

    setAppPreloaded(true);
    if (typeof window !== 'undefined') {
      (window as any).studioTransitionActive = false;
    }

    const elapsed = Date.now() - launchStartTimeRef.current;
    const minDuration = 100 * speedScale; // Snappy visual confirmation delay scaled by speed preferences
    const remainingTime = Math.max(0, minDuration - elapsed);

    console.log(`[Launch] App ${app} loaded in ${elapsed}ms. Remaining splash time: ${remainingTime}ms.`);
    addLog('info', 'perf', `App preloaded: ${app} in ${elapsed}ms. First paint complete. Remaining splash: ${remainingTime}ms.`);

    if (launchTimerRef.current) {
      clearTimeout(launchTimerRef.current);
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    launchTimerRef.current = setTimeout(() => {
      console.log(`[Launch] Transitioning splash screen out for app: ${app}`);
      setSplashVisible(false);
      
      // Wait for the fade-out transition to complete (300ms) before clearing launchingApp
      setTimeout(() => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
        const maxDuration = longTasksRef.current.length > 0 ? Math.max(...longTasksRef.current) : 0;
        setLaunchingApp(null);
        addLog('info', 'perf', `App entry transition complete: ${app} fully active after ${Date.now() - launchStartTimeRef.current}ms.`);
        addLog('info', 'perf', `Longest main-thread blocking task during ${app} transition: ${maxDuration > 0 ? maxDuration.toFixed(1) + 'ms' : 'none detected'}.`);
      }, 300);
    }, remainingTime);
  }, []);

  const appMode = settings.appMode || 'hub';

  // Register diagnostics getters for printDiagnosticsDump
  useEffect(() => {
    navDiagnosticsRegistry.getMountedTree = () => {
      const tree: string[] = [];
      if (showHub) tree.push('StudioHub');
      if (launchingApp) tree.push(`LaunchingSplash(${launchingApp})`);
      if (appMode !== 'hub') tree.push(`SubAppWrapper(${appMode})`);
      return tree;
    };
    navDiagnosticsRegistry.getVisibleTree = () => {
      const tree: string[] = [];
      if (appMode === 'hub' && !launchingApp && !splashVisible) tree.push('StudioHub');
      if (splashVisible) tree.push(`LaunchingSplash(${launchingApp || appMode})`);
      if (appMode !== 'hub' && !splashVisible) tree.push(`SubAppWrapper(${appMode})`);
      return tree;
    };
    navDiagnosticsRegistry.getAnimationState = () => {
      return `transitionActive: ${transitionActive}, splashVisible: ${splashVisible}, appPreloaded: ${appPreloaded}, launchingApp: ${launchingApp}`;
    };
    navDiagnosticsRegistry.getAppMode = () => appMode;
    navDiagnosticsRegistry.getCachedPanel = () => {
      return (window as any).__studio_cached_panels || null;
    };
    return () => {
      delete navDiagnosticsRegistry.getMountedTree;
      delete navDiagnosticsRegistry.getVisibleTree;
      delete navDiagnosticsRegistry.getAnimationState;
      delete navDiagnosticsRegistry.getAppMode;
      delete navDiagnosticsRegistry.getCachedPanel;
    };
  }, [appMode, launchingApp, splashVisible, appPreloaded, transitionActive, showHub]);

  useEffect(() => {
    let cleanup: (() => void) | undefined = undefined;

    if (appMode !== 'hub') {
      const targetApp = appMode as AppKey;

      if (launchingApp === targetApp) return;

      console.log(`[Launch] Initiating transition from ${previousAppModeRef.current} to sub-app: ${targetApp}`);
      addLog('info', 'perf', `App launch transition started: ${previousAppModeRef.current} -> ${targetApp}`);

      if (launchTimerRef.current) {
        clearTimeout(launchTimerRef.current);
        launchTimerRef.current = null;
      }

      // Lock transition until target app is preloaded
      (window as any).studioTransitionActive = true;

      safetyTimeoutRef.current = setTimeout(() => {
        console.error(`[Launch] Safety timeout fired. ${targetApp} did not report ready within 4000ms. Forcing recovery.`);
        addLog('error', 'perf', `App launch transition timed out for: ${targetApp}. Forcing splash recovery.`);
        
        // Force recovery
        setSplashVisible(false);
        (window as any).studioTransitionActive = false;
        setTimeout(() => {
          setLaunchingApp(null);
        }, 300);
      }, 4000);

      // Initialize long task detection during this transition
      longTasksRef.current = [];
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              longTasksRef.current.push(entry.duration);
            }
          });
          obs.observe({ entryTypes: ['longtask'] });
          observerRef.current = obs;
        } catch (e) {
          console.warn('[Perf] PerformanceObserver longtask not supported:', e);
        }
      }

      launchStartTimeRef.current = Date.now();
      setLaunchingApp(targetApp);
      setSplashVisible(true);
      setAppPreloaded(false);

      if (!isInitialMount.current) {
        setSplashFullyOpaque(false);
        const tid = setTimeout(() => {
          setSplashFullyOpaque(true);
        }, 350);
        cleanup = () => {
          clearTimeout(tid);
          if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        };
      } else {
        cleanup = () => {
          if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        };
        setSplashFullyOpaque(true);
      }
    } else {
      if (launchTimerRef.current) {
        clearTimeout(launchTimerRef.current);
        launchTimerRef.current = null;
      }
      setLaunchingApp(null);
      setSplashVisible(false);
      setAppPreloaded(false);
      setSplashFullyOpaque(false);
    }

    return cleanup;
  }, [appMode]);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) {
        clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  function getAppName(app: AppKey): string {
    switch (app) {
      case 'chords': return 'Chordex';
      case 'drums': return 'Drumex';
      case 'stage': return 'Stagex';
      case 'groovex': return 'Groovex';
      case 'vocalex': return 'Vocalex';
      default: return '';
    }
  }

  function getAppColor(app: AppKey): string {
    switch (app) {
      case 'chords': return '#a855f7'; // Purple
      case 'drums': return '#ec4899'; // Pink
      case 'stage': return '#3b82f6'; // Blue
      case 'groovex': return '#10b981'; // Green
      case 'vocalex': return '#f59e0b'; // Amber/Yellow
      default: return '#ffffff';
    }
  }

  function renderAppLogo(app: AppKey, size: number) {
    switch (app) {
      case 'chords': return <ChordexLogo size={size} />;
      case 'drums': return <DrumexLogo size={size} />;
      case 'stage': return <StagexLogoIcon size={size} />;
      case 'groovex': return <GroovexLogo size={size} />;
      case 'vocalex': return <VocalexLogo size={size} />;
      default: return null;
    }
  }

  // Synchronize transitionActive with window.studioTransitionActive
  useEffect(() => {
    try {
      Object.defineProperty(window, 'studioTransitionActive', {
        get() {
          return useNavigationStore.getState().isTransitioning;
        },
        set(val) {
          useNavigationStore.getState().setTransition(null, !!val);
        },
        configurable: true
      });
    } catch (e) {
      console.warn('Failed to defineProperty studioTransitionActive', e);
    }
    return () => {
      try {
        delete (window as any).studioTransitionActive;
      } catch (e) {}
    };
  }, []);

  // 6-second safety watchdog for transitionActive
  useEffect(() => {
    let watchdogTimer: ReturnType<typeof setTimeout> | undefined;
    if (transitionActive) {
      watchdogTimer = setTimeout(() => {
        console.warn('[Safety] transitionActive watchdog triggered! Forcing reset to Hub.');
        useNavigationStore.getState().setTransition(null, false);
        updateSettings({ appMode: 'hub' });
        window.dispatchEvent(new CustomEvent('studio:reset-hub-zooming'));
      }, 6000);
    }
    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
  }, [transitionActive, updateSettings]);

  // ── Sync Active Theme & AMOLED Mode (handled globally by StartupCoordinator's subscriber) ──



  const returnToStudioHub = useCallback((isSwipeSuccess = false) => {
    const fromApp = useChordStore.getState().settings.appMode || 'hub';
    if (fromApp === 'hub') {
      return; // Already in hub, no need to navigate
    }

    // Diagnostics Logging
    try {
      const history = useNavigationStore.getState().history;
      const activeTab = history[history.length - 1]?.page || 'library';
      const transitionState = (window as any).studioTransitionActive || false;
      const lastBack = (window as any).__lastBackEventDetails;
      addLog('info', 'nav', `returnToStudioHub invoked: fromApp=${fromApp}, isSwipeSuccess=${isSwipeSuccess}, activeTab=${activeTab}, transitionActive=${transitionState}, lastBackEvent=${lastBack ? JSON.stringify(lastBack) : 'none'}`);
    } catch (e: any) {
      console.warn('Failed to print returnToStudioHub diagnostics:', e);
    }

    // FORENSIC AUTO-CAPTURE FOR CHORDEX -> HUB
    const isFromChords = fromApp === 'chords';
    if (isFromChords && isDebugModeEnabled) {
      try {
        const lastCaptureId = Date.now();
        (window as any).__lastForensicCaptureId = lastCaptureId;
        localStorage.setItem('studio_navigation_in_progress', 'true');
        
        // Capture 7 timing checkpoints
        (window as any).__lastCheckpointStage = 'T+0ms';
        captureTimelineCheckpoint(lastCaptureId, 'T+0ms');
        
        const runWatchdogs = (name: string) => {
          (window as any).__lastCheckpointStage = name;
          (window as any).__watchdogRunning = true;
          if (typeof (window as any).__runRootWatchdogCheck === 'function') {
            (window as any).__runRootWatchdogCheck(name);
          }
          const currentMode = useChordStore.getState().settings.appMode || 'hub';
          const rootNode = document.querySelector('[data-livex-hub-root="true"]') || document.getElementById('hub-root');
          const isEarlyStage = name === 'T+50ms' || name === 'T+100ms' || name === 'T+250ms' || name === 'T+500ms';
          if (currentMode === 'hub' && !rootNode && !isEarlyStage) {
            (window as any).__runFailsafeRecovery?.(name);
          }
          (window as any).__watchdogRunning = false;
        };

        setTimeout(() => {
          runWatchdogs('T+50ms');
          captureTimelineCheckpoint(lastCaptureId, 'T+50ms');
        }, 50);
        
        setTimeout(() => {
          runWatchdogs('T+100ms');
          captureTimelineCheckpoint(lastCaptureId, 'T+100ms');
        }, 100);

        setTimeout(() => {
          runWatchdogs('T+250ms');
          captureTimelineCheckpoint(lastCaptureId, 'T+250ms');
        }, 250);

        setTimeout(() => {
          runWatchdogs('T+500ms');
          captureTimelineCheckpoint(lastCaptureId, 'T+500ms');
        }, 500);

        setTimeout(() => {
          (window as any).__lastCheckpointStage = 'T+1000ms';
          if (typeof (window as any).__runRootWatchdogCheck === 'function') {
            (window as any).__runRootWatchdogCheck('T+1000ms');
          }
          captureTimelineCheckpoint(lastCaptureId, 'T+1000ms');
        }, 1000);

        setTimeout(() => {
          (window as any).__lastCheckpointStage = 'T+2000ms';
          captureTimelineCheckpoint(lastCaptureId, 'T+2000ms');
        }, 2000);
        
      } catch (err) {
        console.error('Forensics: Failed to start multi-snapshot captures', err);
      }
    }

    recordNavigation({
      fromApp,
      toApp: 'hub',
      transitionStart: Date.now(),
      transitionLockState: true,
      activeAppAfterTransition: 'hub',
      fallbackRendered: false
    });

    // 1. Close active modals/sheets/overlays
    window.dispatchEvent(new CustomEvent('studio:close-all-sheets'));
    window.dispatchEvent(new CustomEvent('studio:close-all-modals'));
    document.querySelectorAll('.modal-backdrop, .overlay').forEach(el => {
      if (el.id !== 'update-fade-overlay') {
        el.remove();
      }
    });
    document.documentElement.classList.remove('has-modal-open');

    // 2. Set transition active lock
    useNavigationStore.getState().setTransition('replace', true);

    // Reset Hub's zoom/opacity animation state immediately so it starts fading in as the sub-app exits
    window.dispatchEvent(new CustomEvent('studio:reset-hub-zooming'));

    // 3. Clear selected/active app state, reset animation locks & return to Hub after transition
    updateSettings({ appMode: 'hub' });
    NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);
    
    // Reset nested views to defaults if rememberLastAppSection is disabled
    if (!preferences.rememberLastAppSection) {
      const storeState = useChordStore.getState();
      storeState.setLastSession({
        vocalexTab: 'coach',
        drumexTab: storeState.settings.defaultDrumTab ?? 'songs',
        stagexView: storeState.settings.defaultStageView ?? 'Editor',
      });
    }

    setTimeout(() => {
      useNavigationStore.getState().setTransition(null, false);
      recordNavigation({
        fromApp,
        toApp: 'hub',
        transitionComplete: Date.now(),
        transitionLockState: false,
        activeAppAfterTransition: 'hub',
        fallbackRendered: false
      });
    }, 300 * speedScale);
  }, [updateSettings, preferences.rememberLastAppSection]);

  const returnToStudioHubRef = useRef(returnToStudioHub);
  useEffect(() => {
    returnToStudioHubRef.current = returnToStudioHub;
  }, [returnToStudioHub]);

  // Edge-swipe interactive back gesture tracking
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let edge = 0; // 1 for left edge swipe, -1 for right edge
    let hasOverlay = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      const isLeftEdge = x <= 24;
      const isRightEdge = x >= window.innerWidth - 24;

      if (!isLeftEdge && !isRightEdge) return;

      const overlayEl = document.querySelector('.sheet-overlay, .modal-overlay, [role="dialog"], .settings-panel-sheet, .profile-panel-sheet, #exit-toast');
      const overlayOpen = !!overlayEl;
      const isSubApp = useChordStore.getState().settings.appMode !== 'hub';

      if (!overlayOpen && !isSubApp) return;

      startX = x;
      startY = y;
      isTracking = true;
      edge = isLeftEdge ? 1 : -1;
      hasOverlay = overlayOpen;

      document.documentElement.style.setProperty('--back-progress', '0');
      document.documentElement.style.setProperty('--back-edge', String(edge));
      document.documentElement.classList.add('predictive-back-active');
      if (hasOverlay) {
        document.documentElement.classList.add('predictive-back-has-overlay');
      } else {
        document.documentElement.classList.remove('predictive-back-has-overlay');
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;
      const touch = e.touches[0];
      const deltaX = (touch.clientX - startX) * edge;
      const deltaY = Math.abs(touch.clientY - startY);

      if (deltaY > Math.abs(touch.clientX - startX) * 0.8 && deltaX < 30) {
        isTracking = false;
        document.documentElement.classList.remove('predictive-back-active');
        document.documentElement.classList.remove('predictive-back-has-overlay');
        return;
      }

      if (deltaX < 0) {
        document.documentElement.style.setProperty('--back-progress', '0');
        return;
      }

      const threshold = 180;
      const progress = Math.min(1, Math.max(0, deltaX / threshold));
      document.documentElement.style.setProperty('--back-progress', String(progress));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;

      const progressStr = document.documentElement.style.getPropertyValue('--back-progress');
      const progress = parseFloat(progressStr || '0');

      document.documentElement.classList.remove('predictive-back-active');
      document.documentElement.classList.remove('predictive-back-has-overlay');

      if (progress >= 0.45) {
        const handled = BackDispatcher.handleBackEvent();
        if (!handled) {
          const isSubApp = useChordStore.getState().settings.appMode !== 'hub';
          if (isSubApp) {
            returnToStudioHubRef.current(true);
          }
        }
      }

      setTimeout(() => {
        if (!document.documentElement.classList.contains('predictive-back-active')) {
          document.documentElement.style.removeProperty('--back-progress');
          document.documentElement.style.removeProperty('--back-edge');
        }
      }, 310);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Export to window object so external sub-apps can call it directly
  useEffect(() => {
    (window as any).returnToStudioHub = returnToStudioHub;
    return () => {
      delete (window as any).returnToStudioHub;
    };
  }, [returnToStudioHub]);

  // Backward compatibility listener for studio-hub-return CustomEvent
  useEffect(() => {
    const handler = () => {
      returnToStudioHubRef.current();
    };
    window.addEventListener('studio-hub-return', handler);
    return () => window.removeEventListener('studio-hub-return', handler);
  }, []);

  // System back button & predictive gesture handler
  useEffect(() => {
    // Seed history entries so we can capture popstate events
    window.history.replaceState({ chordex: 'root' }, '');
    window.history.pushState({ chordex: 'app' }, '');

    const onBack = () => {
      const now = Date.now();
      try {
        (window as any).__lastBackEventTime = now;
        (window as any).__lastBackEventDetails = {
          timestamp: now,
          activeApp: useChordStore.getState().settings.appMode,
          activePanel: useNavigationStore.getState().history[useNavigationStore.getState().history.length - 1]?.page || 'library',
          selectedChordId: useChordStore.getState().selectedChordId,
        };
      } catch (_) {}

      const handled = BackDispatcher.handleBackEvent();
      addLog('info', 'nav', `Android back button / swipe gesture triggered. BackDispatcher.handleBackEvent returned: ${handled}`);

      if (!handled) {
        // Double press to exit when already on the Studio Hub / root reached
        const now = Date.now();
        if (now - lastBackTime.current < 2000) {
          import('@capacitor/app')
            .then(({ App: CapApp }) => CapApp.exitApp())
            .catch(() => {});
        } else {
          lastBackTime.current = now;
          setExitToast(true);
          if (exitToastTimer.current) clearTimeout(exitToastTimer.current);
          exitToastTimer.current = setTimeout(() => setExitToast(false), 2000);
        }
      }

      window.history.pushState({ chordex: 'app' }, '');
    };

    const handlePop = () => {
      if (Capacitor.isNativePlatform()) {
        return;
      }
      onBack();
    };
    window.addEventListener('popstate', handlePop);

    let capRemove: (() => void) | null = null;
    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('backButton', onBack).then((handle) => {
          capRemove = () => handle.remove();
        });
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', handlePop);
      capRemove?.();
      if (exitToastTimer.current) clearTimeout(exitToastTimer.current);
    };
  }, []);

  // Root-level safety fallback: recover to Studio Hub on invalid appMode
  useEffect(() => {
    const validModes = ['hub', 'chords', 'drums', 'stage', 'groovex', 'vocalex'];
    if (!settings.appMode || !validModes.includes(settings.appMode)) {
      console.warn('[Safety] Invalid appMode detected:', settings.appMode, 'Falling back to hub.');
      updateSettings({ appMode: 'hub' });
    }
  }, [settings.appMode, updateSettings]);

  const [route, setRoute] = useState('/app');

  const navigateTo = (path: string) => {
    if (path === '/') return; // Never route to landing page on Android
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  useEffect(() => {
    // Force app mode classes on mount
    document.documentElement.classList.add('app-route');
    document.documentElement.classList.remove('landing-route');

    // Listen for the intro-done signal to coordinate preflight checks (monitored by regression tests)
    const handleIntroDone = () => {
      console.log('[App] Received studio-intro-done event.');
    };
    window.addEventListener('studio-intro-done', handleIntroDone);
    return () => {
      window.removeEventListener('studio-intro-done', handleIntroDone);
    };
  }, []);

  const [startupComplete, setStartupComplete] = useState(false);

  useEffect(() => {
    const unsub = StartupCoordinator.subscribe((phases) => {
      if (phases['5'].status === 'completed') {
        setStartupComplete(true);
        setShowHubEnabled(true);
      }
    });

    void StartupCoordinator.run(() => {
      setShowHubEnabled(true);
    });

    return () => {
      unsub();
      StartupCoordinator.cancel('app_unmounted');
    };
  }, []);

  const isSubAppActive = appMode !== 'hub';

  const lastActiveAppRef = useRef<AppKey>('chords');
  if (isSubAppActive) {
    lastActiveAppRef.current = appMode as AppKey;
  }
  const stableKey = lastActiveAppRef.current;

  const stableKeyRef = useRef(stableKey);
  stableKeyRef.current = stableKey;

  const prevAppModeRef = useRef(appMode);
  const previousAppModeRef = useRef<string>('none');

  // Track Chordex unmount request & previous app mode changes
  useEffect(() => {
    if (prevAppModeRef.current === 'chords' && appMode === 'hub') {
      if ((window as any).__chordexDiagnostics) {
        (window as any).__chordexDiagnostics.unmountRequestedTime = Date.now();
        (window as any).__chordexDiagnostics.status = 'unmount-requested';
      }
    }
    if (appMode !== prevAppModeRef.current) {
      const from = prevAppModeRef.current;
      const to = appMode;
      previousAppModeRef.current = from;
      prevAppModeRef.current = to;

      (window as any).__navigationTraceHistory = (window as any).__navigationTraceHistory || [];
      (window as any).__navigationTraceHistory.push({
        fromApp: from,
        toApp: to,
        timestamp: Date.now(),
        transitionDuration: (window as any).studioTransitionActive ? 340 : 0,
        lockState: (window as any).studioTransitionActive || false,
        recoveredViaFailsafe: false
      });
      if ((window as any).__navigationTraceHistory.length > 50) {
        (window as any).__navigationTraceHistory.shift();
      }
    }
  }, [appMode]);



  // Define window.__captureBlackScreenState
  useEffect(() => {
    (window as any).__captureBlackScreenState = () => {
      const currentAppMode = useChordStore.getState().settings.appMode || 'hub';
      const prevMode = previousAppModeRef.current;
      const subActive = currentAppMode !== 'hub';
      
      const hubLayout = document.querySelector('.app-main-layout');
      const hubMounted = !!hubLayout;
      let hubVisible = false;
      let hubOpacity = 'unknown';
      let hubTransform = 'unknown';
      if (hubLayout) {
        const style = window.getComputedStyle(hubLayout);
        hubVisible = style.display !== 'none' && style.visibility !== 'hidden';
        hubOpacity = style.opacity;
        hubTransform = style.transform;
      }
      
      const subappWrapper = document.querySelector('.sc-subapp-wrapper');
      const subappWrapperMounted = !!subappWrapper;
      let subappWrapperOpacity = 'unknown';
      let subappWrapperZIndex = 'unknown';
      let subappWrapperPointerEvents = 'unknown';
      if (subappWrapper) {
        const style = window.getComputedStyle(subappWrapper);
        subappWrapperOpacity = style.opacity;
        subappWrapperZIndex = style.zIndex;
        subappWrapperPointerEvents = style.pointerEvents;
      }

      // Capture sub-app container mounted status
      const subappContainer = document.querySelector('.app-sub-app-container');
      const subappContainerMounted = !!subappContainer;
      let subappContainerZIndex = 'unknown';
      let subappContainerPointerEvents = 'unknown';
      if (subappContainer) {
        const style = window.getComputedStyle(subappContainer);
        subappContainerZIndex = style.zIndex;
        subappContainerPointerEvents = style.pointerEvents;
      }

      // Capture Stagex iframe state details
      const iframeEl = document.querySelector('iframe[title="Stagex Canvas"]');
      const iframeMounted = !!iframeEl;
      let iframeVisible = false;
      let iframeOpacity = 'unknown';
      let iframeZIndex = 'unknown';
      let iframePointerEvents = 'unknown';
      let iframeTransform = 'unknown';
      let iframeSrc = '';
      if (iframeEl) {
        const style = window.getComputedStyle(iframeEl);
        iframeVisible = style.display !== 'none' && style.visibility !== 'hidden';
        iframeOpacity = style.opacity;
        iframeZIndex = style.zIndex;
        iframePointerEvents = style.pointerEvents;
        iframeTransform = style.transform;
        iframeSrc = (iframeEl as HTMLIFrameElement).src || '';
      }
      
      const overlays = Array.from(document.querySelectorAll('.modal, .dialog, .sheet, .overlay, .backdrop, [class*="overlay"], [class*="backdrop"], [class*="modal"]'))
        .map(el => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id,
            className: el.className,
            opacity: style.opacity,
            zIndex: style.zIndex,
            pointerEvents: style.pointerEvents,
            display: style.display
          };
        })
        .filter(o => o.display !== 'none' && o.opacity !== '0');

      const suspenseFallback = !!document.querySelector('.smart-loading, .fallback-skeleton, .studio-accent-loader, .studio-shimmer, [class*="skeleton"]');
      const motionExitActive = subappWrapper ? subappWrapper.getAttribute('data-projection-id') !== null : false;
      
      const w = window.innerWidth;
      const h = window.innerHeight;
      const points = {
        center: [w / 2, h / 2],
        topCenter: [w / 2, h * 0.1],
        bottomCenter: [w / 2, h * 0.9],
        leftCenter: [w * 0.1, h / 2],
        rightCenter: [w * 0.9, h / 2]
      };
      
      const topmostElements: any = {};
      for (const [key, coords] of Object.entries(points)) {
        try {
          const el = document.elementFromPoint(coords[0], coords[1]);
          if (el) {
            topmostElements[key] = {
              tag: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className,
              pointerEvents: window.getComputedStyle(el).pointerEvents,
              isHub: !!el.closest?.('[data-livex-hub-root="true"]') || !!el.closest?.('.app-main-layout')
            };
          } else {
            topmostElements[key] = null;
          }
        } catch {
          topmostElements[key] = 'error';
        }
      }

      const chordexDiagnostics = (window as any).__chordexDiagnostics || { status: 'none' };
      const chordexOverlayPresent = !!document.querySelector('[class*="chordex-overlay"], [class*="ch-overlay"]');
      const chordexRootPresent = !!document.querySelector('.app-sub-app-container');
      const activeElement = document.activeElement ? {
        tag: document.activeElement.tagName.toLowerCase(),
        id: document.activeElement.id,
        className: document.activeElement.className
      } : null;

      // Extract last navigation entry
      let lastNavigationAction: any = null;
      try {
        const navEntries = getNavigationEntries() || [];
        if (navEntries.length > 0) {
          const last = navEntries[navEntries.length - 1];
          lastNavigationAction = {
            fromApp: last.fromApp,
            toApp: last.toApp,
            timestamp: last.timestamp,
            transitionStart: last.transitionStart,
            transitionComplete: last.transitionComplete,
            transitionLockState: last.transitionLockState,
            fallbackRendered: last.fallbackRendered
          };
        }
      } catch (_) {}

      const hubShellFound = !!document.querySelector('.app-container.app-mode-hub .app-main-layout');
      const hubRootFound = !!document.querySelector('[data-livex-hub-root="true"]');
      const hubContentFound = !!document.querySelector('[data-livex-hub-content="true"]') || !!document.querySelector('.gb-wrap');
      const hubNavFound = !!document.querySelector('nav.glass-nav');
      const hubActuallyPainted = hubRootFound || hubContentFound || hubNavFound;

      const classifyBlackScreenLocal = () => {
        if (document.getElementById('fake-black-screen-layer')) {
          return 'SIMULATED_BLACK_LAYER_ACTIVE';
        }
        if (currentAppMode !== 'hub') {
          return 'UNKNOWN_BLACK_SCREEN';
        }
        if (!hubActuallyPainted && !hubShellFound) {
          return 'HUB_ROOT_MISSING';
        }
        if (hubActuallyPainted && !hubRootFound) {
          return 'DIAGNOSTIC_SELECTOR_FALSE_POSITIVE';
        }
        
        const hubLayout = document.querySelector('.app-main-layout');
        if (hubLayout) {
          const style = window.getComputedStyle(hubLayout);
          const isHidden = style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0;
          if (isHidden) {
            return 'HUB_CONTENT_PRESENT_BUT_NOT_VISIBLE';
          }
        }

        const centerEl = topmostElements.center;
        if (centerEl) {
          const tag = centerEl.tag;
          const id = centerEl.id;
          const cls = centerEl.className || '';
          const isHubElement = centerEl.isHub || id === 'hub-root' || cls.includes('hub') || cls.includes('app-main-layout') || tag === 'body' || tag === 'html';
          if (isHubElement) {
            return 'HUB_VISIBLE_BUT_BLACK_PAINT';
          } else if (cls.includes('subapp') || cls.includes('overlay') || cls.includes('backdrop') || cls.includes('modal') || cls.includes('chordex')) {
            return 'HUB_CONTENT_PRESENT_BUT_NOT_VISIBLE';
          }
        }

        if (hubActuallyPainted && hubRootFound && centerEl && (centerEl.tag === 'body' || centerEl.tag === 'html')) {
          return 'NATIVE_WEBVIEW_BLACK_LAYER';
        }

        return 'UNKNOWN_BLACK_SCREEN';
      };

      const blackScreenClassification = classifyBlackScreenLocal();

      return {
        timestamp: Date.now(),
        appMode: currentAppMode,
        activeSubApp: currentAppMode !== 'hub' ? currentAppMode : 'none',
        prevAppMode: prevMode,
        stableKey: stableKeyRef.current,
        stableKeyExplanation: "stableKey preserves the last active sub-app key so that AnimatePresence can render the exit transition correctly",
        isSubAppActive: subActive,
        transitionActive: (window as any).studioTransitionActive || false,
        hubShellFound,
        hubRootFound,
        hubContentFound,
        hubNavFound,
        hubActuallyPainted,
        blackScreenClassification,
        hub: {
          mounted: hubMounted,
          visible: hubVisible,
          opacity: hubOpacity,
          transform: hubTransform
        },
        subappWrapper: {
          mounted: subappWrapperMounted,
          opacity: subappWrapperOpacity,
          zIndex: subappWrapperZIndex,
          pointerEvents: subappWrapperPointerEvents,
          motionExitActive
        },
        mountedComponents: {
          hubRoot: hubRootFound,
          mainLayout: !!document.querySelector('.app-main-layout'),
          subappWrapper: subappWrapperMounted,
          subappContainer: subappContainerMounted,
          subappContainerZIndex,
          subappContainerPointerEvents
        },
        stagexIframe: {
          mounted: iframeMounted,
          visible: iframeVisible,
          opacity: iframeOpacity,
          zIndex: iframeZIndex,
          pointerEvents: iframePointerEvents,
          transform: iframeTransform,
          src: iframeSrc
        },
        overlays,
        suspenseFallback,
        topmostElements,
        chordex: {
          diagnostics: chordexDiagnostics,
          overlayPresent: chordexOverlayPresent,
          rootPresent: chordexRootPresent,
          focusElement: activeElement
        },
        lastNavigationAction
      };
    };

    return () => {
      delete (window as any).__captureBlackScreenState;
    };
  }, []);

  // Load navigation diagnostics from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('studio_black_screen_diagnostics');
      if (stored) {
        (window as any).__navigationDiagnostics = JSON.parse(stored);
      }
    } catch (_) {}
  }, []);

  // 500ms return-to-hub black screen watchdog detector with grace checking and consecutive validation passes
  useEffect(() => {
    if (appMode !== 'hub' || !isDebugModeEnabled) {
      return () => {};
    }

    (window as any).__navigationDiagnostics = (window as any).__navigationDiagnostics || {
      returnAttempts: 0,
      failedReturns: 0,
      blackScreenDetections: 0,
      lastBlocker: 'none',
      history: []
    };
    const diag = (window as any).__navigationDiagnostics;
    diag.returnAttempts++;
    try {
      localStorage.setItem('studio_black_screen_diagnostics', JSON.stringify(diag));
    } catch (_) {}

    let consecutiveFailures = 0;
    const maxRetries = 3;
    const checkInterval = 500;
    let timer: any = null;

    const runWatchdogVerdict = (finalBlocked: boolean, finalReason: string, paintData?: any) => {
      if (finalBlocked) {
        diag.failedReturns++;
        diag.blackScreenDetections++;
        diag.lastBlocker = finalReason;
        
        const systemDiagnostics = {
          activeElement: document.activeElement ? `${document.activeElement.tagName.toLowerCase()}${document.activeElement.id ? '#' + document.activeElement.id : ''}${document.activeElement.className ? '.' + document.activeElement.className.split(' ').join('.') : ''}` : 'none',
          rootChildrenCount: document.getElementById('root')?.children?.length || 0,
          currentAppMode: useChordStore.getState().settings.appMode || 'none',
          transitionActive: (window as any).studioTransitionActive || false,
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : 'N/A',
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        const enrichedPayload = paintData
          ? { ...statePayload, paintVerification: paintData, systemDiagnostics }
          : { ...statePayload, systemDiagnostics };
          
        diag.lastPayload = enrichedPayload;
        
        console.error('BLACK_SCREEN_DETECTED', finalReason, enrichedPayload);
        
        diag.history.push({
          time: Date.now(),
          reason: finalReason,
          payload: enrichedPayload
        });

        try {
          localStorage.setItem('studio_black_screen_diagnostics', JSON.stringify(diag));
        } catch (_) {}

        // Failsafe: auto open the emergency debug overlay
        if (typeof (window as any).__openEmergencyOverlay === 'function') {
          (window as any).__openEmergencyOverlay();
        }

        if (finalReason === 'HUB_ROOT_MISSING') {
          console.warn('[Failsafe] HUB_ROOT_MISSING detected! Running deterministic Hub remount.');
          const actualFrom = previousAppModeRef.current || 'none';
          flushSync(() => {
            setHubRenderKey(k => k + 1);
            useNavigationStore.getState().setTransition(null, false);
            lastActiveAppRef.current = 'chords';
            useChordStore.getState().updateSettings({ appMode: 'hub' });
          });
          (window as any).__navigationTraceHistory = (window as any).__navigationTraceHistory || [];
          (window as any).__navigationTraceHistory.push({
            fromApp: actualFrom,
            toApp: 'hub',
            timestamp: Date.now(),
            transitionDuration: 0,
            lockState: false,
            recoveredViaFailsafe: true
          });
          recordNavigation({
            fromApp: actualFrom,
            toApp: 'hub',
            hubMounted: true,
            activeAppAfterTransition: 'hub',
            transitionLockState: false,
            fallbackRendered: false,
            recoveredViaFailsafe: true
          } as any);
        }
      }

      // Resolve the forensic capture matching the current return attempt
      const lastCapId = (window as any).__lastForensicCaptureId;
      try {
        localStorage.setItem('studio_navigation_in_progress', 'false');
      } catch (_) {}

      if (lastCapId) {
        try {
          const currentTimelineStr = localStorage.getItem('studio_current_navigation_timeline');
          let timeline = currentTimelineStr ? JSON.parse(currentTimelineStr) : null;
          if (timeline && timeline.id === lastCapId) {
            timeline.result = finalBlocked ? 'failed' : 'success';
            timeline.reason = finalBlocked ? finalReason : '';
            if (paintData) {
              timeline.watchdogPaintVerification = paintData;
            }
            localStorage.setItem('studio_current_navigation_timeline', JSON.stringify(timeline));
            
            if (finalBlocked) {
              localStorage.setItem('studio_last_failed_navigation_timeline', JSON.stringify(timeline));
              localStorage.setItem('studio_failed_navigation_unviewed', 'true');
            }
          }

          const listStr = localStorage.getItem('studio_forensic_captures') || '[]';
          const list = JSON.parse(listStr);
          const index = list.findIndex((c: any) => c.id === lastCapId);
          if (index !== -1) {
            list[index].result = finalBlocked ? 'failed' : 'success';
            list[index].reason = finalBlocked ? finalReason : '';
            if (paintData) {
              list[index].watchdogPaintVerification = paintData;
            }
            localStorage.setItem('studio_forensic_captures', JSON.stringify(list));
            
            // Also store individual last successful or failed capture
            if (finalBlocked) {
              localStorage.setItem('studio_forensic_last_failed', JSON.stringify(list[index]));
            } else {
              localStorage.setItem('studio_forensic_last_successful', JSON.stringify(list[index]));
            }
          }
        } catch (e) {
          console.error('Forensics: Error updating capture result', e);
        }
      }
    };

    let statePayload: any = null;

    const runCheckPass = () => {
      statePayload = (window as any).__captureBlackScreenState?.();
      if (!statePayload) {
        runWatchdogVerdict(false, 'Capture state not ready');
        return;
      }
      
      const hubVisible = statePayload.hub.visible;
      const hubOpacity = parseFloat(statePayload.hub.opacity);
      const topmostCenter = statePayload.topmostElements.center;

      let isBlocked = false;
      let reason = '';

      // Part E: Check timeline checkpoints for failure
      let checkpointFailed = false;
      let checkpointReason = '';
      try {
        const timelineStr = localStorage.getItem('studio_current_navigation_timeline');
        if (timelineStr) {
          const timeline = JSON.parse(timelineStr);
          const snaps = timeline.snapshots || {};
          const checkKeys = ['T+50ms', 'T+250ms', 'T+1000ms'];
          for (const key of checkKeys) {
            const snap = snaps[key];
            if (snap) {
              const appModeIsHub = snap.appMode === 'hub';
              const hubMounted = snap.hubDomState?.mounted;
              const isBlack = snap.paintVerification?.paintState === 'visually_black';
              
              if (appModeIsHub && !hubMounted) {
                checkpointFailed = true;
                checkpointReason = `Checkpoint ${key} Hub DOM not mounted`;
                break;
              }
              if (appModeIsHub && isBlack) {
                checkpointFailed = true;
                checkpointReason = `Checkpoint ${key} paint state is black`;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Watchdog failed checking checkpoints:', e);
      }

      if (checkpointFailed) {
        isBlocked = true;
        reason = checkpointReason;
      }

      if (!statePayload.hubActuallyPainted) {
        isBlocked = true;
        reason = 'HUB_ROOT_MISSING';
      } else if (!statePayload.hub.mounted) {
        isBlocked = true;
        reason = 'Hub not mounted';
      } else if (!hubVisible) {
        isBlocked = true;
        reason = 'Hub display/visibility hidden';
      } else if (!isNaN(hubOpacity) && hubOpacity === 0) {
        isBlocked = true;
        reason = 'Hub opacity is 0';
      } else if (topmostCenter) {
        const tag = topmostCenter.tag;
        const id = topmostCenter.id;
        const cls = topmostCenter.className || '';
        
        const isHubElement = topmostCenter.isHub || id === 'hub-root' || cls.includes('hub') || cls.includes('app-main-layout') || 
                             cls.includes('studio-hub') || tag === 'body' || tag === 'html';
                             
        if (!isHubElement && (cls.includes('subapp') || cls.includes('overlay') || cls.includes('backdrop') || cls.includes('modal') || cls.includes('chordex'))) {
          isBlocked = true;
          reason = `Topmost blocking element at center: ${tag}${id ? '#' + id : ''}${cls ? '.' + cls.split(' ').join('.') : ''}`;
        }
      }

      // Check grace conditions:
      const transitionActive = (window as any).studioTransitionActive || (window as any).__navigationInProgress === true || statePayload.transitionActive;
      const hasLoading = !!document.querySelector('.smart-loading, .fallback-skeleton, .studio-accent-loading, .app-loading-screen, #loading-screen');
      const hasOverlay = !!document.querySelector('.modal, .overlay, .backdrop, .dialog, .chordex-overlay, [role="dialog"]');
      const hasSuspense = !!document.querySelector('.tolgee-loading, [data-testid="suspense-fallback"]');
      
      const gracePeriodActive = transitionActive || hasLoading || hasOverlay || hasSuspense;

      if (gracePeriodActive) {
        console.log(`[Watchdog] Black screen check bypassed. Reason: Grace conditions active (Transition: ${transitionActive}, Loading: ${hasLoading}, Overlay: ${hasOverlay}, Suspense: ${hasSuspense})`);
        consecutiveFailures = 0;
        timer = setTimeout(runCheckPass, checkInterval);
        return;
      }

      const evaluateVerdict = (finalBlocked: boolean, finalReason: string, paintData?: any) => {
        if (finalBlocked) {
          consecutiveFailures++;
          console.warn(`[Watchdog] Compositor freeze pass #${consecutiveFailures} detected. Reason: ${finalReason}`);
          if (consecutiveFailures >= maxRetries) {
            console.error(`[Watchdog] Compositor freeze confirmed after ${maxRetries} consecutive failures.`);
            runWatchdogVerdict(true, finalReason, paintData);
          } else {
            timer = setTimeout(runCheckPass, checkInterval);
          }
        } else {
          consecutiveFailures = 0;
          runWatchdogVerdict(false, '', paintData);
        }
      };

      if (!isBlocked) {
        runPaintVerification().then(paintData => {
          const isVisuallyBlack = paintData.paintState === 'visually_black';
          const domExists = paintData.domExists;
          const visuallyBlackAndDomExists = isVisuallyBlack && domExists;
          
          if (visuallyBlackAndDomExists) {
            evaluateVerdict(true, 'COMPOSITOR_FREEZE', paintData);
          } else {
            evaluateVerdict(false, '', paintData);
          }
        }).catch(err => {
          console.error('Watchdog paint verification failed:', err);
          evaluateVerdict(false, '');
        });
      } else {
        evaluateVerdict(isBlocked, reason);
      }
    };

    timer = setTimeout(runCheckPass, 1200);

    return () => clearTimeout(timer);
  }, [appMode]);

  // Keep window globals updated for lifecycle logging
  if (typeof window !== 'undefined') {
    (window as any).__lastActiveSubApp = isSubAppActive ? stableKey : 'none';
    (window as any).__lastStableKey = stableKey;
    (window as any).__lastActiveAppToRender = stableKey;
    (window as any).__lastCachedAppRef = lastActiveAppRef.current;
    (window as any).__lastHubRenderKey = hubRenderKey;
    (window as any).__lastPreviousAppMode = previousAppModeRef.current;
  }

  return (
    <div
      className={`app-container app-mode-${appMode}`}
      style={{
        display: 'flex',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--app-bg)',
        opacity: 1,
        pointerEvents: 'auto'
      }}
    >
      <LifecycleTracker name="App" />
      <LifecycleTracker name="app-container" />
      

      
      <ErrorBoundary moduleName="RootApp">
        <Suspense fallback={null}>
          <TolgeeProvider tolgee={tolgee} fallback={null}>
            <div
              className="app-main-layout"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                height: '100dvh',
                overflow: 'hidden',
                pointerEvents: isSubAppActive ? 'none' : 'auto',
                opacity: isSubAppActive && !transitionActive ? 0 : 1,
                visibility: isSubAppActive && !transitionActive ? 'hidden' : 'visible',
                transition: 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), visibility 350ms',
              }}
            >
              <LifecycleTracker name="app-main-layout" />
              {showHub && showHubEnabled && (
                <>
                  <LifecycleTracker name="StudioHub" />
                  <Suspense fallback={<StudioHubSkeleton />}>
                    <StudioHub key={hubRenderKey} />
                  </Suspense>
                </>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isSubAppActive && showHubEnabled && (
                <motion.div
                  key={stableKey}
                  className="sc-subapp-wrapper"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ 
                    opacity: splashVisible ? 0 : 1, 
                    scale: splashVisible ? 0.98 : 1 
                  }}
                  exit={{ opacity: 0, scale: 0.98, pointerEvents: 'none' as any }}
                  transition={{
                    duration: 0.3 * speedScale,
                    ease: MOTION_EASINGS.standard
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    background: 'var(--app-bg)',
                    pointerEvents: isSubAppActive && !splashVisible ? 'auto' : 'none',
                  }}
                >
                  <LifecycleTracker name="SubAppWrapper" />
                  <SubAppWrapper
                    app={stableKey}
                    activePanel={activePanel}
                    settings={settings}
                    onReady={handleAppPreloaded}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {splashVisible && launchingApp && (
                <motion.div
                  key="launch-splash"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    backgroundColor: 'var(--c-background)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--c-text-primary)',
                    pointerEvents: 'auto',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.02, opacity: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getAppColor(launchingApp),
                      }}
                    >
                      {renderAppLogo(launchingApp, 80)}
                    </div>
                    <h1
                      style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        margin: 0,
                        background: `linear-gradient(135deg, var(--c-text-primary) 0%, ${getAppColor(launchingApp)} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {getAppName(launchingApp)}
                    </h1>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </TolgeeProvider>
        </Suspense>
      </ErrorBoundary>

      {exitToast && renderExitToast()}

      {showLaunchOverlay && (
        <LaunchAnimationEngine
          preset={initialPresetRef.current}
          skipIntro={false}
          onComplete={() => setShowLaunchOverlay(false)}
          isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
          isAmoled={settings.perApp?.hub?.amoledMode}
        />
      )}
    </div>
  );

  function renderExitToast() {
    return createPortal(
      <div
        id="exit-toast"
        style={{
          position: 'fixed',
          bottom: 'max(28px, calc(env(safe-area-inset-bottom) + 88px))',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--c-surface-glass-bg)',
          color: 'var(--c-text-primary)',
          padding: '10px 22px',
          borderRadius: '24px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          zIndex: 99999,
          pointerEvents: 'none',
          backdropFilter: 'var(--c-surface-glass-blur)',
          border: '1px solid var(--c-border)',
          boxShadow: 'var(--elevation-high)',
          whiteSpace: 'nowrap',
        }}
      >
        Press back or swipe again to exit
      </div>,
        document.body
    );
  }
}

const AppReadyNotifier = memo(function AppReadyNotifier({
  app,
  onReady
}: {
  app: AppKey;
  onReady: (app: AppKey) => void;
}) {
  useEffect(() => {
    let active = true;
    
    // Double requestAnimationFrame guarantees React completed rendering and browser finished initial paint
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (active) {
          onReady(app);
        }
      });
    });

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [app, onReady]);

  return null;
});

interface SubAppWrapperProps {
  app: AppKey;
  activePanel: string;
  settings: any;
  onReady: (app: AppKey) => void;
}

function FallbackTracker({ app, children }: { app: AppKey; children: React.ReactNode }) {
  useEffect(() => {
    recordNavigation({
      fromApp: 'hub',
      toApp: app,
      activeAppAfterTransition: app,
      transitionLockState: (window as any).studioTransitionActive || false,
      fallbackRendered: true
    });
  }, [app]);
  return <>{children}</>;
}

const SubAppWrapper = memo(function SubAppWrapper({ app, activePanel, settings, onReady }: SubAppWrapperProps) {
  const [cachedApp] = useState<AppKey>(app);

  // Cache the active panel for the chords sub-app so it doesn't flash/change during exit transitions
  const [cachedPanel, setCachedPanel] = useState(activePanel);
  const isActive = settings.appMode === cachedApp;

  const [visiblePanel, setVisiblePanel] = useState(activePanel);
  const [exitingPanel, setExitingPanel] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');

  useEffect(() => {
    if (isActive && activePanel !== visiblePanel) {
      const oldIdx = ALL_PANELS.indexOf(visiblePanel as any);
      const newIdx = ALL_PANELS.indexOf(activePanel as any);
      setSlideDir(newIdx >= oldIdx ? 'right' : 'left');
      setExitingPanel(visiblePanel);
      setVisiblePanel(activePanel);
      setCachedPanel(activePanel);
    }
  }, [activePanel, visiblePanel, isActive]);

  useEffect(() => {
    if (exitingPanel !== null) {
      const timer = setTimeout(() => {
        setExitingPanel(null);
      }, 320);
      return () => clearTimeout(timer);
    }
    return;
  }, [exitingPanel]);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[SubAppWrapper] [${timestamp}] Mount | app: ${cachedApp}, activePanel: ${activePanel}, isActive: ${isActive}`);
    return () => {
      console.log(`[SubAppWrapper] [${new Date().toISOString()}] Unmount | app: ${cachedApp}`);
    };
  }, [cachedApp]);

  useEffect(() => {
    if (cachedApp !== 'chords') {
      return () => {};
    }

    (window as any).__chordexDiagnostics = (window as any).__chordexDiagnostics || {
      mountedCount: 0,
      unmountedCount: 0,
      lastMountTime: null,
      lastUnmountTime: null,
      status: 'none'
    };
    const diag = (window as any).__chordexDiagnostics;
    diag.mountedCount++;
    diag.lastMountTime = Date.now();
    diag.status = 'mounted';
    
    return () => {
      diag.unmountedCount++;
      diag.lastUnmountTime = Date.now();
      diag.status = 'unmounted';
      diag.status = 'unmounted';
    };
  }, [cachedApp]);

  useEffect(() => {
    recordNavigation({
      fromApp: 'hub',
      toApp: app,
      hubMounted: true,
      activeAppAfterTransition: app,
      transitionLockState: (window as any).studioTransitionActive || false,
      fallbackRendered: false
    });
    return () => {
      // Clean up modals, backdrops, sheets, and overlays when unmounting any sub-app
      window.dispatchEvent(new CustomEvent('studio:close-all-sheets'));
      window.dispatchEvent(new CustomEvent('studio:close-all-modals'));
      document.querySelectorAll('.modal-backdrop, .overlay').forEach(el => {
        if (el.id !== 'update-fade-overlay') {
          el.remove();
        }
      });
      document.documentElement.classList.remove('has-modal-open');

      recordNavigation({
        fromApp: app,
        toApp: 'hub',
        subappUnmounted: true,
        activeAppAfterTransition: 'hub',
        transitionLockState: (window as any).studioTransitionActive || false,
        fallbackRendered: false
      });
    };
  }, [app]);

  return (
    <>
      {cachedApp === 'groovex' && (
        <SubAppScaffold appKey="groovex">
          <ErrorBoundary moduleName="Groovex">
            <Suspense fallback={<FallbackTracker app="groovex"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="groovex" onReady={onReady} />
              <AppEntryTransition><GroovexApp /></AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'vocalex' && (
        <SubAppScaffold appKey="vocalex">
          <ErrorBoundary moduleName="Vocalex">
            <Suspense fallback={<FallbackTracker app="vocalex"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="vocalex" onReady={onReady} />
              <AppEntryTransition><VocalexApp /></AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'stage' && (
        <SubAppScaffold appKey="stage">
          <ErrorBoundary moduleName="Stagex">
            <Suspense fallback={<FallbackTracker app="stage"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="stage" onReady={onReady} />
              <AppEntryTransition><StageCorePanel /></AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'drums' && (
        <SubAppScaffold appKey="drums">
          <ErrorBoundary moduleName="Drumex">
            <Suspense fallback={<FallbackTracker app="drums"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="drums" onReady={onReady} />
              <AppEntryTransition><DrumEditor /></AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'chords' && (
        <SubAppScaffold appKey="chords">
          <LifecycleTracker name="Chordex" />
          <ScreenScaffold safeAreaTop={true} safeAreaBottom={false} className="app-bg">
            {/* Note: safe-area-inset-top is handled by ScreenScaffold */}
            <AppEntryTransition
              className="flex flex-col w-full overflow-hidden select-none"
              style={{
                position: 'relative',
                height: '100%',
              } as React.CSSProperties}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flex: 1, 
                  width: '100%', 
                  height: '100%', 
                  overflow: 'hidden' 
                }}
              >
                <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
                  <ErrorBoundary moduleName="Chordex">
                    <Suspense fallback={<FallbackTracker app="chords"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
                      <AppReadyNotifier app="chords" onReady={onReady} />
                      <SharedNavigationContainer
                        activeView={cachedPanel}
                        viewOrder={ALL_PANELS}
                      >
                        {(panel) => (
                          <>
                            {panel === 'library'  && <LibraryPanel />}
                            {panel === 'chord'    && <ChordPanel />}
                            {panel === 'songs'    && <SongsPanel />}
                            {panel === 'settings' && <SettingsPanel />}
                          </>
                        )}
                      </SharedNavigationContainer>
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>

              {cachedApp === 'chords' && (
                <SharedNavigationBar
                  items={[
                    {
                      key: 'songs',
                      icon: 'music_note',
                      label: 'Songs',
                      isActive: cachedPanel === 'songs',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'songs' }),
                    },
                    {
                      key: 'library',
                      icon: 'library_music',
                      label: 'Library',
                      isActive: cachedPanel === 'library' || !cachedPanel,
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'library' }),
                    },
                    {
                      key: 'chord',
                      icon: 'grid_on',
                      label: 'Chords',
                      isActive: cachedPanel === 'chord',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'chord' }),
                    },
                    {
                      key: 'settings',
                      icon: 'tune',
                      label: 'Settings',
                      isActive: cachedPanel === 'settings',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'settings' }),
                    },
                  ]}
                  isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
                />
              )}
            </AppEntryTransition>
          </ScreenScaffold>
        </SubAppScaffold>
      )}
    </>
  );
});
