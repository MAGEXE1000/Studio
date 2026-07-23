import React from 'react';
import { motion } from 'motion/react';

interface ComingSoonPlaceholderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  onBack?: () => void;
}

export const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
  title = 'Coming Soon',
  subtitle = 'Feature Under Maintenance & Polish',
  description = 'This section is currently being redesigned to meet Studio (Livex) high performance and aesthetic standards. Check back in an upcoming release!',
  icon = 'construction',
  onBack,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '360px',
        padding: '32px 24px',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '420px',
          width: '100%',
          background: 'var(--app-surface, rgba(255,255,255,0.04))',
          border: '1px solid rgba(128,128,128,0.12)',
          borderRadius: '24px',
          padding: '40px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
            border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: '#3b82f6',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
            {icon}
          </span>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#3b82f6',
            marginBottom: '8px',
          }}
        >
          {subtitle}
        </span>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--c-text-primary, #ffffff)',
            margin: '0 0 12px 0',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'var(--c-text-secondary, rgba(255,255,255,0.6))',
            margin: '0 0 24px 0',
          }}
        >
          {description}
        </p>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--c-text-primary, #ffffff)',
              color: 'var(--app-bg, #000000)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 120ms ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            Return to Settings
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default ComingSoonPlaceholder;
