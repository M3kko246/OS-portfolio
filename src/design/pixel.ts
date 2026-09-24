/** Desired size of one art pixel, in CSS px (PROMPT.md §4.5). */
export const TARGET_ART_PX = 1.375;

/** Departure Mono is drawn on an 11 px grid: UI text sizes are multiples of 11 art pixels. */
export const UI_FONT_ART_PX = 11;

/** Device pixels per art pixel. Always a whole number, so pixel art never falls between pixels. */
export function devicePixelsPerArtPixel(dpr: number, userScale = 1): number {
  return Math.max(1, Math.round(dpr * TARGET_ART_PX * userScale));
}

/** Size of one art pixel in CSS px (the `--u` custom property). */
export function pixelUnit(dpr: number, userScale = 1): number {
  return devicePixelsPerArtPixel(dpr, userScale) / dpr;
}

/**
 * Common device pixel ratios. Before any script runs (static pages, boot screen) `--u` comes
 * from resolution media queries built from this list; at runtime it is recomputed exactly.
 */
export const commonDevicePixelRatios = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4] as const;
