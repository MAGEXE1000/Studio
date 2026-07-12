import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

globalThis.importMetaEnv = { VITE_GIT_COMMIT_SHA: 'efd2b1a3', DEV: false, PROD: true, MODE: 'production' };
globalThis.localStorage = { store: {}, getItem(k) { return this.store[k]||null; }, setItem(k,v) { this.store[k]=String(v); }, removeItem(k) { delete this.store[k]; }, clear() { this.store={}; } };
globalThis.sessionStorage = { ...globalThis.localStorage, store: {} };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
globalThis.window = { location: { href: 'http://localhost/' }, dispatchEvent() {}, addEventListener() {}, removeEventListener() {}, Capacitor: {} };

let traceOutput = [];
function addTrace(thread, caller, action, details) {
  traceOutput.push({ ts: Date.now(), thread, caller, action, details });
}

const mockAppInstaller = {
  installApkDirect: async (call) => {
    addTrace('Native (Java)', 'AppInstallerPlugin.installApkDirect', 'ENTER', `filePath=${call.filePath}`);
    addTrace('Native (Java)', 'AppInstallerPlugin.triggerInstallation', 'STEP', 'Session.create() success. sessionId=999');
    addTrace('Native (Java)', 'InstallReceiver', 'BROADCAST', 'Session ID: 999');
    addTrace('Native (Java)', 'AppInstallerPlugin.triggerInstallation', 'STEP', 'Session.commit() start. Calling session.commit()');
    addTrace('Native (Java)', 'AppInstallerPlugin.triggerInstallation', 'STEP', 'Session.commit() finished and session closed');
    addTrace('Native (Java)', 'InstallReceiver', 'BROADCAST', 'Session committed and closed');
    
    // Simulate Android Activity Pause
    addTrace('Android OS', 'ActivityManager', 'LIFECYCLE', 'onActivityPaused (Studio Activity)');
    addTrace('Android OS', 'PackageInstaller', 'UI', 'PackageInstaller Dialog Visible');
    
    // Simulate AppState Change
    setTimeout(async () => {
       const { simulateAppStateChange } = await import(`file://${path.join(repoRoot, 'packages/studio-core/dist/src/lib/startup/startupCoordinator.js').replace(/\\/g, '/')}`);
       simulateAppStateChange(false);
    }, 50);

    return new Promise(resolve => {
       // Simulate user tapping UPDATE in native dialog after 500ms
       setTimeout(async () => {
         addTrace('User', 'PackageInstaller', 'ACTION', 'Tapped UPDATE in Native Dialog');
         addTrace('Android OS', 'PackageInstaller', 'UI', 'PackageInstaller Dialog Closed');
         addTrace('Android OS', 'ActivityManager', 'LIFECYCLE', 'onActivityResumed (Studio Activity)');
         
         const { simulateAppStateChange } = await import(`file://${path.join(repoRoot, 'packages/studio-core/dist/src/lib/startup/startupCoordinator.js').replace(/\\/g, '/')}`);
         simulateAppStateChange(true);
         
         // resolve the plugin call
         resolve();
       }, 500);
    });
  },
  inspectApk: async () => ({ isValidApk: true, packageName: 'com.chordex.app', versionName: '4.0.24', versionCode: 40024 }),
  getDeviceInfo: async () => ({ sdkInt: 34, canRequestPackageInstalls: true }),
  addListener: () => ({ remove: async () => {} })
};

globalThis.Capacitor = {
  isNativePlatform: () => true, getPlatform: () => 'android', isPluginAvailable: () => true,
  Plugins: { AppInstaller: mockAppInstaller }
};
globalThis.window.Capacitor = globalThis.Capacitor;

globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: '4.0.25', versionCode: 40025, apkUrl: 'https://cdn' }) });

async function run() {
  const otaModuleUrl = `file://${path.join(repoRoot, 'packages/studio-core/dist/src/lib/otaUpdate.js').replace(/\\/g, '/')}`;
  const { checkForUpdate, downloadUpdate, applyUpdate, UpdaterFlightRecorder } = await import(otaModuleUrl);
  
  const apkDownloaderUrl = `file://${path.join(repoRoot, 'packages/studio-core/dist/src/lib/apkDownloader.js').replace(/\\/g, '/')}`;
  const { AppInstaller } = await import(apkDownloaderUrl);
  Object.assign(AppInstaller, mockAppInstaller);

  const startupUrl = `file://${path.join(repoRoot, 'packages/studio-core/dist/src/lib/startup/startupCoordinator.js').replace(/\\/g, '/')}`;
  const { setupLifecycleListeners } = await import(startupUrl);
  setupLifecycleListeners();

  console.log("Starting Runtime Trace...");
  addTrace('User', 'UpdateIndicator.tsx', 'ACTION', 'Tapped Install Now');
  
  await checkForUpdate(true);
  await downloadUpdate();
  await applyUpdate();
  
  // wait for all async events to settle
  await new Promise(r => setTimeout(r, 2000));
  
  const flightLogs = UpdaterFlightRecorder.getLogs();
  
  console.log("=== FULL RUNTIME TIMELINE ===");
  const combined = [...traceOutput, ...flightLogs.map(l => ({ ts: l.timestamp, thread: l.thread, caller: l.caller, action: l.eventType, details: l.reason }))];
  combined.sort((a,b) => a.ts - b.ts);
  
  for (const log of combined) {
    const time = new Date(log.ts).toISOString().substring(11, 23);
    console.log(`[${time}] [${log.thread}] ${log.caller} -> ${log.action}`);
    console.log(`    Detail: ${log.details}`);
  }
}

run().catch(console.error);
