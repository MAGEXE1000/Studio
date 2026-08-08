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
  if (['sliders-horizontal', 'slidershorizontal', 'preferences', 'drumpreferences', 'groovexpreferences', 'vocalexpreferences', 'stagexpreferences'].includes(norm)) {
    return 'sliders-horizontal';
  }
  
  // Chordex
  if (['audio-lines', 'audiolines', 'songs'].includes(norm)) return 'audio-lines';
  if (['gallery-vertical-end', 'galleryverticalend', 'library'].includes(norm)) return 'gallery-vertical-end';
  
  // Drumex
  if (['drum', 'drums', 'beats', 'drumbeats', 'drumsongs'].includes(norm)) return 'drum';
  if (['blocks', 'patterns', 'drumpatterns'].includes(norm)) return 'blocks';
  
  // StageX
  if (['layout-panel-top', 'layoutpaneltop', 'stage', 'editor', 'stagexstage'].includes(norm)) return 'layout-panel-top';
  if (['layers', 'setup', 'stagexsetup', 'rhythms', 'groovexrhythms'].includes(norm)) return 'layers';
  
  // Vocalex
  if (['graduation-cap', 'coach', 'vocalexcoach', 'practice', 'learn'].includes(norm)) return 'graduation-cap';
  if (['mic', 'recorder', 'vocalexrecorder', 'vocalex'].includes(norm)) return 'mic';
  if (['clap', 'takes', 'vocalextakes'].includes(norm)) return 'clapperboard';
  
  // General fallback equivalents
  if (norm === 'chords') return 'music';
  if (['songbook', 'catalog'].includes(norm)) return 'book-open';
  if (norm === 'groovex') return 'disc';
  if (norm === 'share') return 'share-2';
  
  return norm;
}

export const AnimatedNavigationIcon: React.FC<AnimatedNavigationIconProps> = ({
  itemKey,
  iconName,
  iconNode,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  isActive,
  animationEpoch,
}) => {
  const navAnim = useNavigationAnimation();
  const direction = navAnim ? navAnim.direction : 'forward';
  const dirSign = direction === 'reverse' ? -1 : 1;

  if (iconNode) {
    if (isActive && typeof window !== 'undefined') {
      const computedRotation = `[0, ${-4 * dirSign}, ${4 * dirSign}, 0]`;
      console.log(`[AnimatedNavigationIcon] CUSTOM NODE ACTIVE - itemKey: ${itemKey}, direction: ${direction}, computedRotation: ${computedRotation}deg`);
    }
    return (
      <motion.div
        key={`node-${animationEpoch ?? 0}-${isActive}-${direction}`}
        animate={{
          scale: isActive ? [0.92, 1.16, 1.08, 1.0] : 1.0,
          rotate: isActive ? [0, -4 * dirSign, 4 * dirSign, 0] : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 22,
          mass: 0.7,
        }}
        style={{ width: size, height: size, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {iconNode}
      </motion.div>
    );
  }

  const resolvedName = getNormalizedIconName(iconName || itemKey);
  const variantGetter = getMotionVariantForIcon(resolvedName, direction);
  const iconVariants = variantGetter();

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
    console.log(`[AnimatedNavigationIcon] LUCIDE ACTIVE - name: ${resolvedName}, direction: ${direction}, computedRotation: ${computedRotation}deg`);
  }

  return (
    <motion.div
      key={`nav-icon-${resolvedName}-${animationEpoch ?? 0}-${isActive}-${direction}`}
      initial="initial"
      animate={isActive ? 'active' : 'inactive'}
      variants={iconVariants}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <AnimatedIcon
        name={resolvedName}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        state={isActive ? 'active' : 'inactive'}
        animationEpoch={animationEpoch}
      />
    </motion.div>
  );
};
