/**
 * Draws the desktop icon sprites (32x32) in the system palette and writes them as lossless PNGs
 * into src/assets/sprites. Shapes are filled first; a final pass adds a 1 px ink outline around
 * every opaque region, so all icons share the same silhouette weight.
 *
 * `--sheet` also writes a 4x contact sheet into the scratch path given after it, for review.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { hexToRgb } from '../src/design/color';
import { palette, type PaletteName } from '../src/design/palette';

const S = 32;
type Px = PaletteName | null;

class Sprite {
  readonly px: Px[] = Array.from({ length: S * S }, () => null);
  get(x: number, y: number): Px {
    return x < 0 || y < 0 || x >= S || y >= S ? null : (this.px[y * S + x] ?? null);
  }
  set(x: number, y: number, c: Px): this {
    if (x >= 0 && y >= 0 && x < S && y < S) this.px[y * S + x] = c;
    return this;
  }
  rect(x: number, y: number, w: number, h: number, c: Px): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  hline(x: number, y: number, w: number, c: Px): this {
    return this.rect(x, y, w, 1, c);
  }
  vline(x: number, y: number, h: number, c: Px): this {
    return this.rect(x, y, 1, h, c);
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Px): this {
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.set(x, y, c);
      }
    }
    return this;
  }
  /** Ink outline on transparent pixels that touch an opaque one (4-neighbourhood). */
  outline(c: PaletteName = 'ink'): this {
    const edges: [number, number][] = [];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (this.get(x, y) !== null) continue;
        const touches = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx = 0, dy = 0]) => {
          const n = this.get(x + dx, y + dy);
          return n !== null && n !== c;
        });
        if (touches) edges.push([x, y]);
      }
    }
    for (const [x, y] of edges) this.set(x, y, c);
    return this;
  }
  rgba(): Buffer {
    const out = Buffer.alloc(S * S * 4);
    this.px.forEach((name, i) => {
      if (name === null) return;
      const [r, g, b] = hexToRgb(palette[name]);
      out.set([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255], i * 4);
    });
    return out;
  }
}

function page(s: Sprite, body: PaletteName): Sprite {
  // Sheet with a folded top-right corner.
  s.rect(7, 3, 18, 26, body);
  for (let i = 0; i < 6; i++) s.hline(25 - 6 + i, 3 + i, 6 - i, null);
  for (let i = 0; i < 6; i++) s.hline(19, 3 + i, i + 1, 'chalk');
  s.vline(19, 3, 6, 'ink').hline(19, 9, 6, 'ink');
  s.vline(24, 9, 20, 'chalk').hline(7, 28, 18, 'chalk');
  return s;
}

