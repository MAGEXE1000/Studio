import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdaterFlightRecorder, DurationPresets, EasingPresets } from '@workspace/studio-core';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';
import { Loader } from '../../../components/motion/loader';
import { MorphingModal } from '../../../components/motion/morphing-modal';


interface StudioUpdateScreenProps {
  state: string;
  progress?: number;
  accentFrom: string;
  accentTo: string;
  title: string;
  description: React.ReactNode;
  iconName: string;
  iconColor: string;
  showSpinner: boolean;
  showProgress?: boolean;
  actionButtons?: React.ReactNode;
  changelog?: React.ReactNode;
  isRequired?: boolean;
  onClose?: () => void;
  progressComponent?: React.ReactNode;
  isLight?: boolean;
  fromVersion?: string;
  toVersion?: string;
  bottomSection?: React.ReactNode;
}

export default memo(function StudioUpdateScreen({
  state,
  progress = 0,
  accentFrom,
  accentTo,
  title,
  description,
  iconName,
  iconColor,
  showSpinner,
  showProgress = false,
  actionButtons,
  changelog,
  isRequired,
  onClose,
  progressComponent,
  isLight = false,
  fromVersion,
  toVersion,
  bottomSection,
}: StudioUpdateScreenProps) {
  // Record render of StudioUpdateScreen
  UpdaterFlightRecorder.record({
    thread: 'ui',
    sessionId: null,
    workflowId: null,
    eventType: 'StudioUpdateScreenRender',
    caller: 'StudioUpdateScreen',
    reason: `Rendered StudioUpdateScreen with state: ${state} and progress: ${Math.round(progress * 100)}%`,
  });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

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

  const isInstalling = [
    'installing',
    'packageinstaller_visible',
    'waitingForUserInstallConfirmation',
  ].includes(state);

  // Material 3 Emphasized motion curve from central Motion Engine
  const emphasizedTransition = { duration: DurationPresets.slow, ease: EasingPresets.emphasized };

  // Keyframes for border pulse-glow and progress animation matching official HTML spec
  const customKeyframes = `
    @keyframes pulse-glow {
      0% { box-shadow: 0 0 0 0 rgba(103, 156, 255, 0.15); }
      50% { box-shadow: 0 0 24px 4px rgba(103, 156, 255, 0.3); }
      100% { box-shadow: 0 0 0 0 rgba(103, 156, 255, 0.15); }
    }
    .glow-animation {
      animation: pulse-glow 3s infinite ease-in-out;
    }
    @keyframes updater-spin-m3 {
      to { transform: rotate(360deg); }
    }
    @keyframes updater-shimmer-fast {
      0% { transform: translateX(-150%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(100%); }
    }
  `;

  // Map icon names to material symbols according to official HTML spec
  const getSymbolName = () => {
    if (showSpinner) return 'loader-circle';
    if (iconName === 'cloud_download' || iconName === 'download' || iconName === 'system_update') {
      return 'cloud_download';
    }
    if (iconName === 'check_circle' || iconName === 'task_alt') return 'check';
    if (iconName === 'error' || iconName === 'warning') return 'warning';
    if (iconName === 'security') return 'security';
    if (iconName === 'sync') return 'loader-circle';
    return iconName || 'cloud_download';
  };

  return (
    <MorphingModal
      viewId={state || 'update'}
      onClose={canClose && onClose ? onClose : () => {}}
      placement="center"
      className="glow-animation max-w-sm w-full p-8 text-center flex flex-col items-center gap-6"
    >
      <style>{customKeyframes}</style>
      <div className="relative w-full flex flex-col items-center gap-6 text-center">

        {/* Close Button matching HTML spec */}
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close update panel"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'transparent',
              border: 'none',
              color: isLight ? '#64748b' : '#acabaa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: '50%',
              transition: 'color 150ms ease',
            }}
          >
            <AnimatedIcon name="close" size={22} color="currentColor" />
          </button>
        )}

        {/* Icon Circle Header matching HTML spec */}
        {['idle', 'installed', 'update_success', 'completed', 'installedOrReady'].includes(state) ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0 6px' }}>
            <AnimatedIcon name="check" state="success" size={80} color="#22c55e" strokeWidth={3} />
          </div>
        ) : (
          <motion.div
            layoutId="updater-icon-container"
            transition={emphasizedTransition}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: isLight ? '#f1f5f9' : '#252626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: showSpinner ? 'rgba(103, 156, 255, 0.15)' : 'rgba(103, 156, 255, 0.1)',
              }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={showSpinner ? 'spinner' : getSymbolName()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                {showSpinner ? (
                  <Loader variant="spinner" size={36} />
                ) : (
                  <AnimatedIcon
                    name={getSymbolName()}
                    size={36}
                    color={iconColor ? iconColor : '#679cff'}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Headline & Subtitle matching HTML spec */}
        <motion.div
          layout="position"
          transition={emphasizedTransition}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            width: '100%',
          }}
        >
          <h2
            id="updater-dialog-title"
            style={{
              margin: 0,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: 24,
              color: isLight ? '#0f172a' : '#e7e5e4',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
          <div
            style={{
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              color: isLight ? '#475569' : '#acabaa',
              lineHeight: 1.45,
            }}
            role="status"
            aria-live="polite"
          >
            {description}
          </div>
        </motion.div>

        {/* Version Comparison Box matching HTML spec */}
        {fromVersion && toVersion && (
          <motion.div
            layout="position"
            transition={emphasizedTransition}
            style={{
              width: '100%',
              background: isLight ? '#f8fafc' : '#131313',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isLight ? '#64748b' : '#acabaa',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                }}
              >
                Current
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: isLight ? '#0f172a' : '#e7e5e4',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {fromVersion}
              </span>
            </div>

            <AnimatedIcon name="arrow-right" size={20} color="#679cff" />

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isLight ? '#64748b' : '#acabaa',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                }}
              >
                New
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isLight ? '#0f172a' : '#e7e5e4',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {toVersion}
              </span>
            </div>
          </motion.div>
        )}

        {/* Expandable Changelog Accordion matching HTML spec */}
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

        {/* Linear Progress Section */}
        {progressComponent}

        {/* Indeterminate Installing Progress Bar */}
        <AnimatePresence>
          {isInstalling && (
            <motion.div
              key="installing-progress-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Manrope, sans-serif',
                  color: '#e7e5e4',
                }}
              >
                <span>Installing update</span>
                <span>In progress</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: isLight ? 'rgba(0, 0, 0, 0.06)' : '#252626',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '45%',
                    background: `linear-gradient(135deg, var(--accent-from, ${accentFrom || '#679cff'}) 0%, var(--accent-to, ${accentTo || '#007aff'}) 100%)`,
                    borderRadius: 2,
                    animation: reducedMotion
                      ? 'none'
                      : 'updater-shimmer-fast 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
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
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                color: '#f59e0b',
                overflow: 'hidden',
              }}
            >
              This update is required.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Action Buttons matching HTML spec */}
        <AnimatePresence>
          {actionButtons && (
            <motion.div
              key="action-buttons-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                overflow: 'hidden',
              }}
            >
              {actionButtons}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Custom Section */}
        <AnimatePresence>
          {bottomSection && (
            <motion.div
              key="bottom-section-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={emphasizedTransition}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {bottomSection}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MorphingModal>

  );
});

