/** Types for the parts of ZzFX 1.3 we use. The module creates its AudioContext on import. */
declare module 'zzfx' {
  export type ZzfxParams = (number | undefined)[];

  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    buildSamples: (...params: ZzfxParams) => number[];
  };

  export class ZZFXSound {
    constructor(params?: ZzfxParams);
    play(
      volume?: number,
      pitch?: number,
      randomnessScale?: number,
      pan?: number,
      loop?: boolean,
    ): AudioBufferSourceNode | undefined;
  }
}
