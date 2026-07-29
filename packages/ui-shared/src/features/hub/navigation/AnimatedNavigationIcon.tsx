import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { getBakaiIcon, type BakaiIconPath } from '../../../shared/icons/bakaiIconLibrary';
import { useNavigationAnimation } from './NavigationAnimationProvider';
import { getMotionVariantForIcon } from './NavigationMotionVariants';

export interface AnimatedNavigationIconProps {
  itemKey: string;
  iconName?: string;
  iconNode?: React.ReactNode;
  size?: number;
  color?: string;
  strokeWidth?: number;
  isActive: boolean;
}

export const AnimatedNavigationIcon: React.FC<AnimatedNavigationIconProps> = ({
  itemKey,
  iconName,
  iconNode,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  isActive,
}) => {
  const { currentTab, previousTab } = useNavigationAnimation();
  const controls = useAnimationControls();
  
  // Track if we've mounted to avoid animating on initial load unless required
  const [hasMounted, setHasMounted] = useState(false);

  // We use the iconName for the variant lookup if available, otherwise fallback to itemKey
  const variantKey = iconName || itemKey;
  const variantGetter = getMotionVariantForIcon(variantKey);
  const variants = variantGetter();

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      // Initialize state immediately without animating
      controls.set(isActive ? variants.active : variants.inactive);
      return;
    }

    // Core logic: ONLY animate if this tab just became active
    if (isActive && currentTab === itemKey && previousTab !== itemKey) {
      controls.start(variants.active);
    } else if (!isActive) {
      // Smoothly transition to inactive state if we're no longer active
      controls.start(variants.inactive);
    }
  }, [isActive, currentTab, previousTab, itemKey, controls, hasMounted, variants.active, variants.inactive]);

  const renderContent = () => {
    if (iconNode) {
      return iconNode;
    }

    if (iconName) {
      const iconDef = getBakaiIcon(iconName);
      if (!iconDef || !iconDef.paths) return null;

      return (
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
                <circle
                  key={idx}
                  cx={p.circleProps.cx}
                  cy={p.circleProps.cy}
                  r={p.circleProps.r}
                  fill={p.fill ? color : 'none'}
                />
              );
            }
            if (p.type === 'rect' && p.rectProps) {
              return (
                <rect
                  key={idx}
                  x={p.rectProps.x}
                  y={p.rectProps.y}
                  width={p.rectProps.width}
                  height={p.rectProps.height}
                  rx={p.rectProps.rx || 0}
                  fill={p.fill ? color : 'none'}
                />
              );
            }
            return (
              <path
                key={idx}
                d={p.d}
                fill={p.fill ? color : 'none'}
              />
            );
          })}
        </svg>
      );
    }

    return null;
  };

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color, // ensure child SVGs inherit color
      }}
      initial={isActive ? variants.active : variants.inactive}
      animate={controls}
    >
      {renderContent()}
    </motion.div>
  );
};
