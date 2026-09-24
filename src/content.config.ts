import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const biomes = ['meadow', 'sand', 'rock', 'grove'] as const;
export const landmarks = [
  'lighthouse',
  'tower',
  'workshop',
  'observatory',
  'windmill',
  'dock',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
      tagline: z.string().max(90),
      summary: z.string().max(200),
      year: z.number().int(),
      role: z.string(),
      client: z.string().optional(),
      duration: z.string().optional(),
      team: z.string().optional(),
      status: z.enum(['live', 'archived', 'in-progress']),
      stack: z.array(z.string()).min(1),
      problem: z.string(),
      approach: z.string(),
      outcomes: z
        .array(z.object({ value: z.string(), label: z.string(), source: z.string().optional() }))
        .max(4)
        .default([]),
      cover: image(),
      coverAlt: z.string().min(5),
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(5), caption: z.string().optional() }))
        .default([]),
      links: z
        .object({
          live: z.url().optional(),
          repo: z.url().optional(),
        })
        .default({}),
      demo: z
        .discriminatedUnion('kind', [
          z.object({ kind: z.literal('embed'), url: z.url(), aspect: z.string().default('16/10') }),
          z.object({ kind: z.literal('external'), url: z.url() }),
          z.object({ kind: z.literal('none') }),
        ])
        .default({ kind: 'none' }),
      island: z.object({
        biome: z.enum(biomes),
        landmark: z.enum(landmarks),
        seed: z.number().int().optional(),
      }),
      order: z.number().int(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const monthPattern = /^\d{4}-\d{2}$/;

const experience = defineCollection({
  loader: file('src/content/experience.json'),
  schema: z.object({
    kind: z.enum(['work', 'education']),
    title: z.string(),
    org: z.string(),
    start: z.string().regex(monthPattern),
    end: z.string().regex(monthPattern).nullable(),
    description: z.string().max(240),
  }),
});

export const collections = { projects, experience };
