import React, { useEffect, useRef } from 'react';
import {
  SettingsIcon,
  SlidersHorizontalIcon,
  HomeIcon,
  SearchIcon,
  UserIcon,
  FoldersIcon,
  HistoryIcon,
  GraduationCapIcon,
  GripIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  LayersIcon,
  MicIcon,
  BellIcon,
  CompassIcon,
  HeartIcon,
  DownloadIcon,
  ActivityIcon,
  ClockIcon,
  FileTextIcon,
  EyeIcon,
  LockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XIcon,
  CheckIcon,
  RefreshCWIcon,
  CopyIcon,
  ExternalLinkIcon,
} from '../../../components/ui';
import {
  Music,
  Book,
  Folder,
  List,
  Disc,
  Grid,
  Star,
  Share2,
  Sliders,
  type LucideProps,
} from 'lucide-react';

export interface AnimatedNavigationIconProps {
  itemKey: string;
  iconName?: string;
  iconNode?: React.ReactNode;
  size?: number;
  color?: string;
  strokeWidth?: number;
  isActive: boolean;
}

interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

// Map of canonical icon names to official Lucide Animated components
const OFFICIAL_ANIMATED_ICONS: Record<string, React.ForwardRefExoticComponent<any>> = {
  settings: SettingsIcon,
  'preferences-gear': SettingsIcon,
  'sliders-horizontal': SlidersHorizontalIcon,
  preferences: SlidersHorizontalIcon,
  slidersHorizontal: SlidersHorizontalIcon,
  home: HomeIcon,
  search: SearchIcon,
  user: UserIcon,
  profile: UserIcon,
  account: UserIcon,
  folders: FoldersIcon,
  library: FoldersIcon,
  history: HistoryIcon,
  recents: HistoryIcon,
  takes: HistoryIcon,
  'graduation-cap': GraduationCapIcon,
  practice: GraduationCapIcon,
  learn: GraduationCapIcon,
  grip: GripIcon,
  devtools: GripIcon,
  play: PlayIcon,
  plus: PlusIcon,
  sparkles: SparklesIcon,
  discover: SparklesIcon,
  layers: LayersIcon,
  stage: LayersIcon,
  mic: MicIcon,
  vocalex: MicIcon,
  bell: BellIcon,
  notifications: BellIcon,
  compass: CompassIcon,
  heart: HeartIcon,
  download: DownloadIcon,
  activity: ActivityIcon,
  clock: ClockIcon,
  'file-text': FileTextIcon,
  lyrics: FileTextIcon,
  eye: EyeIcon,
  lock: LockIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-down': ChevronDownIcon,
  x: XIcon,
  check: CheckIcon,
  'refresh-cw': RefreshCWIcon,
  copy: CopyIcon,
  'external-link': ExternalLinkIcon,
};

// Static fallback icons for icons without an official animated package
const STATIC_FALLBACK_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  music: Music,
  chords: Music,
  book: Book,
  songbook: Book,
  catalog: Book,
  folder: Folder,
  list: List,
  disc: Disc,
  groovex: Disc,
  grid: Grid,
  drums: Grid,
  star: Star,
  share: Share2,
  sliders: Sliders,
};

export const AnimatedNavigationIcon: React.FC<AnimatedNavigationIconProps> = ({
  itemKey,
  iconName,
  iconNode,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  isActive,
}) => {
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const prevActiveRef = useRef<boolean>(isActive);

  // Normalize key name
  const key = (iconName || itemKey).toLowerCase();

  // Strict state-change trigger logic
  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      iconRef.current?.startAnimation();
    } else if (!isActive && prevActiveRef.current) {
      iconRef.current?.stopAnimation();
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  if (iconNode) {
    return <div style={{ width: size, height: size, color }}>{iconNode}</div>;
  }

  const AnimatedComponent = OFFICIAL_ANIMATED_ICONS[key];
  if (AnimatedComponent) {
    return (
      <div style={{ width: size, height: size, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedComponent ref={iconRef} size={size} />
      </div>
    );
  }

  const StaticComponent = STATIC_FALLBACK_ICONS[key];
  if (StaticComponent) {
    return <StaticComponent size={size} color={color} strokeWidth={strokeWidth} />;
  }

  // Generic fallback: render HomeIcon
  return (
    <div style={{ width: size, height: size, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <HomeIcon ref={iconRef} size={size} />
    </div>
  );
};
