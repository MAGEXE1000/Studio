import {
  APP_VERSION,
  isNative,
  otaDiagnostics,
  otaDebugLogs,
  activityLifecycleTimeline,
  transitionHistory,
  rejectedTransitions,
  getErrors,
  getLogs,
  getPerfStats,
  getStagexDiagnostics
} from '@workspace/studio-core';

export interface DiagnosticsData {
  appVersion: string;
  timestamp: string;
  device: {
    userAgent: string;
    platform: string;
    isNative: boolean;
    manufacturer: string;
    model: string;
    osVersion: string;
    supportedABIs: string[];
    packageName: string;
    versionName: string;
    versionCode: string;
    storageAvailable: string;
    networkState: string;
    batteryLevel: number | string;
  };
  errors: any[];
  perfStats: any[];
  logs: any[];
  stagexDiagnostics: any;
  otaDiagnostics: typeof otaDiagnostics;
  otaDebugLogs: typeof otaDebugLogs;
  activityLifecycle: any[];
  stateTransitions: typeof transitionHistory;
  rejectedTransitions: typeof rejectedTransitions;
  localApkDetails: any;
  nativeLogs: any[];
}

export function buildDiagnosticDataObject(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): DiagnosticsData {
  const devInfo = nativeDeviceInfo || {};
  const perf = getPerfStats();

  return {
    appVersion: APP_VERSION,
    timestamp: new Date().toISOString(),
    device: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      isNative: isNative(),
      manufacturer: devInfo.manufacturer || otaDiagnostics?.deviceModel || 'N/A',
      model: devInfo.model || otaDiagnostics?.deviceModel || 'N/A',
      osVersion: devInfo.osVersion || otaDiagnostics?.androidVersion || 'N/A',
      supportedABIs: devInfo.supportedAbis || [],
      packageName: devInfo.packageName || 'com.chordex.app',
      versionName: devInfo.versionName || APP_VERSION,
      versionCode: devInfo.versionCode !== undefined ? String(devInfo.versionCode) : 'N/A',
      storageAvailable: devInfo.storageAvailable || otaDiagnostics?.storageAvailable || 'N/A',
      networkState: devInfo.networkState || otaDiagnostics?.networkState || 'N/A',
      batteryLevel: devInfo.battery !== undefined ? devInfo.battery : 'N/A'
    },
    errors: getErrors() || [],
    perfStats: perf ? Array.from(perf.entries()).map(([k, v]) => ({ component: k, ...v })) : [],
    logs: getLogs() || [],
    stagexDiagnostics: getStagexDiagnostics() || {},
    otaDiagnostics: otaDiagnostics || {},
    otaDebugLogs: otaDebugLogs || {},
    activityLifecycle: activityLifecycleTimeline || [],
    stateTransitions: transitionHistory || [],
    rejectedTransitions: rejectedTransitions || [],
    localApkDetails: localApkDetails || null,
    nativeLogs: nativeLogsList || []
  };
}

function translateSentinel(val: any, label = 'Not initialized'): string {
  if (val === null || val === undefined || val === '' || val === -999 || val === '-999') {
    return label;
  }
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower === 'none' || lower === 'n/a' || lower === 'null' || lower === 'undefined') {
    return label;
  }
  return str;
}

