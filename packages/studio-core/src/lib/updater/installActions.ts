/**
 * updater/installActions.ts
 *
 * Standalone install-related actions that do not depend on the pipeline.
 * Exports: applyUpdateDirect, shareDownloadedApk, dismissUpdate, markUpdateSeen
 *
 * Note: triggerDowngrade depends on downloadUpdate (pipeline) so it lives in pipeline.ts.
 */

import { APP_VERSION } from '../appVersion';
import { isNative } from '../capgoUpdater';
import { isAppInstallerAvailable } from './diagnostics';
import { globalOtaState, updateGlobalState, transitionToState } from './stateMachine';
import { addToStoredList } from './sessionStorage';
import { recordCloseEvent } from './diagnostics';

export async function applyUpdateDirect(): Promise<void> {
  const filePath = localStorage.getItem('studio:downloadedApkPath');
  if (!filePath) {
    throw new Error('No downloaded APK path found.');
  }
  const { openApkInstallerDirect } = await import('../apkDownloader');
  await openApkInstallerDirect(filePath);
}

export async function shareDownloadedApk(): Promise<void> {
  const filePath = localStorage.getItem('studio:downloadedApkPath');
  if (!filePath) {
    throw new Error('No downloaded APK found to share.');
  }
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: 'Studio Update APK',
      text: 'Here is the latest update APK for Studio.',
      url: filePath,
      dialogTitle: 'Share Studio Update'
    });
  } catch (err: any) {
    console.error('Failed to share APK:', err);
    throw err;
  }
}

// Forward-declaration: resetOtaUpdateState is in pipeline.ts; imported lazily to avoid circular deps.
// dismissUpdate calls it after updating state.
export function dismissUpdate(): void {
  // Inline the reset to avoid circular dependency with pipeline.ts
  const isBusy = ['WAITING_USER_CONFIRMATION', 'PACKAGEINSTALLER_VISIBLE', 'INSTALLING'].includes(globalOtaState.updateState);
  if (!isBusy) {
    // Safe to reset
  }
  recordCloseEvent('dismissUpdate called');
  const ver = globalOtaState.remoteVersion;
  if (ver) {
    addToStoredList('studio:dismissedVersions', ver);
  }
  if (globalOtaState.updateState === 'INSTALL_SUCCESS') {
    localStorage.setItem('studio:lastShownDoneVersion', APP_VERSION);
  }
  transitionToState('IDLE', 'Reset update state');
  updateGlobalState({
    progress: 0,
    error: null,
    statusText: null,
    remoteVersion: null,
    updateAvailable: false,
    mandatory: false,
    changelog: null,
    releaseNotes: null,
    decisionExplanation: null,
  });
  if (isNative() && isAppInstallerAvailable()) {
    import('../apkDownloader').then(({ AppInstaller }) => {
      AppInstaller.clearInstallerLogHistory().catch(() => {});
    });
  }
}

export function markUpdateSeen(): void {
  const ver = globalOtaState.remoteVersion;
  if (ver) {
    addToStoredList('studio:notifiedVersions', ver);
  }
}
