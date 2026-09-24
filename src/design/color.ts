import { palette, paletteNames, type PaletteName } from './palette';

/** Gamma-encoded sRGB channels in the 0..1 range. */
export type Rgb = readonly [r: number, g: number, b: number];
export type Oklab = readonly [l: number, a: number, b: number];

export function hexToRgb(hex: string): Rgb {
  const digits = /^#([0-9a-f]{6})$/i.exec(hex)?.[1];
  if (digits === undefined) throw new Error(`Invalid hex color: ${hex}`);
  const n = Number.parseInt(digits, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function rgbToLinear([r, g, b]: Rgb): Rgb {
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/**
 * Björn Ottosson's OKLab conversion from linear sRGB.
 * Must stay identical to linearToOklab() in the game's palette quantization shader.
 */
export function linearToOklab([r, g, b]: Rgb): Oklab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function hexToOklab(hex: string): Oklab {
  return linearToOklab(rgbToLinear(hexToRgb(hex)));
}

export function oklabDistanceSq(a: Oklab, b: Oklab): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

export const paletteOklab: Readonly<Record<PaletteName, Oklab>> = Object.fromEntries(
  paletteNames.map((name) => [name, hexToOklab(palette[name])]),
) as Record<PaletteName, Oklab>;

/** Closest palette entry by OKLab distance, the same rule used by sprites and the shader. */
export function nearestPaletteName(color: Oklab): PaletteName {
  let best: PaletteName = 'ink';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const name of paletteNames) {
    const distance = oklabDistanceSq(color, paletteOklab[name]);
    if (distance < bestDistance) {
      best = name;
      bestDistance = distance;
    }
  }
  return best;
}

/** WCAG 2 relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = rgbToLinear(hexToRgb(hex));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio; symmetric in its arguments. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
