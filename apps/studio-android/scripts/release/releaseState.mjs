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

  let prevVersion = fbResult.version;
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

  // 2. Query GitHub Source of Truth
  let ghRelease = await fetchGitHubReleaseInfo(prevVersion, { fetchFn, execFn });
  const latestRelease = await fetchGitHubReleaseInfo('latest', { fetchFn, execFn });
  const latestGithubVer = latestRelease.exists ? latestRelease.data?.tagName?.replace(/^v/, '') : null;

  // 3. CASE C: Incomplete Deployment (Firebase points to version X, but GitHub Release is missing)
  if (!ghRelease.exists) {
    const lastKnownGood = latestGithubVer || '(none)';
    const apkDiscovery = await discoverApkAsset(latestRelease, lastKnownGood, { fetchFn });

    const diagnostic = buildDiagnosticReport('CASE_C', {
      firebaseVersion: prevVersion,
      latestGithubRelease: lastKnownGood,
      lastKnownGoodRelease: lastKnownGood,
      brokenRelease: prevVersion,
      githubTag: `v${prevVersion} (MISSING)`,
      apkUrl: apkDiscovery.url,
      httpStatus: 404,
      rootCause: `Firebase metadata (${prevVersion}) was published before GitHub Release creation.`,
      optionA: `Republish GitHub Release v${prevVersion} with studio-${prevVersion}.apk.`,
      optionB: `Rollback Firebase metadata to ${lastKnownGood}.`,
      steps: [
        `Publish GitHub Release v${prevVersion} with studio-${prevVersion}.apk.`,
        `Rollback Firebase app-release.json to ${lastKnownGood}.`,
        'Automatic recovery: system falls back to latest published GitHub release for previous APK baseline.',
      ],
    });

    console.warn(`\x1b[33m${diagnostic}\x1b[0m`);

    // Automatic Interrupted Release Recovery:
    // Fallback to last known good published GitHub release tag for previous APK comparison
    if (latestRelease.exists && apkDiscovery.found) {
      console.log(`\x1b[32m✓ AUTOMATIC RECOVERY ACTIVE: Using last known good published release v${lastKnownGood} for APK baseline.\x1b[0m`);
      return {
        case: 'CASE_A',
        pass: true,
        recovered: true,
        prevVersion: lastKnownGood,
        prevApkUrl: apkDiscovery.url,
        apkName: apkDiscovery.name,
        diagnostic,
      };
    }

    if (allowMissingApk) {
      console.warn('⚠ EMERGENCY BYPASS ACTIVE: ALLOW_MISSING_PREV_APK=true. Proceeding despite CASE C inconsistency.');
      return { case: 'CASE_C', pass: true, bypassed: true, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
    }

    return { case: 'CASE_C', pass: false, prevVersion, prevApkUrl: apkDiscovery.url, diagnostic };
  }

  // 4. Discover APK asset dynamically
  const apkDiscovery = await discoverApkAsset(ghRelease, prevVersion, { fetchFn });

  // CASE B: Interrupted Release (GitHub Release tag exists, but APK asset returns 404)
  if (!apkDiscovery.found) {
    const lastKnownGood = latestGithubVer || '(none)';

    const diagnostic = buildDiagnosticReport('CASE_B', {
      firebaseVersion: prevVersion,
      latestGithubRelease: lastKnownGood,
      lastKnownGoodRelease: lastKnownGood,
      brokenRelease: prevVersion,
      githubTag: `v${prevVersion} (EXISTS)`,
      apkUrl: apkDiscovery.url,
      httpStatus: apkDiscovery.status || 404,
      rootCause: `GitHub Release v${prevVersion} exists, but binary asset (${apkDiscovery.name}) is missing. Publication was interrupted after tag creation but before asset upload.`,
      optionA: `Upload missing binary: 'gh release upload v${prevVersion} <path-to-apk>/${apkDiscovery.name} --repo MAGEXE1000/Studio'.`,
      optionB: `Rollback Firebase metadata to ${lastKnownGood}.`,
      steps: [
        `Upload missing binary: 'gh release upload v${prevVersion} <path-to-apk>/${apkDiscovery.name} --repo MAGEXE1000/Studio'.`,
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
