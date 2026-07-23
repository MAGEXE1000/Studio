import { Capacitor } from '@capacitor/core';
import { useBackHandler, type AuthUser, subscribeSyncStatus, type SyncStatus, deviceId, getConflictLogs, clearConflictLogs, createCloudBackup, getSyncDiagnostics, pushLocalSettingsToCloud, pullCloudSettingsFromCloud, registerDevice, registerCurrentDevice, reconnectDevices, useChordStore, ACCENT_COLORS, type AnimationSpeed, type DisplayDensity, type AppKey, type PerAppVisuals, useNavHidden, useNavCollapsed, useScrollHide, setNavHidden, useT, APP_VERSION_LABEL, APP_VERSION_TAG, APP_VERSION_DATE, compareSemver, APP_VERSION, getChangelogSections, useAppUpdate, updateDebugLogs, updateDiagnostics, checkForUpdate, resetAppUpdateState, isAppInstallerAvailable, applyUpdate, fadeToBlackAndReload, resolveApkUrl, downloadAndInstallApk, resolveReleasePageUrl, useLiquidGlassNav, useIsWebDesktop, useStudioPreferences, registerDebugProvider, unregisterDebugProvider, recordNavigation, getFirestoreDiagnostics, getNavigationEntries, resetNav, useNavigationStore, NavigationDispatcher, useBottomNavigationStore, useNotificationService, useSettingsStore, DurationPresets, EasingPresets, SpringPresets, authRepository } from "@workspace/studio-core";
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
import { motion, AnimatePresence, useMotionValue, motionValue, animate, Reorder } from 'motion/react';
import {
  StudioLogo,
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
} from '../icons/ChordexLogo';
import {
  Toggle,
  SectionHeader,
  SettingRow,
  SegmentedControl,
  COLOR_OPTIONS,
  BentoSettingCard,
  BentoSettingRow,
} from '../typography/SettingControls';
import StudioThemeToggler from '../typography/StudioThemeToggler';
import ApplyToSheet from '../sheets/ApplyToSheet';
import ChangelogSheet from '../sheets/ChangelogSheet';
import GradientBorderCard from '../cards/GradientBorderCard';
import StudioTitleReveal from '../typography/StudioTitleReveal';
import { EncryptedText } from '../ui/encrypted-text';
import {
  SHARED_NAV_TRANSITION,
  getSharedNavTransform,
  getSharedNavOpacity,
} from '../../navigation/navStyles';
import ProfileDropdown from '../kokonutui/profile-dropdown';
import SmartLoading from '../loading/SmartLoading';
import { StudioSkeletonProfile, StudioSkeletonList } from '../loading/StudioSkeleton';
import { SettingsScaffold } from '../layout/StudioLayoutSystem';
import { ProgressiveBlur } from '../design-system/ProgressiveBlur';
import { SharedNavigationBar } from '../../navigation/SharedNavigationBar';
import { useNavigationCoordinator, PageTransition } from '../../navigation/AppAnimationSystem';
import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';

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

import AccountCard, { AccountDangerZone, AccountSettingsPage } from '../cards/AccountCard';
import DevToolsDashboard from '../devtools/DevToolsDashboard';

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
    id: 'drums',
    icon: 'grid_on',
    titleEn: 'Drum Sequencer',
    titleEs: 'Secuenciador de Batería',
    descEn: 'Create custom drum loops',
    descEs: 'Crea bucles de batería',
  },
  {
    id: 'stage',
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
];

const SHORTCUT_LABEL_MAP: Record<string, { en: string; es: string }> = {
  'chords-songs': { en: 'Songs', es: 'Canciones' },
  'chords-practice': { en: 'Practice', es: 'Práctica' },
  'drums': { en: 'Drums', es: 'Batería' },
  'stage': { en: 'Console', es: 'Consola' },
  'groovex': { en: 'Groovex', es: 'Groovex' },
  'vocalex-coach': { en: 'Coach', es: 'Entrenador' },
  'vocalex-pitch': { en: 'Pitch', es: 'Tono' },
  'developer': { en: 'Dev', es: 'Desarrollador' },
  'notifications': { en: 'Alerts', es: 'Alertas' },
  'help': { en: 'Help', es: 'Ayuda' },
  'settings': { en: 'Settings', es: 'Ajustes' },
  'updater': { en: 'Updates', es: 'Actualiz.' },
  'sync': { en: 'Sync', es: 'Sincro' },
  'backup': { en: 'Backup', es: 'Copia' },
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

function DebugSettingsContent({
  accent,
  cardStyle,
  devNativeVersion,
  devVersionCode,
}: {
  accent: { from: string; to: string; mid: string };
  cardStyle: React.CSSProperties;
  devNativeVersion: string;
  devVersionCode: string;
}) {
  const updater = useAppUpdate();

  const DebugRow = ({
    label,
    desc,
    value,
    highlightColor,
  }: {
    label: string;
    desc?: string;
    value: string | null;
    highlightColor?: string;
  }) => (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(128,128,128,0.08)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
      </div>
      <div
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(128,128,128,0.06)',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: highlightColor || 'var(--c-text-primary)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {value || 'N/A'}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 12 }}>
        <button
          onClick={async () => {
            try {
              await checkForUpdate(true, 'settings_manual', 'user manual checkNow');
            } catch (e) {
              console.error(e);
            }
          }}
          className="btn-smooth"
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '0.75rem',
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            color: 'white',
            fontFamily: 'Manrope',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {[
            'INITIALIZING',
            'FETCH_REMOTE_METADATA',
            'VALIDATE_METADATA',
            'COMPARE_VERSION',
          ].includes(updater.updateState)
            ? 'Checking...'
            : 'Check For Updates Now'}
        </button>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            fontFamily: 'Manrope',
            fontWeight: 800,
            fontSize: 11,
            padding: '16px 20px 8px',
            opacity: 0.75,
            color: 'var(--c-text-primary)',
            borderBottom: '1px solid rgba(128,128,128,0.08)',
            letterSpacing: '0.05em',
          }}
        >
          CURRENT APP
        </div>
        <DebugRow
          label="App Version"
          desc="The hardcoded version in the app bundle"
          value={APP_VERSION}
        />
        <DebugRow
          label="APK Version"
          desc="The native Android APK version wrapper"
          value={devNativeVersion}
        />
        <DebugRow
          label="versionCode"
          desc="The version code of the installed native wrapper"
          value={devVersionCode}
        />
        <DebugRow
          label="Update System"
          desc="The update delivery channel used by the app"
          value="APK only"
        />
        <DebugRow
          label="Updater System"
          desc="State of the Updater bundle update system"
          value="Disabled"
        />

        <div
          style={{
            fontFamily: 'Manrope',
            fontWeight: 800,
            fontSize: 11,
            padding: '16px 20px 8px',
            opacity: 0.75,
            color: 'var(--c-text-primary)',
            borderBottom: '1px solid rgba(128,128,128,0.08)',
            letterSpacing: '0.05em',
          }}
        >
          LATEST UPDATE
        </div>
        <DebugRow
          label="Remote Version"
          desc="The latest version released on the remote server"
          value={updater.remoteVersion}
        />
        <DebugRow
          label="Remote versionCode"
          desc="The required version code on the remote server"
          value={updater.requiredVersionCode ? String(updater.requiredVersionCode) : 'N/A'}
        />
        <DebugRow label="updateType" desc="The remote update category type" value="apk" />
        <DebugRow
          label="APK URL"
          desc="Resolved browser download URL for the update package"
          value={updater.apkUrl}
        />
        <DebugRow
          label="SHA-256"
          desc="SHA-256 hash expected from the update manifest"
          value={updater.apkSha256}
        />
      </div>
    </div>
  );
}

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
        clearInterval(interval);
      }
    };

    const interval = setInterval(check, 100);
    window.addEventListener('studio-launch-complete', check);

    return () => {
      clearInterval(interval);
      window.removeEventListener('studio-launch-complete', check);
    };
  }, [complete]);

  return complete;
}

