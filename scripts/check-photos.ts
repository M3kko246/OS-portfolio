/**
 * Fails the build when photos and photos.json disagree: every image in an album folder needs an
 * entry with a real alt text, and every entry needs its file.
 */
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../src/assets/photos/', import.meta.url);
const IMAGE = /\.(png|jpe?g|webp|avif)$/i;
const FORBIDDEN_DASHES = /[–—]/;

interface Manifest {
  albums: {
    id: string;
    title: string;
    photos: { file: string; alt?: string; caption?: string }[];
  }[];
}

const manifest = JSON.parse(await readFile(new URL('photos.json', root), 'utf8')) as Manifest;
const problems: string[] = [];

const folders = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory());
for (const folder of folders) {
  const album = manifest.albums.find((a) => a.id === folder.name);
  const files = (await readdir(new URL(`${folder.name}/`, root))).filter((f) => IMAGE.test(f));
  for (const file of files) {
    const entry = album?.photos.find((p) => p.file === file);
    if (!entry) problems.push(`${folder.name}/${file}: missing from photos.json`);
    else if (!entry.alt || entry.alt.trim().length < 5)
      problems.push(`${folder.name}/${file}: missing alt text`);
  }
}

for (const album of manifest.albums) {
  const present = folders.some((f) => f.name === album.id)
    ? await readdir(new URL(`${album.id}/`, root))
    : [];
  for (const photo of album.photos) {
    if (!present.includes(photo.file)) problems.push(`${album.id}/${photo.file}: file not found`);
    for (const text of [photo.alt, photo.caption, album.title]) {
      if (text && FORBIDDEN_DASHES.test(text))
        problems.push(`${album.id}/${photo.file}: en or em dash in text`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Photo check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(
  `Photo check passed: ${manifest.albums.reduce((n, a) => n + a.photos.length, 0)} photos.`,
);
