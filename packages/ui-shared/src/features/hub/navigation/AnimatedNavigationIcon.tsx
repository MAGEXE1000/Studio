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
  CogIcon,
  AudioLinesIcon,
  GalleryVerticalEndIcon,
  DrumIcon,
  BlocksIcon,
  LayoutPanelTopIcon,
  ClapIcon,
  RadioIcon,
  Disc3Icon,
  LayoutGridIcon,
  FolderOpenIcon,
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
  // Settings & Preferences
  settings: SettingsIcon,
  'preferences-gear': SettingsIcon,
  cog: CogIcon,
  'sliders-horizontal': SlidersHorizontalIcon,
  preferences: SlidersHorizontalIcon,
  slidersHorizontal: SlidersHorizontalIcon,
  drumpreferences: SlidersHorizontalIcon,
  groovexpreferences: SlidersHorizontalIcon,
  vocalexpreferences: SlidersHorizontalIcon,
  stagexpreferences: SlidersHorizontalIcon,

  // Chordex
  'audio-lines': AudioLinesIcon,
  audiolines: AudioLinesIcon,
  songs: AudioLinesIcon,
  'gallery-vertical-end': GalleryVerticalEndIcon,
  galleryverticalend: GalleryVerticalEndIcon,
  library: GalleryVerticalEndIcon,

  // Drumex
  drum: DrumIcon,
  drums: DrumIcon,
  beats: DrumIcon,
  drumbeats: DrumIcon,
  drumsongs: DrumIcon,
  blocks: BlocksIcon,
  patterns: BlocksIcon,
  drumpatterns: BlocksIcon,

  // StageX
  'layout-panel-top': LayoutPanelTopIcon,
  layoutpaneltop: LayoutPanelTopIcon,
  stage: LayoutPanelTopIcon,
  editor: LayoutPanelTopIcon,
  stagexstage: LayoutPanelTopIcon,
  layers: LayersIcon,
  setup: LayersIcon,
  stagexsetup: LayersIcon,

  // GrooveX
  rhythms: LayersIcon,
  groovexrhythms: LayersIcon,

  // Vocalex
  'graduation-cap': GraduationCapIcon,
  coach: GraduationCapIcon,
  vocalexcoach: GraduationCapIcon,
  practice: GraduationCapIcon,
  learn: GraduationCapIcon,
  mic: MicIcon,
  recorder: MicIcon,
  vocalexrecorder: MicIcon,
  vocalex: MicIcon,
  clap: ClapIcon,
  takes: ClapIcon,
  vocalextakes: ClapIcon,

  // General & Shared Nav
  home: HomeIcon,
  search: SearchIcon,
  user: UserIcon,
  profile: UserIcon,
  account: UserIcon,
  folders: FoldersIcon,
  'folder-open': FolderOpenIcon,
  folderopen: FolderOpenIcon,
  history: HistoryIcon,
  recents: HistoryIcon,
  grip: GripIcon,
  devtools: GripIcon,
  play: PlayIcon,
  plus: PlusIcon,
  sparkles: SparklesIcon,
  discover: SparklesIcon,
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
  radio: RadioIcon,
  'disc-3': Disc3Icon,
  'layout-grid': LayoutGridIcon,
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
  const key = (iconName || itemKey).toLowerCase().replace(/[^a-z0-9-]/g, '');

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

  // Semantic fallback: render Sliders for controls, or Folder for lists (NO Home fallback)
  return <Sliders size={size} color={color} strokeWidth={strokeWidth} />;
};
