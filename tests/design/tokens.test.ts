import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/design/color';
import { palette, paletteNames, type PaletteName } from '@/design/palette';
import {
  allowedTextPairs,
  indicatorPairs,
  textPairs,
  themeNames,
  themeTokens,
} from '@/design/themes';
import { renderTokensCss } from '@/design/tokens';

const tokensCss = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

describe('tokens.css', () => {
  it('is generated from src/design and up to date', () => {
    expect(tokensCss).toBe(renderTokensCss());
  });

  it('declares every palette color with the exact value of palette.ts', () => {
    for (const name of paletteNames) {
      expect(tokensCss).toContain(`--c-${name}: ${palette[name]};`);
    }
  });

  it('never uses pure black or pure white', () => {
    expect(tokensCss.toLowerCase()).not.toMatch(/#000000|#ffffff|#000\b|#fff\b/);
  });
});

describe('contrast table of PROMPT.md §4.3', () => {
  const table: [PaletteName, PaletteName, number][] = [
    ['ink', 'paper', 15.5],
    ['ink', 'chalk', 12.3],
    ['paper', 'night', 12.3],
    ['ink', 'sun', 8.6],
    ['sun', 'night', 6.9],
    ['paper', 'abyss', 11.2],
    ['slate', 'paper', 7.1],
    ['slate', 'chalk', 5.7],
    ['fog', 'ink', 5.5],
    ['paper', 'brick', 5.0],
    ['paper', 'sea', 5.0],
    ['fog', 'night', 4.4],
    ['fog', 'chalk', 2.2],
    ['sun', 'chalk', 1.4],
  ];

  // The brief rounds loosely (11.15 is listed as 11.2), so allow 0.1 of slack.
  it.each(table)('%s on %s is %d:1', (fg, bg, expected) => {
    expect(Math.abs(contrastRatio(palette[fg], palette[bg]) - expected)).toBeLessThanOrEqual(0.1);
  });
});

describe.each(themeNames)('%s theme', (theme) => {
  const colors = themeTokens[theme];
  const allowed = new Set(allowedTextPairs.map(([a, b]) => [a, b].sort().join('/')));

  it.each(textPairs)('text %s on %s uses a verified pair', (fg, bg) => {
    const pair = [colors[fg], colors[bg]].sort().join('/');
    expect(allowed.has(pair), `${colors[fg]} on ${colors[bg]} is not in §4.3`).toBe(true);
    expect(contrastRatio(palette[colors[fg]], palette[colors[bg]])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(indicatorPairs)('indicator %s on %s reaches 3:1', (fg, bg) => {
    expect(contrastRatio(palette[colors[fg]], palette[colors[bg]])).toBeGreaterThanOrEqual(3);
  });

  it('keeps sun as the only accent', () => {
    expect(colors.accent).toBe('sun');
  });
});

it('never uses sun for focus on light surfaces', () => {
  expect(themeTokens.light.focus).not.toBe('sun');
});
