import { Capacitor } from '@capacitor/core';
import { Button, StatefulButton } from '../../../shared/design-system/buttons';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';
import {
  useBackHandler,
  type AuthUser,
  subscribeSyncStatus,
  type SyncStatus,
  deviceId,
  getConflictLogs,
  clearConflictLogs,
  createCloudBackup,
  getSyncDiagnostics,
  pushLocalSettingsToCloud,
  pullCloudSettingsFromCloud,
  registerDevice,
  registerCurrentDevice,
  reconnectDevices,
  useChordStore,
  ACCENT_COLORS,
  type AnimationSpeed,
  type DisplayDensity,
  type AppKey,
  type PerAppVisuals,
  useNavHidden,
  useNavCollapsed,
  useScrollHide,
  setNavHidden,
  useT,
  APP_VERSION_LABEL,
  APP_VERSION_TAG,
  APP_VERSION_DATE,
  compareSemver,
  APP_VERSION,
  getChangelogSections,
  RELEASE_HISTORY,
  useAppUpdate,
  updateDebugLogs,
  updateDiagnostics,
  checkForUpdate,
  resetAppUpdateState,
  isAppInstallerAvailable,
  applyUpdate,
  fadeToBlackAndReload,
  resolveApkUrl,
  downloadAndInstallApk,
  resolveReleasePageUrl,
  useIsWebDesktop,
  useStudioPreferences,
  registerDebugProvider,
  unregisterDebugProvider,
  recordNavigation,
  getFirestoreDiagnostics,
  getNavigationEntries,
  resetNav,
  useNavigationStore,
  NavigationDispatcher,
  useBottomNavigationStore,
  useSettingsStore,
  DurationPresets,
  EasingPresets,
  SpringPresets,
  authRepository,
} from '@workspace/studio-core';
import {
  getUpdateHistory,
  StartupCoordinator,
  startDiagnosticsSession,
  resetUpdateTimeline,
  getTimelineReport,
} from '@workspace/studio-core';
import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  motionValue,
  animate,
  Reorder,
} from 'motion/react';
import { HubAppGrid } from './HubAppGrid';
import {
  StudioLogo,
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
} from '../../chordex/icons/ChordexLogo';
import { SpotlightLogo } from '../../../components/spotlight-logo';
import {
  Toggle,
  SectionHeader,
  SettingRow,
  SegmentedControl,
  BentoSettingCard,
  BentoSettingRow,
  SettingSection,
} from '../../../shared/settings/SettingControls';
import ApplyToSheet from '../../chordex/components/ApplyToSheet';
import ChangelogSheet from '../../chordex/components/ChangelogSheet';
import GradientBorderCard from '../../../shared/cards/GradientBorderCard';
import StudioTitleReveal from '../../../shared/typography/StudioTitleReveal';
import { EncryptedText } from '../../../shared/ui/encrypted-text';
import {
  SHARED_NAV_TRANSITION,
  getSharedNavTransform,
  getSharedNavOpacity,
} from '../navigation/navStyles';
import ProfileDropdown from '../../auth/components/ProfileDropdown';
import SmartLoading from '../../../shared/loading/SmartLoading';
import { StudioSkeletonProfile, StudioSkeletonList } from '../../../shared/loading/StudioSkeleton';
import {
  SettingsScaffold,
  SettingsContentContainer,
} from '../../../shared/layout/StudioLayoutSystem';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { ProgressiveBlur } from '../../../shared/design-system/ProgressiveBlur';
import { SharedNavigationBar } from '../navigation/SharedNavigationBar';
import { StaggeredReveal } from '../../../shared/animation';
import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';
import StudioHubSettingsPanel from '../settings/StudioHubSettingsPanel';
import PremiumThemeSwitcher from '../settings/PremiumThemeSwitcher';

const isHoverable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
const GOOEY_SPRING = { type: 'spring', stiffness: 550, damping: 33, mass: 0.45 } as const;

const settingsController = {
  updateSettings: (patch: any) => useSettingsStore.getState().updateSettings(patch),
};
const syncController = {
  syncNow: async () => {
    await pushLocalSettingsToCloud();
    await pullCloudSettingsFromCloud();
  },
};

import AccountCard, {
  AccountDangerZone,
  AccountSettingsPage,
} from '../../auth/components/AccountCard';
import DevToolsDashboard from '../../devtools/components/DevToolsDashboard';

import {
  HubTab,
  HelpPageId,
  TargetApp,
  THEME_OPTIONS,
  TimeWord,
  TIME_GREETING_ES,
  GreetingPair,
  _NAMED_PAIRS_EN,
  _NAMED_PAIRS_ES,
  _ANON_PAIRS_EN,
  _ANON_PAIRS_ES,
  Theme,
  getSessionIndex,
} from './hubConstants';
import { FAQ_ITEMS, HelpAccordion } from './faqConstants';
import {
  BouncyAccordion,
  type BouncyAccordionItem,
} from '../../../components/motion/bouncy-accordion';

const ALL_SHORTCUT_OPTIONS = [
  {
    id: 'chords-songs',
    icon: 'music_note',
    titleEn: 'Songs Library',
    titleEs: 'Biblioteca de Canciones',
    descEn: 'Rehearse your repertoire',
    descEs: 'Ensaya tu repertorio',
  },
  {
    id: 'chords-practice',
    icon: 'menu_book',
    titleEn: 'Song Practice',
    titleEs: 'Práctica de Canciones',
    descEn: 'Practice chords and progressions',
    descEs: 'Practica acordes y progresiones',
  },
  {
    id: 'drumex',
    icon: 'grid_on',
    titleEn: 'Drum Sequencer',
    titleEs: 'Secuenciador de Batería',
    descEn: 'Create custom drum loops',
    descEs: 'Crea bucles de batería',
  },
  {
    id: 'stagex',
    icon: 'speaker',
    titleEn: 'Stagex Console',
    titleEs: 'Consola Stagex',
    descEn: 'Manage live audio routing',
    descEs: 'Gestiona audio en vivo',
  },
  {
    id: 'groovex',
    icon: 'album',
    titleEn: 'Groovex Player',
    titleEs: 'Reproductor Groovex',
    descEn: 'Backing tracks controller',
    descEs: 'Controlador de pistas de fondo',
  },
  {
    id: 'vocalex-coach',
    icon: 'mic',
    titleEn: 'Vocal Coach',
    titleEs: 'Entrenador Vocal',
    descEn: 'Voice warmups & training',
    descEs: 'Calentamiento y práctica vocal',
  },
  {
    id: 'vocalex-pitch',
    icon: 'equalizer',
    titleEn: 'Pitch Tracker',
    titleEs: 'Seguimiento de Tono',
    descEn: 'Real-time pitch estimation',
    descEs: 'Visualizador de tono en tiempo real',
  },
  {
    id: 'developer',
    icon: 'terminal',
    titleEn: 'Dev Options',
    titleEs: 'Opc. de Desarrollador',
    descEn: 'Debugger & playground utilities',
    descEs: 'Utilidades de depuración',
  },
  {
    id: 'notifications',
    icon: 'notifications',
    titleEn: 'Notifications',
    titleEs: 'Notificaciones',
    descEn: 'Check system alerts and logs',
    descEs: 'Alertas del sistema y registros',
  },
  {
    id: 'help',
    icon: 'help',
    titleEn: 'Help & FAQ',
    titleEs: 'Centro de Ayuda',
    descEn: 'User guide and documentation',
    descEs: 'Guía de usuario y soporte',
  },
  {
    id: 'settings',
    icon: 'settings',
    titleEn: 'Settings',
    titleEs: 'Ajustes',
    descEn: 'App preferences and themes',
    descEs: 'Preferencias y temas visuales',
  },
  {
    id: 'updater',
    icon: 'system_update',
    titleEn: 'Check Updates',
    titleEs: 'Buscar Actualizaciones',
    descEn: 'Update system components',
    descEs: 'Actualizar componentes del sistema',
  },
  {
    id: 'sync',
    icon: 'sync',
    titleEn: 'Cloud Sync',
    titleEs: 'Sincronizar Nube',
    descEn: 'Synchronize profiles & catalog',
    descEs: 'Sincronizar perfiles y catálogo',
  },
  {
    id: 'backup',
    icon: 'cloud_upload',
    titleEn: 'Data Backup',
    titleEs: 'Respaldo de Datos',
    descEn: 'Create local and cloud backups',
    descEs: 'Crear respaldos locales y en nube',
  },
  {
    id: 'appearance',
    icon: 'palette',
    titleEn: 'Appearance',
    titleEs: 'Apariencia',
    descEn: 'Customize theme & layout',
    descEs: 'Temas y densidad visual',
  },
  {
    id: 'language',
    icon: 'language',
    titleEn: 'Language',
    titleEs: 'Idioma',
    descEn: 'Change app language',
    descEs: 'Cambiar idioma de la aplicación',
  },
  {
    id: 'faq',
    icon: 'quiz',
    titleEn: 'Common Questions',
    titleEs: 'Preguntas Frecuentes',
    descEn: 'Frequently asked questions',
    descEs: 'Respuestas a dudas comunes',
  },
  {
    id: 'bug-report',
    icon: 'bug_report',
    titleEn: 'Report Bug',
    titleEs: 'Reportar Error',
    descEn: 'Submit system diagnostics',
    descEs: 'Enviar diagnóstico de fallos',
  },
  {
    id: 'keyboard-shortcuts',
    icon: 'keyboard',
    titleEn: 'Keyboard Rules',
    titleEs: 'Teclas Rápidas',
    descEn: 'View keybindings maps',
    descEs: 'Mapa de atajos de teclado',
  },
  {
    id: 'vocalex-takes',
    icon: 'history',
    titleEn: 'Voice Takes',
    titleEs: 'Tomas Vocales',
    descEn: 'Browse recorded vocal takes',
    descEs: 'Ver grabaciones de voz',
  },
  {
    id: 'stage-setlist',
    icon: 'format_list_bulleted',
    titleEn: 'Live Setlist',
    titleEs: 'Lista de Temas',
    descEn: 'Manage performance setlist',
    descEs: 'Organizar repertorio en vivo',
  },
  {
    id: 'stage-gear',
    icon: 'construction',
    titleEn: 'Gear Inventory',
    titleEs: 'Inventario de Equipos',
    descEn: 'Track stage hardware gear',
    descEs: 'Gestión de equipos físicos',
  },
  {
    id: 'stage-members',
    icon: 'group',
    titleEn: 'Crew & Band',
    titleEs: 'Banda y Crew',
    descEn: 'Manage band line-up',
    descEs: 'Personal de escenario',
  },
  {
    id: 'diagnostics',
    icon: 'analytics',
    titleEn: 'System Diagnosis',
    titleEs: 'Diagnóstico',
    descEn: 'Troubleshoot app performance',
    descEs: 'Estado y depuración del sistema',
  },
];

const SHORTCUT_LABEL_MAP: Record<string, { en: string; es: string }> = {
  'chords-songs': { en: 'Songs', es: 'Canciones' },
  'chords-practice': { en: 'Practice', es: 'Práctica' },
  drumex: { en: 'Drums', es: 'Batería' },
  stagex: { en: 'Console', es: 'Consola' },
  groovex: { en: 'Groovex', es: 'Groovex' },
  'vocalex-coach': { en: 'Coach', es: 'Entrenador' },
  'vocalex-pitch': { en: 'Pitch', es: 'Tono' },
  developer: { en: 'Dev', es: 'Desarrollador' },
  notifications: { en: 'Alerts', es: 'Alertas' },
  help: { en: 'Help', es: 'Ayuda' },
  settings: { en: 'Settings', es: 'Ajustes' },
  updater: { en: 'Updates', es: 'Actualiz.' },
  sync: { en: 'Sync', es: 'Sincro' },
  backup: { en: 'Backup', es: 'Copia' },
  appearance: { en: 'Style', es: 'Estilo' },
  language: { en: 'Lang', es: 'Idioma' },
  faq: { en: 'FAQ', es: 'FAQ' },
  'bug-report': { en: 'Bugs', es: 'Fallos' },
  'keyboard-shortcuts': { en: 'Keys', es: 'Teclas' },
  'vocalex-takes': { en: 'Takes', es: 'Tomas' },
  'stage-setlist': { en: 'Setlist', es: 'Setlist' },
  'stage-gear': { en: 'Gear', es: 'Equipos' },
  'stage-members': { en: 'Crew', es: 'Banda' },
  diagnostics: { en: 'Diag', es: 'Diag' },
};

function getGreetingPair(name?: string, idx?: number, lang: string = 'en'): GreetingPair {
  const h = new Date().getHours();
  const timeWord = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const i = idx ?? 0;

  if (name?.trim()) {
    const pairs = lang === 'es' ? _NAMED_PAIRS_ES : _NAMED_PAIRS_EN;
    const fn = pairs[i % pairs.length];
    return fn(name.trim(), timeWord);
  }

  const anonPairs = lang === 'es' ? _ANON_PAIRS_ES : _ANON_PAIRS_EN;
  const pair = anonPairs[i % anonPairs.length];
  if (lang === 'es') {
    return {
      ...pair,
      greeting:
        pair.greeting === 'Buenos días.'
          ? `${TIME_GREETING_ES[timeWord as TimeWord]}.`
          : pair.greeting,
    };
  }
  return {
    ...pair,
    greeting: pair.greeting === 'Good morning.' ? `Good ${timeWord}.` : pair.greeting,
  };
}

let _sessionIntroFinished = false;

function useStartupComplete() {
  const [complete, setComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !!(window as any).__studioStartupComplete;
  });

  useEffect(() => {
    if (complete) return;

    const check = () => {
      if ((window as any).__studioStartupComplete) {
        setComplete(true);
      }
    };

    check();
    window.addEventListener('studio-startup-complete', check);
    window.addEventListener('studio-launch-complete', check);

    return () => {
      window.removeEventListener('studio-startup-complete', check);
      window.removeEventListener('studio-launch-complete', check);
    };
  }, [complete]);

  return complete;
}

