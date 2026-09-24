import { describe, expect, it } from 'vitest';
import { msUntilNextBand, timeOfDay } from '@/design/time';

const at = (h: number, m = 0) => new Date(2026, 8, 24, h, m);

describe('time of day', () => {
  it.each([
    [4, 'night'],
    [5, 'dawn'],
    [7, 'dawn'],
    [8, 'day'],
    [17, 'day'],
    [18, 'dusk'],
    [20, 'dusk'],
    [21, 'night'],
    [0, 'night'],
  ] as const)('%i:00 is %s', (hour, band) => {
    expect(timeOfDay(at(hour))).toBe(band);
  });

  it('knows how long until the next band', () => {
    expect(msUntilNextBand(at(20, 30))).toBe(30 * 60_000);
    expect(msUntilNextBand(at(7, 59))).toBe(60_000);
    // After 21 the next band is dawn tomorrow.
    expect(msUntilNextBand(at(23))).toBe(6 * 3_600_000);
  });
});
