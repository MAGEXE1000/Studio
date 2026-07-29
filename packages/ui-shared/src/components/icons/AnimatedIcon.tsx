import React from 'react';
import { motion } from 'motion/react';
import { getBakaiIcon, type BakaiIconPath } from './bakaiIconLibrary';

export type IconState =
  | 'active'
  | 'inactive'
  | 'selected'
  | 'pressed'
  | 'loading'
  | 'disabled'
  | 'success'
  | 'warning'
  | 'error';

export interface AnimatedIconProps {
  name: string;
  size?: number;
  color?: string;
  state?: IconState;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  state = 'inactive',
  className = '',
  style,
  strokeWidth = 2,
  onClick,
}) => {
  const iconDef = getBakaiIcon(name);

  // Icon-specific physics mapping matching functional motion guidelines
  const getIconSpecificHover = () => {
    const lower = name.toLowerCase();
    if (lower.includes('setting') || lower.includes('gear')) {
      return { rotate: 90, scale: 1.08 };
    }
    if (lower.includes('bell') || lower.includes('notification')) {
      return { rotate: [0, -14, 14, -8, 4, 0], scale: 1.08 };
    }
    if (lower.includes('sync') || lower.includes('refresh') || lower.includes('update')) {
      return { rotate: 180, scale: 1.08 };
    }
    if (lower.includes('search')) {
      return { scale: 1.14, x: 1, y: -1 };
    }
    if (lower.includes('download')) {
      return { y: 2, scale: 1.08 };
    }
    if (lower.includes('upload')) {
      return { y: -2, scale: 1.08 };
    }
    if (lower.includes('profile') || lower.includes('user') || lower.includes('account')) {
      return { scale: 1.1, y: -1 };
    }
    if (lower.includes('favorite') || lower.includes('heart') || lower.includes('star')) {
      return { scale: 1.2, rotate: -4 };
    }
    if (lower.includes('lock') || lower.includes('security') || lower.includes('shield')) {
      return { scale: 1.12, rotate: [0, -6, 0] };
    }
    return { scale: 1.08, y: -1 };
  };

  // Motion physics configuration matching Bakai physical interaction philosophy
  const getStateVariants = () => {
    switch (state) {
      case 'active':
      case 'selected':
        return {
          scale: [0.92, 1.16, 1.08],
          rotate: [0, -4, 0],
          y: -1.5,
          opacity: 1,
        };
      case 'pressed':
        return { scale: 0.86, rotate: -4, y: 1.5, opacity: 0.9 };
      case 'loading':
        return { scale: 1, rotate: 360, opacity: 0.85 };
      case 'disabled':
        return { scale: 0.94, rotate: 0, y: 0, opacity: 0.38 };
      case 'success':
        return { scale: [1, 1.28, 1], rotate: [0, -10, 0], opacity: 1 };
      case 'warning':
      case 'error':
        return { scale: 1.15, rotate: [0, -8, 8, -4, 0], opacity: 1 };
      default:
        return { scale: 1, rotate: 0, y: 0, opacity: 0.85 };
    }
  };

  const isSpinning = state === 'loading';

  return (
    <motion.div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        ...style,
      }}
      animate={getStateVariants()}
      whileHover={getIconSpecificHover()}
      whileTap={{ scale: 0.86, rotate: -3, y: 1 }}
      transition={
        isSpinning
          ? { repeat: Infinity, duration: 1.1, ease: 'linear' }
          : { type: 'spring', stiffness: 480, damping: 26, mass: 0.75 }
      }
      onClick={onClick}
    >
      <svg
        width={size}
        height={size}
        viewBox={iconDef.viewBox || '0 0 24 24'}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {iconDef.paths.map((p: BakaiIconPath, idx: number) => {
          if (p.type === 'circle' && p.circleProps) {
            return (
              <motion.circle
                key={idx}
                cx={p.circleProps.cx}
                cy={p.circleProps.cy}
                r={p.circleProps.r}
                fill={p.fill ? color : 'none'}
                initial={{ pathLength: 0.8, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.03 }}
              />
            );
          }
          if (p.type === 'rect' && p.rectProps) {
            return (
              <motion.rect
                key={idx}
                x={p.rectProps.x}
                y={p.rectProps.y}
                width={p.rectProps.width}
                height={p.rectProps.height}
                rx={p.rectProps.rx || 0}
                fill={p.fill ? color : 'none'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.03 }}
              />
            );
          }
          return (
            <motion.path
              key={idx}
              d={p.d}
              fill={p.fill ? color : 'none'}
              initial={{ pathLength: 0.8, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.03 }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
};
