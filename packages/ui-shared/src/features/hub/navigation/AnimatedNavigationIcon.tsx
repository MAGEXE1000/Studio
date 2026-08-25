import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';
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
  animationEpoch?: number;
}

function getNormalizedIconName(key: string): string {
  const norm = key.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Settings & Preferences
  if (['settings', 'cog'].includes(norm)) return 'settings';
  if (
    [
      'sliders-horizontal',
      'slidershorizontal',
      'preferences',
      'drumpreferences',
      'groovexpreferences',
      'vocalexpreferences',
      'stagexpreferences',
    ].includes(norm)
  ) {
    return 'sliders-horizontal';
  }

  // Chordex
  if (['audio-lines', 'audiolines', 'songs', 'chordex'].includes(norm)) return 'audio-lines';
  if (['gallery-vertical-end', 'galleryverticalend', 'library'].includes(norm))
    return 'gallery-vertical-end';

  // Drumex
  if (['drum', 'drums', 'beats', 'drumbeats', 'drumsongs', 'drumex'].includes(norm)) return 'drum';
  if (['blocks', 'patterns', 'drumpatterns'].includes(norm)) return 'blocks';

  // StageX
  if (
    ['layout-panel-top', 'layoutpaneltop', 'stage', 'editor', 'stagexstage', 'stagex'].includes(
      norm
    )
  )
    return 'layout-panel-top';
  if (['layers', 'setup', 'stagexsetup', 'rhythms', 'groovexrhythms'].includes(norm))
    return 'layers';

  // Vocalex
  if (['graduation-cap', 'coach', 'vocalexcoach', 'practice', 'learn'].includes(norm))
    return 'graduation-cap';
  if (['mic', 'recorder', 'vocalexrecorder', 'vocalex'].includes(norm)) return 'mic';
  if (['clap', 'takes', 'vocalextakes', 'clapperboard'].includes(norm)) return 'clapperboard';

  // Hub
  if (['hub', 'home'].includes(norm)) return 'home';

  // General fallback equivalents
  if (norm === 'chords') return 'music';
  if (['songbook', 'catalog'].includes(norm)) return 'book-open';
  if (norm === 'groovex' || norm === 'disc') return 'disc';
  if (norm === 'share') return 'share-2';
  if (norm === 'devtools' || norm === 'bug') return 'bug';
  if (norm === 'performance' || norm === 'activity') return 'activity';
  if (norm === 'inspector' || norm === 'search') return 'search';
  if (norm === 'dashboard' || norm === 'layout-dashboard') return 'layout-dashboard';

  return norm;
}

const MATCHED_NAMES = new Set([
  'activity',
  'audio-lines',
  'blocks',
  'book-open',
  'bug',
  'clapperboard',
  'cog',
  'disc',
  'drum',
  'gallery-vertical-end',
  'graduation-cap',
  'home',
  'layers',
  'layout-dashboard',
  'layout-panel-top',
  'mic',
  'music',
  'search',
  'settings',
  'share-2',
  'sliders-horizontal',
  'user',
]);

const FILLED_VARIANTS_SUPPORT: Record<string, boolean> = {
  home: false,
  user: false,
  settings: false,
  'audio-lines': false,
  'gallery-vertical-end': false,
  'sliders-horizontal': false,
  drum: false,
  blocks: false,
  layers: false,
  'graduation-cap': false,
  mic: false,
  clapperboard: false,
  'layout-panel-top': false,
  activity: false,
  search: false,
  disc: false,
  music: false,
  'book-open': false,
  'share-2': false,
  bug: false,
  'layout-dashboard': false,
  chordex: false,
  drumex: false,
  stagex: false,
  groovex: false,
  vocalex: false,
  hub: false,
  devtools: false,
};

export const AnimatedNavigationIcon = React.forwardRef<any, AnimatedNavigationIconProps>(
  (
    {
      itemKey,
      iconName,
      iconNode,
      size = 24,
      color = 'currentColor',
      strokeWidth = 2,
      isActive,
      animationEpoch,
    },
    ref
  ) => {
    const navAnim = useNavigationAnimation();
    const direction = navAnim ? navAnim.direction : 'forward';
    const dirSign = direction === 'reverse' ? -1 : 1;

    const resolvedName = getNormalizedIconName(iconName || itemKey);

    // Log explicit warning if a filled variant of this icon is requested/expected but not supported
    if (
      isActive &&
      typeof window !== 'undefined' &&
      FILLED_VARIANTS_SUPPORT[resolvedName] === undefined
    ) {
      console.warn(
        `[AnimatedNavigationIcon] Warning: Filled status of icon "${resolvedName}" is unmapped.`
      );
    }

    // Squish-stretch keyframes for elastic bounce
    const scaleX = isActive ? [1, 1.2, 0.92, 1.04, 1] : 1;
    const scaleY = isActive ? [1, 0.8, 1.08, 0.96, 1] : 1;
    const rotate = isActive ? [0, -6 * dirSign, 4 * dirSign, 0] : 0;

    const content = iconNode ? (
      <div
        style={{
          width: size,
          height: size,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {iconNode}
      </div>
    ) : (
      <AnimatedIcon
        ref={ref}
        name={resolvedName}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        state={isActive ? 'active' : 'inactive'}
        animationEpoch={animationEpoch}
      />
    );

    const isMatched = MATCHED_NAMES.has(resolvedName);

    if (isActive && typeof window !== 'undefined') {
      let computedRotation = '0';
      if (resolvedName === 'settings') {
        computedRotation = `[0, ${90 * dirSign}, ${90 * dirSign}]`;
      } else if (resolvedName === 'home') {
        computedRotation = `[0, ${8 * dirSign}, 0]`;
      } else if (resolvedName === 'library') {
        computedRotation = `[0, ${-6 * dirSign}, 0]`;
      } else {
        computedRotation = `[0, ${8 * dirSign}, 0]`;
      }
      console.log(
        `[AnimatedNavigationIcon] LUCIDE ACTIVE - name: ${resolvedName}, direction: ${direction}, computedRotation: ${computedRotation}deg`
      );
    }

    const outerVariants = isMatched
      ? {
          active: { opacity: 1 },
          inactive: { opacity: 0.85 },
        }
      : getMotionVariantForIcon(resolvedName, direction)();

    return (
      <motion.div
        key={`nav-icon-${resolvedName}`}
        initial="inactive"
        animate={isActive ? 'active' : 'inactive'}
        variants={outerVariants}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div
          animate={{
            scaleX,
            scaleY,
            rotate,
          }}
          transition={{
            duration: 0.42,
            ease: [0.25, 1, 0.5, 1], // premium elastic curve
          }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {content}
        </motion.div>
      </motion.div>
    );
  }
);

AnimatedNavigationIcon.displayName = 'AnimatedNavigationIcon';
