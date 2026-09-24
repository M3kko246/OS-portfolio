/**
 * Draws placeholder covers and photos in the system palette, so pages have real images to lay
 * out until the owner's material arrives (tracked in CONTENT_TODO.md). Output is pixel art drawn
 * at 160x100 and scaled up 8x with nearest neighbour.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { hexToRgb } from '../src/design/color';
import { palette, type PaletteName } from '../src/design/palette';

const W = 160;
const H = 100;
const SCALE = 8;

type Landmark = 'lighthouse' | 'tower' | 'workshop' | 'observatory' | 'windmill' | 'dock';
type Biome = 'meadow' | 'sand' | 'rock' | 'grove';
type Light = 'day' | 'dusk' | 'night';

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Canvas {
  readonly px: PaletteName[] = Array.from({ length: W * H }, () => 'sea');
  set(x: number, y: number, c: PaletteName): void {
    if (x >= 0 && y >= 0 && x < W && y < H) this.px[Math.floor(y) * W + Math.floor(x)] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: PaletteName): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: PaletteName): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, c);
      }
    }
  }
  toRgba(): Buffer {
    const out = Buffer.alloc(W * H * 4);
    this.px.forEach((name, i) => {
      const [r, g, b] = hexToRgb(palette[name]);
      out.set([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255], i * 4);
    });
    return out;
  }
}

const biomeColors: Record<Biome, [PaletteName, PaletteName]> = {
  meadow: ['meadow', 'olive'],
  sand: ['sand', 'sand'],
  rock: ['fog', 'slate'],
  grove: ['olive', 'meadow'],
};

function drawLandmark(c: Canvas, kind: Landmark, x: number, y: number, light: Light): void {
  const lamp: PaletteName = light === 'day' ? 'paper' : 'sun';
  switch (kind) {
    case 'lighthouse':
      for (let j = 0; j < 22; j++)
        c.rect(x - 3, y - j, 6, 1, Math.floor(j / 4) % 2 ? 'brick' : 'paper');
      c.rect(x - 4, y - 26, 8, 4, lamp);
      c.rect(x - 3, y - 29, 6, 3, 'brick');
      break;
    case 'tower':
      c.rect(x - 5, y - 20, 10, 20, 'slate');
      c.rect(x - 6, y - 23, 12, 3, 'fog');
      for (let i = -6; i < 6; i += 3) c.rect(x + i, y - 25, 2, 2, 'fog');
      c.rect(x - 1, y - 14, 2, 3, lamp);
      break;
    case 'workshop':
      c.rect(x - 9, y - 10, 18, 10, 'sand');
      for (let j = 0; j < 7; j++) c.rect(x - 10 + j, y - 11 - j, 20 - 2 * j, 1, 'brick');
      c.rect(x - 2, y - 6, 4, 6, 'ink');
      c.rect(x + 4, y - 8, 3, 3, lamp);
      break;
    case 'observatory':
      c.rect(x - 7, y - 8, 14, 8, 'slate');
      c.ellipse(x, y - 9, 7, 6, 'paper');
      c.rect(x - 1, y - 15, 2, 6, 'ink');
      c.rect(x + 3, y - 5, 2, 2, lamp);
      break;
    case 'windmill':
      c.rect(x - 4, y - 16, 8, 16, 'sand');
      c.rect(x - 1, y - 5, 2, 5, 'ink');
      for (let i = -9; i <= 9; i++) {
        c.set(x + i, y - 17 + i, 'ink');
        c.set(x + i, y - 17 - i, 'ink');
      }
      break;
    case 'dock':
      c.rect(x, y - 2, 34, 3, 'sand');
      for (let i = 2; i < 34; i += 6) c.rect(x + i, y + 1, 1, 3, 'olive');
      c.rect(x + 26, y - 7, 6, 5, 'brick');
      c.rect(x + 28, y - 11, 1, 4, 'ink');
      break;
  }
}

function scene(seed: number, biome: Biome, landmark: Landmark, light: Light): Canvas {
  const random = rng(seed);
  const c = new Canvas();
  const [ground, shade] = biomeColors[biome];
  const deep: PaletteName = light === 'night' ? 'abyss' : 'sea';
  c.px.fill(deep);
  // Dithered band where deep water meets the sky-coloured horizon.
  const sky: PaletteName = light === 'day' ? 'foam' : light === 'dusk' ? 'plum' : 'night';
  c.rect(0, 0, W, 14, sky);
  for (let y = 14; y < 18; y++) for (let x = (y % 2) * 1; x < W; x += 2) c.set(x, y, sky);
  if (light !== 'day') c.ellipse(128, 7, 4, 4, light === 'dusk' ? 'sun' : 'paper');
  for (let i = 0; i < 40; i++)
    c.rect(Math.floor(random() * W), 20 + Math.floor(random() * 78), 3, 1, 'lagoon');
  c.ellipse(80, 64, 52, 26, 'lagoon');
  c.ellipse(80, 62, 44, 20, 'sand');
  c.ellipse(80, 61, 38, 16, ground);
  for (let i = 0; i < 26; i++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random());
    c.rect(80 + Math.cos(a) * r * 34, 61 + Math.sin(a) * r * 13, 2, 1, shade);
  }
  if (biome === 'grove' || biome === 'meadow') {
    for (let i = 0; i < 5; i++) {
      const tx = 50 + Math.floor(random() * 60);
      if (Math.abs(tx - 80) < 12) continue;
      c.ellipse(tx, 56 + Math.floor(random() * 8), 4, 4, 'olive');
      c.rect(tx, 60 + Math.floor(random() * 4), 1, 3, 'ink');
    }
  }
  for (let i = 0; i < 18; i++)
    c.set(Math.floor(random() * W), 20 + Math.floor(random() * 78), 'foam');
  drawLandmark(c, landmark, landmark === 'dock' ? 104 : 80, landmark === 'dock' ? 70 : 64, light);
  return c;
}

async function write(canvas: Canvas, target: URL): Promise<void> {
  await mkdir(new URL('./', target), { recursive: true });
  await sharp(canvas.toRgba(), { raw: { width: W, height: H, channels: 4 } })
    .resize(W * SCALE, H * SCALE, { kernel: 'nearest' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
}

const root = new URL('../src/assets/', import.meta.url);
const projects: [string, Biome, Landmark][] = [
  ['progetto-1', 'meadow', 'lighthouse'],
  ['progetto-2', 'sand', 'workshop'],
  ['progetto-3', 'rock', 'observatory'],
  ['progetto-4', 'grove', 'windmill'],
  ['progetto-5', 'sand', 'dock'],
  ['progetto-6', 'rock', 'tower'],
];

for (const [index, [slug, biome, landmark]] of projects.entries()) {
  await write(
    scene(index + 1, biome, landmark, 'day'),
    new URL(`projects/${slug}/cover.png`, root),
  );
}
const lights: Light[] = ['day', 'dusk', 'night'];
for (const [index, light] of lights.entries()) {
  const landmark = (['lighthouse', 'windmill', 'observatory'] as const)[index] ?? 'lighthouse';
  await write(
    scene(100 + index, 'meadow', landmark, light),
    new URL(`photos/segnaposto/foto-${index + 1}.png`, root),
  );
}
/** A one-page PDF so the CV links work before the real CV arrives. */
function placeholderPdf(lines: string[]): Buffer {
  const text = lines
    .map((line, i) => `BT /F1 ${i === 0 ? 20 : 12} Tf 72 ${760 - i * 28} Td (${line}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(text, 'latin1')} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body, 'latin1');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

const cv = new URL('../public/cv/CV.pdf', import.meta.url);
await mkdir(new URL('./', cv), { recursive: true });
await writeFile(
  cv,
  placeholderPdf([
    'Curriculum segnaposto [DA COMPILARE]',
    'Questo file sostituisce il CV vero finche non arriva.',
    'Sostituiscilo con public/cv/CV.pdf (vedi CONTENT.md).',
  ]),
);

console.log('Placeholders written to src/assets/projects, src/assets/photos and public/cv.');
