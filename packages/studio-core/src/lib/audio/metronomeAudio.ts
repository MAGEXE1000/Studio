import { createAudioContext } from './audioContextOptions';

export type MetronomeTimeSignature = '4/4' | '3/4' | '6/8' | '2/4';
export type MetronomeSubdivision = '1/4' | '1/8' | '1/16' | '3let';
export type MetronomeSoundId = 'woodblock' | 'click' | 'digital' | 'cowbell' | 'rimshot' | 'soft';

export interface MetronomeBeatEvent {
  beatIndex: number;
  subdivisionIndex: number;
  isAccent: boolean;
  isCountIn: boolean;
  time: number;
}

export interface MetronomeAudioConfig {
  bpm: number;
  timeSignature: MetronomeTimeSignature;
  subdivision: MetronomeSubdivision;
  sound: MetronomeSoundId;
  accentBeat?: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  countInEnabled: boolean;
  countInBars: number;
}

const LOOKAHEAD_TIME = 0.12; // 120ms lookahead
const SCHEDULER_TICK_MS = 25; // 25ms timer pump

export class MetronomeAudioEngine {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _timerId: any = null;
  private _rafId: number | null = null;

  // Config
  private _bpm: number = 120;
  private _timeSignature: MetronomeTimeSignature = '4/4';
  private _subdivision: MetronomeSubdivision = '1/16';
  private _sound: MetronomeSoundId = 'woodblock';
  private _accentBeat: number = 0;
  private _volume: number = 0.85;
  private _isMuted: boolean = false;
  private _countInEnabled: boolean = true;
  private _countInBars: number = 1;

  // Playback state
  private _isPlaying: boolean = false;
  private _inCountIn: boolean = false;
  private _countInBeatsRemaining: number = 0;
  private _t0: number = 0;
  private _beatIndexTotal: number = 0;
  private _currentMeasureBeat: number = 0;
  private _nextBeatTime: number = 0;

  // Queue of scheduled events for visual sync
  private _scheduledEvents: MetronomeBeatEvent[] = [];
  private _lastDispatchedEventTime: number = -1;

  // Sound kit cache (AudioBuffers)
  private _soundBuffers: Map<string, AudioBuffer> = new Map();

  // Callbacks
  public onBeat?: (event: MetronomeBeatEvent) => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;

  constructor() {
    // Lazy audio context init on user gesture
  }