export default function StudioHub() {
  const settings = useSettingsStore((state) => state.settings);
  const updater = useAppUpdate();
  const currentApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');

  const startupComplete = useStartupComplete();
  const isWebDesktop = useIsWebDesktop();
  const t = useT();
  const lang = settings.language ?? 'en';
  const accent = ACCENT_COLORS.blue;
  const isHubLight = (() => {
    const hubTheme = settings.perApp?.hub?.theme ?? settings.theme ?? 'dark';
    if (hubTheme === 'light') return true;
    if (hubTheme === 'system') {
      return (
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
      );
    }
    if (hubTheme === 'dynamic') {
      const h = new Date().getHours();
      const lightStart = settings.dynamicLightStart ?? 7;
      const lightEnd = settings.dynamicLightEnd ?? 20;
      return h >= lightStart && h < lightEnd;
    }
    return false;
  })();

  const tab = useNavigationStore((s) => {
    const history = s.history;
    const current = history[history.length - 1];
    return (current?.tab ?? 'home') as HubTab;
  });

  const setTab = useCallback((action: React.SetStateAction<HubTab>) => {
    const currentTab =
      useNavigationStore.getState().history[useNavigationStore.getState().history.length - 1]
        ?.tab ?? 'home';
    const nextTab = typeof action === 'function' ? action(currentTab as HubTab) : action;
    NavigationDispatcher.push({ app: 'hub', tab: nextTab });
  }, []) as React.Dispatch<React.SetStateAction<HubTab>>;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('studio:hub-tab-active', { detail: tab }));
  }, [tab]);

  useEffect(() => {
    (window as any).__studioHubReady = true;
    window.dispatchEvent(new Event('studio-hub-ready'));
  }, []);

  useEffect(() => {
    console.log(
      `[STARTUP-TRACE] StudioHub: mount useEffect fired at ${performance.now().toFixed(0)}ms, calling notifyHubMounted()`
    );
    StartupCoordinator.notifyHubMounted();
    (window as any).__studioHubReady = true;
    window.dispatchEvent(new CustomEvent('studio:hub-ready'));
    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent<HubTab>;
      if (customEvent.detail) {
        setTab(customEvent.detail);
      }
    };
    window.addEventListener('studio:set-hub-tab', handleSetTab as EventListener);
    return () => {
      window.removeEventListener('studio:set-hub-tab', handleSetTab as EventListener);
    };
  }, []);
  const [zooming, setZooming] = useState(false);
  const activeRoute = useNavigationStore((s) => s.history[s.history.length - 1]) || {
    app: 'hub',
    tab: 'home',
  };
  const page =
    activeRoute.app === 'hub' && activeRoute.tab === 'settings'
      ? (activeRoute.page ?? 'main')
      : 'main';

  const routeApp = activeRoute.app;
  const routeTab = activeRoute.tab;
  const routePage = activeRoute.page;
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const [langQuery, setLangQuery] = useState('');
  const [shortcutPickerOpen, setShortcutPickerOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<string[]>([]);

  // Drag-to-reorder state variables
  const [isEditMode, setIsEditMode] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const longPressTimeoutRef = useRef<any>(null);
  const startLongPressTimer = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
        try {
          window.navigator.vibrate(15);
        } catch (_) {}
      }
      setIsEditMode(true);
    }, 500);
  };
  const clearLongPressTimer = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const shouldHide = !!(shortcutPickerOpen || isEditMode);
    setNavHidden(shouldHide);
    return () => {
      setNavHidden(false);
    };
  }, [shortcutPickerOpen, isEditMode]);

  // Usage-based suggestions engine
  const getSuggestedActions = () => {
    const activityLog = useChordStore.getState().activityLog || [];
    const candidates = [
      { id: 'chords-songs', score: 0 },
      { id: 'chords-practice', score: 0 },
      { id: 'drumex', score: 0 },
      { id: 'stagex', score: 0 },
      { id: 'groovex', score: 0 },
      { id: 'vocalex-coach', score: 0 },
      { id: 'vocalex-pitch', score: 0 },
      { id: 'developer', score: 0 },
      { id: 'notifications', score: 0 },
      { id: 'help', score: 0 },
      { id: 'settings', score: 0 },
      { id: 'updater', score: 0 },
      { id: 'sync', score: 0 },
      { id: 'backup', score: 0 },
    ];

    activityLog.forEach((event, idx) => {
      const recencyWeight = 25 - idx;
      let matchedId = '';
      if (event.type === 'app_launch') {
        if (event.subtitle?.includes('Chordex')) matchedId = 'chords-songs';
        else if (event.subtitle?.includes('Drumex')) matchedId = 'drumex';
        else if (event.subtitle?.includes('Stagex')) matchedId = 'stagex';
        else if (event.subtitle?.includes('Groovex')) matchedId = 'groovex';
        else if (event.subtitle?.includes('Vocalex')) matchedId = 'vocalex-coach';
      } else if (event.type === 'cloud_sync') {
        matchedId = 'sync';
      } else if (event.type === 'backup') {
        matchedId = 'backup';
      } else if (event.type === 'ota_install' || event.type === 'apk_install') {
        matchedId = 'updater';
      }
      if (matchedId) {
        const cand = candidates.find((c) => c.id === matchedId);
        if (cand) cand.score += recencyWeight;
      }
    });

    const suggested = candidates
      .filter((c) => !shortcuts.includes(c.id))
      .sort((a, b) => b.score - a.score);

    const defaults = ['chords-practice', 'notifications', 'settings', 'help', 'updater', 'sync'];
    for (const defId of defaults) {
      if (suggested.length >= 4) break;
      if (!shortcuts.includes(defId) && !suggested.some((s) => s.id === defId)) {
        suggested.push({ id: defId, score: -1 });
      }
    }
    return suggested.slice(0, 4).map((s) => s.id);
  };

  const activeRouteApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('studio:quick-shortcuts');
      if (stored) {
        setShortcuts(JSON.parse(stored));
      } else {
        const defaultShortcuts = ['chords-practice', 'chords-songs', 'notifications', 'settings'];
        setShortcuts(defaultShortcuts);
        localStorage.setItem('studio:quick-shortcuts', JSON.stringify(defaultShortcuts));
      }
    } catch {
      setShortcuts(['chords-practice', 'chords-songs', 'notifications', 'settings']);
    }
  }, []);

  const handleShortcutClick = (id: string) => {
    switch (id) {
      case 'chords-songs':
        launchApp('chordex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'chordex', page: 'songs' });
        }, 150);
        break;
      case 'chords-practice':
        launchApp('chordex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'chordex', page: 'songs' });
        }, 150);
        break;
      case 'drumex':
        launchApp('drumex');
        break;
      case 'stagex':
        launchApp('stagex');
        break;
      case 'groovex':
        launchApp('groovex');
        break;
      case 'vocalex-coach':
        launchApp('vocalex');
        break;
      case 'vocalex-pitch':
        launchApp('vocalex');
        break;
      case 'developer':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'developer' });
        }, 150);
        break;
      case 'updater':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'updater' });
        }, 150);
        break;
      case 'settings':
        setTab('settings');
        break;
      case 'sync':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'sync' });
        }, 150);
        break;
      case 'backup':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'backup' });
        }, 150);
        break;
      case 'appearance':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'appearance' });
        }, 150);
        break;

      case 'faq':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'faq' });
        }, 150);
        break;
      case 'bug-report':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'bug-report' });
        }, 150);
        break;
      case 'keyboard-shortcuts':
        setTab('help');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'help', page: 'keyboard-shortcuts' });
        }, 150);
        break;
      case 'vocalex-takes':
        launchApp('vocalex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'vocalex', page: 'takes' as any, tab: 'takes' as any });
        }, 150);
        break;
      case 'stage-setlist':
        launchApp('stagex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'stagex', page: 'Setlist' as any, tab: 'Setup' as any });
        }, 150);
        break;
      case 'stage-gear':
        launchApp('stagex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'stagex', page: 'Gear' as any, tab: 'Setup' as any });
        }, 150);
        break;
      case 'stage-members':
        launchApp('stagex');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'stagex', page: 'Members' as any, tab: 'Setup' as any });
        }, 150);
        break;
      case 'diagnostics':
        setTab('settings');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'debug' });
        }, 150);
        break;
      case 'help':
        setTab('help');
        break;
    }
  };
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!authUser?.uid) {
      setCustomPhoto(null);
      return;
    }
    try {
      const stored = localStorage.getItem('studio_custom_avatar_' + authUser.uid);
      setCustomPhoto(stored || null);
    } catch {
      setCustomPhoto(null);
    }

    const handleUpdate = () => {
      if (!authUser?.uid) return;
      try {
        const stored = localStorage.getItem('studio_custom_avatar_' + authUser.uid);
        setCustomPhoto(stored || null);
      } catch {}
    };
    window.addEventListener('custom-photo-updated', handleUpdate);
    return () => {
      window.removeEventListener('custom-photo-updated', handleUpdate);
    };
  }, [authUser]);
  const [successAnimationState, setSuccessAnimationState] = useState<
    'entering' | 'exiting' | 'hidden'
  >('hidden');
  const [successName, setSuccessName] = useState('');
  const homeScrollRef = useRef<HTMLDivElement>(null);
  const profileScrollRef = useRef<HTMLDivElement>(null);
  const settingsScrollRef = useRef<HTMLDivElement>(null);
  const helpScrollRef = useRef<HTMLDivElement>(null);
  const launchTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lastUserRef = useRef<AuthUser | null>(null);

  const activeScrollRef =
    tab === 'home'
      ? homeScrollRef
      : tab === 'profile'
        ? profileScrollRef
        : tab === 'settings'
          ? settingsScrollRef
          : helpScrollRef;

  useScrollHide(activeScrollRef, tab);

  const isFirstAuthRun = useRef(true);

  // Android-style Developer Options Tap & Toast state
  const devTapsRef = useRef(0);
  const [devToast, setDevToast] = useState<string | null>(null);
  const [devToastTimer, setDevToastTimer] = useState<number | null>(null);

  const tabRef = useRef(tab);
  tabRef.current = tab;
  const zoomingRef = useRef(zooming);
  zoomingRef.current = zooming;
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  useEffect(() => {
    registerDebugProvider({
      id: 'hub',
      name: 'Studio Hub',
      getDebugState: () => {
        const diag = getFirestoreDiagnostics();
        const navEntries = getNavigationEntries();
        const lastNav = navEntries.length > 0 ? navEntries[navEntries.length - 1] : null;
        const currentStore = useChordStore.getState();
        const currentSettings = useSettingsStore.getState();
        return {
          activeTab: tabRef.current,
          zooming: zoomingRef.current,
          authStatus: authUserRef.current ? 'Signed In' : 'Signed Out',
          theme: currentSettings.settings.theme,
          language: currentSettings.settings.language,
          'Sync Provider': diag.syncProvider,
          'Firestore Runtime Active': diag.firestoreRuntimeActive,
          'Firestore Disabled (Verified)': !diag.firestoreRuntimeActive,
          'Firestore Listen Channels': diag.firestoreListenChannels,
          'Firestore Write Channels': diag.firestoreWriteChannels,
          'Firestore Last Error': diag.firestoreLastError,
          'Firestore Init Call Stack': (diag as any).firestoreInitStack || 'never',
          'Hub Transition Status': (window as any).studioTransitionActive ? 'Active' : 'Completed',
          'Last Navigation Path': lastNav ? `${lastNav.fromApp} -> ${lastNav.toApp}` : 'none',
          'Last Navigation Duration':
            lastNav && lastNav.transitionComplete && lastNav.transitionStart
              ? `${lastNav.transitionComplete - lastNav.transitionStart}ms`
              : 'N/A',
        };
      },
    });
    return () => {
      unregisterDebugProvider('hub');
    };
  }, []);

  const showDevToast = (msg: string) => {
    if (devToastTimer) {
      window.clearTimeout(devToastTimer);
    }
    setDevToast(msg);
    const id = window.setTimeout(() => setDevToast(null), 2000);
    setDevToastTimer(id);
  };

  const handleLogoTap = () => {};

  const renderDevToast = () => (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isHubLight ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        color: isHubLight ? '#fff' : '#000',
        padding: '8px 18px',
        borderRadius: '20px',
        fontSize: '12.5px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        zIndex: 99999,
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
        whiteSpace: 'nowrap',
      }}
    >
      {devToast}
    </div>
  );

  useEffect(() => {
    return authRepository.subscribeAuth((user) => {
      if (isFirstAuthRun.current) {
        isFirstAuthRun.current = false;
        lastUserRef.current = user;
        setAuthUser(user);
        return;
      }

      if (!lastUserRef.current && user) {
        // Successful login transition!
        setSuccessName(user.displayName || user.email || 'User');
        setSuccessAnimationState('entering');
        setTimeout(() => {
          setSuccessAnimationState('exiting');
          setTimeout(() => {
            setSuccessAnimationState('hidden');
          }, 450); // wait for exit animation to complete
        }, 1800); // linger success check for 1.8 seconds
      }
      lastUserRef.current = user;
      setAuthUser(user);
    });
  }, []);

  // Deep-link intercept for Updater routing
  useEffect(() => {
    const handleRoute = () => {
      setTab('settings');
    };
    window.addEventListener('studio:route-to-updater', handleRoute);

    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToUpdater') === '1') {
      setTab('settings');
    }

    return () => {
      window.removeEventListener('studio:route-to-updater', handleRoute);
    };
  }, [setTab]);

  useEffect(() => {
    const handleRoute = () => {
      setTab('settings');
      sessionStorage.setItem('studio:routeToPrivacy', '1');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('studio:update-settings-page', { detail: 'privacy' }));
      }, 50);
    };
    window.addEventListener('studio:route-to-privacy', handleRoute);

    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToPrivacy') === '1') {
      setTab('settings');
    }

    return () => {
      window.removeEventListener('studio:route-to-privacy', handleRoute);
    };
  }, [setTab]);

  const launchApp = useCallback((appMode: AppKey) => {
    if ((window as any).studioTransitionActive) {
      console.warn('[Navigation] App switch request ignored: transition in progress.');
      return;
    }
    const currentApp = NavigationDispatcher.currentApp();
    recordNavigation({
      fromApp: currentApp,
      toApp: appMode,
      transitionStart: Date.now(),
      transitionLockState: true,
      activeAppAfterTransition: appMode,
      fallbackRendered: false,
    });

    (window as any).studioTransitionActive = true;
    setZooming(true);
    NavigationDispatcher.push({ app: appMode });

    // Clear any pending launch timers
    launchTimers.current.forEach(clearTimeout);
    launchTimers.current = [];

    const t2 = setTimeout(() => {
      (window as any).studioTransitionActive = false;
      recordNavigation({
        fromApp: currentApp,
        toApp: appMode,
        transitionComplete: Date.now(),
        transitionLockState: false,
        activeAppAfterTransition: appMode,
        fallbackRendered: false,
      });
    }, 340);
    launchTimers.current.push(t2);
    // updateSettings is stable (Zustand action), setZooming is React setState
  }, []);

  useEffect(() => {
    return () => {
      launchTimers.current.forEach(clearTimeout);
    };
  }, []);

  const [introFinished, setIntroFinished] = useState(() => {
    if (_sessionIntroFinished || (typeof window !== 'undefined' && (window as any).__introDone))
      return true;
    if (
      typeof document !== 'undefined' &&
      !document.getElementById('intro') &&
      !document.querySelector('[data-solar-intro]')
    ) {
      _sessionIntroFinished = true;
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (introFinished) {
      _sessionIntroFinished = true;
      return;
    }
    const handler = () => {
      _sessionIntroFinished = true;
      setIntroFinished(true);
    };
    window.addEventListener('studio-intro-done', handler, { once: true });
    return () => window.removeEventListener('studio-intro-done', handler);
  }, [introFinished]);

  // Reset zooming state when returning to the Hub
  useEffect(() => {
    if (currentApp === 'hub') {
      setZooming(false);
      // Clear launch timers to prevent race conditions (black screen return bug)
      launchTimers.current.forEach(clearTimeout);
      launchTimers.current = [];
      (window as any).studioTransitionActive = false;
    }
  }, [currentApp]);

  // Safety watchdog: recover from stuck zooming state on the Hub
  useEffect(() => {
    let watchdogTimer: ReturnType<typeof setTimeout> | undefined;
    if (currentApp === 'hub' && zooming) {
      watchdogTimer = setTimeout(() => {
        console.warn('[Safety] Hub zooming stuck on Hub mode for too long, forcing reset.');
        setZooming(false);
        (window as any).studioTransitionActive = false;
      }, 600);
    }
    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
  }, [currentApp, zooming]);

  useEffect(() => {
    const handleReset = () => {
      setZooming(false);
    };
    window.addEventListener('studio:reset-hub-zooming', handleReset);
    return () => window.removeEventListener('studio:reset-hub-zooming', handleReset);
  }, []);

  const sessionIdx = getSessionIndex();
  const greetName = authUser?.displayName?.trim() || settings.hubUserName;
  const { greeting, subtitle } = useMemo(
    () => getGreetingPair(greetName, sessionIdx, lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [greetName, lang]
  );

  const formatTimeAgo = useCallback(
    (timeInput: any): string => {
      try {
        const date = new Date(timeInput);
        if (isNaN(date.getTime())) return 'Recent';
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return lang === 'es' ? 'ahora mismo' : 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return lang === 'es' ? `hace ${minutes} min` : `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return lang === 'es' ? `hace ${hours} h` : `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return lang === 'es' ? 'ayer' : 'yesterday';
        if (days < 7) return lang === 'es' ? `hace ${days} días` : `${days}d ago`;
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return 'Recent';
      }
    },
    [lang]
  );

  const loadRecentSessions = useCallback(() => {
    const list: {
      app: 'chordex' | 'drumex' | 'groovex';
      title: string;
      appName: string;
      timestamp: string;
      action: () => void;
    }[] = [];
    try {
      const chordex = localStorage.getItem('chord-explorer-storage-v3');
      if (chordex) {
        const parsed = JSON.parse(chordex);
        const state = parsed.state || {};
        (state.presets || []).forEach((p: any) => {
          list.push({
            app: 'chordex',
            title: p.name || p.title || 'Untitled Chordex Preset',
            appName: 'Chordex',
            timestamp: p.updatedAt ? formatTimeAgo(p.updatedAt) : 'Recent',
            action: () => {
              launchApp('chordex');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'chordex', page: 'library' });
              }, 150);
            },
          });
        });
        (state.progressions || []).forEach((p: any) => {
          list.push({
            app: 'chordex',
            title: p.name || p.title || 'Untitled Progression',
            appName: 'Chordex',
            timestamp: p.updatedAt ? formatTimeAgo(p.updatedAt) : 'Recent',
            action: () => {
              launchApp('chordex');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'chordex', page: 'songs' });
              }, 150);
            },
          });
        });
      }
    } catch {}

    try {
      const drumex = localStorage.getItem('chordex-drums');
      if (drumex) {
        const parsed = JSON.parse(drumex);
        const state = parsed.state || {};
        (state.drumSongs || []).forEach((s: any) => {
          list.push({
            app: 'drumex',
            title: s.name || s.title || 'Untitled Drum Song',
            appName: 'Drumex',
            timestamp: s.updatedAt ? formatTimeAgo(s.updatedAt) : 'Recent',
            action: () => {
              launchApp('drumex');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'drumex', page: 'songs' });
              }, 150);
            },
          });
        });
      }
    } catch {}

    try {
      const groovex = localStorage.getItem('groovex-storage-v1');
      if (groovex) {
        const parsed = JSON.parse(groovex);
        const state = parsed.state || {};
        (state.recentSongs || []).forEach((s: any) => {
          list.push({
            app: 'groovex',
            title: s.name || s.title || s.artist || 'Untitled Groovex Song',
            appName: 'Groovex',
            timestamp: s.playedAt ? formatTimeAgo(s.playedAt) : 'Recent',
            action: () => {
              launchApp('groovex');
            },
          });
        });
      }
    } catch {}

    return list.slice(0, 3);
  }, [formatTimeAgo, launchApp]);

  return (
    <div
      data-livex-hub-root="true"
      style={{
        position: 'relative',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        fontFamily: 'Manrope, sans-serif',
        transform: zooming ? 'scale(1.10)' : 'scale(1)',
        opacity: zooming ? 0 : 1,
        transition: zooming
          ? 'transform 285ms cubic-bezier(0.4,0,1,1), opacity 210ms ease-in, background-color 700ms cubic-bezier(0.4,0,0.2,1)'
          : 'transform 285ms cubic-bezier(0.16, 1, 0.3, 1), opacity 285ms ease-out, background-color 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: introFinished ? 'auto' : 'none',
      }}
    >
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}
      >
        <SharedNavigationContainer
          activeView={tab}
          viewOrder={['home', 'settings', 'profile', 'help']}
          variant="fade-through"
        >
          {(tabId) => {
            const currentScrollRef =
              tabId === 'home'
                ? homeScrollRef
                : tabId === 'profile'
                  ? profileScrollRef
                  : tabId === 'settings'
                    ? settingsScrollRef
                    : helpScrollRef;
            return (
              <div
                ref={currentScrollRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {' '}
                {/* 🏠 HOME TAB */}
                {tabId === 'home' && (
                  <div
                    data-hub-tab-content
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0 20px',
                      paddingTop:
                        'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 36px)',
                      paddingBottom:
                        'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 110px)',
                    }}
                  >
                    {/* Dashboard Contents Scroll Area */}
                    <div
                      style={{ width: '100%', maxWidth: 'var(--content-max-w, 420px)' }}
                      className="flex flex-col gap-6 w-full"
                    >
                      {/* Greetings Section & Logo Header Row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          padding: '0 2px',
                        }}
                      >
                        <section
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <h2
                            style={{
                              fontFamily: 'Manrope, sans-serif',
                              fontWeight: 850,
                              color: 'var(--c-text-primary)',
                              letterSpacing: '-0.035em',
                              fontSize: '28px',
                              lineHeight: 1.15,
                              margin: 0,
                            }}
                          >
                            {greeting}
                          </h2>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              color: 'var(--c-text-secondary)',
                              fontSize: '13px',
                              fontWeight: 500,
                              letterSpacing: '-0.01em',
                              margin: 0,
                              opacity: 0.82,
                            }}
                          >
                            {subtitle}
                          </p>
                        </section>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: 16,
                            cursor: 'pointer',
                          }}
                        >
                          <StudioLogo size={32} />
                        </motion.div>
                      </div>

                      {/* Pinned Quick Actions Section */}
                      <section
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 2px',
                          }}
                        >
                          <h3
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '9.5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.14em',
                              fontWeight: 800,
                              color: 'var(--c-text-tertiary, #808080)',
                              margin: 0,
                            }}
                          >
                            {lang === 'es' ? 'Acciones Fijadas' : 'Pinned Actions'}
                          </h3>
                          {isEditMode ? (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setIsEditMode(false)}
                              style={{
                                background: accent.from,
                                border: 'none',
                                color: '#000',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '11px',
                                fontWeight: 750,
                                borderRadius: 9999,
                                padding: '3px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                boxShadow: `0 2px 8px ${accent.from}40`,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 13, lineHeight: 1 }}
                              >
                                check
                              </span>
                              {lang === 'es' ? 'Listo' : 'Done'}
                            </motion.button>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setShortcutPickerOpen(true)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.10)',
                                color: accent.from,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '11px',
                                fontWeight: 650,
                                borderRadius: 9999,
                                padding: '3px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 13, lineHeight: 1 }}
                              >
                                add
                              </span>
                              {lang === 'es' ? 'Fijar' : 'Pin'}
                            </motion.button>
                          )}
                        </div>

                        <div ref={gridRef} style={{ position: 'relative', width: '100%' }}>
                          <Reorder.Group
                            axis="x"
                            values={shortcuts}
                            onReorder={(newShortcuts) => {
                              setShortcuts(newShortcuts);
                              localStorage.setItem(
                                'studio:quick-shortcuts',
                                JSON.stringify(newShortcuts)
                              );
                            }}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(5, 1fr)',
                              gap: '10px',
                              padding: '2px 0 6px',
                              listStyle: 'none',
                              margin: 0,
                            }}
                          >
                            {shortcuts.slice(0, 5).map((id) => {
                              const opt = ALL_SHORTCUT_OPTIONS.find((o) => o.id === id);
                              if (!opt) return null;
                              const mappedLabel = SHORTCUT_LABEL_MAP[id] || {
                                en: opt.titleEn.split(' ')[0],
                                es: opt.titleEs.split(' ')[0],
                              };
                              const displayLabel = lang === 'es' ? mappedLabel.es : mappedLabel.en;

                              return (
                                <Reorder.Item
                                  key={id}
                                  value={id}
                                  drag={isEditMode ? 'x' : false}
                                  dragConstraints={gridRef}
                                  dragElastic={0}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: isEditMode ? 'grab' : 'pointer',
                                    position: 'relative',
                                    userSelect: 'none',
                                  }}
                                  onPointerDown={startLongPressTimer}
                                  onPointerUp={clearLongPressTimer}
                                  onPointerCancel={clearLongPressTimer}
                                  onPointerLeave={clearLongPressTimer}
                                  onClick={() => {
                                    if (!isEditMode) {
                                      handleShortcutClick(id);
                                    }
                                  }}
                                >
                                  <motion.div
                                    whileTap={isEditMode ? undefined : { scale: 0.9 }}
                                    whileHover={isEditMode ? undefined : { scale: 1.06, y: -2 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                    animate={
                                      isEditMode
                                        ? {
                                            rotate: [0, -1.5, 0, 1.5, 0],
                                            transition: {
                                              duration: 0.26,
                                              repeat: Infinity,
                                              ease: 'easeInOut',
                                            },
                                          }
                                        : { rotate: 0 }
                                    }
                                    style={{
                                      width: '52px',
                                      height: '52px',
                                      borderRadius: '16px',
                                      background: isLight
                                        ? 'linear-gradient(160deg, rgba(255, 255, 255, 0.90) 0%, rgba(240, 244, 255, 0.75) 100%)'
                                        : 'linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                      border: isLight
                                        ? '1px solid rgba(255, 255, 255, 0.95)'
                                        : '1px solid rgba(255, 255, 255, 0.12)',
                                      backdropFilter: 'blur(24px) saturate(180%)',
                                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                                      boxShadow: isLight
                                        ? '0 6px 20px rgba(0, 0, 0, 0.06), inset 0 1.5px 2px rgba(255, 255, 255, 0.95), 0 2px 6px rgba(0, 0, 0, 0.03)'
                                        : '0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.20), 0 2px 8px rgba(0, 0, 0, 0.18)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      position: 'relative',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {/* Top Specular Rim */}
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 4,
                                        right: 4,
                                        height: '1px',
                                        background: 'var(--surface-glass-rim)',
                                        pointerEvents: 'none',
                                        opacity: 0.8,
                                      }}
                                    />
                                    <span
                                      className="material-symbols-outlined"
                                      style={{
                                        color: accent.from,
                                        fontSize: '22px',
                                      }}
                                    >
                                      {opt.icon}
                                    </span>

                                    {isEditMode && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newShortcuts = shortcuts.filter((x) => x !== id);
                                          setShortcuts(newShortcuts);
                                          localStorage.setItem(
                                            'studio:quick-shortcuts',
                                            JSON.stringify(newShortcuts)
                                          );
                                        }}
                                        style={{
                                          position: 'absolute',
                                          top: 2,
                                          right: 2,
                                          background: '#ef4444',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: 18,
                                          height: 18,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: 0,
                                          zIndex: 20,
                                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                                        }}
                                      >
                                        <span
                                          className="material-symbols-outlined"
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 'bold',
                                            lineHeight: 1,
                                          }}
                                        >
                                          close
                                        </span>
                                      </button>
                                    )}
                                  </motion.div>
                                  <span
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 650,
                                      color: 'var(--c-text-secondary)',
                                      marginTop: '6px',
                                      textAlign: 'center',
                                      width: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      letterSpacing: '-0.015em',
                                      fontFamily: 'Inter, sans-serif',
                                    }}
                                  >
                                    {displayLabel}
                                  </span>
                                </Reorder.Item>
                              );
                            })}

                            {shortcuts.length < 5 && !isEditMode && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setShortcutPickerOpen(true)}
                              >
                                <motion.div
                                  whileTap={{ scale: 0.9 }}
                                  whileHover={{ scale: 1.06, y: -2 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                  style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1.5px dashed rgba(255, 255, 255, 0.20)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      color: 'var(--c-text-secondary)',
                                      fontSize: '20px',
                                      opacity: 0.7,
                                    }}
                                  >
                                    add
                                  </span>
                                </motion.div>
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 650,
                                    color: 'var(--c-text-secondary)',
                                    marginTop: '6px',
                                    textAlign: 'center',
                                    opacity: 0.7,
                                    letterSpacing: '-0.015em',
                                    fontFamily: 'Inter, sans-serif',
                                  }}
                                >
                                  {lang === 'es' ? 'Añadir' : 'Add'}
                                </span>
                              </div>
                            )}
                          </Reorder.Group>
                        </div>
                      </section>

                      {/* Studio Modules grid columns */}
                      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '9.5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            fontWeight: 800,
                            color: 'var(--c-text-tertiary, #808080)',
                            margin: 0,
                            padding: '0 2px',
                          }}
                        >
                          {lang === 'es' ? 'Módulos del Ecosistema' : 'Livex Modules'}
                        </h3>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                          className="w-full"
                        >
                          {(
                            [
                              {
                                app: 'chordex' as TargetApp,
                                Logo: ChordexLogo,
                                name: 'Chordex',
                                desc: t.hub.chordexDesc,
                                color: '#a855f7',
                                active: activeRouteApp === 'chordex',
                              },
                              {
                                app: 'drumex' as TargetApp,
                                Logo: DrumexLogo,
                                name: 'Drumex',
                                desc: t.hub.drumexDesc,
                                color: '#ec4899',
                                active: activeRouteApp === 'drumex',
                              },
                              {
                                app: 'stagex' as TargetApp,
                                Logo: StagexLogoIcon,
                                name: 'Stagex',
                                desc: t.hub.stagexDesc,
                                color: '#3b82f6',
                                active: activeRouteApp === 'stagex',
                              },
                              {
                                app: 'groovex' as TargetApp,
                                Logo: GroovexLogo,
                                name: 'Groovex',
                                desc: t.hub.groovexDesc,
                                color: '#10b981',
                                active: activeRouteApp === 'groovex',
                              },
                              {
                                app: 'vocalex' as TargetApp,
                                Logo: VocalexLogo,
                                name: 'Vocalex',
                                desc: t.hub.vocalexDesc,
                                color: '#f59e0b',
                                active: activeRouteApp === 'vocalex',
                              },
                            ] as {
                              app: TargetApp;
                              Logo: any;
                              name: string;
                              desc: string;
                              color: string;
                              active?: boolean;
                            }[]
                          ).map(({ app, Logo, name, desc, color, active }) => (
                            <motion.button
                              key={app}
                              onClick={() => launchApp(app)}
                              whileTap={{ scale: 0.975 }}
                              whileHover={{ scale: 1.015, y: -1 }}
                              transition={SpringPresets.soft}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '14px 16px',
                                background: isLight
                                  ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
                                  : 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
                                border: active
                                  ? `1.5px solid ${color}`
                                  : isLight
                                    ? '1px solid rgba(0, 0, 0, 0.06)'
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                boxSizing: 'border-box',
                                outline: 'none',
                                position: 'relative',
                                justifyContent: 'space-between',
                                backdropFilter: 'var(--surface-float-blur)',
                                WebkitBackdropFilter: 'var(--surface-float-blur)',
                                boxShadow: isLight
                                  ? '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                                  : '0 8px 24px rgba(0, 0, 0, 0.20), inset 0 1px 1px rgba(255, 255, 255, 0.10)',
                                overflow: 'hidden',
                              }}
                              className="sc-module-card group"
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 14,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${color}24 0%, ${color}0c 100%)`,
                                    border: `1px solid ${color}40`,
                                    boxShadow: `0 4px 14px ${color}22, inset 0 1px 1px rgba(255, 255, 255, 0.35)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: color,
                                    flexShrink: 0,
                                  }}
                                >
                                  <Logo size={22} />
                                </div>
                                <div
                                  style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      style={{
                                        fontSize: '15.5px',
                                        fontWeight: 800,
                                        color: 'var(--c-text-primary)',
                                        fontFamily: 'Manrope, sans-serif',
                                        letterSpacing: '-0.02em',
                                      }}
                                    >
                                      {name}
                                    </span>
                                    {active && (
                                      <span
                                        style={{
                                          fontSize: '8.5px',
                                          padding: '2px 6px',
                                          borderRadius: '9999px',
                                          backgroundColor: `${color}22`,
                                          border: `1px solid ${color}40`,
                                          color: color,
                                          fontWeight: 800,
                                          fontFamily: 'Inter, sans-serif',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 3,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            background: color,
                                          }}
                                        />
                                        {lang === 'es' ? 'En Vivo' : 'Live'}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--c-text-secondary)',
                                      fontFamily: 'Inter, sans-serif',
                                      fontWeight: 500,
                                      marginTop: '2px',
                                      lineHeight: 1.3,
                                      opacity: 0.82,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {desc}
                                  </span>
                                </div>
                              </div>

                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: isLight
                                    ? 'rgba(0,0,0,0.03)'
                                    : 'rgba(255,255,255,0.04)',
                                  border: isLight
                                    ? '1px solid rgba(0,0,0,0.05)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginLeft: 8,
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{
                                    fontSize: 16,
                                    color: 'var(--c-text-secondary)',
                                    opacity: 0.6,
                                    lineHeight: 1,
                                  }}
                                >
                                  chevron_right
                                </span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
                {/* ⚙️ SETTINGS TAB */}
                {tabId === 'settings' && (
                  <HubSettings
                    accent={accent}
                    scrollRef={settingsScrollRef}
                    authUser={authUser}
                    tab={tab}
                    setTab={setTab}
                    showDevToast={showDevToast}
                    handleLogoTap={handleLogoTap}
                    devToast={devToast}
                    renderDevToast={renderDevToast}
                  />
                )}
                {/* 👤 PROFILE TAB */}
                {tabId === 'profile' && (
                  <>
                    <HubSettings
                      accent={accent}
                      scrollRef={profileScrollRef}
                      authUser={authUser}
                      onProfile={() => {
                        NavigationDispatcher.push({ app: 'hub', tab: 'profile' });
                      }}
                      tab={tab}
                      setTab={setTab}
                      showDevToast={showDevToast}
                      handleLogoTap={handleLogoTap}
                      devToast={devToast}
                      renderDevToast={renderDevToast}
                    />

                    {/* Premium Login Success Check Overlay */}
                    {successAnimationState !== 'hidden' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          zIndex: 9999,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(10, 10, 12, 0.72)',
                          backdropFilter: 'blur(20px)', // token-guard-ignore
                          WebkitBackdropFilter: 'blur(20px)', // token-guard-ignore
                          animation:
                            successAnimationState === 'entering'
                              ? 'success-fade-in-blur 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
                              : 'success-fade-out-blur 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                      >
                        <style>{`
                          @keyframes success-fade-in-blur {
                            from { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
                            to { opacity: 1; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); } // token-guard-ignore
                          }
                          @keyframes success-fade-out-blur {
                            from { opacity: 1; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); transform: scale(1); } // token-guard-ignore
                            to { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); transform: scale(0.95); filter: blur(8px); }
                          }
                          @keyframes success-pop {
                            0% { transform: scale(0.85) translateY(16px); opacity: 0; }
                            100% { transform: scale(1) translateY(0); opacity: 1; }
                          }
                          @keyframes draw-circle {
                            0% { stroke-dashoffset: 166; }
                            100% { stroke-dashoffset: 0; }
                          }
                          @keyframes draw-check {
                            0% { stroke-dashoffset: 48; }
                            100% { stroke-dashoffset: 0; }
                          }
                          @keyframes draw-ripple {
                            0% { transform: scale(1); opacity: 0.6; stroke-width: 4px; }
                            100% { transform: scale(1.4); opacity: 0; stroke-width: 0.5px; }
                          }
                          @keyframes fade-circle-fill {
                            from { fill: rgba(16, 185, 129, 0); }
                            to { fill: rgba(16, 185, 129, 0.06); }
                          }
                          @keyframes fade-in-up-stagger {
                            from { opacity: 0; transform: translateY(8px); }
                            to { opacity: 1; transform: translateY(0); }
                          }
                          .success-card {
                            padding: 40px 32px;
                            border-radius: 32px;
                            background: var(--app-surface, rgba(20, 20, 24, 0.8));
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
                            text-align: center;
                            max-width: 320px;
                            width: calc(100% - 40px);
                            animation: success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                          }
                          .success-svg {
                            width: 76px;
                            height: 76px;
                            display: block;
                            margin: 0 auto 24px;
                            overflow: visible;
                          }
                          .success-circle {
                            stroke-dasharray: 166;
                            stroke-dashoffset: 166;
                            stroke-linecap: round;
                            animation: draw-circle 0.65s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                            animation-delay: 0.05s;
                          }
                          .success-circle-fill {
                            animation: fade-circle-fill 0.4s ease forwards;
                            animation-delay: 0.6s;
                          }
                          .success-check {
                            stroke-dasharray: 48;
                            stroke-dashoffset: 48;
                            animation: draw-check 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            animation-delay: 0.55s;
                          }
                          .success-ripple {
                            transform-origin: center;
                            animation: draw-ripple 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                          }
                          .success-ripple-1 {
                            animation-delay: 0.4s;
                          }
                          .success-ripple-2 {
                            animation-delay: 0.62s;
                          }
                          .success-title {
                            margin: 0 0 8px;
                            font-family: 'Manrope', sans-serif;
                            font-weight: 800;
                            font-size: 20px;
                            color: var(--c-text-primary);
                            animation: fade-in-up-stagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                            animation-delay: 0.78s;
                          }
                          .success-text {
                            margin: 0;
                            font-family: 'Inter', sans-serif;
                            font-size: 12.5px;
                            color: var(--c-text-secondary);
                            line-height: 1.4;
                            word-break: break-all;
                            animation: fade-in-up-stagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                            animation-delay: 0.9s;
                          }
                        `}</style>
                        <div className="success-card">
                          <svg className="success-svg" viewBox="0 0 52 52" fill="none">
                            <circle
                              className="success-circle success-circle-fill"
                              cx="26"
                              cy="26"
                              r="25"
                              stroke="#10b981"
                              strokeWidth="4"
                            />
                            <circle
                              className="success-ripple success-ripple-1"
                              cx="26"
                              cy="26"
                              r="25"
                              stroke="#10b981"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              className="success-ripple success-ripple-2"
                              cx="26"
                              cy="26"
                              r="25"
                              stroke="#10b981"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="success-check"
                              stroke="#10b981"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.1 27.2l7.1 7.2 16.7-16.8"
                            />
                          </svg>
                          <h3 className="success-title">{t.hub.accountSection.signedIn}</h3>
                          <p className="success-text">{successName}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* ❓ HELP TAB */}
                {tabId === 'help' && (
                  <HubHelp accent={accent} authUser={authUser} tab={tab} setTab={setTab} />
                )}
              </div>
            );
          }}
        </SharedNavigationContainer>
      </div>

      {/* ── Bottom nav ── */}

      {/* UpdateIndicator is now hoisted to AppShell so it appears on
          every screen, not just the Hub. */}

      {/* 🛠️ Customizable Quick Actions Picker Modal */}
      {shortcutPickerOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 10, 12, 0.65)',
            backdropFilter: 'blur(20px)', // token-guard-ignore
            WebkitBackdropFilter: 'blur(20px)', // token-guard-ignore
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'picker-fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
          onClick={() => setShortcutPickerOpen(false)}
        >
          <style>{`
            @keyframes picker-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes picker-slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--app-surface-low, #141418)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              border: '1px solid var(--c-border)',
              borderBottom: 'none',
              padding: '16px 18px', // token-guard-ignore
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '78vh',
              animation: 'picker-slide-up 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Grab handle */}
            <div
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                background: 'var(--c-border)',
                margin: '0 auto 12px',
                opacity: 0.8,
              }}
            />

            {/* Header with Title and Counter badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 2,
              }}
            >
              <h3
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                }}
              >
                {lang === 'es' ? 'Acciones Rápidas' : 'Customize Quick Actions'}
              </h3>
              <span
                style={{
                  fontSize: 'var(--font-section-label)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background:
                    shortcuts.length >= 5 ? 'rgba(239, 68, 68, 0.12)' : 'var(--app-surface)',
                  color: shortcuts.length >= 5 ? '#ef4444' : 'var(--c-text-secondary)',
                  border: '1px solid var(--c-border)',
                }}
              >
                {shortcuts.length}/5 {lang === 'es' ? 'activos' : 'active'}
              </span>
            </div>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                color: 'var(--c-text-secondary)',
                margin: '0 0 12px 0',
                opacity: 0.8,
              }}
            >
              {lang === 'es'
                ? 'Arrastra para reordenar. Elige hasta 5 accesos directos.'
                : 'Drag to reorder. Select up to 5 quick shortcuts.'}
            </p>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                paddingRight: 2,
              }}
              className="hide-scrollbar"
            >
              {/* Active Shortcuts Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <h4
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'var(--font-section-label)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--c-text-secondary)',
                      opacity: 0.7,
                      margin: 0,
                    }}
                  >
                    {lang === 'es' ? 'Atajos Activos' : 'Active Shortcuts'}
                  </h4>
                  {shortcuts.length > 1 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        color: 'var(--c-text-secondary)',
                        opacity: 0.6,
                      }}
                    >
                      {lang === 'es' ? 'Arrastra para ordenar' : 'Drag to reorder'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {shortcuts.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        opacity: 0.6,
                        padding: '10px 12px',
                        border: '1px dashed var(--c-border)',
                        borderRadius: 10,
                        textAlign: 'center',
                      }}
                    >
                      {lang === 'es'
                        ? 'Ninguno seleccionado. Agrega algunos abajo.'
                        : 'No active shortcuts. Add options below.'}
                    </div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={shortcuts}
                      onReorder={(newShortcuts) => {
                        setShortcuts(newShortcuts);
                        localStorage.setItem(
                          'studio:quick-shortcuts',
                          JSON.stringify(newShortcuts)
                        );
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: 0,
                        margin: 0,
                        listStyle: 'none',
                      }}
                    >
                      {shortcuts.map((id) => {
                        const opt = ALL_SHORTCUT_OPTIONS.find((o) => o.id === id);
                        if (!opt) return null;
                        return (
                          <Reorder.Item
                            key={id}
                            value={id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 10px',
                              background: 'var(--app-surface)',
                              border: '1px solid var(--c-border)',
                              borderRadius: 10,
                              cursor: 'grab',
                              userSelect: 'none',
                              touchAction: 'none',
                            }}
                            whileDrag={{
                              scale: 1.02,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                              background: 'var(--app-surface-bright, var(--app-surface))',
                              cursor: 'grabbing',
                              zIndex: 10,
                            }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.4,
                                  fontSize: 16,
                                  cursor: 'grab',
                                }}
                              >
                                drag_indicator
                              </span>
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 7,
                                  background: 'var(--app-surface-low)',
                                  border: '1px solid var(--c-border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ color: accent.from, fontSize: 15 }}
                                >
                                  {opt.icon}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    color: 'var(--c-text-primary)',
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {lang === 'es' ? opt.titleEs : opt.titleEn}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const newShortcuts = shortcuts.filter((x) => x !== id);
                                setShortcuts(newShortcuts);
                                localStorage.setItem(
                                  'studio:quick-shortcuts',
                                  JSON.stringify(newShortcuts)
                                );
                              }}
                              title={lang === 'es' ? 'Quitar' : 'Remove'}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                transition: 'transform 120ms ease, background 120ms ease',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 14, fontWeight: 700 }}
                              >
                                remove
                              </span>
                            </button>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                  )}
                </div>
              </div>

              {/* Available Shortcuts Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <h4
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'var(--font-section-label)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--c-text-secondary)',
                      opacity: 0.7,
                      margin: 0,
                    }}
                  >
                    {lang === 'es' ? 'Atajos Disponibles' : 'Available Shortcuts'}
                  </h4>
                  {shortcuts.length >= 5 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        color: '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      {lang === 'es' ? 'Máximo alcanzado' : 'Limit reached'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ALL_SHORTCUT_OPTIONS.filter((o) => !shortcuts.includes(o.id)).map((opt) => {
                    const isLimitReached = shortcuts.length >= 5;
                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          background: 'var(--app-surface-low)',
                          border: '1px solid var(--c-border)',
                          borderRadius: 10,
                          opacity: isLimitReached ? 0.6 : 1,
                          transition: 'opacity 180ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: 'var(--app-surface)',
                              border: '1px solid var(--c-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ color: 'var(--c-text-secondary)', fontSize: 15 }}
                            >
                              {opt.icon}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                              style={{
                                fontSize: 12.5,
                                color: 'var(--c-text-primary)',
                                fontWeight: 550,
                                lineHeight: 1.2,
                              }}
                            >
                              {lang === 'es' ? opt.titleEs : opt.titleEn}
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={isLimitReached}
                          onClick={() => {
                            const newShortcuts = [...shortcuts, opt.id];
                            setShortcuts(newShortcuts);
                            localStorage.setItem(
                              'studio:quick-shortcuts',
                              JSON.stringify(newShortcuts)
                            );
                          }}
                          title={
                            isLimitReached
                              ? lang === 'es'
                                ? 'Máximo alcanzado'
                                : 'Limit reached (5/5)'
                              : lang === 'es'
                                ? 'Agregar'
                                : 'Add'
                          }
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isLimitReached ? 'transparent' : accent.from,
                            border: isLimitReached ? '1px solid var(--c-border)' : 'none',
                            color: isLimitReached ? 'var(--c-text-secondary)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isLimitReached ? 'default' : 'pointer',
                            padding: 0,
                            flexShrink: 0,
                            opacity: isLimitReached ? 0.4 : 1,
                            transition: 'transform 120ms ease, opacity 120ms ease',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, fontWeight: 700 }}
                          >
                            add
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setShortcutPickerOpen(false)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 12,
                background: accent.from,
                color: '#ffffff',
                border: 'none',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: `0 4px 12px ${accent.from}25`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                check
              </span>
              {lang === 'es' ? 'Listo' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── App row (list item inside the combined card) ───────────────────────────────
function AppRow({
  app,
  Logo,
  name,
  desc,
  last,
  onClick,
}: {
  app: TargetApp;
  Logo: React.FC<{ size: number }>;
  name: string;
  desc: string;
  last: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const isWebDesktop = useIsWebDesktop();

  if (isWebDesktop) {
    return (
      <button
        onClick={onClick}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 14px',
          background: pressed
            ? 'var(--hub-card-pressed-bg, rgba(255, 255, 255, 0.04))'
            : 'var(--hub-card-bg, rgba(255, 255, 255, 0.01))',
          border: '1px solid var(--hub-card-border, rgba(255, 255, 255, 0.06))',
          borderRadius: '10px',
          cursor: 'pointer',
          textAlign: 'left',
          transform: pressed ? 'scale(0.99)' : 'scale(1)',
          transition: 'all 150ms ease',
          marginBottom: '8px',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: 'var(--hub-card-icon-bg, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--hub-card-icon-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--c-text-primary)',
          }}
        >
          <Logo size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--c-text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </p>
          <p
            style={{
              fontSize: 10,
              color: 'var(--c-text-secondary)',
              margin: '2px 0 0',
              fontWeight: 500,
            }}
          >
            {desc}
          </p>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: 'var(--c-text-muted)', flexShrink: 0 }}
        >
          chevron_right
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '13px 18px',
        background: pressed ? 'rgba(128,128,128,0.07)' : 'transparent',
        border: 'none',
        borderBottom: last ? 'none' : '1px solid rgba(128,128,128,0.08)',
        cursor: 'pointer',
        textAlign: 'left',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'background 100ms ease, transform 120ms cubic-bezier(0.34,1.15,0.64,1)',
        boxSizing: 'border-box',
      }}
    >
      {/* Icon pill */}
      <div
        data-intro-target={app}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          flexShrink: 0,
          background: 'rgba(128,128,128,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-text-primary)',
        }}
      >
        <Logo size={22} />
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--c-text-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--c-text-secondary)',
            margin: '2px 0 0',
            fontWeight: 500,
          }}
        >
          {desc}
        </p>
      </div>

      {/* Chevron */}
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: 'var(--c-text-secondary)', flexShrink: 0, opacity: 0.5 }}
      >
        chevron_right
      </span>
    </button>
  );
}

// ── Hub settings ──────────────────────────────────────────────────────────────

type SettingsPageId =
  | 'main'
  | 'general'
  | 'appearance'
  | 'language'
  | 'privacy'
  | 'about'
  | 'updater'
  | 'notifications'
  | 'debug'
  | 'developer'
  | 'profile'
  | 'help-center'
  | 'faq'
  | 'release-notes'
  | 'download-apps'
  | 'keyboard-shortcuts'
  | 'terms'
  | 'privacy-policy'
  | 'bug-report'
  | 'personal-info'
  | 'security-login'
  | 'subscription'
  | 'devices-sessions'
  | 'privacy-data'
  | 'licenses'
  | 'changelog';

function formatHour(h: number): string {
  if (h === 0) return '12 am';
  if (h < 12) return `${h} am`;
  if (h === 12) return '12 pm';
  return `${h - 12} pm`;
}

const HUB_SETTINGS_CSS = `
  @keyframes hub-slide-in {
    from { transform: translateX(32px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes hub-slide-back {
    from { transform: translateX(-24px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes hub-row-fade {
    from { transform: translateY(7px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes hub-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes profile-sheet-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes profile-dd-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes profile-dd-item-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes profile-burst-out {
    from { opacity: 0; transform: scale(0.12); transform-origin: top left; }
    to   { opacity: 1; transform: scale(1);   transform-origin: top left; }
  }
  input[type=range].hue-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 10px;
    border-radius: 5px;
    outline: none;
    cursor: pointer;
    display: block;
    width: 100%;
    margin: 14px 0;
  }
  input[type=range].hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: hsl(var(--slider-hue, 0), 85%, 60%);
    border: 3px solid #ffffff;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.35),
      0 0 10px hsla(var(--slider-hue, 0), 85%, 60%, 0.4);
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  input[type=range].hue-slider:active::-webkit-slider-thumb {
    transform: scale(1.18);
    box-shadow:
      0 3px 12px rgba(0,0,0,0.45),
      0 0 16px hsla(var(--slider-hue, 0), 85%, 60%, 0.6);
  }
  input[type=range].hue-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: hsl(var(--slider-hue, 0), 85%, 60%);
    border: 3px solid #ffffff;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.35),
      0 0 10px hsla(var(--slider-hue, 0), 85%, 60%, 0.4);
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease;
    border: none;
  }
  input[type=range].hue-slider:active::-moz-range-thumb {
    transform: scale(1.18);
    box-shadow:
      0 3px 12px rgba(0,0,0,0.45),
      0 0 16px hsla(var(--slider-hue, 0), 85%, 60%, 0.6);
  }
  @keyframes sync-spin-kf {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .sync-spin {
    animation: sync-spin-kf 1.1s linear infinite;
    display: inline-block;
  }
  @media (max-width: 480px) {
    .about-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
      padding: 10px 0 !important;
    }
    .about-row span:last-child {
      text-align: left !important;
      margin-right: 0 !important;
      word-break: break-all !important;
    }
  }
  @media (max-width: 360px) {
    .settings-panel-sheet {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  }
`;

function SettingsNavRow({
  icon,
  iconColor,
  title,
  desc,
  onPress,
  last = false,
  placeholder = false,
  delay = 0,
  badge,
}: {
  icon: string;
  iconColor?: string;
  title: string;
  desc?: string;
  onPress: () => void;
  last?: boolean;
  placeholder?: boolean;
  delay?: number;
  badge?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={placeholder ? () => {} : onPress}
      onPointerDown={() => !placeholder && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '13px 16px',
        background: pressed ? 'rgba(128,128,128,0.06)' : 'transparent',
        border: 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        borderBottom: last ? 'none' : '1px solid rgba(128,128,128,0.07)',
        cursor: placeholder ? 'default' : 'pointer',
        textAlign: 'left',
        transform: pressed ? 'scale(0.977)' : 'scale(1)',
        transition: 'background 100ms ease, transform 140ms cubic-bezier(0.34,1.15,0.64,1)',
        boxSizing: 'border-box',
        opacity: placeholder ? 0.38 : 1,
        animation: `hub-row-fade 380ms ease ${delay}ms both`,
        transformOrigin: 'center center',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 22,
          flexShrink: 0,
          color: iconColor ?? 'var(--c-text-secondary)',
          fontVariationSettings: "'FILL' 1",
          opacity: 0.75,
          width: 26,
          textAlign: 'center',
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--c-text-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
            fontFamily: 'Manrope',
          }}
        >
          {title}
        </p>
        {desc && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--c-text-secondary)',
              margin: '2px 0 0',
              fontWeight: 500,
              fontFamily: 'Inter',
              lineHeight: 1.3,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      {badge && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'Manrope',
            padding: '3px 7px',
            borderRadius: 999,
            background: 'rgba(128,128,128,0.12)',
            color: 'var(--c-text-secondary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
      {!placeholder && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--c-text-secondary)', flexShrink: 0, opacity: 0.45 }}
        >
          chevron_right
        </span>
      )}
    </button>
  );
}

function SettingsSectionLabel({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        margin: '28px 0 12px 4px',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-section-label)',
          fontWeight: 800,
          color: 'var(--c-text-secondary)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: 'Manrope',
        }}
      >
        {children}
      </span>
      <div
        style={{
          height: '1px',
          flex: 1,
          backgroundColor: 'rgba(128, 128, 128, 0.08)',
          marginLeft: '16px',
        }}
      />
    </div>
  );
}

function GlobalHint() {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '6px 4px 0' }}>
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          fontVariationSettings: "'FILL' 1",
          flexShrink: 0,
        }}
      >
        public
      </span>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--font-section-label)',
          fontWeight: 600,
          color: 'var(--c-text-secondary)',
          fontFamily: 'Inter',
          letterSpacing: '0.01em',
        }}
      >
        {t.hub.appliesToAll}
      </p>
    </div>
  );
}

function getUpdaterStatusText(updater: any, lang: string) {
  if (updater.loading) {
    if (['DOWNLOAD_APK', 'VERIFY_SHA256', 'PREPARING_INSTALL'].includes(updater.updateState)) {
      return lang === 'es' ? 'Descargando…' : 'Downloading...';
    }
    if (updater.updateState === 'INSTALLING') {
      return lang === 'es' ? 'Instalando…' : 'Installing...';
    }
    return lang === 'es' ? 'Buscando actualizaciones…' : 'Checking for updates...';
  }

  if (
    updater.updateState === 'WAITING_USER_CONFIRMATION' ||
    updater.updateState === 'PACKAGEINSTALLER_VISIBLE'
  ) {
    return lang === 'es' ? 'Listo para instalar' : 'Ready to install';
  }

  if (['INSTALL_FAILED', 'RECOVERY'].includes(updater.updateState)) {
    return lang === 'es' ? 'Error al instalar' : 'Failed';
  }

  if (updater.updateAvailable) {
    return lang === 'es' ? 'Actualización disponible' : 'Update available';
  }

  return lang === 'es' ? 'Estás al día' : 'Up to date';
}

function HubSettings({
  accent,
  scrollRef,
  authUser,
  onProfile,
  tab,
  setTab,
  showDevToast = () => {},
  handleLogoTap = () => {},
  devToast = null,
  renderDevToast = () => null,
}: {
  accent: { from: string; to: string; mid: string };
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  authUser?: AuthUser | null;
  onProfile?: () => void;
  tab: HubTab;
  setTab: React.Dispatch<React.SetStateAction<HubTab>>;
  showDevToast?: (msg: string) => void;
  handleLogoTap?: () => void;
  devToast?: string | null;
  renderDevToast?: () => React.ReactNode;
}) {
  const settings = useSettingsStore((state) => state.settings);
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const updater = useAppUpdate();
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const updatePerApp = useSettingsStore((state) => state.updatePerApp);
  const historyLength = useNavigationStore((s) => s.history.length);
  const { preferences, setPreference } = useStudioPreferences();
  const [langQuery, setLangQuery] = useState('');
  const t = useT();
  const lang = settings.language ?? 'en';
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedBugTemplate, setCopiedBugTemplate] = useState(false);
  const isWebDesktop = useIsWebDesktop();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    signedIn: false,
    phase: 'idle',
    syncing: false,
    lastSyncedMs: null,
    error: null,
    showMigrationPrompt: false,
    migrationChoice: null,
  });

  useEffect(() => {
    return subscribeSyncStatus((s) => {
      setSyncStatus(s);
    });
  }, []);
  const getInitialSettingsPage = () => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToUpdater') === '1') {
      sessionStorage.removeItem('studio:routeToUpdater');
      return 'notifications';
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToPrivacy') === '1') {
      sessionStorage.removeItem('studio:routeToPrivacy');
      return 'privacy';
    }
    const target =
      typeof window !== 'undefined' ? sessionStorage.getItem('studio:routeToSettingsPage') : null;
    if (target) {
      sessionStorage.removeItem('studio:routeToSettingsPage');
      return target as SettingsPageId;
    }
    return 'main';
  };

  const page = useNavigationStore((s) => {
    const last = s.history[s.history.length - 1];
    if (last?.tab === 'profile') {
      return (last.page ?? 'profile') as SettingsPageId;
    }
    return (last?.tab === 'settings' ? (last.page ?? 'main') : 'main') as SettingsPageId;
  });
  const pageKey = historyLength;

  const curLen = historyLength;
  const prevLenRef = useRef(curLen);
  const prevDirRef = useRef<'forward' | 'backward'>('forward');

  let slideDir: 'forward' | 'backward' = prevDirRef.current;
  if (curLen !== prevLenRef.current) {
    slideDir = curLen >= prevLenRef.current ? 'forward' : 'backward';
    prevDirRef.current = slideDir;
    prevLenRef.current = curLen;
  }

  const activePageId = page === 'main' ? 'general' : page;

  const sections = useMemo(() => {
    const list: {
      label: string;
      items: { id: SettingsPageId; icon: string; label: string }[];
    }[] = [];
    if (tab === 'profile') {
      list.push({
        label: t.hub.studioSettings.userLabel || (lang === 'es' ? 'Usuario' : 'User'),
        items: [
          {
            id: 'profile' as const,
            icon: 'account_circle',
            label:
              t.hub.studioSettings.profileTitle ||
              (lang === 'es' ? 'Perfil y Cuenta' : 'Profile & Account'),
          },
        ],
      });
    }
    list.push(
      {
        label:
          t.hub.studioSettings.preferencesLabel || (lang === 'es' ? 'Preferencias' : 'Preferences'),
        items: [
          {
            id: 'general' as const,
            icon: 'settings',
            label: t.hub.studioSettings.generalTitle || (lang === 'es' ? 'Ajustes' : 'Settings'),
          },
          {
            id: 'updater' as const,
            icon: 'system_update',
            label: lang === 'es' ? 'Actualizador' : 'Updater',
          },
          {
            id: 'notifications' as const,
            icon: 'notifications',
            label: lang === 'es' ? 'Centro de Notificaciones' : 'Notification Center',
          },
          {
            id: 'appearance' as const,
            icon: 'palette',
            label: t.settings.sections.appearance || (lang === 'es' ? 'Apariencia' : 'Appearance'),
          },
          {
            id: 'language' as const,
            icon: 'language',
            label: t.settings.sections.language || (lang === 'es' ? 'Idioma' : 'Language'),
          },
          {
            id: 'privacy' as const,
            icon: 'security',
            label:
              t.hub.studioSettings.privacyTitle ||
              (lang === 'es' ? 'Privacidad y Seguridad' : 'Privacy & Security'),
          },
        ],
      },
      {
        label:
          t.hub.studioSettings.applicationLabel || (lang === 'es' ? 'Aplicación' : 'Application'),
        items: [
          {
            id: 'updater' as const,
            icon: 'system_update',
            label: lang === 'es' ? 'Actualizador' : 'Updater',
          },
          {
            id: 'about' as const,
            icon: 'badge-alert',
            label: lang === 'es' ? 'Acerca de' : 'About',
          },
          ...(settings.developerMode
            ? [
                {
                  id: 'developer' as const,
                  icon: 'terminal',
                  label:
                    t.hub.studioSettings.developerTitle ||
                    (lang === 'es' ? 'Opciones de Desarrollador' : 'Developer Options'),
                },
              ]
            : []),
        ],
      }
    );
    return list;
  }, [t, settings.developerMode, lang, tab]);

  const getPageTitle = (id: SettingsPageId | 'profile') => {
    if (id === 'changelog') return lang === 'es' ? 'Historial de Cambios' : 'Changelog';
    if (id === 'updater') return lang === 'es' ? 'Actualizador' : 'Updater';
    if (id === 'help-center') return t.hub.studioSettings.helpTitle || 'Help Center';
    if (id === 'faq') return (t.hub as any).studioSettings?.helpTitle || 'FAQ & Support';
    if (id === 'terms') return t.hub.studioSettings.termsTitle || 'Terms of Service';
    if (id === 'privacy-policy') return t.hub.studioSettings.privacyTitle || 'Privacy Policy';
    if (id === 'bug-report') return t.hub.studioSettings.bugTitle || 'Report a Bug';
    if (id === 'profile')
      return (
        t.hub.studioSettings.profileTitle ||
        (lang === 'es' ? 'Perfil y Cuenta' : 'Profile & Account')
      );
    if (id === 'personal-info')
      return lang === 'es' ? 'Información personal' : 'Personal Information';
    if (id === 'security-login') return lang === 'es' ? 'Seguridad y acceso' : 'Security & Login';
    if (id === 'subscription')
      return lang === 'es' ? 'Suscripción y facturación' : 'Subscription & Billing';
    if (id === 'devices-sessions')
      return lang === 'es' ? 'Dispositivos y sesiones' : 'Devices & Sessions';
    if (id === 'privacy-data') return lang === 'es' ? 'Privacidad y datos' : 'Privacy & Data';

    for (const section of sections) {
      const item = section.items.find((n) => n.id === id);
      if (item) return item.label;
    }
    return 'Settings';
  };

  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!authUser?.uid) {
      setCustomPhoto(null);
      return;
    }
    try {
      const stored = localStorage.getItem(`chordex_cp_${authUser.uid}`);
      setCustomPhoto(stored || null);
    } catch {
      setCustomPhoto(null);
    }

    const onCoverChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ uid: string; cover: string | null }>).detail;
      if (detail && detail.uid === authUser.uid) {
        setCustomPhoto(detail.cover);
      }
    };
    window.addEventListener('chordex:user-cover-changed', onCoverChanged);
    return () => {
      window.removeEventListener('chordex:user-cover-changed', onCoverChanged);
    };
  }, [authUser?.uid]);

  useEffect(() => {
    const handleRoute = () => {
      sessionStorage.removeItem('studio:routeToUpdater');
      navigate('notifications');
    };
    window.addEventListener('studio:route-to-updater', handleRoute);

    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToUpdater') === '1') {
      sessionStorage.removeItem('studio:routeToUpdater');
      navigate('notifications');
    }

    return () => {
      window.removeEventListener('studio:route-to-updater', handleRoute);
    };
  }, []);

  useEffect(() => {
    const handleRoute = () => {
      sessionStorage.removeItem('studio:routeToPrivacy');
      navigate('privacy');
    };
    window.addEventListener('studio:route-to-privacy', handleRoute);

    if (typeof window !== 'undefined' && sessionStorage.getItem('studio:routeToPrivacy') === '1') {
      sessionStorage.removeItem('studio:routeToPrivacy');
      navigate('privacy');
    }

    return () => {
      window.removeEventListener('studio:route-to-privacy', handleRoute);
    };
  }, []);

  useEffect(() => {
    const handleUpdatePage = (e: Event) => {
      const customEvent = e as CustomEvent<SettingsPageId>;
      if (customEvent.detail) {
        navigate(customEvent.detail);
      }
    };
    window.addEventListener('studio:update-settings-page', handleUpdatePage as EventListener);
    return () => {
      window.removeEventListener('studio:update-settings-page', handleUpdatePage as EventListener);
    };
  }, [page]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('studio:settings-page-active', { detail: page }));
  }, [page]);

  const hubVis: PerAppVisuals = settings.perApp?.hub ?? {
    theme: 'dark',
    amoledMode: false,
  };
  const [changelogOpen, setChangelogOpen] = useState(false);

  function requestChange(patch: Partial<PerAppVisuals>) {
    const ALL_APPS: AppKey[] = ['hub', 'chordex', 'drumex', 'stagex', 'groovex', 'vocalex'];
    updatePerApp(ALL_APPS, patch);
    if (patch.theme) settingsController.updateSettings({ theme: patch.theme });
    if (patch.amoledMode !== undefined)
      settingsController.updateSettings({ amoledMode: patch.amoledMode });
  }

  // Scroll-position memory per sub-page. Without this, navigating
  // Settings → About → back resets the outer scroll container to the
  // top. We snapshot the current scrollTop right before any page change
  // and restore it on the next paint after the new page is in the DOM.
  const localScrollRef = useRef<HTMLDivElement | null>(null);
  useScrollHide(localScrollRef);
  const pageScrollPositions = useRef<Record<string, number>>({});
  const pendingRestoreRef = useRef<string | null>(null);
  function snapshotScroll(forPage: SettingsPageId) {
    const el = localScrollRef.current;
    if (el) pageScrollPositions.current[forPage] = el.scrollTop;
  }
  useLayoutEffect(() => {
    const el = localScrollRef.current;
    const target = pendingRestoreRef.current;
    if (target !== null) {
      if (el) el.scrollTop = pageScrollPositions.current[target] ?? 0;
      pendingRestoreRef.current = null;
    }
  }, [page, pageKey]);

  const navigate = (to: SettingsPageId) => {
    snapshotScroll(page);
    pendingRestoreRef.current = to;
    NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: to });
  };

  const goBack = () => {
    if (tab === 'profile' && page === 'profile') {
      NavigationDispatcher.push({ app: 'hub', tab: 'home' });
      return;
    }
    snapshotScroll(page);
    pendingRestoreRef.current = 'main';
    const store = useNavigationStore.getState();
    if (store.history.length > 1) {
      NavigationDispatcher.pop();
    } else {
      NavigationDispatcher.replace({ app: 'hub', tab: 'settings', page: 'main' });
    }
  };

  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  });

  const [devNativeVersion, setDevNativeVersion] = useState<string>('Loading...');
  const [devOtaVersion, setDevOtaVersion] = useState<string>('Loading...');
  const [devBundleId, setDevBundleId] = useState<string>('Loading...');
  const [devVersionCode, setDevVersionCode] = useState<string>('Loading...');
  const [preferencesDump, setPreferencesDump] = useState<string>('Loading...');
  const [localStorageStatus, setLocalStorageStatus] = useState<string>('Loading...');
  const [devLoadingAction, setDevLoadingAction] = useState<string | null>(null);
  const [firebaseVersionJson, setFirebaseVersionJson] = useState<string>('Loading...');
  const [firebaseAppReleaseJson, setFirebaseAppReleaseJson] = useState<string>('Loading...');
  const [verboseLogs, setVerboseLogs] = useState<boolean>(
    () => localStorage.getItem('studio:verboseLogs') === 'true'
  );
  const [installedPackageDetails, setInstalledPackageDetails] = useState<any>(null);
  const [downloadedApkDetails, setDownloadedApkDetails] = useState<any>(null);
  const [apkEligibility, setApkEligibility] = useState<any>(null);

  useEffect(() => {
    if (
      page !== 'developer' &&
      page !== 'debug' &&
      page !== 'download-apps' &&
      page !== 'release-notes'
    )
      return;

    const loadInfo = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          const info = await App.getInfo();
          setDevNativeVersion(info.version);
          setDevBundleId(info.id);
          setDevVersionCode(info.build);
        } else {
          setDevNativeVersion('N/A — Web build');
          setDevBundleId('N/A — Web build');
          setDevVersionCode('N/A — Web build');
        }
      } catch (e) {
        setDevNativeVersion('Error loading native info');
        setDevBundleId('Error loading native info');
        setDevVersionCode('Error');
      }

      try {
        if (Capacitor.isNativePlatform()) {
          setDevOtaVersion('disabled');
        } else {
          setDevOtaVersion('N/A — Web build');
        }
      } catch (e) {
        setDevOtaVersion('Error loading Updater info');
      }

      // Load local storage status
      try {
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            size += key.length + (localStorage.getItem(key)?.length || 0);
          }
        }
        setLocalStorageStatus(`${localStorage.length} keys (~${(size / 1024).toFixed(2)} KB)`);
      } catch (e) {
        setLocalStorageStatus('Error loading storage info');
      }

      // Load Capacitor Preferences dump
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { keys } = await Preferences.keys();
        const dump: Record<string, string | null> = {};
        for (const k of keys) {
          const { value } = await Preferences.get({ key: k });
          dump[k] = value;
        }
        setPreferencesDump(JSON.stringify(dump, null, 2));
      } catch (e: any) {
        setPreferencesDump(`Error loading Preferences: ${e?.message || String(e)}`);
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const { AppInstaller, checkApkEligibility } = await import('@workspace/studio-core');
          const installed = await AppInstaller.getInstalledAppInfo();
          setInstalledPackageDetails({
            ...installed,
            signatures: installed.signingSha256,
          });

          const apkPath = localStorage.getItem('studio:downloadedApkPath');
          if (apkPath) {
            try {
              const inspected = await AppInstaller.inspectApk({ filePath: apkPath });

              let sizeStr = 'N/A';
              try {
                const { Filesystem } = await import('@capacitor/filesystem');
                const statInfo = await Filesystem.stat({ path: apkPath });
                sizeStr = `${(statInfo.size / (1024 * 1024)).toFixed(2)} MB (${statInfo.size} bytes)`;
              } catch (e) {
                console.warn('Error reading APK size:', e);
              }

              setDownloadedApkDetails({
                ...inspected,
                fileSize: sizeStr,
                filePath: apkPath,
              });

              const eligibility = await checkApkEligibility(apkPath);
              setApkEligibility(eligibility);
            } catch (apkErr) {
              console.warn('Error loading downloaded APK details:', apkErr);
            }
          } else {
            setDownloadedApkDetails(null);
            setApkEligibility(null);
          }
        } catch (err) {
          console.warn('Error loading native package/APK details:', err);
        }
      }
    };

    const loadManifests = async () => {
      const t = Date.now();
      const baseUrl = 'https://studio-30f44.web.app';
      try {
        const r1 = await fetch(`${baseUrl}/version.json?t=${t}`);
        if (r1.ok) {
          const text = await r1.text();
          setFirebaseVersionJson(text);
        } else {
          setFirebaseVersionJson(`Error: HTTP ${r1.status}`);
        }
      } catch (e: any) {
        setFirebaseVersionJson(`Error: ${e.message || String(e)}`);
      }

      try {
        const r2 = await fetch(`${baseUrl}/app-release.json?t=${t}`);
        if (r2.ok) {
          const text = await r2.text();
          setFirebaseAppReleaseJson(text);
        } else {
          setFirebaseAppReleaseJson(`Error: HTTP ${r2.status}`);
        }
      } catch (e: any) {
        setFirebaseAppReleaseJson(`Error: ${e.message || String(e)}`);
      }
    };

    loadInfo();
    loadManifests();
  }, [page]);

  const handleClearUpdateCache = async () => {
    try {
      const filePath = localStorage.getItem('studio:downloadedApkPath');
      if (filePath && Capacitor.isNativePlatform()) {
        const { Filesystem } = await import('@capacitor/filesystem');
        await Filesystem.deleteFile({ path: filePath }).catch(() => {});
      }
      localStorage.removeItem('studio:downloadedApkPath');
      localStorage.removeItem('studio:downloadedBundleId');
      localStorage.removeItem('studio:downloadedVersions');
      showDevToast('Update cache cleared.');
    } catch (err: any) {
      showDevToast(`Clear failed: ${err.message || String(err)}`);
    }
  };

  const handleClearDismissed = () => {
    localStorage.removeItem('studio:dismissedVersions');
    sessionStorage.removeItem('studio:laterUpdateVersion');
    localStorage.removeItem('studio:notifiedUpdateVersion');
    showDevToast('Dismissed versions cleared.');
  };

  const handleClearApplied = () => {
    localStorage.removeItem('studio:appliedVersions');
    localStorage.removeItem('studio:appliedUpdateVersion');
    if (Capacitor.isNativePlatform()) {
      import('@workspace/studio-core')
        .then(({ AppInstaller }) => {
          AppInstaller.clearInstallerLogHistory();
        })
        .catch((err) => console.error(err));
    }
    showDevToast('Applied versions cleared.');
  };

  const handleResetOta = async () => {
    showDevToast('Updater System: disabled.');
  };

  const handleForceOtaRefresh = async () => {
    showDevToast('Updater System: disabled.');
  };

  const handleTestNotification = async () => {
    try {
      const mockVer = `3.3.0-test-${Date.now()}`;
      showDevToast(`Triggering test notification: ${mockVer}`);
    } catch (err: any) {
      showDevToast(`Notification test failed: ${err.message || String(err)}`);
    }
  };

  const handleTestOtaDetection = async () => {
    try {
      const mockVer = '3.3.1';
      const mockRemote = {
        version: mockVer,
        updateType: 'updater',
        downloadUrl: 'https://example.com/mock-updater.zip',
        changelog: 'Simulated Updater Update Changelog for v3.3.1. Adds sleek developer features.',
        releaseNotes: ['Simulated Updater item 1', 'Simulated Updater item 2'],
      };
      sessionStorage.setItem('studio:mockOtaResponse', JSON.stringify(mockRemote));

      const dismissed = localStorage.getItem('studio:dismissedVersions');
      if (dismissed) {
        try {
          const list = JSON.parse(dismissed);
          localStorage.setItem(
            'studio:dismissedVersions',
            JSON.stringify(list.filter((v: string) => v !== mockVer))
          );
        } catch {}
      }
      showDevToast('Manual update check initiated...');
      await checkForUpdate(true, 'settings_manual', 'manual update check');
    } catch (err: any) {
      showDevToast(`Check failed: ${err.message || String(err)}`);
    }
  };

  const handleTestApkDetection = async () => {
    try {
      const mockVer = '3.3.2';
      const mockRemote = {
        version: mockVer,
        updateType: 'apk',
        apkUrl: 'https://example.com/mock-apk.apk',
        changelog: 'Simulated APK System Update for v3.3.2. Includes Android-specific fixes.',
        apkSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        releaseNotes: ['Simulated APK item 1', 'Simulated APK item 2'],
      };
      sessionStorage.setItem('studio:mockOtaResponse', JSON.stringify(mockRemote));

      const dismissed = localStorage.getItem('studio:dismissedVersions');
      if (dismissed) {
        try {
          const list = JSON.parse(dismissed);
          localStorage.setItem(
            'studio:dismissedVersions',
            JSON.stringify(list.filter((v: string) => v !== mockVer))
          );
        } catch {}
      }
      sessionStorage.removeItem('studio:laterUpdateVersion');

      showDevToast('APK simulation configured. Checking update...');
      await checkForUpdate(true, 'settings_manual', 'dev test check');
    } catch (err: any) {
      showDevToast(`Simulate failed: ${err.message || String(err)}`);
    }
  };

  const getDiagnosticsText = () => {
    const isNativePlat = Capacitor.isNativePlatform();
    const wrapperVersion = updateDebugLogs.nativeApkVersion || 'Unknown';
    const hasMismatch =
      isNativePlat &&
      wrapperVersion !== 'Unknown' &&
      wrapperVersion !== 'N/A' &&
      APP_VERSION !== wrapperVersion;

    return [
      '=== STUDIO DIAGNOSTICS REPORT ===',
      `Timestamp: ${new Date().toISOString()}`,
      `App Version: ${APP_VERSION}`,
      `Device Model: ${Capacitor.isNativePlatform() ? 'Native Device' : 'Web Browser'}`,
      ...(hasMismatch
        ? [
            '',
            'VERSION_MISMATCH_DETECTED',
            `App Version (${APP_VERSION}) does not match APK Wrapper Version (${wrapperVersion})`,
            '',
          ]
        : []),
      '',
      '=== APK UPDATE DIAGNOSTICS ===',
      `App Version: ${APP_VERSION}`,
      `APK Version: ${devNativeVersion}`,
      `versionCode: ${devVersionCode}`,
      `Update System: APK only`,
      `Updater System: disabled`,
      `AppInstaller Available: ${updateDebugLogs.appInstallerAvailable}`,
      `downloadApk Available: ${updateDebugLogs.downloadApkAvailable}`,
      `verifyApkSha256 Available: ${updateDebugLogs.verifyApkSha256Available}`,
      `installApk Available: ${updateDebugLogs.installApkAvailable}`,
      `openInstallPermissionSettings Available: ${updateDebugLogs.openInstallPermissionSettingsAvailable}`,
      `Registered Capacitor Plugins: ${updateDebugLogs.registeredPlugins}`,
      `Plugin Method Check: ${updateDebugLogs.pluginMethodCheck}`,
      `Fetched version.json: ${updateDebugLogs.fetchedVersionJson}`,
      `Fetched app-release.json: ${updateDebugLogs.fetchedAppReleaseJson}`,
      `Update Type: ${updateDebugLogs.updateType}`,
      `Download Status: ${updateDebugLogs.downloadStatus}`,
      `SHA Verification: ${updateDebugLogs.shaVerification}`,
      `File Details: ${updateDebugLogs.fileDetails}`,
      `Install Error / Log: ${updateDebugLogs.installError}`,
      `Installer Launch Status: ${updateDebugLogs.installerLaunchStatus}`,
      `Last Exception Stack Trace: ${updateDebugLogs.lastExceptionStackTrace}`,
      '',
      '=== APK INSTALL DETAILS ===',
      `Exception Message: ${updateDiagnostics.exceptionMessage}`,
      `Failure Reason: ${updateDiagnostics.failureReason}`,
      `Download URL: ${updateDiagnostics.downloadUrl}`,
      `APK Path: ${updateDiagnostics.apkPath}`,
      `File Size: ${updateDiagnostics.fileSize}`,
      `SHA Expected: ${updateDiagnostics.shaExpected}`,
      `SHA Calculated: ${updateDiagnostics.shaCalculated}`,
      `Installer Result: ${updateDiagnostics.installerResult}`,
      `Permission State: ${updateDiagnostics.permissionState}`,
      `Android Version: ${updateDiagnostics.androidVersion}`,
      `Device Model: ${updateDiagnostics.deviceModel}`,
      `Diagnostics Timestamp: ${updateDiagnostics.timestamp}`,
    ].join('\n');
  };

  const handleExportDiagnostics = async () => {
    const content = getDiagnosticsText();
    const filename = `studio-diagnostics-${Date.now()}.txt`;
    if (Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: 'utf8' as any,
        });
        showDevToast(`Exported to Documents: ${filename}`);
      } catch (err: any) {
        showDevToast(`Export failed: ${err.message || String(err)}`);
      }
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showDevToast('Diagnostics exported successfully.');
    }
  };

  const cardStyle: React.CSSProperties = isWebDesktop
    ? {
        background: 'transparent',
        borderRadius: '0px',
        overflow: 'visible',
        border: 'none',
      }
    : {
        background: isLight
          ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
          : 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'var(--surface-float-blur)',
        WebkitBackdropFilter: 'var(--surface-float-blur)',
        boxShadow: isLight
          ? '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
          : '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
      };

  const slideAnim = slideDir === 'forward' ? 'hub-slide-in' : 'hub-slide-back';
  const subStyle: React.CSSProperties = {
    padding: '0 20px',
    paddingBottom: 'var(--content-bottom-pad)',
    animation: `${slideAnim} 300ms cubic-bezier(0.25,0.46,0.45,0.94) both`,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    zIndex: 100,
  };

  function renderHelpContent() {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 8 }}
      >
        <HelpAccordion accent={accent} lang={lang} />
      </div>
    );
  }

  function renderHelpCenterContent() {
    return <HelpAccordion accent={accent} lang={lang} />;
  }

  function renderFaqContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <HelpAccordion accent={accent} lang={lang} />
      </div>
    );
  }

  function renderReleaseNotesContent() {
    const changelogSections = getChangelogSections(lang) || [];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text-primary)' }}>
            v{APP_VERSION}
          </span>
          <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
            Released on {APP_VERSION_DATE}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {changelogSections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3
                style={{
                  fontSize: 'var(--font-section-label)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--c-text-secondary)',
                  opacity: 0.6,
                  margin: 0,
                }}
              >
                {sec.heading}
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {sec.items.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 13,
                      color: 'var(--c-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: accent.from,
                        marginTop: 7,
                        flexShrink: 0,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderChangelogContent() {
    return <ChangelogView lang={lang} accent={accent} />;
  }

  function renderDownloadAppsContent() {
    let apkVersion = '3.6.28';
    let apkSize = '13.47 MB';
    let apkUrl = 'https://github.com/MAGEXE1000/Studio/releases/download/v3.6.28/studio-3.6.28.apk';

    try {
      if (
        firebaseAppReleaseJson &&
        !firebaseAppReleaseJson.startsWith('Error') &&
        firebaseAppReleaseJson !== 'Loading...'
      ) {
        const parsed = JSON.parse(firebaseAppReleaseJson);
        if (parsed.version) apkVersion = parsed.version;
        if (parsed.apkSizeBytes) apkSize = `${(parsed.apkSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
        if (parsed.apkUrl) apkUrl = parsed.apkUrl;
      }
    } catch (e) {
      console.warn('Failed to parse firebaseAppReleaseJson:', e);
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        {/* Android Card */}
        <div
          style={{
            padding: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(128, 128, 128, 0.08)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: accent.from }}
              >
                adb
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--c-text-primary)',
                  }}
                >
                  Android App (APK)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  v{apkVersion} • {apkSize}
                </span>
              </div>
            </div>
            <a
              href={apkUrl}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                background: accent.from,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                download
              </span>
              Download APK
            </a>
          </div>
          <div style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            To install: download and run the APK on your device. You may need to enable "Install
            from Unknown Sources" in your system security settings.
          </p>
        </div>

        {/* Web App / PWA Card */}
        <div
          style={{
            padding: 20,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(128, 128, 128, 0.08)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: accent.from }}
              >
                language
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--c-text-primary)',
                  }}
                >
                  Web Version (PWA)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>v4.0.0 (Web)</span>
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: accent.from,
                background: `${accent.from}22`,
                padding: '6px 12px',
                borderRadius: 8,
              }}
            >
              Running Now
            </div>
          </div>
          <div style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            Enjoy the full experience on any desktop or mobile device. Install as a Progressive Web
            App (PWA) directly via your browser's install menu for offline support and standalone
            window display.
          </p>
        </div>

        {/* iOS & Desktop Cards - Coming Soon */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { platform: 'iOS App', icon: 'phone_iphone' },
            { platform: 'Desktop (macOS / Windows)', icon: 'desktop_windows' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(128, 128, 128, 0.06)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: 0.7,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'var(--c-text-secondary)' }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                  {item.platform}
                </span>
              </div>
              <span
                style={{
                  fontSize: 'var(--font-section-label)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: accent.from,
                  opacity: 0.8,
                }}
              >
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderKeyboardShortcutsContent() {
    const categories = [
      {
        title: 'Stage Mode (Stagex)',
        shortcuts: [
          { keys: ['Space', '→', '↓'], desc: 'Advance to next scene (Forward)' },
          { keys: ['←', '↑'], desc: 'Go back to previous scene (Backward)' },
          { keys: ['Esc'], desc: 'Close Stage Mode / Exit fullscreen' },
        ],
      },
      {
        title: 'Sequencer & Editing (Drumex)',
        shortcuts: [
          { keys: ['Ctrl', 'Z'], desc: 'Undo last editing step' },
          { keys: ['Ctrl', 'Y'], desc: 'Redo last undone step' },
          { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo last undone step (Alternative)' },
        ],
      },
    ];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3
              style={{
                fontSize: 'var(--font-section-label)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--c-text-secondary)',
                opacity: 0.6,
                margin: 0,
              }}
            >
              {cat.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cat.shortcuts.map((sh, j) => (
                <div
                  key={j}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(128, 128, 128, 0.06)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{sh.desc}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sh.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && (
                          <span
                            style={{
                              color: 'var(--c-text-muted)',
                              fontSize: 12,
                              alignSelf: 'center',
                            }}
                          >
                            +
                          </span>
                        )}
                        <kbd
                          style={{
                            padding: '3px 6px',
                            border: '1px solid rgba(128, 128, 128, 0.2)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: 4,
                            fontSize: 'var(--font-section-label)',
                            fontWeight: 700,
                            color: 'var(--c-text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderTermsContent() {
    return (
      <SettingsContentContainer
        style={{
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              color: 'var(--c-text-secondary)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Welcome to Studio. By accessing or using our application, you agree to comply with and
            be bound by the following Terms of Service. Please read them carefully.
          </p>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              1. Ownership of Content
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              All musical patterns, drum sequences, settings, and other project data created by you
              using Studio's tools (Chordex, Drumex, Stagex, Groovex, Vocalex) remain entirely your
              property. We lay no claim of copyright, trademark, or ownership over your creative
              output.
            </p>
          </div>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              2. Use of Service
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              Studio is provided on a local-first basis. Data sync features are provided for your
              personal backup convenience. You agree not to abuse or attempt to overload the sync
              servers.
            </p>
          </div>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              3. Disclaimer of Warranties
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              Studio is provided "as is" and "as available" without any warranties of any kind.
              While we aim to protect project data using reliable local storage and cloud sync
              mechanisms, we cannot guarantee data will not be lost. We recommend periodic manual
              backups.
            </p>
          </div>
        </div>
      </SettingsContentContainer>
    );
  }

  function renderPrivacyPolicyContent() {
    return (
      <SettingsContentContainer
        style={{
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              color: 'var(--c-text-secondary)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Your privacy is extremely important to us. This Privacy Policy details how Studio
            collects, uses, and safeguards your data.
          </p>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              1. Local-First Storage
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              By default, all your project settings, drum sequences, and songs are stored locally on
              your device using IndexedDB and localStorage. None of this creative work leaves your
              device unless you explicitly enable Cloud Sync.
            </p>
          </div>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              2. Cloud Backup & Authentication
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              If you create a Studio Account, we use Firebase to manage your login credentials. Your
              project backups are stored securely in Firestore databases. We only use this data to
              perform cross-device syncing at your request.
            </p>
          </div>
          <div>
            <h4
              style={{
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
                fontSize: 14.5,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.015em',
              }}
            >
              3. No Third-Party Tracking
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                opacity: 0.85,
              }}
            >
              Studio does not use telemetry, advertising trackers, or external behavioral analytics.
              Your interaction with the app remains entirely private.
            </p>
          </div>
        </div>
      </SettingsContentContainer>
    );
  }

  function renderBugReportContent() {
    const handleCopyTemplate = () => {
      const template = `[STUDIO BUG REPORT]
------------------------------------
App Version: v${APP_VERSION} (Web)
User Agent: ${navigator.userAgent}
Date: ${new Date().toISOString()}

[Description of Bug]
-

[Steps to Reproduce]
1.
2.
3.

[Expected Behavior]
-

[Actual Behavior]
- `;
      navigator.clipboard.writeText(template);
      setCopiedBugTemplate(true);
      setTimeout(() => setCopiedBugTemplate(false), 2000);
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--c-text-secondary)',
            lineHeight: 1.5,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {Capacitor.isNativePlatform()
            ? 'If you encounter an issue or unexpected behavior in Studio, please report it! Tap below to send us a support email with pre-filled diagnostic information.'
            : 'If you encounter an issue or unexpected behavior in Studio, please report it! Copy the template below and submit it on our GitHub repository.'}
        </p>

        <Button
          variant="primary"
          onClick={handleCopyTemplate}
          style={{
            alignSelf: 'flex-start',
            fontFamily: 'Inter, sans-serif',
          }}
          icon={
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {copiedBugTemplate ? 'check' : 'content_copy'}
            </span>
          }
        >
          {copiedBugTemplate ? 'Copied to Clipboard!' : 'Copy Bug Template'}
        </Button>

        <div
          style={{
            padding: 14,
            background: 'rgba(0, 0, 0, 0.30)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--c-text-secondary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
          }}
        >
          {`[STUDIO BUG REPORT]
App Version: v${APP_VERSION} (${Capacitor.isNativePlatform() ? 'Android' : 'Web'})
User Agent: [Automatically Generated]
...`}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <motion.a
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            transition={SpringPresets.soft}
            href={`https://github.com/MAGEXE1000/Studio/issues/new?title=${encodeURIComponent('Bug: [Enter short title]')}&body=${encodeURIComponent(
              `**AFFECTED MODULE**\n- [e.g. Chordex, Drumex, Stagex, Groovex, Vocalex, Settings, Help]\n\n` +
                `**APP VERSION**\n- v${APP_VERSION} (${Capacitor.isNativePlatform() ? 'Android/Native' : 'Web'})\n\n` +
                `**ANDROID/OS VERSION**\n- [e.g. Android 13 / Windows 11]\n\n` +
                `**DEVICE MODEL**\n- [e.g. Samsung Galaxy S23 / Laptop]\n\n` +
                `**REPRODUCTION STEPS**\n1. \n2. \n3. \n\n` +
                `**EXPECTED RESULT**\n- \n\n` +
                `**ACTUAL RESULT**\n- \n\n` +
                `*Generated on ${new Date().toISOString()}*`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--primary button--md"
            style={{
              textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              open_in_new
            </span>
            Report a Bug on GitHub
          </motion.a>
        </div>
      </div>
    );
  }

  function renderGeneralContent() {
    const isHideActive = preferences.autoHideSidebarInApps;
    const isHoverActive = isHideActive && preferences.hoverRevealSidebar;
    const sSets = t.hub.studioSettings;

    return (
      <SettingsContentContainer style={{ paddingBottom: 'var(--space-6)' }}>
        <SettingsSectionLabel>{sSets.sidebarBehavior}</SettingsSectionLabel>
        <div style={cardStyle}>
          <SettingRow label={sSets.hideSidebar} desc={sSets.hideSidebarDesc}>
            <Toggle
              value={preferences.autoHideSidebarInApps}
              onChange={(v) => setPreference('autoHideSidebarInApps', v)}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>

          <div
            style={{
              opacity: isHideActive ? 1 : 0.5,
              pointerEvents: isHideActive ? 'auto' : 'none',
              transition: 'opacity 200ms ease',
            }}
          >
            <SettingRow label={sSets.revealSidebar} desc={sSets.revealSidebarDesc}>
              <Toggle
                value={isHideActive && preferences.hoverRevealSidebar}
                onChange={(v) => setPreference('hoverRevealSidebar', v)}
                accentFrom={accent.from}
                accentTo={accent.to}
              />
            </SettingRow>
          </div>

          <div
            style={{
              opacity: isHoverActive ? 1 : 0.5,
              pointerEvents: isHoverActive ? 'auto' : 'none',
              transition: 'opacity 200ms ease',
            }}
          >
            <SettingRow label={sSets.autoCloseSidebar} desc={sSets.autoCloseSidebarDesc}>
              <Toggle
                value={isHoverActive && preferences.autoCloseHoverSidebar}
                onChange={(v) => setPreference('autoCloseHoverSidebar', v)}
                accentFrom={accent.from}
                accentTo={accent.to}
              />
            </SettingRow>
          </div>
        </div>

        <SettingsSectionLabel>{sSets.appWorkspace}</SettingsSectionLabel>
        <div style={cardStyle}>
          <SettingRow label={sSets.showNavDock} desc={sSets.showNavDockDesc}>
            <Toggle
              value={preferences.showWebAppDock}
              onChange={(v) => {
                if (!v && isWebDesktop) {
                  alert(sSets.dockAlertDesktop);
                  return;
                }
                setPreference('showWebAppDock', v);
              }}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
          <div
            style={{
              padding: '0px 20px 14px',
              marginTop: '-10px',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--c-text-muted)',
                fontFamily: 'Inter',
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {sSets.dockDescription}
            </p>
          </div>

          <SettingRow label={sSets.rememberSection} desc={sSets.rememberSectionDesc}>
            <Toggle
              value={preferences.rememberLastAppSection}
              onChange={(v) => setPreference('rememberLastAppSection', v)}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>

          <SettingRow label={sSets.swipeBack} desc={sSets.swipeBackDesc}>
            <Toggle
              value={settings.swipeBackBehavior ?? 'both'}
              onChange={(v) => settingsController.updateSettings({ swipeBackBehavior: v })}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
        </div>

        <SettingsSectionLabel>{sSets.performance}</SettingsSectionLabel>
        <div style={cardStyle}>
          <SettingRow label={sSets.reduceAnimations} desc={sSets.reduceAnimationsDesc}>
            <Toggle
              value={preferences.reduceMotion}
              onChange={(v) => setPreference('reduceMotion', v)}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>

          <SettingRow label={sSets.compactSpacing} desc={sSets.compactSpacingDesc}>
            <Toggle
              value={preferences.compactDesktopSpacing}
              onChange={(v) => setPreference('compactDesktopSpacing', v)}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>

          <SettingRow label={t.settings.rows.haptic} desc={t.settings.rows.hapticDesc}>
            <Toggle
              value={settings.hapticFeedback}
              onChange={(v) => settingsController.updateSettings({ hapticFeedback: v })}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
          <SettingRow label={sSets.highRefresh} desc={sSets.highRefreshDesc}>
            <Toggle
              value={settings.highRefreshRate}
              onChange={(v) => settingsController.updateSettings({ highRefreshRate: v })}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
          <SettingRow label={sSets.lowLatency} desc={sSets.lowLatencyDesc}>
            <Toggle
              value={settings.lowLatencyMode}
              onChange={(v) => settingsController.updateSettings({ lowLatencyMode: v })}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
          <SettingRow label={sSets.performanceMode} desc={sSets.performanceModeDesc}>
            <Toggle
              value={settings.performanceMode}
              onChange={(v) => settingsController.updateSettings({ performanceMode: v })}
              accentFrom={accent.from}
              accentTo={accent.to}
            />
          </SettingRow>
        </div>
      </SettingsContentContainer>
    );
  }

  function renderPrivacyContent() {
    return (
      <SettingsContentContainer style={{ paddingBottom: 'var(--space-6)' }}>
        <SettingsSectionLabel>
          {(t.hub as { studioSettings?: { accountControls?: string } }).studioSettings
            ?.accountControls ?? 'Account Controls'}
        </SettingsSectionLabel>
        <Suspense fallback={null}>
          <AccountDangerZone accent={accent} cardStyle={cardStyle} />
        </Suspense>
      </SettingsContentContainer>
    );
  }

  function renderDeveloperContent() {
    try {
      const diag = getSyncDiagnostics();
      const wrapAction = async (actionId: string, fn: () => Promise<void> | void) => {
        setDevLoadingAction(actionId);
        try {
          await fn();
        } catch (err: any) {
          showDevToast(`Failed: ${err?.message || String(err)}`);
        } finally {
          setDevLoadingAction(null);
        }
      };

      const DevButtonRow = ({
        label,
        desc,
        actionLabel,
        actionId,
        onPress,
        disabled = false,
        isDestructive = false,
      }: {
        label: string;
        desc?: string;
        actionLabel: string;
        actionId: string;
        onPress: () => void;
        disabled?: boolean;
        isDestructive?: boolean;
      }) => {
        const isLoading = devLoadingAction === actionId;
        return (
          <div
            style={{
              padding: 'var(--density-row-pad)',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 'var(--font-base)',
                  fontWeight: 600,
                  color: 'var(--c-text-primary)',
                  fontFamily: 'Manrope',
                  margin: 0,
                }}
              >
                {label}
              </p>
              {desc && (
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    marginTop: '2px',
                    lineHeight: 1.3,
                    color: 'var(--c-text-secondary)',
                    fontFamily: 'Inter',
                    margin: '4px 0 0',
                  }}
                >
                  {desc}
                </p>
              )}
            </div>
            <StatefulButton
              state={isLoading ? 'loading' : 'idle'}
              onClick={onPress}
              disabled={disabled || devLoadingAction !== null}
              variant={isDestructive ? 'danger' : 'secondary'}
              size="sm"
              style={{
                borderRadius: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              {actionLabel}
            </StatefulButton>
          </div>
        );
      };

      const DevInfoRow = ({
        label,
        desc,
        value,
        canCopy = false,
      }: {
        label: string;
        desc?: string;
        value: string;
        canCopy?: boolean;
      }) => (
        <div
          style={{
            padding: 'var(--density-row-pad)',
            borderBottom: '1px solid rgba(128,128,128,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: '6px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 'var(--font-base)',
                  fontWeight: 600,
                  color: 'var(--c-text-primary)',
                  fontFamily: 'Manrope',
                  margin: 0,
                }}
              >
                {label}
              </p>
              {desc && (
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    marginTop: '2px',
                    lineHeight: 1.3,
                    color: 'var(--c-text-secondary)',
                    fontFamily: 'Inter',
                    margin: '4px 0 0',
                  }}
                >
                  {desc}
                </p>
              )}
            </div>
            {canCopy && (
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(value)
                    .then(() => showDevToast('Copied to clipboard'));
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(128,128,128,0.08)',
                  border: '1px solid rgba(128,128,128,0.15)',
                  color: 'var(--c-text-primary)',
                  fontSize: '11px',
                  fontFamily: 'Manrope',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            )}
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(128,128,128,0.06)',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: 'var(--c-text-primary)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {value}
          </div>
        </div>
      );

      const DevCollapsibleRow = ({
        label,
        desc,
        value,
        canCopy = false,
      }: {
        label: string;
        desc?: string;
        value: string;
        canCopy?: boolean;
      }) => {
        const [open, setOpen] = useState(false);
        return (
          <div
            style={{
              padding: 'var(--density-row-pad)',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => setOpen(!open)}
              >
                <p
                  style={{
                    fontSize: 'var(--font-base)',
                    fontWeight: 600,
                    color: 'var(--c-text-primary)',
                    fontFamily: 'Manrope',
                    margin: 0,
                  }}
                >
                  {open ? '▼' : '▶'} {label}
                </p>
                {desc && (
                  <p
                    style={{
                      fontSize: 'var(--font-sm)',
                      marginTop: '2px',
                      lineHeight: 1.3,
                      color: 'var(--c-text-secondary)',
                      fontFamily: 'Inter',
                      margin: '4px 0 0',
                    }}
                  >
                    {desc}
                  </p>
                )}
              </div>
              {canCopy && (
                <button
                  onClick={() => {
                    navigator.clipboard
                      .writeText(value)
                      .then(() => showDevToast('Copied to clipboard'));
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(128,128,128,0.08)',
                    border: '1px solid rgba(128,128,128,0.15)',
                    color: 'var(--c-text-primary)',
                    fontSize: '11px',
                    fontFamily: 'Manrope',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              )}
            </div>
            {open && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(128,128,128,0.06)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--c-text-primary)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  border: '1px solid rgba(128,128,128,0.12)',
                }}
              >
                {value}
              </div>
            )}
          </div>
        );
      };

      const handleClearUpdateCacheAction = () => {
        if (!window.confirm('Delete downloaded APK files and reset local update history?')) return;
        wrapAction('clear-cache', handleClearUpdateCache);
      };

      const handleClearDismissedAction = () => {
        if (!window.confirm('Clear skip update choices?')) return;
        wrapAction('clear-dismissed', handleClearDismissed);
      };

      const handleClearAppliedAction = () => {
        if (!window.confirm('Clear list of installed Updater/APK updates?')) return;
        wrapAction('clear-applied', handleClearApplied);
      };

      const handleClearFailedUpdateAction = () => {
        if (!window.confirm('Clear update error codes and reset checking status?')) return;
        wrapAction('clear-failed', () => {
          resetAppUpdateState();
          showDevToast('Failed update state cleared.');
        });
      };

      const handleResetOtaAction = () => {
        if (
          !window.confirm(
            'Revert Updater bundles back to built-in factory default? App will reload.'
          )
        )
          return;
        wrapAction('reset-updater', handleResetOta);
      };

      const handleValidateInstallerAction = () => {
        wrapAction('validate-installer', async () => {
          const cap = (window as any).Capacitor;
          const appInstallerExists = cap
            ? (cap.isPluginAvailable?.('AppInstaller') ?? false)
            : false;
          if (!appInstallerExists) {
            throw new Error('AppInstaller native plugin is unavailable on this platform.');
          }
          const avail = isAppInstallerAvailable();
          if (avail) {
            showDevToast('AppInstaller validation PASSED: all native methods are registered.');
          } else {
            throw new Error('AppInstaller registered but missing required native methods.');
          }
        });
      };

      const handleClearTemporaryAction = () => {
        if (!window.confirm('Clear all session configurations and temporary mock data?')) return;
        wrapAction('clear-temp', () => {
          sessionStorage.clear();
          showDevToast('Temporary mock settings cleared.');
        });
      };

      const handleExportLocalDiagnosticsAction = () => {
        wrapAction('export-local', () => {
          const dump = {
            timestamp: new Date().toISOString(),
            localStorage: { ...localStorage },
            preferencesDump,
          };
          const text = JSON.stringify(dump, null, 2);
          const filename = `studio-local-diagnostics-${Date.now()}.json`;
          const blob = new Blob([text], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showDevToast('Local diagnostics exported.');
        });
      };

      const handleResetAppShellAction = () => {
        if (
          !window.confirm('Reset all user settings, active theme, and layouts to factory default?')
        )
          return;
        wrapAction('reset-shell', () => {
          localStorage.clear();
          sessionStorage.clear();
          showDevToast('App shell reset completed. Please restart the app.');
          setTimeout(() => window.location.reload(), 1500);
        });
      };

      const handleForceReturnHubAction = () => {
        wrapAction('force-return', () => {
          (window as any).returnToStudioHub?.();
          showDevToast('Return to Hub triggered.');
        });
      };

      const handleResetDeveloperAction = () => {
        if (!window.confirm('Disable developer mode and hide this menu?')) return;
        wrapAction('reset-developer', () => {
          settingsController.updateSettings({ developerMode: false });
          goBack();
          showDevToast('Developer options disabled.');
        });
      };

      const handleClearDebugLogsAction = () => {
        if (!window.confirm('Clear diagnostic logs memory?')) return;
        wrapAction('clear-logs', () => {
          updateDebugLogs.fetchedVersionJson = null;
          updateDebugLogs.fetchedAppReleaseJson = null;
          updateDebugLogs.installError = null;
          updateDebugLogs.lastExceptionStackTrace = null;
          showDevToast('Logs memory reset.');
        });
      };

      const handleResetUpdateStateAction = () => {
        if (!window.confirm('Reset all Updater and APK update logs and persistent history?'))
          return;
        wrapAction('reset-update-state', () => {
          resetAppUpdateState();
          localStorage.removeItem('studio:appliedVersions');
          localStorage.removeItem('studio:appliedUpdateVersion');
          localStorage.removeItem('studio:dismissedVersions');
          localStorage.removeItem('studio:notifiedVersions');
          localStorage.removeItem('studio:downloadedApkPath');
          localStorage.removeItem('studio:downloadedBundleId');
          localStorage.removeItem('studio:downloadedVersions');
          if (Capacitor.isNativePlatform()) {
            import('@workspace/studio-core')
              .then(({ AppInstaller }) => {
                AppInstaller.clearInstallerLogHistory();
              })
              .catch((err) => console.error(err));
          }
          showDevToast('Update state fully reset.');
        });
      };

      const getLocalRecordCounts = () => {
        let chordexPresets = 0;
        let chordexProgressions = 0;
        let chordexChords = 0;
        let drumexSongs = 0;
        let drumexGrooves = 0;
        let groovexSongs = 0;

        try {
          const chordex = localStorage.getItem('chord-explorer-storage-v3');
          if (chordex) {
            const parsed = JSON.parse(chordex);
            const state = parsed.state || {};
            chordexPresets = state.presets?.length || 0;
            chordexProgressions = state.progressions?.length || 0;
            chordexChords = state.customChords?.length || 0;
          }
        } catch {}

        try {
          const drumex = localStorage.getItem('chordex-drums');
          if (drumex) {
            const parsed = JSON.parse(drumex);
            const state = parsed.state || {};
            drumexSongs = state.drumSongs?.length || 0;
            drumexGrooves = state.grooves?.length || 0;
          }
        } catch {}

        try {
          const groovex = localStorage.getItem('groovex-storage-v1');
          if (groovex) {
            const parsed = JSON.parse(groovex);
            const state = parsed.state || {};
            groovexSongs = state.recentSongs?.length || 0;
          }
        } catch {}

        return `Chordex: ${chordexPresets} presets, ${chordexProgressions} progressions, ${chordexChords} custom chords\nDrumex: ${drumexSongs} songs, ${drumexGrooves} grooves\nGroovex: ${groovexSongs} recent songs`;
      };

      const handleForceSyncNow = () => {
        wrapAction('force-sync', async () => {
          await syncController.syncNow();
          showDevToast('Force sync completed.');
        });
      };

      const handleResetSyncState = () => {
        if (
          !window.confirm(
            'WARNING: This will reset local sync state. It will NOT delete local data. Reset now?'
          )
        )
          return;
        wrapAction('reset-sync', () => {
          localStorage.removeItem('chordex_sync_meta_v1');
          localStorage.removeItem('chordex_sync_first_pull_done_v1');
          showDevToast('Local sync state reset. Re-syncing on next app open.');
          setTimeout(() => window.location.reload(), 1500);
        });
      };

      const handleUploadSnapshot = () => {
        if (
          !window.confirm(
            'Upload a full backup snapshot of your current local data to your cloud account?'
          )
        )
          return;
        wrapAction('upload-snapshot', async () => {
          await createCloudBackup('manual_dev_options');
          showDevToast('Backup snapshot uploaded successfully.');
        });
      };

      const handleClearSyncLogs = () => {
        wrapAction('clear-sync-logs', () => {
          clearConflictLogs();
          showDevToast('Sync conflict logs cleared.');
        });
      };

      const conflictLogsText =
        getConflictLogs()
          .map(
            (log) =>
              `[${new Date(log.timestamp).toLocaleTimeString()}] App: ${log.app}\nItem: ${log.itemName} (${log.itemId})\nLocal Time: ${new Date(log.localTime).toLocaleString()}\nCloud Time: ${new Date(log.cloudTime).toLocaleString()}\nResolution: ${log.resolution}`
          )
          .join('\n\n') || 'No conflicts logged in this session.';

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            paddingBottom: 32,
          }}
        >
          <SettingsSectionLabel>1. App & Build</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevInfoRow
              label="App Version"
              desc="Hardcoded version in app bundle (APP_VERSION)"
              value={APP_VERSION}
            />
            <DevInfoRow
              label="APK Version"
              desc="Android native APK binary version wrapper"
              value={devNativeVersion}
            />
            <DevInfoRow
              label="Updater Version"
              desc="Active dynamically applied bundle version"
              value={devOtaVersion}
            />
            <DevInfoRow
              label="Build Type"
              desc="Execution platform compilation target"
              value={Capacitor.isNativePlatform() ? 'Native Release' : 'Web'}
            />
            <DevInfoRow
              label="Package Name"
              desc="Unique application package identifier"
              value={devBundleId}
            />
            <DevInfoRow
              label="versionCode"
              desc="Android manifest build increment number"
              value={devVersionCode}
            />
            <DevInfoRow
              label="Firebase App ID"
              desc="Firebase application reference ID"
              value={devBundleId}
            />
            <DevInfoRow
              label="Signing Fingerprint"
              desc="Public SHA-256 production certificate key"
              value="90:0C:F2:59:18:5C:81:10:0C:DA:8B:B0:85:71:FA:23:55:2E:97:89:13:1C:F0:7A:8F:40:56:E4:D4:12:92:06"
              canCopy
            />
            <DevInfoRow
              label="Signature SHA-256"
              desc="Active loaded certificate hash key"
              value={installedPackageDetails?.signingSha256 || 'N/A'}
              canCopy
            />
            <DevInfoRow
              label="Debuggable Status"
              desc="Security debugging compiled state"
              value={Capacitor.isNativePlatform() ? 'false (Release Build)' : 'true (Web Dev Mode)'}
            />
            {!Capacitor.isNativePlatform() && (
              <>
                <DevInfoRow
                  label="Web App Version"
                  desc="Hardcoded web application version"
                  value={APP_VERSION}
                />
                <DevInfoRow
                  label="Web Sync Supported"
                  desc="Is cloud sync supported on web platforms"
                  value={diag.webSyncSupported ? 'true' : 'false'}
                />
                <DevInfoRow
                  label="Firebase Auth Available"
                  desc="Is Firebase Authentication client library available"
                  value={diag.firebaseAuthAvailable ? 'true' : 'false'}
                />
                <DevInfoRow
                  label="Firestore Available"
                  desc="Is Firestore Database client library available"
                  value={diag.firestoreAvailable ? 'true' : 'false'}
                />
                <DevInfoRow
                  label="Storage Available"
                  desc="Is Firebase Storage client library available"
                  value={diag.storageAvailable ? 'true' : 'false'}
                />
                <DevInfoRow
                  label="Device Registration"
                  desc="Status of this web device registration"
                  value={diag.deviceRegistrationStatus}
                />
              </>
            )}
          </div>

          <SettingsSectionLabel>2. Update System</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevButtonRow
              label="Check For Updates"
              desc="Run default foreground query"
              actionLabel="Check"
              actionId="check-normal"
              onPress={() =>
                wrapAction('check-normal', async () => {
                  await checkForUpdate(
                    false,
                    'developer_settings',
                    'Check For Updates button tapped'
                  );
                })
              }
            />
            <DevButtonRow
              label="Force Update Check"
              desc="Bypass all skip & check intervals"
              actionLabel="Force Check"
              actionId="check-force"
              onPress={() =>
                wrapAction('check-force', async () => {
                  await checkForUpdate(
                    true,
                    'developer_settings',
                    'Force Update Check button tapped'
                  );
                })
              }
            />
            <DevButtonRow
              label="Clear Update Cache"
              desc="Delete downloaded APK files & paths"
              actionLabel="Clear"
              actionId="clear-cache"
              onPress={handleClearUpdateCacheAction}
              isDestructive
            />
            <DevButtonRow
              label="Clear Dismissed Versions"
              desc="Reset choices for skipped versions"
              actionLabel="Clear"
              actionId="clear-dismissed"
              onPress={handleClearDismissedAction}
            />
            <DevButtonRow
              label="Clear Applied Versions"
              desc="Reset installed update database"
              actionLabel="Clear"
              actionId="clear-applied"
              onPress={handleClearAppliedAction}
            />
            <DevButtonRow
              label="Clear Failed Update State"
              desc="Clear error logs and update states"
              actionLabel="Reset"
              actionId="clear-failed"
              onPress={handleClearFailedUpdateAction}
            />
            <DevButtonRow
              label="Reset Updater State"
              desc="Revert active bundle to standard build"
              actionLabel="Reset Bundle"
              actionId="reset-updater"
              onPress={handleResetOtaAction}
              isDestructive
            />
            <DevCollapsibleRow
              label="version.json Manifest"
              desc="Cached raw content of version.json metadata"
              value={firebaseVersionJson}
              canCopy
            />
            <DevCollapsibleRow
              label="app-release.json Manifest"
              desc="Cached raw content of app-release.json metadata"
              value={firebaseAppReleaseJson}
              canCopy
            />
            <DevButtonRow
              label="Copy Update Diagnostics"
              desc="Copy full updater debug reports"
              actionLabel="Copy"
              actionId="copy-diag"
              onPress={() => {
                navigator.clipboard
                  .writeText(getDiagnosticsText())
                  .then(() => showDevToast('Diagnostics copied.'));
              }}
            />
            <DevButtonRow
              label="Export Update Diagnostics"
              desc="Save reports file to memory"
              actionLabel="Export"
              actionId="export-diag"
              onPress={() => wrapAction('export-diag', handleExportDiagnostics)}
            />
          </div>

          <SettingsSectionLabel>3. AppInstaller & Plugins</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevInfoRow
              label="AppInstaller Available"
              value={updateDebugLogs.appInstallerAvailable ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="downloadApk Available"
              value={updateDebugLogs.downloadApkAvailable ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="verifyApkSha256 Available"
              value={updateDebugLogs.verifyApkSha256Available ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="installApk Available"
              value={updateDebugLogs.installApkAvailable ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="openInstallPermissionSettings Available"
              value={updateDebugLogs.openInstallPermissionSettingsAvailable ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="Registered Capacitor Plugins"
              value={updateDebugLogs.registeredPlugins}
            />
            <DevButtonRow
              label="Validate Installer Capability"
              desc="Perform active registration assertions"
              actionLabel="Validate"
              actionId="validate-installer"
              onPress={handleValidateInstallerAction}
            />

            {Capacitor.isNativePlatform() && installedPackageDetails && (
              <>
                <div style={{ height: 1, background: 'rgba(128,128,128,0.12)', margin: '8px 0' }} />
                <div
                  style={{
                    fontFamily: 'Manrope',
                    fontWeight: 800,
                    fontSize: 'var(--font-section-label)',
                    padding: '4px 0',
                    opacity: 0.75,
                    color: 'var(--c-text-primary)',
                  }}
                >
                  Installed Package Details
                </div>
                <DevInfoRow
                  label="Installed Package Name"
                  value={installedPackageDetails.packageName}
                />
                <DevInfoRow
                  label="Installed Version Name"
                  value={installedPackageDetails.versionName}
                />
                <DevInfoRow
                  label="Installed Version Code"
                  value={String(installedPackageDetails.versionCode)}
                />
                <DevInfoRow
                  label="Installed Signature SHA-256"
                  value={installedPackageDetails.signatures}
                  canCopy
                />
              </>
            )}

            {Capacitor.isNativePlatform() && downloadedApkDetails && (
              <>
                <div style={{ height: 1, background: 'rgba(128,128,128,0.12)', margin: '8px 0' }} />
                <div
                  style={{
                    fontFamily: 'Manrope',
                    fontWeight: 800,
                    fontSize: 'var(--font-section-label)',
                    padding: '4px 0',
                    opacity: 0.75,
                    color: 'var(--c-text-primary)',
                  }}
                >
                  Downloaded APK Details
                </div>
                <DevInfoRow
                  label="Downloaded Package Name"
                  value={downloadedApkDetails.packageName}
                />
                <DevInfoRow
                  label="Downloaded Version Name"
                  value={downloadedApkDetails.versionName}
                />
                <DevInfoRow
                  label="Downloaded Version Code"
                  value={String(downloadedApkDetails.versionCode)}
                />
                <DevInfoRow
                  label="Downloaded Signature SHA-256"
                  value={downloadedApkDetails.signingSha256}
                  canCopy
                />
                <DevInfoRow
                  label="Debuggable"
                  value={downloadedApkDetails.debuggable ? 'TRUE' : 'FALSE'}
                />
                <DevInfoRow
                  label="APK Valid"
                  value={downloadedApkDetails.isValidApk ? 'TRUE' : 'FALSE'}
                />
              </>
            )}

            {Capacitor.isNativePlatform() && apkEligibility && (
              <>
                <div style={{ height: 1, background: 'rgba(128,128,128,0.12)', margin: '8px 0' }} />
                <div
                  style={{
                    fontFamily: 'Manrope',
                    fontWeight: 800,
                    fontSize: 'var(--font-section-label)',
                    padding: '4px 0',
                    opacity: 0.75,
                    color: 'var(--c-text-primary)',
                  }}
                >
                  APK Install Eligibility
                </div>
                <DevInfoRow
                  label="Package Name Match"
                  value={
                    apkEligibility.installed?.packageName && apkEligibility.downloaded?.packageName
                      ? String(
                          apkEligibility.installed.packageName ===
                            apkEligibility.downloaded.packageName
                        ).toUpperCase()
                      : 'N/A'
                  }
                />
                <DevInfoRow
                  label="Signing Certificate Match"
                  value={
                    apkEligibility.installed?.signingSha256 &&
                    apkEligibility.downloaded?.signingSha256
                      ? String(
                          apkEligibility.installed.signingSha256.replace(/:/g, '').toLowerCase() ===
                            apkEligibility.downloaded.signingSha256.replace(/:/g, '').toLowerCase()
                        ).toUpperCase()
                      : 'N/A'
                  }
                />
                <DevInfoRow
                  label="New Version Code Higher"
                  value={
                    apkEligibility.installed?.versionCode && apkEligibility.downloaded?.versionCode
                      ? String(
                          apkEligibility.downloaded.versionCode >
                            apkEligibility.installed.versionCode
                        ).toUpperCase()
                      : 'N/A'
                  }
                />
                <DevInfoRow
                  label="APK Installable"
                  value={apkEligibility.eligible ? 'TRUE' : 'FALSE'}
                />
                <DevInfoRow
                  label="Final Decision"
                  value={apkEligibility.eligible ? 'CAN INSTALL' : 'CANNOT INSTALL'}
                />
                {!apkEligibility.eligible && (
                  <DevInfoRow
                    label="Reason if Cannot Install"
                    value={apkEligibility.errorDetails || apkEligibility.reason || 'N/A'}
                  />
                )}
              </>
            )}
          </div>

          <SettingsSectionLabel>4. Storage & Sync</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevInfoRow
              label="Active Sync Provider"
              value={diag.activeSyncProvider || 'firebase-legacy'}
            />
            <DevInfoRow label="Database Provider" value={diag.databaseProvider || 'firestore'} />
            <DevInfoRow label="Auth UID" value={diag.authUid} />
            <DevInfoRow label="Current Device ID" value={diag.deviceId || diag.currentDeviceId} />

            {diag.activeSyncProvider === 'supabase-realtime' ? (
              <>
                <DevInfoRow label="Supabase Host" value={diag.supabaseUrlHost || 'N/A'} />
                <DevInfoRow
                  label="Supabase Key Mask"
                  value={
                    diag.supabaseAnonKeyPrefix
                      ? `${diag.supabaseAnonKeyPrefix}... (${diag.supabaseAnonKeyLength} chars)`
                      : 'N/A'
                  }
                />
                <DevInfoRow
                  label="Supabase Client Ready"
                  value={diag.supabaseClientReady ? 'Yes' : 'No'}
                />
                <DevInfoRow
                  label="Supabase Db Available"
                  value={diag.supabaseDbAvailable ? 'Yes' : 'No'}
                />
                <DevInfoRow
                  label="Supabase Auth Strategy"
                  value={diag.supabaseAuthStrategy || 'N/A'}
                />
                <DevInfoRow label="Supabase Mapped User ID" value={diag.mappedUserId || 'N/A'} />
                <DevInfoRow label="Supabase RLS User ID" value={diag.rlsUserId || 'N/A'} />
                <DevInfoRow label="Devices Table" value={diag.devicesTable || 'user_devices'} />
                <DevInfoRow label="Device Row Key" value={diag.deviceRowId || 'N/A'} />
                <DevInfoRow label="Probe Table" value={diag.probeTable || 'sync_probe'} />
                <DevInfoRow label="Probe Row Key" value={diag.probeRowId || 'N/A'} />
                <DevInfoRow
                  label="Direct Write Table"
                  value={diag.directWriteTable || 'debug_writes'}
                />
                <DevInfoRow label="Direct Write Row Key" value={diag.directWriteRowId || 'N/A'} />
                <DevInfoRow label="Profiles Table" value={diag.profileTable || 'user_profiles'} />
                <DevInfoRow
                  label="Appearance Table"
                  value={diag.appearanceTable || 'user_appearance_settings'}
                />
                <DevInfoRow
                  label="Preferences Table"
                  value={diag.preferencesTable || 'user_preferences'}
                />
                <DevInfoRow
                  label="Supabase Client Init Error"
                  value={diag.supabaseInitError || 'None'}
                />
                <DevInfoRow
                  label="Last Supabase Auth Error"
                  value={diag.lastSupabaseAuthError || 'None'}
                />
              </>
            ) : (
              <>
                <DevInfoRow
                  label="Current Device Doc Path"
                  value={diag.currentDeviceDocPath}
                  canCopy
                />
                <DevInfoRow label="Firebase Project ID" value={diag.firebaseProjectId} />
                <DevInfoRow
                  label="Devices Collection Path"
                  value={diag.devicesCollectionPath}
                  canCopy
                />
                <DevInfoRow label="Device write path" value={diag.deviceWritePath || 'N/A'} />
                <DevInfoRow
                  label="Device listener path"
                  value={diag.devicesListenerPath || 'N/A'}
                />
                <DevInfoRow label="Probe write path" value={diag.probeWritePath || 'N/A'} />
                <DevInfoRow label="Probe listener path" value={diag.probeListenerPath || 'N/A'} />
                <DevInfoRow label="Direct write path" value={diag.directWritePath || 'N/A'} />
              </>
            )}

            <DevInfoRow label="Devices Snapshot Count" value={String(diag.devicesSnapshotCount)} />
            <DevInfoRow label="Devices Snapshot IDs" value={diag.devicesSnapshotIds} />
            <DevInfoRow label="Last Device Write Success" value={diag.lastDeviceWriteSuccess} />
            <DevInfoRow label="Last Device Write Error" value={diag.lastDeviceWriteError} />
            <DevInfoRow label="Last Devices Listener Error" value={diag.lastDevicesListenerError} />
            <DevInfoRow label="Build Type" value={diag.buildType} />
            <DevInfoRow label="Platform" value={diag.platform} />
            <DevInfoRow label="Sync Enabled" value={diag.syncEnabled ? 'TRUE' : 'FALSE'} />
            <DevInfoRow
              label="Firestore Connected"
              value={diag.firestoreConnected ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="Profile Listener Active"
              value={diag.profileListenerActive ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="Appearance Listener Active"
              value={diag.appearanceListenerActive ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="Preferences Listener Active"
              value={diag.preferencesListenerActive ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow
              label="Devices Listener Active"
              value={diag.devicesListenerActive ? 'TRUE' : 'FALSE'}
            />
            <DevInfoRow label="Last Sync Success" value={diag.lastSyncSuccess} />
            <DevInfoRow label="Last Profile Sync" value={diag.lastProfileSync} />
            <DevInfoRow label="Last Appearance Sync" value={diag.lastAppearanceSync} />
            <DevInfoRow label="Last Preferences Sync" value={diag.lastPreferencesSync} />
            <DevInfoRow label="Pending Writes" value={String(diag.pendingWrites)} />
            <DevInfoRow label="Last Sync Error" value={diag.lastSyncError} />
            <DevInfoRow label="Local Display Name" value={diag.localDisplayName} />
            <DevInfoRow label="Remote Display Name" value={diag.remoteDisplayName} />
            <DevInfoRow label="Local Theme" value={diag.localTheme} />
            <DevInfoRow label="Remote Theme" value={diag.remoteTheme} />
            <DevInfoRow label="Local Photo URL" value={diag.localPhotoURL} canCopy />
            <DevInfoRow label="Remote Photo URL" value={diag.remotePhotoURL} canCopy />
            <DevInfoRow
              label="Registered Devices Count"
              value={String(diag.registeredDevicesCount)}
            />
            <DevInfoRow
              label="Last Remote Update Timestamp"
              value={diag.lastRemoteUpdateTimestamp}
            />
            <DevInfoRow label="Last Local Update Timestamp" value={diag.lastLocalUpdateTimestamp} />

            <DevInfoRow
              label="Local Storage Status"
              desc="Key counts and total memory estimation"
              value={localStorageStatus}
            />
            <DevInfoRow label="Local Records by Category" value={getLocalRecordCounts()} />
            <DevInfoRow label="Sync Conflict Count" value={String(getConflictLogs().length)} />
            <DevCollapsibleRow
              label="Sync Conflict Logs"
              desc="Item-level conflicts logged during merge runs"
              value={conflictLogsText}
              canCopy
            />
            <DevCollapsibleRow
              label="Capacitor Preferences Dump"
              desc="Read values in Capacitor Preferences storage"
              value={preferencesDump}
              canCopy
            />

            <DevButtonRow
              label="Force Sync Now"
              desc="Bypass all throttling and trigger cloud sync"
              actionLabel="Sync Now"
              actionId="force-sync"
              onPress={handleForceSyncNow}
            />
            <DevButtonRow
              label="Register This Device Now"
              desc="Manually write/update this device document in Firestore"
              actionLabel="Register"
              actionId="register-device-now"
              onPress={async () => {
                if (!authUser?.uid) {
                  showDevToast('Error: Not signed in');
                  return;
                }
                await wrapAction('register-device-now', async () => {
                  await registerCurrentDevice(authUser.uid, 'dev-options-button');
                  showDevToast('Device registration completed.');
                });
              }}
            />
            <DevButtonRow
              label="Reconnect Devices"
              desc="Force heartbeat and rebuild active Firestore listeners"
              actionLabel="Reconnect"
              actionId="reconnect-devices"
              onPress={async () => {
                if (!authUser?.uid) {
                  showDevToast('Error: Not signed in');
                  return;
                }
                await wrapAction('reconnect-devices', async () => {
                  await reconnectDevices();
                  showDevToast('Device reconnection completed.');
                });
              }}
            />
            <DevButtonRow
              label="Push Local Settings to Cloud"
              desc="Overwrite cloud profile/settings with this device's state"
              actionLabel="Push Settings"
              actionId="push-settings"
              onPress={async () => {
                if (window.confirm('Overwrite cloud settings with local state?')) {
                  await wrapAction('push-settings', pushLocalSettingsToCloud);
                  showDevToast('Settings pushed successfully.');
                }
              }}
            />
            <DevButtonRow
              label="Pull Cloud Settings to Device"
              desc="Overwrite local settings with cloud profile/settings"
              actionLabel="Pull Settings"
              actionId="pull-settings"
              onPress={async () => {
                if (window.confirm('Overwrite local settings with cloud state?')) {
                  await wrapAction('pull-settings', pullCloudSettingsFromCloud);
                  showDevToast('Settings pulled successfully.');
                }
              }}
            />
            <DevButtonRow
              label="Copy Sync Diagnostics"
              desc="Copy formatted sync state details to clipboard"
              actionLabel="Copy"
              actionId="copy-sync-diag"
              onPress={() => {
                const report = Object.entries(getSyncDiagnostics())
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('\n');
                navigator.clipboard
                  .writeText(report)
                  .then(() => showDevToast('Sync diagnostics copied.'));
              }}
            />
            <DevButtonRow
              label="Reset Local Sync State Only"
              desc="Clear metadata to force a clean pull next open"
              actionLabel="Reset Sync State"
              actionId="reset-sync"
              onPress={handleResetSyncState}
              isDestructive
            />
            <DevButtonRow
              label="Upload Local Data Snapshot"
              desc="Write a custom backup doc to backups collection"
              actionLabel="Upload Backup"
              actionId="upload-snapshot"
              onPress={handleUploadSnapshot}
            />
            <DevButtonRow
              label="Clear Sync Logs & Errors"
              desc="Flush all logged conflict history and reset phase error"
              actionLabel="Clear Logs"
              actionId="clear-sync-logs"
              onPress={handleClearSyncLogs}
            />

            <DevButtonRow
              label="Clear Temporary Files"
              desc="Reset session-scoped configs"
              actionLabel="Clear"
              actionId="clear-temp"
              onPress={handleClearTemporaryAction}
            />
            <DevButtonRow
              label="Export Local Diagnostics"
              desc="Download complete preferences and storage dump"
              actionLabel="Export"
              actionId="export-local"
              onPress={handleExportLocalDiagnosticsAction}
            />
          </div>

          <SettingsSectionLabel>5. UI & Navigation</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevInfoRow label="Current Root View" value="App" />
            <DevInfoRow label="Current Active App" value="hub" />
            <DevInfoRow label="Return-to-Hub State" value="Idle" />
            <DevInfoRow
              label="Overlay State"
              desc="Count of active modals/sheets in viewport"
              value={String(document.querySelectorAll('.modal-backdrop, .overlay').length)}
            />
            <DevInfoRow label="Transition State" value="Inactive" />
            <DevButtonRow
              label="Reset App Shell State"
              desc="Revert all store configurations to default"
              actionLabel="Reset Shell"
              actionId="reset-shell"
              onPress={handleResetAppShellAction}
              isDestructive
            />
            <DevButtonRow
              label="Force Return to Hub"
              desc="Bypass view locks & trigger returnToStudioHub"
              actionLabel="Trigger Return"
              actionId="force-return"
              onPress={handleForceReturnHubAction}
            />
          </div>

          <SettingsSectionLabel>6. Danger Zone</SettingsSectionLabel>
          <div style={cardStyle}>
            <DevButtonRow
              label="Reset Developer Options"
              desc="Disable developer options and lock this menu"
              actionLabel="Reset"
              actionId="reset-developer"
              onPress={handleResetDeveloperAction}
              isDestructive
            />
            <DevButtonRow
              label="Clear Debug Logs"
              desc="Reset all current memory logs"
              actionLabel="Clear Logs"
              actionId="clear-logs"
              onPress={handleClearDebugLogsAction}
              isDestructive
            />
            <DevButtonRow
              label="Reset Update State"
              desc="Wipe update configurations, logs & choices"
              actionLabel="Reset Update State"
              actionId="reset-update-state"
              onPress={handleResetUpdateStateAction}
              isDestructive
            />
            <DevButtonRow
              label="Disable Developer Options"
              desc="Exit developer mode immediately"
              actionLabel="Disable"
              actionId="disable-dev"
              onPress={handleResetDeveloperAction}
              isDestructive
            />
          </div>
        </div>
      );
    } catch (e: any) {
      console.error('Error rendering Developer Options:', e);
      return (
        <div
          style={{
            padding: '24px 0',
            color: 'var(--c-text-secondary)',
            fontFamily: 'Manrope',
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: '#ef4444', marginBottom: 12 }}
          >
            error
          </span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--c-text-primary)' }}>
            Diagnostics unavailable
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>
            An error occurred while loading developer details.
          </p>
        </div>
      );
    }
  }

  function renderAboutContent() {
    const subAppLogos: { key: string; node: React.ReactNode; label: string }[] = [
      { key: 'chordex', label: 'Chordex', node: <ChordexLogo size={34} /> },
      { key: 'drumex', label: 'Drumex', node: <DrumexLogo size={34} /> },
      { key: 'stagex', label: 'Stagex', node: <StagexLogoIcon size={34} /> },
      { key: 'groovex', label: 'Groovex', node: <GroovexLogo size={34} /> },
      { key: 'vocalex', label: 'Vocalex', node: <VocalexLogo size={34} /> },
    ];

    const heroCardStyle: React.CSSProperties = isWebDesktop
      ? {
          background: 'transparent',
          borderRadius: '0px',
          border: 'none',
          padding: 'var(--space-6) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }
      : {
          ...cardStyle,
          padding: 'var(--space-6) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        };

    return (
      <SettingsContentContainer style={{ paddingBottom: 'var(--space-6)' }}>
        <div style={heroCardStyle}>
          <SpotlightLogo onClick={handleLogoTap} />
          <p
            style={{
              margin: 'var(--space-4) 0 0',
              fontFamily: 'Manrope',
              fontWeight: 800,
              fontSize: 'var(--font-display-sm)',
              letterSpacing: '-0.03em',
              color: 'var(--c-text-primary)',
              lineHeight: 1.1,
            }}
          >
            Livex
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: 'Inter',
              fontSize: 13,
              color: 'var(--c-text-secondary)',
              fontWeight: 500,
            }}
          >
            {t.settings.about.version} {APP_VERSION_LABEL}
          </p>
          <p
            style={{
              margin: 'var(--space-3.5) 0 0',
              fontFamily: 'Inter',
              fontSize: 13,
              color: 'var(--c-text-secondary)',
              lineHeight: 1.5,
              padding: '0 8px',
            }}
          >
            {lang === 'es'
              ? 'Suite de producción musical todo en uno. Graba, mezcla, sintetiza y compone pistas directamente en tu dispositivo.'
              : 'All-in-one music production suite. Record, mix, synthesize, and compose tracks directly on your device.'}
          </p>
        </div>

        <div style={cardStyle}>
          {[
            {
              title: lang === 'es' ? 'Condiciones de Servicio' : 'Terms of Service',
              icon: 'gavel',
              page: 'terms' as SettingsPageId,
            },
            {
              title: lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy',
              icon: 'security',
              page: 'privacy-policy' as SettingsPageId,
            },
            {
              title: lang === 'es' ? 'Licencias de Software' : 'Software Licenses',
              icon: 'receipt_long',
              page: 'licenses' as SettingsPageId,
            },
          ].map(({ title, icon, page }) => (
            <motion.button
              key={page}
              onClick={() => navigate(page)}
              whileTap={{ scale: 0.985 }}
              whileHover={{ scale: 1.006 }}
              transition={SpringPresets.soft}
              className="hover:bg-white/5 transition-colors"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '14px 16px',
                borderBottom: '1px solid var(--c-border)',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                color: 'var(--c-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--c-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {icon}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 750,
                    fontSize: 14,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </span>
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: 'var(--c-text-secondary)', opacity: 0.6 }}
                >
                  chevron_right
                </span>
              </div>
            </motion.button>
          ))}

          <motion.button
            onClick={() => window.open('https://github.com/MAGEXE1000/Studio', '_system')}
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.006 }}
            transition={SpringPresets.soft}
            className="hover:bg-white/5 transition-colors"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--c-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--c-text-secondary)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  code
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 750,
                  fontSize: 14,
                  letterSpacing: '-0.01em',
                }}
              >
                {lang === 'es' ? 'Créditos y Repositorio' : 'Credits & GitHub'}
              </span>
            </div>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'var(--c-text-secondary)', opacity: 0.6 }}
              >
                open_in_new
              </span>
            </div>
          </motion.button>
        </div>

        <div
          style={{
            padding: '16px 0 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 2,
              borderRadius: 999,
              background: 'rgba(128,128,128,0.25)',
              marginBottom: 4,
            }}
          />
          <p
            style={{
              color: 'var(--c-text-muted)',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: 'var(--font-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              margin: 0,
            }}
          >
            {t.settings.about.footer}
          </p>
        </div>
      </SettingsContentContainer>
    );
  }

  function renderLicensesContent() {
    const licenses = [
      { name: 'React', license: 'MIT', desc: 'A JavaScript library for building user interfaces.' },
      { name: 'React DOM', license: 'MIT', desc: 'React package for working with the DOM.' },
      {
        name: 'Motion (Framer Motion)',
        license: 'MIT',
        desc: 'A production-ready motion library for React.',
      },
      {
        name: 'Zustand',
        license: 'MIT',
        desc: 'A small, fast, and scalable bearbones state-management solution.',
      },
      { name: 'Firebase SDK', license: 'Apache-2.0', desc: 'Firebase services client library.' },
      { name: 'Supabase JS', license: 'MIT', desc: 'Isomorphic JavaScript client for Supabase.' },
      {
        name: 'Capacitor Core',
        license: 'MIT',
        desc: 'Cross-platform native runtime for web apps.',
      },
      { name: 'i18next', license: 'MIT', desc: 'Internationalization framework for JavaScript.' },
      { name: 'Lucide React', license: 'ISC', desc: 'Beautiful & consistent icon toolkit.' },
    ];
    return (
      <SettingsContentContainer style={{ paddingBottom: 'var(--space-6)' }}>
        <div style={cardStyle}>
          {licenses.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 16px',
                borderBottom:
                  idx === licenses.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'var(--c-text-primary)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--c-text-secondary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {item.license}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: 'var(--c-text-secondary)',
                  lineHeight: 1.35,
                  opacity: 0.8,
                }}
              >
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </SettingsContentContainer>
    );
  }

  function renderMobileProfileCard() {
    const name = authUser?.displayName || 'Guest User';
    const email =
      authUser?.email ||
      (lang === 'es'
        ? 'Inicia sesión para respaldar tu música'
        : 'Sign in to back up your music & settings');
    const photo = customPhoto || authUser?.photoURL;
    const initial = (name[0] ?? 'S').toUpperCase();
    const hasUser = !!authUser;

    return (
      <motion.button
        type="button"
        onClick={() => onProfile?.()}
        whileTap={{ scale: 0.985 }}
        whileHover={{ scale: 1.008 }}
        transition={SpringPresets.soft}
        className="outline-none"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 18px',
          background: 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.04))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 22,
          cursor: 'pointer',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'left',
          boxSizing: 'border-box',
          backdropFilter: 'var(--surface-float-blur)',
          WebkitBackdropFilter: 'var(--surface-float-blur)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Top Specular Rim */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 14,
            right: 14,
            height: '1px',
            background: 'var(--surface-glass-rim)',
            pointerEvents: 'none',
            opacity: 0.7,
          }}
        />

        {/* Ambient Gradient Glow */}
        <div
          style={{
            position: 'absolute',
            top: -24,
            right: -24,
            width: 120,
            height: 120,
            background: `radial-gradient(circle, ${accent.from}22 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            zIndex: 2,
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* Avatar Squircle / Circle Pod */}
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid rgba(255, 255, 255, 0.15)`,
              background: `linear-gradient(135deg, ${accent.from}30, ${accent.to}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${accent.from}30, inset 0 1px 1.5px rgba(255, 255, 255, 0.35)`,
              position: 'relative',
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : hasUser ? (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 850,
                  fontFamily: 'Manrope, sans-serif',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {initial}
              </span>
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: 'var(--c-text-secondary)', opacity: 0.9 }} // token-guard-ignore
              >
                account_circle
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 850,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.025em',
                  fontFamily: 'Manrope, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {hasUser ? name : lang === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </h2>
              {hasUser && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    fontFamily: 'Manrope, sans-serif',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${accent.from}30, ${accent.to}25)`,
                    color: '#ffffff',
                    border: `1px solid ${accent.from}50`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    boxShadow: `0 2px 8px ${accent.from}25`,
                  }}
                >
                  Pro
                </span>
              )}
            </div>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12.5,
                color: 'var(--c-text-secondary)',
                margin: '2px 0 0',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: 0.82,
              }}
            >
              {email}
            </p>
          </div>
        </div>

        {/* Chevron Pod */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            marginLeft: 10,
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 16,
              color: 'var(--c-text-secondary)',
              opacity: 0.7,
            }}
          >
            chevron_right
          </span>
        </div>
      </motion.button>
    );
  }

  function renderProfile() {
    const profileCardStyle: React.CSSProperties = isWebDesktop
      ? {
          background: 'transparent',
          borderRadius: '0px',
          overflow: 'visible',
          border: 'none',
          boxShadow: 'none',
          padding: '0px',
        }
      : {
          background: 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.03))',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
          backdropFilter: 'var(--surface-float-blur)',
          WebkitBackdropFilter: 'var(--surface-float-blur)',
          padding: '20px',
        };

    const guestCardStyle: React.CSSProperties = isWebDesktop
      ? {
          background: 'transparent',
          borderRadius: '0px',
          overflow: 'visible',
          border: 'none',
          boxShadow: 'none',
          marginBottom: 20,
        }
      : {
          background: 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.03))',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
          backdropFilter: 'var(--surface-float-blur)',
          WebkitBackdropFilter: 'var(--surface-float-blur)',
          marginBottom: 20,
        };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          width: '100%',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <Suspense fallback={null}>
          {authUser ? (
            <AccountSettingsPage accent={accent} cardStyle={profileCardStyle} onBack={goBack} />
          ) : (
            <div style={{ paddingBottom: 80 }}>
              <div style={{ marginBottom: 16 }}>
                <SpotlightLogo onClick={handleLogoTap} />
              </div>
              <AccountCard
                accent={accent}
                cardStyle={guestCardStyle}
                rowStyle={{
                  padding: isWebDesktop ? '13px 0px' : '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              />
            </div>
          )}
        </Suspense>
      </div>
    );
  }

  function RenderUpdaterContent() {
    const isNative = Capacitor.isNativePlatform();
    const [autoUpdates, setAutoUpdates] = useState(() => {
      return localStorage.getItem('studio:automatic_updates') !== 'false';
    });
    const handleToggleAutoUpdates = (val: boolean) => {
      setAutoUpdates(val);
      localStorage.setItem('studio:automatic_updates', String(val));
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          width: '100%',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <SettingSection title={lang === 'es' ? 'SISTEMA DE ACTUALIZACIONES' : 'UPDATE SYSTEM'}>
          {/* Current Version */}
          <SettingRow
            label={lang === 'es' ? 'Versión actual' : 'Current Version'}
            desc={`${APP_VERSION_TAG} ${APP_VERSION} (Build ${APP_VERSION_DATE})`}
          >
            <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontWeight: 600 }}>
              {lang === 'es' ? 'Instalado' : 'Installed'}
            </span>
          </SettingRow>

          {/* Check for Updates */}
          <SettingRow
            label={lang === 'es' ? 'Buscar actualizaciones' : 'Check for Updates'}
            desc={getUpdaterStatusText(updater, lang)}
          >
            {updater.loading ? (
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  color: accent.from,
                  animation: 'updater-check-spin 1s linear infinite',
                  display: 'inline-block',
                }}
              >
                refresh
              </span>
            ) : updater.updateAvailable ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => window.dispatchEvent(new CustomEvent('studio:open-update-dialog'))}
                icon={
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE'].includes(
                      updater.updateState
                    )
                      ? 'install_mobile'
                      : 'download'}
                  </span>
                }
              >
                {['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE'].includes(
                  updater.updateState
                )
                  ? lang === 'es'
                    ? 'Instalar'
                    : 'Install Update'
                  : lang === 'es'
                    ? 'Continuar'
                    : 'Continue Update'}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await updater.checkNow();
                }}
              >
                {lang === 'es' ? 'Buscar' : 'Check Now'}
              </Button>
            )}
          </SettingRow>

          {/* Automatic Updates */}
          <SettingRow
            label={lang === 'es' ? 'Actualizaciones automáticas' : 'Automatic Updates'}
            desc={
              lang === 'es'
                ? 'Buscar y descargar compilaciones en segundo plano'
                : 'Check and download builds in the background'
            }
          >
            <Toggle value={autoUpdates} onChange={handleToggleAutoUpdates} />
          </SettingRow>

          {/* Update Diagnostics */}
          <SettingRow
            label={lang === 'es' ? 'Diagnósticos de actualización' : 'Update Diagnostics'}
            desc={
              lang === 'es'
                ? 'Copiar informes de depuración y estado del actualizador'
                : 'Copy debug reports and check recovery logs'
            }
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const report = await updater.getDiagnosticsReport();
                  await navigator.clipboard.writeText(report);
                  showDevToast(
                    lang === 'es' ? 'Copiado al portapapeles' : 'Copied report to clipboard'
                  );
                } catch (e) {
                  alert(e instanceof Error ? e.message : String(e));
                }
              }}
              icon={
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  content_copy
                </span>
              }
            >
              {lang === 'es' ? 'Copiar' : 'Copy'}
            </Button>
          </SettingRow>

          {/* Changelog */}
          <SettingRow
            label={lang === 'es' ? 'Historial de cambios' : 'Changelog'}
            desc={
              lang === 'es'
                ? 'Ver notas de lanzamiento completas'
                : 'View full chronological release notes'
            }
          >
            <button
              onClick={() => navigate('changelog')}
              className="btn-smooth animate-click"
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--c-text-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 'var(--font-section-label)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                history
              </span>
              {lang === 'es' ? 'Ver' : 'View'}
            </button>
          </SettingRow>
        </SettingSection>

        {/* About this Update */}
        {updater.updateAvailable && updater.changelog && (
          <SettingSection
            title={lang === 'es' ? 'ACERCA DE ESTA ACTUALIZACIÓN' : 'ABOUT THIS UPDATE'}
          >
            <div
              style={{
                padding: 'var(--density-row-pad)',
                color: 'var(--c-text-secondary)',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 10px 0', fontWeight: 700, color: 'var(--c-text-primary)' }}>
                {lang === 'es' ? 'Novedades en v' : "What's new in v"}
                {updater.remoteVersion}:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {updater.changelog.split('\n').map((line, idx) => {
                  const cleanLine = line.replace(/^[•\s*-]+/g, '').trim();
                  if (!cleanLine) return null;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: accent.from, marginTop: 1 }}>•</span>
                      <span>{cleanLine}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SettingSection>
        )}

        {/* Recovery official releases link */}
        {isNative && (
          <SettingSection title={lang === 'es' ? 'RECUPERACIÓN' : 'RECOVERY'}>
            <SettingRow
              label={lang === 'es' ? 'Descargas oficiales' : 'Official Downloads'}
              desc={
                lang === 'es'
                  ? 'Descargar compilaciones firmadas desde GitHub'
                  : 'Download signed production builds from GitHub'
              }
            >
              <button
                onClick={() =>
                  window.open('https://github.com/MAGEXE1000/Studio/releases', '_system')
                }
                className="btn-smooth animate-click"
                style={{
                  padding: '6px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--c-text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 'var(--font-section-label)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  download
                </span>
                GitHub
              </button>
            </SettingRow>
          </SettingSection>
        )}
      </div>
    );
  }

  function renderActivePageContent(activePageId: SettingsPageId) {
    switch (activePageId as any) {
      case 'general':
        return renderGeneralContent();
      case 'updater':
        return <RenderUpdaterContent />;
      case 'appearance':
        console.log(
          '[APPEARANCE-RUNTIME-PROOF] StudioHub renderActivePageContent rendering StudioHubSettingsPanel for page: appearance'
        );
        return <StudioHubSettingsPanel />;

      case 'privacy':
        return renderPrivacyContent();
      case 'about':
        return renderAboutContent();
      case 'licenses':
        return renderLicensesContent();
      case 'profile':
      case 'personal-info':
      case 'security-login':
      case 'subscription':
      case 'devices-sessions':
      case 'privacy-data':
        return renderProfile();
      case 'release-notes':
        return renderReleaseNotesContent();
      case 'changelog':
        return renderChangelogContent();
      case 'help-center':
        return renderHelpCenterContent();
      case 'faq':
        return renderFaqContent();
      case 'terms':
        return renderTermsContent();
      case 'privacy-policy':
        return renderPrivacyPolicyContent();
      case 'bug-report':
        return renderBugReportContent();
      default:
        return renderGeneralContent();
    }
  }

  /* ── MOBILE DRILL DOWN LAYOUTS ──────────────────────────────────── */
  if (!isWebDesktop) {
    const standardScrollPages: SettingsPageId[] = [
      'general',
      'updater',
      'changelog',
      'appearance',
      'language',
      'privacy',
      'about',
      'debug',
      'profile',
      'release-notes',
      'help-center',
      'faq',
      'terms',
      'privacy-policy',
      'bug-report',
      'personal-info',
      'security-login',
      'subscription',
      'devices-sessions',
      'privacy-data',
    ];

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <SharedNavigationContainer
          activeView={page}
          viewOrder={[
            'main',
            'general',
            'updater',
            'changelog',
            'appearance',
            'language',
            'privacy',
            'about',
            'debug',
            'profile',
            'release-notes',
            'help-center',
            'faq',
            'terms',
            'privacy-policy',
            'bug-report',
            'developer',
            'notifications',
            'personal-info',
            'security-login',
            'subscription',
            'devices-sessions',
            'privacy-data',
          ]}
          preMountViews={[
            'main',
            'general',
            'updater',
            'appearance',
            'language',
            'privacy',
            'about',
            'profile',
          ]}
        >
          {(pageId) => {
            if (pageId === 'developer') {
              return (
                <Suspense
                  fallback={
                    <div
                      style={{
                        padding: 24,
                        color: 'var(--c-text-secondary)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Loading Developer Panel...
                    </div>
                  }
                >
                  <DevToolsDashboard accent={accent} onBack={goBack} />
                </Suspense>
              );
            }

            if (standardScrollPages.includes(pageId as SettingsPageId)) {
              const toolbarActions = undefined;

              return (
                <SettingsScaffold
                  title={getPageTitle(pageId as SettingsPageId)}
                  onBack={goBack}
                  toolbarActions={toolbarActions}
                  hideBack={pageId === 'profile'}
                >
                  {renderActivePageContent(pageId as SettingsPageId)}
                </SettingsScaffold>
              );
            }
            if (pageId === 'main') {
              return (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    ref={localScrollRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '0',
                      paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)',
                      WebkitOverflowScrolling: 'touch',
                    }}
                    className="no-scrollbar"
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 'var(--content-max-w)',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        boxSizing: 'border-box',
                        paddingLeft: 'var(--page-inset-h)',
                        paddingRight: 'var(--page-inset-h)',
                      }}
                    >
                      <StudioHeader
                        title="Settings"
                        subtitle="Livex System"
                        containerStyle={{ paddingLeft: 0, paddingRight: 0 }}
                      />

                      {/* Minimal Update Card */}
                      {updater.updateAvailable && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10)`,
                            border: `1px solid ${accent.from}35`,
                            borderRadius: 20,
                            padding: 16,
                            marginBottom: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            boxShadow: `0 6px 24px ${accent.from}14, inset 0 1px 1px rgba(255, 255, 255, 0.20)`,
                            backdropFilter: 'var(--surface-float-blur)',
                            WebkitBackdropFilter: 'var(--surface-float-blur)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: `${accent.from}22`,
                                border: `1px solid ${accent.from}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: accent.from,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 22, lineHeight: 1 }}
                              >
                                system_update
                              </span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 15,
                                  fontWeight: 800,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                Update available
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.8,
                                  fontFamily: 'Inter, sans-serif',
                                }}
                              >
                                Version {updater.remoteVersion}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => navigate('updater')}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: 12,
                                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 13,
                                fontWeight: 750,
                                fontFamily: 'Inter, sans-serif',
                                cursor: 'pointer',
                                boxShadow: `0 4px 14px ${accent.from}35`,
                              }}
                            >
                              Update
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => {
                                updater.dismissUpdate();
                              }}
                              style={{
                                padding: '10px 16px',
                                borderRadius: 12,
                                background: isLight
                                  ? 'rgba(0, 0, 0, 0.05)'
                                  : 'rgba(255, 255, 255, 0.06)',
                                border: isLight
                                  ? '1px solid rgba(0, 0, 0, 0.08)'
                                  : '1px solid rgba(255, 255, 255, 0.10)',
                                color: 'var(--c-text-secondary)',
                                fontSize: 13,
                                fontWeight: 650,
                                fontFamily: 'Inter, sans-serif',
                                cursor: 'pointer',
                              }}
                            >
                              Dismiss
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Preferences Group */}
                      <div style={{ marginBottom: 20 }}>
                        <h3
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            color: 'var(--c-text-tertiary, #808080)',
                            paddingLeft: 4,
                            marginBottom: 8,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          PREFERENCES
                        </h3>
                        <div
                          style={{
                            background: isLight
                              ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
                              : 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
                            borderRadius: 20,
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            border: isLight
                              ? '1px solid rgba(0, 0, 0, 0.06)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'var(--surface-float-blur)',
                            WebkitBackdropFilter: 'var(--surface-float-blur)',
                            boxShadow: isLight
                              ? '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                              : '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ scale: 1.008 }}
                            transition={SpringPresets.soft}
                            onClick={() => navigate('appearance')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '12px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                border: isLight
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : '1px solid rgba(255,255,255,0.10)',
                                boxShadow: isLight
                                  ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                  : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                              >
                                palette
                              </span>
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 750,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                Appearance
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--c-text-secondary)',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: 0.75,
                                }}
                              >
                                Theme, dynamic colors, accent
                              </span>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.6,
                                  fontSize: 15,
                                }}
                              >
                                chevron_right
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Help & Support Group */}
                      <div style={{ marginBottom: 20 }}>
                        <h3
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            color: 'var(--c-text-tertiary, #808080)',
                            paddingLeft: 4,
                            marginBottom: 8,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          HELP & SUPPORT
                        </h3>
                        <div
                          style={{
                            background: isLight
                              ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
                              : 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
                            borderRadius: 20,
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            border: isLight
                              ? '1px solid rgba(0, 0, 0, 0.06)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'var(--surface-float-blur)',
                            WebkitBackdropFilter: 'var(--surface-float-blur)',
                            boxShadow: isLight
                              ? '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                              : '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ scale: 1.008 }}
                            transition={SpringPresets.soft}
                            onClick={() => navigate('help-center')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '12px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                border: isLight
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : '1px solid rgba(255,255,255,0.10)',
                                boxShadow: isLight
                                  ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                  : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                              }}
                            >
                              <AnimatedIcon
                                name="circle-help"
                                size={18}
                                color="var(--c-text-secondary)"
                              />
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 750,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                Help & Support
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--c-text-secondary)',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: 0.75,
                                }}
                              >
                                Documentation and FAQ
                              </span>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.6,
                                  fontSize: 15,
                                }}
                              >
                                chevron_right
                              </span>
                            </div>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ scale: 1.008 }}
                            transition={SpringPresets.soft}
                            onClick={() => navigate('bug-report')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '12px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                border: isLight
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : '1px solid rgba(255,255,255,0.10)',
                                boxShadow: isLight
                                  ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                  : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                              >
                                bug_report
                              </span>
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 750,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                Report a Bug
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--c-text-secondary)',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: 0.75,
                                }}
                              >
                                Help us improve the workspace
                              </span>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.6,
                                  fontSize: 15,
                                }}
                              >
                                chevron_right
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* System & About Group */}
                      <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h3
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            color: 'var(--c-text-tertiary, #808080)',
                            paddingLeft: 4,
                            marginBottom: 8,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          SYSTEM & ABOUT
                        </h3>
                        <div
                          style={{
                            background: isLight
                              ? 'var(--surface-topbar-bg, rgba(255, 255, 255, 0.70))'
                              : 'linear-gradient(160deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
                            borderRadius: 20,
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            border: isLight
                              ? '1px solid rgba(0, 0, 0, 0.06)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'var(--surface-float-blur)',
                            WebkitBackdropFilter: 'var(--surface-float-blur)',
                            boxShadow: isLight
                              ? '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
                              : '0 8px 24px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ scale: 1.008 }}
                            transition={SpringPresets.soft}
                            onClick={() => navigate('updater')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '12px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                border: isLight
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : '1px solid rgba(255,255,255,0.10)',
                                boxShadow: isLight
                                  ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                  : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                              >
                                system_update
                              </span>
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 750,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                {lang === 'es' ? 'Actualizador' : 'Updater'}
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--c-text-secondary)',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: 0.75,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {getUpdaterStatusText(updater, lang)}
                                {updater.updateAvailable && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: '#ef4444',
                                      display: 'inline-block',
                                    }}
                                  />
                                )}
                              </span>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.6,
                                  fontSize: 15,
                                }}
                              >
                                chevron_right
                              </span>
                            </div>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.985 }}
                            whileHover={{ scale: 1.008 }}
                            transition={SpringPresets.soft}
                            onClick={() => navigate('about')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '12px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                border: isLight
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : '1px solid rgba(255,255,255,0.10)',
                                boxShadow: isLight
                                  ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                  : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                              >
                                info
                              </span>
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 750,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Manrope, sans-serif',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                {lang === 'es' ? 'Acerca de' : 'About'}
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--c-text-secondary)',
                                  fontFamily: 'Inter, sans-serif',
                                  opacity: 0.75,
                                }}
                              >
                                {lang === 'es'
                                  ? `Versión ${APP_VERSION_LABEL}`
                                  : `Version ${APP_VERSION_LABEL}`}
                              </span>
                            </div>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.6,
                                  fontSize: 15,
                                }}
                              >
                                chevron_right
                              </span>
                            </div>
                          </motion.div>

                          {settings.developerMode && (
                            <motion.div
                              whileTap={{ scale: 0.985 }}
                              whileHover={{ scale: 1.008 }}
                              transition={SpringPresets.soft}
                              onClick={() => navigate('developer')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '12px 14px',
                                borderRadius: 16,
                                cursor: 'pointer',
                              }}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isLight
                                    ? 'rgba(0,0,0,0.04)'
                                    : 'rgba(255,255,255,0.06)',
                                  border: isLight
                                    ? '1px solid rgba(0,0,0,0.06)'
                                    : '1px solid rgba(255,255,255,0.10)',
                                  boxShadow: isLight
                                    ? 'inset 0 1px 1px rgba(255,255,255,0.8)'
                                    : 'inset 0 1px 1px rgba(255,255,255,0.15)',
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                                >
                                  terminal
                                </span>
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14.5,
                                    fontWeight: 750,
                                    color: 'var(--c-text-primary)',
                                    fontFamily: 'Manrope, sans-serif',
                                    letterSpacing: '-0.015em',
                                  }}
                                >
                                  {lang === 'es'
                                    ? 'Opciones de Desarrollador'
                                    : 'Developer Options'}
                                </span>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--c-text-secondary)',
                                    fontFamily: 'Inter, sans-serif',
                                    opacity: 0.75,
                                  }}
                                >
                                  {lang === 'es'
                                    ? 'Herramientas de depuración'
                                    : 'Debug tools & metrics'}
                                </span>
                              </div>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: isLight
                                    ? 'rgba(0,0,0,0.03)'
                                    : 'rgba(255,255,255,0.04)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{
                                    color: 'var(--c-text-secondary)',
                                    opacity: 0.6,
                                    fontSize: 15,
                                  }}
                                >
                                  chevron_right
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        </SharedNavigationContainer>
      </div>
    );
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'var(--surface-float-blur)',
        WebkitBackdropFilter: 'var(--surface-float-blur)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setTab('home');
        }
      }}
    >
      <style>{HUB_SETTINGS_CSS}</style>
      <style>{`
        @keyframes hub-modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes settings-content-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .settings-content-animate {
          animation: settings-content-fade-in 150ms ease both;
        }
        .settings-desktop-layout .flex.items-center.justify-between.gap-4 {
          padding-left: 0px !important;
          padding-right: 0px !important;
        }
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="padding-left: 28px"],
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="paddingLeft: 28px"],
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="28px"] {
          padding-left: 12px !important;
        }
        .settings-desktop-layout div[style*="border-bottom"],
        .settings-desktop-layout div[style*="borderBottom"] {
          border-bottom: 1px solid rgba(128, 128, 128, 0.08) !important;
        }
        .settings-desktop-layout button.btn-smooth:not(.active-settings-nav):hover {
          background: var(--sidebar-hover-bg, rgba(255, 255, 255, 0.04)) !important;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          width: '880px',
          height: '640px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: 'var(--app-surface, rgba(18, 18, 18, 0.95))',
          border: '1px solid rgba(128, 128, 128, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          animation: 'hub-modal-fade-in 250ms ease both',
        }}
        className="settings-desktop-layout"
      >
        {/* Left Pane: Sub-navigation */}
        <div
          style={{
            width: '260px',
            flexShrink: 0,
            borderRight: '1px solid rgba(128, 128, 128, 0.08)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => setTab('home')}
            className="btn-smooth"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(128, 128, 128, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--c-text-primary)',
              marginBottom: 16,
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>

          <div
            style={{
              padding: '0 8px 16px 8px',
              borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-page-title)',
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'Manrope',
              }}
            >
              {lang === 'es' ? 'Ajustes de Studio' : 'Studio Settings'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {sections.map((section, secIdx) => (
              <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {secIdx > 0 && (
                  <div
                    style={{
                      height: 1,
                      borderTop: '1px solid rgba(128,128,128,0.08)',
                      margin: '4px 0 10px 0',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 'var(--font-section-label)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    padding: '0 12px 4px 12px',
                  }}
                >
                  {section.label}
                </span>
                {section.items.map((item) => {
                  const isActive = activePageId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`btn-smooth ${isActive ? 'active-settings-nav' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: isActive
                          ? 'var(--sidebar-hover-bg, rgba(255, 255, 255, 0.08))'
                          : 'transparent',
                        color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      <AnimatedIcon
                        name={item.icon}
                        size={16}
                        color={isActive ? accent.from : 'var(--c-text-secondary)'}
                        state={isActive ? 'active' : 'inactive'}
                      />
                      <span className="truncate" style={{ flex: 1 }}>
                        {item.label}
                      </span>
                      {item.id === 'updater' && updater.updateAvailable && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#ef4444',
                            marginRight: 4,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Content */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-8) var(--space-12)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <div
            key={activePageId}
            className="settings-content-animate"
            style={{ maxWidth: 'var(--content-max-w)', width: '100%', margin: '0 auto' }}
          >
            <div
              style={{
                marginBottom: 28,
                borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
                paddingBottom: 16,
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-display-page)',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  fontFamily: 'Manrope',
                }}
              >
                {getPageTitle(activePageId)}
              </h1>
            </div>

            <Suspense
              fallback={
                <div style={{ color: 'var(--c-text-secondary)', fontSize: 14 }}>
                  Loading settings...
                </div>
              }
            >
              {renderActivePageContent(activePageId)}
            </Suspense>
          </div>
        </div>

        <ChangelogSheet open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      </div>
    </div>,
    document.body
  );
}

