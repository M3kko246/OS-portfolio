/**
 * GLSL shared by the palette quantization pass and its browser test, so the test checks the
 * exact code the game runs. Mirrors linearToOklab() in src/design/color.ts.
 */
export const OKLAB_GLSL = /* glsl */ `
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  );
}
`;

/** Nearest palette entry in OKLab; returns the palette colour as stored (sRGB). */
export const QUANTIZE_GLSL = /* glsl */ `
uniform vec3 uPaletteLab[16];
uniform vec3 uPaletteRgb[16];

vec3 nearestPaletteColor(vec3 lab) {
  float best = 1e9;
  vec3 color = uPaletteRgb[0];
  for (int i = 0; i < 16; i++) {
    vec3 d = lab - uPaletteLab[i];
    float dist = dot(d, d);
    if (dist < best) {
      best = dist;
      color = uPaletteRgb[i];
    }
  }
  return color;
}
`;

/** 4x4 Bayer threshold in [0, 1), indexed by game pixel, not device pixel. */
export const BAYER_GLSL = /* glsl */ `
float bayer4(vec2 cell) {
  int x = int(mod(cell.x, 4.0));
  int y = int(mod(cell.y, 4.0));
  int index = x + y * 4;
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return m[index] / 16.0;
}
`;
