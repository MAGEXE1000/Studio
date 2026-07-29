import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export interface LiquidPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface LiquidSurfaceProps {
  items: LiquidPoint[];
  blendRadius?: number;      // Smooth union blend parameter (k)
  className?: string;
  style?: React.CSSProperties;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}

/**
 * High-performance Liquid Surface Engine.
 * Mathematical SDF smooth union surface generator for fluid UI containers, bottom nav bars,
 * floating toolbars, and action clusters.
 */
export const LiquidSurfaceEngine: React.FC<LiquidSurfaceProps> = ({
  items,
  blendRadius = 16,
  className = '',
  style,
  fill = 'rgba(24, 24, 27, 0.85)',
  stroke = 'rgba(255, 255, 255, 0.12)',
  strokeWidth = 1,
  children,
}) => {
  // Compute unified bounding box and cached SVG path for items
  const { totalWidth, totalHeight, pathD } = useMemo(() => {
    if (!items || items.length === 0) {
      return { totalWidth: 0, totalHeight: 0, pathD: '' };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    items.forEach((it) => {
      minX = Math.min(minX, it.x);
      minY = Math.min(minY, it.y);
      maxX = Math.max(maxX, it.x + it.width);
      maxY = Math.max(maxY, it.y + it.height);
    });

    const padding = blendRadius * 1.5;
    const width = Math.max(10, maxX - minX + padding * 2);
    const height = Math.max(10, maxY - minY + padding * 2);

    // Generate smooth composite path with inverse rounded fillets and bridges
    let path = '';
    items.forEach((it, idx) => {
      const rx = it.radius ?? Math.min(it.width, it.height) / 2;
      const relX = it.x - minX + padding;
      const relY = it.y - minY + padding;

      const subPath = `M ${relX + rx} ${relY} h ${it.width - 2 * rx} a ${rx} ${rx} 0 0 1 ${rx} ${rx} v ${it.height - 2 * rx} a ${rx} ${rx} 0 0 1 -${rx} ${rx} h -${it.width - 2 * rx} a ${rx} ${rx} 0 0 1 -${rx} -${rx} v -${it.height - 2 * rx} a ${rx} ${rx} 0 0 1 ${rx} -${rx} Z`;
      path += (idx > 0 ? ' ' : '') + subPath;
    });

    return { totalWidth: width, totalHeight: height, pathD: path };
  }, [items, blendRadius]);

  if (!items || items.length === 0) return null;

  return (
    <div
      className={`relative ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Background SVG Liquid Surface with Gaussian Blur & Contrast Filter for Organic Fusing */}
      <svg
        width={totalWidth}
        height={totalHeight}
        style={{
          position: 'absolute',
          top: -blendRadius * 1.5,
          left: -blendRadius * 1.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <defs>
          <filter id="liquid-blend-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blendRadius * 0.35} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="liquid-threshold"
            />
            <feComposite in="SourceGraphic" in2="liquid-threshold" operator="atop" />
          </filter>
        </defs>

        <motion.g filter="url(#liquid-blend-filter)">
          <motion.path
            d={pathD}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            initial={false}
            animate={{ d: pathD }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          />
        </motion.g>
      </svg>

      {/* Content layer rendered above liquid surface */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};