// ── Floating bottom nav (matches Chordex/Drumex style) ───────────────────────
type HelpPageActiveId = 'main' | HelpPageId;

function HubHelp({
  accent,
  authUser,
  tab,
  setTab,
}: {
  accent: { from: string; to: string; mid: string };
  authUser?: AuthUser | null;
  tab: HubTab;
  setTab: React.Dispatch<React.SetStateAction<HubTab>>;
}) {
  const settings = useSettingsStore((state) => state.settings);
  const historyLength = useNavigationStore((s) => s.history.length);
  const t = useT();
  const lang = settings.language ?? 'en';
  const isWebDesktop = useIsWebDesktop();

  const getInitialHelpPage = () => {
    const target =
      typeof window !== 'undefined' ? sessionStorage.getItem('studio:routeToHelpPage') : null;
    if (target) {
      sessionStorage.removeItem('studio:routeToHelpPage');
      return target as HelpPageActiveId;
    }
    return 'main';
  };

  const page = useNavigationStore((s) => {
    const last = s.history[s.history.length - 1];
    return (last?.tab === 'help' ? (last.page ?? 'main') : 'main') as HelpPageActiveId;
  });
  const pageKey = historyLength;

  const curLen = historyLength;
  const prevLenRef = useRef(curLen);
  const prevDirRef = useRef<'forward' | 'backward'>('forward');

  let slideDir: 'forward' | 'backward' = prevDirRef.current;
  if (curLen !== prevLenRef.current) {
    slideDir = curLen >= prevLenRef.current ? 'forward' : 'backward';
    prevDirRef.current = slideDir;
    prevLenRef.current = curLen;
  }

  const [copiedBugTemplate, setCopiedBugTemplate] = useState(false);
  const [firebaseAppReleaseJson, setFirebaseAppReleaseJson] = useState<string>('Loading...');

  const pageScrollPositions = useRef<Record<string, number>>({});
  const pendingRestoreRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      pageScrollPositions.current[page] = el.scrollTop;
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [page]);

  useEffect(() => {
    const target = pendingRestoreRef.current;
    if (target === null) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = pageScrollPositions.current[target] ?? 0;
    pendingRestoreRef.current = null;
  }, [page, pageKey]);

  const navigate = (to: HelpPageActiveId) => {
    if (scrollRef.current) pageScrollPositions.current[page] = scrollRef.current.scrollTop;
    pendingRestoreRef.current = to;
    NavigationDispatcher.push({ app: 'hub', tab: 'help', page: to });
  };

  const goBack = () => {
    if (scrollRef.current) pageScrollPositions.current[page] = scrollRef.current.scrollTop;
    pendingRestoreRef.current = 'main';
    const store = useNavigationStore.getState();
    if (store.history.length > 1) {
      NavigationDispatcher.pop();
    } else {
      NavigationDispatcher.replace({ app: 'hub', tab: 'settings', page: 'main' });
    }
  };

  useEffect(() => {
    const handleRoute = () => {
      sessionStorage.removeItem('studio:routeToHelpPage');
      navigate('help-center');
    };
    window.addEventListener('studio:route-to-faq', handleRoute);
    return () => {
      window.removeEventListener('studio:route-to-faq', handleRoute);
    };
  }, []);

  useEffect(() => {
    const handleUpdateHelpPage = (e: Event) => {
      const customEvent = e as CustomEvent<HelpPageActiveId>;
      if (customEvent.detail) {
        navigate(customEvent.detail);
      }
    };
    window.addEventListener('studio:update-help-page', handleUpdateHelpPage as EventListener);
    return () => {
      window.removeEventListener('studio:update-help-page', handleUpdateHelpPage as EventListener);
    };
  }, [page]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('studio:help-page-active', { detail: page }));
  }, [page]);

  useEffect(() => {
    if (page !== 'download-apps') return;
    const loadManifest = async () => {
      const t = Date.now();
      const baseUrl = 'https://studio-30f44.web.app';
      try {
        const r2 = await fetch(`${baseUrl}/app-release.json?t=${t}`);
        if (r2.ok) {
          const text = await r2.text();
          setFirebaseAppReleaseJson(text);
        } else {
          setFirebaseAppReleaseJson(`Error: HTTP ${r2.status}`);
        }
      } catch (e: any) {
        setFirebaseAppReleaseJson(`Error: ${e.message || String(e)}`);
      }
    };
    loadManifest();
  }, [page]);

  function renderHelpCenterContent() {
    return <HelpAccordion accent={accent} lang={lang} />;
  }

  function renderFaqContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HelpAccordion accent={accent} lang={lang} />
      </div>
    );
  }

  function renderReleaseNotesContent() {
    const changelogSections = getChangelogSections(lang) || [];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text-primary)' }}>
            v{APP_VERSION}
          </span>
          <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
            Released on {APP_VERSION_DATE}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {changelogSections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3
                style={{
                  fontSize: 'var(--font-section-label)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--c-text-secondary)',
                  opacity: 0.6,
                  margin: 0,
                }}
              >
                {sec.heading}
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {sec.items.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 13,
                      color: 'var(--c-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: accent.from,
                        marginTop: 7,
                        flexShrink: 0,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderDownloadAppsContent() {
    let apkVersion = '3.6.28';
    let apkSize = '13.47 MB';
    let apkUrl = 'https://github.com/MAGEXE1000/Studio/releases/download/v3.6.28/studio-3.6.28.apk';

    try {
      if (
        firebaseAppReleaseJson &&
        !firebaseAppReleaseJson.startsWith('Error') &&
        firebaseAppReleaseJson !== 'Loading...'
      ) {
        const parsed = JSON.parse(firebaseAppReleaseJson);
        if (parsed.version) apkVersion = parsed.version;
        if (parsed.apkSizeBytes) apkSize = `${(parsed.apkSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
        if (parsed.apkUrl) apkUrl = parsed.apkUrl;
      }
    } catch (e) {
      console.warn('Failed to parse firebaseAppReleaseJson:', e);
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 18,
            background: 'var(--surface-topbar-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 30, color: accent.from }}
              >
                adb
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--c-text-primary)',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Android App (APK)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  v{apkVersion} • {apkSize}
                </span>
              </div>
            </div>
            <a
              href={apkUrl}
              style={{
                textDecoration: 'none',
                padding: '7px 14px',
                background: accent.from,
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                download
              </span>
              {t.help.downloadApps.downloadApk}
            </a>
          </div>
          <div style={{ height: 1, borderTop: '1px solid var(--c-border)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            {t.help.downloadApps.installApkDesc}
          </p>
        </div>

        <div
          style={{
            padding: 18,
            background: 'var(--surface-topbar-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 30, color: accent.from }}
              >
                language
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--c-text-primary)',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  Web Version (PWA)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  {t.help.downloadApps.pwaVersion}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 'var(--font-section-label)',
                fontWeight: 700,
                color: accent.from,
                background: `${accent.from}22`,
                padding: '5px 10px',
                borderRadius: 9999,
              }}
            >
              {t.help.downloadApps.runningNow}
            </div>
          </div>
          <div style={{ height: 1, borderTop: '1px solid var(--c-border)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            {t.help.downloadApps.installPwaDesc}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { platform: 'iOS App', icon: 'phone_iphone' },
            { platform: 'Desktop (macOS / Windows)', icon: 'desktop_windows' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                background: 'var(--surface-topbar-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: 0.8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                  {item.platform}
                </span>
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: accent.from,
                }}
              >
                {t.help.downloadApps.comingSoon}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderKeyboardShortcutsContent() {
    const categories = [
      {
        title: t.help.keyboardShortcuts.stagexTitle,
        shortcuts: [
          { keys: ['Space', '→', '↓'], desc: t.help.keyboardShortcuts.nextScene },
          { keys: ['←', '↑'], desc: t.help.keyboardShortcuts.prevScene },
          { keys: ['Esc'], desc: t.help.keyboardShortcuts.exitStage },
        ],
      },
      {
        title: t.help.keyboardShortcuts.drumexTitle,
        shortcuts: [
          { keys: ['Ctrl', 'Z'], desc: t.help.keyboardShortcuts.undo },
          { keys: ['Ctrl', 'Y'], desc: t.help.keyboardShortcuts.redo },
          { keys: ['Ctrl', 'Shift', 'Z'], desc: t.help.keyboardShortcuts.redoAlt },
        ],
      },
    ];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3
              style={{
                fontSize: 'var(--font-section-label)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--c-text-secondary)',
                opacity: 0.6,
                margin: 0,
              }}
            >
              {cat.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cat.shortcuts.map((sh, j) => (
                <div
                  key={j}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'var(--surface-topbar-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{sh.desc}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sh.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && (
                          <span
                            style={{
                              color: 'var(--c-text-muted)',
                              fontSize: 12,
                              alignSelf: 'center',
                            }}
                          >
                            +
                          </span>
                        )}
                        <kbd
                          style={{
                            padding: '3px 6px',
                            border: '1px solid var(--c-border)',
                            background: 'var(--surface-topbar-bg)',
                            borderRadius: 6,
                            fontSize: 'var(--font-section-label)',
                            fontWeight: 700,
                            color: 'var(--c-text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderTermsContent() {
    return (
      <SettingsContentContainer
        style={{
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 'var(--space-6)',
        }}
      >
        <p style={{ margin: 0 }}>{t.help.terms.welcome}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.terms.h1}
        </h4>
        <p style={{ margin: 0 }}>{t.help.terms.p1}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.terms.h2}
        </h4>
        <p style={{ margin: 0 }}>{t.help.terms.p2}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.terms.h3}
        </h4>
        <p style={{ margin: 0 }}>{t.help.terms.p3}</p>
      </SettingsContentContainer>
    );
  }

  function renderPrivacyPolicyContent() {
    return (
      <SettingsContentContainer
        style={{
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 'var(--space-6)',
        }}
      >
        <p style={{ margin: 0 }}>{t.help.privacy.welcome}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.privacy.h1}
        </h4>
        <p style={{ margin: 0 }}>{t.help.privacy.p1}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.privacy.h2}
        </h4>
        <p style={{ margin: 0 }}>{t.help.privacy.p2}</p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {t.help.privacy.h3}
        </h4>
        <p style={{ margin: 0 }}>{t.help.privacy.p3}</p>
      </SettingsContentContainer>
    );
  }

  function renderBugReportContent() {
    const handleCopyTemplate = () => {
      const template = `[STUDIO BUG REPORT]
------------------------------------
App Version: v${APP_VERSION} (${Capacitor.isNativePlatform() ? 'Android' : 'Web'})
User Agent: ${navigator.userAgent}
Date: ${new Date().toISOString()}

[Description of Bug]
-

[Steps to Reproduce]
1.
2.
3.

[Expected Behavior]
-

[Actual Behavior]
- `;
      navigator.clipboard.writeText(template);
      setCopiedBugTemplate(true);
      setTimeout(() => setCopiedBugTemplate(false), 2000);
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
          {Capacitor.isNativePlatform() ? t.help.bugReport.nativeDesc : t.help.bugReport.webDesc}
        </p>

        <button
          onClick={handleCopyTemplate}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            background: accent.from,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {copiedBugTemplate ? 'check' : 'content_copy'}
          </span>
          {copiedBugTemplate ? t.help.bugReport.copied : t.help.bugReport.copyTemplate}
        </button>

        <div
          style={{
            padding: 14,
            background: 'var(--surface-topbar-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 12,
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--c-text-secondary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}
        >
          {`[STUDIO BUG REPORT]
App Version: v${APP_VERSION} (${Capacitor.isNativePlatform() ? 'Android' : 'Web'})
User Agent: [Automatically Generated]
...`}
        </div>

        <div style={{ height: 1, borderTop: '1px solid var(--c-border)', margin: '4px 0' }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`https://github.com/MAGEXE1000/Studio/issues/new?title=${encodeURIComponent('Bug: [Enter short title]')}&body=${encodeURIComponent(
              `**AFFECTED MODULE**\n- [e.g. Chordex, Drumex, Stagex, Groovex, Vocalex, Settings, Help]\n\n` +
                `**APP VERSION**\n- v${APP_VERSION} (${Capacitor.isNativePlatform() ? 'Android/Native' : 'Web'})\n\n` +
                `**ANDROID/OS VERSION**\n- [e.g. Android 13 / Windows 11]\n\n` +
                `**DEVICE MODEL**\n- [e.g. Samsung Galaxy S23 / Laptop]\n\n` +
                `**REPRODUCTION STEPS**\n1. \n2. \n3. \n\n` +
                `**EXPECTED RESULT**\n- \n\n` +
                `**ACTUAL RESULT**\n- \n\n` +
                `*Generated on ${new Date().toISOString()}*`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              padding: '8px 16px',
              background: accent.from,
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 9999,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              open_in_new
            </span>
            {t.help.bugReport.githubBtn}
          </a>
        </div>
      </div>
    );
  }

  function renderActivePageContent(activePageId: HelpPageId) {
    switch (activePageId) {
      case 'help-center':
        return renderHelpCenterContent();
      case 'faq':
        return renderFaqContent();
      case 'release-notes':
        return renderReleaseNotesContent();
      case 'download-apps':
        return renderDownloadAppsContent();
      case 'keyboard-shortcuts':
        return renderKeyboardShortcutsContent();
      case 'terms':
        return renderTermsContent();
      case 'privacy-policy':
        return renderPrivacyPolicyContent();
      case 'bug-report':
        return renderBugReportContent();
      default:
        return renderHelpCenterContent();
    }
  }

  const sections = useMemo(
    () => [
      {
        label: t.hub.studioSettings.helpLabel || (lang === 'es' ? 'Soporte' : 'Support'),
        items: [
          {
            id: 'help-center' as const,
            icon: 'contact_support',
            label:
              t.hub.studioSettings.helpTitle ||
              (lang === 'es' ? 'Ayuda y Soporte' : 'Help & Support'),
          },
          {
            id: 'release-notes' as const,
            icon: 'article',
            label:
              t.hub.studioSettings.releaseTitle ||
              (lang === 'es' ? 'Notas de Lanzamiento' : 'Release Notes'),
          },
          {
            id: 'download-apps' as const,
            icon: 'install_desktop',
            label:
              t.hub.studioSettings.downloadTitle ||
              (lang === 'es' ? 'Descargar Aplicaciones' : 'Download Apps'),
          },
          {
            id: 'keyboard-shortcuts' as const,
            icon: 'keyboard',
            label:
              t.hub.studioSettings.keyboardTitle ||
              (lang === 'es' ? 'Atajos de Teclado' : 'Keyboard Shortcuts'),
          },
        ],
      },
    ],
    [t, lang]
  );

  const getPageTitle = (id: HelpPageId) => {
    for (const section of sections) {
      const item = section.items.find((n) => n.id === id);
      if (item) return item.label;
    }
    return t.hub.studioSettings.helpLabel || 'Help & Support';
  };

  const activePageId = page === 'main' ? 'help-center' : page;

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(128,128,128,0.08)',
    borderRadius: '12px',
    marginBottom: '20px',
    overflow: 'hidden',
  };

  const subStyle: React.CSSProperties = {
    animation: `slide-forward 250ms ease both`,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    zIndex: 100,
  };

  /* ── MOBILE DRILL DOWN LAYOUTS ──────────────────────────────────── */
  if (!isWebDesktop) {
    const standardScrollPages: HelpPageActiveId[] = [
      'help-center',
      'faq',
      'release-notes',
      'download-apps',
      'keyboard-shortcuts',
      'terms',
      'privacy-policy',
      'bug-report',
    ];

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <SharedNavigationContainer
          activeView={page}
          viewOrder={[
            'main',
            'help-center',
            'faq',
            'release-notes',
            'download-apps',
            'keyboard-shortcuts',
            'terms',
            'privacy-policy',
            'bug-report',
          ]}
        >
          {(pageId) => {
            if (standardScrollPages.includes(pageId as HelpPageActiveId)) {
              return (
                <SettingsScaffold title={getPageTitle(pageId as HelpPageId)} onBack={goBack}>
                  {renderActivePageContent(pageId as HelpPageId)}
                </SettingsScaffold>
              );
            }
            if (pageId === 'main') {
              return (
                <SettingsScaffold title={getPageTitle('help-center')} onBack={goBack}>
                  {renderHelpCenterContent()}
                </SettingsScaffold>
              );
            }
            return null;
          }}
        </SharedNavigationContainer>
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ────────────────────────────────────────────── */
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'var(--surface-float-blur)',
        WebkitBackdropFilter: 'var(--surface-float-blur)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setTab('home');
        }
      }}
    >
      <style>{HUB_SETTINGS_CSS}</style>
      <style>{`
        @keyframes hub-modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes settings-content-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .settings-content-animate {
          animation: settings-content-fade-in 150ms ease both;
        }
        .settings-desktop-layout .flex.items-center.justify-between.gap-4 {
          padding-left: 0px !important;
          padding-right: 0px !important;
        }
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="padding-left: 28px"],
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="paddingLeft: 28px"],
        .settings-desktop-layout .flex.items-center.justify-between.gap-4[style*="28px"] {
          padding-left: 12px !important;
        }
        .settings-desktop-layout div[style*="border-bottom"],
        .settings-desktop-layout div[style*="borderBottom"] {
          border-bottom: 1px solid rgba(128, 128, 128, 0.08) !important;
        }
        .settings-desktop-layout button.btn-smooth:not(.active-settings-nav):hover {
          background: var(--sidebar-hover-bg, rgba(255, 255, 255, 0.04)) !important;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          width: '880px',
          height: '640px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: 'var(--app-surface, rgba(18, 18, 18, 0.95))',
          border: '1px solid rgba(128, 128, 128, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          animation: 'hub-modal-fade-in 250ms ease both',
        }}
        className="settings-desktop-layout"
      >
        {/* Left Pane: Sub-navigation */}
        <div
          style={{
            width: '260px',
            flexShrink: 0,
            borderRight: '1px solid rgba(128, 128, 128, 0.08)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => setTab('home')}
            className="btn-smooth"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(128, 128, 128, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--c-text-primary)',
              marginBottom: 16,
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>

          <div
            style={{
              padding: '0 8px 16px 8px',
              borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'Manrope',
              }}
            >
              {lang === 'es' ? 'Ayuda de Studio' : 'Studio Help'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {sections.map((section, secIdx) => (
              <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {secIdx > 0 && (
                  <div
                    style={{
                      height: 1,
                      borderTop: '1px solid rgba(128,128,128,0.08)',
                      margin: '4px 0 10px 0',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 'var(--font-section-label)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    padding: '0 12px 4px 12px',
                  }}
                >
                  {section.label}
                </span>
                {section.items.map((item) => {
                  const isActive = activePageId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={`btn-smooth ${isActive ? 'active-settings-nav' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: isActive
                          ? 'var(--sidebar-hover-bg, rgba(255, 255, 255, 0.08))'
                          : 'transparent',
                        color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      <AnimatedIcon
                        name={item.icon}
                        size={16}
                        color={isActive ? accent.from : 'var(--c-text-secondary)'}
                        state={isActive ? 'active' : 'inactive'}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Content */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-8) var(--space-12)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          ref={scrollRef}
        >
          <div
            key={activePageId}
            className="settings-content-animate"
            style={{ maxWidth: 'var(--content-max-w)', width: '100%', margin: '0 auto' }}
          >
            <div
              style={{
                marginBottom: 28,
                borderBottom: '1px solid rgba(128, 128, 128, 0.08)',
                paddingBottom: 16,
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--font-display-page)',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  fontFamily: 'Manrope',
                }}
              >
                {getPageTitle(activePageId)}
              </h1>
            </div>

            <Suspense
              fallback={
                <div style={{ color: 'var(--c-text-secondary)', fontSize: 14 }}>
                  Loading help...
                </div>
              }
            >
              {renderActivePageContent(activePageId)}
            </Suspense>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── HELP ACCORDION ───────────────────────────────────────────────── */
