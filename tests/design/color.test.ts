import { describe, expect, it } from 'vitest';
import {
  hexToOklab,
  hexToRgb,
  linearToOklab,
  nearestPaletteName,
  paletteOklab,
} from '@/design/color';
import { palette, paletteNames } from '@/design/palette';

describe('OKLab', () => {
  // Reference values from Björn Ottosson's OKLab post.
  it.each([
    [
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 0, 0],
      [0.627955, 0.224863, 0.125846],
    ],
    [
      [0, 1, 0],
      [0.86644, -0.233888, 0.179498],
    ],
    [
      [0, 0, 1],
      [0.452014, -0.032457, -0.311528],
    ],
  ] as const)('converts linear %j', (rgb, expected) => {
    const lab = linearToOklab(rgb);
    lab.forEach((value, i) => {
      expect(value).toBeCloseTo(expected[i] ?? Number.NaN, 4);
    });
  });

  it('maps every palette color onto itself', () => {
    for (const name of paletteNames) {
      expect(nearestPaletteName(hexToOklab(palette[name]))).toBe(name);
    }
  });

  it('keeps palette colors far enough apart to stay distinguishable', () => {
    for (const a of paletteNames) {
      for (const b of paletteNames) {
        if (a === b) continue;
        const [la, aa, ba] = paletteOklab[a];
        const [lb, ab, bb] = paletteOklab[b];
        expect(Math.hypot(la - lb, aa - ab, ba - bb)).toBeGreaterThan(0.05);
      }
    }
  });

  it('rejects malformed hex', () => {
    expect(() => hexToRgb('#12345')).toThrow();
  });
});
