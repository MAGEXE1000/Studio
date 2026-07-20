import { setBackHandler, useBackHandler, useChordStore, ACCENT_COLORS, translations, useT, useLiquidGlassNav, useNavCollapsed, setNavCollapsed, useIsWebDesktop, registerDebugProvider, unregisterDebugProvider, setNavScrollOffset, getNavScrollOffset, useScrollHide, useBottomNavigationStore, useSettingsStore, DurationPresets, EasingPresets } from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { motion } from 'motion/react';

import {
  getSharedNavTransform,
  getSharedNavOpacity,
  SHARED_NAV_TRANSITION,
} from '../../../navigation/navStyles';
import AnimatedActionButton from '../../../components/animata/container/animated-border-trail';
import { AppModeMenuLogo } from '../../../components/icons/AppModeMenuLogo';
import WebAppSectionDock from '../../../components/feature/WebAppSectionDock';
import SmartLoading from '../../../components/loading/SmartLoading';
import { StagexPanelSkeleton } from '../../../components/loading/StudioSkeleton';
import { Toolbar, ActionButton } from '../../../components/design-system/StudioDesignSystem';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Button, Input } from '../../../components/design-system/StudioDesignSystem';
import { DialogScaffold } from '../../../components/layout/StudioLayoutSystem';
import {
  SharedNavigationBar,
  type SharedNavigationItem,
} from '../../../navigation/SharedNavigationBar';

import { STAGEX_LIBRARY, STAGEX_ICON_MAP, CATEGORY_ICONS, CATEGORY_LABELS, HIDE_IFRAME_UI, HIDE_IFRAME_UI_MOBILE, getSimplifiedView } from '../constants';
import { type StageWin, StageLibraryItem } from '../types';
import { injectAccentVars, injectTheme, injectAmoled, injectStartOnPicker } from '../services/StageBridgeService';
import { runInteractionTest } from '../services/StageTestRunner';
import { StageLibraryPanel } from '../components/StageLibraryPanel';
import { StageDiagnosticsOverlay } from '../components/StageDiagnosticsOverlay';

