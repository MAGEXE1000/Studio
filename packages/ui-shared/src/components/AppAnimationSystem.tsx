import { useChordStore } from '@workspace/studio-core';
import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── 1. Standard Transition Presets ──────────────────────────────────────────
export const MOTION_DURATIONS = {
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
};

export const MOTION_EASINGS = {
  standard: [0.25, 1, 0.5, 1] as any, // Premium cubic-bezier easing
  spring: {
    type: 'spring' as const,
    stiffness: 140,
    damping: 18,
    mass: 0.9,
  }
};

// Helper to check if reduced motion is preferred by the system or settings
export function usePrefersReducedMotion() {
  const { settings } = useChordStore();
  const speed = settings?.animationSpeed;
  if (speed === 'reduced') return true;
  if (speed === 'normal' || speed === 'fast') return false;
  return (
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Helper to check the animation duration speed coefficient
export function useAnimationSpeed() {
  const { settings } = useChordStore();
  const speed = settings?.animationSpeed;
  return speed === 'fast' ? 0.6 : 1.0;
}

// ── 2. Animation Coordinator ────────────────────────────────────────────────
export const AnimationCoordinator = {
  getDuration(preset: 'fast' | 'normal' | 'slow' = 'normal', speedSetting?: string): number {
    if (speedSetting === 'reduced') return 0;
    const base = MOTION_DURATIONS[preset];
    const multiplier = speedSetting === 'fast' ? 0.6 : 1.0;
    return base * multiplier;
  },

  getTransition(preset: 'standard' | 'spring' = 'standard', durationPreset: 'fast' | 'normal' | 'slow' = 'normal', speedSetting?: string) {
    if (speedSetting === 'reduced') {
      return { duration: 0 };
    }
    const duration = this.getDuration(durationPreset, speedSetting);
    if (preset === 'spring') {
      return { ...MOTION_EASINGS.spring, duration };
    }
    return { ease: MOTION_EASINGS.standard, duration };
  },

  startTransition(durationMs: number = 300) {
    if (typeof window !== 'undefined') {
      (window as any).studioTransitionActive = true;
      const startEvent = new CustomEvent('studio:transition-start');
      window.dispatchEvent(startEvent);
      
      setTimeout(() => {
        (window as any).studioTransitionActive = false;
        const endEvent = new CustomEvent('studio:transition-end');
        window.dispatchEvent(endEvent);
      }, durationMs);
    }
  }
};

// ── 3. Navigation Coordinator ────────────────────────────────────────────────
export interface NavigationState {
  page: string;
  direction: 'forward' | 'backward';
  pageKey: number;
}

export function useNavigationCoordinator(initialPage: string) {
  const [state, setState] = useState<NavigationState>({
    page: initialPage,
    direction: 'forward',
    pageKey: 0,
  });

  const navigate = useCallback((toPage: string) => {
    AnimationCoordinator.startTransition(300);
    setState(prev => ({
      page: toPage,
      direction: 'forward',
      pageKey: prev.pageKey + 1,
    }));
  }, []);

  const goBack = useCallback((fallbackPage: string = 'main') => {
    AnimationCoordinator.startTransition(300);
    setState(prev => ({
      page: fallbackPage,
      direction: 'backward',
      pageKey: prev.pageKey + 1,
    }));
  }, []);

  return {
    page: state.page,
    direction: state.direction,
    pageKey: state.pageKey,
    navigate,
    goBack,
  };
}

// ── 4. Shared Transition Engine Components ─────────────────────────────────
export interface PageTransitionProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward';
  type?: 'slide' | 'fade' | 'scale';
  style?: React.CSSProperties;
  className?: string;
}

export function PageTransition({
  children,
  direction,
  type = 'slide',
  style,
  className = '',
}: PageTransitionProps) {
  const prefersReduced = usePrefersReducedMotion();
  const settings = useChordStore(s => s.settings);

  if (prefersReduced) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', ...style }}>
        {children}
      </div>
    );
  }

  const variants = {
    initial: () => {
      if (type === 'fade') return { opacity: 0 };
      if (type === 'scale') return { opacity: 0, scale: 0.96 };
      return {
        x: direction === 'forward' ? '100%' : '-30%',
        opacity: 0,
      };
    },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: () => {
      if (type === 'fade') return { opacity: 0 };
      if (type === 'scale') return { opacity: 0, scale: 1.04 };
      return {
        x: direction === 'forward' ? '-30%' : '100%',
        opacity: 0,
      };
    }
  };

  const transition = AnimationCoordinator.getTransition(
    type === 'scale' ? 'spring' : 'standard',
    'normal',
    settings?.animationSpeed
  );

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        willChange: 'transform, opacity',
        ...style
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── 5. App Entry Transition ──────────────────────────────────────────────────
export function AppEntryTransition({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const prefersReduced = usePrefersReducedMotion();
  const settings = useChordStore(s => s.settings);

  if (prefersReduced) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', ...style }}>
        {children}
      </div>
    );
  }

  const transition = AnimationCoordinator.getTransition('spring', 'normal', settings?.animationSpeed);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, scale: 0.972 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
      style={{
        width: '100%',
        height: '100%',
        ...style,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

// ── 6. Staggered Content Reveal ──────────────────────────────────────────────
export function StaggeredReveal({
  children,
  delayOffset = 0.05,
  staggerInterval = 45, // ms between items
  style,
  className,
}: {
  children: React.ReactNode;
  delayOffset?: number;
  staggerInterval?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const prefersReduced = usePrefersReducedMotion();
  const speedScale = useAnimationSpeed();
  const childrenArray = React.Children.toArray(children);

  if (prefersReduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style, display: 'contents' }}>
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        const childElement = child as React.ReactElement<any>;
        const delay = delayOffset + index * (staggerInterval / 1000) * speedScale;

        let wrapperClassName = "";
        if (childElement.props && childElement.props.className) {
          const classes = childElement.props.className.split(/\s+/);
          const layoutClasses = classes.filter((c: string) => 
            c.startsWith('col-span-') || 
            c.startsWith('row-span-') || 
            c.startsWith('flex-') || 
            c === 'grow' || 
            c === 'shrink'
          );
          if (layoutClasses.length > 0) {
            wrapperClassName = layoutClasses.join(' ');
          }
        }

        return (
          <motion.div
            key={index}
            className={wrapperClassName}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 130,
              damping: 15,
              mass: 0.8,
              delay,
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              willChange: 'transform, opacity',
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── 7. Text Animations (AnimatedAppHeader) ───────────────────────────────────
export function AnimatedAppHeader({
  title,
  subtitle,
  titleClassName = "font-extrabold tracking-tighter leading-none mb-3",
  subtitleClassName = "",
  titleStyle = {},
  subtitleStyle = {},
  staggerInterval = 20, // ms per character
  delayOffset = 0.06,
}: {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  staggerInterval?: number;
  delayOffset?: number;
}) {
  const prefersReduced = usePrefersReducedMotion();
  const speedScale = useAnimationSpeed();

  const mergedTitleStyle: React.CSSProperties = {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 900,
    fontSize: '2.6rem',
    color: 'var(--c-text-primary)',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    marginTop: '12px',
    marginBottom: '8px',
    ...titleStyle,
  };

  const mergedSubtitleStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: 'var(--c-text-secondary)',
    marginTop: '4px',
    marginBottom: '24px',
    lineHeight: 1.4,
    ...subtitleStyle,
  };

  if (prefersReduced) {
    return (
      <>
        <h2 className={titleClassName} style={mergedTitleStyle}>{title}</h2>
        {subtitle && <p className={subtitleClassName} style={mergedSubtitleStyle}>{subtitle}</p>}
      </>
    );
  }

  const chars = title.split("");

  return (
    <>
      <h2
        className={titleClassName}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          lineHeight: '1.15',
          ...mergedTitleStyle,
        }}
      >
        {chars.map((char, index) => {
          const delay = delayOffset + index * (staggerInterval / 1000) * speedScale;

          return (
            <motion.span
              key={index}
              className="inline-block origin-bottom"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 12,
                mass: 0.75,
                delay,
              }}
              style={{
                display: char === " " ? "inline" : "inline-block",
                marginRight: char === " " ? "0.25em" : 0,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </h2>
      {subtitle && (
        <motion.p
          className={subtitleClassName}
          style={mergedSubtitleStyle}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 110,
            damping: 14,
            delay: delayOffset + Math.min(0.35, chars.length * (staggerInterval / 1000) * speedScale + 0.05),
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </>
  );
}
