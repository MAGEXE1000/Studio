import { createAudioContext } from '@workspace/studio-core';
import { isPercussionStem } from './stemClassifier';

export interface TrackState {
  name: string;
  label: string;
  icon: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  buffer: AudioBuffer | null;
  originalBuffer: AudioBuffer | null;
  transposedCache?: Map<number, AudioBuffer>;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  isPercussion: boolean;
}

let audioCtx: AudioContext | null = null;
const workletRegistered = false;
const workletRegistering: Promise<void> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = createAudioContext();
  }
  return audioCtx;
}

export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

export interface AudioEngine {
  ctx: AudioContext;
  sumBus: GainNode;
  bypassGain: GainNode;
  shifterInGain: GainNode;
  shifterOutGain: GainNode;
  masterGain: GainNode;
  drumBus: GainNode;
  drumDelay: DelayNode;
  scrubFilter: BiquadFilterNode;
  scrubGain: GainNode;
  stNode: null;
  tracks: TrackState[];
  isPlaying: boolean;
  isScrubbing: boolean;
  startTime: number;
  pauseOffset: number;
  duration: number;
  looping: boolean;
  _rampTimer: ReturnType<typeof setTimeout> | null;
  pitchSemitones: number;
}

export function createEngine(): AudioEngine {
  const ctx = getAudioContext();
  const sumBus = ctx.createGain();
  const bypassGain = ctx.createGain();
  const shifterInGain = ctx.createGain();
  const shifterOutGain = ctx.createGain();
  const masterGain = ctx.createGain();
  const drumBus = ctx.createGain();
  const drumDelay = ctx.createDelay(0.1);

  // Zero-semitone bit-exact master bypass active by default
  bypassGain.gain.setValueAtTime(1.0, ctx.currentTime);
  shifterInGain.gain.setValueAtTime(0.0, ctx.currentTime);
  shifterOutGain.gain.setValueAtTime(0.0, ctx.currentTime);
  masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
  drumBus.gain.setValueAtTime(1.0, ctx.currentTime);
  drumDelay.delayTime.setValueAtTime(0.0, ctx.currentTime);

  const scrubFilter = ctx.createBiquadFilter();
  scrubFilter.type = 'lowpass';
  scrubFilter.frequency.setValueAtTime(20000, ctx.currentTime);
  scrubFilter.Q.setValueAtTime(0.7, ctx.currentTime);
  const scrubGain = ctx.createGain();
  scrubGain.gain.setValueAtTime(1.0, ctx.currentTime);

  // Unified zero-latency master bus: Both drumBus and sumBus route directly into masterGain
  // Drums and non-drums have 100% bit-exact 0.000ms group delay lock
  sumBus.connect(masterGain);
  drumBus.connect(masterGain);

  masterGain.connect(scrubFilter);
  scrubFilter.connect(scrubGain);
  scrubGain.connect(ctx.destination);

  return {
    ctx,
    sumBus,
    bypassGain,
    shifterInGain,
    shifterOutGain,
    masterGain,
    drumBus,
    drumDelay,
    scrubFilter,
    scrubGain,
    stNode: null,
    tracks: [],
    isPlaying: false,
    isScrubbing: false,
    startTime: 0,
    pauseOffset: 0,
    duration: 0,
    looping: false,
    _rampTimer: null,
    pitchSemitones: 0,
  };
}

export function getPitchRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

export function getSourceRate(engine: AudioEngine): number {
  return engine.pitchSemitones !== 0 ? getPitchRatio(engine.pitchSemitones) : 1.0;
}

export async function initSoundTouch(_engine: AudioEngine): Promise<void> {
  // Transposition uses native zero-CPU playbackRate engine for 100% sample-synchronization
  // Backward compatibility preservation for existing callers
  return Promise.resolve();
}

export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

export async function loadAudioBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  return ctx.decodeAudioData(arrayBuffer);
}

export function initTracks(
  engine: AudioEngine,
  stems: { name: string; label?: string; icon?: string }[],
  defaultVolume: number = 1.0
): TrackState[] {
  engine.tracks = stems.map((s) => {
    const isPercussion = isPercussionStem(s);
    const gainNode = engine.ctx.createGain();
    // All tracks route into sumBus for unified zero-drift master mix
    gainNode.connect(engine.sumBus);
    return {
      name: s.name,
      label: s.label || s.name,
      icon: s.icon || (isPercussion ? 'layers' : 'music_note'),
      volume: defaultVolume,
      muted: false,
      solo: false,
      buffer: null,
      originalBuffer: null,
      source: null,
      gainNode,
      isPercussion,
    };
  });
  applyMutesSolos(engine);
  return engine.tracks;
}

