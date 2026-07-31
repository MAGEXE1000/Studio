import React from 'react';
import { motion } from 'motion/react';

export interface COSSProgressProps {
  value: number; // 0 - 100
  label?: string;
  accentFrom?: string;
  accentTo?: string;
  isLight?: boolean;
  showPercentage?: boolean;
}

export default function COSSProgress({
  value,
  label = 'Downloading update',
  accentFrom = '#6366f1',
  accentTo = '#8b5cf6',
  isLight = false,
  showPercentage = true,
}: COSSProgressProps) {
  const clampValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'Manrope, sans-serif',
          color: isLight ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <span>{label}</span>
        {showPercentage && <span>{clampValue}%</span>}
      </div>

      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampValue}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
            borderRadius: 3,
            boxShadow: `0 0 10px color-mix(in srgb, ${accentFrom} 50%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
