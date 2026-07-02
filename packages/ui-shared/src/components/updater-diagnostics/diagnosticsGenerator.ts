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

export function generateFullEngineeringReport(
  nativeDeviceInfo: any,
  nativeInstallerDetails: any,
  localApkDetails: any,
  nativeLogsList: any[]
): string {
  const data = buildDiagnosticDataObject(nativeDeviceInfo, nativeInstallerDetails, localApkDetails, nativeLogsList);
  const sections: string[] = [];

  sections.push('# UPDATER_DIAGNOSTICS_REPORT_V1');
  sections.push(`REPORT_TIME: ${data.timestamp}`);
  sections.push(`APP_VERSION: ${data.appVersion}`);
  sections.push(`PLATFORM: ${data.device.isNative ? 'Android Native (Capacitor)' : 'Web Browser'}`);
  sections.push(`DEVICE_MODEL: ${data.device.model} (${data.device.manufacturer})`);
  sections.push(`OS_VERSION: ${data.device.osVersion}`);
  sections.push(`STORAGE_FREE: ${data.device.storageAvailable}`);
  sections.push(`NETWORK_STATE: ${data.device.networkState}`);
  sections.push(`BATTERY_LEVEL: ${data.device.batteryLevel}`);
  sections.push('---');

  sections.push('## ENVIRONMENT_AND_BUILD');
  sections.push(`• user_agent: ${data.device.userAgent}`);
  sections.push(`• host_platform: ${data.device.platform}`);
  sections.push(`• package_name: ${data.device.packageName}`);
  sections.push(`• version_name: ${data.device.versionName}`);
  sections.push(`• version_code: ${data.device.versionCode}`);
  sections.push(`• supported_abis: ${JSON.stringify(data.device.supportedABIs)}`);
  sections.push('---');

  sections.push('## STATE_SNAPSHOT');
  sections.push(`• current_state: ${data.otaDebugLogs.updateDecisionReason || 'idle'}`);
  sections.push(`• update_available: ${data.otaDebugLogs.updateDecision || 'N/A'}`);
  sections.push(`• download_status: ${data.otaDebugLogs.downloadStatus || 'N/A'}`);
  sections.push(`• sha_verification: ${data.otaDebugLogs.shaVerification || 'N/A'}`);
  sections.push(`• eligibility_reason: ${data.otaDebugLogs.eligibilityReason || 'None'}`);
  sections.push(`• last_install_error: ${data.otaDebugLogs.installError || 'None'}`);
  sections.push('---');

  sections.push('## NATIVE_INSTALLER_SESSION');
  if (nativeInstallerDetails) {
    sections.push(`• session_state: ${nativeInstallerDetails.sessionState || 'N/A'}`);
    sections.push(`• session_id: ${nativeInstallerDetails.sessionId || 'N/A'}`);
    sections.push(`• last_status_code: ${nativeInstallerDetails.lastStatusCode ?? 'N/A'}`);
    sections.push(`• last_status_message: ${nativeInstallerDetails.lastStatusMessage || 'N/A'}`);
  } else {
    sections.push('No native installer session info available.');
  }
  sections.push('---');

  sections.push('## NATIVE_APK_DETAILS');
  if (data.localApkDetails) {
    sections.push(`• package_name: ${data.localApkDetails.packageName || 'N/A'}`);
    sections.push(`• version_name: ${data.localApkDetails.versionName || 'N/A'}`);
    sections.push(`• version_code: ${data.localApkDetails.versionCode || 'N/A'}`);
    sections.push(`• is_valid_apk: ${data.localApkDetails.isValidApk ? 'YES' : 'NO'}`);
  } else {
    sections.push('No downloaded APK details available.');
  }
  sections.push('---');

  sections.push('## STAGEX_DIAGNOSTICS');
  sections.push(JSON.stringify(data.stagexDiagnostics, null, 2));
  sections.push('---');

  sections.push('## PERFORMANCE_METRICS');
  if (data.perfStats.length > 0) {
    data.perfStats.forEach(stat => {
      sections.push(`• [${stat.component}] renderCount: ${stat.renderCount} | totalDuration: ${stat.totalDurationMs}ms`);
    });
  } else {
    sections.push('No performance stats recorded.');
  }
  sections.push('---');

  sections.push('## RUNTIME_ERRORS');
  if (data.errors.length > 0) {
    data.errors.forEach((err, idx) => {
      sections.push(`[${idx + 1}] [${new Date(err.timestamp || Date.now()).toLocaleTimeString()}] ${err.message}`);
    });
  } else {
    sections.push('No runtime errors recorded.');
  }
  sections.push('---');

  sections.push('## STATE_TRANSITIONS');
  if (data.stateTransitions.length > 0) {
    data.stateTransitions.forEach(t => {
      sections.push(`[${new Date(t.timestamp).toLocaleTimeString()}] ${t.from} → ${t.to} (${t.reason})`);
    });
  } else {
    sections.push('No state transitions logged.');
  }
  sections.push('---');

  sections.push('## REJECTED_TRANSITIONS');
  if (data.rejectedTransitions.length > 0) {
    data.rejectedTransitions.forEach(t => {
      sections.push(`[${new Date(t.timestamp).toLocaleTimeString()}] ${t.from} ↛ ${t.attempted} (${t.reason})`);
    });
  } else {
    sections.push('No rejected transitions.');
  }
  sections.push('---');

  sections.push('## JS_EXECUTION_CONSOLE_LOGS');
  if (data.logs.length > 0) {
    data.logs.forEach(log => {
      sections.push(`[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`);
    });
  } else {
    sections.push('No JS console logs recorded.');
  }
  sections.push('---');

  sections.push('## NATIVE_INSTALLER_LOGS');
  if (data.nativeLogs.length > 0) {
    data.nativeLogs.forEach(log => {
      sections.push(`[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${log.stage || 'N/A'}] Status: ${log.status} - Message: ${log.message || 'N/A'}`);
    });
  } else {
    sections.push('No native installer logs available.');
  }

  return sections.join('\n');
}