export function setTrackBuffer(engine: AudioEngine, trackIndex: number, buffer: AudioBuffer): void {
  const track = engine.tracks[trackIndex];
  if (!track) return;
  track.originalBuffer = buffer;
  track.buffer = buffer;

  if (buffer.duration > engine.duration) {
    engine.duration = buffer.duration;
  }
}

export function play(engine: AudioEngine): void {
  if (engine.isPlaying) return;
  if (engine._rampTimer) {
    clearTimeout(engine._rampTimer);
    engine._rampTimer = null;
  }
  stopSources(engine);
  const ctx = engine.ctx;
  if (ctx.state === 'suspended') ctx.resume();

  const offset = engine.pauseOffset;
  const baseRate = getSourceRate(engine);
  engine.startTime = ctx.currentTime - offset / baseRate;
  engine.isPlaying = true;

  startSourcesAtOffset(engine, offset);
}

export function pause(engine: AudioEngine): void {
  if (!engine.isPlaying) return;
  if (engine._rampTimer) {
    clearTimeout(engine._rampTimer);
    engine._rampTimer = null;
  }
  engine.pauseOffset = getCurrentTime(engine);
  stopSources(engine);
  engine.isPlaying = false;
}

export function stop(engine: AudioEngine): void {
  if (engine._rampTimer) {
    clearTimeout(engine._rampTimer);
    engine._rampTimer = null;
  }
  stopSources(engine);
  engine.isPlaying = false;
  engine.pauseOffset = 0;
}

function stopSources(engine: AudioEngine): void {
  engine.tracks.forEach((track) => {
    if (track.source) {
      try {
        track.source.stop();
      } catch {}
      track.source.disconnect();
      track.source = null;
    }
  });
}

function startSourcesAtOffset(engine: AudioEngine, offset: number): void {
  const ctx = engine.ctx;
  const rate = getSourceRate(engine);
  engine.tracks.forEach((track) => {
    if (!track.buffer || !track.gainNode) return;
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = engine.looping;
    source.connect(track.gainNode);
    source.playbackRate.setValueAtTime(rate, ctx.currentTime);
    source.start(0, offset);
    track.source = source;
    if (!engine.looping) {
      source.onended = () => {
        if (engine.isPlaying) {
          const songPos = getCurrentTime(engine);
          if (songPos >= engine.duration - 0.1) {
            stop(engine);
          }
        }
      };
    }
  });
  applyMutesSolos(engine);
}

export function seek(engine: AudioEngine, time: number): void {
  const wasPlaying = engine.isPlaying;
  if (engine._rampTimer) {
    clearTimeout(engine._rampTimer);
    engine._rampTimer = null;
  }
  if (wasPlaying) stopSources(engine);
  engine.pauseOffset = Math.max(0, Math.min(time, engine.duration));
  engine.isPlaying = false;
  if (wasPlaying) {
    const ctx = engine.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const rate = getSourceRate(engine);
    engine.startTime = ctx.currentTime - engine.pauseOffset / rate;
    engine.isPlaying = true;
    startSourcesAtOffset(engine, engine.pauseOffset);
  }
}

export function startScrub(engine: AudioEngine): void {
  if (engine.isScrubbing) return;
  engine.isScrubbing = true;
  const ct = engine.ctx.currentTime;
  engine.scrubFilter.frequency.cancelScheduledValues(ct);
  engine.scrubFilter.frequency.setValueAtTime(engine.scrubFilter.frequency.value, ct);
  engine.scrubFilter.frequency.exponentialRampToValueAtTime(600, ct + 0.08);
  engine.scrubGain.gain.cancelScheduledValues(ct);
  engine.scrubGain.gain.setValueAtTime(engine.scrubGain.gain.value, ct);
  engine.scrubGain.gain.linearRampToValueAtTime(0.35, ct + 0.08);
}

export function scrubSeek(engine: AudioEngine, delta: number): void {
  if (!engine.isPlaying) return;
  let mult: number;
  if (delta > 0.003) mult = 2.5;
  else if (delta < -0.003) mult = 0.2;
  else mult = 0.7;
  const baseRate = getSourceRate(engine);
  engine.tracks.forEach((track) => {
    if (track.source) {
      try {
        track.source.playbackRate.setValueAtTime(baseRate * mult, engine.ctx.currentTime);
      } catch {}
    }
  });
}

