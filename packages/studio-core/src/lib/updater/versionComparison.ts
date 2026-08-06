import { APP_VERSION, compareSemver, parseSemver } from '../appVersion';
import { RemoteVersionInfo } from './releaseMetadata';
import { Capacitor } from '@capacitor/core';

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
  localVersionCode?: number | null
): VersionComparisonResult {
  const details = {
    localVersionName,
    localVersionCode: localVersionCode ?? null,
    remoteVersionName: remote ? remote.version : null,
    remoteVersionCode: remote && remote.versionCode !== undefined ? remote.versionCode : null,
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
  if (localVersionCode !== undefined && localVersionCode !== null) {
    const rawVersionCode = remote.versionCode;
    const versionCode =
      typeof rawVersionCode === 'number'
        ? rawVersionCode
        : typeof rawVersionCode === 'string'
          ? parseInt(rawVersionCode, 10)
          : undefined;
    isVerCodeValid =
      versionCode !== undefined &&
      typeof versionCode === 'number' &&
      !isNaN(versionCode) &&
      versionCode > 0;
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
  }

  if (!remote.apkSha256) {
  }

  const nameComparison = compareSemver(remote.version, localVersionName);

  let isDowngrade = false;
  let isUpgrade = false;
  let isUpToDate = false;

  // Verify consistency between version code and version name
  let hasInconsistency = false;
  if (
    localVersionCode !== undefined &&
    localVersionCode !== null &&
    remote.versionCode !== undefined &&
    remote.versionCode !== null
  ) {
    if (remote.versionCode > localVersionCode && nameComparison < 0) {
      hasInconsistency = true;
    } else if (remote.versionCode < localVersionCode && nameComparison > 0) {
      hasInconsistency = true;
    } else if (remote.versionCode === localVersionCode && nameComparison !== 0) {
      hasInconsistency = true;
    }
  }

  if (hasInconsistency) {
    details.metadataIntegrity = false;
    return {
      updateAvailable: false,
      isDowngrade: false,
      isUpgrade: false,
      isUpToDate: false,
      explanation: `Inconsistent remote metadata: Remote version is "${remote.version}" (code ${remote.versionCode}) but local version is "${localVersionName}" (code ${localVersionCode}). This represents an inconsistent release configuration.`,
      details,
    };
  }

  if (
    localVersionCode !== undefined &&
    localVersionCode !== null &&
    remote.versionCode !== undefined &&
    remote.versionCode !== null
  ) {
    if (remote.versionCode > localVersionCode) {
      isUpgrade = true;
    } else if (remote.versionCode < localVersionCode) {
      isDowngrade = true;
    } else {
      isUpToDate = true;
    }
  } else if (Capacitor.isNativePlatform() && (localVersionCode === undefined || localVersionCode === null)) {
    // On native, a missing local versionCode means the Capacitor bridge hasn't responded yet.
    // Defer the check rather than falling through to semver which could give false results.
    return {
      updateAvailable: false,
      isDowngrade: false,
      isUpgrade: false,
      isUpToDate: false,
      explanation: 'Native versionCode not yet available from Capacitor bridge. Deferring update check.',
      details,
    };
  } else {
    // Fallback (web only): no versionCode available, use semver comparison
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
