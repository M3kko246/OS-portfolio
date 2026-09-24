export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/** Visitor's local time bands (PROMPT.md §4.10): dawn 5-8, day 8-18, dusk 18-21, night 21-5. */
export function timeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}
