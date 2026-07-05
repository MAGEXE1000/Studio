import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StudioProgressBar from './StudioProgressBar';
import StudioUpdateAuroraBackground from './StudioUpdateAuroraBackground';
import StudioCountUpPercentage from './StudioCountUpPercentage';
import { isNative } from '@workspace/studio-core';

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
}: StudioUpdateScreenProps) {
  const pct = Math.round(progress * 100);

  // Disable header/close for critical non-cancellable phases
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
  ].includes(state);

  const isInstalling = ['installing', 'waitingForUserInstallConfirmation'].includes(state);

  // Shimmer overlay style for custom indeterminate bar
  const shimmerKeyframes = `
    @keyframes ota-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes ota-spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        overflowY: 'auto',
        background: 'var(--app-bg, #0a0a0c)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <style>{shimmerKeyframes}</style>
      <StudioUpdateAuroraBackground
        accentFrom={accentFrom}
        accentTo={accentTo}
        className="w-full h-full flex items-center justify-center"
        style={{ position: 'fixed', inset: 0, zIndex: -1 }}
      />

      {/* Top Header Row */}
      {canClose && onClose && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--c-text-primary)',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </motion.button>
      )}

      {/* Glassmorphic Display Card */}
      <motion.div
        layout="position"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(20, 20, 25, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          padding: '28px 24px',
          boxSizing: 'border-box',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
        }}
      >
        {/* Animated Icon Header */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: showSpinner ? 'rgba(255,255,255,0.03)' : `color-mix(in srgb, ${iconColor} 12%, rgba(20, 20, 25, 0.8))`,
          border: `1.5px solid ${showSpinner ? 'rgba(255,255,255,0.08)' : `color-mix(in srgb, ${iconColor} 30%, transparent)`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: showSpinner ? 'none' : `0 0 24px color-mix(in srgb, ${iconColor} 15%, transparent)`,
          marginBottom: 6,
          position: 'relative',
        }}>
          {showSpinner ? (
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.2}
              strokeLinecap="round"
              style={{
                animation: 'ota-spin 1.2s linear infinite',
                color: iconColor,
              }}
            >
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth={3.2} />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#ota-spinner-grad)" strokeWidth={3.2} />
              <defs>
                <linearGradient id="ota-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={accentFrom} />
                  <stop offset="100%" stopColor={accentTo} />
                </linearGradient>
              </defs>
            </svg>
          ) : iconName === 'github' ? (
            <svg viewBox="0 0 24 24" width={28} height={28} fill="var(--c-text-primary)" style={{ flexShrink: 0 }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: iconColor }}>
              {iconName}
            </span>
          )}
        </div>

        {/* Text Title */}
        <h2 style={{
          margin: 0,
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: '-0.02em',
          color: 'var(--c-text-primary)',
        }}>{title}</h2>

        {/* Description Section */}
        <div style={{
          fontSize: 13.5,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.55,
          color: 'var(--c-text-secondary)',
          width: '100%',
        }}>
          {description}
        </div>

        {/* Dynamic Changelog Section */}
        {changelog}

        {/* Progress Section */}
        {showProgress && (
          <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
              <span>Downloading update</span>
              <span>{pct}%</span>
            </div>
            <StudioProgressBar
              value={pct}
              accentFrom={accentFrom}
              accentTo={accentTo}
              height={6}
            />
          </div>
        )}

        {/* Indeterminate Installing Progress Bar */}
        {isInstalling && (
          <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
              <span>Installing updates</span>
              <span>In progress</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.06)',
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
                animation: 'ota-shimmer 1.5s infinite linear',
              }} />
            </div>
          </div>
        )}

        {/* Mandatory tag */}
        {isRequired && (
          <p style={{
            margin: '4px 0 0',
            fontSize: 12,
            fontFamily: 'Manrope',
            fontWeight: 700,
            color: '#f59e0b',
          }}>
            This update is required.
          </p>
        )}

        {/* Action Buttons Section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {actionButtons}
        </div>
      </motion.div>
    </motion.div>
  );
}
