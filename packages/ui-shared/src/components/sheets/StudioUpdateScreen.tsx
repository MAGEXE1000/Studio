import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdaterFlightRecorder } from '@workspace/studio-core';

interface StudioUpdateScreenProps {
  state: string;
  progress: number;
  accentFrom: string;
  accentTo: string;
  title: string;
  description: React.ReactNode;
  iconName: string;
  iconColor: string;
  showSpinner: boolean;
  showProgress: boolean;
  actionButtons?: React.ReactNode;
  changelog?: React.ReactNode;
  isRequired?: boolean;
  onClose?: () => void;
  downloadSpeedMBs?: number;
  downloadRemainingSeconds?: number;
  downloadedMB?: number;
  totalMB?: number;
  isLight?: boolean;
  fromVersion?: string;
  toVersion?: string;
}

export default function StudioUpdateScreen({
  state,
  progress,
  accentFrom,
  accentTo,
  title,
  description,
  iconName,
  iconColor,
  showSpinner,
  showProgress,
  actionButtons,
  changelog,
  isRequired,
  onClose,
  downloadSpeedMBs,
  downloadRemainingSeconds,
  downloadedMB,
  totalMB,
  isLight = false,
  fromVersion,
  toVersion,
}: StudioUpdateScreenProps) {
  // Record render of StudioUpdateScreen
  UpdaterFlightRecorder.record({
    thread: 'ui',
    sessionId: null,
    workflowId: null,
    eventType: 'StudioUpdateScreenRender',
    caller: 'StudioUpdateScreen',
    reason: `Rendered StudioUpdateScreen with state: ${state} and progress: ${Math.round(progress * 100)}%`
  });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const pct = Math.round(progress * 100);

  // Disable closing during critical non-cancellable installation steps
  const canClose = [
    'available',
    'idle',
    'failed',
    'install_failed',
    'signature_mismatch',
    'reinstall_warning',
    'github_confirm',
    'manual_apk_required',
    'versionCode_low',
    'installedOrReady',
    'installed',
    'update_success',
    'completed',
  ].includes(state);

  const isInstalling = ['installing', 'packageinstaller_visible', 'waitingForUserInstallConfirmation'].includes(state);

  // Material 3 Emphasized motion curve (deceleration ease)
  const emphasizedTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

  // Premium, high-performance CSS animation styles
  const customKeyframes = `
    @keyframes ota-shimmer-fast {
      0% { transform: translateX(-150%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes ota-spin-m3 {
      to { transform: rotate(360deg); }
    }
    @keyframes ota-pulse-subtle {
      0%, 100% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.025) translateY(-3px); }
    }
  `;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        overflowY: 'auto',
        background: isLight ? 'rgba(235, 235, 240, 0.4)' : 'rgba(10, 10, 12, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="updater-dialog-title"
    >
      <style>{customKeyframes}</style>

      {/* Top Header Dismiss Row */}
      {canClose && onClose && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClose}
          aria-label="Close update panel"
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            right: 16,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLight ? 'rgba(0, 0, 0, 0.8)' : '#ffffff',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 200ms ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </motion.button>
      )}

      {/* Glassmorphic Display Card */}
      <motion.div
        layout
        transition={emphasizedTransition}
        style={{
          width: '100%',
          maxWidth: 380,
          background: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(20, 20, 24, 0.78)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 28,
          padding: '32px 24px',
          boxSizing: 'border-box',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isLight ? '0 16px 36px rgba(0, 0, 0, 0.08)' : '0 24px 48px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
        }}
      >
        {/* Unified Icon Header with layout morphing */}
        <motion.div
          layoutId="ota-icon-container"
          transition={emphasizedTransition}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: showSpinner ? (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.03)') : `color-mix(in srgb, ${iconColor} 12%, ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(20, 20, 24, 0.85)'})`,
            border: `1.5px solid ${showSpinner ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.1)') : `color-mix(in srgb, ${iconColor} 24%, transparent)`}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showSpinner ? 'none' : `0 0 24px color-mix(in srgb, ${iconColor} 15%, transparent)`,
            position: 'relative',
            animation: (isInstalling && !reducedMotion) ? 'ota-pulse-subtle 2.5s ease-in-out infinite' : 'none',
            willChange: 'transform',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={showSpinner ? 'spinner' : iconName}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {showSpinner ? (
                <svg
                  width={34}
                  height={34}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  style={{
                    animation: reducedMotion ? 'none' : 'ota-spin-m3 1.2s linear infinite',
                    color: iconColor,
                    willChange: 'transform',
                  }}
                >
                  <circle cx="12" cy="12" r="10" stroke={isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'} strokeWidth={3} />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#ota-spinner-grad)" strokeWidth={3} />
                  <defs>
                    <linearGradient id="ota-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accentFrom} />
                      <stop offset="100%" stopColor={accentTo} />
                    </linearGradient>
                  </defs>
                </svg>
              ) : iconName === 'github' ? (
                <svg viewBox="0 0 24 24" width={30} height={30} fill={isLight ? 'rgba(0, 0, 0, 0.95)' : '#ffffff'} style={{ flexShrink: 0 }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 34, color: iconColor }}>
                  {iconName}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Version comparison row */}
        {fromVersion && toVersion && (
          <motion.div
            layout="position"
            transition={emphasizedTransition}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              padding: '12px 24px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'Manrope, sans-serif' }}>Current</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif' }}>{fromVersion}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', color: accentFrom }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'Manrope, sans-serif' }}>New</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: isLight ? 'rgba(0,0,0,0.95)' : '#ffffff', fontFamily: 'Inter, sans-serif' }}>{toVersion}</span>
            </div>
          </motion.div>
        )}

        {/* Text Title */}
        <motion.h2
          id="updater-dialog-title"
          layout="position"
          transition={emphasizedTransition}
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: '-0.02em',
            color: isLight ? '#121214' : '#ffffff',
          }}
        >
          {title}
        </motion.h2>

        {/* Description Section */}
        <motion.div
          layout="position"
          transition={emphasizedTransition}
          style={{
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.5,
            color: isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)',
            width: '100%',
          }}
          role="status"
          aria-live="polite"
        >
          {description}
        </motion.div>

        {/* Dynamic Changelog Area */}
        <AnimatePresence>
          {changelog && (
            <motion.div
              key="changelog-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{ width: '100%', overflow: 'hidden' }}
            >
              {changelog}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Linear Progress Section with download speed and time metrics */}
        <AnimatePresence>
          {showProgress && (
            <motion.div
              key="progress-bar-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, fontFamily: 'Manrope', color: isLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)' }}>
                <span>Downloading update</span>
                <span>{pct}%</span>
              </div>
              
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
                  }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontFamily: 'Inter, monospace', color: isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.55)' }}>
                <span>
                  {downloadedMB && totalMB 
                    ? `${downloadedMB.toFixed(1)} MB / ${totalMB.toFixed(1)} MB` 
                    : 'Calculating size...'}
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  {downloadSpeedMBs !== undefined && downloadSpeedMBs > 0 && (
                    <span>
                      {downloadSpeedMBs >= 1 
                        ? `${downloadSpeedMBs.toFixed(1)} MB/s` 
                        : `${(downloadSpeedMBs * 1024).toFixed(0)} KB/s`}
                    </span>
                  )}
                  {downloadRemainingSeconds !== undefined && downloadRemainingSeconds > 0 && (
                    <span>
                      • {downloadRemainingSeconds < 60 
                        ? `${Math.round(downloadRemainingSeconds)}s remaining` 
                        : `${Math.floor(downloadRemainingSeconds / 60)}m ${Math.round(downloadRemainingSeconds % 60)}s remaining`}
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indeterminate Installing Progress Bar */}
        <AnimatePresence>
          {isInstalling && (
            <motion.div
              key="installing-progress-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, fontFamily: 'Manrope', color: isLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)' }}>
                <span>Installing update</span>
                <span>In progress</span>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '45%',
                  background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
                  borderRadius: 3,
                  animation: reducedMotion ? 'none' : 'ota-shimmer-fast 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform',
                }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mandatory Requirement Flag */}
        <AnimatePresence>
          {isRequired && (
            <motion.p
              key="mandatory-tag"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{
                margin: 0,
                fontSize: 12,
                fontFamily: 'Manrope',
                fontWeight: 700,
                color: '#f59e0b',
                overflow: 'hidden',
              }}
            >
              This update is required.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Unified Bottom Action Buttons */}
        <AnimatePresence>
          {actionButtons && (
            <motion.div
              key="action-buttons-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, overflow: 'hidden' }}
            >
              {actionButtons}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
