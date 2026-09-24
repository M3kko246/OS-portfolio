import type { PaletteName } from './palette';

export const themeNames = ['light', 'dark'] as const;
export type ThemeName = (typeof themeNames)[number];

export const semanticTokens = [
  'face',
  'face-hi',
  'face-lo',
  'edge',
  'well',
  'text',
  'text-muted',
  'text-muted-on-face',
  'link',
  'title-bg',
  'title-fg',
  'title-idle-bg',
  'title-idle-fg',
  'accent',
  'on-accent',
  'danger',
  'on-danger',
  'focus',
] as const;
export type SemanticToken = (typeof semanticTokens)[number];

/**
 * Semantic tokens per theme. tokens.css is generated from this map, so light, dark and the
 * prefers-color-scheme block can never drift apart.
 *
 * Deviations from PROMPT.md §4.4, forced by the contrast table in §4.3:
 * - `text-muted-on-face`: in dark theme `fog` on `night` is a forbidden pair (4.4), so muted
 *   text on frame surfaces uses `paper` and relies on size and weight for hierarchy.
 * - `link`: `sea` passes only on `paper`, so links are colored only inside light wells.
 * - Errors are always `on-danger` text on a `danger` background, never `brick` text.
 */
export const themeTokens = {
  light: {
    face: 'chalk',
    'face-hi': 'paper',
    'face-lo': 'slate',
    edge: 'ink',
    well: 'paper',
    text: 'ink',
    'text-muted': 'slate',
    'text-muted-on-face': 'slate',
    link: 'sea',
    'title-bg': 'night',
    'title-fg': 'paper',
    'title-idle-bg': 'fog',
    'title-idle-fg': 'ink',
    accent: 'sun',
    'on-accent': 'ink',
    danger: 'brick',
    'on-danger': 'paper',
    focus: 'ink',
  },
  dark: {
    face: 'night',
    'face-hi': 'slate',
    'face-lo': 'ink',
    edge: 'ink',
    well: 'ink',
    text: 'paper',
    'text-muted': 'fog',
    'text-muted-on-face': 'paper',
    link: 'paper',
    'title-bg': 'abyss',
    'title-fg': 'paper',
    'title-idle-bg': 'slate',
    'title-idle-fg': 'paper',
    accent: 'sun',
    'on-accent': 'ink',
    danger: 'brick',
    'on-danger': 'paper',
    focus: 'sun',
  },
} as const satisfies Record<ThemeName, Record<SemanticToken, PaletteName>>;

/** Opacity of `ink` in the hard window shadow, per theme. */
export const shadowInkPercent: Record<ThemeName, number> = { light: 35, dark: 60 };

/** Every foreground/background combination the UI may render text with. */
export const textPairs = [
  ['text', 'well'],
  ['text', 'face'],
  ['text-muted', 'well'],
  ['text-muted-on-face', 'face'],
  ['link', 'well'],
  ['title-fg', 'title-bg'],
  ['title-idle-fg', 'title-idle-bg'],
  ['on-accent', 'accent'],
  ['on-danger', 'danger'],
] as const satisfies readonly (readonly [SemanticToken, SemanticToken])[];

/** Non-text pairs that need at least 3:1 (focus ring against the surfaces it sits on). */
export const indicatorPairs = [
  ['focus', 'face'],
  ['focus', 'well'],
] as const satisfies readonly (readonly [SemanticToken, SemanticToken])[];

/** The verified pairs of PROMPT.md §4.3. Contrast is symmetric, so order does not matter. */
export const allowedTextPairs = [
  ['ink', 'paper'],
  ['ink', 'chalk'],
  ['paper', 'night'],
  ['ink', 'sun'],
  ['sun', 'night'],
  ['paper', 'abyss'],
  ['slate', 'paper'],
  ['slate', 'chalk'],
  ['fog', 'ink'],
  ['paper', 'brick'],
  ['paper', 'sea'],
] as const satisfies readonly (readonly [PaletteName, PaletteName])[];
