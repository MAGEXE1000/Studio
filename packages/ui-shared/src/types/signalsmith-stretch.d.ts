declare module 'signalsmith-stretch' {
  export interface StretchScheduleOptions {
    active?: boolean;
    output?: number;
    input?: number;
    rate?: number;
    semitones?: number;
    tonalityHz?: number;
    formantSemitones?: number;
    formantCompensation?: boolean;
    formantBaseHz?: number;
    loopStart?: number;
    loopEnd?: number;
  }

  export interface StretchNode extends AudioWorkletNode {
    schedule(options: StretchScheduleOptions, adjustPrevious?: boolean): Promise<any>;
    latency(): Promise<number>;
    start(
      when?: number,
      offset?: number,
      duration?: number,
      rate?: number,
      semitones?: number
    ): Promise<any>;
    stop(when?: number): Promise<any>;
    setUpdateInterval(seconds: number, callback?: (time: number) => void): Promise<any>;
  }

  export interface SignalsmithStretchFactory {
    (
      audioContext: AudioContext | BaseAudioContext,
      options?: AudioWorkletNodeOptions
    ): Promise<StretchNode>;
    moduleUrl?: string;
  }

  const SignalsmithStretch: SignalsmithStretchFactory;
  export default SignalsmithStretch;
}
