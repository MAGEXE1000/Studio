import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || '5174';

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

const lanIp = getHostLanIp();

console.log('=================================================================');
console.log('  STUDIO / LIVEX — MOBILE WEB PREVIEW (VITE HMR ON PORT ' + PORT + ')  ');
console.log('=================================================================');
console.log(`• Local Preview:   http://localhost:${PORT}`);
console.log(`• Network Preview: http://${lanIp}:${PORT}`);
console.log(`• Viewport Shell:  Realistic Mobile Device Frame (iPhone 15 / Pixel 8)`);
console.log(`• Engine:          Vite HMR (Instant Sub-Second UI Updates)`);
console.log(`• Target:          Shared React UI (@workspace/ui-shared + core)`);
console.log(`• Native Bypass:   Zero ADB / SDK / Gradle / Device required`);
console.log('=================================================================\n');

const vite = spawn('pnpm', ['--filter', '@workspace/studio-android', 'dev'], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT },
});

process.on('SIGINT', () => {
  try { vite.kill(); } catch {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  try { vite.kill(); } catch {}
  process.exit(0);
});

vite.on('exit', (code) => {
  process.exit(code || 0);
});