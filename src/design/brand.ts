import { palette } from './palette';

/**
 * The mark on a 16x16 grid: `#` is ink (paper on dark), `+` is the sun accent.
 * Placeholder "landing beacon" until the monogram with the owner's initials is drawn
 * (CONTENT_TODO.md). Everything that shows the mark (start button, favicon, boot screen,
 * flag on the Porto island, ASCII in the terminal) reads this grid.
 */
export const BRAND_GRID = [
  '................',
  '......####......',
  '....###..###....',
  '...##......##...',
  '..##........##..',
  '..#..........#..',
  '.##...++++...##.',
  '.#....++++....#.',
  '.#....++++....#.',
  '.##...++++...##.',
  '..#..........#..',
  '..##........##..',
  '...##......##...',
  '....###..###....',
  '......####......',
  '................',
] as const;

export interface BrandRun {
  x: number;
  y: number;
  width: number;
  tone: 'ink' | 'accent';
}

/** Horizontal runs of equal pixels, so the SVG needs one rect per run instead of per pixel. */
export function brandRuns(grid: readonly string[] = BRAND_GRID): BrandRun[] {
  const runs: BrandRun[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (end < row.length && row[end] === ch) end++;
      if (ch === '#' || ch === '+') {
        runs.push({ x, y, width: end - x, tone: ch === '#' ? 'ink' : 'accent' });
      }
      x = end;
    }
  });
  return runs;
}

/** Standalone SVG (favicon, social images). Switches ink to paper for dark browser chrome. */
export function brandSvg(): string {
  const rects = brandRuns()
    .map((r) => `<rect class="${r.tone}" x="${r.x}" y="${r.y}" width="${r.width}" height="1"/>`)
    .join('');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">',
    `<style>.ink{fill:${palette.ink}}.accent{fill:${palette.sun}}`,
    `@media (prefers-color-scheme: dark){.ink{fill:${palette.paper}}}</style>`,
    rects,
    '</svg>',
  ].join('');
}

/** SVG with plain fill attributes, for renderers without CSS support (Satori, resvg). */
export function brandSvgFlat(ink: string = palette.paper, accent: string = palette.sun): string {
  const rects = brandRuns()
    .map(
      (r) =>
        `<rect fill="${r.tone === 'ink' ? ink : accent}" x="${r.x}" y="${r.y}" width="${r.width}" height="1"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">${rects}</svg>`;
}

/** ASCII version for the terminal's `info` command. */
export function brandAscii(): string {
  return BRAND_GRID.map((row) => row.replaceAll('.', ' ').replaceAll('+', '@')).join('\n');
}
