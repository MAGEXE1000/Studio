import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const UNIFIED_NAV_TRANSITION = {
  initial: { opacity: 0, y: 6, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.995 },
  transition: {
    duration: 0.2,
    ease: [0.22, 1, 0.36, 1] as const, // Linear/Apple smooth ease-out curve
  },
};

interface StudioPageTransitionProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const StudioPageTransition: React.FC<StudioPageTransitionProps> = ({
  pageKey,
  children,
  className = '',
  style = {},
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial={UNIFIED_NAV_TRANSITION.initial}
        animate={UNIFIED_NAV_TRANSITION.animate}
        exit={UNIFIED_NAV_TRANSITION.exit}
        transition={UNIFIED_NAV_TRANSITION.transition}
        className={className}
        style={{ width: '100%', height: '100%', ...style }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