import { ExportPdfDialog } from '../components/dialogs/ExportPdfDialog';
import { StageToolbar } from '../components/StageToolbar';
export default function StagexPanel() {
  const isWebDesktop = useIsWebDesktop();
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  useEffect(() => {
    if (!isWebDesktop) return;
    const handleResize = () => {
      setIsLargeDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isWebDesktop]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReady = useRef(false);
  const settings = useChordStore(useShallow((state) => state.settings));
  const tr = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [customElements, setCustomElements] = useState<StageLibraryItem[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    mics: false,
    drums: false,
    inst: false,
    amps: false,
    mon: false,
    util: false,
    people: false,
    custom: false,
    presets: false,
  });

  const loadCustomElements = useCallback(() => {
    try {
      const raw = localStorage.getItem('scCustomElements');
      if (raw) {
        setCustomElements(JSON.parse(raw));
      } else {
        setCustomElements([]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadCustomElements();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'scCustomElements') {
        loadCustomElements();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadCustomElements]);

  // Removed redundant expandedCats.custom loader to optimize performance and prevent duplicate calls.

  const handleAddElement = useCallback((item: StageLibraryItem) => {
    try {
      const win = iframeRef.current?.contentWindow as StageWin | null;
      if (win && typeof win.addItemToStage === 'function') {
        win.addItemToStage(item);
      }
    } catch (err) {
      console.error('Failed to add element to stage', err);
    }
  }, []);

  // Restore the last Stagex sub-view (Editor / Setup / Preferences / Export)
  // from the persisted session. The iframe's internal view is switched to
  // match below in handleLoad, after the iframe finishes loading.
  const [curView, setCurView] = useState<string>(() => {
    const s = useChordStore.getState();
    const saved = s.settings.restoreLastSession ? s.lastSession?.stagexView : undefined;
    return saved || s.settings.defaultStageView || 'Editor';
  });

  const curViewRef = useRef(curView);
  curViewRef.current = curView;

  useEffect(() => {
    useSettingsStore.getState().setLastSession({ stagexView: curView });
  }, [curView]);

  const elementsScrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(elementsScrollRef);

  /* â”€â”€ Glassmorphism bottom nav state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const stageNavRef = useRef<HTMLDivElement | null>(null);
  useLiquidGlassNav(stageNavRef as React.RefObject<HTMLElement | null>);
  const stageBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevTabRef = useRef(0);
  const stageStretchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stagePill, setStagePill] = useState<{ left: number; right: number; ready: boolean }>({
    left: 0,
    right: 0,
    ready: false,
  });
  const [fabOpen, setFabOpen] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const navCollapsed = useNavCollapsed();
  const [expandedStageH, setExpandedStageH] = useState(52);
  const [expandedStageW, setExpandedStageW] = useState(380);
  const [landscapeNavHidden, setLandscapeNavHidden] = useState(false);
  const [propPanelOpen, setPropPanelOpen] = useState(false);
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  // Scenes feature (v3.0.63+) â€” picker for which stage plot(s) to include
  const [pdfSceneInfo, setPdfSceneInfo] = useState<{
    count: number;
    currentIdx: number;
    names: string[];
  }>({ count: 1, currentIdx: 0, names: ['Scene 1'] });
  const [pdfSceneChoice, setPdfSceneChoice] = useState<'current' | 'all' | number>('current');
  const [isStageExpanded, setIsStageExpanded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // â”€â”€ Diagnostics & Safe Mode state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showDiagnostics, setShowDiagnostics] = useState(() => {
    try {
      return localStorage.getItem('stagex_diagnostics_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [safeMode, setSafeMode] = useState(() => {
    try {
      return localStorage.getItem('stagex_safe_mode_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [diagTaps, setDiagTaps] = useState({
    bottomNav: 0,
    plus: 0,
    eye: 0,
    picker: 0,
    toolbar: 0,
    sentMsgs: 0,
    recvMsgs: 0,
  });

  const [lastDiagLog, setLastDiagLog] = useState<string>('System initialized.');

  const logDiagnostic = useCallback((msg: string) => {
    setLastDiagLog((prev) => {
      const lines = prev.split('\n');
      if (lines.length > 25) {
        return msg + '\n' + lines.slice(0, 25).join('\n');
      }
      return msg + '\n' + prev;
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowDiagnostics(!!detail);
    };
    window.addEventListener('stagex:diagnostics-toggle', handler);
    return () => window.removeEventListener('stagex:diagnostics-toggle', handler);
  }, []);

  // Safe Mode CSS injection
  useEffect(() => {
    const applySafeMode = (doc: Document, active: boolean) => {
      let el = doc.getElementById('stagex-safe-mode-css');
      if (active) {
        if (!el) {
          el = doc.createElement('style');
          el.id = 'stagex-safe-mode-css';
          el.textContent = `
            * {
              transition: none !important;
              animation: none !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .modal-backdrop, .overlay, #presets-backdrop, #sc-dial-backdrop {
              display: none !important;
              pointer-events: none !important;
            }
          `;
          doc.head.appendChild(el);
        }
      } else {
        if (el) el.remove();
      }
    };

    applySafeMode(document, safeMode);
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) applySafeMode(iframeDoc, safeMode);
    } catch {}
  }, [safeMode, iframeLoading]);

  // Capture touch event targets
  useEffect(() => {
    if (!showDiagnostics) return;

    const handleEvent = (name: string, isIframe: boolean) => (e: Event) => {
      const pe = e as PointerEvent;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const style = window.getComputedStyle(target);
      const bounds = target.getBoundingClientRect();
      const path: string[] = [];
      let curr: HTMLElement | null = target;
      while (curr) {
        let tag = curr.tagName.toLowerCase();
        if (curr.id) tag += '#' + curr.id;
        if (curr.className && typeof curr.className === 'string') {
          tag += '.' + curr.className.split(/\s+/).slice(0, 2).join('.');
        }
        path.push(tag);
        curr = curr.parentElement;
      }

      // Check if it's bottomNav, plus, or eye
      let controlName = 'none';
      if (target.closest('.glass-nav') || target.closest('.stage-nav-btn')) {
        controlName = 'bottomNav';
      } else if (target.closest('#stagex-plus-button') || target.id === 'stagex-plus-button') {
        controlName = 'plus';
      } else if (target.closest('#stagex-eye-button') || target.id === 'stagex-eye-button') {
        controlName = 'eye';
      } else if (
        isIframe &&
        (target.closest('#sc-dial-backdrop') ||
          target.closest('.sc-dial-chip') ||
          target.closest('#sc-item-sheet'))
      ) {
        controlName = 'picker';
      } else if (
        isIframe &&
        (target.closest('#sc-vtools') ||
          target.closest('#sc-vtools-body') ||
          target.closest('.el-resize-bar') ||
          target.closest('.el-resize-btn'))
      ) {
        controlName = 'toolbar';
      }

      // If click event, increment corresponding diagnostic counter
      if (e.type === 'click' && controlName !== 'none') {
        setDiagTaps((prev) => ({
          ...prev,
          [controlName]: prev[controlName as keyof typeof prev] + 1,
        }));
      }

      const hitElement = isIframe
        ? (iframeRef.current?.contentDocument?.elementFromPoint(
            pe.clientX || 0,
            pe.clientY || 0
          ) as HTMLElement | null)
        : (document.elementFromPoint(pe.clientX || 0, pe.clientY || 0) as HTMLElement | null);

      const logMsg = `[${isIframe ? 'IFRAME' : 'PARENT'} - ${e.type.toUpperCase()}]
Target: ${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}
Hit target (elementFromPoint): ${hitElement ? hitElement.tagName.toLowerCase() + (hitElement.id ? '#' + hitElement.id : '') : 'none'}
pointer-events: ${style.pointerEvents} | z-index: ${style.zIndex || 'auto'}
Bounds: L=${Math.round(bounds.left)} T=${Math.round(bounds.top)} W=${Math.round(bounds.width)} H=${Math.round(bounds.height)}
ComposedPath: ${path.slice(0, 3).join(' > ')}`;

      logDiagnostic(logMsg);
    };

    const attach = (doc: Document, isIframe: boolean) => {
      ['pointerdown', 'pointerup', 'click'].forEach((evt) => {
        doc.addEventListener(evt, handleEvent(evt, isIframe), true);
      });
    };

    const detach = (doc: Document, isIframe: boolean) => {
      ['pointerdown', 'pointerup', 'click'].forEach((evt) => {
        doc.removeEventListener(evt, handleEvent(evt, isIframe), true);
      });
    };

    attach(document, false);

    let iframeDoc: Document | null = null;
    try {
      iframeDoc = iframeRef.current?.contentDocument || null;
      if (iframeDoc) attach(iframeDoc, true);
    } catch {}

    return () => {
      detach(document, false);
      if (iframeDoc) {
        try {
          detach(iframeDoc, true);
        } catch {}
      }
    };
  }, [showDiagnostics, logDiagnostic]);

  // â”€â”€ Automated interaction test runner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [testActive, setTestActive] = useState(false);
  const [testCycle, setTestCycle] = useState(0);
  const [testStep, setTestStep] = useState('');

  const runTest = async () => {
    await runInteractionTest(
      testActive,
      setTestActive,
      setTestCycle,
      setTestStep,
      logDiagnostic,
      curViewRef.current,
      handleNavTap,
      stageBtnRefs,
      iframeRef,
      callIframe,
      toggleStageExpanded,
      fabOpen,
      liveMode
    );
  };

  const toggleStageExpanded = () => {
    const nextVal = !isStageExpanded;
    setRotationTransition(true);
    setIsStageExpanded(nextVal);

    (async () => {
      try {
        if (nextVal) {
          if (Capacitor.isNativePlatform()) {
            await ScreenOrientation.lock({ orientation: 'landscape' });
          } else if (
            window.screen &&
            window.screen.orientation &&
            (window.screen.orientation as any).lock
          ) {
            await (window.screen.orientation as any).lock('landscape');
          }
        } else {
          if (Capacitor.isNativePlatform()) {
            await ScreenOrientation.lock({ orientation: 'portrait' });
          } else if (
            window.screen &&
            window.screen.orientation &&
            (window.screen.orientation as any).lock
          ) {
            await (window.screen.orientation as any).lock('portrait');
          }
        }
      } catch (e) {
        console.warn('Screen orientation lock/unlock failed:', e);
      }
    })();

    setTimeout(() => setRotationTransition(false), 320);
  };

  useEffect(() => {
    return () => {
      try {
        if (Capacitor.isNativePlatform()) {
          ScreenOrientation.unlock().catch(() => {});
        } else if (
          window.screen &&
          window.screen.orientation &&
          (window.screen.orientation as any).unlock
        ) {
          (window.screen.orientation as any).unlock();
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    // Always show the share button when navigator.share exists. Android WebView
    // often returns false from canShare({files}) even when share() actually
    // works; the iframe-side export will attempt the share and fall back to
    // saving the PDF if the share is unsupported or fails.
    setCanShareFiles(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const openPdfSheet = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      const name = doc?.getElementById('exp-project-name')?.textContent?.trim() || 'Stagex_Export';
      setPdfFileName(name);
    } catch {
      setPdfFileName('Stagex_Export');
    }
    // Read scene info from iframe so the picker reflects the project state
    try {
      const win = iframeRef.current?.contentWindow as
        | (Window & {
            __getSceneInfo?: () => { count: number; currentIdx: number; names: string[] };
          })
        | null;
      const info = win?.__getSceneInfo?.();
      if (info && typeof info.count === 'number' && info.count > 0) {
        setPdfSceneInfo({
          count: info.count,
          currentIdx: info.currentIdx ?? 0,
          names: info.names || [],
        });
      } else {
        setPdfSceneInfo({ count: 1, currentIdx: 0, names: ['Scene 1'] });
      }
    } catch {
      setPdfSceneInfo({ count: 1, currentIdx: 0, names: ['Scene 1'] });
    }
    setPdfSceneChoice('current');
    setPdfBusy(false);
    setPdfSheetOpen(true);
  }, []);

  const runPdfExport = useCallback(
    async (action: 'save' | 'share') => {
      const win = iframeRef.current?.contentWindow as
        | (Window & {
            exportPDFWithOptions?: (o: {
              name: string;
              action: string;
              scene?: 'current' | 'all' | number;
            }) => Promise<void>;
          })
        | null;
      if (!win?.exportPDFWithOptions) return;
      setPdfBusy(true);
      try {
        await win.exportPDFWithOptions({
          name: pdfFileName.trim() || 'Stagex_Export',
          action,
          scene: pdfSceneChoice,
        });
      } finally {
        setPdfBusy(false);
        setPdfSheetOpen(false);
      }
    },
    [pdfFileName, pdfSceneChoice]
  );

  const mediaQueryString = useMemo(() => {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform()
      ? '(orientation: landscape)'
      : '(orientation: landscape) and (max-width: 960px)';
  }, []);

  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(mediaQueryString).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(mediaQueryString);
    const handler = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
      if (!e.matches) setLandscapeNavHidden(false);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mediaQueryString]);

  const [rotationTransition, setRotationTransition] = useState(false);
  useEffect(() => {
    setRotationTransition(true);
    const timer = setTimeout(() => setRotationTransition(false), 320);
    return () => clearTimeout(timer);
  }, [isLandscape]);

  const stageVis = settings.perApp?.stage ?? {
    theme: 'dark' as const,
    accentColor: 'blue' as const,
    amoledMode: false,
  };
  const accentKey = (stageVis.accentColor ??
    settings.accentColor ??
    'blue') as keyof typeof ACCENT_COLORS;
  const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;
  const isLight = (() => {
    if (stageVis.theme === 'light') return true;
    if (stageVis.theme === 'system') {
      return (
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
      );
    }
    if (stageVis.theme === 'dynamic') {
      const h = new Date().getHours();
      const lightStart = settings.dynamicLightStart ?? 7;
      const lightEnd = settings.dynamicLightEnd ?? 20;
      return h >= lightStart && h < lightEnd;
    }
    return false;
  })();
  const isAmoled = isLight ? false : isWebDesktop ? true : stageVis.amoledMode;

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const iframeSrc = useRef(
    `${baseOrigin}/stage-core/index.html#${isLight ? 'light' : 'dark'},${encodeURIComponent(accent.from)},${encodeURIComponent(accent.to)},${isAmoled ? '1' : '0'}`
  ).current;
  const stageBg = isLight ? '#f2f1ef' : '#000000';
  const stageHdr = isLight ? '#f2f1ef' : '#000000';

  const showBack =
    curView === 'Rider' ||
    curView === 'Setlist' ||
    curView === 'Gear' ||
    curView === 'Members' ||
    curView === 'Export';

  const lastCallTime = useRef(0);
  useEffect(() => {
    setNavCollapsed(false);
  }, [curView]);
  // Functions that are idempotent navigation actions and should never be
  // throttled â€” spam-tapping Stage/Setup/Preferences must always feel instant.
  const NO_THROTTLE_FNS = new Set(['switchView', 'stageGoBack']);
  const pendingAcks = useRef<Map<string, { fn: string; timer: ReturnType<typeof setTimeout> }>>(
    new Map()
  );
  const callIframe = useCallback(
    (fn: string, arg?: string | number) => {
      if (!NO_THROTTLE_FNS.has(fn)) {
        const now = Date.now();
        if (now - lastCallTime.current < 200) return;
        lastCallTime.current = now;
      }
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Increment sent message counter
      setDiagTaps((prev) => ({ ...prev, sentMsgs: prev.sentMsgs + 1 }));

      const msgId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Set up ACK timeout
      const timeout = setTimeout(() => {
        console.warn(`[Diagnostics] No ACK received for command: ${fn} (msgId: ${msgId})`);
        logDiagnostic(`[ERROR] No ACK for ${fn}`);
      }, 1500);
      pendingAcks.current.set(msgId, { fn, timer: timeout });

      try {
        const win = iframe.contentWindow as Record<string, unknown> | null;
        const f = win?.[fn];
        if (typeof f === 'function') {
          arg !== undefined ? (f as (a: string | number) => void)(arg) : (f as () => void)();
          clearTimeout(timeout);
          pendingAcks.current.delete(msgId);
          return;
        }
      } catch {}
      try {
        iframe.contentWindow?.postMessage({ type: 'sc-call', fn, arg, msgId }, '*');
      } catch {}
    },
    [logDiagnostic]
  );

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const iframe = e.currentTarget;
      setIframeLoading(false);
      iframeReady.current = true;
      try {
        iframe.contentWindow?.postMessage('stage-core-ping', '*');
      } catch {}
      injectAccentVars(iframe, accent.from, accent.to);
      injectTheme(iframe, stageVis.theme ?? 'dark');
      injectAmoled(iframe, isAmoled);
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          let s = doc.getElementById('react-parent-overrides');
          if (!s) {
            s = doc.createElement('style');
            s.id = 'react-parent-overrides';
            s.textContent = isWebDesktop ? HIDE_IFRAME_UI : HIDE_IFRAME_UI_MOBILE;
            doc.head.appendChild(s);
          }
          if (!doc.getElementById('sc-scroll-spy')) {
            const scr = doc.createElement('script');
            scr.id = 'sc-scroll-spy';
            scr.textContent = `(function(){
            var ly=0;
            function h(e){
              var t=e.target;
              if(t&&t.closest&&t.closest('#bottom-toolbar,#properties-panel'))return;
              var y=t.scrollTop;
              if(typeof y!=='number')return;
              if(y<30){window.parent.postMessage({type:'sc-scroll-reset'},'*');ly=y;return;}
              var dy=y-ly;
              if(Math.abs(dy)<6)return;
              window.parent.postMessage({type:'sc-scroll-delta',dy:dy},'*');
              ly=y;
            }
            document.addEventListener('scroll',h,{passive:true,capture:true});
          })();`;
            doc.body.appendChild(scr);
          }
        }
      } catch {}
      try {
        (iframe.contentWindow as StageWin).__onViewChange = (view: string) => {
          setCurView(view === 'Assistant' ? 'Preferences' : view);
        };
      } catch {}

      try {
        const win = iframe.contentWindow as StageWin;
        const targetView = iframe.getAttribute('data-view') || curView;
        if (targetView === 'Setup' || targetView === 'SetupHub') {
          win?.switchView?.('SetupHub');
        } else if (targetView === 'Preferences' || targetView === 'Assistant') {
          win?.switchView?.('Assistant');
        } else {
          win?.switchView?.(targetView);
        }
      } catch {}

      injectStartOnPicker(iframe);
    },
    [accent.from, accent.to, stageVis.theme, isAmoled, isWebDesktop, curView]
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      injectAccentVars(iframe, accent.from, accent.to);
      injectTheme(iframe, stageVis.theme ?? 'dark');
      injectAmoled(iframe, isAmoled);
    }
  }, [accent.from, accent.to, stageVis.theme, isAmoled, curView]);

  useEffect(() => {
    let retries = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const attemptSwitch = () => {
      try {
        const win = iframeRef.current?.contentWindow as
          (Record<string, unknown> & { switchView?: (v: string) => void }) | null;
        if (win && typeof win.switchView === 'function') {
          win.switchView(curView);
        } else {
          callIframe('switchView', curView);
          if (retries < 15) {
            // Retry for up to ~3 seconds
            retries++;
            timeoutId = setTimeout(attemptSwitch, 200);
          }
        }
      } catch {}
    };

    attemptSwitch();

    return () => clearTimeout(timeoutId);
  }, [curView, callIframe]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const origin = e.origin || '';
      const isAllowedOrigin =
        !origin ||
        origin === 'null' ||
        origin === window.location.origin ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('capacitor://localhost');
      if (!isAllowedOrigin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;

      // Increment received message counter
      setDiagTaps((prev) => ({ ...prev, recvMsgs: prev.recvMsgs + 1 }));

      if (showDiagnostics) {
        logDiagnostic(
          `[MSG RECV] type: ${e.data?.type || 'unknown'} | data: ${JSON.stringify(e.data || {})}`
        );
      }

      if (e.data?.type === 'sc-ack') {
        const msgId = e.data.msgId;
        if (pendingAcks.current.has(msgId)) {
          clearTimeout(pendingAcks.current.get(msgId)!.timer);
          pendingAcks.current.delete(msgId);
          logDiagnostic(`[ACK] Received ACK for command: ${e.data.fn}`);
        }
        return;
      }

      if (e.data?.type === 'sc-dial-state') setFabOpen(!!e.data.open);
      if (e.data?.type === 'sc-scroll-delta') {
        const dy = e.data.dy;
        setNavScrollOffset(getNavScrollOffset() + dy / 64);
      }
      if (e.data?.type === 'sc-scroll-reset') {
        setNavScrollOffset(0);
      }
      if (e.data?.type === 'sc-prop-state')
        setPropPanelOpen(e.data.state === 'open' || e.data.state === 'peek');
      if (e.data?.type === 'sc-live-mode') setLiveMode(!!e.data.on);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [showDiagnostics, logDiagnostic]);

  useEffect(() => {
    return () => {
      void import('@workspace/studio-core').then(({ registerStageIframe }) =>
        registerStageIframe(null)
      );
    };
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      void import('@workspace/studio-core').then(({ registerStageIframe }) => {
        registerStageIframe(iframeRef.current);
      });
    }
  }, [curView]);

  const iframeLoadingRef = useRef(iframeLoading);
  iframeLoadingRef.current = iframeLoading;
  const diagTapsRef = useRef(diagTaps);
  diagTapsRef.current = diagTaps;

  useEffect(() => {
    registerDebugProvider({
      id: 'stagex',
      name: 'Stagex Editor',
      getDebugState: () => ({
        activeImplementation: 'Modern Web Stagex',
        activeStageCorePanel: 'v4.0.0-web',
        iframeLoaded: !iframeLoadingRef.current,
        iframeReady: iframeReady.current,
        bridgeConnected: iframeReady.current && !iframeLoadingRef.current,
        bridgeMessagesSent: diagTapsRef.current.sentMsgs,
        bridgeMessagesReceived: diagTapsRef.current.recvMsgs,
        activeTab: curViewRef.current,
        selectedElement: 'none',
        overlayState: 'N/A',
        diagTaps: diagTapsRef.current,
        controlState: {
          Add: { rendered: true, lastError: null },
          Setup: { rendered: true, lastError: null },
          Preferences: { rendered: true, lastError: null },
          Save: { rendered: true, lastError: null },
          Export: { rendered: true, lastError: null },
          Visibility: { rendered: true, lastError: null },
          Rotate: { rendered: true, lastError: null },
        },
      }),
    });
    return () => {
      unregisterDebugProvider('stagex');
    };
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    injectAccentVars(iframe, accent.from, accent.to);
    injectTheme(iframe, stageVis.theme ?? 'dark');
  }, [accent.from, accent.to, stageVis.theme]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    injectAmoled(iframe, isAmoled);
  }, [isAmoled]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        const ls = doc.getElementById('landscape-overrides');
        if (ls) ls.remove();
      }
    } catch {}
    try {
      iframe.contentWindow?.postMessage({ type: 'sc-landscape', landscape: isLandscape }, '*');
    } catch {}
  }, [isLandscape]);

  useBackHandler(
    'sheet',
    () => {
      if (pdfSheetOpen) {
        setPdfSheetOpen(false);
        return true;
      }
      return false;
    },
    [pdfSheetOpen]
  );

  useBackHandler(
    'nested',
    () => {
      // 1. If iframe has an open overlay/modal/sheet, let the iframe handle it
      try {
        const win = iframeRef.current?.contentWindow as any;
        if (win && typeof win.stageHasOpenOverlay === 'function' && win.stageHasOpenOverlay()) {
          return win.stageGoBack() ?? false;
        }
      } catch (e) {}

      // 2. Otherwise, if stage is expanded (landscape mode), exit it (item 5)
      if (isStageExpanded) {
        toggleStageExpanded();
        return true;
      }

      // 3. Otherwise, let the iframe handle the next level (deselect selection, return page, etc.)
      try {
        const win = iframeRef.current?.contentWindow as any;
        if (win && typeof win.stageGoBack === 'function') {
          return win.stageGoBack() ?? false;
        }
      } catch (e) {}

      return false;
    },
    [isStageExpanded]
  );

  const hasWebHeader = !isWebDesktop || curView === 'Editor' || curView === 'Export' || showBack;
  const collapseHeader =
    (isLandscape && curView === 'Editor') || liveMode || !hasWebHeader || isStageExpanded;
  const hideBottomNav = curView === 'Export' || isStageExpanded || fabOpen || propPanelOpen;
  const isLandscapeEditor = isLandscape && curView === 'Editor';

  const navTabs: { view: string; label: string; icon: string }[] = [
    { view: 'Editor', label: tr.stagex.navStage, icon: 'grid_view' },
    { view: 'Setup', label: tr.stagex.navSetup, icon: 'folder_open' },
    { view: 'Preferences', label: tr.stagex.navPreferences, icon: 'tune' },
  ];

  const isTabActive = (view: string) => {
    if (view === 'Editor') return curView === 'Editor' || curView === 'Export';
    if (view === 'Setup')
      return ['SetupHub', 'Rider', 'Setlist', 'Gear', 'Members'].includes(curView);
    if (view === 'Preferences') return curView === 'Preferences';
    return false;
  };

  const transitionToView = useCallback(
    (targetView: string) => {
      setIsExiting(true);
      setTimeout(() => {
        setCurView(targetView);
        callIframe('switchView', targetView);
        setIsExiting(false);
      }, 150);
    },
    [callIframe, setCurView]
  );

  const handleNavTap = useCallback(
    (view: string) => {
      setNavCollapsed(false);
      const target = view === 'Setup' ? 'SetupHub' : view;
      transitionToView(target);
    },
    [transitionToView]
  );

  useEffect(() => {
    if (isWebDesktop) return;
    useBottomNavigationStore.getState().setItems(
      navTabs.map((t) => ({
        key: t.view,
        icon: t.icon,
        label: t.label,
        isActive: isTabActive(t.view),
        onClick: () => handleNavTap(t.view),
      }))
    );
    useBottomNavigationStore.getState().setIsLight(isLight);
    useBottomNavigationStore
      .getState()
      .setVisible(!(liveMode || hideBottomNav || (isLandscapeEditor && landscapeNavHidden)));
  }, [
    curView,
    isLight,
    liveMode,
    hideBottomNav,
    isLandscapeEditor,
    landscapeNavHidden,
    isWebDesktop,
    handleNavTap,
    isTabActive,
  ]);
  const handleFabTap = useCallback(() => {
    callIframe('toggleSCDial');
  }, [callIframe]);

  /* â”€â”€ Glassmorphism pill bg â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const stagePillBg = isAmoled
    ? 'rgba(4,4,4,0.88)'
    : isLight
      ? 'rgba(255, 255, 255, 0.40)'
      : 'rgba(26,26,30,0.82)';

  /* â”€â”€ Pill measurement helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const measureStageBtn = (idx: number) => {
    const btn = stageBtnRefs.current[idx];
    const nav = stageNavRef.current;
    if (!btn || !nav) return null;
    const nr = nav.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return { left: br.left - nr.left, right: br.right - nr.left };
  };

  /* Init pill on mount */
  useEffect(() => {
    const idx = navTabs.findIndex((t) => isTabActive(t.view));
    const m = measureStageBtn(idx >= 0 ? idx : 0);
    if (m) setStagePill({ left: m.left, right: m.right, ready: true });
    if (stageNavRef.current) {
      setExpandedStageH(stageNavRef.current.offsetHeight);
      setExpandedStageW(stageNavRef.current.offsetWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Animate pill when view changes + always show nav on view change */
  useEffect(() => {
    // Any view transition (including back-button from scrollable sections) resets nav visibility
    setNavCollapsed(false);

    const newIdx = navTabs.findIndex((t) => isTabActive(t.view));
    if (newIdx < 0) return;
    const oldIdx = prevTabRef.current;
    if (newIdx === oldIdx) return;
    prevTabRef.current = newIdx;
    const newM = measureStageBtn(newIdx);
    if (!newM) return;
    if (stageStretchRef.current) {
      clearTimeout(stageStretchRef.current);
      stageStretchRef.current = null;
      setStagePill((p) => ({ ...p, left: newM.left, right: newM.right }));
      return;
    }
    if (newIdx > oldIdx) {
      setStagePill((p) => ({ ...p, right: newM.right }));
      stageStretchRef.current = setTimeout(() => {
        setStagePill((p) => ({ ...p, left: newM.left }));
        stageStretchRef.current = null;
      }, 90);
    } else {
      setStagePill((p) => ({ ...p, left: newM.left }));
      stageStretchRef.current = setTimeout(() => {
        setStagePill((p) => ({ ...p, right: newM.right }));
        stageStretchRef.current = null;
      }, 90);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curView]);

  if (isWebDesktop) {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: stageBg,
          position: 'relative',
        }}
      >
        <WebAppSectionDock
          app="stage"
          activeSection={
            isTabActive('Editor') ? 'Editor' : isTabActive('Setup') ? 'Setup' : 'Preferences'
          }
          onChangeSection={handleNavTap}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            background: stageBg,
            position: 'relative',
          }}
        >
          <StageToolbar
              curView={curView}
              isLight={isLight}
              tr={tr}
              callIframe={callIframe}
              transitionToView={transitionToView}
              openPdfSheet={openPdfSheet}
            />

          {/* Main workspace area */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                flex: 1,
                margin: '12px',
                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                background: stageBg,
              }}
            >
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                title="Stagex Canvas"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                  backgroundColor: 'transparent',
                }}
                allow="clipboard-write"
              />
              {iframeLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: stageBg }}>
                  <SmartLoading app="stage" />
                </div>
              )}
            </div>

            {curView === 'Editor' && (
              <motion.div
                initial={{ opacity: 0, x: 260 }}
                animate={{
                  opacity: isRightPanelCollapsed ? 0 : 1,
                  x: isRightPanelCollapsed ? 260 : 0,
                }}
                transition={{ duration: DurationPresets.normal, ease: EasingPresets.standard }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 260,
                  zIndex: 98,
                  borderLeft: isLight
                    ? '1px solid rgba(0,0,0,0.08)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: isLight ? 'var(--app-surface-low)' : '#080809',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  overflow: 'visible',
                }}
              >
                {/* Sidebar Collapse Toggle Button inside the translated container */}
                <button
                  onClick={() => setIsRightPanelCollapsed((v) => !v)}
                  title={isRightPanelCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isRightPanelCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: -18,
                    transform: 'translateY(-50%)',
                    zIndex: 99,
                    width: 18,
                    height: 64,
                    background: isLight ? 'rgba(240, 240, 242, 0.95)' : 'rgba(20, 20, 24, 0.95)',
                    border: isLight
                      ? '1px solid rgba(0, 0, 0, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLight ? '#27272a' : '#a1a1aa',
                    transition: 'background-color 200ms, color 200ms',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: isLight
                      ? '-2px 0 8px rgba(0,0,0,0.06)'
                      : '-2px 0 8px rgba(0,0,0,0.3)',
                  }}
                  onPointerOver={(e) => (e.currentTarget.style.color = '#3b82f6')}
                  onPointerOut={(e) =>
                    (e.currentTarget.style.color = isLight ? '#27272a' : '#a1a1aa')
                  }
                >
                  {isRightPanelCollapsed ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </button>
                {/* Scrollable Elements Area */}
                <div
                  ref={elementsScrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 16px var(--content-bottom-pad, 96px) 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <StageLibraryPanel
                    isLight={isLight}
                    accent={accent}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    customElements={customElements}
                    expandedCats={expandedCats}
                    setExpandedCats={setExpandedCats}
                    callIframe={callIframe}
                    iframeRef={iframeRef}
                    handleAddElement={handleAddElement}
                  />
                </div>

                {/* Fixed Bottom Section */}
                <div
                  style={{
                    padding: '16px',
                    borderTop: isLight
                      ? '1px solid rgba(0,0,0,0.08)'
                      : '1px solid rgba(255,255,255,0.06)',
                    background: isLight ? 'var(--app-surface-low)' : '#0a0a0c',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.3)',
                        marginBottom: '8px',
                      }}
                    >
                      View Mode
                    </h4>
                    <button
                      onClick={() => callIframe('toggleGigMode')}
                      className={`btn-smooth border w-full ${
                        liveMode
                          ? isLight
                            ? 'bg-zinc-900 text-white border-transparent font-extrabold'
                            : 'bg-zinc-100 text-zinc-950 border-transparent font-extrabold'
                          : isLight
                            ? 'bg-transparent text-zinc-600 hover:text-zinc-900 border-zinc-200 hover:border-zinc-350'
                            : 'bg-transparent text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
                      }`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {liveMode ? 'visibility' : 'visibility_off'}
                      </span>
                      {liveMode ? 'Live Mode Active' : 'Enter Live Mode'}
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '8px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    Stagex Module v4.0.0
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100dvh',
        background: stageBg,
        transition: 'background 180ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isWebDesktop && isLargeDesktop ? 'row' : 'column',
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {isWebDesktop && (
          <WebAppSectionDock
            app="stage"
            activeSection={
              isTabActive('Editor') ? 'Editor' : isTabActive('Setup') ? 'Setup' : 'Preferences'
            }
            onChangeSection={handleNavTap}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              overflow: collapseHeader ? 'hidden' : 'visible',
              height: collapseHeader ? 0 : 'calc(env(safe-area-inset-top) + 68px)',
              // In the Export view we want the header to disappear instantly on
              // scroll-down (no animation). In landscape Editor mode we still
              // animate the collapse for a smooth rotation feel.
              transition: curView === 'Export' ? 'none' : 'height 260ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div
              style={{
                height: 'env(safe-area-inset-top)',
                background: 'transparent',
                flexShrink: 0,
              }}
            />

            <div
              className="spring-in"
              style={{
                flexShrink: 0,
                display: isWebDesktop || showBack ? 'flex' : 'none',
                alignItems: 'center',
                padding: '24px 24px 4px',
                background: stageHdr,
                transition: 'background 180ms ease',
                gap: showBack ? 8 : 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  flexShrink: 0,
                  width: showBack ? '46px' : '0px',
                  opacity: showBack ? 1 : 0,
                  transition: 'width 300ms cubic-bezier(0.34,1.1,0.64,1), opacity 200ms ease',
                }}
              >
                <button
                  onClick={() => {
                    // Drive the iframe directly using React's known view, so we don't
                    // depend on the iframe's internal state.currentView staying in sync.
                    // Optimistically update curView so the toolbar swaps instantly.
                    try {
                      const win = iframeRef.current?.contentWindow as
                        (Record<string, unknown> & { switchView?: (v: string) => void }) | null;
                      const sv = win?.switchView;
                      if (typeof sv === 'function') {
                        if (curView === 'Export') {
                          setCurView('Editor');
                          sv('Editor');
                          return;
                        }
                        if (['Rider', 'Setlist', 'Gear', 'Members'].includes(curView)) {
                          setCurView('SetupHub');
                          sv('SetupHub');
                          return;
                        }
                        setCurView('Editor');
                        sv('Editor');
                        return;
                      }
                    } catch {}
                    callIframe('stageGoBack');
                  }}
                  className="btn-smooth"
                  aria-label="Back"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--app-surface-high)',
                    border: '1px solid rgba(128,128,128,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 500ms cubic-bezier(0.4,0,0.2,1)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'var(--c-text-primary)', fontSize: 18 }}
                  >
                    arrow_back
                  </span>
                </button>
              </div>

              <div style={{ flex: 1 }} />

              {curView === 'Editor' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {(
                    [
                      // v3.0.56: Auto-arrange removed from top toolbar â€” its
                      // function moved into the iframe vertical sidebar slot
                      // that already shows `auto_fix_high`. Live mode (eye)
                      // moved out of the top toolbar to a floating button
                      // anchored above the blue + (FAB) below.
                      {
                        label: tr.stagex.toolMeasure,
                        icon: 'straighten',
                        fn: () => callIframe('scActivateMeasure'),
                      },
                      {
                        label: tr.stagex.toolHistory,
                        icon: 'history',
                        fn: () => callIframe('openTimelinePanel'),
                      },
                    ] as { label: string; icon: string; fn: () => void; testid?: string }[]
                  ).map(({ label, icon, fn, testid }) => (
                    <button
                      key={label}
                      onClick={fn}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        fn();
                      }}
                      title={label}
                      aria-label={label}
                      data-testid={testid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
                        color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(180,185,200,0.75)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, lineHeight: 1 }}
                      >
                        {icon}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => callIframe('openPresetsPanel')}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      callIframe('openPresetsPanel');
                    }}
                    title={tr.stagex.toolPresets}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
                      color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(180,185,200,0.75)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, lineHeight: 1 }}
                    >
                      save
                    </span>
                  </button>

                  <button
                    onClick={() => transitionToView('Export')}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      transitionToView('Export');
                    }}
                    title={tr.stagex.toolExport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                      color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(180,185,200,0.7)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, lineHeight: 1 }}
                    >
                      picture_as_pdf
                    </span>
                  </button>
                </div>
              )}

              {curView === 'Export' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => callIframe('toggleExportOptions')}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      callIframe('toggleExportOptions');
                    }}
                    title="Sections"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
                      color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(180,185,200,0.75)',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, lineHeight: 1 }}
                    >
                      tune
                    </span>
                  </button>
                  <button
                    onClick={openPdfSheet}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      openPdfSheet();
                    }}
                    title="Export PDF"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
                      color: isLight ? '#111' : '#fff',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: 16,
                        height: 16,
                        background: 'currentColor',
                        WebkitMask: `url(${import.meta.env.BASE_URL}icons/export-pdf.png) center / contain no-repeat`,
                        mask: `url(${import.meta.env.BASE_URL}icons/export-pdf.png) center / contain no-repeat`,
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              flex: 1,
              opacity: rotationTransition ? 0.15 : isExiting ? 0 : 1,
              transform: rotationTransition
                ? 'scale(0.97)'
                : isExiting
                  ? 'scale(0.97) translateY(8px)'
                  : 'scale(1) translateY(0px)',
              pointerEvents: rotationTransition || isExiting ? 'none' : 'auto',
              transition:
                'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: stageBg,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: stageBg,
              }}
            >
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                data-view={getSimplifiedView(curView)}
                onLoad={handleLoad}
                title="Stagex"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                  backgroundColor: stageBg,
                }}
                allow="clipboard-write"
              />
              {iframeLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: stageBg }}>
                  <SmartLoading app="stage" />
                </div>
              )}
            </div>

            {showDiagnostics && (
              <StageDiagnosticsOverlay
                safeMode={safeMode}
                setSafeMode={setSafeMode}
                logDiagnostic={logDiagnostic}
                testActive={testActive}
                testCycle={testCycle}
                testStep={testStep}
                runInteractionTest={runTest}
                diagTaps={diagTaps}
                setDiagTaps={setDiagTaps}
                lastDiagLog={lastDiagLog}
              />
            )}

            {/* â”€â”€ Stage Expand/Rotate Toggle â”€â”€ */}
            {curView === 'Editor' && (
              <button
                onClick={toggleStageExpanded}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  toggleStageExpanded();
                }}
                aria-label={isStageExpanded ? 'Exit Landscape View' : 'Enter Landscape View'}
                style={{
                  position: 'absolute',
                  bottom: (isLandscapeEditor ? 14 : 90) + 110,
                  right: 17,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isStageExpanded
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : isLight
                      ? 'rgba(255,255,255,0.82)'
                      : 'rgba(28,28,32,0.80)',
                  border: isStageExpanded
                    ? 'none'
                    : isLight
                      ? '1px solid rgba(0,0,0,0.10)'
                      : '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: isStageExpanded ? 'none' : 'blur(12px)',
                  WebkitBackdropFilter: isStageExpanded ? 'none' : 'blur(12px)',
                  boxShadow: isStageExpanded
                    ? `0 4px 20px ${accent.from}90`
                    : '0 4px 16px rgba(0,0,0,0.25)',
                  zIndex: 20,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: (isLandscapeEditor && propPanelOpen) || fabOpen ? 0 : 1,
                  pointerEvents:
                    (isLandscapeEditor && propPanelOpen) || fabOpen
                      ? ('none' as const)
                      : ('auto' as const),
                  visibility:
                    (isLandscapeEditor && propPanelOpen) || fabOpen
                      ? ('hidden' as const)
                      : ('visible' as const),
                  transition:
                    'background 300ms ease, box-shadow 300ms ease, opacity 420ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: isStageExpanded
                      ? '#fff'
                      : isLight
                        ? 'rgba(0,0,0,0.65)'
                        : 'rgba(200,200,220,0.9)',
                    fontSize: 22,
                    lineHeight: 1,
                  }}
                >
                  screen_rotation
                </span>
              </button>
            )}

            {/* â”€â”€ Live-mode toggle (eye) â€” stacked 8px above the FAB â”€â”€ */}
            {curView === 'Editor' && (
              <ActionButton
                id="stagex-eye-button"
                data-testid="stagex-eye-button"
                variant="visibility"
                isVisible={liveMode}
                onClick={() => callIframe('toggleGigMode')}
                iconSize={22}
                style={{
                  position: 'absolute',
                  bottom: (isLandscapeEditor ? 14 : 90) + 50 + 8,
                  right: 17,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: liveMode
                    ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                    : isLight
                      ? 'rgba(255,255,255,0.82)'
                      : 'rgba(28,28,32,0.80)',
                  border: liveMode
                    ? 'none'
                    : isLight
                      ? '1px solid rgba(0,0,0,0.10)'
                      : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: liveMode
                    ? `0 4px 20px ${accent.from}90`
                    : '0 4px 16px rgba(0,0,0,0.25)',
                  zIndex: 20,
                  opacity: (isLandscapeEditor && propPanelOpen) || fabOpen ? 0 : 1,
                  pointerEvents:
                    (isLandscapeEditor && propPanelOpen) || fabOpen
                      ? ('none' as const)
                      : ('auto' as const),
                  visibility:
                    (isLandscapeEditor && propPanelOpen) || fabOpen
                      ? ('hidden' as const)
                      : ('visible' as const),
                  padding: 0,
                }}
              />
            )}

            {/* â”€â”€ FAB: add instrument â”€â”€ */}
            {curView === 'Editor' && (
              <button
                id="stagex-plus-button"
                data-testid="stagex-plus-button"
                onClick={handleFabTap}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleFabTap();
                }}
                aria-label={tr.stagex.addInstrument}
                style={{
                  position: 'absolute',
                  bottom: isLandscapeEditor ? 14 : 90,
                  right: 14,
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  border: 'none',
                  zIndex: 20,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  display: 'flex',
                  opacity: liveMode ? 0 : isLandscapeEditor && propPanelOpen ? 0 : 1,
                  pointerEvents: liveMode
                    ? ('none' as const)
                    : isLandscapeEditor && propPanelOpen
                      ? ('none' as const)
                      : ('auto' as const),
                  visibility: liveMode
                    ? ('hidden' as const)
                    : isLandscapeEditor && propPanelOpen
                      ? ('hidden' as const)
                      : ('visible' as const),
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: fabOpen
                    ? `0 6px 32px ${accent.from}99, 0 3px 12px rgba(0,0,0,0.4)`
                    : `0 4px 24px ${accent.from}80, 0 2px 8px rgba(0,0,0,0.3)`,
                  padding: 0,
                  transform: fabOpen ? 'rotate(45deg) scale(1.08)' : 'rotate(0deg) scale(1)',
                  transition:
                    'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, opacity 420ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    lineHeight: 1,
                    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  add
                </span>
              </button>
            )}

            {isLandscapeEditor && landscapeNavHidden && (
              <button
                onClick={() => setLandscapeNavHidden(false)}
                aria-label={tr.stagex.showNav}
                title={tr.stagex.showNav}
                style={{
                  position: 'absolute',
                  bottom: 'max(4px, env(safe-area-inset-bottom))',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 48,
                  height: 26,
                  borderRadius: '12px 12px 0 0',
                  background: stagePillBg,
                  border: isLight
                    ? '1px solid rgba(255,255,255,0.55)'
                    : '1px solid rgba(255,255,255,0.10)',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 14,
                    color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(160,160,180,0.8)',
                    lineHeight: 1,
                  }}
                >
                  expand_less
                </span>
              </button>
            )}

            {isLandscapeEditor && !landscapeNavHidden && !isWebDesktop && (
              <button
                onClick={() => setLandscapeNavHidden(true)}
                aria-label={tr.stagex.hideNav}
                title={tr.stagex.hideNav}
                style={{
                  position: 'absolute',
                  bottom: `calc(max(10px, env(safe-area-inset-bottom)) + ${isLandscapeEditor ? 34 : 52}px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 48,
                  height: 26,
                  borderRadius: '12px 12px 0 0',
                  background: stagePillBg,
                  border: isLight
                    ? '1px solid rgba(255,255,255,0.55)'
                    : '1px solid rgba(255,255,255,0.10)',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 11,
                  transition: 'opacity 300ms ease',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 14,
                    color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(160,160,180,0.8)',
                    lineHeight: 1,
                  }}
                >
                  expand_more
                </span>
              </button>
            )}
          </div>

          <ExportPdfDialog
              open={pdfSheetOpen}
              onClose={() => !pdfBusy && setPdfSheetOpen(false)}
              title={tr.stagex.pdfSheetTitle}
              nameLabel={tr.stagex.pdfSheetName}
              fileName={pdfFileName}
              setFileName={setPdfFileName}
              busy={pdfBusy}
              sceneInfo={pdfSceneInfo}
              sceneChoice={pdfSceneChoice}
              setSceneChoice={setPdfSceneChoice}
              sceneCurrentLabel={tr.stagex.pdfSheetSceneCurrent}
              sceneAllLabel={tr.stagex.pdfSheetSceneAll}
              canShare={canShareFiles}
              onSave={() => runPdfExport('save')}
              onShare={() => runPdfExport('share')}
              saveLabel={tr.stagex.toolSave}
              shareLabel={tr.stagex.toolShare}
              cancelLabel={tr.stagex.pdfSheetCancel}
            />
        </div>
      </div>
    </div>
  );
}
