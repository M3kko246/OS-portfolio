import type { ZZFXSound } from 'zzfx';
import { settingsStore } from '@/os/kernel/settings';

export type SoundId =
  'click' | 'open' | 'close' | 'error' | 'achievement' | 'boot' | 'step' | 'splash';

/**
 * ZzFX parameters: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
 * slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay,
 * sustainVolume, decay, tremolo, filter. Shapes: 0 sine, 1 triangle, 2 saw, 3 tan, 4 noise.
 */
export const SOUNDS: Record<SoundId, readonly number[]> = {
  click: [0.3, 0.05, 1100, 0, 0.004, 0.03, 1],
  open: [0.35, 0.02, 440, 0.01, 0.04, 0.09, 1, 1, 0, 0, 220, 0.05],
  close: [0.35, 0.02, 660, 0.01, 0.04, 0.09, 1, 1, 0, 0, -220, 0.05],
  error: [0.35, 0, 140, 0, 0.1, 0.06, 2, 1, 0, 0, 0, 0, 0.05],
  achievement: [0.45, 0, 523, 0.01, 0.22, 0.3, 1, 1, 0, 0, 262, 0.07, 0.14],
  boot: [0.35, 0, 196, 0.05, 0.3, 0.5, 0, 1, 0, 0, 98, 0.16, 0.32],
  step: [0.12, 0.2, 90, 0, 0.004, 0.04, 4, 1],
  splash: [0.3, 0.1, 380, 0.01, 0.08, 0.3, 4, 1, -2, 0, 0, 0, 0, 0.8],
};

type Engine = typeof import('zzfx');
let engine: Promise<Engine> | null = null;
const cache = new Map<SoundId, ZZFXSound>();

/** Sticky user activation: audio may only start after the visitor has interacted with the page. */
function hasBeenActive(): boolean {
  return 'userActivation' in navigator ? navigator.userActivation.hasBeenActive : true;
}

/**
 * Plays a sound if sounds are on (off by default). ZzFX creates its AudioContext when it is
 * imported, so it loads only here: after a gesture, never at page load.
 */
export function playSound(id: SoundId): void {
  const { sound, volume } = settingsStore.getState();
  if (!sound || volume <= 0 || typeof window === 'undefined' || !hasBeenActive()) return;
  engine ??= import('zzfx');
  engine
    .then(({ ZZFX, ZZFXSound }) => {
      if (ZZFX.audioContext.state === 'suspended') void ZZFX.audioContext.resume();
      let sample = cache.get(id);
      if (!sample) {
        // ZZFXSound bakes the master volume in; the settings volume scales each play instead.
        sample = new ZZFXSound([...SOUNDS[id]]);
        cache.set(id, sample);
      }
      sample.play(volume);
    })
    .catch(() => {
      // No audio support: stay silent and try again next time.
      engine = null;
    });
}