  private initAudio() {
    if (!this._ctx || this._ctx.state === 'closed') {
      this._ctx = createAudioContext();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.setValueAtTime(this._isMuted ? 0 : this._volume, this._ctx.currentTime);
      this._masterGain.connect(this._ctx.destination);
      this.synthesizeAllSounds();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
  }

  /**
   * Synthesize clean, professional percussive samples locally into AudioBuffers.
   * Guarantees 0 network latency, consistent loudness, and 0 external dependencies.
   */
  private synthesizeAllSounds() {
    if (!this._ctx) return;
    const sounds: MetronomeSoundId[] = [
      'woodblock',
      'click',
      'digital',
      'cowbell',
      'rimshot',
      'soft',
    ];
    for (const s of sounds) {
      this._soundBuffers.set(`${s}-accent`, this.synthesizeBuffer(s, true));
      this._soundBuffers.set(`${s}-normal`, this.synthesizeBuffer(s, false));
      this._soundBuffers.set(`${s}-sub`, this.synthesizeBuffer(s, false, true));
    }
    // Dedicated count-in sound
    this._soundBuffers.set('count-in-high', this.synthesizeCountInBuffer(true));
    this._soundBuffers.set('count-in-low', this.synthesizeCountInBuffer(false));
  }

  private synthesizeBuffer(sound: MetronomeSoundId, isAccent: boolean, isSub = false): AudioBuffer {
    const ctx = this._ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = sound === 'cowbell' ? 0.09 : sound === 'woodblock' ? 0.055 : 0.04;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const gainMult = isSub ? 0.35 : isAccent ? 1.0 : 0.68;

    switch (sound) {
      case 'woodblock': {
        // Dual-resonant cavity wood strike with fast impact transient
        const f1 = isAccent ? 1520 : 1080;
        const f2 = isAccent ? 2300 : 1650;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 90);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 800) * 0.25;
          const tone =
            Math.sin(2 * Math.PI * f1 * t) * 0.65 + Math.sin(2 * Math.PI * f2 * t) * 0.35;
          data[i] = (tone + noise) * env * gainMult;
        }
        break;
      }
      case 'click': {
        // Clean tactile mechanical click
        const f = isAccent ? 3200 : 2400;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 180);
          const click = (Math.random() * 2 - 1) * Math.exp(-t * 1200) * 0.45;
          const tone = Math.sin(2 * Math.PI * f * t) * 0.55;
          data[i] = (tone + click) * env * gainMult;
        }
        break;
      }
      case 'digital': {
        // Pure studio digital tone with smooth window
        const f = isAccent ? 2200 : 1350;
        const envDur = 0.028;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          if (t > envDur) {
            data[i] = 0;
            continue;
          }
          const env = Math.sin((Math.PI * t) / envDur);
          data[i] = Math.sin(2 * Math.PI * f * t) * env * gainMult * 0.9;
        }
        break;
      }
      case 'cowbell': {
        // Inharmonic metallic bell modes
        const f1 = isAccent ? 630 : 587;
        const f2 = isAccent ? 910 : 845;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 45);
          const m1 = Math.sin(2 * Math.PI * f1 * t) > 0 ? 0.6 : -0.6;
          const m2 = Math.sin(2 * Math.PI * f2 * t) > 0 ? 0.4 : -0.4;
          const click = (Math.random() * 2 - 1) * Math.exp(-t * 600) * 0.15;
          data[i] = (m1 + m2 + click) * env * gainMult * 0.75;
        }
        break;
      }
      case 'rimshot': {
        // High transient snap + snare shell body
        const f = isAccent ? 740 : 610;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 120);
          const snap = (Math.random() * 2 - 1) * Math.exp(-t * 500) * 0.5;
          const body = Math.sin(2 * Math.PI * f * t) * 0.5;
          data[i] = (snap + body) * env * gainMult;
        }
        break;
      }
      case 'soft': {
        // Warm, rounded non-fatiguing practice click
        const f = isAccent ? 880 : 640;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const attack = Math.min(1, t / 0.003);
          const decay = Math.exp(-t * 110);
          data[i] = Math.sin(2 * Math.PI * f * t) * attack * decay * gainMult * 0.85;
        }
        break;
      }
    }
    return buffer;
  }

  private synthesizeCountInBuffer(isHigh: boolean): AudioBuffer {
    const ctx = this._ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 0.045;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f = isHigh ? 2400 : 1600;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 140);
      const tone = Math.sin(2 * Math.PI * f * t);
      data[i] = tone * env * 0.95;
    }
    return buffer;
  }

  // ── Metrics Calculation ──────────────────────────────────────────────────

  public getBeatsPerMeasure(): number {
    switch (this._timeSignature) {
      case '3/4':
        return 3;
      case '6/8':
        return 6;
      case '2/4':
        return 2;
      case '4/4':
      default:
        return 4;
    }
  }

  public getSubdivisionsPerBeat(): number {
    switch (this._subdivision) {
      case '1/8':
        return 2;
      case '1/16':
        return 4;
      case '3let':
        return 3;
      case '1/4':
      default:
        return 1;
    }
  }

  public getBeatInterval(): number {
    return 60 / this._bpm;
  }

  // ── Playback Controls ────────────────────────────────────────────────────

  public start() {
    this.initAudio();
    if (!this._ctx) return;

    this.stop();
    this._isPlaying = true;
    this._scheduledEvents = [];
    this._lastDispatchedEventTime = -1;

    const beatsPerBar = this.getBeatsPerMeasure();
    if (this._countInEnabled) {
      this._inCountIn = true;
      this._countInBeatsRemaining = beatsPerBar * Math.max(1, this._countInBars);
    } else {
      this._inCountIn = false;
      this._countInBeatsRemaining = 0;
    }

    // Lead-time: 50ms into the future for rock-solid start
    this._t0 = this._ctx.currentTime + 0.05;
    this._beatIndexTotal = 0;
    this._currentMeasureBeat = 0;
    this._nextBeatTime = this._t0;

    this.scheduleLookahead();
    this._timerId = setInterval(() => this.scheduleLookahead(), SCHEDULER_TICK_MS);
    this.startVisualSyncLoop();

    this.onPlayStateChange?.(true);
  }

  public stop() {
    this._isPlaying = false;
    this._inCountIn = false;
    this._countInBeatsRemaining = 0;

    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    this._scheduledEvents = [];
    this.onPlayStateChange?.(false);
  }

  public togglePlay() {
    if (this._isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  // ── Authoritative Web Audio Lookahead Scheduler ──────────────────────────

  private scheduleLookahead() {
    if (!this._isPlaying || !this._ctx || !this._masterGain) return;

    const currentTime = this._ctx.currentTime;
    const windowEnd = currentTime + LOOKAHEAD_TIME;
    const beatInterval = this.getBeatInterval();
    const beatsPerMeasure = this.getBeatsPerMeasure();
    const subsPerBeat = this.getSubdivisionsPerBeat();
    const subInterval = beatInterval / subsPerBeat;

    while (this._nextBeatTime < windowEnd) {
      const beatTime = this._nextBeatTime;
      const isCountIn = this._inCountIn;
      const isAccent = this._currentMeasureBeat === this._accentBeat;

      // 1. Schedule the main beat
      this.scheduleAudioPulse(beatTime, isAccent, false, isCountIn, this._currentMeasureBeat === 0);

      // Record in queue for visual UI
      this._scheduledEvents.push({
        beatIndex: this._currentMeasureBeat,
        subdivisionIndex: 0,
        isAccent,
        isCountIn,
        time: beatTime,
      });

      // 2. Schedule intermediate subdivisions (if not in count-in)
      if (!isCountIn && subsPerBeat > 1) {
        for (let subIdx = 1; subIdx < subsPerBeat; subIdx++) {
          const subTime = beatTime + subIdx * subInterval;
          this.scheduleAudioPulse(subTime, false, true, false, false);
          this._scheduledEvents.push({
            beatIndex: this._currentMeasureBeat,
            subdivisionIndex: subIdx,
            isAccent: false,
            isCountIn: false,
            time: subTime,
          });
        }
      }

      // 3. Advance to next beat
      this._beatIndexTotal++;
      this._currentMeasureBeat = (this._currentMeasureBeat + 1) % beatsPerMeasure;

      // Calculate next beat time analytically: t0 + (k * beatInterval) prevents cumulative drift!
      this._nextBeatTime = this._t0 + this._beatIndexTotal * beatInterval;

      // Handle count-in countdown
      if (this._inCountIn) {
        this._countInBeatsRemaining--;
        if (this._countInBeatsRemaining <= 0) {
          this._inCountIn = false;
          // Synchronize main metronome to start right on the next measure boundary
          this._currentMeasureBeat = 0;
          this._t0 = this._nextBeatTime;
          this._beatIndexTotal = 0;
        }
      }
    }

    // Prune events that are older than 300ms from queue
    const pruneThreshold = currentTime - 0.3;
    if (this._scheduledEvents.length > 50) {
      this._scheduledEvents = this._scheduledEvents.filter((e) => e.time >= pruneThreshold);
    }
  }

  private scheduleAudioPulse(
    time: number,
    isAccent: boolean,
    isSub: boolean,
    isCountIn: boolean,
    countInHigh: boolean
  ) {
    if (!this._ctx || !this._masterGain) return;

    let bufferKey: string;
    if (isCountIn) {
      bufferKey = countInHigh ? 'count-in-high' : 'count-in-low';
    } else if (isSub) {
      bufferKey = `${this._sound}-sub`;
    } else {
      bufferKey = isAccent ? `${this._sound}-accent` : `${this._sound}-normal`;
    }

    let buffer = this._soundBuffers.get(bufferKey);
    if (!buffer) {
      buffer = this.synthesizeBuffer(this._sound, isAccent, isSub);
      this._soundBuffers.set(bufferKey, buffer);
    }

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this._masterGain);

    const safeTime = Math.max(time, this._ctx.currentTime + 0.002);
    source.start(safeTime);

    // Auto-clean: AudioBufferSourceNode is automatically garbage collected once ended
  }

  // ── Visual UI Synchronization Loop (rAF) ─────────────────────────────────

  private startVisualSyncLoop() {
    const loop = () => {
      if (!this._isPlaying) return;

      if (this._ctx) {
        const now = this._ctx.currentTime;
        // Find the latest scheduled event that has started playing
        let latestEvent: MetronomeBeatEvent | null = null;
        for (let i = 0; i < this._scheduledEvents.length; i++) {
          const ev = this._scheduledEvents[i];
          if (ev.time <= now) {
            latestEvent = ev;
          } else {
            break;
          }
        }

        if (latestEvent && latestEvent.time > this._lastDispatchedEventTime) {
          this._lastDispatchedEventTime = latestEvent.time;
          this.onBeat?.(latestEvent);
        }
      }

      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  // ── Dynamic Property Setters ─────────────────────────────────────────────

  public setBpm(newBpm: number) {
    const clamped = Math.max(40, Math.min(280, Math.round(newBpm)));
    if (this._bpm === clamped) return;

    if (this._isPlaying && this._ctx) {
      // Re-anchor timeline smoothly without stutter or beat jumps
      const now = this._ctx.currentTime;
      this._t0 = Math.max(this._nextBeatTime, now + 0.01);
      this._beatIndexTotal = 0;
      this._nextBeatTime = this._t0;
    }
    this._bpm = clamped;
  }

  public setTimeSignature(sig: MetronomeTimeSignature) {
    if (this._timeSignature === sig) return;
    this._timeSignature = sig;
    const maxBeat = this.getBeatsPerMeasure() - 1;
    if (this._accentBeat > maxBeat) {
      this._accentBeat = 0;
    }
    if (this._isPlaying && this._ctx) {
      const now = this._ctx.currentTime;
      this._t0 = Math.max(this._nextBeatTime, now + 0.01);
      this._beatIndexTotal = 0;
      this._currentMeasureBeat = 0;
      this._nextBeatTime = this._t0;
    }
  }

  public setAccentBeat(beatIndex: number) {
    const maxBeat = this.getBeatsPerMeasure() - 1;
    this._accentBeat = Math.max(0, Math.min(maxBeat, Math.round(beatIndex)));
  }

  public get accentBeat(): number {
    return this._accentBeat;
  }

  public setSubdivision(sub: MetronomeSubdivision) {
    this._subdivision = sub;
  }

  public setSound(sound: MetronomeSoundId) {
    this._sound = sound;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this._volume = clamped;
    if (this._masterGain && this._ctx) {
      const t = this._ctx.currentTime;
      this._masterGain.gain.cancelScheduledValues(t);
      this._masterGain.gain.linearRampToValueAtTime(this._isMuted ? 0 : clamped, t + 0.015);
    }
  }

  public setMuted(muted: boolean) {
    this._isMuted = muted;
    if (this._masterGain && this._ctx) {
      const t = this._ctx.currentTime;
      this._masterGain.gain.cancelScheduledValues(t);
      this._masterGain.gain.linearRampToValueAtTime(muted ? 0 : this._volume, t + 0.015);
    }
  }

  public setCountIn(enabled: boolean, bars: number = 1) {
    this._countInEnabled = enabled;
    this._countInBars = Math.max(1, bars);
  }

  // ── Cleanup & Teardown ───────────────────────────────────────────────────

  public dispose() {
    this.stop();
    if (this._masterGain) {
      try {
        this._masterGain.disconnect();
      } catch {}
      this._masterGain = null;
    }
    if (this._ctx && this._ctx.state !== 'closed') {
      try {
        this._ctx.close();
      } catch {}
      this._ctx = null;
    }
    this._soundBuffers.clear();
    this._scheduledEvents = [];
  }

  // Getters
  public get isPlaying(): boolean {
    return this._isPlaying;
  }
  public get bpm(): number {
    return this._bpm;
  }
  public get timeSignature(): MetronomeTimeSignature {
    return this._timeSignature;
  }
  public get subdivision(): MetronomeSubdivision {
    return this._subdivision;
  }
  public get sound(): MetronomeSoundId {
    return this._sound;
  }
  public get volume(): number {
    return this._volume;
  }
  public get isMuted(): boolean {
    return this._isMuted;
  }
  public get countInEnabled(): boolean {
    return this._countInEnabled;
  }
}

// Global shared instance
export const metronomeAudioEngine = new MetronomeAudioEngine();
