import './photos.css';
import { ArrowLeft } from 'pixelarticons/react/ArrowLeft';
import { ChevronLeft } from 'pixelarticons/react/ChevronLeft';
import { ChevronRight } from 'pixelarticons/react/ChevronRight';
import { Search } from 'pixelarticons/react/Search';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { AppProps } from '@/os/apps/manifest';
import { useT } from '@/os/lib/i18n';
import { useResource } from '@/os/lib/resource';
import { Skeleton } from '@/os/ui/Skeleton';
import { EmptyState, ErrorState } from '@/os/ui/States';
import { cx, Glyph } from '@/os/ui/primitives';

interface Photo {
  id: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  tiny: string;
  medium: string;
  full: string;
}

interface Album {
  id: string;
  title: string;
  project?: string;
  photos: Photo[];
}

/**
 * The tiny version, scaled up with pixelated rendering, holds the place until the real image
 * has loaded: a placeholder in the style of the frame, while the photo itself stays sharp.
 */
function PixelImage({
  photo,
  size,
  className,
}: {
  photo: Photo;
  size: 'medium' | 'full';
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={cx('pixel-image', loaded && 'is-loaded', className)}>
      <img className="pixel-image-tiny" src={photo.tiny} alt="" aria-hidden="true" />
      <img
        className="pixel-image-full"
        src={photo[size]}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        decoding="async"
        onLoad={() => {
          setLoaded(true);
        }}
      />
    </span>
  );
}

function Viewer({ album, start, onClose }: { album: Album; start: number; onClose: () => void }) {
  const t = useT();
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState(false);
  const swipeRef = useRef<{ x: number; id: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const total = album.photos.length;
  const photo = album.photos[index];

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const go = (delta: number) => {
    setZoom(false);
    setIndex((i) => (i + delta + total) % total);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    } else return;
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') swipeRef.current = { x: event.clientX, id: event.pointerId };
  };
  const onPointerUp = (event: PointerEvent) => {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (swipe?.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
  };

  if (!photo) return null;
  return (
    // Carousel shortcuts (arrows, Esc) live on its focusable container.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
    <div
      ref={rootRef}
      className="photo-viewer"
      role="group"
      aria-roledescription="carousel"
      aria-label={album.title}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="viewer-bar">
        <button type="button" className="px-btn" onClick={onClose}>
          <Glyph icon={ArrowLeft} />
          {t('photos.close')}
        </button>
        <span className="viewer-position" aria-live="polite">
          {t('photos.position', { n: index + 1, total })}
        </span>
        <button
          type="button"
          className="px-btn"
          aria-pressed={zoom}
          onClick={() => {
            setZoom((z) => !z);
          }}
        >
          <Glyph icon={Search} />
          {zoom ? t('photos.zoomOut') : t('photos.zoomIn')}
        </button>
      </div>
      <figure
        className={cx('viewer-stage', zoom && 'is-zoomed')}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <PixelImage key={photo.id} photo={photo} size="full" />
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>
      {total > 1 && (
        <div className="viewer-nav">
          <button
            type="button"
            className="px-btn icon-btn"
            aria-label={t('photos.prev')}
            onClick={() => {
              go(-1);
            }}
          >
            <Glyph icon={ChevronLeft} />
          </button>
          <button
            type="button"
            className="px-btn icon-btn"
            aria-label={t('photos.next')}
            onClick={() => {
              go(1);
            }}
          >
            <Glyph icon={ChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Photos({ params }: AppProps) {
  const t = useT();
  const resource = useResource<{ albums: Album[] }>('/data/photos.json');
  const initialAlbum = params.project ? `progetto-${params.project}` : params.album;
  const [albumId, setAlbumId] = useState<string | undefined>(initialAlbum);
  const [open, setOpen] = useState<number | null>(null);

  if (resource.status === 'loading') {
    return <Skeleton shape="grid" label={t('app.loading', { title: t('app.photos') })} />;
  }
  if (resource.status === 'error') {
    return <ErrorState message={t('photos.error')} retry={resource.retry} />;
  }

  const { albums } = resource.data;
  const album = albums.find((a) => a.id === albumId);

  if (album && open !== null) {
    return (
      <Viewer
        album={album}
        start={open}
        onClose={() => {
          setOpen(null);
        }}
      />
    );
  }

  if (album) {
    return (
      <div className="app-photos">
        <div className="photos-bar">
          <button
            type="button"
            className="px-btn"
            onClick={() => {
              setAlbumId(undefined);
            }}
          >
            <Glyph icon={ArrowLeft} />
            {t('photos.back')}
          </button>
          <h3 className="photos-title">{album.title}</h3>
        </div>
        {album.photos.length === 0 ? (
          <EmptyState message={t('photos.empty')} />
        ) : (
          <ul className="photo-grid-os">
            {album.photos.map((photo, i) => (
              <li key={photo.id}>
                <button
                  type="button"
                  className="photo-tile"
                  onClick={() => {
                    setOpen(i);
                  }}
                >
                  <PixelImage photo={photo} size="medium" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (albums.length === 0) return <EmptyState message={t('photos.noAlbums')} />;
  return (
    <div className="app-photos">
      <ul className="photo-grid-os">
        {albums.map((a) => {
          const cover = a.photos[0];
          return (
            <li key={a.id}>
              <button
                type="button"
                className="album-tile"
                onClick={() => {
                  setAlbumId(a.id);
                }}
              >
                {cover ? (
                  <PixelImage photo={cover} size="medium" />
                ) : (
                  <span className="album-empty" />
                )}
                <span className="album-title">{a.title}</span>
                <span className="album-count">{t('photos.count', { count: a.photos.length })}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
