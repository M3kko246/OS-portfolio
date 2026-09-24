import type { ImageMetadata } from 'astro';
import manifestJson from '@/assets/photos/photos.json';
import type { Lang } from '@/i18n';

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
  /** English alt and caption; missing ones fall back to Italian. */
  en?: { alt?: string; caption?: string };
}

interface Manifest {
  albums: { id: string; title: string; en?: { title?: string }; photos: ManifestPhoto[] }[];
}

const manifest: Manifest = manifestJson;

/** Albums from photos.json; scripts/check-photos.ts guarantees files and alt texts match. */
function build(lang: Lang): Album[] {
  const english = lang === 'en';
  return manifest.albums.map((album) => ({
    id: album.id,
    title: (english ? album.en?.title : undefined) ?? album.title,
    photos: album.photos.map((photo) => {
      const image = files[`/src/assets/photos/${album.id}/${photo.file}`];
      if (!image) throw new Error(`Photo not found: ${album.id}/${photo.file}`);
      return {
        id: `${album.id}/${photo.file}`,
        album: album.id,
        image,
        alt: (english ? photo.en?.alt : undefined) ?? photo.alt,
        caption: (english ? photo.en?.caption : undefined) ?? photo.caption,
      };
    }),
  }));
}

export const albums: Album[] = build('it');
const albumsEn = build('en');

export function albumsFor(lang: Lang): Album[] {
  return lang === 'en' ? albumsEn : albums;
}

export const photoCount = albums.reduce((count, album) => count + album.photos.length, 0);