export function generateFullEngineeringReport(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): string {
  const data = buildDiagnosticDataObject(nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
  const sections: string[] = [];

  sections.push('==================================================');
  sections.push('[ENVIRONMENT]');
  sections.push('==================================================');
  sections.push(`User Agent: ${translateSentinel(data.device.userAgent, 'Browser Environment')}`);
  sections.push(`Host Platform: ${translateSentinel(data.device.platform, 'Unknown Platform')}`);
  sections.push(`Capacitor Native Shell: ${data.device.isNative ? 'Enabled (Android Native)' : 'Disabled (Web/Desktop Browser)'}`);
  sections.push('');

  sections.push('==================================================');
  sections.push('[APPLICATION]');
  sections.push('==================================================');
  sections.push(`Package Name: ${translateSentinel(data.device.packageName, 'com.chordex.app')}`);
  sections.push(`Version Name (Display): ${translateSentinel(data.device.versionName, APP_VERSION)}`);
  sections.push(`Version Code (Build): ${translateSentinel(data.device.versionCode, 'Not configured')}`);
  sections.push(`Active App Version: ${data.appVersion}`);
  sections.push('');

  sections.push('==================================================');
  sections.push('[DEVICE]');
  sections.push('==================================================');
  sections.push(`Manufacturer: ${translateSentinel(data.device.manufacturer, 'Generic/Web')}`);
  sections.push(`Model Name: ${translateSentinel(data.device.model, 'Browser Sandbox')}`);
  sections.push(`OS Version: ${translateSentinel(data.device.osVersion, 'Browser Runtime')}`);
  sections.push(`Supported ABIs: ${data.device.supportedABIs.length > 0 ? data.device.supportedABIs.join(', ') : 'Not applicable'}`);
  sections.push(`Storage Available: ${translateSentinel(data.device.storageAvailable, 'Measurement unavailable')}`);
  sections.push(`Network State: ${translateSentinel(data.device.networkState, 'Connection state unknown')}`);
  sections.push(`Battery Level: ${translateSentinel(data.device.batteryLevel, 'Power source undetermined')}`);
  sections.push('');

  sections.push('==================================================');
  sections.push('[UPDATE SYSTEM]');
  sections.push('==================================================');
  sections.push(`Update Decision: ${translateSentinel(data.otaDebugLogs.updateDecision, 'No check performed yet')}`);
  sections.push(`Decision Reason: ${translateSentinel(data.otaDebugLogs.updateDecisionReason, 'No diagnostic data available')}`);
  sections.push(`Download Status: ${translateSentinel(data.otaDebugLogs.downloadStatus, 'No download in progress')}`);
  sections.push(`SHA-256 Verification: ${translateSentinel(data.otaDebugLogs.shaVerification, 'No verification completed')}`);
  sections.push(`Eligibility Reason: ${translateSentinel(data.otaDebugLogs.eligibilityReason, 'No conditions analyzed')}`);
  sections.push(`Last Installation Error: ${translateSentinel(data.otaDebugLogs.installError, 'No installation errors recorded')}`);
  sections.push('');

  sections.push('==================================================');
  sections.push('[NATIVE INSTALLER]');
  sections.push('==================================================');
  if (nativeInstallerDetails) {
    sections.push(`Session ID: ${translateSentinel(nativeInstallerDetails.sessionId, 'No session active')}`);
    sections.push(`Session State: ${translateSentinel(nativeInstallerDetails.sessionState, 'No active installation')}`);
    sections.push(`Last Status Code: ${translateSentinel(nativeInstallerDetails.lastStatusCode, 'None')}`);
    sections.push(`Last Status Message: ${translateSentinel(nativeInstallerDetails.lastStatusMessage, 'No messages recorded')}`);
  } else {
    sections.push('Native package installer details are unavailable on this platform.');
  }
  if (data.localApkDetails) {
    sections.push('Downloaded Package Details:');
    sections.push(`  • APK Package Name: ${translateSentinel(data.localApkDetails.packageName, 'Unknown')}`);
    sections.push(`  • APK Version Name: ${translateSentinel(data.localApkDetails.versionName, 'Unknown')}`);
    sections.push(`  • APK Version Code: ${translateSentinel(data.localApkDetails.versionCode, 'Unknown')}`);
    sections.push(`  • APK Signature Valid: ${data.localApkDetails.isValidApk ? 'Verified (Valid APK)' : 'Invalid / Verification Failed'}`);
  }
  sections.push('');

  sections.push('==================================================');
  sections.push('[PERFORMANCE]');
  sections.push('==================================================');
  if (data.perfStats.length > 0) {
    data.perfStats.forEach(stat => {
      sections.push(`Component: ${stat.component}`);
      sections.push(`  • Render Count: ${stat.renderCount}`);
      sections.push(`  • Total Duration: ${stat.totalDurationMs} ms`);
    });
  } else {
    sections.push('No runtime performance metrics collected.');
  }
  sections.push('');

  sections.push('==================================================');
  sections.push('[STATE MACHINE]');
  sections.push('==================================================');
  if (data.stateTransitions.length > 0) {
    data.stateTransitions.forEach((t, idx) => {
      sections.push(`[${idx + 1}] [${new Date(t.timestamp).toLocaleTimeString()}] State Transition: ${t.from} -> ${t.to}`);
      sections.push(`    Reason: ${translateSentinel(t.reason, 'Normal flow')}`);
    });
  } else {
    sections.push('No state machine transitions logged during this session.');
  }
  if (data.rejectedTransitions.length > 0) {
    sections.push('Rejected State Transitions:');
    data.rejectedTransitions.forEach((t, idx) => {
      sections.push(`  • [${idx + 1}] [${new Date(t.timestamp).toLocaleTimeString()}] ${t.from} -> ${t.attempted}`);
      sections.push(`      Rejection Reason: ${translateSentinel(t.reason, 'Invalid state transition')}`);
    });
  }
  sections.push('');

  sections.push('==================================================');
  sections.push('[RECENT EVENTS]');
  sections.push('==================================================');
  if (data.activityLifecycle.length > 0) {
    data.activityLifecycle.forEach((t, idx) => {
      sections.push(`[${idx + 1}] [${new Date(t.timestamp).toLocaleTimeString()}] Event: ${t.event} (Type: ${t.type || 'Generic'})`);
    });
  } else {
    sections.push('No recent events recorded.');
  }
  sections.push('');

  sections.push('==================================================');
  sections.push('[RUNTIME]');
  sections.push('==================================================');
  if (data.errors.length > 0) {
    sections.push('Logged Runtime Errors:');
    data.errors.forEach((err, idx) => {
      sections.push(`  • [${idx + 1}] [${new Date(err.timestamp || Date.now()).toLocaleTimeString()}] Error: ${err.message}`);
    });
  } else {
    sections.push('No runtime errors recorded.');
  }
  sections.push('');

  sections.push('==================================================');
  sections.push('[LOGS]');
  sections.push('==================================================');
  sections.push('--- JavaScript Console Log Dump ---');
  if (data.logs.length > 0) {
    data.logs.forEach(log => {
      sections.push(`[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`);
    });
  } else {
    sections.push('No JavaScript logs in buffer.');
  }
  sections.push('');
  sections.push('--- Android Native Installer Log Dump ---');
  if (data.nativeLogs.length > 0) {
    data.nativeLogs.forEach(log => {
      sections.push(`[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${translateSentinel(log.stage, 'Installer')}] Status: ${log.status} - Message: ${translateSentinel(log.message, 'No message')}`);
    });
  } else {
    sections.push('No native logs in buffer.');
  }
  sections.push('==================================================');

  return sections.join('\n');
}
