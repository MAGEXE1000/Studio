import type { Variants } from 'motion/react';

// Common spring configs for consistent physics across navigation
export const navSpringConfig = {
  type: 'spring',
  stiffness: 450,
  damping: 25,
  mass: 0.8,
};

export const slowSpringConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 1,
};

export const snappySpringConfig = {
  type: 'spring',
  stiffness: 550,
  damping: 22,
  mass: 0.6,
};

// Represents the animation played ONLY when the tab becomes active
type IconVariantGetter = () => Variants;

// A dictionary mapping generic icon intents/keys to their premium motion variants
export const NavigationMotionVariants: Record<string, IconVariantGetter> = {
  // Settings: Full gear rotation with a subtle spring settle
  settings: () => ({
    initial: { rotate: 0, scale: 1 },
    active: {
      rotate: [0, 90, 90], // Overshoot handled by spring? Actually, we'll just let spring handle the rotation to 90 if we set it as target, but keyframes in motion override springs sometimes if not careful.
      // Better way: define explicit target states and let the spring transition drive it.
      scale: [1, 1.1, 1],
      transition: {
        rotate: { type: 'spring', stiffness: 300, damping: 20 },
        scale: { type: 'spring', stiffness: 500, damping: 25 }
      }
    },
    inactive: { rotate: 0, scale: 1 }
  }),

  // Home: Subtle scale up and settle
  home: () => ({
    initial: { scale: 1, y: 0 },
    active: {
      scale: [1, 1.15, 1],
      y: [0, -2, 0],
      transition: navSpringConfig
    },
    inactive: { scale: 1, y: 0 }
  }),

  // Search: Lens expands slightly then settles
  search: () => ({
    initial: { scale: 1, x: 0, y: 0 },
    active: {
      scale: [1, 1.2, 1],
      x: [0, 2, 0],
      y: [0, -2, 0],
      transition: snappySpringConfig
    },
    inactive: { scale: 1, x: 0, y: 0 }
  }),

  // Profile: Smooth pulse
  profile: () => ({
    initial: { scale: 1 },
    active: {
      scale: [1, 1.15, 1],
      y: [0, -1.5, 0],
      transition: navSpringConfig
    },
    inactive: { scale: 1 }
  }),

  // Library: Book opening motion (rotate + scale)
  library: () => ({
    initial: { scale: 1, rotate: 0 },
    active: {
      scale: [1, 1.12, 1],
      rotate: [0, -4, 0],
      transition: slowSpringConfig
    },
    inactive: { scale: 1, rotate: 0 }
  }),

  // Favorites / Heart: Heartbeat double pulse
  favorite: () => ({
    initial: { scale: 1 },
    active: {
      scale: [1, 1.25, 1.1, 1.2, 1],
      transition: { duration: 0.6, ease: 'easeOut' } // Custom timing for heartbeat
    },
    inactive: { scale: 1 }
  }),

  // Music/Notes: Waveform/bounce motion
  music: () => ({
    initial: { y: 0, scale: 1 },
    active: {
      y: [0, -4, 1, -2, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, ease: 'easeInOut' }
    },
    inactive: { y: 0, scale: 1 }
  }),
  
  // Practice/Metronome: Tick-tock swing
  practice: () => ({
    initial: { rotate: 0, scale: 1 },
    active: {
      rotate: [0, -12, 12, -6, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.6, ease: 'easeInOut' }
    },
    inactive: { rotate: 0, scale: 1 }
  }),

  // Stage/Spotlight: Pivot motion
  stage: () => ({
    initial: { rotate: 0, scale: 1 },
    active: {
      rotate: [0, -10, 8, 0],
      scale: [1, 1.1, 1],
      transition: slowSpringConfig
    },
    inactive: { rotate: 0, scale: 1 }
  }),

  // Microphone/Record: Expansion pulse
  record: () => ({
    initial: { scale: 1 },
    active: {
      scale: [1, 1.25, 1],
      transition: snappySpringConfig
    },
    inactive: { scale: 1 }
  }),

  // Generic fallback for any unrecognized icon
  generic: () => ({
    initial: { scale: 1, y: 0 },
    active: {
      scale: [1, 1.15, 1],
      y: [0, -1.5, 0],
      transition: navSpringConfig
    },
    inactive: { scale: 1, y: 0 }
  })
};

/**
 * Helper to match an icon name/key to its personality variant
 */
export function getMotionVariantForIcon(iconName: string): IconVariantGetter {
  const lower = iconName.toLowerCase();
  
  if (lower.includes('setting') || lower.includes('gear') || lower.includes('preference')) {
    return NavigationMotionVariants.settings;
  }
  if (lower.includes('search') || lower.includes('magnifier')) {
    return NavigationMotionVariants.search;
  }
  if (lower.includes('profile') || lower.includes('user') || lower.includes('avatar') || lower.includes('account')) {
    return NavigationMotionVariants.profile;
  }
  if (lower.includes('library') || lower.includes('book')) {
    return NavigationMotionVariants.library;
  }
  if (lower.includes('favorite') || lower.includes('heart')) {
    return NavigationMotionVariants.favorite;
  }
  if (lower.includes('music') || lower.includes('note') || lower.includes('song') || lower.includes('chord')) {
    return NavigationMotionVariants.music;
  }
  if (lower.includes('practice') || lower.includes('metronome') || lower.includes('graphic_eq') || lower.includes('coach')) {
    return NavigationMotionVariants.practice;
  }
  if (lower.includes('stage') || lower.includes('spotlight') || lower.includes('setup')) {
    return NavigationMotionVariants.stage;
  }
  if (lower.includes('record') || lower.includes('mic') || lower.includes('takes')) {
    return NavigationMotionVariants.record;
  }
  if (lower.includes('home')) {
    return NavigationMotionVariants.home;
  }

  return NavigationMotionVariants.generic;
}
