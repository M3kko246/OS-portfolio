import type { ImageMetadata } from 'astro';
import manifest from '@/assets/photos/photos.json';

export interface Photo {
  id: string;
  album: string;
  image: ImageMetadata;
  alt: string;
  caption: string | undefined;
}

export interface Album {
  id: string;
  title: string;
  photos: Photo[];
}

const files = import.meta.glob<ImageMetadata>('/src/assets/photos/*/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});

interface ManifestPhoto {
  file: string;
  alt: string;
  caption?: string;
}

/** Albums from photos.json; scripts/check-photos.ts guarantees files and alt texts match. */
export const albums: Album[] = manifest.albums.map((album) => ({
  id: album.id,
  title: album.title,
  photos: album.photos.map((photo: ManifestPhoto) => {
    const image = files[`/src/assets/photos/${album.id}/${photo.file}`];
    if (!image) throw new Error(`Photo not found: ${album.id}/${photo.file}`);
    return {
      id: `${album.id}/${photo.file}`,
      album: album.id,
      image,
      alt: photo.alt,
      caption: photo.caption,
    };
  }),
}));

export const photoCount = albums.reduce((count, album) => count + album.photos.length, 0);
