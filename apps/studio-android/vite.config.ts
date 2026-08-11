import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);
const basePath = process.env.BASE_PATH ?? '/';

const injectEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SYNC_BACKEND_PROVIDER',
] as const;

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const envDefines: Record<string, string> = {};
  for (const k of injectEnvKeys) {
    const val = (process.env[k] ?? env[k] ?? '').trim();
    envDefines[`import.meta.env.${k}`] = JSON.stringify(val);
  }

  let gitCommitSha = 'unknown';
  let isDirty = false;
  // Files that sync-versions.mjs legitimately modifies during a release build.
  // These are excluded from the dirty-tree warning in production release mode
  // to prevent false alarms from idempotent version-sync operations.
  const SYNC_GENERATED_FILES = new Set([
    'packages/studio-core/src/lib/startup/appVersion.ts',
    'apps/studio-android/public/version.json',
    'apps/studio-android/public/app-release.json',
    'apps/studio-web/public/version.json',
    'apps/studio-android/android/app/build.gradle',
    'apps/studio-android/package.json',
    'apps/studio-web/package.json',
    'release-notes.md',
    'release-manifest.json',
    'scripts/sync-versions.mjs',
  ]);
  const isProductionRelease = process.env.STUDIO_PRODUCTION_RELEASE === 'true';
  try {
    gitCommitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      if (isProductionRelease) {
        // In production release builds, only flag unexpected dirty files as problematic
        const dirtyFiles = status
          .split('\n')
          .map((line: string) => line.slice(3).trim()) // strip "XY " prefix
          .filter((f: string) => f && !SYNC_GENERATED_FILES.has(f));
        isDirty = dirtyFiles.length > 0;
        if (isDirty) {
          console.warn(`\x1b[33mVite Build (Android): ⚠ UNEXPECTED dirty files in production build:\x1b[0m`);
          dirtyFiles.forEach((f: string) => console.warn(`  - ${f}`));
        } else {
          console.log(`\x1b[36mVite Build (Android): ℹ Dirty files present but all are sync-generated — suppressing warning.\x1b[0m`);
        }
      } else {
        isDirty = true;
      }
    }
  } catch (e: any) {
    console.warn('Vite Config: ⚠ Could not get git commit SHA:', e.message);
  }

  const buildTimestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

  envDefines['import.meta.env.VITE_GIT_COMMIT_SHA'] = JSON.stringify(gitCommitSha);
  envDefines['import.meta.env.VITE_BUILD_TIMESTAMP'] = JSON.stringify(buildTimestamp);

  if (command === 'build') {
    console.log(`\x1b[32mVite Build (Android): Bundling Git Commit SHA: ${gitCommitSha}\x1b[0m`);

    if (isDirty) {
      console.warn('\x1b[33mVite Build (Android): ⚠ WARNING: Git working tree is dirty.\x1b[0m');
    }

    let url = (process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').trim();
    let key = (process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').trim();
    let provider = (
      process.env.VITE_SYNC_BACKEND_PROVIDER ??
      env.VITE_SYNC_BACKEND_PROVIDER ??
      ''
    ).trim();

    if (!url || !key || provider !== 'supabase-realtime') {
      console.warn(
        '\x1b[33mVite Build (Android): ⚠ Warning: Supabase config missing. Using fallback mock values for non-release build.\x1b[0m'
      );
      url = 'https://mock-supabase.local';
      key = 'mock-anon-key';
      provider = 'supabase-realtime';
      envDefines['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(url);
      envDefines['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(key);
      envDefines['import.meta.env.VITE_SYNC_BACKEND_PROVIDER'] = JSON.stringify(provider);
    }
  }

  return {
    base: basePath,
    define: envDefines,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@/lib': path.resolve(import.meta.dirname, '../../packages/studio-core/src/lib'),
        '@/store': path.resolve(import.meta.dirname, '../../packages/studio-core/src/store'),
        '@/hooks': path.resolve(import.meta.dirname, '../../packages/studio-core/src/hooks'),
        '@/data': path.resolve(import.meta.dirname, '../../packages/studio-core/src/data'),
        '@/i18n': path.resolve(import.meta.dirname, '../../packages/studio-core/src/i18n'),
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, '../../dist/android-web'),
      emptyOutDir: true,
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/react-dom/') ||
                id.includes('/react/') ||
                id.includes('/scheduler/')
              )
                return 'react-vendor';
              if (id.includes('/zustand/')) return 'zustand';
              if (id.includes('/jspdf/')) return 'jspdf';
              if (id.includes('/@capacitor/')) return 'capacitor';
              if (id.includes('/@fontsource/')) return 'fonts';
              if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
              if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'motion-vendor';
            }
          },
        },
      },
    },
    server: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: {
        timeout: 120000,
        overlay: false,
      },
      strictPort: true,
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      },
      fs: {
        strict: true,
        deny: ['**/.*'],
      },
      proxy: {
        '/r2-stems': {
          target: 'https://pub-b6a593f7d45247389f1accd1a54fec5c.r2.dev',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/r2-stems/, ''),
        },
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
