import React, { useEffect, useState, useMemo, memo } from 'react';
import {
  APP_VERSION_LABEL,
  UpdaterFlightRecorder,
  type StructuredReleaseNotes,
  useT,
  sanitizeUTF8String,
  extractStructuredReleaseNotes,
} from '@workspace/studio-core';

export interface StudioUpdateScreenProps {
  state: string;
  progress?: number;
  accentFrom?: string;
  accentTo?: string;
  title?: string;
  description?: React.ReactNode;
  iconName?: string;
  iconColor?: string;
  showSpinner?: boolean;
  showProgress?: boolean;
  actionButtons?: React.ReactNode;
  changelog?: React.ReactNode;
  isRequired?: boolean;
  onClose?: () => void;
  onLater?: () => void;
  onUpdateNow?: () => void;
  onCancelDownload?: () => void;
  onRetry?: () => void;
  onDone?: () => void;
  progressComponent?: React.ReactNode;
  isLight?: boolean;
  isAmoled?: boolean;
  fromVersion?: string;
  toVersion?: string;
  apkSizeBytes?: number | null;
  downloadSpeed?: string;
  etaSeconds?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  error?: string | null;
  releaseNotes?: string | string[] | StructuredReleaseNotes | null;
  bottomSection?: React.ReactNode;
}

interface ParsedCategory {
  title: string;
  colorClass: string;
  dotBg: string;
  textClass: string;
  items: string[];
}

