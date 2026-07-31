import { APP_VERSION, compareSemver, parseSemver } from '../appVersion';
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
  
  const parsedRemoteSemver = remote.version ? parseSemver(remote.version) : null;
  const isVerNameValid = !!parsedRemoteSemver && remote.version !== 'V' && remote.version !== 'v';
  
  let isVerCodeValid = true;
  if (localVersionCode !== undefined && localVersionCode !== null && remote.versionCode !== undefined && remote.versionCode !== null) {
    const rawVersionCode = remote.versionCode;
    const versionCode = typeof rawVersionCode === 'number' ? rawVersionCode : (typeof rawVersionCode === 'string' ? parseInt(rawVersionCode, 10) : undefined);
    isVerCodeValid = (versionCode !== undefined && typeof versionCode === 'number' && !isNaN(versionCode) && versionCode > 0);
  }

  if (!isVerNameValid || !isVerCodeValid) {
    return {
      updateAvailable: false,
      isDowngrade: false,
      isUpgrade: false,
      isUpToDate: false,
      explanation: `Remote metadata validation failed: version "${remote.version}" (semver: ${isVerNameValid ? 'VALID' : 'INVALID'}) and/or versionCode "${remote.versionCode}" (code: ${isVerCodeValid ? 'VALID' : 'INVALID'}) are invalid.`,
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

  let isDowngrade = false;
  let isUpgrade = false;
  let isUpToDate = false;

  // versionCode is the primary determinant of update availability.
  // versionName (semver) is used only as a fallback when versionCode
  // is not available on both sides, and as a display hint.
  if (localVersionCode !== undefined && localVersionCode !== null && remote.versionCode !== undefined && remote.versionCode !== null) {
    // Both versionCodes available: use versionCode as the single source of truth
    if (remote.versionCode > localVersionCode) {
      isUpgrade = true;
    } else if (remote.versionCode < localVersionCode) {
      isDowngrade = true;
    } else {
      isUpToDate = true;
    }
  } else {
    // Fallback: no versionCode available, use semver comparison
    isDowngrade = nameComparison < 0;
    isUpgrade = nameComparison > 0;
    isUpToDate = nameComparison === 0;
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