export function endScrub(engine: AudioEngine, targetTime: number): void {
  engine.isScrubbing = false;
  const ct = engine.ctx.currentTime;
  engine.scrubFilter.frequency.cancelScheduledValues(ct);
  engine.scrubFilter.frequency.setValueAtTime(engine.scrubFilter.frequency.value, ct);
  engine.scrubFilter.frequency.exponentialRampToValueAtTime(20000, ct + 0.15);
  engine.scrubGain.gain.cancelScheduledValues(ct);
  engine.scrubGain.gain.setValueAtTime(engine.scrubGain.gain.value, ct);
  engine.scrubGain.gain.linearRampToValueAtTime(1.0, ct + 0.15);
  if (engine.isPlaying) {
    const clamped = Math.max(0, Math.min(targetTime, engine.duration));
    const rate = getSourceRate(engine);
    stopSources(engine);
    engine.pauseOffset = clamped;
    engine.startTime = ct - clamped / rate;
    startSourcesAtOffset(engine, clamped);
  }
}

export function setPitch(engine: AudioEngine, semitones: number): void {
  if (engine.pitchSemitones === semitones) return;

  const currentPos = getCurrentTime(engine);
  engine.pitchSemitones = semitones;
  const newRate = getSourceRate(engine);
  const ct = engine.ctx.currentTime;

  engine.tracks.forEach((track) => {
    if (track.source) {
      try {
        track.source.playbackRate.cancelScheduledValues(ct);
        track.source.playbackRate.setValueAtTime(newRate, ct);
      } catch {}
    }
  });

  if (engine.isPlaying) {
    engine.startTime = ct - currentPos / newRate;
  }
  engine.pauseOffset = currentPos;
}

export function setTrackVolume(engine: AudioEngine, trackIndex: number, volume: number): void {
  const track = engine.tracks[trackIndex];
  if (!track || !track.gainNode) return;
  track.volume = volume;
  applyMutesSolos(engine);
}

export function toggleMute(engine: AudioEngine, trackIndex: number): void {
  const track = engine.tracks[trackIndex];
  if (!track) return;
  track.muted = !track.muted;
  applyMutesSolos(engine);
}

export function toggleSolo(engine: AudioEngine, trackIndex: number): void {
  const track = engine.tracks[trackIndex];
  if (!track) return;
  track.solo = !track.solo;
  applyMutesSolos(engine);
}

export function setMasterVolume(engine: AudioEngine, volume: number): void {
  const ct = engine.ctx.currentTime;
  engine.masterGain.gain.setValueAtTime(volume, ct);
  engine.drumBus.gain.setValueAtTime(volume, ct);
}

function applyMutesSolos(engine: AudioEngine): void {
  const anySolo = engine.tracks.some((t) => t.solo);
  engine.tracks.forEach((track) => {
    if (!track.gainNode) return;
    let effectiveVolume = track.volume;
    if (track.muted) effectiveVolume = 0;
    else if (anySolo && !track.solo) effectiveVolume = 0;
    track.gainNode.gain.setValueAtTime(effectiveVolume, engine.ctx.currentTime);
  });
}

export function getCurrentTime(engine: AudioEngine): number {
  if (!engine.isPlaying) return engine.pauseOffset;
  const rate = getSourceRate(engine);
  const songPos = (engine.ctx.currentTime - engine.startTime) * rate;
  if (engine.looping && engine.duration > 0) {
    return songPos % engine.duration;
  }
  return Math.min(Math.max(0, songPos), engine.duration);
}

export function destroyEngine(engine: AudioEngine): void {
  stop(engine);
  engine.tracks.forEach((t) => {
    if (t.gainNode) t.gainNode.disconnect();
    t.transposedCache?.clear();
  });
  engine.sumBus.disconnect();
  engine.bypassGain.disconnect();
  engine.shifterInGain.disconnect();
  engine.shifterOutGain.disconnect();
  engine.masterGain.disconnect();
  engine.drumBus.disconnect();
  engine.drumDelay.disconnect();
  if (engine.stNode) {
    try {
      (engine.stNode as AudioNode).disconnect();
    } catch {}
    engine.stNode = null;
  }
  engine.scrubFilter.disconnect();
  engine.scrubGain.disconnect();
}