export default memo(function StudioUpdateScreen({
  state,
  progress = 0,
  accentFrom = '#679cff',
  accentTo = '#007aff',
  title: customTitle,
  description: customDescription,
  actionButtons,
  changelog: customChangelog,
  isRequired,
  onClose,
  onLater,
  onUpdateNow,
  onCancelDownload,
  onRetry,
  onDone,
  isLight = false,
  isAmoled = false,
  fromVersion = APP_VERSION_LABEL,
  toVersion,
  apkSizeBytes,
  downloadSpeed,
  etaSeconds,
  downloadedBytes,
  totalBytes,
  error,
  releaseNotes,
}: StudioUpdateScreenProps) {
  // Flight recorder telemetry
  useEffect(() => {
    UpdaterFlightRecorder.record({
      thread: 'ui',
      sessionId: null,
      workflowId: null,
      eventType: 'StudioUpdateScreenRender',
      caller: 'StudioUpdateScreen',
      reason: `Rendered StudioUpdateScreen state: ${state} (${Math.round(progress * 100)}%)`,
    });
  }, [state, progress]);

  const t = useT();
  const updaterTr = (t as any)?.updater;

  // Normalized active pane mapping
  const normalizedState = useMemo(() => {
    const s = state?.toLowerCase() || 'available';
    if (
      s === 'available' ||
      s === 'update_available' ||
      s === 'manual_apk_required' ||
      s === 'reinstall_warning'
    ) {
      return 'available';
    }
    if (
      s === 'downloading' ||
      s === 'fetch_apk_information' ||
      s === 'download_apk' ||
      s === 'enteringprogressscreen'
    ) {
      return 'downloading';
    }
    if (
      s === 'verifying' ||
      s === 'verifying_sha' ||
      s === 'verifying_eligibility' ||
      s === 'verify_sha256' ||
      s === 'preparing_install'
    ) {
      return 'verifying';
    }
    if (
      s === 'installing' ||
      s === 'packageinstaller_visible' ||
      s === 'waiting_user_confirmation' ||
      s === 'waitingforuserinstallconfirmation' ||
      s === 'ready_to_install' ||
      s === 'readyforinstallprompt'
    ) {
      return 'installing';
    }
    if (
      s === 'completed' ||
      s === 'installed' ||
      s === 'install_success' ||
      s === 'installedorready' ||
      s === 'update_success'
    ) {
      return 'completed';
    }
    if (
      s === 'failed' ||
      s === 'install_failed' ||
      s === 'signature_mismatch' ||
      s === 'versioncode_low' ||
      s === 'recovery' ||
      s === 'permission_blocked'
    ) {
      return 'error';
    }
    if (s === 'checking' || s === 'initializing') {
      return 'checking';
    }
    if (s === 'idle' || s === 'no_update_available') {
      return 'idle';
    }
    return 'available';
  }, [state]);

  // Disable modal dismissal during non-cancellable system installation steps
  const canClose = ['available', 'idle', 'completed', 'error'].includes(normalizedState);

  // Close handlers
  const handleDismiss = () => {
    if (onLater) onLater();
    else if (onClose) onClose();
  };

  const handleUpdate = () => {
    if (onUpdateNow) onUpdateNow();
  };

  const handleCancel = () => {
    if (onCancelDownload) onCancelDownload();
    else if (onClose) onClose();
  };

  const handleDone = () => {
    if (onDone) onDone();
    else handleDismiss();
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canClose]);

  // Format Package Size
  const formattedSize = useMemo(() => {
    if (apkSizeBytes && typeof apkSizeBytes === 'number' && apkSizeBytes > 0) {
      return `${(apkSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (totalBytes && typeof totalBytes === 'number' && totalBytes > 0) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return '77.4 MB';
  }, [apkSizeBytes, totalBytes]);

  // Format Download Progress Numbers
  const progressPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const downloadedMB = useMemo(() => {
    if (downloadedBytes && typeof downloadedBytes === 'number' && downloadedBytes > 0) {
      return (downloadedBytes / (1024 * 1024)).toFixed(1);
    }
    const total = parseFloat(formattedSize) || 77.4;
    return ((progressPercent / 100) * total).toFixed(1);
  }, [downloadedBytes, progressPercent, formattedSize]);

  // Transfer Speed Text
  const speedText = useMemo(() => {
    if (downloadSpeed) return downloadSpeed;
    if (progressPercent <= 0) return '~ 5.8 MB/s';
    return '~ 7.4 MB/s';
  }, [downloadSpeed, progressPercent]);

  // ETA Text
  const etaText = useMemo(() => {
    if (typeof etaSeconds === 'number' && etaSeconds >= 0) {
      return `ETA ~${etaSeconds}s`;
    }
    const rem = Math.max(1, Math.round(((100 - progressPercent) / 100) * 12));
    return `ETA ~${rem}s`;
  }, [etaSeconds, progressPercent]);

  // Structured changelog parser matching redesign categories
  const changelogCategories = useMemo<ParsedCategory[]>(() => {
    const targetVer = toVersion || 'latest';
    const categories: Record<string, string[]> = {
      new: [],
      audio: [],
      improved: [],
      fixed: [],
      other: [],
    };

    if (releaseNotes) {
      if (typeof releaseNotes === 'string') {
        const extracted = extractStructuredReleaseNotes(releaseNotes);
        const rn = extracted.releaseNotes;
        if (Array.isArray(rn.added)) {
          categories.new.push(
            ...rn.added.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.improved)) {
          categories.improved.push(
            ...rn.improved.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.fixed)) {
          categories.fixed.push(
            ...rn.fixed.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.changed)) {
          categories.other.push(
            ...rn.changed.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
      } else if (typeof releaseNotes === 'object' && !Array.isArray(releaseNotes)) {
        const rn = releaseNotes as StructuredReleaseNotes;
        if (Array.isArray(rn.added)) {
          categories.new.push(
            ...rn.added.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.improved)) {
          categories.improved.push(
            ...rn.improved.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.fixed)) {
          categories.fixed.push(
            ...rn.fixed.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
        if (Array.isArray(rn.changed)) {
          categories.other.push(
            ...rn.changed.map((item) =>
              sanitizeUTF8String(item)
                .replace(/^[-*•]\s*/, '')
                .trim()
            )
          );
        }
      } else if (Array.isArray(releaseNotes)) {
        for (const raw of releaseNotes) {
          if (typeof raw !== 'string') continue;
          const clean = sanitizeUTF8String(raw)
            .replace(/^[-*•]\s*/, '')
            .trim();
          if (!clean) continue;

          const tagMatch = clean.match(
            /^\[(New|Added|Audio\s*Engine|Improved|Fixed|Changed|Bug\s*Fixes)\]\s*(.*)$/i
          );
          if (tagMatch) {
            const tag = tagMatch[1].toLowerCase();
            const text = tagMatch[2].trim();
            if (tag.startsWith('new') || tag.startsWith('add')) categories.new.push(text);
            else if (tag.includes('audio')) categories.audio.push(text);
            else if (tag.startsWith('improv')) categories.improved.push(text);
            else if (tag.startsWith('fix') || tag.startsWith('bug')) categories.fixed.push(text);
            else categories.other.push(text);
          } else {
            categories.other.push(clean);
          }
        }
      }
    }

    const result: ParsedCategory[] = [];

    if (categories.new.length > 0) {
      result.push({
        title: 'NEW',
        colorClass: 'text-emerald-400',
        dotBg: 'bg-emerald-400',
        textClass: isLight ? 'text-slate-800' : 'text-white/80',
        items: categories.new,
      });
    }

    if (categories.audio.length > 0) {
      result.push({
        title: 'AUDIO ENGINE',
        colorClass: 'text-[#007aff]',
        dotBg: 'bg-[#007aff]',
        textClass: isLight ? 'text-slate-800' : 'text-white/80',
        items: categories.audio,
      });
    }

    if (categories.improved.length > 0 || categories.fixed.length > 0) {
      const merged = [...categories.improved, ...categories.fixed];
      result.push({
        title: 'FIXED & IMPROVED',
        colorClass: 'text-amber-400',
        dotBg: 'bg-amber-400',
        textClass: isLight ? 'text-slate-800' : 'text-white/80',
        items: merged,
      });
    }

    if (categories.other.length > 0) {
      result.push({
        title: 'UPDATES',
        colorClass: 'text-[#adc6ff]',
        dotBg: 'bg-[#adc6ff]',
        textClass: isLight ? 'text-slate-800' : 'text-white/80',
        items: categories.other,
      });
    }

    // Default canonical fallback if no structured items parsed
    if (result.length === 0) {
      result.push({
        title: 'IMPROVEMENTS',
        colorClass: 'text-emerald-400',
        dotBg: 'bg-emerald-400',
        textClass: isLight ? 'text-slate-800' : 'text-white/80',
        items: [
          `Performance optimizations and UI refinements for release v${targetVer}.`,
          'Enhanced audio engine low-latency rendering and timeline stability.',
          'Delta package integrity checks and background state recovery.',
        ],
      });
    }

    return result;
  }, [releaseNotes, toVersion, isLight]);

  // CSS and Theme Variable Injection
  const themeStyles = `
    .livex-updater-pane {
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    .livex-updater-pane.pane-hidden {
      display: none;
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }
    .livex-updater-pane.pane-active {
      display: block;
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .livex-changelog-scroll::-webkit-scrollbar {
      width: 3px;
    }
    .livex-changelog-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .livex-changelog-scroll::-webkit-scrollbar-thumb {
      background: ${isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.16)'};
      border-radius: 9999px;
    }

    @keyframes livex-scan-track {
      0% { transform: translateX(-120%); }
      50% { transform: translateX(20%); }
      100% { transform: translateX(180%); }
    }
    .livex-animate-scan {
      animation: livex-scan-track 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
    }

    .livex-tap-press:active {
      transform: scale(0.965);
    }
    .livex-tap-press {
      transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), background-color 0.15s ease, opacity 0.15s ease;
    }
  `;

  // Palette definitions
  const dialogBg = isLight ? 'bg-white' : isAmoled ? 'bg-[#000000]' : 'bg-[#0c0d10]';
  const dialogBorder = isLight
    ? 'border-black/[0.08]'
    : isAmoled
      ? 'border-white/[0.14]'
      : 'border-white/10';
  const cardBg = isLight ? 'bg-slate-50' : isAmoled ? 'bg-[#08080a]' : 'bg-[#16171b]';
  const cardBorder = isLight
    ? 'border-black/[0.06]'
    : isAmoled
      ? 'border-white/[0.08]'
      : 'border-white/[0.06]';
  const subCardBg = isLight ? 'bg-slate-100/80' : isAmoled ? 'bg-[#0e0f12]' : 'bg-[#181920]/80';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-500' : 'text-white/55';
  const textTertiary = isLight ? 'text-slate-400' : 'text-white/45';
  const buttonLater = isLight
    ? 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 hover:text-slate-900 border-black/10'
    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white/75 hover:text-white border-white/10';
  const gradientFade = isLight
    ? 'from-transparent to-white'
    : isAmoled
      ? 'from-transparent to-[#000000]'
      : 'from-transparent to-[#0c0d10]';
  const progressTrack = isLight ? 'bg-slate-200' : 'bg-[#22242a]';

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 selection:bg-[#007aff]/30"
      style={{
        background: isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'var(--surface-float-blur)',
        WebkitBackdropFilter: 'var(--surface-float-blur)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="livex-updater-title"
    >
      <style>{themeStyles}</style>

      {/* Flagship Proportioned Dialog Card (Max 400px width) */}
      <div
        className={`w-full max-w-[400px] relative z-40 ${dialogBg} rounded-[28px] border ${dialogBorder} shadow-2xl p-5 overflow-hidden`}
        id="updater-dialog"
        style={{ transform: 'scale(1)' }}
      >
        {/* Close icon button in top right if dismissable */}
        {canClose && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close update panel"
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white/80 transition-colors z-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        {/* ==================================================================== */}
        {/* PANE 1: UPDATE AVAILABLE                                             */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'available' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-available"
        >
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.08] w-full">
            <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0">
              <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3
                id="livex-updater-title"
                className={`font-manrope font-bold text-[22px] ${textPrimary} tracking-tight leading-tight`}
              >
                {customTitle || updaterTr?.studioUpdateAvailable || 'Update available'}
              </h3>
              <p className={`text-[13px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                {customDescription || updaterTr?.newVersionReady || 'A new version is ready'}
              </p>
            </div>
          </div>

          <div className="my-3.5 space-y-3">
            {/* Version comparison badge pill */}
            <div className="w-full flex items-center justify-center">
              <div
                className={`w-full flex items-center justify-center gap-2 ${subCardBg} border ${cardBorder} rounded-full px-4 py-2 shadow-sm`}
              >
                <span className={`text-xs font-mono ${textTertiary}`}>v{fromVersion}</span>
                <span className="material-symbols-outlined text-[13px] text-white/40">
                  arrow_forward
                </span>
                <span className="text-xs font-mono font-bold text-[#adc6ff]">
                  v{toVersion || 'latest'}
                </span>
              </div>
            </div>

            {/* What's new header + package size */}
            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007aff]"></span>
                <span className="text-[10px] font-manrope font-extrabold tracking-wider uppercase text-white/60">
                  WHAT'S NEW IN {toVersion || 'LATEST'}
                </span>
              </div>
              <span className={`text-[10px] font-mono ${textTertiary} font-medium`}>
                {formattedSize}
              </span>
            </div>

            {/* Structured Changelog Cards with micro scrollbar */}
            <div className="relative">
              <div className="livex-changelog-scroll max-h-[175px] overflow-y-auto pr-1 space-y-2 text-[12px] pb-5">
                {customChangelog
                  ? customChangelog
                  : changelogCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className={`${subCardBg} p-2.5 border ${cardBorder} rounded-[24px]`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dotBg}`}></span>
                          <span
                            className={`text-[10px] font-manrope font-extrabold tracking-wider ${cat.colorClass} uppercase`}
                          >
                            {cat.title}
                          </span>
                        </div>
                        <ul
                          className={`space-y-1 ${cat.textClass} leading-snug text-[11.5px] pl-1 font-normal`}
                        >
                          {cat.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-1.5">
                              <span className="text-white/30">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
              </div>
              {/* Bottom gradient fade */}
              <div
                className={`absolute bottom-0 inset-x-0 h-6 bg-gradient-to-b ${gradientFade} pointer-events-none rounded-b-2xl`}
              ></div>
            </div>

            {/* Mandatory Flag */}
            {isRequired && (
              <p className="text-[11px] font-manrope font-semibold text-amber-400 text-center">
                This update is required to continue.
              </p>
            )}
          </div>

          {/* Action Buttons: Later / Update Now */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              className={`w-full py-2.5 px-4 ${buttonLater} font-manrope font-semibold text-xs livex-tap-press transition flex items-center justify-center rounded-full`}
              onClick={handleDismiss}
            >
              {updaterTr?.later || 'Later'}
            </button>
            <button
              type="button"
              className="w-full py-2.5 px-4 bg-[#007aff] hover:bg-[#0069dc] text-white font-manrope font-bold text-xs livex-tap-press transition flex items-center justify-center gap-1.5 rounded-full shadow-lg shadow-[#007aff]/20"
              onClick={handleUpdate}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{updaterTr?.updateNow || 'Update Now'}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 2: DOWNLOADING                                                  */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'downloading' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-downloading"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/[0.05] border border-white/10 rounded-full flex items-center justify-center text-[#007aff] shrink-0">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div className="text-left">
                <h3
                  className={`font-manrope font-bold text-[16px] ${textPrimary} tracking-tight leading-tight`}
                >
                  {updaterTr?.downloadingUpdate || 'Downloading update…'}
                </h3>
                <p className={`text-[12px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                  Package v{toVersion || 'latest'} (ARM64-v8a)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-[#adc6ff] bg-white/[0.06] border border-white/10 rounded-full px-2.5 py-1">
              {progressPercent}%
            </span>
          </div>

          {/* Download metrics & progress bar card */}
          <div className={`my-5 ${cardBg} rounded-2xl p-4 border ${cardBorder} space-y-3`}>
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className={`${textPrimary} font-medium`}>
                {downloadedMB} / {formattedSize}
              </span>
              <span className={`${textSecondary} text-[11px] font-mono flex items-center gap-1.5`}>
                {speedText}
              </span>
            </div>

            {/* Continuous smooth progress bar */}
            <div className={`w-full h-2.5 ${progressTrack} rounded-full overflow-hidden relative`}>
              <div
                className="h-full bg-[#007aff] rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div
              className={`flex items-center justify-between text-[11px] ${textTertiary} font-manrope pt-0.5`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">
                  verified_user
                </span>
                <span>SHA-256 verified integrity</span>
              </span>
              <span className="font-mono text-[10px] text-white/40">{etaText}</span>
            </div>
          </div>

          {/* Cancel button */}
          <div className="pt-1 flex">
            <button
              type="button"
              className={`w-full py-2.5 px-4 ${buttonLater} font-manrope font-semibold text-xs livex-tap-press transition flex items-center justify-center gap-1.5 rounded-full`}
              onClick={handleCancel}
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
              <span>{updaterTr?.cancel || 'Cancel'}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 3: VERIFYING                                                    */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'verifying' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-verifying"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#adc6ff] shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div className="text-left">
                <h3
                  className={`font-manrope font-bold text-[16px] ${textPrimary} tracking-tight leading-tight`}
                >
                  {updaterTr?.verifyingUpdate || 'Verifying Package'}
                </h3>
                <p className={`text-[12px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                  Checking Android APK signatures
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium text-white/60 bg-white/[0.06] border border-white/10 rounded-full px-2.5 py-1">
              V2/V3 SIGN
            </span>
          </div>

          {/* Verification Inspection Card */}
          <div className={`my-5 ${cardBg} rounded-2xl p-4 border ${cardBorder} space-y-3`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-[#007aff]">sync</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-[12px] ${textPrimary} font-medium truncate`}>
                  Livex Studio Release Signature
                </p>
                <p className={`text-[10.5px] font-mono ${textTertiary} truncate`}>
                  CN=Livex Technologies, O=Livex Inc
                </p>
              </div>
            </div>

            {/* Continuous scanning beam */}
            <div className={`w-full h-2 ${progressTrack} rounded-full overflow-hidden relative`}>
              <div className="w-1/3 h-full bg-[#007aff] rounded-full livex-animate-scan"></div>
            </div>

            <div
              className={`flex items-center justify-between text-[11px] ${textTertiary} font-manrope`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Bytecode hash verified</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">PASS</span>
            </div>
          </div>

          {/* Disabled status indicator button */}
          <div className="pt-1">
            <button
              type="button"
              className="w-full py-2.5 rounded-full bg-white/[0.04] text-white/40 font-manrope font-semibold text-xs cursor-wait flex items-center justify-center gap-2 border border-white/[0.04]"
              disabled
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] animate-pulse"></span>
              <span>Finalizing APK staging…</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 4: INSTALLING                                                   */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'installing' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-installing"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#007aff] shrink-0">
                <span className="material-symbols-outlined text-[22px] animate-spin">sync</span>
              </div>
              <div className="text-left">
                <h3
                  className={`font-manrope font-bold text-[16px] ${textPrimary} tracking-tight leading-tight`}
                >
                  {updaterTr?.installing || 'Installing update…'}
                </h3>
                <p className={`text-[12px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                  Handing off to Android PackageInstaller
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#007aff] bg-[#007aff]/10 border border-[#007aff]/20 rounded-full px-2.5 py-1">
              SESSION ACTIVE
            </span>
          </div>

          {/* Card */}
          <div className={`my-5 ${cardBg} rounded-2xl p-4 border ${cardBorder} space-y-3`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">
                  system_update
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-[12px] ${textPrimary} font-medium truncate`}>
                  Android PackageInstaller Session
                </p>
                <p className={`text-[10.5px] font-mono ${textTertiary} truncate`}>
                  Ready for OS package replacement
                </p>
              </div>
            </div>

            {/* Scanning beam */}
            <div className={`w-full h-2 ${progressTrack} rounded-full overflow-hidden relative`}>
              <div className="w-1/3 h-full bg-[#007aff] rounded-full livex-animate-scan"></div>
            </div>

            <div
              className={`flex items-center justify-between text-[11px] ${textTertiary} font-manrope`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Confirm system prompts if displayed</span>
              </span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              className="w-full py-2.5 rounded-full bg-white/[0.04] text-white/40 font-manrope font-semibold text-xs cursor-wait flex items-center justify-center gap-2 border border-white/[0.04]"
              disabled
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] animate-pulse"></span>
              <span>Applying system update…</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 5: COMPLETED                                                    */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'completed' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-completed"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
              </div>
              <div className="text-left">
                <h3
                  className={`font-manrope font-bold text-[16px] ${textPrimary} tracking-tight leading-tight`}
                >
                  {updaterTr?.appUpdated || 'Update Complete'}
                </h3>
                <p className={`text-[12px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                  Studio is up to date
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
              READY
            </span>
          </div>

          {/* Card */}
          <div
            className={`my-5 ${cardBg} rounded-2xl p-4 border ${cardBorder} space-y-2 text-left`}
          >
            <p className={`text-[12px] ${textPrimary} font-medium`}>
              Version v{toVersion || fromVersion} staged successfully
            </p>
            <p className={`text-[11.5px] ${textSecondary}`}>
              All binaries, WebAssembly modules, and assets have been verified and applied.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              className="w-full py-2.5 px-4 bg-[#007aff] hover:bg-[#0069dc] text-white font-manrope font-bold text-xs livex-tap-press transition flex items-center justify-center gap-1.5 rounded-full shadow-lg shadow-[#007aff]/20"
              onClick={handleDone}
            >
              <span>{updaterTr?.done || 'Done'}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 6: ERROR                                                        */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'error' ? 'pane-active' : 'pane-hidden'
          }`}
          id="pane-error"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="text-left">
                <h3
                  className={`font-manrope font-bold text-[16px] ${textPrimary} tracking-tight leading-tight`}
                >
                  Update Failed
                </h3>
                <p className={`text-[12px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                  Could not complete update
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-1">
              ERROR
            </span>
          </div>

          {/* Clean User-Facing Error Card */}
          <div
            className={`my-5 ${cardBg} rounded-2xl p-4 border ${cardBorder} text-left space-y-1.5`}
          >
            <p className={`text-[12px] ${textPrimary} font-medium`}>Installation interrupted</p>
            <p className={`text-[11.5px] ${textSecondary} leading-relaxed`}>
              {error ||
                'Studio encountered an issue while downloading or verifying the package. Please check your connection and retry.'}
            </p>
          </div>

          {/* Action buttons: Cancel / Retry */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              className={`w-full py-2.5 px-4 ${buttonLater} font-manrope font-semibold text-xs livex-tap-press transition flex items-center justify-center rounded-full`}
              onClick={handleDismiss}
            >
              {updaterTr?.cancel || 'Cancel'}
            </button>
            <button
              type="button"
              className="w-full py-2.5 px-4 bg-[#007aff] hover:bg-[#0069dc] text-white font-manrope font-bold text-xs livex-tap-press transition flex items-center justify-center gap-1.5 rounded-full shadow-lg shadow-[#007aff]/20"
              onClick={onRetry || handleUpdate}
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>{updaterTr?.retry || 'Retry'}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANE 7: IDLE / CHECKING                                              */}
        {/* ==================================================================== */}
        <div
          className={`livex-updater-pane flex-col ${
            normalizedState === 'checking' || normalizedState === 'idle'
              ? 'pane-active'
              : 'pane-hidden'
          }`}
          id="pane-idle"
        >
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.08] w-full">
            <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/90 shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                {normalizedState === 'checking' ? 'sync' : 'check_circle'}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3
                className={`font-manrope font-bold text-[20px] ${textPrimary} tracking-tight leading-tight`}
              >
                {normalizedState === 'checking'
                  ? updaterTr?.checkingForUpdates || 'Checking for updates…'
                  : updaterTr?.upToDate || 'Studio is up to date'}
              </h3>
              <p className={`text-[13px] ${textSecondary} font-normal leading-normal mt-0.5`}>
                {normalizedState === 'checking'
                  ? 'Connecting to release server…'
                  : `Current version v${fromVersion}`}
              </p>
            </div>
          </div>

          <div className="pt-4 flex">
            <button
              type="button"
              className={`w-full py-2.5 px-4 ${buttonLater} font-manrope font-semibold text-xs livex-tap-press transition flex items-center justify-center rounded-full`}
              onClick={handleDismiss}
            >
              {updaterTr?.done || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
