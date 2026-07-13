import React from 'react';
import { copyToClipboard } from './centralizedClipboard';
import { generateUnifiedReport } from './diagnosticsGenerator';

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

  const triggerCopy = async (type: 'all' | 'section' | 'summary' | 'tech') => {
    const fullReport = generateUnifiedReport(
      'Updater',
      nativeDeviceInfo,
      nativeInstallerDetails,
      localApkDetails,
      nativeLogsList
    );

    let textToCopy = fullReport;
    let label = 'Report';

    if (type === 'summary') {
      const lines = fullReport.split('\n');
      const healthIndex = lines.findIndex(l => l.includes('Overall Health'));
      const problemsIndex = lines.findIndex(l => l.includes('Detected Problems'));
      if (healthIndex !== -1 && problemsIndex !== -1) {
        textToCopy = lines.slice(healthIndex - 1, problemsIndex - 1).join('\n');
      }
      label = 'Summary';
    } else if (type === 'section') {
      const lines = fullReport.split('\n');
      const startPattern = 'Updater Analysis';
      let sectionContent = '';
      const startIndex = lines.findIndex(l => l.toLowerCase().includes(startPattern.toLowerCase()));
      if (startIndex !== -1) {
        const nextHeaderIndex = lines.findIndex((l, idx) => idx > startIndex && l.startsWith('====') && !l.includes('Report'));
        if (nextHeaderIndex !== -1) {
          sectionContent = lines.slice(startIndex - 1, nextHeaderIndex - 1).join('\n');
        } else {
          sectionContent = lines.slice(startIndex - 1).join('\n');
        }
      }
      textToCopy = sectionContent || fullReport;
      label = 'Updater Section';
    } else if (type === 'tech') {
      const lines = fullReport.split('\n');
      const appendixIndex = lines.findIndex(l => l.includes('Technical Appendix'));
      if (appendixIndex !== -1) {
        textToCopy = lines.slice(appendixIndex - 1).join('\n');
      }
      label = 'Technical Data';
    }

    try {
      const msg = await copyToClipboard(textToCopy, label);
      showToast(msg);
    } catch (err: any) {
      showToast(`Copy failed: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="space-y-3 bg-black">
      {/* Copy Everything */}
      <button 
        onClick={() => triggerCopy('all')}
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

      {/* Copy Section */}
      <button 
        onClick={() => triggerCopy('section')}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Current Section</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies the specific Updater diagnostics segment from the report.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Summary */}
      <button 
        onClick={() => triggerCopy('summary')}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Summary</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies the short human-readable status summary and overall health details.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>

      {/* Copy Technical Data */}
      <button 
        onClick={() => triggerCopy('tech')}
        className="w-full bg-black hover:bg-white/5 flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors border border-outline-variant/10 text-left outline-none group active:scale-[0.99]"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="font-bold text-sm text-on-surface">Copy Technical Data</span>
          <span className="text-[11px] text-on-surface-variant leading-relaxed">
            Copies the raw console and native installer log dumps.
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">content_copy</span>
      </button>
    </div>
  );
}
