import { describe, expect, it } from 'vitest';
import {
  commonDevicePixelRatios,
  devicePixelsPerArtPixel,
  pixelUnit,
  UI_FONT_ART_PX,
} from '@/design/pixel';

describe('pixel unit', () => {
  it.each(commonDevicePixelRatios)('lands on whole device pixels at %d dppx', (dpr) => {
    for (const userScale of [1, 1.5]) {
      const deviceSize = pixelUnit(dpr, userScale) * dpr;
      expect(deviceSize).toBeCloseTo(Math.round(deviceSize), 9);
      expect(Math.round(deviceSize)).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders UI text at multiples of 11 device pixels', () => {
    for (const dpr of commonDevicePixelRatios) {
      const devicePx = UI_FONT_ART_PX * devicePixelsPerArtPixel(dpr);
      expect(devicePx % UI_FONT_ART_PX).toBe(0);
    }
  });

  it('keeps UI text at 11 CSS px or larger', () => {
    for (const dpr of commonDevicePixelRatios) {
      expect(UI_FONT_ART_PX * pixelUnit(dpr)).toBeGreaterThanOrEqual(11);
    }
  });
});
