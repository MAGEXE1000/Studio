import { useCallback, useRef, useState } from "react";
import { playSound, type SoundPlayback } from "../lib/sound-engine";
import type { SoundAsset, UseSoundOptions, UseSoundReturn } from "../lib/sound-types";

export function useSound(
  sound: SoundAsset,
  options: UseSoundOptions = {}
): UseSoundReturn {
  const { volume = 1, playbackRate = 1, interrupt = false } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const activePlaybackRef = useRef<SoundPlayback | null>(null);

  const play = useCallback((overrides?: { volume?: number; playbackRate?: number }) => {
    if (interrupt && activePlaybackRef.current) {
      activePlaybackRef.current.stop();
      activePlaybackRef.current = null;
    }

    setIsPlaying(true);
    playSound(sound.dataUri, {
      volume: overrides?.volume ?? volume,
      playbackRate: overrides?.playbackRate ?? playbackRate,
      onEnd: () => {
        setIsPlaying(false);
        options.onEnd?.();
      }
    }).then((playback) => {
      activePlaybackRef.current = playback;
    }).catch((e) => {
      console.error("Failed to play sound:", e);
      setIsPlaying(false);
    });
  }, [sound.dataUri, volume, playbackRate, interrupt, options]);

  const stop = useCallback(() => {
    if (activePlaybackRef.current) {
      activePlaybackRef.current.stop();
      activePlaybackRef.current = null;
    }
    setIsPlaying(false);
    options.onStop?.();
  }, [options]);

  const pause = useCallback(() => {
    // Web Audio API buffer source doesn't support pause out of the box easily, so we map pause to stop
    stop();
    options.onPause?.();
  }, [stop, options]);

  const controls = {
    stop,
    pause,
    isPlaying,
    duration: sound.duration ?? null,
    sound,
  };

  return [play, controls] as const;
}