export default function StudioHub() {
  const settings = useSettingsStore((state) => state.settings);
  const currentApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');

  const startupComplete = useStartupComplete();
  const unreadCount = useNotificationService(
    (s) => s.notifications.filter((n) => !n.read && !n.dismissed).length
  );
  const isWebDesktop = useIsWebDesktop();
  const t = useT();
  const lang = settings.language ?? 'en';
  const hubAccentKey = settings.perApp?.hub?.accentColor ?? settings.accentColor ?? 'blue';
  const accent = useMemo(
    () =>
      hubAccentKey === 'custom'
        ? {
            from: `hsl(${settings.customAccentHue ?? 220}, 75%, 65%)`,
            mid: `hsl(${settings.customAccentHue ?? 220}, 80%, 55%)`,
            to: `hsl(${((settings.customAccentHue ?? 220) + 25) % 360}, 85%, 42%)`,
          }
        : (ACCENT_COLORS[hubAccentKey] ?? ACCENT_COLORS.blue),
    [hubAccentKey, settings.customAccentHue]
  );
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
    NavigationDispatcher.push({ app: 'hub', tab: nextTab, page: 'main' });
  }, []) as React.Dispatch<React.SetStateAction<HubTab>>;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('studio:hub-tab-active', { detail: tab }));
  }, [tab]);

  useEffect(() => {
    (window as any).__studioHubReady = true;
    window.dispatchEvent(new Event('studio-hub-ready'));
  }, []);

  useEffect(() => {
    console.log(`[STARTUP-TRACE] StudioHub: mount useEffect fired at ${performance.now().toFixed(0)}ms, calling notifyHubMounted()`);
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

  const { markAllAsRead } = useNotificationService();
  const routeApp = activeRoute.app;
  const routeTab = activeRoute.tab;
  const routePage = activeRoute.page;

  useEffect(() => {
    if (
      routeApp === 'hub' &&
      ((routeTab as string) === 'notifications' || routePage === 'notifications' || (routeTab === 'profile' && routePage === 'notifications'))
    ) {
      markAllAsRead();
    }
  }, [routeApp, routeTab, routePage, markAllAsRead]);
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
    const isSubPage = !!(activeRoute.page && activeRoute.page !== 'main');
    const shouldHide = shortcutPickerOpen || isEditMode || isSubPage;
    setNavHidden(shouldHide);
    return () => {
      setNavHidden(false);
    };
  }, [shortcutPickerOpen, isEditMode, activeRoute.page]);

  // Usage-based suggestions engine
  const getSuggestedActions = () => {
    const activityLog = useChordStore.getState().activityLog || [];
    const candidates = [
      { id: 'chords-songs', score: 0 },
      { id: 'chords-practice', score: 0 },
      { id: 'drums', score: 0 },
      { id: 'stage', score: 0 },
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
        else if (event.subtitle?.includes('Drumex')) matchedId = 'drums';
        else if (event.subtitle?.includes('Stagex')) matchedId = 'stage';
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
        const cand = candidates.find(c => c.id === matchedId);
        if (cand) cand.score += recencyWeight;
      }
    });

    const suggested = candidates
      .filter(c => !shortcuts.includes(c.id))
      .sort((a, b) => b.score - a.score);

    const defaults = ['chords-practice', 'notifications', 'settings', 'help', 'updater', 'sync'];
    for (const defId of defaults) {
      if (suggested.length >= 4) break;
      if (!shortcuts.includes(defId) && !suggested.some(s => s.id === defId)) {
        suggested.push({ id: defId, score: -1 });
      }
    }
    return suggested.slice(0, 4).map(s => s.id);
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
        launchApp('chords');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'chords', page: 'songs' });
        }, 150);
        break;
      case 'chords-practice':
        launchApp('chords');
        setTimeout(() => {
          NavigationDispatcher.push({ app: 'chords', page: 'songs' });
        }, 150);
        break;
      case 'drums':
        launchApp('drums');
        break;
      case 'stage':
        launchApp('stage');
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
          NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'notifications' });
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

  const handleLogoTap = () => {
    if (settings.developerMode) {
      showDevToast('Developer Options are already active.');
      return;
    }
    devTapsRef.current += 1;
    const remaining = 5 - devTapsRef.current;
    if (remaining > 0 && remaining <= 3) {
      showDevToast(`${remaining} tap${remaining > 1 ? 's' : ''} remaining...`);
    } else if (remaining === 0) {
      devTapsRef.current = 0;
      settingsController.updateSettings({ developerMode: true });
      showDevToast('Developer Options unlocked.');
    }
  };

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

  const launchApp = useCallback((appMode: 'chords' | 'drums' | 'stage' | 'groovex' | 'vocalex') => {
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
      app: 'chords' | 'drums' | 'groovex';
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
            app: 'chords',
            title: p.name || p.title || 'Untitled Chordex Preset',
            appName: 'Chordex',
            timestamp: p.updatedAt ? formatTimeAgo(p.updatedAt) : 'Recent',
            action: () => {
              launchApp('chords');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'chords', page: 'library' });
              }, 150);
            },
          });
        });
        (state.progressions || []).forEach((p: any) => {
          list.push({
            app: 'chords',
            title: p.name || p.title || 'Untitled Progression',
            appName: 'Chordex',
            timestamp: p.updatedAt ? formatTimeAgo(p.updatedAt) : 'Recent',
            action: () => {
              launchApp('chords');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'chords', page: 'songs' });
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
            app: 'drums',
            title: s.name || s.title || 'Untitled Drum Song',
            appName: 'Drumex',
            timestamp: s.updatedAt ? formatTimeAgo(s.updatedAt) : 'Recent',
            action: () => {
              launchApp('drums');
              setTimeout(() => {
                NavigationDispatcher.push({ app: 'drums', page: 'songs' });
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
                      paddingBottom: 'var(--content-bottom-pad)',
                    }}
                  >
                    {/* Dashboard Contents Scroll Area */}
                    <div
                      style={{ width: '100%', maxWidth: '380px', marginTop: '24px' }}
                      className="flex flex-col gap-6 w-full"
                    >
                      {/* Greetings Section & Logo Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <section className="space-y-1" style={{ flex: 1, minWidth: 0 }}>
                          <h2
                            style={{
                              fontFamily: 'Manrope',
                              fontWeight: 800,
                              color: 'var(--c-text-primary)',
                            }}
                            className="text-3xl leading-tight"
                          >
                            {greeting}
                          </h2>
                          <p
                            style={{
                              fontFamily: 'Inter',
                              color: 'var(--c-text-secondary)',
                              opacity: 0.85,
                            }}
                            className="text-sm"
                          >
                            {subtitle}
                          </p>
                        </section>
                        <div style={{ color: 'var(--c-text-primary)', marginLeft: 16, marginTop: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <StudioLogo size={32} />
                        </div>
                      </div>

                      {/* Pinned Quick Actions Section */}
                      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3
                            style={{
                              fontFamily: 'Inter',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              fontWeight: 700,
                              color: 'var(--c-text-secondary)',
                              opacity: 0.6,
                            }}
                            className="px-1"
                          >
                            {lang === 'es' ? 'Acciones Fijadas' : 'Pinned Actions'}
                          </h3>
                          {isEditMode ? (
                            <button
                              onClick={() => setIsEditMode(false)}
                              style={{
                                background: accent.from,
                                border: 'none',
                                color: '#000',
                                fontFamily: 'Inter',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: 12,
                                padding: '4px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              {lang === 'es' ? 'Listo' : 'Done'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setShortcutPickerOpen(true)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: accent.from,
                                fontFamily: 'Inter',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span>
                              {lang === 'es' ? 'Fijar' : 'Pin'}
                            </button>
                          )}
                        </div>

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
                            gap: '12px',
                            padding: '4px 0 12px',
                            listStyle: 'none',
                            margin: 0,
                          }}
                        >
                          {shortcuts.slice(0, 5).map((id) => {
                            const opt = ALL_SHORTCUT_OPTIONS.find((o) => o.id === id);
                            if (!opt) return null;
                            const mappedLabel = SHORTCUT_LABEL_MAP[id] || { en: opt.titleEn.split(' ')[0], es: opt.titleEs.split(' ')[0] };
                            const displayLabel = lang === 'es' ? mappedLabel.es : mappedLabel.en;

                            return (
                              <Reorder.Item
                                key={id}
                                value={id}
                                drag={isEditMode ? "x" : false}
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
                                  animate={isEditMode ? {
                                    rotate: [0, -1.2, 0, 1.2, 0],
                                    transition: { duration: 0.28, repeat: Infinity, ease: "easeInOut" }
                                  } : { rotate: 0 }}
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(12, 12, 14, 0.45)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(25px)',
                                    WebkitBackdropFilter: 'blur(25px)',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      color: accent.from,
                                      fontSize: '20px',
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
                                        top: -2,
                                        right: -2,
                                        background: '#f87171',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: 16,
                                        height: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        zIndex: 20,
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: 10, fontWeight: 'bold' }}>
                                        close
                                      </span>
                                    </button>
                                  )}
                                </motion.div>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--c-text-secondary)',
                                    marginTop: '6px',
                                    textAlign: 'center',
                                    width: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
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
                                whileTap={{ scale: 0.92 }}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  background: 'transparent',
                                  border: '1px dashed rgba(255, 255, 255, 0.25)',
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
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--c-text-secondary)',
                                  marginTop: '6px',
                                  textAlign: 'center',
                                  opacity: 0.7,
                                }}
                              >
                                {lang === 'es' ? 'Añadir' : 'Add'}
                              </span>
                            </div>
                          )}
                        </Reorder.Group>
                      </section>

                      {/* Studio Modules grid columns */}
                      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h3
                          style={{
                            fontFamily: 'Inter',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontWeight: 700,
                            color: 'var(--c-text-secondary)',
                            opacity: 0.6,
                          }}
                          className="px-1"
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
                                app: 'chords' as TargetApp,
                                Logo: ChordexLogo,
                                name: 'Chordex',
                                desc: t.hub.chordexDesc,
                                color: '#a855f7',
                                active: activeRouteApp === 'chords',
                              },
                              {
                                app: 'drums' as TargetApp,
                                Logo: DrumexLogo,
                                name: 'Drumex',
                                desc: t.hub.drumexDesc,
                                color: '#ec4899',
                                active: activeRouteApp === 'drums',
                              },
                              {
                                app: 'stage' as TargetApp,
                                Logo: StagexLogoIcon,
                                name: 'Stagex',
                                desc: t.hub.stagexDesc,
                                color: '#3b82f6',
                                active: activeRouteApp === 'stage',
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
                              whileTap={{ scale: 0.96 }}
                              transition={SpringPresets.soft}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '14px 16px',
                                background: 'var(--app-surface-high, rgba(128,128,128,0.06))',
                                border: active
                                  ? `1.5px solid ${color}`
                                  : '1px solid rgba(128,128,128,0.08)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                boxSizing: 'border-box',
                                outline: 'none',
                                position: 'relative',
                                justifyContent: 'space-between',
                              }}
                              className="sc-module-card group"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    backgroundColor: active
                                      ? `${color}15`
                                      : 'var(--app-surface-highest, rgba(128,128,128,0.12))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: color,
                                    flexShrink: 0,
                                  }}
                                >
                                  <Logo size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      style={{
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        color: 'var(--c-text-primary)',
                                        fontFamily: 'Manrope',
                                      }}
                                    >
                                      {name}
                                    </span>
                                    {active && (
                                      <span
                                        style={{
                                          fontSize: '8px',
                                          padding: '2px 4px',
                                          borderRadius: '4px',
                                          backgroundColor: `${color}20`,
                                          color: color,
                                          fontWeight: 'bold',
                                          fontFamily: 'Inter',
                                          textTransform: 'uppercase',
                                        }}
                                      >
                                        {lang === 'es' ? 'En Vivo' : 'Live'}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--c-text-secondary)',
                                      fontFamily: 'Inter',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {desc}
                                  </span>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-on-surface-variant/40 text-lg group-hover:text-tertiary transition-colors flex items-center">
                                chevron_right
                              </span>
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
                        NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'profile' });
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
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          animation:
                            successAnimationState === 'entering'
                              ? 'success-fade-in-blur 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
                              : 'success-fade-out-blur 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                      >
                        <style>{`
                          @keyframes success-fade-in-blur {
                            from { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
                            to { opacity: 1; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                          }
                          @keyframes success-fade-out-blur {
                            from { opacity: 1; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); transform: scale(1); }
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
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
              maxWidth: 448,
              background: 'var(--app-surface, #141418)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: 'none',
              padding: '24px 20px',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              animation: 'picker-slide-up 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            {/* Grab handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'rgba(128, 128, 128, 0.3)',
                margin: '0 auto 16px',
              }}
            />

            <h3
              style={{
                fontFamily: 'Manrope',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--c-text-primary)',
                margin: '0 0 4px 0',
              }}
            >
              {lang === 'es' ? 'Personalizar Acciones Rápidas' : 'Customize Quick Actions'}
            </h3>
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: 12.5,
                color: 'var(--c-text-secondary)',
                margin: '0 0 20px 0',
                opacity: 0.8,
              }}
            >
              {lang === 'es'
                ? 'Selecciona hasta 5 atajos para acceso rápido en la pantalla de inicio.'
                : 'Select up to 5 shortcuts for quick access on the home screen.'}
            </p>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
              className="hide-scrollbar"
            >
              {/* Selected Section */}
              <div>
                <h4
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'es' ? 'Atajos Activos (Máx 5)' : 'Active Shortcuts (Max 5)'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {shortcuts.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--c-text-secondary)',
                        opacity: 0.5,
                        padding: '12px 14px',
                        border: '1px dashed rgba(128,128,128,0.2)',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}
                    >
                      {lang === 'es'
                        ? 'Ninguno seleccionado. Agrega algunos abajo.'
                        : 'None selected. Add some below.'}
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
                      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}
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
                              padding: '10px 12px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: 12,
                              cursor: 'grab',
                              userSelect: 'none',
                            }}
                            whileDrag={{
                              scale: 1.02,
                              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                              background: 'rgba(255, 255, 255, 0.08)',
                              cursor: 'grabbing',
                            }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 18, cursor: 'grab' }}
                              >
                                drag_indicator
                              </span>
                              <span
                                className="material-symbols-outlined"
                                style={{ color: accent.from, fontSize: 20 }}
                              >
                                {opt.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: 'var(--c-text-primary)',
                                  fontWeight: 600,
                                }}
                              >
                                {lang === 'es' ? opt.titleEs : opt.titleEn}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => {
                                  const newShortcuts = shortcuts.filter((x) => x !== id);
                                  setShortcuts(newShortcuts);
                                  localStorage.setItem(
                                    'studio:quick-shortcuts',
                                    JSON.stringify(newShortcuts)
                                  );
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f87171',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                  remove_circle
                                </span>
                              </button>
                            </div>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                  )}
                </div>
              </div>

              {/* Available Shortcuts */}
              <div>
                <h4
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'es' ? 'Atajos Disponibles' : 'Available Shortcuts'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ALL_SHORTCUT_OPTIONS.filter((o) => !shortcuts.includes(o.id)).map((opt) => {
                    const isLimitReached = shortcuts.length >= 5;
                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.6, fontSize: 20 }}
                          >
                            {opt.icon}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--c-text-primary)' }}>
                            {lang === 'es' ? opt.titleEs : opt.titleEn}
                          </span>
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
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isLimitReached ? 'rgba(128,128,128,0.2)' : accent.from,
                            display: 'flex',
                            alignItems: 'center',
                            padding: 4,
                            cursor: isLimitReached ? 'default' : 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            add_circle
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShortcutPickerOpen(false)}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 14,
                background: accent.from,
                color: 'white',
                border: 'none',
                fontFamily: 'Manrope',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 16,
                boxShadow: `0 4px 12px ${accent.from}25`,
              }}
            >
              {lang === 'es' ? 'Listo' : 'Done'}
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

// ── StudioFamilyOrbit ─────────────────────────────────────────────────────────
// Clean monochrome orbit — Studio sine-wave in a neutral dark circle at center,
// 5 sub-app icons orbiting in white-outlined circles (no color gradients).
// Uses the canonical animata double-rotate trick so icons stay upright.
function StudioFamilyOrbit({
  items,
  onLogoPress,
}: {
  items: { key: string; node: React.ReactNode; label: string }[];
  onLogoPress?: () => void;
}) {
  const RADIUS = 96;
  const SPEED = 22;
  const SIZE = 240;
  const N = items.length;

  const keyframes = items
    .map((_, i) => {
      const a = (i / N) * 360;
      return `
      @keyframes family-orbit-${i} {
        from { transform: rotate(${a}deg) translateX(${RADIUS}px) rotate(${-a}deg); }
        to   { transform: rotate(${a + 360}deg) translateX(${RADIUS}px) rotate(${-(a + 360)}deg); }
      }
    `;
    })
    .join('\n');

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{`
        ${keyframes}
        @keyframes family-orbit-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-3px); }
        }
      `}</style>

      {/* Subtle neutral glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 200,
          height: 200,
          marginTop: -100,
          marginLeft: -100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dashed orbit ring */}
      <div
        style={{
          position: 'absolute',
          width: RADIUS * 2,
          height: RADIUS * 2,
          borderRadius: '50%',
          border: '1px dashed rgba(128,128,128,0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* Center Studio logo — neutral dark circle, no pink gradient */}
      <div
        onClick={onLogoPress}
        style={{
          position: 'relative',
          zIndex: 2,
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: 'var(--c-surface-2, rgba(255,255,255,0.05))',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-text-primary)',
          animation: 'family-orbit-bob 3.2s ease-in-out infinite',
          cursor: onLogoPress ? 'pointer' : 'default',
        }}
      >
        <StudioLogo size={48} />
      </div>

      {/* Orbiters — clean white-outlined circles */}
      {items.map(({ key, node }, i) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `family-orbit-${i} ${SPEED}s linear infinite`,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              minWidth: 46,
              minHeight: 46,
              flexShrink: 0,
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--c-text-primary)',
            }}
          >
            {React.cloneElement(node as React.ReactElement<{ size: number }>, { size: 24 })}
          </div>
        </div>
      ))}
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
  | 'privacy-data';

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
      className="spring-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        margin: '28px 0 12px 4px',
        animation: `settings-content-fade-in 300ms ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <span
        style={{
          fontSize: 11,
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

function SettingsSubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const [pressed, setPressed] = useState(false);
  const isWebDesktop = useIsWebDesktop();
  return (
    <div
      className="spring-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingTop: isWebDesktop ? 32 : 'calc(env(safe-area-inset-top, 0px) + 20px)',
        paddingBottom: 16,
      }}
    >
      {!isWebDesktop && (
        <button
          onClick={onBack}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(128,128,128,0.10)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--c-text-primary)',
            flexShrink: 0,
            transform: pressed ? 'scale(0.91)' : 'scale(1)',
            transition: 'transform 130ms cubic-bezier(0.34,1.15,0.64,1)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_back
          </span>
        </button>
      )}
      <p
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--c-text-primary)',
          margin: 0,
          letterSpacing: '-0.03em',
          fontFamily: 'Manrope',
        }}
      >
        {title}
      </p>
    </div>
  );
}

