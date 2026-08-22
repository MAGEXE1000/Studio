import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.resolve(REPO_ROOT, 'apps/studio-android');

const PORT = process.env.PORT || '5174';

// 1. Get host LAN IP for Wi-Fi fallback
function getHostLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// 2. Discover connected ADB devices / emulators
function detectAdbTarget() {
  try {
    const output = execSync('adb devices', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('List of devices'));
    const devices = lines.filter(l => l.includes('\tdevice')).map(l => l.split('\t')[0]);
    if (devices.length > 0) {
      const serial = devices[0];
      const isEmulator = serial.startsWith('emulator-');
      return { connected: true, serial, isEmulator, count: devices.length };
    }
  } catch {}
  return { connected: false, serial: null, isEmulator: false, count: 0 };
}

// 3. Setup target development URL
const lanIp = getHostLanIp();
const adbTarget = detectAdbTarget();

let targetUrl = process.env.CAPACITOR_SERVER_URL;
let connectionMode = 'CUSTOM';

if (!targetUrl) {
  if (adbTarget.connected) {
    try {
      execSync(`adb -s ${adbTarget.serial} reverse tcp:${PORT} tcp:${PORT}`, { stdio: 'ignore' });
      targetUrl = `http://localhost:${PORT}`;
      connectionMode = `ADB Reverse (USB/Device: ${adbTarget.serial})`;
    } catch {
      if (adbTarget.isEmulator) {
        targetUrl = `http://10.0.2.2:${PORT}`;
        connectionMode = `Android Emulator Loopback (10.0.2.2:${PORT})`;
      } else {
        targetUrl = `http://${lanIp}:${PORT}`;
        connectionMode = `Host LAN (Wi-Fi: ${lanIp}:${PORT})`;
      }
    }
  } else {
    targetUrl = `http://10.0.2.2:${PORT}`;
    connectionMode = `Default Emulator Alias (10.0.2.2:${PORT}) / LAN fallback (http://${lanIp}:${PORT})`;
  }
}

console.log('=================================================================');
console.log('  STUDIO / LIVEX — ANDROID CAPACITOR LIVE PREVIEW (PORT ' + PORT + ')  ');
console.log('=================================================================');
console.log(`• Live Reload URL:  ${targetUrl}`);
console.log(`• Connection Mode:  ${connectionMode}`);
console.log(`• Host LAN IP:      http://${lanIp}:${PORT}`);
if (adbTarget.connected) {
  console.log(`• ADB Target:       ${adbTarget.serial} (${adbTarget.isEmulator ? 'Emulator' : 'Physical Device'})`);
} else {
  console.log(`• ADB Target:       No ADB device connected (connect USB or start emulator)`);
}
console.log('-----------------------------------------------------------------');

// 4. Inject development server.url into Capacitor assets
console.log('[1/2] Syncing Capacitor live-reload configuration...');
try {
  const env = { ...process.env, CAPACITOR_SERVER_URL: targetUrl };
  execSync('pnpm --filter @workspace/studio-android exec cap copy android', {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env,
  });
  console.log('✓ Capacitor assets configured for live reload.');
} catch (err) {
  console.error('⚠ Failed to sync Capacitor assets:', err.message);
}

// 5. If device connected, attempt to launch app
if (adbTarget.connected) {
  try {
    console.log('[Launch] Starting Studio on connected device...');
    execSync(`adb -s ${adbTarget.serial} shell am start -n com.chordex.app/.MainActivity`, { stdio: 'ignore' });
    console.log('✓ Studio launched on device.');
  } catch {}
}

// 6. Cleanup function on exit (restores clean production capacitor.config.json)
let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log('\n[Teardown] Restoring clean production Capacitor configuration...');
  try {
    const cleanEnv = { ...process.env };
    delete cleanEnv.CAPACITOR_SERVER_URL;
    execSync('pnpm --filter @workspace/studio-android exec cap copy android', {
      cwd: REPO_ROOT,
      stdio: 'ignore',
      env: cleanEnv,
    });
    console.log('✓ Production Capacitor configuration restored.');
  } catch {}
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);

// 7. Start Vite development server for Android
console.log(`\n[2/2] Starting Vite Android development server on port ${PORT}...`);
const vite = spawn('pnpm', ['--filter', '@workspace/studio-android', 'dev'], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT },
});

vite.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});