interface FAQItem {
  question: string;
  answer: string;
}

/* ── NOTIFICATION CENTER HELPERS ──────────────────────────────────── */
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'app_update':
    case 'ota_update':
      return 'system_update';
    case 'download_complete':
      return 'download_done';
    case 'install_ready':
      return 'install_mobile';
    case 'install_failed':
      return 'error';
    case 'sync_event':
      return 'sync';
    case 'backup_event':
      return 'backup';
    case 'cloud_event':
      return 'cloud';
    case 'account_event':
      return 'account_circle';
    case 'tip':
      return 'lightbulb';
    case 'feature_announcement':
      return 'campaign';
    case 'system_message':
      return 'info';
    default:
      return 'notifications';
  }
}

function getCategoryColor(category: string): { bg: string; text: string } {
  switch (category) {
    case 'install_failed':
      return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
    case 'install_ready':
    case 'app_update':
    case 'ota_update':
      return { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' };
    case 'sync_event':
    case 'backup_event':
      return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
    case 'tip':
      return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
    case 'feature_announcement':
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
    default:
      return { bg: 'rgba(128, 128, 128, 0.1)', text: 'var(--c-text-secondary)' };
  }
}

function formatTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function parseMarkdownToSections(body: string | null | undefined) {
  if (!body) return [];
  const lines = body.split('\n');
  const sections: { heading: string; items: string[] }[] = [];
  let currentSec: { heading: string; items: string[] } | null = null;
  const defaultItems: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      let friendlyHeading = headingText;
      const lower = headingText.toLowerCase();
      if (lower.includes('added') || lower.includes('feature')) {
        friendlyHeading = 'New Features';
      } else if (lower.includes('improve') || lower.includes('polish')) {
        friendlyHeading = 'Improvements';
      } else if (lower.includes('fix') || lower.includes('bug')) {
        friendlyHeading = 'Bug Fixes';
      } else if (lower.includes('perf') || lower.includes('speed') || lower.includes('optimis')) {
        friendlyHeading = 'Performance';
      } else if (
        lower.includes('ui') ||
        lower.includes('ux') ||
        lower.includes('appear') ||
        lower.includes('style')
      ) {
        friendlyHeading = 'UI / UX';
      } else if (lower.includes('break') || lower.includes('chang')) {
        friendlyHeading = 'Breaking Changes';
      }

      if (currentSec && currentSec.items.length > 0) {
        sections.push(currentSec);
      }
      currentSec = { heading: friendlyHeading, items: [] };
    } else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
      const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
      if (cleanLine) {
        if (currentSec) {
          currentSec.items.push(cleanLine);
        } else {
          defaultItems.push(cleanLine);
        }
      }
    }
  }

  if (currentSec && currentSec.items.length > 0) {
    sections.push(currentSec);
  }

  if (defaultItems.length > 0) {
    sections.unshift({ heading: 'General Updates', items: defaultItems });
  }

  return sections;
}

