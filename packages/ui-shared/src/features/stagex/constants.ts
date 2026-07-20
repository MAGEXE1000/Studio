export const STAGEX_LIBRARY: Record<string, { name: string; icon: string; type: string }[]> = {
  mics: [
    { name: 'SM58', icon: 'mic', type: 'Dynamic Mic' },
    { name: 'Condenser', icon: 'mic-2', type: 'Condenser Mic' },
    { name: 'Amp Mic', icon: 'mic', type: 'Instrument Mic' },
    { name: 'Wireless', icon: 'cx-wireless', type: 'Wireless Mic' },
    { name: 'Boundary', icon: 'cx-boundary', type: 'PZM Mic' },
    { name: 'Drum Clip', icon: 'cx-drum-clip', type: 'Instrument Clip' },
    { name: 'Mic Stand', icon: 'cx-mic-stand', type: 'Mic Stand' },
  ],
  drums: [
    { name: 'Drum Kit', icon: 'drum', type: 'Acoustic Drums' },
    { name: 'E-Drums', icon: 'cx-edrum', type: 'Electronic Drums' },
    { name: 'Percussion', icon: 'cx-percussion', type: 'Percussion' },
    { name: 'CajÃ³n', icon: 'cx-cajon', type: 'CajÃ³n' },
  ],
  inst: [
    { name: 'Elec Guitar', icon: 'cx-elec-guitar', type: 'Electric Guitar' },
    { name: 'Acou Guitar', icon: 'guitar', type: 'Acoustic Guitar' },
    { name: 'Bass Guitar', icon: 'cx-bass-guitar', type: 'Bass Guitar' },
    { name: 'Keyboard', icon: 'piano', type: 'Keyboard DI' },
    { name: 'Synth', icon: 'cx-synth', type: 'Synthesizer' },
    { name: 'Brass / Horn', icon: 'cx-trumpet', type: 'Brass Instrument' },
    { name: 'Strings', icon: 'cx-violin', type: 'String Instrument' },
    { name: 'Shaker', icon: 'cx-shaker', type: 'Shaker' },
    { name: 'Tambourine', icon: 'cx-tambourine', type: 'Tambourine' },
  ],
  amps: [
    { name: 'Guitar Amp', icon: 'cx-guitar-amp', type: 'Guitar Amplifier' },
    { name: 'Bass Amp', icon: 'cx-bass-amp', type: 'Bass Amplifier' },
    { name: 'Amp Cab', icon: 'cx-amp-cab', type: 'Guitar Cabinet' },
    { name: 'Bass Cab', icon: 'cx-bass-cab', type: 'Bass Cabinet' },
  ],
  mon: [
    { name: 'Wedge', icon: 'cx-wedge', type: 'Floor Wedge' },
    { name: 'Floor PA', icon: 'volume-2', type: 'Powered Floor PA' },
    { name: 'Stage Sub', icon: 'disc', type: 'Stage Sub-Woofer' },
    { name: 'IEM Pack', icon: 'headphones', type: 'In-Ear Monitor' },
    { name: 'Drum Fill', icon: 'speaker', type: 'Drum Fill Monitor' },
    { name: 'Drum Sub', icon: 'disc-2', type: 'Drum Sub Monitor' },
    { name: 'Side Fill', icon: 'megaphone', type: 'Side Fill' },
    { name: 'Main PA L', icon: 'volume-2', type: 'Main PA Left' },
    { name: 'Main PA R', icon: 'volume-2', type: 'Main PA Right' },
    { name: 'Delay Tower', icon: 'radio', type: 'Delay Speaker Tower' },
    { name: 'Front Fill', icon: 'cx-front-fill', type: 'Front Fill Speaker' },
    { name: 'Headphone Amp', icon: 'headset', type: 'Headphone Amplifier' },
  ],
  util: [
    { name: 'Mixer', icon: 'sliders-horizontal', type: 'Stage Mixer' },
    { name: 'Power Distro', icon: 'zap', type: 'Power Distro' },
    { name: 'Stage Box', icon: 'box', type: 'Stage Box' },
    { name: 'Patch Bay', icon: 'grid-3x3', type: 'Patch Bay' },
    { name: 'Router', icon: 'network', type: 'Network Router' },
    { name: 'Splitter', icon: 'git-branch', type: 'Audio Splitter' },
    { name: 'FOH Console', icon: 'sliders-vertical', type: 'FOH Mixing Console' },
    { name: 'MON Console', icon: 'sliders-horizontal', type: 'Monitor Console' },
    { name: 'Amp Rack', icon: 'server', type: 'Amplifier Rack' },
    { name: 'Effects Rack', icon: 'cpu', type: 'Effects Rack' },
    { name: 'Wireless Rack', icon: 'cx-wireless-rack', type: 'Wireless Rack' },
    { name: 'Laptop', icon: 'laptop', type: 'Laptop / Computer' },
    { name: 'Intercom', icon: 'headset', type: 'Intercom System' },
    { name: 'DI Box', icon: 'cx-di-box', type: 'DI Box' },
    { name: 'Loop Station', icon: 'repeat-2', type: 'Loop Station' },
    { name: 'Playback', icon: 'play-circle', type: 'Playback Device' },
    { name: 'Outlet', icon: 'cx-outlet', type: 'Power Outlet' },
  ],
  people: [
    { name: 'Performer', icon: 'cx-person', type: 'Person' },
    { name: 'Vocalist', icon: 'cx-vocalist', type: 'Person' },
    { name: 'Guitarist', icon: 'cx-guitarist', type: 'Person' },
    { name: 'Bassist', icon: 'cx-bassist', type: 'Person' },
    { name: 'Drummer', icon: 'cx-drummer', type: 'Person' },
    { name: 'Keyboardist', icon: 'cx-keyboardist', type: 'Person' },
    { name: 'Saxophonist', icon: 'cx-saxophonist', type: 'Person' },
    { name: 'Tech', icon: 'cx-tech', type: 'Person' },
  ],
};

