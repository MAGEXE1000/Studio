import React from 'react';
import { getLogs, stateTimeline, isNative, APP_VERSION } from '@workspace/studio-core';
import { copyToClipboard } from './centralizedClipboard';
import { generateFullEngineeringReport } from './diagnosticsGenerator';

interface DiagnosticsStackProps {
  nativeDeviceInfo: any;
  nativeInstallerDetails: any;
  localApkDetails: any;
  nativeLogsList: any[];
  showToast: (msg: string) => void;
}

export default function DiagnosticsStack({
  nativeDeviceInfo,
  nativeInstallerDetails,
  localApkDetails,
  nativeLogsList,
  showToast
}: DiagnosticsStackProps) {

  const copyEverythingReport = async () => {
    const report = generateFullEngineeringReport(
      nativeDeviceInfo,
      nativeInstallerDetails,
      localApkDetails,
      nativeLogsList
    );
    try {
      const msg = await copyToClipboard(report, 'Full Engineering Report');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyJsLogs = async () => {
    let txt = '=== JS RUNTIME LOGS ===\n';
    const logs = getLogs() || [];
    if (logs.length > 0) {
      logs.forEach(log => {
        txt += `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}\n`;
      });
    } else {
      txt += 'No JS console logs recorded.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'JavaScript Runtime Logs');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyNativeLogs = async () => {
    let txt = '=== ANDROID NATIVE LOGS ===\n';
    if (nativeLogsList && nativeLogsList.length > 0) {
      nativeLogsList.forEach(log => {
        txt += `[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${log.stage || 'N/A'}] Status: ${log.status} - Message: ${log.message || 'N/A'}\n`;
      });
    } else {
      txt += 'No native installer logs available.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'Android Native Logs');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyTimeline = async () => {
    let txt = '=== UPDATE TRANSITION TIMELINE ===\n';
    const transitions = stateTimeline || [];
    if (transitions.length > 0) {
      transitions.forEach((t, i) => {
        txt += `[${i + 1}] [${new Date(t.timestamp).toLocaleTimeString()}] ${t.state} (Reason: ${t.reason})\n`;
      });
    } else {
      txt += 'No transition state history logged.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'Update Transition Timeline');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyDeviceInfo = async () => {
    let txt = '=== HARDWARE AND ANDROID INFORMATION ===\n';
    if (nativeDeviceInfo) {
      txt += JSON.stringify(nativeDeviceInfo, null, 2) + '\n';
    } else {
      txt += 'No hardware or Android information available.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'Hardware & Android Info');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyEnvironment = async () => {
    let txt = '=== RUNTIME CONFIGURATION ===\n';
    txt += `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}\n`;
    txt += `Platform: ${typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}\n`;
    txt += `Capacitor Native: ${isNative() ? 'YES' : 'NO'}\n`;
    txt += `App Version: ${APP_VERSION}\n`;
    try {
      const msg = await copyToClipboard(txt, 'Runtime Configuration');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="space-y-3 bg-black">
      {/* Copy Everything */}
      <button 
        onClick={copyEverythingReport}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-tertiary">Copy Everything</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies complete diagnostics report including logs, update system state and device information.
          </span>
        </div>
        <span className="material-symbols-outlined text-tertiary group-hover:scale-110 transition-transform">content_copy</span>
      </button>

      {/* Copy JS Logs */}
      <button 
        onClick={copyJsLogs}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy JS Logs</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies JavaScript runtime logs.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Native Logs */}
      <button 
        onClick={copyNativeLogs}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Native Logs</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies Android native logs.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Timeline */}
      <button 
        onClick={copyTimeline}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Timeline</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies update transition timeline.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Device Info */}
      <button 
        onClick={copyDeviceInfo}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Device Info</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies hardware and Android information.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Environment */}
      <button 
        onClick={copyEnvironment}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Environment</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies runtime configuration.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>
    </div>
  );
}