function ProfileHeaderBack({ onBack }: { onBack: () => void }) {
  const [pressed, setPressed] = useState(false);
  const isWebDesktop = useIsWebDesktop();
  if (isWebDesktop) return null;
  return (
    <div
      className="spring-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        paddingBottom: 16,
      }}
    >
      <button
        onClick={onBack}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(128,128,128,0.10)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--c-text-primary)',
          flexShrink: 0,
          transform: pressed ? 'scale(0.91)' : 'scale(1)',
          transition: 'transform 130ms cubic-bezier(0.34,1.15,0.64,1)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          arrow_back
        </span>
      </button>
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
          fontSize: 11,
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

function HubUpdaterPage({
  className,
  style,
  cardStyle,
  accent,
  onBack,
  hideHeader,
}: {
  className?: string;
  style: React.CSSProperties;
  cardStyle: React.CSSProperties;
  accent: { from: string; to: string; mid: string };
  onBack: () => void;
  hideHeader?: boolean;
}) {
  const updater = useAppUpdate();
  const isWebDesktop = useIsWebDesktop();
  const settings = useSettingsStore((state) => state.settings);
  const lang = settings.language ?? 'en';
  const changelogSections = getChangelogSections(lang);
  const [changelogExpanded, setChangelogExpanded] = useState(false);
  const isChangelogTooLong =
    changelogSections.length > 2 || changelogSections.some((s) => s.items.length > 3);

  const L =
    lang === 'es'
      ? {
          title: 'Actualizaciones',
          latestRelease: 'Última versión',
          currentVersion: 'Versión actual',
          checking: 'Buscando actualizaciones…',
          upToDate: 'Estás al día',
          upToDateDesc: 'Estás usando la versión más reciente de Studio.',
          updateAvailable: 'Actualización disponible',
          updateAvailableDesc: 'Una nueva versión de Studio está lista.',
          updateNow: 'Actualizar ahora',
          checkForUpdates: 'Buscar actualizaciones',
          whatsNew: 'Novedades en esta versión',
          showFullChangelog: 'Ver registro de cambios completo',
          hideChangelog: 'Ocultar registro de cambios',
          reinstallRequired: 'Requiere reinstalación',
          reinstallDesc:
            'Esta versión requiere reinstalar Studio debido a un cambio de certificado de firma.',
        }
      : {
          title: 'Updates',
          latestRelease: 'Latest Release',
          currentVersion: 'Current version',
          checking: 'Checking for updates…',
          upToDate: "You're up to date",
          upToDateDesc: "You're running the latest version of Studio.",
          updateAvailable: 'Update available',
          updateAvailableDesc: 'A new version of Studio is ready to install.',
          updateNow: 'Update Now',
          checkForUpdates: 'Check for Updates',
          whatsNew: "What's new in this version",
          showFullChangelog: 'Show full changelog',
          hideChangelog: 'Hide changelog',
          reinstallRequired: 'Reinstall required',
          reinstallDesc:
            'This version requires reinstalling Studio due to a signing certificate change.',
        };

  const isChecking = updater.loading;
  const hasUpdate = updater.updateAvailable;
  const isReinstall = Capacitor.isNativePlatform() && updater.reinstallRequired;

  const statusConfig = isChecking
    ? { color: accent.from, label: L.checking, icon: 'refresh' as const, pulse: true }
    : hasUpdate
      ? isReinstall
        ? { color: '#f87171', label: L.reinstallRequired, icon: 'warning' as const, pulse: false }
        : {
            color: '#f59e0b',
            label: L.updateAvailable,
            icon: 'system_update' as const,
            pulse: false,
          }
      : { color: '#4ade80', label: L.upToDate, icon: 'check_circle' as const, pulse: false };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryStyle = (heading: string) => {
    const key = heading.toLowerCase();
    const colors = {
      added: { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ade80' },
      improved: { bg: `color-mix(in srgb, ${accent.from} 12%, transparent)`, text: accent.from },
      fixed: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
      changed: { bg: 'rgba(147, 130, 220, 0.12)', text: '#9382dc' },
    };
    return colors[key] || { bg: 'rgba(128,128,128,0.1)', text: 'var(--c-text-secondary)' };
  };

  const showRecoveryStatus = Capacitor.isNativePlatform();
  const recoveryStatusText = updater.recoveryMode
    ? lang === 'es'
      ? 'Recuperación Activa (Fallos consecutivos: ' + updater.consecutiveFailures + ')'
      : 'Recovery Mode Active (Consecutive failures: ' + updater.consecutiveFailures + ')'
    : lang === 'es'
      ? 'Estable (Normal)'
      : 'Stable (Normal)';

  return (
    <div className={className} style={style}>
      <style>
        {HUB_SETTINGS_CSS}
        {`
        @keyframes updater-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes updater-check-spin {
          to { transform: rotate(360deg); }
        }
        .updater-hero-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          margin: 0 0 16px;
        }
        .updater-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,
            color-mix(in srgb, ${accent.from} 15%, transparent),
            color-mix(in srgb, ${accent.to} 8%, transparent)
          );
          pointer-events: none;
        }
        .updater-hero-inner {
          position: relative;
          padding: 22px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .updater-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: Manrope, sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          width: fit-content;
        }
        .updater-version-headline {
          font-family: Manrope, sans-serif;
          font-weight: 800;
          font-size: 32px;
          letter-spacing: -0.035em;
          line-height: 1.1;
          color: var(--c-text-primary);
          margin: 0;
        }
        .updater-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(128,128,128,0.06);
          border: 1px solid rgba(128,128,128,0.08);
        }
        .updater-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .updater-cta-btn {
          width: 100%;
          padding: 14px 20px;
          border-radius: 14px;
          border: none;
          font-family: Manrope, sans-serif;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 8px;
          transition: transform 120ms ease, box-shadow 200ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .updater-cta-btn:active {
          transform: scale(0.97);
        }
        .updater-changelog-section {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(128,128,128,0.06);
        }
        .updater-changelog-section:last-child {
          border-bottom: none;
        }
        .updater-changelog-heading {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 6px;
          font-family: Manrope, sans-serif;
          font-weight: 700;
          font-size: 11.5px;
          letter-spacing: 0.02em;
          margin-bottom: 10px;
        }
        .updater-changelog-item {
          display: flex;
          gap: 10px;
          padding: 4px 0;
          font-family: Inter, sans-serif;
          font-size: var(--font-sm, 13px);
          line-height: 1.5;
          color: var(--c-text-secondary);
        }
        .updater-changelog-bullet {
          flex-shrink: 0;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          margin-top: 7px;
        }
      `}
      </style>
      {!isWebDesktop && !hideHeader && <SettingsSubHeader title={L.title} onBack={onBack} />}

      {/* ── 2. CURRENT INSTALLED VERSION & CHECKER ── */}
      <div
        className="updater-hero-card spring-in"
        style={{ ...cardStyle, margin: 0, marginBottom: 16 }}
      >
        <div className="updater-hero-bg" />
        <div className="updater-hero-inner">
          {/* Badge */}
          <div
            className="updater-badge"
            style={{
              background: hasUpdate
                ? isReinstall
                  ? 'rgba(248,113,113,0.12)'
                  : `color-mix(in srgb, ${accent.from} 14%, transparent)`
                : 'rgba(74,222,128,0.12)',
              color: hasUpdate ? (isReinstall ? '#f87171' : accent.from) : '#4ade80',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 13,
                fontVariationSettings: "'FILL' 1",
              }}
            >
              {statusConfig.icon}
            </span>
            {hasUpdate ? L.latestRelease : L.upToDate}
          </div>

          {/* Version Headline */}
          <h1 className="updater-version-headline">
            {hasUpdate ? (
              <>v{updater.remoteVersion}</>
            ) : (
              <>
                v{APP_VERSION}
                <span className="updater-version-tag">{APP_VERSION_TAG}</span>
              </>
            )}
          </h1>

          {/* Status Row */}
          <div className="updater-status-row">
            {isChecking ? (
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 16,
                  color: accent.from,
                  animation: 'updater-check-spin 1s linear infinite',
                  flexShrink: 0,
                }}
              >
                refresh
              </span>
            ) : (
              <div
                className="updater-status-dot"
                style={{
                  background: statusConfig.color,
                  boxShadow: `0 0 8px ${statusConfig.color}66`,
                  animation: statusConfig.pulse
                    ? 'updater-pulse 1.5s ease-in-out infinite'
                    : 'none',
                }}
              />
            )}
            <span
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 600,
                fontSize: 'var(--font-sm, 13px)',
                color: 'var(--c-text-primary)',
                flex: 1,
              }}
            >
              {statusConfig.label}
            </span>
            {!hasUpdate && !isChecking && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11.5,
                  color: 'var(--c-text-tertiary)',
                }}
              >
                {formatDate(APP_VERSION_DATE)}
              </span>
            )}
          </div>

          {/* Reinstall Warning */}
          {hasUpdate && isReinstall && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 16,
                  color: '#f87171',
                  flexShrink: 0,
                  marginTop: 1,
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                warning
              </span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Manrope',
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: '#f87171',
                  }}
                >
                  {L.reinstallRequired}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: 'Inter',
                    fontSize: 11.5,
                    color: 'var(--c-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {L.reinstallDesc}
                </p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {hasUpdate ? (
            Capacitor.isNativePlatform() ? (
              <button
                className="updater-cta-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('studio:open-update-dialog'))}
                style={{
                  background: isReinstall
                    ? 'linear-gradient(135deg, #f87171, #ef4444)'
                    : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: '#fff',
                  boxShadow: isReinstall
                    ? '0 4px 20px rgba(248,113,113,0.3)'
                    : `0 4px 20px color-mix(in srgb, ${accent.to} 30%, transparent)`,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                >
                  {isReinstall ? 'download' : 'system_update'}
                </span>
                {L.updateNow}
              </button>
            ) : (
              <button
                className="updater-cta-btn"
                onClick={() => window.location.reload()}
                style={{
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  color: '#fff',
                  boxShadow: `0 4px 20px color-mix(in srgb, ${accent.to} 30%, transparent)`,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                >
                  refresh
                </span>
                {lang === 'es' ? 'Recargar Studio' : 'Refresh Studio'}
              </button>
            )
          ) : (
            <button
              className="updater-cta-btn"
              onClick={async () => {
                await updater.checkNow();
              }}
              disabled={isChecking}
              style={{
                background: 'rgba(128,128,128,0.08)',
                color: isChecking ? 'var(--c-text-tertiary)' : 'var(--c-text-primary)',
                border: '1px solid rgba(128,128,128,0.12)',
                cursor: isChecking ? 'default' : 'pointer',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  animation: isChecking ? 'updater-check-spin 1s linear infinite' : 'none',
                }}
              >
                refresh
              </span>
              {L.checkForUpdates}
            </button>
          )}

          {/* ── 3. COLLAPSIBLE CHANGELOG ── */}
          {changelogSections.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(128, 128, 128, 0.12)',
                paddingTop: 16,
                marginTop: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <p
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'var(--c-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {L.whatsNew}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 12,
                  background: 'rgba(128, 128, 128, 0.04)',
                  border: '1px solid rgba(128, 128, 128, 0.06)',
                  overflow: 'hidden',
                }}
              >
                {(isChangelogTooLong && !changelogExpanded
                  ? changelogSections.slice(0, 2)
                  : changelogSections
                ).map((section, si) => (
                  <div
                    key={si}
                    className="updater-changelog-section"
                    style={{
                      padding: '12px 14px',
                      borderBottom:
                        si ===
                        (isChangelogTooLong && !changelogExpanded
                          ? Math.min(2, changelogSections.length)
                          : changelogSections.length) -
                          1
                          ? 'none'
                          : '1px solid rgba(128,128,128,0.06)',
                    }}
                  >
                    <div
                      className="updater-changelog-heading"
                      style={{
                        background: getCategoryStyle(section.heading).bg,
                        color: getCategoryStyle(section.heading).text,
                        marginBottom: 8,
                      }}
                    >
                      {section.heading}
                    </div>
                    {(isChangelogTooLong && !changelogExpanded
                      ? section.items.slice(0, 3)
                      : section.items
                    ).map((item, ii) => {
                      const cleanedItem = item.replace(/^[-*•]\s*/, '').trim();
                      return (
                        <div key={ii} className="updater-changelog-item" style={{ padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: '1.6' }}>
                          <div
                            className="updater-changelog-bullet"
                            style={{
                              background: getCategoryStyle(section.heading).text,
                              opacity: 0.6,
                              marginTop: 6,
                              flexShrink: 0,
                            }}
                          />
                          <span>{cleanedItem}</span>
                        </div>
                      );
                    })}
                    {isChangelogTooLong && !changelogExpanded && section.items.length > 3 && (
                      <div
                        style={{
                          paddingLeft: 15,
                          paddingTop: 2,
                          fontFamily: 'Inter',
                          fontSize: 11,
                          color: 'var(--c-text-tertiary)',
                        }}
                      >
                        +{section.items.length - 3} more
                      </div>
                    )}
                  </div>
                ))}

                {isChangelogTooLong && (
                  <button
                    type="button"
                    onClick={() => setChangelogExpanded(!changelogExpanded)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      color: accent.from,
                      fontFamily: 'Manrope',
                      fontWeight: 700,
                      fontSize: 'var(--font-sm, 12px)',
                      cursor: 'pointer',
                      borderTop: '1px solid rgba(128,128,128,0.06)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {changelogExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                    {changelogExpanded ? L.hideChangelog : L.showFullChangelog}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 1. OFFICIAL RELEASE DOWNLOADS (Recovery Section) ── */}
      <div
        className="spring-in"
        style={{
          ...cardStyle,
          margin: 0,
          marginBottom: 16,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: accent.from }}>
            download
          </span>
          <strong style={{ fontFamily: 'Manrope', fontSize: 16 }}>
            {lang === 'es' ? 'Descargas Oficiales' : 'Official Release Downloads'}
          </strong>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
          {lang === 'es'
            ? 'Studio publica cada versión oficial firmada directamente en GitHub. Puede descargar la última compilación si la actualización automática del sistema falla.'
            : 'Studio publishes every official production release on GitHub. You can safely download and install the latest signed release directly from the repository if the automatic updater fails.'}
        </p>

        {showRecoveryStatus && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(128,128,128,0.04)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(128,128,128,0.06)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-tertiary)' }}>
              {lang === 'es' ? 'Estado de Recuperación' : 'Recovery Status'}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: updater.recoveryMode ? '#ef4444' : '#22c55e',
                background: updater.recoveryMode ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {recoveryStatusText}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => window.open('https://github.com/MAGEXE1000/Studio/releases', '_system')}
          className="btn-smooth animate-click"
          style={{
            height: 42,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            border: 'none',
            color: 'white',
            fontFamily: 'Manrope',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: `0 4px 14px color-mix(in srgb, ${accent.to} 25%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="white" style={{ flexShrink: 0 }}>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          {lang === 'es' ? 'Descargar de GitHub' : 'Download from GitHub'}
        </button>
      </div>
    </div>
  );
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
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const updatePerApp = useSettingsStore((state) => state.updatePerApp);
  const historyLength = useNavigationStore((s) => s.history.length);
  const { preferences, setPreference } = useStudioPreferences();
  const unreadCount = useNotificationService(
    (s) => s.notifications.filter((n) => !n.read && !n.dismissed).length
  );
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
            id: 'release-notes' as const,
            icon: 'article',
            label:
              t.hub.studioSettings.releaseTitle ||
              (lang === 'es' ? 'Notas de Lanzamiento' : 'Release Notes'),
          },
          {
            id: 'about' as const,
            icon: 'info',
            label:
              t.settings.sections.about || (lang === 'es' ? 'Acerca de Studio' : 'About & Version'),
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
    if (id === 'personal-info') return lang === 'es' ? 'Información personal' : 'Personal Information';
    if (id === 'security-login') return lang === 'es' ? 'Seguridad y acceso' : 'Security & Login';
    if (id === 'subscription') return lang === 'es' ? 'Suscripción y facturación' : 'Subscription & Billing';
    if (id === 'devices-sessions') return lang === 'es' ? 'Dispositivos y sesiones' : 'Devices & Sessions';
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
    accentColor: 'blue',
    amoledMode: false,
  };
  const [changelogOpen, setChangelogOpen] = useState(false);

  function requestChange(patch: Partial<PerAppVisuals>) {
    const ALL_APPS: AppKey[] = ['hub', 'chords', 'drums', 'stage', 'groovex', 'vocalex'];
    updatePerApp(ALL_APPS, patch);
    if (patch.theme) settingsController.updateSettings({ theme: patch.theme });
    if (patch.accentColor) settingsController.updateSettings({ accentColor: patch.accentColor });
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
    NavigationDispatcher.pop();
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
      sessionStorage.removeItem('studio:laterUpdateVersion');

      showDevToast('Updater simulation configured. Checking update...');
      await checkForUpdate(true, 'settings_manual', 'dev test check');
    } catch (err: any) {
      showDevToast(`Simulate failed: ${err.message || String(err)}`);
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
        background: 'var(--app-surface)',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        transition: 'background-color 700ms cubic-bezier(0.4,0,0.2,1)',
        border: '1px solid rgba(128,128,128,0.07)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <HelpAccordion accent={accent} lang={lang} />
      </div>
    );
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {changelogSections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3
                style={{
                  fontSize: 11,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
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
                  fontSize: 11,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3
              style={{
                fontSize: 11,
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
                            fontSize: 11,
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 24,
        }}
      >
        <p style={{ margin: 0 }}>
          Welcome to Studio. By accessing or using our application, you agree to comply with and be
          bound by the following Terms of Service. Please read them carefully.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          1. Ownership of Content
        </h4>
        <p style={{ margin: 0 }}>
          All musical patterns, drum sequences, settings, and other project data created by you
          using Studio's tools (Chordex, Drumex, Stagex, Groovex, Vocalex) remain entirely your
          property. We lay no claim of copyright, trademark, or ownership over your creative output.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          2. Use of Service
        </h4>
        <p style={{ margin: 0 }}>
          Studio is provided on a local-first basis. Data sync features are provided for your
          personal backup convenience. You agree not to abuse or attempt to overload the sync
          servers.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          3. Disclaimer of Warranties
        </h4>
        <p style={{ margin: 0 }}>
          Studio is provided "as is" and "as available" without any warranties of any kind. While we
          aim to protect project data using reliable local storage and cloud sync mechanisms, we
          cannot guarantee data will not be lost. We recommend periodic manual backups.
        </p>
      </div>
    );
  }

  function renderPrivacyPolicyContent() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 24,
        }}
      >
        <p style={{ margin: 0 }}>
          Your privacy is extremely important to us. This Privacy Policy details how Studio
          collects, uses, and safeguards your data.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          1. Local-First Storage
        </h4>
        <p style={{ margin: 0 }}>
          By default, all your project settings, drum sequences, and songs are stored locally on
          your device using IndexedDB and localStorage. None of this creative work leaves your
          device unless you explicitly enable Cloud Sync.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          2. Cloud Backup & Authentication
        </h4>
        <p style={{ margin: 0 }}>
          If you create a Studio Account, we use Firebase to manage your login credentials. Your
          project backups are stored securely in Firestore databases. We only use this data to
          perform cross-device syncing at your request.
        </p>
        <h4
          style={{
            color: 'var(--c-text-primary)',
            margin: '8px 0 4px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          3. No Third-Party Tracking
        </h4>
        <p style={{ margin: 0 }}>
          Studio does not use telemetry, advertising trackers, or external behavioral analytics.
          Your interaction with the app remains entirely private.
        </p>
      </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
          {Capacitor.isNativePlatform()
            ? 'If you encounter an issue or unexpected behavior in Studio, please report it! Tap below to send us a support email with pre-filled diagnostic information.'
            : 'If you encounter an issue or unexpected behavior in Studio, please report it! Copy the template below and submit it on our GitHub repository.'}
        </p>

        <button
          onClick={handleCopyTemplate}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 16px',
            background: accent.from,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {copiedBugTemplate ? 'check' : 'content_copy'}
          </span>
          {copiedBugTemplate ? 'Copied to Clipboard!' : 'Copy Bug Template'}
        </button>

        <div
          style={{
            padding: 14,
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(128,128,128,0.08)',
            borderRadius: 8,
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

        <div
          style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)', margin: '8px 0' }}
        />

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
              padding: '10px 16px',
              background: accent.from,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              open_in_new
            </span>
            Report a Bug on GitHub
          </a>
        </div>
      </div>
    );
  }

  function renderGeneralContent() {
    const isHideActive = preferences.autoHideSidebarInApps;
    const isHoverActive = isHideActive && preferences.hoverRevealSidebar;
    const sSets = t.hub.studioSettings;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          paddingBottom: 24,
        }}
      >
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
                margin: 0,
              }}
            >
              {sSets.dockAlwaysEnabled}
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

          <SettingRow
            label={t.settings.rows.swipeBackBehavior || 'Swipe back behavior'}
            desc={
              t.settings.rows.swipeBackBehaviorDesc ||
              'Configure swipe back gesture behavior on app root screens.'
            }
          >
            <SegmentedControl<'exit-to-hub' | 'manual-only'>
              value={settings.swipeBackBehavior || 'exit-to-hub'}
              options={[
                { value: 'exit-to-hub', label: t.settings.rows.swipeBackExit || 'Swipe to Hub' },
                { value: 'manual-only', label: t.settings.rows.swipeBackManual || 'Manual Only' },
              ]}
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
      </div>
    );
  }

  function renderAppearanceContent() {
    const isLight =
      settings.theme === 'light' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: light)').matches);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          paddingBottom: 24,
          animation: 'hub-row-fade 320ms ease both',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Manrope', margin: '8px 0 0' }}>
          Theme Mode
        </h2>

        {/* 2x2 Grid of Theme Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              id: 'system',
              name: 'System',
              label: 'Auto',
              bg: 'rgba(128, 128, 128, 0.08)',
              isAmoled: false,
            },
            {
              id: 'light',
              name: 'Light',
              label: 'Editorial',
              bg: '#f5f5f5',
              isAmoled: false,
              textColor: '#000000',
            },
            {
              id: 'dark',
              name: 'Dark',
              label: 'Tonal',
              bg: 'var(--app-surface-high, rgba(128,128,128,0.06))',
              isAmoled: false,
            },
            {
              id: 'amoled',
              name: 'AMOLED',
              label: 'Pure',
              bg: '#000000',
              isAmoled: true,
              border: '1px solid rgba(255,255,255,0.08)',
            },
          ].map((tOpt) => {
            let isThemeActive = false;
            if (tOpt.id === 'system') {
              isThemeActive = settings.theme === 'system';
            } else if (tOpt.id === 'light') {
              isThemeActive = settings.theme === 'light';
            } else if (tOpt.id === 'dark') {
              isThemeActive = settings.theme === 'dark' && !settings.amoledMode;
            } else if (tOpt.id === 'amoled') {
              isThemeActive = settings.theme === 'dark' && settings.amoledMode;
            }

            return (
              <motion.button
                key={tOpt.id}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = rect.left + rect.width / 2;
                  const y = rect.top + rect.height / 2;

                  const targetTheme =
                    tOpt.id === 'system' ? 'system' : tOpt.id === 'light' ? 'light' : 'dark';
                  const targetAmoled = tOpt.id === 'amoled';

                  const currentTheme = settings.theme ?? 'dark';
                  const nextIsLight =
                    tOpt.id === 'light' ||
                    (tOpt.id === 'system' &&
                      typeof window !== 'undefined' &&
                      window.matchMedia('(prefers-color-scheme: light)').matches);
                  const currentIsLight =
                    currentTheme === 'light' ||
                    (currentTheme === 'system' &&
                      typeof window !== 'undefined' &&
                      window.matchMedia('(prefers-color-scheme: light)').matches);

                  if (!isThemeActive) {
                    if (typeof (window as any).__triggerThemeTransition === 'function') {
                      (window as any).__triggerThemeTransition(
                        nextIsLight ? 'light' : 'dark',
                        targetAmoled,
                        x,
                        y,
                        () => {
                          if (tOpt.id === 'system')
                            requestChange({ theme: 'system', amoledMode: false });
                          else if (tOpt.id === 'light')
                            requestChange({ theme: 'light', amoledMode: false });
                          else if (tOpt.id === 'dark')
                            requestChange({ theme: 'dark', amoledMode: false });
                          else if (tOpt.id === 'amoled')
                            requestChange({ theme: 'dark', amoledMode: true });
                        }
                      );
                    } else {
                      if (tOpt.id === 'system')
                        requestChange({ theme: 'system', amoledMode: false });
                      else if (tOpt.id === 'light')
                        requestChange({ theme: 'light', amoledMode: false });
                      else if (tOpt.id === 'dark')
                        requestChange({ theme: 'dark', amoledMode: false });
                      else if (tOpt.id === 'amoled')
                        requestChange({ theme: 'dark', amoledMode: true });
                    }
                  } else {
                    if (tOpt.id === 'system') requestChange({ theme: 'system', amoledMode: false });
                    else if (tOpt.id === 'light')
                      requestChange({ theme: 'light', amoledMode: false });
                    else if (tOpt.id === 'dark')
                      requestChange({ theme: 'dark', amoledMode: false });
                    else if (tOpt.id === 'amoled')
                      requestChange({ theme: 'dark', amoledMode: true });
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: tOpt.bg,
                  border: `1.5px solid ${isThemeActive ? accent.from : 'transparent'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isThemeActive ? `0 0 12px ${accent.from}15` : 'none',
                  transition: 'border-color 200ms, box-shadow 200ms',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background:
                      tOpt.id === 'system'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.2) 50%)'
                        : tOpt.id === 'light'
                          ? '#ffffff'
                          : tOpt.id === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : '#000000',
                    border: tOpt.border || 'none',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: tOpt.textColor || 'var(--c-text-primary)',
                      margin: 0,
                      fontFamily: 'Inter',
                    }}
                  >
                    {tOpt.name}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      textTransform: 'uppercase',
                      color: tOpt.textColor ? 'rgba(0,0,0,0.5)' : 'var(--c-text-secondary)',
                      margin: '2px 0 0',
                      fontFamily: 'Manrope',
                      opacity: 0.8,
                    }}
                  >
                    {tOpt.label}
                  </p>
                </div>
                {isThemeActive && (
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 16,
                      color: accent.from,
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    check_circle
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Accent Color Section */}
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Manrope', margin: '8px 0 0' }}>
          Accent Color
        </h2>
        <div
          style={{
            background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
            padding: 20,
            borderRadius: 16,
            border: '1px solid rgba(128,128,128,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[
              { id: 'blue', hex: '#007AFF' },
              { id: 'purple', hex: '#A855F7' },
              { id: 'green', hex: '#22C55E' },
              { id: 'orange', hex: '#F97316' },
              { id: 'pink', hex: '#EC4899' },
              { id: 'teal', hex: '#14B8A6' },
              { id: 'yellow', hex: '#EAB308' },
              { id: 'red', hex: '#EF4444' },
            ].map((cOpt) => {
              const isColorActive = hubVis.accentColor === cOpt.id;
              return (
                <button
                  key={cOpt.id}
                  onClick={() => requestChange({ accentColor: cOpt.id as any })}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: cOpt.hex,
                    border: isColorActive ? '3.5px solid #fff' : 'none',
                    boxShadow: isColorActive ? `0 0 10px ${cOpt.hex}` : 'none',
                    margin: '0 auto',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'transform 150ms ease',
                  }}
                  className="active:scale-90"
                />
              );
            })}
          </div>

          {/* Custom Accent Hue Slider */}
          {(() => {
            const isCustom = hubVis.accentColor === 'custom';
            const hue = settings.customAccentHue ?? 220;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--c-text-primary)',
                        margin: 0,
                      }}
                    >
                      Custom Color
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: 'var(--c-text-secondary)',
                        textTransform: 'uppercase',
                        margin: '2px 0 0',
                      }}
                    >
                      Custom Spectrum
                    </p>
                  </div>
                  <div
                    style={{
                      background: 'var(--app-surface-low, rgba(0,0,0,0.2))',
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(128,128,128,0.1)',
                    }}
                  >
                    <span style={{ fontSize: 11, color: accent.from, fontFamily: 'monospace' }}>
                      #007AFF
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={hue}
                  onChange={(e) => {
                    requestChange({ accentColor: 'custom' });
                    settingsController.updateSettings({ customAccentHue: Number(e.target.value) });
                  }}
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 9999,
                    outline: 'none',
                    background:
                      'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                />
              </div>
            );
          })()}
        </div>

        {/* Visual Comfort Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {/* Display Density */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Manrope', marginBottom: 8 }}>
              Display Density
            </h2>
            <div
              style={{
                display: 'flex',
                gap: 1,
                background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                padding: 3,
                borderRadius: 12,
                border: '1px solid rgba(128,128,128,0.06)',
              }}
            >
              {[
                { id: 'compact', label: 'Compact' },
                { id: 'comfortable', label: 'Normal' },
                { id: 'spacious', label: 'Airy' },
              ].map((opt) => {
                const isActive = settings.displayDensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      settingsController.updateSettings({ displayDensity: opt.id as any })
                    }
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 10,
                      background: isActive
                        ? 'var(--app-surface-high, rgba(128,128,128,0.08))'
                        : 'transparent',
                      border: 'none',
                      color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Scale */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Manrope', marginBottom: 8 }}>
              Text Scale
            </h2>
            <div
              style={{
                display: 'flex',
                gap: 1,
                background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                padding: 3,
                borderRadius: 12,
                border: '1px solid rgba(128,128,128,0.06)',
              }}
            >
              {[
                { id: 'small', label: 'S' },
                { id: 'medium', label: 'M' },
                { id: 'large', label: 'L' },
              ].map((opt) => {
                const isActive = settings.fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => settingsController.updateSettings({ fontSize: opt.id as any })}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 10,
                      background: isActive
                        ? 'var(--app-surface-high, rgba(128,128,128,0.08))'
                        : 'transparent',
                      border: 'none',
                      color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLanguageContent() {
    const LANG_OPTIONS: { code: string; flag: string; native: string; label: string }[] = [
      {
        code: 'en',
        flag: '🇬🇧',
        native: 'English',
        label: t.settings.language.en || 'English (US)',
      },
      { code: 'es', flag: '🇪🇸', native: 'Español', label: t.settings.language.es || 'Spanish' },
      { code: 'de', flag: '🇩🇪', native: 'Deutsch', label: t.settings.language.de || 'German' },
      { code: 'fr', flag: '🇫🇷', native: 'Français', label: t.settings.language.fr || 'French' },
      { code: 'zh', flag: '🇨🇳', native: '中文', label: t.settings.language.zh || 'Chinese' },
      {
        code: 'pt',
        flag: '🇧🇷',
        native: 'Português',
        label: t.settings.language.pt || 'Portuguese',
      },
      { code: 'it', flag: '🇮🇹', native: 'Italiano', label: t.settings.language.it || 'Italian' },
      { code: 'ja', flag: '🇯🇵', native: '日本語', label: t.settings.language.ja || 'Japanese' },
      { code: 'ko', flag: '🇰🇷', native: '한국어', label: t.settings.language.ko || 'Korean' },
    ];
    const currentLang = settings.language ?? 'en';
    const filteredLangs = LANG_OPTIONS.filter(
      (opt) =>
        opt.native.toLowerCase().includes(langQuery.toLowerCase()) ||
        opt.label.toLowerCase().includes(langQuery.toLowerCase())
    );

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          paddingBottom: 24,
          animation: 'hub-row-fade 320ms ease both',
        }}
      >
        {/* Search bar matching design reference */}
        <div
          style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 4 }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 16,
              color: 'var(--c-text-secondary)',
              opacity: 0.5,
              fontSize: 20,
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search languages..."
            value={langQuery}
            onChange={(e) => setLangQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              background: 'var(--app-surface-low, rgba(0,0,0,0.2))',
              border: '1px solid rgba(128,128,128,0.12)',
              borderRadius: 12,
              color: 'var(--c-text-primary)',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 200ms ease',
            }}
            className="focus:border-accent"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredLangs.map((opt) => {
            const isSelected = currentLang === opt.code;
            return (
              <motion.button
                key={opt.code}
                whileTap={{ scale: 0.98 }}
                onClick={() => settingsController.updateSettings({ language: opt.code as any })}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? accent.from + '40' : 'rgba(128,128,128,0.06)'}`,
                  padding: '14px 20px',
                  background: isSelected
                    ? 'var(--app-surface-high, rgba(128,128,128,0.06))'
                    : 'var(--app-surface-low, rgba(128,128,128,0.02))',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 12px ${accent.from}15` : 'none',
                  transition: 'background-color 200ms, border-color 200ms, box-shadow 200ms',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--c-text-primary)',
                      margin: 0,
                      fontFamily: 'Manrope',
                    }}
                  >
                    {opt.native}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--c-text-secondary)',
                      margin: 0,
                      fontFamily: 'Inter',
                      opacity: 0.7,
                    }}
                  >
                    {opt.label}
                  </p>
                </div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '1.5px solid rgba(128,128,128,0.3)',
                    background: isSelected ? accent.from : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms ease',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 12,
                      color: isSelected ? '#fff' : 'transparent',
                      fontWeight: 'bold',
                    }}
                  >
                    check
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Technical Note Section */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: 18,
            borderRadius: 12,
            background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
            border: '1px solid rgba(128,128,128,0.06)',
          }}
        >
          <div
            style={{
              padding: 6,
              borderRadius: 8,
              background: `${accent.from}12`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'max-content',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: accent.from, fontSize: 18 }}
            >
              info
            </span>
          </div>
          <div>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--c-text-primary)',
                margin: '0 0 4px',
                fontFamily: 'Manrope',
              }}
            >
              Technical Note
            </h4>
            <p
              style={{
                fontSize: 11,
                color: 'var(--c-text-secondary)',
                lineHeight: 1.5,
                margin: 0,
                fontFamily: 'Inter',
                opacity: 0.8,
              }}
            >
              Changing the display language will affect all menus, labels, and notifications. Artist
              names and song titles will remain in their original metadata language to preserve
              technical rider accuracy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderPrivacyContent() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          paddingBottom: 24,
        }}
      >
        <SettingsSectionLabel>
          {(t.hub as { studioSettings?: { accountControls?: string } }).studioSettings
            ?.accountControls ?? 'Account Controls'}
        </SettingsSectionLabel>
        <Suspense fallback={null}>
          <AccountDangerZone accent={accent} cardStyle={cardStyle} />
        </Suspense>
      </div>
    );
  }

  function renderNotificationCenterContent() {
    const { notifications, markAsRead, dismiss, clearAll, markAllAsRead } =
      useNotificationService();
    const activeNotifications = notifications.filter((n) => !n.dismissed);
    const updater = useAppUpdate();

    const handleAction = async (id: string, actionId: string) => {
      markAsRead(id);

      if (actionId === 'start_download') {
        try {
          await updater.downloadUpdate('notification_center');
        } catch (err) {
          console.error('Failed to trigger update download:', err);
        }
      } else if (actionId === 'apply_update') {
        try {
          await updater.applyUpdate('notification_center');
        } catch (err) {
          console.error('Failed to trigger update apply:', err);
        }
      } else if (actionId === 'retry_update') {
        try {
          await updater.downloadUpdate('notification_center');
        } catch (err) {
          console.error('Failed to retry update:', err);
        }
      } else if (actionId === 'sync_now') {
        try {
          await syncController.syncNow();
        } catch (err) {
          console.error('Failed to sync now:', err);
        }
      } else if (actionId === 'dismiss') {
        dismiss(id);
      }
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          padding: '16px 20px',
          paddingBottom: 64,
          minHeight: '100%',
        }}
      >
        {/* Header Actions */}
        {activeNotifications.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--c-text-secondary)', fontWeight: 600 }}>
              {activeNotifications.filter((n) => !n.read).length} Unread
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => markAllAsRead()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--c-text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  done_all
                </span>
                Mark all read
              </button>
              <button
                onClick={() => clearAll()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  delete
                </span>
                Clear all
              </button>
            </div>
          </div>
        )}

        <AnimatePresence initial={false} mode="popLayout">
          {activeNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 64,
                paddingBottom: 64,
                gap: 16,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(128, 128, 128, 0.04)',
                  border: '1px solid rgba(128, 128, 128, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 32, color: 'var(--c-text-secondary)', opacity: 0.8 }}
                >
                  notifications_off
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--c-text-primary)',
                    margin: '0 0 4px',
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  All Caught Up
                </h3>
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--c-text-secondary)',
                    opacity: 0.7,
                    margin: 0,
                    maxWidth: 240,
                    lineHeight: 1.4,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  No new activity, updates, or sync events at this time.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.06 } },
              }}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {activeNotifications.map((n) => {
                const badgeStyle = getCategoryColor(n.category);
                const isUnread = !n.read;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { type: 'spring', stiffness: 400, damping: 28 },
                      },
                      exit: {
                        opacity: 0,
                        scale: 0.95,
                        filter: 'blur(4px)',
                        transition: { duration: 0.18 },
                      },
                    }}
                    exit="exit"
                    onClick={() => markAsRead(n.id)}
                    style={{
                      background: isUnread ? 'rgba(255,255,255,0.03)' : 'rgba(128,128,128,0.01)',
                      borderRadius: 18,
                      padding: 16,
                      border: isUnread
                        ? '1px solid rgba(168, 85, 247, 0.25)'
                        : '1px solid rgba(128,128,128,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isUnread ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
                      transition: 'border 250ms, background 250ms, box-shadow 250ms',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isUnread
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(128, 128, 128, 0.04)',
                          border: '1px solid rgba(128, 128, 128, 0.08)',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: badgeStyle.text, fontSize: 18 }}
                        >
                          {getCategoryIcon(n.category)}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: 'var(--c-text-primary)',
                              fontFamily: 'var(--font-headline)',
                            }}
                          >
                            {n.title}
                          </span>
                          <span
                            style={{ fontSize: 10, color: 'var(--c-text-secondary)', opacity: 0.6 }}
                          >
                            {formatTimestamp(n.timestamp)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--c-text-secondary)',
                            opacity: 0.85,
                            margin: 0,
                            lineHeight: 1.45,
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {n.subtitle}
                        </p>
                      </div>

                      {/* Unread Glow Dot */}
                      {isUnread && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#a855f7',
                            boxShadow: '0 0 8px #a855f7',
                            position: 'absolute',
                            top: 16,
                            right: 16,
                          }}
                        />
                      )}
                    </div>

                    {/* Actions and Footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(128,128,128,0.06)',
                        paddingTop: 10,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                          fontFamily: 'var(--font-headline)',
                        }}
                      >
                        {n.category.replace('_', ' ')}
                      </span>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {n.actions &&
                          n.actions.map((act) => (
                            <button
                              key={act.actionId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(n.id, act.actionId);
                              }}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 999,
                                background: 'var(--c-text-primary)',
                                color: 'var(--app-bg)',
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-headline)',
                              }}
                            >
                              {act.label}
                            </button>
                          ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 999,
                            background: 'rgba(128, 128, 128, 0.06)',
                            color: 'var(--c-text-secondary)',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontFamily: 'var(--font-headline)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            close
                          </span>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
              padding: '14px 20px',
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
            <button
              onClick={onPress}
              disabled={disabled || isLoading || devLoadingAction !== null}
              className="btn-smooth"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: isDestructive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(128,128,128,0.08)',
                border: isDestructive
                  ? '1px solid rgba(239, 68, 68, 0.20)'
                  : '1px solid rgba(128,128,128,0.15)',
                color: isDestructive ? '#ef4444' : 'var(--c-text-primary)',
                fontFamily: 'Manrope',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                opacity: disabled || isLoading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? 'Running...' : actionLabel}
            </button>
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
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(128,128,128,0.08)' }}>
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
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(128,128,128,0.08)' }}>
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
                    fontSize: 11,
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
                    fontSize: 11,
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
                    fontSize: 11,
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
            <DevInfoRow label="Local Accent Color" value={diag.localAccentColor} />
            <DevInfoRow label="Remote Accent Color" value={diag.remoteAccentColor} />
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
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }
      : {
          ...cardStyle,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          paddingBottom: 24,
        }}
      >
        <div style={heroCardStyle}>
          <StudioFamilyOrbit items={subAppLogos} onLogoPress={handleLogoTap} />
          <p
            style={{
              margin: '16px 0 0',
              fontFamily: 'Manrope',
              fontWeight: 800,
              fontSize: 24,
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
              margin: '14px 0 0',
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
          <button
            onClick={() => navigate('terms')}
            className="btn-smooth"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '12px 0',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13.5 }}>
              {lang === 'es' ? 'Condiciones de Servicio' : 'Terms of Service'}
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}
            >
              chevron_right
            </span>
          </button>
          <button
            onClick={() => navigate('privacy-policy')}
            className="btn-smooth"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '12px 0',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13.5 }}>
              {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}
            >
              chevron_right
            </span>
          </button>
          <button
            onClick={() =>
              showDevToast(
                lang === 'es'
                  ? 'Licencias de código abierto: MIT, Apache 2.0, BSD'
                  : 'Open Source Licenses: MIT, Apache 2.0, BSD'
              )
            }
            className="btn-smooth"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '12px 0',
              borderBottom: '1px solid rgba(128,128,128,0.08)',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13.5 }}>
              {lang === 'es' ? 'Licencias de Software' : 'Software Licenses'}
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}
            >
              chevron_right
            </span>
          </button>
          <button
            onClick={() => window.open('https://github.com/MAGEXE1000/Studio', '_system')}
            className="btn-smooth"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13.5 }}>
              {lang === 'es' ? 'Créditos y Repositorio' : 'Credits & GitHub'}
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}
            >
              open_in_new
            </span>
          </button>
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
              fontFamily: 'Manrope',
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
      </div>
    );
  }

  function renderMobileProfileCard() {
    const name = authUser?.displayName || 'Guest User';
    const email = authUser?.email || 'Sign in to back up settings';
    const photo = customPhoto || authUser?.photoURL;
    const initial = (name[0] ?? 'S').toUpperCase();
    const hasUser = !!authUser;
    return (
      <button
        type="button"
        onClick={() => onProfile?.()}
        className="btn-smooth"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '20px',
          background: 'var(--app-surface-high)',
          border: '1px solid rgba(128, 128, 128, 0.08)',
          borderRadius: '16px',
          cursor: 'pointer',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'left',
          boxSizing: 'border-box',
          animation: 'hub-row-fade 320ms 30ms ease both',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Subtle Accent Glow */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: `${accent.from}0e`,
            filter: 'blur(20px)',
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
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--app-surface-bright, #2c2c2c)',
              background: 'var(--app-surface-highest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${accent.from}15`,
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
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text-primary)' }}>
                {initial}
              </span>
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: 'var(--c-text-secondary)' }}
              >
                account_circle
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--c-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  fontFamily: 'Manrope',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {hasUser ? name : 'Sign In'}
              </h2>
              {hasUser && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: 'Manrope',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${accent.from}22`,
                    color: accent.from,
                    border: `1px solid ${accent.from}33`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Pro
                </span>
              )}
            </div>
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: 'var(--c-text-secondary)',
                margin: '3px 0 0',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: 0.8,
              }}
            >
              {hasUser ? email : 'Sync your settings with Studio Cloud'}
            </p>
          </div>
        </div>

        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: 'var(--c-text-secondary)',
            opacity: 0.5,
            zIndex: 2,
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          chevron_right
        </span>
      </button>
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
          background: 'var(--app-surface)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          border: '1px solid rgba(128,128,128,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
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
          background: 'var(--app-surface)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          border: '1px solid rgba(128,128,128,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          marginBottom: 20,
        };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          paddingBottom: 24,
        }}
      >
        <Suspense fallback={null}>
          {authUser ? (
            <AccountSettingsPage accent={accent} cardStyle={profileCardStyle} onBack={goBack} />
          ) : (
            <div style={{ paddingBottom: 80 }}>
              <div style={{ marginBottom: 16 }}>
                <StudioFamilyOrbit
                  items={[
                    { key: 'chordex', label: 'Chordex', node: <ChordexLogo size={34} /> },
                    { key: 'drumex', label: 'Drumex', node: <DrumexLogo size={34} /> },
                    { key: 'stagex', label: 'Stagex', node: <StagexLogoIcon size={34} /> },
                    { key: 'groovex', label: 'Groovex', node: <GroovexLogo size={34} /> },
                    { key: 'vocalex', label: 'Vocalex', node: <VocalexLogo size={34} /> },
                  ]}
                />
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

  function renderActivePageContent(activePageId: SettingsPageId) {
    switch (activePageId as any) {
      case 'general':
        return renderGeneralContent();
      case 'appearance':
        return renderAppearanceContent();
      case 'language':
        return renderLanguageContent();
      case 'privacy':
        return renderPrivacyContent();
      case 'notifications':
        return renderNotificationCenterContent();
      case 'developer':
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
      case 'about':
        return renderAboutContent();
      case 'debug':
        return (
          <DebugSettingsContent
            accent={accent}
            cardStyle={cardStyle}
            devNativeVersion={devNativeVersion}
            devVersionCode={devVersionCode}
          />
        );
      case 'profile':
      case 'personal-info':
      case 'security-login':
      case 'subscription':
      case 'devices-sessions':
      case 'privacy-data':
        return renderProfile();
      case 'release-notes':
        return renderReleaseNotesContent();
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
            if (pageId === 'notifications') {
              return (
                <SettingsScaffold title="Notification Center" onBack={goBack}>
                  {renderNotificationCenterContent()}
                </SettingsScaffold>
              );
            }
            if (standardScrollPages.includes(pageId as SettingsPageId)) {
              const toolbarActions = pageId === 'profile' ? (
                <button
                  type="button"
                  onClick={() => NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'main' })}
                  style={{
                    background: 'rgba(128, 128, 128, 0.10)',
                    border: 'none',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--c-text-primary)',
                    cursor: 'pointer',
                    transition: 'transform 130ms cubic-bezier(0.34, 1.15, 0.64, 1)',
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.91)';
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    settings
                  </span>
                </button>
              ) : undefined;

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
                      padding: '0 20px',
                      paddingBottom: 'calc(var(--content-bottom-pad) + 52px)',
                      WebkitOverflowScrolling: 'touch',
                    }}
                    className="no-scrollbar"
                  >
                    <div style={{ paddingTop: 32, paddingBottom: 16 }}>
                      <p
                        style={{
                          fontSize: 32,
                          fontWeight: 800,
                          color: 'var(--c-text-primary)',
                          margin: 0,
                          letterSpacing: '-0.03em',
                          fontFamily: 'Manrope',
                        }}
                      >
                        Settings
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--c-text-secondary)',
                          margin: '5px 0 0',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.2em',
                        }}
                      >
                        Livex System
                      </p>
                    </div>

                    {/* Preferences Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'var(--c-text-secondary)',
                          opacity: 0.8,
                          paddingLeft: 4,
                          marginBottom: 8,
                          fontFamily: 'Manrope',
                        }}
                      >
                        PREFERENCES
                      </h3>
                      <div
                        style={{
                          background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                          borderRadius: 16,
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          border: '1px solid rgba(128,128,128,0.06)',
                        }}
                      >
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('appearance')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
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
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--c-text-primary)',
                                fontFamily: 'Inter',
                              }}
                            >
                              Appearance
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              Theme, dynamic colors, accent
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('language')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                            >
                              translate
                            </span>
                          </div>
                          <div
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--c-text-primary)',
                                fontFamily: 'Inter',
                              }}
                            >
                              Language
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              {lang.toUpperCase()}
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Help & Support Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'var(--c-text-secondary)',
                          opacity: 0.8,
                          paddingLeft: 4,
                          marginBottom: 8,
                          fontFamily: 'Manrope',
                        }}
                      >
                        HELP & SUPPORT
                      </h3>
                      <div
                        style={{
                          background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                          borderRadius: 16,
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          border: '1px solid rgba(128,128,128,0.06)',
                        }}
                      >
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('help-center')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                            >
                              help_center
                            </span>
                          </div>
                          <div
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--c-text-primary)',
                                fontFamily: 'Inter',
                              }}
                            >
                              Help & Support
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              Documentation and FAQ
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('bug-report')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
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
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--c-text-primary)',
                                fontFamily: 'Inter',
                              }}
                            >
                              Report a Bug
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              Help us improve the workspace
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    {/* System & About Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'var(--c-text-secondary)',
                          opacity: 0.8,
                          paddingLeft: 4,
                          marginBottom: 8,
                          fontFamily: 'Manrope',
                        }}
                      >
                        SYSTEM & ABOUT
                      </h3>
                      <div
                        style={{
                          background: 'var(--app-surface-low, rgba(128,128,128,0.02))',
                          borderRadius: 16,
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          border: '1px solid rgba(128,128,128,0.06)',
                        }}
                      >
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('notifications')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                color: unreadCount > 0 ? '#a855f7' : 'var(--c-text-secondary)',
                                fontSize: 18,
                              }}
                            >
                              {unreadCount > 0 ? 'notifications_active' : 'notifications'}
                            </span>
                          </div>
                          <div
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Inter',
                                }}
                              >
                                Notification Center
                              </span>
                              {unreadCount > 0 && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    background: 'rgba(168, 85, 247, 0.15)',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    color: '#a855f7',
                                    fontWeight: 700,
                                    fontFamily: 'Inter',
                                  }}
                                >
                                  {unreadCount} NEW
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                : 'All caught up'}
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('about')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
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
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--c-text-primary)',
                                fontFamily: 'Inter',
                              }}
                            >
                              About
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--c-text-secondary)',
                                opacity: 0.7,
                              }}
                            >
                              Beta program info & legal
                            </span>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}
                          >
                            chevron_right
                          </span>
                        </motion.div>

                        {settings.developerMode && (
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('developer')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: 12,
                              borderRadius: 10,
                              cursor: 'pointer',
                            }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}
                              >
                                code
                              </span>
                            </div>
                            <div
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--c-text-primary)',
                                  fontFamily: 'Inter',
                                }}
                              >
                                Developer Options
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--c-text-secondary)',
                                  opacity: 0.7,
                                }}
                              >
                                Advanced configurations
                              </span>
                            </div>
                            <span
                              className="material-symbols-outlined"
                              style={{
                                color: 'var(--c-text-secondary)',
                                opacity: 0.4,
                                fontSize: 16,
                              }}
                            >
                              chevron_right
                            </span>
                          </motion.div>
                        )}
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
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
              {lang === 'es' ? 'Ajustes de Studio' : 'Studio Settings'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    fontSize: 11,
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: isActive ? accent.from : 'inherit' }}
                      >
                        {item.icon}
                      </span>
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
            padding: '32px 48px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <div
            key={activePageId}
            className="settings-content-animate"
            style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }}
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
                  fontSize: 28,
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
    NavigationDispatcher.pop();
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {changelogSections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3
                style={{
                  fontSize: 11,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
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
              {t.help.downloadApps.downloadApk}
            </a>
          </div>
          <div style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            {t.help.downloadApps.installApkDesc}
          </p>
        </div>

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
                <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  {t.help.downloadApps.pwaVersion}
                </span>
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
              {t.help.downloadApps.runningNow}
            </div>
          </div>
          <div style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)' }} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
            {t.help.downloadApps.installPwaDesc}
          </p>
        </div>

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
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: accent.from,
                  opacity: 0.8,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3
              style={{
                fontSize: 11,
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
                            fontSize: 11,
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 24,
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
      </div>
    );
  }

  function renderPrivacyPolicyContent() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontSize: 13,
          color: 'var(--c-text-secondary)',
          lineHeight: 1.6,
          paddingBottom: 24,
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
      </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
          {Capacitor.isNativePlatform() ? t.help.bugReport.nativeDesc : t.help.bugReport.webDesc}
        </p>

        <button
          onClick={handleCopyTemplate}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 16px',
            background: accent.from,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {copiedBugTemplate ? 'check' : 'content_copy'}
          </span>
          {copiedBugTemplate ? t.help.bugReport.copied : t.help.bugReport.copyTemplate}
        </button>

        <div
          style={{
            padding: 14,
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(128,128,128,0.08)',
            borderRadius: 8,
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

        <div
          style={{ height: 1, borderTop: '1px solid rgba(128, 128, 128, 0.08)', margin: '8px 0' }}
        />

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
              padding: '10px 16px',
              background: accent.from,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
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
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <style>{HUB_SETTINGS_CSS}</style>
                  <div
                    ref={scrollRef}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '0 20px',
                      paddingBottom: 'calc(var(--content-bottom-pad) + 16px)',
                      willChange: 'transform',
                      transform: 'translate3d(0, 0, 0)',
                      WebkitOverflowScrolling: 'touch',
                    }}
                    className="no-scrollbar"
                  >
                    <div className="spring-in" style={{ paddingTop: 32, paddingBottom: 8 }}>
                      <p
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: 'var(--c-text-primary)',
                          margin: 0,
                          letterSpacing: '-0.03em',
                          fontFamily: 'Manrope',
                        }}
                      >
                        Help & Support
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--c-text-secondary)',
                          margin: '5px 0 0',
                          fontWeight: 500,
                        }}
                      >
                        Find documentation, FAQ, apps, and legal policies
                      </p>
                    </div>

                    <SettingsSectionLabel delay={70}>Support</SettingsSectionLabel>
                    <div style={cardStyle}>
                      <SettingsNavRow
                        icon="contact_support"
                        iconColor={accent.from}
                        title={lang === 'es' ? 'Ayuda y Soporte' : 'Help & Support'}
                        desc={
                          lang === 'es'
                            ? 'Documentación, preguntas frecuentes y diagnósticos'
                            : 'Documentation, FAQ & diagnostics'
                        }
                        onPress={() => navigate('help-center')}
                        last={Capacitor.isNativePlatform()}
                        delay={75}
                      />
                      {!Capacitor.isNativePlatform() && (
                        <SettingsNavRow
                          icon="article"
                          iconColor={accent.from}
                          title="Release Notes"
                          desc="View version history"
                          onPress={() => navigate('release-notes')}
                          delay={80}
                        />
                      )}
                      {!Capacitor.isNativePlatform() && (
                        <SettingsNavRow
                          icon="install_desktop"
                          iconColor={accent.from}
                          title="Download Apps"
                          desc="Get native mobile and desktop clients"
                          onPress={() => navigate('download-apps')}
                          delay={85}
                        />
                      )}
                      {!Capacitor.isNativePlatform() && (
                        <SettingsNavRow
                          icon="keyboard"
                          iconColor={accent.from}
                          title="Keyboard Shortcuts"
                          desc="View quick key bindings"
                          onPress={() => navigate('keyboard-shortcuts')}
                          last
                          delay={90}
                        />
                      )}
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

  /* ── DESKTOP LAYOUT ────────────────────────────────────────────── */
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    fontSize: 11,
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: isActive ? accent.from : 'inherit' }}
                      >
                        {item.icon}
                      </span>
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
            padding: '32px 48px',
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
            style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }}
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
                  fontSize: 28,
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
