import type { Variants } from 'motion/react';
import type { NavDirection } from './NavigationAnimationProvider';

// Common spring configs for consistent physics across navigation
export const navSpringConfig = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 25,
  mass: 0.8,
};

export const slowSpringConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
  mass: 1,
};

export const snappySpringConfig = {
  type: 'spring' as const,
  stiffness: 550,
  damping: 22,
  mass: 0.6,
};

export type IconVariantGetter = (direction?: NavDirection) => Variants;

// A dictionary mapping generic icon intents/keys to their premium motion variants
export const NavigationMotionVariants: Record<string, IconVariantGetter> = {
  // Settings: Full gear rotation with direction awareness (+90 vs -90 deg)
  settings: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    const targetRotate = 90 * dirSign;
    return {
      initial: { rotate: 0, scale: 1 },
      active: {
        rotate: [0, targetRotate, targetRotate],
        scale: [1, 1.15, 1],
        transition: {
          rotate: { type: 'spring', stiffness: 300, damping: 20 },
          scale: { type: 'spring', stiffness: 500, damping: 25 },
        },
      },
      inactive: { rotate: 0, scale: 1 },
    };
  },

  // Home: Directional tilt and scale up
  home: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, y: 0, rotate: 0 },
      active: {
        scale: [1, 1.15, 1],
        rotate: [0, 8 * dirSign, 0],
        y: [0, -2, 0],
        transition: navSpringConfig,
      },
      inactive: { scale: 1, y: 0, rotate: 0 },
    };
  },

  // Search: Lens expands slightly then settles with directional shift
  search: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, x: 0, y: 0, rotate: 0 },
      active: {
        scale: [1, 1.2, 1],
        x: [0, 2 * dirSign, 0],
        y: [0, -2, 0],
        rotate: [0, 6 * dirSign, 0],
        transition: snappySpringConfig,
      },
      inactive: { scale: 1, x: 0, y: 0, rotate: 0 },
    };
  },

  // Profile: Smooth pulse with directional tilt
  profile: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, rotate: 0 },
      active: {
        scale: [1, 1.15, 1],
        rotate: [0, 6 * dirSign, 0],
        y: [0, -1.5, 0],
        transition: navSpringConfig,
      },
      inactive: { scale: 1, rotate: 0 },
    };
  },

  // Library: Book opening motion (rotate + scale) with direction awareness
  library: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, rotate: 0 },
      active: {
        scale: [1, 1.12, 1],
        rotate: [0, -6 * dirSign, 0],
        transition: slowSpringConfig,
      },
      inactive: { scale: 1, rotate: 0 },
    };
  },

  // Favorites / Heart: Heartbeat double pulse
  favorite: () => ({
    initial: { scale: 1 },
    active: {
      scale: [1, 1.25, 1.1, 1.2, 1],
      transition: { duration: 0.6, ease: 'easeOut' },
    },
    inactive: { scale: 1 },
  }),

  // Music/Notes: Waveform/bounce motion with directional swing
  music: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { y: 0, scale: 1, rotate: 0 },
      active: {
        y: [0, -4, 1, -2, 0],
        rotate: [0, 8 * dirSign, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
      inactive: { y: 0, scale: 1, rotate: 0 },
    };
  },

  // Practice/Metronome: Tick-tock swing
  practice: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { rotate: 0, scale: 1 },
      active: {
        rotate: [0, -12 * dirSign, 12 * dirSign, -6 * dirSign, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
      inactive: { rotate: 0, scale: 1 },
    };
  },

  // Stage/Spotlight: Pivot motion
  stage: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { rotate: 0, scale: 1 },
      active: {
        rotate: [0, 10 * dirSign, -8 * dirSign, 0],
        scale: [1, 1.1, 1],
        transition: slowSpringConfig,
      },
      inactive: { rotate: 0, scale: 1 },
    };
  },

  // Microphone/Record: Expansion pulse
  record: () => ({
    initial: { scale: 1 },
    active: {
      scale: [1, 1.25, 1],
      transition: snappySpringConfig,
    },
    inactive: { scale: 1 },
  }),

  // Drum: Punchy rhythmic scale pulse
  drum: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, rotate: 0 },
      active: {
        scale: [1, 1.22, 0.94, 1.06, 1],
        rotate: [0, -6 * dirSign, 4 * dirSign, 0],
        transition: snappySpringConfig,
      },
      inactive: { scale: 1, rotate: 0 },
    };
  },

  // Disc / Groove: Spin pulse
  disc: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, rotate: 0 },
      active: {
        scale: [1, 1.15, 1],
        rotate: [0, 45 * dirSign, 0],
        transition: slowSpringConfig,
      },
      inactive: { scale: 1, rotate: 0 },
    };
  },

  // Generic fallback for any unrecognized icon
  generic: (direction: NavDirection = 'forward') => {
    const dirSign = direction === 'reverse' ? -1 : 1;
    return {
      initial: { scale: 1, y: 0, rotate: 0 },
      active: {
        scale: [1, 1.15, 1],
        rotate: [0, 8 * dirSign, 0],
        y: [0, -1.5, 0],
        transition: navSpringConfig,
      },
      inactive: { scale: 1, y: 0, rotate: 0 },
    };
  },
};

/**
 * Helper to match an icon name/key to its personality variant
 */
export function getMotionVariantForIcon(
  iconName: string,
  direction: NavDirection = 'forward'
): IconVariantGetter {
  const lower = iconName.toLowerCase();

  if (lower.includes('setting') || lower.includes('gear') || lower.includes('preference')) {
    return () => NavigationMotionVariants.settings(direction);
  }
  if (lower.includes('search') || lower.includes('magnifier')) {
    return () => NavigationMotionVariants.search(direction);
  }
  if (
    lower.includes('profile') ||
    lower.includes('user') ||
    lower.includes('avatar') ||
    lower.includes('account')
  ) {
    return () => NavigationMotionVariants.profile(direction);
  }
  if (lower.includes('library') || lower.includes('book')) {
    return () => NavigationMotionVariants.library(direction);
  }
  if (lower.includes('favorite') || lower.includes('heart')) {
    return () => NavigationMotionVariants.favorite();
  }
  if (
    lower.includes('music') ||
    lower.includes('note') ||
    lower.includes('song') ||
    lower.includes('chord') ||
    lower.includes('audio-lines')
  ) {
    return () => NavigationMotionVariants.music(direction);
  }
  if (
    lower.includes('practice') ||
    lower.includes('metronome') ||
    lower.includes('graphic_eq') ||
    lower.includes('coach')
  ) {
    return () => NavigationMotionVariants.practice(direction);
  }
  if (
    lower.includes('stage') ||
    lower.includes('spotlight') ||
    lower.includes('setup') ||
    lower.includes('layout-panel-top')
  ) {
    return () => NavigationMotionVariants.stage(direction);
  }
  if (
    lower.includes('record') ||
    lower.includes('mic') ||
    lower.includes('takes') ||
    lower.includes('clap')
  ) {
    return () => NavigationMotionVariants.record();
  }
  if (
    lower.includes('drum') ||
    lower.includes('beat') ||
    lower.includes('pattern') ||
    lower.includes('block')
  ) {
    return () => NavigationMotionVariants.drum(direction);
  }
  if (
    lower.includes('disc') ||
    lower.includes('groove') ||
    lower.includes('layer') ||
    lower.includes('rhythm')
  ) {
    return () => NavigationMotionVariants.disc(direction);
  }
  if (lower.includes('home') || lower.includes('hub')) {
    return () => NavigationMotionVariants.home(direction);
  }

  return () => NavigationMotionVariants.generic(direction);
}
