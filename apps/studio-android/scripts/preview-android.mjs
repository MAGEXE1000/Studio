import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_DIR, '../..');
const ANDROID_DIR = path.resolve(APP_DIR, 'android');
const APK_SOURCE = path.resolve(ANDROID_DIR, 'app/build/outputs/apk/debug/app-debug.apk');
const PREVIEW_DEST_APP = path.resolve(APP_DIR, 'dist/android-preview.apk');
const PREVIEW_DEST_ROOT = path.resolve(REPO_ROOT, 'dist/android-preview.apk');

console.log('=================================================================');
console.log('  STARTING ANDROID PREVIEW WORKFLOW (CAPACITOR + GRADLE DEBUG)   ');
console.log('=================================================================');

// 1. Environmental Safety Checks
if (process.env.STUDIO_PRODUCTION_RELEASE === 'true') {
  console.error('ERROR: STUDIO_PRODUCTION_RELEASE is set! Preview script must not run in production mode.');
  process.exit(1);
}

// Ensure dist directories exist
fs.mkdirSync(path.resolve(APP_DIR, 'dist'), { recursive: true });
fs.mkdirSync(path.resolve(REPO_ROOT, 'dist'), { recursive: true });

// Helper to run commands with output
function run(cmd, cwd = REPO_ROOT, env = process.env) {
  console.log(`\n> ${cmd} (cwd: ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', env });
}

// Setup Java 21 environment and Android SDK platform-tools (ADB) on Windows/Linux/macOS
let customEnv = { ...process.env };
if (process.platform === 'win32') {
  const java21Path = 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot';
  if (fs.existsSync(java21Path)) {
    customEnv.JAVA_HOME = java21Path;
    customEnv.PATH = `${path.join(java21Path, 'bin')};${customEnv.PATH || ''}`;
  }
  const adbPath = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools');
  if (fs.existsSync(adbPath)) {
    customEnv.PATH = `${adbPath};${customEnv.PATH}`;
  }
}

try {
  // Step 1: Build web assets for studio-android
  console.log('\n[1/4] Building Android Web Bundle (Vite)...');
  run('pnpm --filter @workspace/studio-android build', REPO_ROOT);

  // Step 2: Capacitor Sync
  console.log('\n[2/4] Syncing Capacitor Android Native Assets & Plugins...');
  run('npx cap sync android', APP_DIR);

  // Step 3: Compile Android Debug APK with Gradle
  console.log('\n[3/4] Compiling Native Android Debug APK via Gradle...');
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug';
  run(gradleCmd, ANDROID_DIR, customEnv);

  // Step 4: Copy Preview APK to dist outputs
  console.log('\n[4/4] Packaging Preview APK Artifacts...');
  if (!fs.existsSync(APK_SOURCE)) {
    throw new Error(`Generated APK not found at expected path: ${APK_SOURCE}`);
  }

  fs.copyFileSync(APK_SOURCE, PREVIEW_DEST_APP);
  fs.copyFileSync(APK_SOURCE, PREVIEW_DEST_ROOT);

  const stats = fs.statSync(PREVIEW_DEST_APP);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // Optional ADB auto-install if device connected
  let adbInstalled = false;
  try {
    const devicesOutput = execSync('adb devices', { encoding: 'utf8', env: customEnv });
    const hasDevice = devicesOutput.split('\n').some((line) => line.includes('\tdevice'));
    if (hasDevice) {
      console.log('\n[ADB] Connected Android device detected. Installing Preview APK...');
      execSync(`adb install -r "${PREVIEW_DEST_ROOT}"`, { stdio: 'inherit', env: customEnv });
      adbInstalled = true;
    }
  } catch (adbErr) {
    // ADB not available or no device connected
  }

  console.log('\n=================================================================');
  console.log('  ✓ ANDROID PREVIEW BUILD SUCCESSFUL                            ');
  console.log('=================================================================');
  console.log(`Preview APK Size: ${sizeMb} MB`);
  console.log(`Location (App):  ${PREVIEW_DEST_APP}`);
  console.log(`Location (Root): ${PREVIEW_DEST_ROOT}`);
  if (adbInstalled) {
    console.log('ADB Auto-Install: ✓ Successfully installed on connected Android device!');
  } else {
    console.log('ADB Auto-Install: (No USB device connected — copy APK to phone to test)');
  }
  console.log('\nManual Testing Checklist:');
  console.log(' 1. Test UI & bottom navigation on physical Android screen.');
  console.log(' 2. Test native plugins (notifications, haptics, orientation).');
  console.log(' 3. Confirm zero updater/OTA side effects.');
  console.log(' 4. ONLY AFTER YOUR explicit manual approval, proceed with:');
  console.log('    - Version bump script');
  console.log('    - Git commit & push');
  console.log('    - Release Pipeline (gh workflow run release.yml)');
  console.log('=================================================================\n');
} catch (error) {
  console.error('\n❌ ANDROID PREVIEW WORKFLOW FAILED:', error.message);
  process.exit(1);
}
