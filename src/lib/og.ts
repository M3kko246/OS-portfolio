/**
 * Social images (1200x630) rendered at build time with Satori and resvg, in the system palette.
 * Fonts come from the static subsets written by scripts/subset-fonts.ts (Satori cannot read woff2).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { brandSvgFlat } from '@/design/brand';
import { palette } from '@/design/palette';

const fontDir = join(process.cwd(), 'src/assets/fonts/og');

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;

function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(fontDir, 'AtkinsonHyperlegibleNext-Regular.ttf')),
    readFile(join(fontDir, 'AtkinsonHyperlegibleNext-Bold.ttf')),
    readFile(join(fontDir, 'DepartureMono-Regular.otf')),
  ]).then(([regular, bold, pixel]) => [
    { name: 'Read', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Read', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Pixel', data: pixel, weight: 400 as const, style: 'normal' as const },
  ]);
  return fonts;
}

interface Node {
  type: string;
  props: Record<string, unknown>;
}

function el(type: string, style: Record<string, unknown>, children?: unknown, extra = {}): Node {
  return { type, props: { style, children, ...extra } };
}

export interface OgCard {
  /** Short label in the title bar, e.g. the OS name. */
  window: string;
  title: string;
  subtitle: string;
  /** Pixel-font footer lines: who and what. */
  footer: string;
  /** Accent line, e.g. year and stack. */
  accent?: string;
}

export async function renderOgPng(card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  const mark = `data:image/svg+xml;base64,${Buffer.from(brandSvgFlat()).toString('base64')}`;
  const tree = el(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      padding: 48,
      background: palette.abyss,
    },
    el(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        background: palette.night,
        border: `6px solid ${palette.ink}`,
        boxShadow: `18px 18px 0 0 ${palette.ink}`,
      },
      [
        el(
          'div',
          {
            display: 'flex',
            padding: '10px 24px',
            background: palette.ink,
            color: palette.paper,
            fontFamily: 'Pixel',
            fontSize: 22,
          },
          card.window,
        ),
        el(
          'div',
          {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'space-between',
            padding: '48px 56px',
          },
          [
            el('div', { display: 'flex', flexDirection: 'column', gap: 20 }, [
              el(
                'div',
                {
                  fontFamily: 'Read',
                  fontWeight: 700,
                  fontSize: 64,
                  lineHeight: 1.1,
                  color: palette.paper,
                },
                card.title,
              ),
              el(
                'div',
                { fontFamily: 'Read', fontSize: 32, lineHeight: 1.3, color: palette.paper },
                card.subtitle,
              ),
              ...(card.accent
                ? [
                    el(
                      'div',
                      { fontFamily: 'Pixel', fontSize: 22, color: palette.sun },
                      card.accent,
                    ),
                  ]
                : []),
            ]),
            el('div', { display: 'flex', alignItems: 'center', gap: 24 }, [
              el('img', {}, undefined, { src: mark, width: 64, height: 64 }),
              el('div', { fontFamily: 'Pixel', fontSize: 22, color: palette.paper }, card.footer),
            ]),
          ],
        ),
      ],
    ),
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
  });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng());
}
