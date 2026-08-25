import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const UNIFIED_NAV_TRANSITION = {
  initial: {
    opacity: 0,
    y: 6,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1] as const, // Linear/Apple smooth ease-out curve
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.995,
    transition: {
      duration: 0.15,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/**
 * SECTION_DRILLDOWN_TRANSITION — High-end physical section entrance
 * Uses quintic deceleration, subtle 3D depth scaling (0.965 -> 1.0), and clip-path card expansion
 * for opening standalone sections (Appearance, About, Settings subsections, etc.).
 */
export const SECTION_DRILLDOWN_TRANSITION = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.965,
    clipPath: 'inset(0% 0% 0% 0% round 24px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    clipPath: 'inset(0% 0% 0% 0% round 0px)',
    transition: {
      duration: 0.36,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    clipPath: 'inset(0% 0% 0% 0% round 16px)',
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0] as const,
    },
  },
};

interface StudioPageTransitionProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'tab' | 'drilldown' | 'fade-through' | 'slide';
}

export const StudioPageTransition: React.FC<StudioPageTransitionProps> = ({
  pageKey,
  children,
  className = '',
  style = {},
  variant = 'tab',
}) => {
  const transitionConfig =
    variant === 'drilldown' ? SECTION_DRILLDOWN_TRANSITION : UNIFIED_NAV_TRANSITION;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={transitionConfig}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          willChange: 'transform, opacity, clip-path',
          ...style,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
