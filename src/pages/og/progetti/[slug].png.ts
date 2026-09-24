import type { APIRoute, GetStaticPaths } from 'astro';
import { profile } from '@/data/profile';
import { getProjects, type Project } from '@/lib/content';
import { renderOgPng } from '@/lib/og';

export const getStaticPaths = (async () => {
  const projects = await getProjects();
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

export const GET = (async ({ props }) => {
  const { project } = props as { project: Project };
  const png = await renderOgPng({
    window: `${profile.osName} / progetti`,
    title: project.data.title,
    subtitle: project.data.tagline,
    accent: `${project.data.year} · ${project.data.stack.slice(0, 3).join(' · ')}`,
    footer: `${profile.name} · ${profile.role}`,
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}) satisfies APIRoute;
