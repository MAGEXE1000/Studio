/**
 * updater/useOtaUpdate.ts
 *
 * React hooks for consuming OTA update state:
 *   - useOtaUpdate — main hook returning full update state + action callbacks
 *   - usePostUpdateChangelog — detects just-updated state and shows changelog
 */

import { useEffect, useState } from 'react';
import { APP_VERSION, compareSemver } from '../appVersion';
import { nativeSet, NATIVE_PREFS } from '../nativePrefs';
import { useChordStore } from '../../store/useChordStore';
import { type CentralizedOtaState } from './stateMachine';
import { stateListeners, globalOtaState, updateGlobalState } from './stateMachine';
import { runUpdaterHealthCheck, getDiagnosticsReport, type HealthStatus } from './diagnostics';
import { recordDismissal, shouldShowRecoveryReminder, deleteLocalApk } from './cacheManager';
import { downloadAndInstallGitHubApk } from './downloadManager';
import { runSignatureMismatchRecovery } from './recovery';
import { detectJustUpdated, writeLastSeen } from './versionManager';

import {
  checkForUpdate,
  downloadUpdate,
  applyUpdate,
  initializeGlobalOtaListeners,
  checkAndCleanCache,
  triggerDowngrade,
} from './pipeline';
import { dismissUpdate, markUpdateSeen, applyUpdateDirect, shareDownloadedApk } from './installActions';
import { getUpdateHistory, logUpdateTransition } from './updateHistory';

export interface OtaUpdateHookResult extends CentralizedOtaState {
  checkNow: () => Promise<CentralizedOtaState>;
  downloadUpdate: (trigger?: string) => Promise<void>;
  applyUpdate: (trigger?: string) => Promise<void>;
  dismissUpdate: () => void;
  markUpdateSeen: () => void;
  downloadAndInstallGitHubApk: () => Promise<void>;
  runSignatureMismatchRecovery: () => Promise<boolean>;
  runUpdaterHealthCheck: () => Promise<HealthStatus>;
  getDiagnosticsReport: () => Promise<string>;
  applyUpdateDirect: () => Promise<void>;
  shareDownloadedApk: () => Promise<void>;
  getUpdateHistory: () => any[];
  triggerDowngrade: (targetVersion: string, apkUrl: string, sha256: string) => Promise<void>;
  checkAndCleanCache: () => Promise<boolean>;
  deleteLocalApk: (version: string) => Promise<void>;
  recordDismissal: (version: string) => void;
  shouldShowRecoveryReminder: (version: string) => boolean;
}

export function useOtaUpdate(): OtaUpdateHookResult {
  const [state, setState] = useState<CentralizedOtaState>(globalOtaState);

  useEffect(() => {
    const listener = (newState: CentralizedOtaState) => {
      setState(newState);
    };
    stateListeners.add(listener);

    initializeGlobalOtaListeners();

    void nativeSet(NATIVE_PREFS.OTA_INSTALLED, APP_VERSION);

    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  const checkNow = async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studio:open-update-dialog'));
    }
    const res = await checkForUpdate(true, 'settings_manual', 'user manual checkNow');
    return res;
  };

  return {
    ...state,
    checkNow,
    downloadUpdate: async (trigger?: string) => {
      await downloadUpdate(trigger);
    },
    applyUpdate: async (trigger?: string) => {
      await applyUpdate(trigger);
    },
    dismissUpdate,
    markUpdateSeen,
    downloadAndInstallGitHubApk,
    runSignatureMismatchRecovery: async () => {
      return await runSignatureMismatchRecovery(applyUpdate, downloadUpdate);
    },
    runUpdaterHealthCheck,
    getDiagnosticsReport,
    applyUpdateDirect,
    shareDownloadedApk,
    getUpdateHistory,
    triggerDowngrade,
    checkAndCleanCache,
    deleteLocalApk,
    recordDismissal,
    shouldShowRecoveryReminder,
  };
}

export function usePostUpdateChangelog(): {
  show: boolean;
  fromVersion: string | null;
  toVersion: string;
  dismiss: () => void;
} {
  const [show, setShow] = useState(false);
  const [fromVersion, setFromVersion] = useState<string | null>(null);
  const showChangelog = useChordStore((s) => s.settings.otaShowChangelog ?? true);

  useEffect(() => {
    const { justUpdated, from } = detectJustUpdated();
    if (justUpdated && from) {
      const cmp = compareSemver(APP_VERSION, from);
      if (cmp !== 0) {
        const type = cmp > 0 ? 'upgrade' : 'downgrade';
        logUpdateTransition(from, APP_VERSION, type, 'user', 'success');

        localStorage.setItem('studio:consecutiveInstallFailures', '0');
        updateGlobalState({ consecutiveFailures: 0, recoveryMode: false, activeFallback: null });

        if (type === 'upgrade' && showChangelog) {
          setFromVersion(from);
          setShow(true);
        } else {
          writeLastSeen(APP_VERSION);
        }
      }
    } else if (from === null) {
      writeLastSeen(APP_VERSION);
    }
  }, [showChangelog]);

  const dismiss = () => {
    writeLastSeen(APP_VERSION);
    setShow(false);
  };

  return { show, fromVersion, toVersion: APP_VERSION, dismiss };
}
