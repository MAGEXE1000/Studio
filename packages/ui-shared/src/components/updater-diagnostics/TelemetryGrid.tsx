import React from 'react';
import { APP_VERSION, globalOtaState, otaDebugLogs, otaDiagnostics, isNative } from '@workspace/studio-core';

interface TelemetryGridProps {
  nativeDeviceInfo: any;
  nativeInstallerDetails: any;
}

export default function TelemetryGrid({ nativeDeviceInfo, nativeInstallerDetails }: TelemetryGridProps) {
  const currentVersion = APP_VERSION;
  const remoteVersion = globalOtaState.remoteVersion || 'Waiting for OTA check';
  const updateState = globalOtaState.updateState || 'Not initialized';
  const updateAvailable = globalOtaState.updateAvailable;
  const isWeb = !isNative();

  const getDisplayValue = (val: any, fallbackLabelAndroid: string) => {
    if (val === null || val === undefined || val === 'N/A' || val === '') {
      return isWeb ? 'Unavailable on this device' : fallbackLabelAndroid;
    }
    return String(val);
  };

  const installedVersionCode = getDisplayValue(otaDebugLogs.installedVersionCode, 'Not initialized');
  const installerSessionState = nativeInstallerDetails?.sessionState && nativeInstallerDetails.sessionState !== 'None'
    ? nativeInstallerDetails.sessionState
    : (isWeb ? 'Unavailable on this device' : 'Not initialized');
  const storageAvailable = getDisplayValue(nativeDeviceInfo?.storageAvailable || otaDiagnostics?.storageAvailable, 'Not initialized');
  const networkState = getDisplayValue(nativeDeviceInfo?.networkState || otaDiagnostics?.networkState, 'Not initialized');
  const batteryLevel = nativeDeviceInfo?.battery !== undefined 
    ? `${nativeDeviceInfo.battery}%` 
    : (isWeb ? 'Unavailable on this device' : 'Not initialized');

  const downloadProgress = globalOtaState.progress;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black">
      {/* Version Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Version</span>
        <span className="text-lg font-bold text-tertiary">{currentVersion}</span>
      </div>

      {/* Latest Version Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Latest Release</span>
        <span className="text-lg font-bold text-on-surface">{remoteVersion}</span>
      </div>

      {/* Code Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Version Code</span>
        <span className="text-lg font-bold text-on-surface">{installedVersionCode}</span>
      </div>

      {/* State Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">State</span>
        <span className="text-lg font-bold text-on-surface">{updateState}</span>
      </div>

      {/* OTA Status Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">OTA Status</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${updateAvailable ? 'bg-red-500' : 'bg-green-500'} status-dot-pulse`} />
          <span className="text-lg font-bold text-on-surface">{updateAvailable ? 'Available' : 'Idle'}</span>
        </div>
      </div>

      {/* PackageInstaller Card */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">PackageInstaller</span>
        <span className="text-lg font-bold text-on-surface overflow-hidden text-ellipsis whitespace-nowrap">
          {installerSessionState}
        </span>
      </div>

      {/* Storage / Network */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10 col-span-1">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Storage / Network</span>
        <span className="text-sm font-bold text-on-surface overflow-hidden text-ellipsis whitespace-nowrap mt-1">
          {storageAvailable} / {networkState}
        </span>
      </div>

      {/* Battery / Last Check */}
      <div className="bg-black p-4 rounded-xl flex flex-col gap-1 border border-outline-variant/10 col-span-1">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Battery / Time</span>
        <span className="text-sm font-bold text-on-surface overflow-hidden text-ellipsis whitespace-nowrap mt-1">
          {batteryLevel} &bull; {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Download Progress Bar */}
      <div className="col-span-2 md:col-span-4 bg-black p-5 rounded-xl border border-outline-variant/10">
        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-medium text-on-surface">Download Progress</span>
          <span className="text-xs font-mono text-on-surface-variant">
            {(downloadProgress * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden">
          <div 
            className="h-full bg-tertiary transition-all duration-500 rounded-full" 
            style={{ width: `${downloadProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