const sprites: Record<string, () => Sprite> = {
  readme: () => {
    const s = page(new Sprite(), 'paper');
    for (const y of [12, 15, 18, 21]) s.hline(10, y, y === 21 ? 7 : 11, 'slate');
    return s.outline();
  },
  pdf: () => {
    const s = page(new Sprite(), 'paper');
    for (const y of [12, 15]) s.hline(10, y, 11, 'slate');
    s.rect(4, 19, 18, 7, 'brick');
    for (const x of [6, 11, 16]) s.rect(x, 21, 3, 3, 'paper');
    s.rect(4, 25, 18, 1, 'plum');
    return s.outline();
  },
  folder: () => {
    const s = new Sprite();
    s.rect(3, 6, 11, 4, 'sun').rect(3, 9, 26, 18, 'sun');
    s.rect(3, 12, 26, 16, 'sand');
    s.hline(3, 12, 26, 'paper');
    s.hline(3, 27, 26, 'sun');
    s.vline(28, 13, 14, 'sun');
    return s.outline();
  },
  photos: () => {
    const s = new Sprite();
    s.rect(3, 5, 26, 22, 'paper');
    s.rect(5, 7, 22, 18, 'foam');
    s.rect(5, 15, 22, 10, 'sea');
    s.hline(5, 15, 22, 'lagoon');
    s.ellipse(21, 11, 2.6, 2.6, 'sun');
    s.ellipse(13, 21, 7, 3.2, 'sand');
    s.ellipse(13, 20.5, 5.4, 2.2, 'meadow');
    s.vline(28, 6, 21, 'chalk').hline(4, 26, 25, 'chalk');
    return s.outline();
  },
  about: () => {
    const s = new Sprite();
    s.rect(3, 7, 26, 19, 'paper');
    s.rect(3, 7, 26, 3, 'sea');
    s.rect(6, 12, 9, 11, 'chalk');
    s.ellipse(10.5, 15.5, 2.6, 2.6, 'slate');
    s.rect(7, 19, 7, 4, 'slate');
    for (const [y, w] of [
      [13, 10],
      [16, 8],
      [19, 10],
    ] as const)
      s.hline(17, y, w, 'fog');
    s.vline(28, 8, 18, 'chalk').hline(4, 25, 25, 'chalk');
    return s.outline();
  },
  mail: () => {
    const s = new Sprite();
    s.rect(3, 8, 26, 17, 'paper');
    for (let i = 0; i < 12; i++) {
      s.set(4 + i, 9 + i, 'fog').set(27 - i, 9 + i, 'fog');
    }
    s.rect(22, 10, 5, 5, 'brick').rect(23, 11, 3, 3, 'sand');
    s.hline(3, 24, 26, 'chalk');
    return s.outline();
  },
  terminal: () => {
    const s = new Sprite();
    s.rect(3, 5, 26, 22, 'night');
    s.rect(3, 5, 26, 4, 'slate');
    for (const x of [5, 8, 11]) s.rect(x, 6, 2, 2, 'fog');
    s.set(6, 13, 'meadow').set(7, 14, 'meadow').set(8, 15, 'meadow').set(7, 16, 'meadow');
    s.set(6, 17, 'meadow');
    s.rect(11, 17, 5, 1, 'meadow');
    s.rect(18, 15, 3, 3, 'paper');
    return s.outline();
  },
  trash: () => {
    const s = new Sprite();
    s.rect(12, 3, 8, 2, 'fog');
    s.rect(6, 5, 20, 3, 'chalk');
    s.hline(6, 7, 20, 'fog');
    s.rect(8, 9, 16, 19, 'chalk');
    for (const x of [11, 15, 19]) s.vline(x, 11, 15, 'fog');
    s.vline(23, 9, 19, 'fog');
    return s.outline();
  },
  career: () => {
    const s = new Sprite();
    s.rect(3, 5, 26, 22, 'sea');
    s.hline(3, 5, 26, 'lagoon');
    s.ellipse(11, 19, 7, 4.2, 'lagoon');
    s.ellipse(11, 18.5, 5.6, 3.2, 'sand');
    s.ellipse(11, 18, 4.2, 2.2, 'meadow');
    s.ellipse(23, 11, 4.4, 2.8, 'lagoon');
    s.ellipse(23, 10.6, 3.2, 1.9, 'sand');
    // Wooden bridge between the islands.
    for (let i = 0; i < 6; i++) s.set(15 + i, 15 - i, 'sand');
    // Flag on the harbour island.
    s.vline(10, 10, 7, 'ink');
    s.rect(11, 10, 4, 3, 'brick');
    return s.outline();
  },
};

const outDir = new URL('../src/assets/sprites/', import.meta.url);
await mkdir(outDir, { recursive: true });

const rendered: [string, Buffer][] = [];
for (const [name, draw] of Object.entries(sprites)) {
  const png = await sharp(draw().rgba(), { raw: { width: S, height: S, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(new URL(`${name}.png`, outDir), png);
  rendered.push([name, png]);
}
console.log(`Wrote ${rendered.length} sprites to src/assets/sprites.`);

const sheetIndex = process.argv.indexOf('--sheet');
const sheetPath = sheetIndex > -1 ? process.argv[sheetIndex + 1] : undefined;
if (sheetPath) {
  const scale = 4;
  const cell = S * scale + 16;
  const composites = await Promise.all(
    rendered.map(async ([, png], i) => ({
      input: await sharp(png)
        .resize(S * scale, S * scale, { kernel: 'nearest' })
        .toBuffer(),
      left: 8 + i * cell,
      top: 8,
    })),
  );
  await sharp({
    create: {
      width: rendered.length * cell,
      height: cell,
      channels: 4,
      background: palette.chalk,
    },
  })
    .composite(composites)
    .png()
    .toFile(sheetPath);
  console.log(`Contact sheet: ${sheetPath}`);
}
