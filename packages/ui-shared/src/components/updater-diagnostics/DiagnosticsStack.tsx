import React from 'react';
import { getLogs, stateTimeline, transitionHistory } from '@workspace/studio-core';
import { copyToClipboard } from './centralizedClipboard';

interface DiagnosticsStackProps {
  nativeLogsList: any[];
  nativeInstallerDetails: any;
  showToast: (msg: string) => void;
}

export default function DiagnosticsStack({
  nativeLogsList,
  nativeInstallerDetails,
  showToast
}: DiagnosticsStackProps) {

  const copyNativeTrace = async () => {
    let txt = '=== NATIVE PACKAGEINSTALLER SYSTEM LOGS ===\n';
    if (nativeLogsList && nativeLogsList.length > 0) {
      nativeLogsList.forEach(log => {
        txt += `[${new Date(log.timestamp || Date.now()).toLocaleTimeString()}] [${log.stage || 'N/A'}] Status: ${log.status} - Message: ${log.message || 'N/A'}\n`;
      });
    } else {
      txt += 'No native installer logs available.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'Native Logs Trace');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyJsContext = async () => {
    let txt = '=== JS EXECUTION CONSOLE LOGS ===\n';
    const logs = getLogs() || [];
    if (logs.length > 0) {
      logs.forEach(log => {
        txt += `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}\n`;
      });
    } else {
      txt += 'No JS console logs recorded.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'JS Execution Context');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  const copyInstallerHistory = async () => {
    let txt = '=== PACKAGEINSTALLER SESSION METRICS ===\n';
    if (nativeInstallerDetails) {
      txt += JSON.stringify(nativeInstallerDetails, null, 2) + '\n';
    } else {
      txt += 'No active package installer session info available.\n';
    }
    try {
      const msg = await copyToClipboard(txt, 'PackageInstaller Metrics');
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="space-y-2">
      {/* Native Logs Trace */}
      <button 
        onClick={copyNativeTrace}
        className="w-full bg-surface-container hover:bg-surface-container-high flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">history</span>
          <span className="font-medium text-on-surface">Native Logs Trace</span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* JS Execution Context */}
      <button 
        onClick={copyJsContext}
        className="w-full bg-surface-container hover:bg-surface-container-high flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">javascript</span>
          <span className="font-medium text-on-surface">JS Execution Context</span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* PackageInstaller History */}
      <button 
        onClick={copyInstallerHistory}
        className="w-full bg-surface-container hover:bg-surface-container-high flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">box</span>
          <span className="font-medium text-on-surface">PackageInstaller History</span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>
    </div>
  );
}
