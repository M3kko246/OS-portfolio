import type { Glyph as GlyphComponent, SpriteId } from '@/os/apps/manifest';
import { brandRuns } from '@/design/brand';

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** A pixelarticons glyph, decorative: the control it sits in carries the accessible name. */
export function Glyph({
  icon: Icon,
  className = 'icon',
}: {
  icon: GlyphComponent;
  className?: string;
}) {
  return <Icon aria-hidden="true" focusable="false" className={className} />;
}

const spriteUrls = import.meta.glob<string>('/src/assets/sprites/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function spriteUrl(id: SpriteId): string {
  return spriteUrls[`/src/assets/sprites/${id}.png`] ?? '';
}

/** 32x32 sprite shown at 32u, so every sprite pixel is a whole number of device pixels. */
export function Sprite({ id, className }: { id: SpriteId; className?: string }) {
  return (
    <img
      src={spriteUrl(id)}
      alt=""
      width={32}
      height={32}
      draggable={false}
      className={cx('sprite', className)}
    />
  );
}

const runs = brandRuns();

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={cx('brand-mark', className)}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {runs.map((r) => (
        <rect
          key={`${r.x}-${r.y}`}
          className={r.tone === 'ink' ? 'brand-ink' : 'brand-accent'}
          x={r.x}
          y={r.y}
          width={r.width}
          height={1}
        />
      ))}
    </svg>
  );
}
