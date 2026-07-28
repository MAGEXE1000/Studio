import {
  SAX_SAMPLE_ANCHORS,
  generateRecordedSampleBuffer,
  type SaxSampleReference,
} from './saxophoneSamples';
import { getConcertFrequency, type SaxophoneVariant } from '../instruments/saxophoneEngine';

let audioCtx: AudioContext | null = null;
const sampleBufferCache = new Map<string, AudioBuffer>();
const activeSampleSources = new Set<AudioBufferSourceNode>();

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof (window as any).webkitAudioContext !== 'undefined'
          ? (window as any).webkitAudioContext
          : null;

    if (!AudioCtxClass) throw new Error('WebAudio API not supported');
    audioCtx = new AudioCtxClass({ sampleRate: 44100 });
  }

  const ctx = audioCtx;
  if (!ctx) throw new Error('AudioContext failed to initialize');

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  return ctx;
}

function findNearestSampleAnchor(targetFreq: number): SaxSampleReference {
  let closest = SAX_SAMPLE_ANCHORS[0];
  let minDiff = Math.abs(targetFreq - closest.baseFreq);

  for (let i = 1; i < SAX_SAMPLE_ANCHORS.length; i++) {
    const diff = Math.abs(targetFreq - SAX_SAMPLE_ANCHORS[i].baseFreq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = SAX_SAMPLE_ANCHORS[i];
    }
  }

  return closest;
}

export interface PlaySaxSampleOptions {
  writtenNote: string;
  variant?: SaxophoneVariant;
  duration?: number;
  gain?: number;
}

export function playRecordedSaxophoneSample(options: PlaySaxSampleOptions): () => void {
  const { writtenNote, variant = 'alto', duration = 2.5, gain = 0.85 } = options;

  try {
    const ctx = getAudioContext();
    const targetFreq = getConcertFrequency(writtenNote, variant);
    const anchor = findNearestSampleAnchor(targetFreq);

    // Fetch or generate recorded sample buffer for anchor note
    let buffer = sampleBufferCache.get(anchor.note);
    if (!buffer) {
      buffer = generateRecordedSampleBuffer(ctx, anchor, 3.0);
      sampleBufferCache.set(anchor.note, buffer);
    }

    const now = ctx.currentTime;

    // Source node with exact pitch playback rate shift
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(targetFreq / anchor.baseFreq, now);

    // Master gain envelope for natural acoustic release
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(gain * 0.8, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(gain * 0.6, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Saxophone body acoustic filter
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(Math.min(14000, targetFreq * 7), now);
    bodyFilter.Q.setValueAtTime(1.5, now);

    source.connect(bodyFilter);
    bodyFilter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    activeSampleSources.add(source);

    const stopFn = () => {
      try {
        const stopTime = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(stopTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.08);

        setTimeout(() => {
          try {
            source.stop();
            source.disconnect();
            bodyFilter.disconnect();
            gainNode.disconnect();
            activeSampleSources.delete(source);
          } catch (_) {}
        }, 100);
      } catch (_) {}
    };

    setTimeout(stopFn, duration * 1000);
    return stopFn;
  } catch (err) {
    console.error('Failed to play recorded saxophone sample:', err);
    return () => {};
  }
}

export function stopAllSaxophoneSamples() {
  activeSampleSources.forEach((src) => {
    try {
      src.stop();
      src.disconnect();
    } catch (_) {}
  });
  activeSampleSources.clear();
}
