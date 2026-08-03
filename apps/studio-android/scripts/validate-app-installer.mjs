import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../../..');

const paths = {
  pluginJava: path.join(
    appRoot,
    'android/app/src/main/java/com/chordex/app/AppInstallerPlugin.java'
  ),
  mainActivityJava: path.join(
    appRoot,
    'android/app/src/main/java/com/chordex/app/MainActivity.java'
  ),
  apkDownloaderTs: path.join(
    appRoot,
    '../../packages/studio-core/src/lib/platform/apkDownloader.ts'
  ),
  apkPath: path.join(appRoot, 'android/app/build/outputs/apk/release/app-release.apk'),
};

export const EXIT_CODES = {
  SUCCESS: 0,
  APP_INSTALLER_VALIDATION: 10,
  PATH_TEMP_FILE: 11,
  PREV_APK_DOWNLOAD: 12,
  RELEASE_VALIDATION: 13,
};

// Helper to assert condition and fail
export function assert(condition, message, exitCode = EXIT_CODES.APP_INSTALLER_VALIDATION) {
  if (!condition) {
    console.error(`\x1b[31mVALIDATION FAILED: ${message}\x1b[0m`);
    process.exit(exitCode);
  }
}

// Android Tools signature & debuggable validation helper
export function getAndroidTool(toolName) {
  try {
    execSync(`${toolName} --version`, { stdio: 'ignore' });
    return toolName;
  } catch (e) {}

  let sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  if (!sdkPath && process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    if (localAppData) {
      const standardPath = path.join(localAppData, 'Android/Sdk');
      if (fs.existsSync(standardPath)) {
        sdkPath = standardPath;
      }
    }
  }

  if (sdkPath) {
    const buildToolsDir = path.join(sdkPath, 'build-tools');
    if (fs.existsSync(buildToolsDir)) {
      const versions = fs.readdirSync(buildToolsDir).sort().reverse();
      for (const ver of versions) {
        const fullPath = path.join(
          buildToolsDir,
          ver,
          toolName + (process.platform === 'win32' ? '.bat' : '')
        );
        const fullPathExe = path.join(
          buildToolsDir,
          ver,
          toolName + (process.platform === 'win32' ? '.exe' : '')
        );
        if (fs.existsSync(fullPath)) return `"${fullPath}"`;
        if (fs.existsSync(fullPathExe)) return `"${fullPathExe}"`;
      }
    }
  }
  return toolName;
}

