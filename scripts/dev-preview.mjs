import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const WEB_PORT = '5173';
const ANDROID_PORT = '5174';

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

const lanIp = getHostLanIp();
const adbTarget = detectAdbTarget();

let androidTargetUrl = process.env.CAPACITOR_SERVER_URL;
let androidMode = 'CUSTOM';

if (!androidTargetUrl) {
  if (adbTarget.connected) {
    try {
      execSync(`adb -s ${adbTarget.serial} reverse tcp:${ANDROID_PORT} tcp:${ANDROID_PORT}`, { stdio: 'ignore' });
      androidTargetUrl = `http://localhost:${ANDROID_PORT}`;
      androidMode = `ADB Reverse (${adbTarget.serial})`;
    } catch {
      if (adbTarget.isEmulator) {
        androidTargetUrl = `http://10.0.2.2:${ANDROID_PORT}`;
        androidMode = `Emulator Loopback (10.0.2.2:${ANDROID_PORT})`;
      } else {
        androidTargetUrl = `http://${lanIp}:${ANDROID_PORT}`;
        androidMode = `Host LAN (Wi-Fi: ${lanIp}:${ANDROID_PORT})`;
      }
    }
  } else {
    androidTargetUrl = `http://10.0.2.2:${ANDROID_PORT}`;
    androidMode = `Default Emulator Alias (10.0.2.2:${ANDROID_PORT}) / LAN fallback (http://${lanIp}:${ANDROID_PORT})`;
  }
}

console.log('=================================================================');
console.log('  STUDIO / LIVEX — LOCAL DUAL PREVIEW ENVIRONMENT                ');
console.log('=================================================================');
console.log(' [1] WEB PREVIEW');
console.log(`     • Local URL:    http://localhost:${WEB_PORT}`);
console.log(`     • Network URL:  http://${lanIp}:${WEB_PORT}`);
console.log(`     • Engine:       Vite HMR (Browser / Antigravity ready)`);
console.log('');
console.log(' [2] MOBILE PREVIEW (ANDROID / CAPACITOR)');
console.log(`     • Dev Server:   http://localhost:${ANDROID_PORT}`);
console.log(`     • Target URL:   ${androidTargetUrl}`);
console.log(`     • Connection:   ${androidMode}`);
if (adbTarget.connected) {
  console.log(`     • Device:       ${adbTarget.serial} (${adbTarget.isEmulator ? 'Emulator' : 'Physical Device'})`);
} else {
  console.log(`     • Device:       No ADB device detected (connect USB or start emulator)`);
}
console.log('=================================================================\n');

// 3. Configure Capacitor Live Reload
console.log('[Setup] Syncing Capacitor live-reload configuration for Android...');
try {
  const env = { ...process.env, CAPACITOR_SERVER_URL: androidTargetUrl };
  execSync('pnpm --filter @workspace/studio-android exec cap copy android', {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env,
  });
  console.log('✓ Capacitor assets configured for live reload.');
} catch (err) {
  console.error('⚠ Failed to sync Capacitor assets:', err.message);
}

// 4. If device connected, attempt to launch app
if (adbTarget.connected) {
  try {
    console.log('[Launch] Starting Studio on connected device...');
    execSync(`adb -s ${adbTarget.serial} shell am start -n com.chordex.app/.MainActivity`, { stdio: 'ignore' });
    console.log('✓ Studio launched on device.');
  } catch {}
}

// 5. Cleanup function
let cleanedUp = false;
let webProcess = null;
let androidProcess = null;

function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log('\n[Teardown] Shutting down preview servers and restoring clean config...');
  if (webProcess) {
    try { webProcess.kill(); } catch {}
  }
  if (androidProcess) {
    try { androidProcess.kill(); } catch {}
  }
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

// 6. Spawn Web Dev Server
console.log('[Start] Launching Web dev server on port ' + WEB_PORT + '...');
webProcess = spawn('pnpm', ['--filter', '@workspace/studio-web', 'dev'], {
  cwd: REPO_ROOT,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, PORT: WEB_PORT },
});

webProcess.stdout.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.log(`[WEB] ${line}`);
});
webProcess.stderr.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.error(`[WEB] ${line}`);
});

// 7. Spawn Android Dev Server
console.log('[Start] Launching Android dev server on port ' + ANDROID_PORT + '...');
androidProcess = spawn('pnpm', ['--filter', '@workspace/studio-android', 'dev'], {
  cwd: REPO_ROOT,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, PORT: ANDROID_PORT },
});

androidProcess.stdout.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.log(`[ANDROID] ${line}`);
});
androidProcess.stderr.on('data', (d) => {
  const line = d.toString().trim();
  if (line) console.error(`[ANDROID] ${line}`);
});