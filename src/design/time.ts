export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export const timesOfDay: readonly TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

/** Visitor's local time bands (PROMPT.md §4.10): dawn 5-8, day 8-18, dusk 18-21, night 21-5. */
export function timeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

const BAND_STARTS = [5, 8, 18, 21];

/** Milliseconds from `date` to the next band boundary, in local time. */
export function msUntilNextBand(date: Date): number {
  const h = date.getHours();
  const next = new Date(date);
  const start = BAND_STARTS.find((b) => b > h);
  if (start === undefined) {
    next.setDate(next.getDate() + 1);
    next.setHours(BAND_STARTS[0] ?? 5, 0, 0, 0);
  } else next.setHours(start, 0, 0, 0);
  return next.getTime() - date.getTime();
}

/**
 * Calls `onChange` whenever the band changes, with one timer set to the next boundary (no
 * polling). Returns the unsubscribe function, so it plugs into useSyncExternalStore.
 */
export function subscribeTimeOfDay(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    // A little past the boundary, so the new band is already current when the timer fires.
    timer = setTimeout(
      () => {
        onChange();
        schedule();
      },
      msUntilNextBand(new Date()) + 1000,
    );
  };
  schedule();
  return () => {
    clearTimeout(timer);
  };
}
