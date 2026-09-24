import type { SkeletonShape } from '@/os/apps/manifest';

/** Static placeholder shaped like the app's final layout. No shimmer: the frame never loops. */
export function Skeleton({ shape, label }: { shape: SkeletonShape; label: string }) {
  return (
    <div className={`skeleton skeleton-${shape}`} role="status" aria-label={label}>
      {shape === 'grid' &&
        Array.from({ length: 6 }, (_, i) => <span key={i} className="skeleton-tile" />)}
      {shape === 'split' && (
        <>
          <span className="skeleton-side" />
          <span className="skeleton-main" />
        </>
      )}
      {(shape === 'document' || shape === 'form') &&
        Array.from({ length: shape === 'form' ? 4 : 6 }, (_, i) => (
          <span key={i} className={shape === 'form' ? 'skeleton-field' : 'skeleton-line'} />
        ))}
      {shape === 'canvas' && <span className="skeleton-canvas" />}
    </div>
  );
}