interface ParsedRelease {
  version: string;
  date: string;
  isLatest: boolean;
  isCurrent: boolean;
  sections: { heading: string; items: string[] }[];
}

function ChangelogView({ lang, accent }: { lang: string; accent: { from: string; to: string } }) {
  const [releases, setReleases] = useState<ParsedRelease[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadChangelog() {
      try {
        const cached = localStorage.getItem('studio:changelog_cache');
        const cachedTime = localStorage.getItem('studio:changelog_cache_time');
        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime, 10);
          if (age < 1000 * 60 * 60) {
            const parsed = JSON.parse(cached);
            if (active && parsed && parsed.length > 0) {
              setReleases(parsed);
              setLoading(false);
              if (parsed[0]) {
                setExpandedVersions({ [parsed[0].version]: true });
              }
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load cached changelog', e);
      }

      try {
        const res = await fetch('https://api.github.com/repos/MAGEXE1000/Studio/releases');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const parsedList: ParsedRelease[] = data.map((rel: any, idx: number) => {
            const vRaw = rel.tag_name ? rel.tag_name.replace(/^v/, '') : '0.0.0';
            const dateStr = rel.published_at
              ? new Date(rel.published_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A';
            const sections = parseMarkdownToSections(rel.body);

            return {
              version: vRaw,
              date: dateStr,
              isLatest: idx === 0,
              isCurrent: vRaw === APP_VERSION,
              sections,
            };
          });

          if (active) {
            setReleases(parsedList);
            setLoading(false);
            if (parsedList[0]) {
              setExpandedVersions({ [parsedList[0].version]: true });
            }
          }

          try {
            localStorage.setItem('studio:changelog_cache', JSON.stringify(parsedList));
            localStorage.setItem('studio:changelog_cache_time', String(Date.now()));
          } catch (e) {}
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch from GitHub, using fallback', err);
      }

      if (active) {
        const defaultSections = getChangelogSections(lang) || [];
        const fallbackList: ParsedRelease[] = [
          {
            version: APP_VERSION,
            date: lang === 'es' ? '1 de agosto de 2026' : 'August 1, 2026',
            isLatest: true,
            isCurrent: true,
            sections: defaultSections.map((s) => ({
              heading: s.heading === 'Added' ? 'New Features' : s.heading,
              items: s.items,
            })),
          },
          ...RELEASE_HISTORY.map((item) => {
            const dateObj = new Date(item.date);
            const dateStr = isNaN(dateObj.getTime())
              ? item.date
              : dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

            return {
              version: item.version,
              date: dateStr,
              isLatest: false,
              isCurrent: item.version === APP_VERSION,
              sections: [{ heading: 'General Updates', items: item.highlights }],
            };
          }),
        ];

        setReleases(fallbackList);
        setLoading(false);
        if (fallbackList[0]) {
          setExpandedVersions({ [fallbackList[0].version]: true });
        }
      }
    }

    loadChangelog();
    return () => {
      active = false;
    };
  }, [lang]);

  const toggleExpand = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  const getCategoryStyles = (heading: string) => {
    const lower = heading.toLowerCase();
    if (lower.includes('feature') || lower.includes('added')) {
      return { bg: 'rgba(52, 211, 153, 0.12)', fg: '#10b981' };
    }
    if (lower.includes('improve') || lower.includes('polish')) {
      return { bg: 'rgba(168, 85, 247, 0.12)', fg: '#a855f7' };
    }
    if (lower.includes('fix') || lower.includes('bug')) {
      return { bg: 'rgba(239, 68, 68, 0.12)', fg: '#ef4444' };
    }
    if (lower.includes('perf') || lower.includes('speed')) {
      return { bg: 'rgba(45, 212, 191, 0.12)', fg: '#0d9488' };
    }
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('appear')) {
      return { bg: 'rgba(244, 114, 182, 0.12)', fg: '#db2777' };
    }
    if (lower.includes('break') || lower.includes('chang')) {
      return { bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706' };
    }
    return { bg: 'var(--app-surface-low, rgba(128,128,128,0.08))', fg: 'var(--c-text-secondary)' };
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-10) 0',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid rgba(128,128,128,0.1)`,
            borderTopColor: accent.from,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--c-text-secondary)', fontFamily: 'Inter' }}>
          {lang === 'es' ? 'Cargando historial de cambios...' : 'Loading changelog history...'}
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: 16 }}
    >
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: 8,
          bottom: 24,
          width: 2,
          background: 'rgba(128, 128, 128, 0.08)',
          borderRadius: 1,
        }}
      />

      <BouncyAccordion
        items={releases.map((rel) => ({
          id: rel.version,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  fontFamily: 'Manrope',
                  letterSpacing: '-0.02em',
                }}
              >
                v{rel.version}
              </span>
              {rel.isCurrent && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: 'Manrope',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${accent.from}1a, ${accent.to}1a)`,
                    color: accent.from,
                    border: `1px solid ${accent.from}33`,
                    textTransform: 'uppercase',
                  }}
                >
                  {lang === 'es' ? 'Instalado' : 'Installed'}
                </span>
              )}
              {rel.isLatest && !rel.isCurrent && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: 'Manrope',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(52, 211, 153, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    textTransform: 'uppercase',
                  }}
                >
                  {lang === 'es' ? 'Más Reciente' : 'Latest'}
                </span>
              )}
              <span
                style={{
                  fontSize: 'var(--font-section-label)',
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  opacity: 0.8,
                  marginLeft: 'auto',
                }}
              >
                {rel.date}
              </span>
            </div>
          ),
          description:
            rel.sections.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--c-text-secondary)',
                  fontFamily: 'Inter',
                  fontStyle: 'italic',
                  paddingLeft: 4,
                }}
              >
                {lang === 'es'
                  ? 'No hay detalles de cambios disponibles.'
                  : 'No detailed changes available.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rel.sections.map((sec, sIdx) => {
                  const cStyle = getCategoryStyles(sec.heading);
                  return (
                    <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex' }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            fontFamily: 'Manrope',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: cStyle.bg,
                            color: cStyle.fg,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {sec.heading}
                        </span>
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        {sec.items.map((item, iIdx) => (
                          <li
                            key={iIdx}
                            style={{
                              fontSize: 12.5,
                              color: 'var(--c-text-secondary)',
                              fontFamily: 'Inter',
                              lineHeight: 1.4,
                            }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ),
        }))}
        value={Object.keys(expandedVersions).find((v) => expandedVersions[v]) || null}
        onValueChange={(val) => setExpandedVersions(val ? { [val]: true } : {})}
      />
    </div>
  );
}
