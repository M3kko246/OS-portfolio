/**
 * The only source of color for the whole system: UI tokens (tokens.css), sprites,
 * wallpapers and the game's palette quantization pass all derive from this table.
 */
export const palette = {
  ink: '#1c1b29',
  night: '#2b2d42',
  slate: '#4b5268',
  fog: '#8b93a7',
  chalk: '#d8dce4',
  paper: '#f3f5f7',
  abyss: '#0f3857',
  sea: '#1d6fa3',
  lagoon: '#37b4c6',
  foam: '#b3ece6',
  olive: '#57763a',
  meadow: '#93c255',
  sand: '#ecc86f',
  sun: '#f6a93b',
  brick: '#b5443a',
  plum: '#6a3e6e',
} as const;

export type PaletteName = keyof typeof palette;

export const paletteNames = Object.keys(palette) as PaletteName[];
