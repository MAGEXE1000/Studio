import React from 'react';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';

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
  if (iconNode) {
    return <div style={{ width: size, height: size, color }}>{iconNode}</div>;
  }

  const resolvedName = getNormalizedIconName(iconName || itemKey);

  return (
    <AnimatedIcon
      name={resolvedName}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      state={isActive ? 'active' : 'inactive'}
      animationEpoch={animationEpoch}
    />
  );
};
