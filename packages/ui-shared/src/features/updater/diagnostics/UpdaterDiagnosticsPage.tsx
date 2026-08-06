import React, { useMemo, useState } from 'react';
import {
  useAppUpdate,
  updateDebugLogs,
  updateDiagnostics,
  releaseMetadataInspector,
  globalUpdateState,
  APP_VERSION,
  NATIVE_VERSION,
  NATIVE_VERSION_CODE
} from '@workspace/studio-core';
import { copyToClipboard } from './centralizedClipboard';

export const UpdaterDiagnosticsPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [toast, setToast] = useState(false);
  const {
    updateState,
    loading,
    progress,
    error,
    statusText,
    remoteVersion,
    updateAvailable,
    mandatory,
    changelog,
    releaseNotes,
    apkUrl,
    apkSha256,
    consecutiveFailures,
    recoveryMode,
    updateType,
    sessionId
  } = useAppUpdate();

  const handleCopy = () => {
    const report = `=== UPDATER ENGINEERING DIAGNOSTICS REPORT ===
Generated: ${new Date().toISOString()}

--- VERSION INFORMATION ---
Installed Version: ${APP_VERSION}
Installed VersionCode: ${NATIVE_VERSION_CODE}
Native Version: ${NATIVE_VERSION}
Remote Version: ${remoteVersion}
Remote VersionCode: ${updateDebugLogs.remoteVersionCode}
Version Comparison Result: ${updateDebugLogs.versionComparisonResult}

--- UPDATE STATE ---
Update State: ${updateState}
Update Available: ${updateAvailable}
Mandatory: ${mandatory}
Update Type: ${updateType}
Final Decision: ${updateDebugLogs.finalDecision}
Update Decision Reason: ${updateDebugLogs.updateDecisionReason}
Eligibility Reason: ${updateDebugLogs.eligibilityReason}
Final Path Executed: ${updateDebugLogs.finalPathExecuted}

--- PIPELINE ---
Pipeline ID: ${updateDiagnostics.pipelineId}
Trigger Source: ${updateDiagnostics.triggerSource}
Pipeline Owner: ${updateDiagnostics.pipelineOwner}
Active Async Stage: ${updateDiagnostics.activeAsyncStage}
Queue Depth: ${updateDiagnostics.queueDepth}
Pipeline Duration: ${updateDiagnostics.pipelineDuration}

--- DOWNLOAD & VERIFICATION ---
APK URL: ${apkUrl}
APK SHA256: ${apkSha256}
Download Status: ${updateDebugLogs.downloadStatus}
SHA Verification: ${updateDebugLogs.shaVerification}
File Details: ${updateDebugLogs.fileDetails}
Download URL: ${updateDiagnostics.downloadUrl}
File Size: ${updateDiagnostics.fileSize}

--- PACKAGE VALIDATION ---
Downloaded Package Name: ${updateDebugLogs.downloadedPackageName}
Downloaded Version Name: ${updateDebugLogs.downloadedVersionName}
Downloaded Version Code: ${updateDebugLogs.downloadedVersionCode}
Downloaded Signing SHA256: ${updateDebugLogs.downloadedSigningSha256}
Downloaded Is Valid APK: ${updateDebugLogs.downloadedIsValidApk}
Eligibility Package Name Match: ${updateDebugLogs.eligibilityPackageNameMatch}
Eligibility Signing Match: ${updateDebugLogs.eligibilitySigningMatch}
Eligibility Version Code Higher: ${updateDebugLogs.eligibilityVersionCodeHigher}

--- METADATA SOURCES ---
Source Used: ${releaseMetadataInspector.sourceUsed}
Cache Source: ${releaseMetadataInspector.cacheSource}
Raw Version JSON: ${String(releaseMetadataInspector.rawVersionJson).substring(0, 120)}
Timestamp: ${releaseMetadataInspector.timestamp}

--- ERRORS & RECOVERY ---
Error: ${error}
Exception Message: ${updateDiagnostics.exceptionMessage}
Failure Reason: ${updateDiagnostics.failureReason}
Install Error: ${updateDebugLogs.installError}
Last Exception Stack Trace: ${updateDebugLogs.lastExceptionStackTrace}
Consecutive Failures: ${consecutiveFailures}
Recovery Mode: ${recoveryMode}
Root Cause: ${updateDebugLogs.rootCause}
Suggested Fix: ${updateDebugLogs.suggestedFix}

--- ENVIRONMENT ---
Android Version: ${updateDiagnostics.androidVersion}
Device Model: ${updateDiagnostics.deviceModel}
Architecture: ${updateDiagnostics.architecture}
Network State: ${updateDiagnostics.networkState}
Permission State: ${updateDiagnostics.permissionState}
Platform Detected: ${updateDebugLogs.platformDetected}
`;
    copyToClipboard(report, 'Updater Diagnostics');
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const MetricItem = ({ label, value, valueColor }: { label: string, value: any, valueColor?: string }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        borderTop: '1px solid rgba(128,128,128,0.05)',
        paddingTop: '8px',
        paddingBottom: '4px'
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || 'rgba(255,255,255,0.7)', textAlign: 'right', wordBreak: 'break-all', paddingLeft: '12px' }}>
        {String(value ?? '')}
      </span>
    </div>
  );

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: 'rgba(0,0,0,0.15)',
        padding: '14px',
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const versionData = useMemo(() => ({
    appVersion: APP_VERSION,
    nativeVersion: NATIVE_VERSION,
    nativeVersionCode: NATIVE_VERSION_CODE,
    remoteVersion,
    remoteVersionCode: updateDebugLogs.remoteVersionCode,
    versionComparisonResult: updateDebugLogs.versionComparisonResult
  }), [remoteVersion]);

  const updateStateData = useMemo(() => ({
    updateState,
    updateAvailable,
    mandatory,
    updateType,
    finalDecision: updateDebugLogs.finalDecision,
    updateDecisionReason: updateDebugLogs.updateDecisionReason,
    eligibilityReason: updateDebugLogs.eligibilityReason,
    finalPathExecuted: updateDebugLogs.finalPathExecuted
  }), [updateState, updateAvailable, mandatory, updateType]);

  const pipelineData = useMemo(() => ({
    pipelineId: updateDiagnostics.pipelineId,
    triggerSource: updateDiagnostics.triggerSource,
    pipelineOwner: updateDiagnostics.pipelineOwner,
    activeAsyncStage: updateDiagnostics.activeAsyncStage,
    queueDepth: updateDiagnostics.queueDepth,
    pipelineDuration: updateDiagnostics.pipelineDuration
  }), []);

  const downloadData = useMemo(() => ({
    apkUrl,
    apkSha256,
    downloadStatus: updateDebugLogs.downloadStatus,
    shaVerification: updateDebugLogs.shaVerification,
    fileDetails: updateDebugLogs.fileDetails,
    downloadUrl: updateDiagnostics.downloadUrl,
    fileSize: updateDiagnostics.fileSize
  }), [apkUrl, apkSha256]);

  const validationData = useMemo(() => ({
    downloadedPackageName: updateDebugLogs.downloadedPackageName,
    downloadedVersionName: updateDebugLogs.downloadedVersionName,
    downloadedVersionCode: updateDebugLogs.downloadedVersionCode,
    downloadedSigningSha256: updateDebugLogs.downloadedSigningSha256,
    downloadedIsValidApk: updateDebugLogs.downloadedIsValidApk,
    eligibilityPackageNameMatch: updateDebugLogs.eligibilityPackageNameMatch,
    eligibilitySigningMatch: updateDebugLogs.eligibilitySigningMatch,
    eligibilityVersionCodeHigher: updateDebugLogs.eligibilityVersionCodeHigher
  }), []);

  const metadataData = useMemo(() => ({
    sourceUsed: releaseMetadataInspector.sourceUsed,
    cacheSource: releaseMetadataInspector.cacheSource,
    rawVersionJson: String(releaseMetadataInspector.rawVersionJson || '').substring(0, 120),
    timestamp: releaseMetadataInspector.timestamp
  }), []);

  const errorData = useMemo(() => ({
    error,
    exceptionMessage: updateDiagnostics.exceptionMessage,
    failureReason: updateDiagnostics.failureReason,
    installError: updateDebugLogs.installError,
    lastExceptionStackTrace: updateDebugLogs.lastExceptionStackTrace,
    consecutiveFailures,
    recoveryMode,
    rootCause: updateDebugLogs.rootCause,
    suggestedFix: updateDebugLogs.suggestedFix
  }), [error, consecutiveFailures, recoveryMode]);

  const envData = useMemo(() => ({
    androidVersion: updateDiagnostics.androidVersion,
    deviceModel: updateDiagnostics.deviceModel,
    architecture: updateDiagnostics.architecture,
    networkState: updateDiagnostics.networkState,
    permissionState: updateDiagnostics.permissionState,
    platformDetected: updateDebugLogs.platformDetected
  }), []);

  return (
    <div
      style={{
        background: 'var(--app-surface-low, #1e1e1e)',
        border: '1px solid rgba(128,128,128,0.15)',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: 'Manrope, sans-serif',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        overflowY: 'auto',
        maxHeight: '100%',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(128,128,128,0.1)',
          paddingBottom: '10px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {onBack && (
            <span
              className="material-symbols-outlined"
              style={{ cursor: 'pointer', fontSize: '20px' }}
              onClick={onBack}
            >
              arrow_back
            </span>
          )}
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--c-accent, #4f46e5)', fontSize: '22px' }}
          >
            build_circle
          </span>
          Updater Engineering Diagnostics
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Copy Diagnostics"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                content_copy
              </span>
            </button>
            {toast && (
              <span style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', fontSize: '11px', background: '#34d399', color: '#000', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                Copied!
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(79, 70, 229, 0.15)',
              color: '#818cf8',
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Developer Mode Only
          </span>
        </div>
      </div>

      {/* Grid of key metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(128,128,128,0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>State</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-accent, #4f46e5)', marginTop: '4px' }}>{updateState}</div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(128,128,128,0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Version</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>{APP_VERSION}</div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(128,128,128,0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Remote Version</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>{remoteVersion || 'Unknown'}</div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(128,128,128,0.05)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Pipeline Stage</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>{updateDiagnostics.activeAsyncStage || 'idle'}</div>
        </div>
      </div>

      <Section title="Version Information">
        <MetricItem label="APP_VERSION" value={versionData.appVersion} valueColor="#34d399" />
        <MetricItem label="NATIVE_VERSION" value={versionData.nativeVersion} />
        <MetricItem label="NATIVE_VERSION_CODE" value={versionData.nativeVersionCode} />
        <MetricItem label="Remote Version" value={versionData.remoteVersion} valueColor="#60a5fa" />
        <MetricItem label="Remote Version Code" value={versionData.remoteVersionCode} />
        <MetricItem label="Version Comparison Result" value={versionData.versionComparisonResult} />
      </Section>

      <Section title="Update State">
        <MetricItem label="Update State" value={updateStateData.updateState} valueColor="var(--c-accent, #4f46e5)" />
        <MetricItem label="Update Available" value={updateStateData.updateAvailable} valueColor={updateStateData.updateAvailable ? '#34d399' : undefined} />
        <MetricItem label="Mandatory" value={updateStateData.mandatory} />
        <MetricItem label="Update Type" value={updateStateData.updateType} />
        <MetricItem label="Final Decision" value={updateStateData.finalDecision} />
        <MetricItem label="Update Decision Reason" value={updateStateData.updateDecisionReason} />
        <MetricItem label="Eligibility Reason" value={updateStateData.eligibilityReason} />
        <MetricItem label="Final Path Executed" value={updateStateData.finalPathExecuted} />
      </Section>

      <Section title="Pipeline">
        <MetricItem label="Pipeline ID" value={pipelineData.pipelineId} />
        <MetricItem label="Trigger Source" value={pipelineData.triggerSource} />
        <MetricItem label="Pipeline Owner" value={pipelineData.pipelineOwner} />
        <MetricItem label="Active Async Stage" value={pipelineData.activeAsyncStage} valueColor="#fbbf24" />
        <MetricItem label="Queue Depth" value={pipelineData.queueDepth} />
        <MetricItem label="Pipeline Duration" value={pipelineData.pipelineDuration} />
      </Section>

      <Section title="Download & Verification">
        <MetricItem label="APK URL" value={downloadData.apkUrl} />
        <MetricItem label="APK SHA256" value={downloadData.apkSha256} />
        <MetricItem label="Download Status" value={downloadData.downloadStatus} />
        <MetricItem label="SHA Verification" value={downloadData.shaVerification} />
        <MetricItem label="File Details" value={downloadData.fileDetails} />
        <MetricItem label="Download URL" value={downloadData.downloadUrl} />
        <MetricItem label="File Size" value={downloadData.fileSize} />
      </Section>

      <Section title="Package Validation">
        <MetricItem label="Downloaded Package Name" value={validationData.downloadedPackageName} />
        <MetricItem label="Downloaded Version Name" value={validationData.downloadedVersionName} />
        <MetricItem label="Downloaded Version Code" value={validationData.downloadedVersionCode} />
        <MetricItem label="Downloaded Signing SHA256" value={validationData.downloadedSigningSha256} />
        <MetricItem label="Downloaded Is Valid APK" value={validationData.downloadedIsValidApk} />
        <MetricItem label="Eligibility Package Name Match" value={validationData.eligibilityPackageNameMatch} />
        <MetricItem label="Eligibility Signing Match" value={validationData.eligibilitySigningMatch} />
        <MetricItem label="Eligibility Version Code Higher" value={validationData.eligibilityVersionCodeHigher} />
      </Section>

      <Section title="Metadata Sources">
        <MetricItem label="Source Used" value={metadataData.sourceUsed} />
        <MetricItem label="Cache Source" value={metadataData.cacheSource} />
        <MetricItem label="Raw Version JSON" value={metadataData.rawVersionJson} />
        <MetricItem label="Timestamp" value={metadataData.timestamp} />
      </Section>

      <Section title="Errors & Recovery">
        <MetricItem label="Error" value={errorData.error} valueColor={errorData.error ? '#f43f5e' : undefined} />
        <MetricItem label="Exception Message" value={errorData.exceptionMessage} valueColor={errorData.exceptionMessage ? '#f43f5e' : undefined} />
        <MetricItem label="Failure Reason" value={errorData.failureReason} />
        <MetricItem label="Install Error" value={errorData.installError} />
        <MetricItem label="Last Exception Stack Trace" value={errorData.lastExceptionStackTrace} />
        <MetricItem label="Consecutive Failures" value={errorData.consecutiveFailures} />
        <MetricItem label="Recovery Mode" value={errorData.recoveryMode} />
        <MetricItem label="Root Cause" value={errorData.rootCause} />
        <MetricItem label="Suggested Fix" value={errorData.suggestedFix} />
      </Section>

      <Section title="Environment">
        <MetricItem label="Android Version" value={envData.androidVersion} />
        <MetricItem label="Device Model" value={envData.deviceModel} />
        <MetricItem label="Architecture" value={envData.architecture} />
        <MetricItem label="Network State" value={envData.networkState} />
        <MetricItem label="Permission State" value={envData.permissionState} />
        <MetricItem label="Platform Detected" value={envData.platformDetected} />
      </Section>
    </div>
  );
};

export default UpdaterDiagnosticsPage;