export const STAGEX_ICON_MAP: Record<string, string> = {
  mic: '/stage-core/icons/mic-sm58.png',
  'mic-2': '/stage-core/icons/mic-condenser.png',
  'cx-wireless': '/stage-core/icons/wireless-handheld.png',
  'cx-boundary': '/stage-core/icons/boundary-mic.png',
  'cx-drum-clip': '/stage-core/icons/drum-clip.png',
  'cx-mic-stand': '/stage-core/icons/mic-stand.svg',
  drum: '/stage-core/icons/drum-kit.png',
  'cx-edrum': '/stage-core/icons/edrum.png',
  'cx-percussion': '/stage-core/icons/percussion.png',
  'cx-cajon': '/stage-core/icons/cajon.svg',
  'cx-elec-guitar': '/stage-core/icons/elec-guitar.png',
  guitar: '/stage-core/icons/acoustic-guitar.png',
  'cx-bass-guitar': '/stage-core/icons/bass-guitar.png',
  piano: '/stage-core/icons/keyboard.png',
  'cx-synth': '/stage-core/icons/synth.png',
  'cx-trumpet': '/stage-core/icons/trumpet.png',
  'cx-violin': '/stage-core/icons/violin.png',
  'cx-shaker': '/stage-core/icons/shaker.svg',
  'cx-tambourine': '/stage-core/icons/tambourine.svg',
  'cx-guitar-amp': '/stage-core/icons/guitar-amp.png',
  'cx-bass-amp': '/stage-core/icons/bass-amp.png',
  'cx-amp-cab': '/stage-core/icons/amp-cab.png',
  'cx-bass-cab': '/stage-core/icons/bass-cab.png',
  'cx-wedge': '/stage-core/icons/wedge.png',
  'volume-2': '/stage-core/icons/main-pa.png',
  disc: '/stage-core/icons/stage-sub.png',
  headphones: '/stage-core/icons/iem-pack.png',
  speaker: '/stage-core/icons/drum-fill.png',
  'disc-2': '/stage-core/icons/drum-sub.svg',
  megaphone: '/stage-core/icons/side-fill.png',
  radio: '/stage-core/icons/delay-tower.svg',
  'cx-front-fill': '/stage-core/icons/front-fill.png',
  headset: '/stage-core/icons/headphone-amp.svg',
  'sliders-horizontal': '/stage-core/icons/mon-console.png',
  zap: '/stage-core/icons/power-distro.png',
  box: '/stage-core/icons/stage-box.png',
  'grid-3x3': '/stage-core/icons/patch-bay.png',
  network: '/stage-core/icons/router.svg',
  'git-branch': '/stage-core/icons/splitter.png',
  'sliders-vertical': '/stage-core/icons/foh-console.png',
  server: '/stage-core/icons/amp-rack.png',
  cpu: '/stage-core/icons/effects-rack.png',
  'cx-wireless-rack': '/stage-core/icons/wireless-rack.png',
  laptop: '/stage-core/icons/laptop.svg',
  'cx-di-box': '/stage-core/icons/di-box.png',
  'repeat-2': '/stage-core/icons/loop-station.svg',
  'play-circle': '/stage-core/icons/playback.svg',
  'cx-outlet': '/stage-core/icons/outlet.webp',
  'cx-person': '/stage-core/icons/person.png',
  'cx-vocalist': '/stage-core/icons/vocalist.png',
  'cx-guitarist': '/stage-core/icons/guitarist.png',
  'cx-bassist': '/stage-core/icons/bassist.png',
  'cx-drummer': '/stage-core/icons/drummer.png',
  'cx-keyboardist': '/stage-core/icons/keyboardist.png',
  'cx-saxophonist': '/stage-core/icons/saxophonist.png',
  'cx-tech': '/stage-core/icons/tech.png',
};

export const CATEGORY_ICONS: Record<string, string> = {
  mics: 'mic',
  drums: 'music_note',
  inst: 'electric_bolt',
  amps: 'speaker',
  mon: 'volume_up',
  util: 'settings_input_component',
  people: 'person',
  custom: 'add_circle',
  presets: 'bookmark',
};

export const CATEGORY_LABELS: Record<string, string> = {
  mics: 'Mics',
  drums: 'Drums',
  inst: 'Instruments',
  amps: 'Amps',
  mon: 'Audio',
  util: 'Utilities',
  people: 'People',
  custom: 'Custom',
  presets: 'Presets',
};

export const HIDE_IFRAME_UI = `
  #sc-fab-btn { display: none !important; }
  #sc-fab-wrap { display: none !important; }
  #sc-item-sheet { display: none !important; }
  #sc-dial-backdrop { display: none !important; }
  #sc-el-presets-panel { bottom: 80px !important; }
  #mobile-nav-bar { opacity: 0 !important; pointer-events: none !important; }
  @media screen and (orientation: landscape) and (max-width: 960px) {
    #sc-fab-wrap { display: none !important; }
  }
`;

export const HIDE_IFRAME_UI_MOBILE = `
  #sc-fab-btn { display: none !important; }
  #mobile-nav-bar { opacity: 0 !important; pointer-events: none !important; }
`;

export const getSimplifiedView = (view: string): string => {
  if (view === 'Editor') return 'Editor';
  if (view === 'Preferences' || view === 'Assistant') return 'Preferences';
  if (view === 'Export') return 'Export';
  return 'Setup';
};
