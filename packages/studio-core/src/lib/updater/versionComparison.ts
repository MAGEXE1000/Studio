import { APP_VERSION, compareSemver } from '../appVersion';
import { RemoteVersionInfo } from './releaseMetadata';

export interface VersionComparisonResult {
  updateAvailable: boolean;
  isDowngrade: boolean;
  isUpgrade: boolean;
  isUpToDate: boolean;
  explanation: string;
  details: {
    localVersionName: string;
    localVersionCode: number | null;
    remoteVersionName: string | null;
    remoteVersionCode: number | null;
    metadataAvailable: boolean;
    metadataIntegrity: boolean;
    apkUrlPresent: boolean;
    sha256Present: boolean;
    [key: string]: any;
  };
}

export function compareVersions(
  remote: RemoteVersionInfo | null,
  localVersionName: string = APP_VERSION,
  localVersionCode?: number | null,
): VersionComparisonResult {
  const details = {
    localVersionName,
    localVersionCode: localVersionCode ?? null,
    remoteVersionName: remote ? remote.version : null,
    remoteVersionCode: (remote && remote.versionCode !== undefined) ? remote.versionCode : null,
    metadataAvailable: remote !== null,
    metadataIntegrity: false,
    apkUrlPresent: false,
    sha256Present: false,
  };

  if (!remote) {
    return {
      updateAvailable: false,
      isDowngrade: false,
      isUpgrade: false,
      isUpToDate: false,
      explanation: 'Remote metadata is missing or unreachable.',
      details,
    };
  }

  const apkUrl = remote.apkUrl || remote.downloadUrl;
  details.apkUrlPresent = !!apkUrl;
  details.sha256Present = !!remote.apkSha256;
  
  if (!remote.version || typeof remote.version !== 'string' || !remote.version.trim()) {
    return {
      updateAvailable: false,
      isDowngrade: false,
      isUpgrade: false,
      isUpToDate: false,
      explanation: 'Remote metadata integrity check failed: missing or invalid version name.',
      details,
    };
  }

  details.metadataIntegrity = true;

  if (!apkUrl) {
    console.warn('[AppUpdater] APK download URL is missing in remote metadata.');
  }

  if (!remote.apkSha256) {
    console.warn('[AppUpdater] SHA-256 checksum is missing in remote metadata. Checksum verification will be skipped.');
  }

  const nameComparison = compareSemver(remote.version, localVersionName);
  let isDowngrade = nameComparison < 0;
  let isUpgrade = nameComparison > 0;
  let isUpToDate = nameComparison === 0;

  if (localVersionCode !== undefined && localVersionCode !== null && remote.versionCode !== undefined && remote.versionCode !== null) {
    if (nameComparison > 0) {
      if (remote.versionCode <= localVersionCode) {
        isUpgrade = false;
        isUpToDate = true;
      }
    } else if (nameComparison < 0) {
      isUpgrade = false;
      isDowngrade = true;
    } else {
      if (remote.versionCode > localVersionCode) {
        isUpgrade = true;
        isDowngrade = false;
        isUpToDate = false;
      } else if (remote.versionCode < localVersionCode) {
        isUpgrade = false;
        isDowngrade = true;
        isUpToDate = false;
      }
    }
  }

  let explanation = '';
  if (isUpgrade) {
    explanation = `Newer version available: remote version ${remote.version} (code ${remote.versionCode || 'none'}) is higher than local version ${localVersionName} (code ${localVersionCode || 'none'}).`;
  } else if (isDowngrade) {
    explanation = `Remote version ${remote.version} (code ${remote.versionCode || 'none'}) is older than local version ${localVersionName} (code ${localVersionCode || 'none'}).`;
  } else {
    explanation = `Current version ${localVersionName} (code ${localVersionCode || 'none'}) is fully up to date with remote version ${remote.version} (code ${remote.versionCode || 'none'}).`;
  }

  return {
    updateAvailable: isUpgrade,
    isDowngrade,
    isUpgrade,
    isUpToDate,
    explanation,
    details,
  };
}
