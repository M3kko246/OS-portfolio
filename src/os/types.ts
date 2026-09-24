import type { Profile } from '@/data/profile';

/** Everything the OS needs at boot, serialized by index.astro. Heavy details load on demand. */
export interface OsIndex {
  profile: Profile;
  projects: ProjectSummary[];
  albums: AlbumSummary[];
  experience: ExperienceSummary[];
  testimonials: { quote: string; name: string; role: string; company: string }[];
  classicUrl: string;
}

export interface ProjectSummary {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  year: number;
  role: string;
  client?: string;
  duration?: string;
  team?: string;
  status: 'live' | 'archived' | 'in-progress';
  stack: string[];
  problem: string;
  approach: string;
  outcomes: { value: string; label: string; source?: string }[];
  cover: { src: string; width: number; height: number; alt: string };
  gallery: { src: string; width: number; height: number; alt: string; caption?: string }[];
  links: { live?: string; repo?: string };
  demo:
    | { kind: 'none' }
    | { kind: 'external'; url: string }
    | { kind: 'embed'; url: string; aspect: string };
  island: { biome: 'meadow' | 'sand' | 'rock' | 'grove'; landmark: string; seed?: number };
  order: number;
  featured: boolean;
}

export interface AlbumSummary {
  id: string;
  title: string;
  count: number;
}

export interface ExperienceSummary {
  id: string;
  kind: 'work' | 'education';
  title: string;
  org: string;
  start: string;
  end: string | null;
  description: string;
}
