import React from 'react';
import { generateFullEngineeringReport } from './diagnosticsGenerator';

interface ReportPreviewProps {
  nativeDeviceInfo: any;
  nativeInstallerDetails: any;
  localApkDetails: any;
  nativeLogsList: any[];
}

export default function ReportPreview({
  nativeDeviceInfo,
  nativeInstallerDetails,
  localApkDetails,
  nativeLogsList
}: ReportPreviewProps) {
  
  const reportText = generateFullEngineeringReport(
    nativeDeviceInfo,
    nativeInstallerDetails,
    localApkDetails,
    nativeLogsList
  );

  return (
    <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-lg select-text">
      <div className="prose prose-invert prose-sm max-w-none mono-text text-[11px] text-on-surface-variant leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap word-break-all select-text font-mono">
        {reportText}
      </div>
    </div>
  );
}
