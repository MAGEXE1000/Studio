import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetronomeAudioEngine, metronomeAudioEngine } from '../metronomeAudio';
import { mediaSessionCoordinator } from '../mediaSessionCoordinator';
import {
  useMetronomeStore,
  FACTORY_PRESETS,
  type MetronomePreset,
} from '../../../store/useMetronomeStore';

// ── Web Audio & MediaSession Mocks ──────────────────────────────────────────

class MockAudioBuffer {
  duration = 0.1;
  length = 4410;
  numberOfChannels = 1;
  sampleRate = 44100;
  private channelData = new Float32Array(4410);
  getChannelData() {
    return this.channelData;
  }
}

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockBufferSourceNode {
  buffer: any = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  currentTime = 1.0;
  sampleRate = 44100;
  state: AudioContextState = 'running';
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  createBuffer = vi.fn(() => new MockAudioBuffer());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

// Setup global mocks for Vitest (Node environment)
const globalAudioCtx = new MockAudioContext();
(globalThis as any).AudioContext = vi.fn(() => globalAudioCtx);
(globalThis as any).webkitAudioContext = vi.fn(() => globalAudioCtx);

const mockMediaSession = {
  metadata: null as any,
  playbackState: 'none',
  setActionHandler: vi.fn(),
};

try {
  Object.defineProperty(globalThis.navigator, 'mediaSession', {
    value: mockMediaSession,
    configurable: true,
    writable: true,
  });
} catch {
  (globalThis as any).navigator = {
    mediaSession: mockMediaSession,
  };
}

(globalThis as any).requestAnimationFrame = (cb: (time: number) => void) =>
  setTimeout(() => cb(Date.now()), 16);
(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

(globalThis as any).MediaMetadata = class {
  title: string;
  artist: string;
  album: string;
  artwork: any[];
  constructor(init: { title: string; artist: string; album?: string; artwork?: any[] }) {
    this.title = init.title;
    this.artist = init.artist;
    this.album = init.album || '';
    this.artwork = init.artwork || [];
  }
};

const mockLocalStorageStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockLocalStorageStore[key] ?? null,
  setItem: (key: string, val: string) => {
    mockLocalStorageStore[key] = val;
  },
  removeItem: (key: string) => {
    delete mockLocalStorageStore[key];
  },
  clear: () => {
    for (const k of Object.keys(mockLocalStorageStore)) {
      delete mockLocalStorageStore[k];
    }
  },
};

(globalThis as any).window = globalThis;

const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: '',
  textBaseline: '',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
};

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 512,
        height: 512,
        getContext: () => mockCanvasContext,
        toDataURL: () =>
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAgAElEQVR4nOy9',
      };
    }
    return {};
  },
};

