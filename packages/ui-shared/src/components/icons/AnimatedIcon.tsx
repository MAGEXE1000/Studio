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

  // Motion physics configuration matching Bakai interaction philosophy
  const getStateVariants = () => {
    switch (state) {
      case 'active':
      case 'selected':
        return { scale: 1.1, rotate: 0, opacity: 1 };
      case 'pressed':
        return { scale: 0.88, rotate: -4, opacity: 0.9 };
      case 'loading':
        return { scale: 1, rotate: 360, opacity: 0.8 };
      case 'disabled':
        return { scale: 0.95, rotate: 0, opacity: 0.4 };
      case 'success':
        return { scale: [1, 1.25, 1], rotate: [0, -8, 0], opacity: 1 };
      case 'warning':
      case 'error':
        return { scale: 1.15, rotate: [0, -6, 6, -3, 0], opacity: 1 };
      default:
        return { scale: 1, rotate: 0, opacity: 0.85 };
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
      transition={
        isSpinning
          ? { repeat: Infinity, duration: 1.2, ease: 'linear' }
          : { type: 'spring', stiffness: 420, damping: 24 }
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
                initial={{ pathLength: 0.85, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
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
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              />
            );
          }
          return (
            <motion.path
              key={idx}
              d={p.d}
              fill={p.fill ? color : 'none'}
              initial={{ pathLength: 0.85, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
};
