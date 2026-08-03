import { fetchGitHubReleaseInfo } from './github.mjs';
import { fetchFirebaseReleaseMetadata } from './firebase.mjs';
import { discoverApkAsset } from './releaseAssets.mjs';
import { buildDiagnosticReport } from './diagnostics.mjs';

export async function evaluatePreviousReleaseState(options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const execFn = options.execFn || options.execSync;
  const allowMissingApk = options.allowMissingApk ?? (process.env.ALLOW_MISSING_PREV_APK === 'true');
  const resetConfirmed = options.resetConfirmed ?? (process.env.RESET_RELEASE_HISTORY === 'true');

  console.log('Resolving previous release info (GitHub Source of Truth with Firebase cross-check)...');

  // 1. Fetch Firebase metadata
  const fbResult = await fetchFirebaseReleaseMetadata({ fetchFn });

  // CASE D: First Release (Firebase metadata returns 404 or fails)
  if (!fbResult.ok && fbResult.status === 404) {
    const diagnostic = buildDiagnosticReport('CASE_D', {
      firebaseVersion: '(none)',
      rootCause: 'Firebase metadata (app-release.json) returned HTTP 404. Initial/first release.',
    });
    console.log(diagnostic);
    return { case: 'CASE_D', pass: true, diagnostic };
  }

  const prevVersion = fbResult.version;
  if (!prevVersion) {
    return { case: 'CASE_D', pass: true, description: 'No previous version defined in Firebase metadata.' };
  }

  // CASE E: Intentional Version/History Reset
  if (resetConfirmed) {
    const diagnostic = buildDiagnosticReport('CASE_E', {
      firebaseVersion: prevVersion,
      rootCause: 'Explicit confirmation provided (RESET_RELEASE_HISTORY=true). Bypassing previous release comparison by developer directive.',
    });
    console.log(diagnostic);
    return { case: 'CASE_E', pass: true, diagnostic };
  }

  // 2. Query GitHub as Source of Truth
  let ghRelease = await fetchGitHubReleaseInfo(prevVersion, { fetchFn, execFn });
  let prevTag = ghRelease.tag;

  // If Firebase metadata version tag is missing on GitHub, query latest published release as Source of Truth fallback
  if (!ghRelease.exists) {
    try {
      const latestRelease = await fetchGitHubReleaseInfo('latest', { fetchFn, execFn });
      if (latestRelease.exists && latestRelease.data?.tagName) {
        console.warn(`⚠ Firebase version v${prevVersion} not published on GitHub. Falling back to latest published release ${latestRelease.data.tagName}.`);
        ghRelease = latestRelease;
        prevVersion = latestRelease.data.tagName.replace(/^v/, '');
        prevTag = latestRelease.tag;
      }
    } catch (_) {}
  }

  // 3. Discover APK asset dynamically
  const apkDiscovery = await discoverApkAsset(ghRelease, prevVersion, { fetchFn });

  // CASE C: Incomplete Deployment (Firebase points to version X, but GitHub Release is missing)
  if (!ghRelease.exists) {
    const diagnostic = buildDiagnosticReport('CASE_C', {
      firebaseVersion: prevVersion,
      githubTag: `${prevTag} (MISSING)`,
      apkUrl: apkDiscovery.url,
      httpStatus: apkDiscovery.status || 404,
      rootCause: `A prior release pipeline run updated Firebase Hosting metadata to v${prevVersion}, but failed or was interrupted BEFORE creating GitHub Release tag ${prevTag}.`,
      steps: [
        `Publish GitHub Release ${prevTag} with ${apkDiscovery.name}.`,
        'Re-deploy the last known good app-release.json to Firebase Hosting.',
        'One-time emergency bypass: Set ALLOW_MISSING_PREV_APK=true for manual recovery.',
      ],
    });

    console.error(`\x1b[31m${diagnostic}\x1b[0m`);

    if (allowMissingApk) {
      console.warn('⚠ EMERGENCY BYPASS ACTIVE: ALLOW_MISSING_PREV_APK=true. Proceeding despite CASE C inconsistency.');
      return { case: 'CASE_C', pass: true, bypassed: true, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
    }

    return { case: 'CASE_C', pass: false, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
  }

  // CASE B: Interrupted Release (GitHub Release tag exists, but APK asset returns 404)
  if (!apkDiscovery.found) {
    const diagnostic = buildDiagnosticReport('CASE_B', {
      firebaseVersion: prevVersion,
      githubTag: `${prevTag} (EXISTS)`,
      apkUrl: apkDiscovery.url,
      httpStatus: apkDiscovery.status || 404,
      rootCause: `GitHub Release ${prevTag} exists, but binary asset (${apkDiscovery.name}) is missing. Publication was interrupted after tag creation but before asset upload.`,
      steps: [
        `Upload missing binary: 'gh release upload ${prevTag} <path-to-apk>/${apkDiscovery.name} --repo MAGEXE1000/Studio'.`,
        'One-time emergency bypass: Set ALLOW_MISSING_PREV_APK=true for manual recovery.',
      ],
    });

    console.error(`\x1b[31m${diagnostic}\x1b[0m`);

    if (allowMissingApk) {
      console.warn('⚠ EMERGENCY BYPASS ACTIVE: ALLOW_MISSING_PREV_APK=true. Proceeding despite CASE B asset interruption.');
      return { case: 'CASE_B', pass: true, bypassed: true, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
    }

    return { case: 'CASE_B', pass: false, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
  }

  // CASE A: Normal release (GitHub Release tag and APK binary both exist)
  return {
    case: 'CASE_A',
    pass: true,
    prevVersion,
    prevApkUrl: apkDiscovery.url,
    apkName: apkDiscovery.name,
    description: `Normal release. Previous version v${prevVersion} release tag and APK asset (${apkDiscovery.name}) exist on GitHub.`,
  };
}