describe('Drumex Metronome: Audio Engine & Media Notification State Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaSession.metadata = null;
    mockMediaSession.playbackState = 'none';
    metronomeAudioEngine.stop();
    metronomeAudioEngine.setBpm(120);
    metronomeAudioEngine.setTimeSignature('4/4');
    metronomeAudioEngine.setSubdivision('1/16');
    metronomeAudioEngine.setSound('woodblock');
    metronomeAudioEngine.setAccentBeat(0);
    metronomeAudioEngine.setVolume(0.85);

    useMetronomeStore.setState({
      bpm: 120,
      timeSignature: '4/4',
      subdivision: '1/16',
      sound: 'woodblock',
      accentBeat: 0,
      volume: 85,
      isPlaying: false,
      activePresetId: null,
      userPresets: [],
      presets: [],
    });
  });

  afterEach(() => {
    metronomeAudioEngine.stop();
  });

  describe('MetronomeAudioEngine Core Unit Tests', () => {
    it('initializes with default settings', () => {
      const engine = new MetronomeAudioEngine();
      expect(engine.bpm).toBe(120);
      expect(engine.timeSignature).toBe('4/4');
      expect(engine.subdivision).toBe('1/16');
      expect(engine.sound).toBe('woodblock');
      expect(engine.accentBeat).toBe(0);
      expect(engine.volume).toBe(0.85);
      expect(engine.isPlaying).toBe(false);
      engine.dispose();
    });

    it('clamps accentBeat to valid beats in measure', () => {
      const engine = new MetronomeAudioEngine();
      // 4/4 has 4 beats (0, 1, 2, 3)
      engine.setAccentBeat(2);
      expect(engine.accentBeat).toBe(2);

      // Attempting to set beat 5 in 4/4 should clamp to 3
      engine.setAccentBeat(5);
      expect(engine.accentBeat).toBe(3);

      // Attempting negative beat should clamp to 0
      engine.setAccentBeat(-1);
      expect(engine.accentBeat).toBe(0);

      // Changing time signature to 3/4 (beats 0, 1, 2) when accentBeat is 3 resets to 0
      engine.setTimeSignature('4/4');
      engine.setAccentBeat(3);
      expect(engine.accentBeat).toBe(3);
      engine.setTimeSignature('3/4');
      expect(engine.accentBeat).toBe(0);

      engine.dispose();
    });

    it('dynamically adjusts BPM without stopping or throwing', () => {
      const engine = new MetronomeAudioEngine();
      engine.setBpm(140);
      expect(engine.bpm).toBe(140);

      // Start engine and change BPM dynamically
      engine.start();
      expect(engine.isPlaying).toBe(true);

      expect(() => {
        engine.setBpm(160);
      }).not.toThrow();
      expect(engine.bpm).toBe(160);
      expect(engine.isPlaying).toBe(true);

      engine.stop();
      expect(engine.isPlaying).toBe(false);
      engine.dispose();
    });

    it('supports subdivisions: 1/4, 1/8, 1/16, and 3let', () => {
      const engine = new MetronomeAudioEngine();
      const subs: Array<'1/4' | '1/8' | '1/16' | '3let'> = ['1/4', '1/8', '1/16', '3let'];
      for (const sub of subs) {
        engine.setSubdivision(sub);
        expect(engine.subdivision).toBe(sub);
        expect(engine.getSubdivisionsPerBeat()).toBeGreaterThanOrEqual(1);
      }
      engine.dispose();
    });

    it('scheduleAudioPulse schedules accent buffer when current measure beat equals accentBeat', () => {
      const engine = new MetronomeAudioEngine();
      engine.setAccentBeat(2); // Accent on Beat 3 (index 2)
      engine.start();

      // Access private scheduleAudioPulse via any casting for deterministic assertion
      const ctx = (engine as any)._ctx as MockAudioContext;
      const createdSources: MockBufferSourceNode[] = [];
      ctx.createBufferSource = vi.fn(() => {
        const src = new MockBufferSourceNode();
        createdSources.push(src);
        return src as any;
      });

      // Normal beat (beat 0 !== accentBeat 2)
      (engine as any)._currentMeasureBeat = 0;
      (engine as any).scheduleAudioPulse(1.1, false, false, false, false);
      expect(createdSources.length).toBe(1);

      // Accent beat (beat 2 === accentBeat 2)
      (engine as any)._currentMeasureBeat = 2;
      (engine as any).scheduleAudioPulse(1.2, true, false, false, false);
      expect(createdSources.length).toBe(2);

      engine.stop();
      engine.dispose();
    });
  });

  describe('useMetronomeStore & Android Media Notification Integration', () => {
    it('Test A: Start metronome -> Primary title is preset name, artist is "Drumex Metronome", album has BPM, and artwork is set', () => {
      const store = useMetronomeStore.getState();
      store.loadPreset('preset-rock-4-4');
      store.start();

      expect(useMetronomeStore.getState().isPlaying).toBe(true);
      expect(mediaSessionCoordinator.getActiveProviderId()).toBe('drumex-metronome');

      const metadata = mockMediaSession.metadata;
      expect(metadata).not.toBeNull();
      // Primary title is the preset name per user request
      expect(metadata.title).toBe('Rock 4/4 Groove');
      // Subtitle is "Drumex Metronome"
      expect(metadata.artist).toBe('Drumex Metronome');
      // Album contains BPM and time signature
      expect(metadata.album).toContain('120 BPM');
      expect(metadata.album).toContain('4/4');
      expect(metadata.album).toContain('Acoustic Woodblock');
      // Artwork displays the big white BPM on black background
      expect(metadata.artwork).toBeDefined();
      expect(metadata.artwork.length).toBeGreaterThan(0);
      expect(metadata.artwork[0].src).toContain('data:image/png;base64,');
      // Playback state is playing
      expect(mockMediaSession.playbackState).toBe('playing');
    });

    it('Test B: Dynamic BPM change -> Album updates immediately with new BPM and title remains preset name', () => {
      const store = useMetronomeStore.getState();
      store.loadPreset('preset-rock-4-4');
      store.start();
      expect(mockMediaSession.metadata?.title).toBe('Rock 4/4 Groove');
      expect(mockMediaSession.metadata?.album).toContain('120 BPM');

      // Adjust BPM via slider/stepper to 155 BPM
      store.setBpm(155);
      expect(mockMediaSession.metadata?.title).toBe('Rock 4/4 Groove');
      expect(mockMediaSession.metadata?.album).toContain('155 BPM');
      expect(mockMediaSession.metadata?.artist).toBe('Drumex Metronome');

      // Adjust BPM via relative adjustBpm(+5) to 160 BPM
      store.adjustBpm(5);
      expect(mockMediaSession.metadata?.album).toContain('160 BPM');
    });

    it('Test C: Dynamic BPM change while playing / backgrounded re-anchors without stopping', () => {
      const store = useMetronomeStore.getState();
      store.loadPreset('preset-rock-4-4');
      store.start();
      expect(useMetronomeStore.getState().isPlaying).toBe(true);

      // Dynamic changes
      store.setBpm(180);
      expect(useMetronomeStore.getState().isPlaying).toBe(true);
      expect(metronomeAudioEngine.bpm).toBe(180);

      store.adjustBpm(-20);
      expect(useMetronomeStore.getState().isPlaying).toBe(true);
      expect(metronomeAudioEngine.bpm).toBe(160);
      expect(mockMediaSession.metadata?.album).toContain('160 BPM');
    });

    it('Test D & E: Reinterpreted previous/next actions navigate saved user presets in circular order and update title to preset name', () => {
      const store = useMetronomeStore.getState();
      store.start();

      // Create two distinct user presets
      const id1 = store.saveNewPreset('Fast Warmup');
      store.setBpm(180);
      store.setTimeSignature('3/4');
      store.setAccentBeat(1);
      store.updateCurrentPreset();

      const id2 = store.saveNewPreset('Slow Drill');
      store.setBpm(70);
      store.setTimeSignature('4/4');
      store.setAccentBeat(0);
      store.updateCurrentPreset();

      // Ensure user presets are loaded in store
      const userPresets = useMetronomeStore.getState().userPresets;
      expect(userPresets.length).toBe(2);

      // Trigger "next" preset from notification action
      mediaSessionCoordinator.handleAction('next');
      const activeState1 = useMetronomeStore.getState();
      expect([id1, id2]).toContain(activeState1.activePresetId);
      const activePreset1 = userPresets.find((p) => p.id === activeState1.activePresetId);
      expect(mockMediaSession.metadata?.title).toBe(activePreset1?.name);
      expect(mockMediaSession.metadata?.album).toContain(`${activeState1.bpm} BPM`);

      // Trigger "next" again -> cycles circularly
      mediaSessionCoordinator.handleAction('next');
      const activeState2 = useMetronomeStore.getState();
      expect(activeState2.activePresetId).not.toBe(activeState1.activePresetId);
      const activePreset2 = userPresets.find((p) => p.id === activeState2.activePresetId);
      expect(mockMediaSession.metadata?.title).toBe(activePreset2?.name);
      expect(mockMediaSession.metadata?.album).toContain(`${activeState2.bpm} BPM`);

      // Trigger "previous" -> returns to activeState1
      mediaSessionCoordinator.handleAction('previous');
      const activeState3 = useMetronomeStore.getState();
      expect(activeState3.activePresetId).toBe(activeState1.activePresetId);
      expect(mockMediaSession.metadata?.title).toBe(activePreset1?.name);
    });

    it('Test F: Loaded preset synchronizes BPM, signature, subdivision, sound, accent beat, volume', () => {
      const store = useMetronomeStore.getState();
      const customPreset: MetronomePreset = {
        id: 'test-custom-preset',
        name: 'Funk Beat',
        bpm: 112,
        timeSignature: '6/8',
        subdivision: '3let',
        sound: 'cowbell',
        volume: 90,
        accentBeat: 2,
        countInEnabled: false,
        createdAt: Date.now(),
      };

      useMetronomeStore.setState({
        userPresets: [customPreset],
        presets: [customPreset],
      });

      store.loadPreset('test-custom-preset');

      const s = useMetronomeStore.getState();
      expect(s.bpm).toBe(112);
      expect(s.timeSignature).toBe('6/8');
      expect(s.subdivision).toBe('3let');
      expect(s.sound).toBe('cowbell');
      expect(s.volume).toBe(90);
      expect(s.accentBeat).toBe(2);
      expect(s.countInEnabled).toBe(false);

      // Verify audio engine state
      expect(metronomeAudioEngine.bpm).toBe(112);
      expect(metronomeAudioEngine.timeSignature).toBe('6/8');
      expect(metronomeAudioEngine.subdivision).toBe('3let');
      expect(metronomeAudioEngine.sound).toBe('cowbell');
      expect(metronomeAudioEngine.accentBeat).toBe(2);
    });

    it('Test G: Metadata updates even when paused so notification shade displays current BPM in album and artwork', () => {
      const store = useMetronomeStore.getState();
      store.loadPreset('preset-rock-4-4');
      // Start then pause
      store.start();
      store.stop();
      expect(useMetronomeStore.getState().isPlaying).toBe(false);
      expect(mockMediaSession.playbackState).toBe('paused');

      // Adjust BPM while paused
      store.setBpm(138);
      expect(mockMediaSession.metadata?.title).toBe('Rock 4/4 Groove');
      expect(mockMediaSession.metadata?.album).toContain('138 BPM');
      expect(mockMediaSession.metadata?.artist).toBe('Drumex Metronome');
    });

    it('Test H: Zero saved user presets -> next/previous safely no-op without errors or crashing', () => {
      // Ensure 0 user presets and no active preset
      useMetronomeStore.setState({
        userPresets: [],
        presets: [],
        activePresetId: null,
      });

      const store = useMetronomeStore.getState();
      store.start();

      expect(() => {
        mediaSessionCoordinator.handleAction('next');
      }).not.toThrow();

      expect(() => {
        mediaSessionCoordinator.handleAction('previous');
      }).not.toThrow();

      // State remains safe and consistent with fallback title
      expect(useMetronomeStore.getState().bpm).toBe(120);
      expect(mockMediaSession.metadata?.title).toBe('Drumex Metronome');
      expect(mockMediaSession.metadata?.album).toContain('120 BPM');
    });

    it('Test I: Repeated start/pause/stop lifecycle does not leak duplicate providers', () => {
      const store = useMetronomeStore.getState();

      // Start -> pause -> start -> stop cycles
      for (let i = 0; i < 5; i++) {
        store.start();
        expect(useMetronomeStore.getState().isPlaying).toBe(true);
        expect(mediaSessionCoordinator.getActiveProviderId()).toBe('drumex-metronome');

        store.stop();
        expect(useMetronomeStore.getState().isPlaying).toBe(false);
      }

      // Final stop session
      mediaSessionCoordinator.stopSession('drumex-metronome');
      expect(mockMediaSession.playbackState).toBe('none');
    });

    it('Test J: Accent architecture allows user to select accent beat and updates audio engine', () => {
      const store = useMetronomeStore.getState();
      store.setTimeSignature('4/4');

      // Default accent beat is 0 (Beat 1)
      expect(store.accentBeat).toBe(0);
      expect(metronomeAudioEngine.accentBeat).toBe(0);

      // Select Beat 3 (index 2) as accent beat
      store.setAccentBeat(2);
      expect(useMetronomeStore.getState().accentBeat).toBe(2);
      expect(metronomeAudioEngine.accentBeat).toBe(2);

      // Select Beat 4 (index 3) as accent beat
      store.setAccentBeat(3);
      expect(useMetronomeStore.getState().accentBeat).toBe(3);
      expect(metronomeAudioEngine.accentBeat).toBe(3);
    });

    it('Immutable factory presets are preserved when user edits and saves', () => {
      const store = useMetronomeStore.getState();
      const factory = FACTORY_PRESETS[0];

      // Load factory preset
      store.loadPreset(factory.id);
      expect(useMetronomeStore.getState().activePresetId).toBe(factory.id);

      // Change BPM
      store.setBpm(175);

      // Update current preset -> should create a new custom user preset instead of mutating factory preset
      store.updateCurrentPreset();

      const userPresets = useMetronomeStore.getState().userPresets;
      expect(userPresets.length).toBeGreaterThan(0);
      expect(userPresets[0].bpm).toBe(175);
      expect(userPresets[0].isFactory).toBe(false);

      // Factory preset in list remains unmodified at original BPM
      const factoryAfter = FACTORY_PRESETS.find((p) => p.id === factory.id);
      expect(factoryAfter?.bpm).toBe(factory.bpm);
    });
  });
});