// Structurally evaluate previous release status (Cases A, B, C, D, E)
export async function evaluatePreviousReleaseState(options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const execFn = options.execFn || execSync;
  const allowMissingApk = options.allowMissingApk ?? (process.env.ALLOW_MISSING_PREV_APK === 'true');
  const resetConfirmed = options.resetConfirmed ?? (process.env.RESET_RELEASE_HISTORY === 'true');

  console.log('Resolving previous release info from Firebase metadata...');

  let versionRes;
  try {
    versionRes = await fetchFn('https://studio-30f44.web.app/app-release.json', {
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    console.warn(`⚠ Could not fetch app-release.json from Firebase: ${err.message}`);
    return {
      case: 'CASE_D',
      pass: true,
      description: 'CASE D: Unable to reach Firebase metadata. Safely treating as first release.',
    };
  }

  // CASE D: First release (app-release.json 404 or missing)
  if (versionRes.status === 404) {
    const diagnostic = [
      '====================================================================',
      'CASE D: FIRST VALID RELEASE DETECTED',
      '====================================================================',
      'Firebase metadata (app-release.json) returned HTTP 404.',
      'Current release is the initial/first release. Safely skipping previous APK comparison.',
      '====================================================================',
    ].join('\n');
    console.log(diagnostic);
    return { case: 'CASE_D', pass: true, diagnostic };
  }

  if (!versionRes.ok) {
    console.warn(`⚠ Firebase metadata returned HTTP Status ${versionRes.status}. Skipping previous APK comparison.`);
    return { case: 'CASE_D', pass: true, description: `HTTP ${versionRes.status} on app-release.json` };
  }

  const versionData = await versionRes.json();
  const prevVersion = versionData.version;
  console.log(`Firebase deployed version: ${prevVersion || '(none)'}`);

  if (!prevVersion) {
    return { case: 'CASE_D', pass: true, description: 'No previous version defined in Firebase metadata.' };
  }

  // CASE E: Intentional Version/History Reset
  if (resetConfirmed) {
    const diagnostic = [
      '====================================================================',
      'CASE E: INTENTIONAL REPOSITORY HISTORY RESET CONFIRMED',
      '====================================================================',
      `Explicit confirmation provided (RESET_RELEASE_HISTORY=true).`,
      `Bypassing previous version v${prevVersion} comparison by developer directive.`,
      '====================================================================',
    ].join('\n');
    console.log(diagnostic);
    return { case: 'CASE_E', pass: true, diagnostic };
  }

  const prevTag = `v${prevVersion}`;
  const prevApkName = `studio-${prevVersion}.apk`;
  const prevApkUrl = `https://github.com/MAGEXE1000/Studio/releases/download/${prevTag}/${prevApkName}`;

  // Check if GitHub Release tag exists
  let ghReleaseExists = false;
  try {
    const ghCheck = execFn(`gh release view ${prevTag} --repo MAGEXE1000/Studio`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    if (ghCheck && ghCheck.includes(prevTag)) {
      ghReleaseExists = true;
    }
  } catch (_) {
    try {
      const tagHead = await fetchFn(`https://github.com/MAGEXE1000/Studio/releases/tag/${prevTag}`, { method: 'HEAD' });
      if (tagHead.ok || tagHead.status === 302 || tagHead.status === 301) {
        ghReleaseExists = true;
      }
    } catch (_) {}
  }

  // Check if APK asset exists
  let apkAssetStatus = 0;
  try {
    const apkHead = await fetchFn(prevApkUrl, { method: 'HEAD' });
    apkAssetStatus = apkHead.status;
  } catch (_) {}

  // CASE C: Incomplete Deployment (Firebase metadata updated, but GitHub Release missing)
  if (!ghReleaseExists) {
    const diagnostic = [
      '====================================================================',
      'CRITICAL REPOSITORY INCONSISTENCY DETECTED (CASE C: INCOMPLETE DEPLOYMENT)',
      '====================================================================',
      `Firebase Deployed Version: ${prevVersion}`,
      `GitHub Release Tag:        ${prevTag} (MISSING / NOT FOUND)`,
      `Target Previous APK URL:   ${prevApkUrl}`,
      `Asset HTTP Status:         ${apkAssetStatus || 404}`,
      '',
      'ROOT CAUSE:',
      `A prior release pipeline run updated Firebase Hosting metadata to v${prevVersion},`,
      `but failed or was interrupted BEFORE creating the GitHub Release tag ${prevTag}.`,
      '',
      'ACTIONABLE RECOVERY STEPS:',
      `1. Create missing release: Publish GitHub Release ${prevTag} with ${prevApkName}.`,
      '2. Roll back metadata: Re-deploy the last known good app-release.json to Firebase.',
      '3. Emergency bypass (one-time): Set ALLOW_MISSING_PREV_APK=true for explicit manual recovery.',
      '====================================================================',
    ].join('\n');

    console.error(`\x1b[31m${diagnostic}\x1b[0m`);

    if (allowMissingApk) {
      console.warn('⚠ EMERGENCY BYPASS ACTIVE: ALLOW_MISSING_PREV_APK=true. Proceeding despite CASE C inconsistency.');
      return { case: 'CASE_C', pass: true, bypassed: true, prevVersion, prevApkUrl, diagnostic };
    }

    return { case: 'CASE_C', pass: false, prevVersion, prevApkUrl, diagnostic };
  }

  // CASE B: Interrupted Release (GitHub Release tag exists, but APK asset returns 404)
  if (apkAssetStatus === 404) {
    const diagnostic = [
      '====================================================================',
      'INTERRUPTED RELEASE DETECTED (CASE B: MISSING RELEASE ASSET)',
      '====================================================================',
      `Firebase Deployed Version: ${prevVersion}`,
      `GitHub Release Tag:        ${prevTag} (EXISTS)`,
      `Target Previous APK URL:   ${prevApkUrl}`,
      `Asset HTTP Status:         404 Not Found`,
      '',
      'ROOT CAUSE:',
      `GitHub Release ${prevTag} exists, but the binary asset (${prevApkName}) is missing.`,
      'The publication stage was interrupted after release creation but before asset upload.',
      '',
      'ACTIONABLE RECOVERY STEPS:',
      `1. Upload missing binary: Run 'gh release upload ${prevTag} <path-to-apk>/${prevApkName} --repo MAGEXE1000/Studio'.`,
      '2. Emergency bypass (one-time): Set ALLOW_MISSING_PREV_APK=true for explicit manual recovery.',
      '====================================================================',
    ].join('\n');

    console.error(`\x1b[31m${diagnostic}\x1b[0m`);

    if (allowMissingApk) {
      console.warn('⚠ EMERGENCY BYPASS ACTIVE: ALLOW_MISSING_PREV_APK=true. Proceeding despite CASE B asset interruption.');
      return { case: 'CASE_B', pass: true, bypassed: true, prevVersion, prevApkUrl, diagnostic };
    }

    return { case: 'CASE_B', pass: false, prevVersion, prevApkUrl, diagnostic };
  }

  // CASE A: Normal release (GitHub Release and APK binary both exist)
  return {
    case: 'CASE_A',
    pass: true,
    prevVersion,
    prevApkUrl,
    description: `Normal release. Previous version v${prevVersion} release tag and APK asset exist.`,
  };
}

function getChangedFilesSafely() {
  const commands = [
    'git diff --name-only HEAD^ HEAD',
    'git diff --name-only HEAD~1 HEAD',
    'git show --name-only --format="" HEAD',
    'git diff --name-only origin/main...HEAD',
  ];
  for (const cmd of commands) {
    try {
      const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const files = output.split('\n').map((f) => f.trim()).filter(Boolean);
      if (files.length > 0) return files;
    } catch (_) {}
  }
  return [];
}

export async function runValidation() {
  console.log('=== RUNNING APPINSTALLER CONTRACT VALIDATION ===');

  const releaseType = process.env.RELEASE_TYPE || 'both';
  const isDevPreview =
    process.argv.includes('--development-preview') &&
    process.env.STUDIO_PRODUCTION_RELEASE !== 'true';

  if (!isDevPreview) {
    try {
      console.log(`Checking for native or update-system changes (releaseType: ${releaseType})...`);
      const changedFiles = getChangedFilesSafely();

      const nativeFiles = changedFiles.filter(
        (f) =>
          f.startsWith('apps/studio-android/android/') ||
          f === 'packages/studio-core/src/lib/apkDownloader.ts' ||
          f === 'packages/studio-core/src/lib/platform/apkDownloader.ts' ||
          f === 'packages/studio-core/src/lib/capgoUpdater.ts' ||
          f === 'packages/studio-core/src/lib/platform/capgoUpdater.ts' ||
          f === 'packages/studio-core/src/lib/otaUpdate.ts' ||
          f === 'packages/studio-core/src/lib/updater/useOtaUpdate.ts' ||
          f === 'apps/studio-android/scripts/validate-app-installer.mjs' ||
          f === 'apps/studio-android/scripts/generate-release-metadata.mjs'
      );
      if (nativeFiles.length > 0) {
        assert(
          releaseType !== 'ota',
          `Native or update-system files changed but releaseType is '${releaseType}'! The release type must be 'apk' or 'both' to upgrade native wrappers. Changed files:\n${nativeFiles.join('\n')}`,
          EXIT_CODES.RELEASE_VALIDATION
        );
        console.log('✓ Release type is correctly set for native / update-system changes.');
      } else {
        console.log('✓ No native or update-system changes detected.');
      }
    } catch (err) {
      console.warn(
        'validate-app-installer: Warning: Could not verify changed files using git:',
        err.message
      );
    }
  }

  // 1. Verify AppInstallerPlugin.java exists and is valid
  console.log(`Checking ${path.relative(appRoot, paths.pluginJava)}...`);
  assert(fs.existsSync(paths.pluginJava), 'AppInstallerPlugin.java does not exist!');

  const pluginContent = fs.readFileSync(paths.pluginJava, 'utf8');
  assert(
    /@CapacitorPlugin\s*\(\s*name\s*=\s*["']AppInstaller["']/i.test(pluginContent),
    'AppInstallerPlugin.java is missing @CapacitorPlugin(name = "AppInstaller") annotation!'
  );

  const requiredMethods = [
    'downloadApk',
    'verifyApkSha256',
    'installApk',
    'openInstallPermissionSettings',
    'inspectApk',
    'getInstalledAppInfo',
  ];

  for (const method of requiredMethods) {
    const methodRegex = new RegExp(`@PluginMethod\\s+public\\s+void\\s+${method}\\b`);
    assert(
      methodRegex.test(pluginContent),
      `AppInstallerPlugin.java is missing the required @PluginMethod: public void ${method}`
    );
  }
  console.log('✓ AppInstallerPlugin.java structure and methods are correct.');

  // 2. Verify MainActivity.java manual registration
  console.log(`Checking ${path.relative(appRoot, paths.mainActivityJava)}...`);
  assert(fs.existsSync(paths.mainActivityJava), 'MainActivity.java does not exist!');

  const mainActivityContent = fs.readFileSync(paths.mainActivityJava, 'utf8');
  assert(
    /registerPlugin\s*\(\s*AppInstallerPlugin\.class\s*\)/.test(mainActivityContent),
    'MainActivity.java is missing registerPlugin(AppInstallerPlugin.class) call!'
  );
  console.log('✓ MainActivity.java manual plugin registration is correct.');

  // 3. Verify apkDownloader.ts registration
  console.log(`Checking ${path.relative(appRoot, paths.apkDownloaderTs)}...`);
  assert(fs.existsSync(paths.apkDownloaderTs), 'apkDownloader.ts does not exist!');

  const apkDownloaderContent = fs.readFileSync(paths.apkDownloaderTs, 'utf8');
  assert(
    /registerPlugin\s*<\s*AppInstallerPlugin\s*>\s*\(\s*['"]AppInstaller['"]\s*\)/.test(
      apkDownloaderContent
    ),
    "apkDownloader.ts is missing registerPlugin<AppInstallerPlugin>('AppInstaller')!"
  );
  console.log('✓ apkDownloader.ts TypeScript registration is correct.');

  // 4. Verify APK packaging integrity
  console.log(`Checking APK packaging at ${path.relative(appRoot, paths.apkPath)}...`);
  const allowMissingApk = process.argv.includes('--allow-missing-apk');

  if (!fs.existsSync(paths.apkPath)) {
    if (allowMissingApk) {
      console.log(
        '⚠ APK file does not exist, but --allow-missing-apk was passed. Skipping APK scan.'
      );
    } else {
      assert(
        false,
        `APK file not found at ${paths.apkPath}. Build APK first or pass --allow-missing-apk.`
      );
    }
  } else {
    try {
      const zip = new AdmZip(paths.apkPath);
      const zipEntries = zip.getEntries();

      const dexEntries = zipEntries.filter(
        (entry) => entry.entryName.startsWith('classes') && entry.entryName.endsWith('.dex')
      );
      assert(dexEntries.length > 0, 'No .dex files found inside the APK!');

      let foundClass = false;
      for (const entry of dexEntries) {
        console.log(`Scanning DEX file: ${entry.entryName}...`);
        const buffer = entry.getData();

        if (
          buffer.includes('AppInstallerPlugin') ||
          buffer.includes('Lcom/chordex/app/AppInstallerPlugin;')
        ) {
          foundClass = true;
          console.log(`✓ Found AppInstallerPlugin in ${entry.entryName}`);
          break;
        }
      }

      assert(
        foundClass,
        'AppInstallerPlugin class reference NOT found in any classes.dex! The APK build is broken.'
      );
      console.log('✓ APK contains the packaged AppInstallerPlugin class.');
    } catch (err) {
      assert(false, `Error occurred while unzipping/reading classes.dex from APK: ${err.message}`);
    }
  }

  // Execute evaluation if APK exists
  let prevVersionCode = 0;
  let prevPackageName = '';
  let prevSignature = '';
  if (fs.existsSync(paths.apkPath)) {
    const evalResult = await evaluatePreviousReleaseState();
    if (!evalResult.pass) {
      assert(
        false,
        `Previous APK validation failed (${evalResult.case}). See diagnostic report above.`,
        EXIT_CODES.RELEASE_VALIDATION
      );
    }

    if (evalResult.case === 'CASE_A' && evalResult.prevApkUrl) {
      const prevApkUrl = evalResult.prevApkUrl;
      const tempDir = path.join(appRoot, '.release-temp');
      const tempApkPath = path.join(tempDir, 'studio-temp-prev.apk');

      const cleanupTemp = () => {
        try {
          if (fs.existsSync(tempApkPath)) {
            fs.unlinkSync(tempApkPath);
            console.log('✓ Cleaned up temporary APK comparison files.');
          }
        } catch (_) {}
      };

      console.log(`Ensuring temp directory exists: ${tempDir}`);
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (err) {
        console.error(
          `\x1b[31mERROR: Failed to create temp directory ${tempDir}: ${err.message}\x1b[0m`
        );
        process.exit(EXIT_CODES.PATH_TEMP_FILE);
      }

      console.log(`Downloading previous APK to compare: ${prevApkUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const downloadRes = await fetch(prevApkUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!downloadRes.ok) {
          console.error(
            `\x1b[31mERROR: Failed to download previous APK (HTTP Status ${downloadRes.status}).\x1b[0m`
          );
          process.exit(EXIT_CODES.PREV_APK_DOWNLOAD);
        }

        const reader = downloadRes.body.getReader();
        const fileStream = fs.createWriteStream(tempApkPath);
        fileStream.on('error', (err) => {
          console.error(`\x1b[31mWriteStream error on ${tempApkPath}: ${err.message}\x1b[0m`);
          cleanupTemp();
          process.exit(EXIT_CODES.PATH_TEMP_FILE);
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fileStream.write(Buffer.from(value));
        }
        fileStream.end();
        await new Promise((resolve, reject) => {
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });
        console.log(`✓ Previous APK downloaded to ${tempApkPath}`);

        const aapt2 = getAndroidTool('aapt2');
        const apksigner = getAndroidTool('apksigner');

        const prevManifestXml = execSync(
          `${aapt2} dump xmltree --file AndroidManifest.xml "${tempApkPath}"`,
          { encoding: 'utf8' }
        );
        const prevPackageMatch = prevManifestXml.match(/package="([^"]+)"/);
        prevPackageName = prevPackageMatch ? prevPackageMatch[1] : '';

        const prevCodeMatch = prevManifestXml.match(
          /versionCode\([^)]+\)=(\d+|0x[0-9a-f]+)/i
        );
        prevVersionCode = prevCodeMatch
          ? prevCodeMatch[1].startsWith('0x')
            ? parseInt(prevCodeMatch[1], 16)
            : parseInt(prevCodeMatch[1], 10)
          : 0;

        const prevSignInfo = execSync(`${apksigner} verify --print-certs "${tempApkPath}"`, {
          encoding: 'utf8',
        });
        const prevSha256Match = prevSignInfo.match(
          /certificate SHA-256 digest:\s+([a-fA-F0-9:]+)/i
        );
        prevSignature = prevSha256Match
          ? prevSha256Match[1].replace(/:/g, '').toLowerCase()
          : '';

        console.log(
          `Previous APK Details: package=${prevPackageName}, versionCode=${prevVersionCode}, signature=${prevSignature}`
        );
        cleanupTemp();
      } catch (err) {
        clearTimeout(timeoutId);
        cleanupTemp();
        if (err.name === 'AbortError') {
          console.error(
            `\x1b[31mERROR: Download of previous APK timed out after 60 seconds.\x1b[0m`
          );
        } else {
          console.error(
            `\x1b[31mERROR: Failed during previous APK fetch: ${err.message}\x1b[0m`
          );
        }
        process.exit(EXIT_CODES.PREV_APK_DOWNLOAD);
      }
    }
  }

  if (fs.existsSync(paths.apkPath)) {
    const appVersionPath = path.join(
      repoRoot,
      'packages/studio-core/src/lib/startup/appVersion.ts'
    );
    const appVersionSrc = fs.readFileSync(appVersionPath, 'utf8');

    // A. Verify non-debuggable and package manifest attributes
    try {
      const aapt2 = getAndroidTool('aapt2');
      console.log(`Verifying release APK manifest via ${aapt2}...`);
      const manifestXml = execSync(
        `${aapt2} dump xmltree --file AndroidManifest.xml "${paths.apkPath}"`,
        { encoding: 'utf8' }
      );

      // 1. Debuggable check
      if (
        manifestXml.includes('http://schemas.android.com/apk/res/android:debuggable') &&
        manifestXml.includes('true')
      ) {
        assert(
          false,
          'The release APK is compiled as debuggable (android:debuggable="true")!',
          EXIT_CODES.RELEASE_VALIDATION
        );
      }
      console.log('✓ APK is confirmed to be non-debuggable.');

      // 2. Package name check
      const packageMatch = manifestXml.match(/package="([^"]+)"/);
      assert(
        packageMatch && packageMatch[1] === 'com.chordex.app',
        `Package name mismatch! Expected com.chordex.app but found: ${packageMatch ? packageMatch[1] : 'null'}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
      if (prevPackageName) {
        assert(
          packageMatch[1] === prevPackageName,
          `Package name changed! Previous: ${prevPackageName}, Current: ${packageMatch[1]}`,
          EXIT_CODES.RELEASE_VALIDATION
        );
      }
      console.log('✓ APK package name is com.chordex.app.');

      // 3. VersionCode check
      const codeMatch = manifestXml.match(/versionCode\([^)]+\)=(\d+|0x[0-9a-f]+)/i);
      assert(
        codeMatch,
        'Could not parse versionCode from APK manifest!',
        EXIT_CODES.RELEASE_VALIDATION
      );
      const versionCodeVal = codeMatch[1].startsWith('0x')
        ? parseInt(codeMatch[1], 16)
        : parseInt(codeMatch[1], 10);
      assert(
        versionCodeVal > 0,
        `Invalid versionCode parsed: ${versionCodeVal}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
      if (prevVersionCode) {
        if (versionCodeVal <= prevVersionCode) {
          if (isDevPreview) {
            console.warn(
              `⚠ Development warning: versionCode (${versionCodeVal}) is not greater than previous (${prevVersionCode}). Proceeding since --development-preview is enabled.`
            );
          } else {
            assert(
              false,
              `Release blocked: versionCode must increase! Installed/Previous: ${prevVersionCode}, Current: ${versionCodeVal}. Please increment versionCode in build.gradle.`,
              EXIT_CODES.RELEASE_VALIDATION
            );
          }
        }
      }
      console.log(`✓ APK versionCode is ${versionCodeVal}.`);

      // 4. VersionName check
      const nameMatch = manifestXml.match(/versionName\([^)]+\)="([^"]+)"/i);
      assert(
        nameMatch,
        'Could not parse versionName from APK manifest!',
        EXIT_CODES.RELEASE_VALIDATION
      );
      const versionNameVal = nameMatch[1];

      const nativeVersionMatches = [
        ...appVersionSrc.matchAll(/export\s+const\s+NATIVE_VERSION\s*=\s*['"]([^'"]+)['"]/g),
      ];
      if (nativeVersionMatches.length !== 1) {
        assert(
          false,
          'Unable to resolve NATIVE_VERSION from appVersion.ts',
          EXIT_CODES.RELEASE_VALIDATION
        );
      }
      const expectedVersionName = nativeVersionMatches[0][1];

      if (versionNameVal !== expectedVersionName) {
        if (isDevPreview) {
          console.warn(
            `⚠ Development warning: VersionName mismatch! Expected ${expectedVersionName} but found: ${versionNameVal}. Proceeding since --development-preview is enabled.`
          );
        } else {
          assert(
            false,
            `VersionName mismatch! Expected ${expectedVersionName} but found: ${versionNameVal}`,
            EXIT_CODES.RELEASE_VALIDATION
          );
        }
      }
      console.log(
        `✓ APK versionName is ${versionNameVal} (matches expected ${expectedVersionName}).`
      );

      // 5. Verify inner web assets version matches
      const zip = new AdmZip(paths.apkPath);
      const versionEntry = zip.getEntry('assets/public/version.json');
      assert(
        versionEntry,
        'Web assets not bundled correctly: assets/public/version.json is missing in the APK!',
        EXIT_CODES.RELEASE_VALIDATION
      );

      let innerVersionJson;
      try {
        innerVersionJson = JSON.parse(versionEntry.getData().toString('utf8'));
      } catch (e) {
        assert(
          false,
          `Failed to parse assets/public/version.json inside APK: ${e.message}`,
          EXIT_CODES.RELEASE_VALIDATION
        );
      }

      assert(
        innerVersionJson && innerVersionJson.version === expectedVersionName,
        `Web assets version mismatch! Expected version ${expectedVersionName} inside version.json, but found ${innerVersionJson ? innerVersionJson.version : 'null'}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
      assert(
        innerVersionJson && innerVersionJson.versionCode === versionCodeVal,
        `Web assets versionCode mismatch! Expected versionCode ${versionCodeVal} inside version.json, but found ${innerVersionJson ? innerVersionJson.versionCode : 'null'}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
      console.log(
        `✓ APK web assets version is ${innerVersionJson.version} (versionCode ${innerVersionJson.versionCode}) matches wrapper version.`
      );
    } catch (err) {
      assert(
        false,
        `Failed to verify manifest configuration: ${err.message}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
    }

    // B. Verify signature status
    try {
      const apksigner = getAndroidTool('apksigner');
      console.log(`Verifying release APK signature status via ${apksigner}...`);
      const signInfoVerbose = execSync(
        `${apksigner} verify --verbose --print-certs "${paths.apkPath}"`,
        { encoding: 'utf8' }
      );
      if (!signInfoVerbose.includes('SHA-256 digest')) {
        assert(false, 'The release APK is not signed!', EXIT_CODES.RELEASE_VALIDATION);
      }
      console.log('✓ APK is successfully signed.');

      const v2Scheme = /Verified using v2 scheme.*:\s*true/i.test(signInfoVerbose);
      const v3Scheme = /Verified using v3 scheme.*:\s*true/i.test(signInfoVerbose);
      assert(
        v2Scheme || v3Scheme,
        'APK is not signed with a modern signature scheme (V2 or V3 must be true)!',
        EXIT_CODES.RELEASE_VALIDATION
      );
      console.log('✓ APK signature scheme (V2/V3) verified successfully.');

      const sha256Match = signInfoVerbose.match(
        /certificate SHA-256 digest:\s+([a-fA-F0-9:]+)/i
      );
      const currentSignature = sha256Match ? sha256Match[1].replace(/:/g, '').toLowerCase() : '';

      const HARDCODED_PROD_FINGERPRINT =
        '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
      assert(
        currentSignature === HARDCODED_PROD_FINGERPRINT,
        `CRITICAL SECURITY FAILURE: APK signature fingerprint mismatch! Expected official production signature ${HARDCODED_PROD_FINGERPRINT}, found ${currentSignature}`,
        EXIT_CODES.RELEASE_VALIDATION
      );
      console.log('✓ APK signing certificate validation check passed.');

      try {
        console.log('Verifying certificate Owner, Issuer, and Validity via keytool...');
        const keytoolOut = execSync(`keytool -printcert -jarfile "${paths.apkPath}"`, {
          encoding: 'utf8',
        });

        const ownerMatch = keytoolOut.match(/Owner:\s*(.*)/i);
        const issuerMatch = keytoolOut.match(/Issuer:\s*(.*)/i);
        const validMatch = keytoolOut.match(/Valid from:\s*(.*?)\s+until:\s*(.*)/i);

        assert(
          ownerMatch,
          'Could not parse certificate Owner (Subject) from keytool!',
          EXIT_CODES.RELEASE_VALIDATION
        );
        assert(
          issuerMatch,
          'Could not parse certificate Issuer from keytool!',
          EXIT_CODES.RELEASE_VALIDATION
        );
        assert(
          validMatch,
          'Could not parse certificate Validity range from keytool!',
          EXIT_CODES.RELEASE_VALIDATION
        );

        const owner = ownerMatch[1].trim();
        const issuer = issuerMatch[1].trim();
        const validFromStr = validMatch[1].trim();
        const validUntilStr = validMatch[2].trim();

        console.log(`Certificate Owner:  ${owner}`);
        console.log(`Certificate Issuer: ${issuer}`);
        console.log(`Validity Window:    ${validFromStr} to ${validUntilStr}`);

        assert(owner.length > 0, 'Certificate Owner cannot be empty', EXIT_CODES.RELEASE_VALIDATION);
        assert(
          issuer.length > 0,
          'Certificate Issuer cannot be empty',
          EXIT_CODES.RELEASE_VALIDATION
        );

        const validFrom = new Date(validFromStr);
        const validUntil = new Date(validUntilStr);
        const now = new Date();

        assert(
          now >= validFrom && now <= validUntil,
          `Certificate is outside its validity range! Valid from: ${validFromStr} until: ${validUntilStr}`,
          EXIT_CODES.RELEASE_VALIDATION
        );
        console.log('✓ Certificate Validity check passed.');
      } catch (err) {
        assert(
          false,
          `Failed to verify certificate fields using keytool: ${err.message}`,
          EXIT_CODES.RELEASE_VALIDATION
        );
      }

      const appReleasePath = path.join(repoRoot, 'firebase-public/app-release.json');
      if (fs.existsSync(appReleasePath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(appReleasePath, 'utf8'));

          if (metadata.version === expectedVersionName) {
            console.log('Verifying local app-release.json matches the APK SHA-256...');

            const crypto = await import('node:crypto');
            const fileBuffer = fs.readFileSync(paths.apkPath);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const localApkSha = hashSum.digest('hex');

            if (metadata.sha256 && metadata.sha256 !== localApkSha) {
              assert(
                false,
                `Local metadata SHA-256 (${metadata.sha256}) does not match APK SHA-256 (${localApkSha})!`,
                EXIT_CODES.RELEASE_VALIDATION
              );
            }
            console.log('✓ Local app-release.json SHA-256 matches APK hash.');
          } else {
            console.log(
              `Skipping local app-release.json SHA check because metadata version (${metadata.version}) differs from APK version (${expectedVersionName}). It will be updated later in the pipeline.`
            );
          }
        } catch (e) {
          console.warn(`⚠ Could not verify app-release.json match: ${e.message}`);
        }
      }
      console.log('\x1b[32m=== APPINSTALLER CONTRACT VALIDATION PASSED ===\x1b[0m');
    } catch (err) {
      assert(false, `Failed to verify APK signature: ${err.message}`, EXIT_CODES.RELEASE_VALIDATION);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runValidation().catch((err) => {
    console.error('validate-app-installer: Unhandled error:', err);
    process.exit(1);
  });
}
