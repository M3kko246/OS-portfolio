import type { APIRoute, GetStaticPaths } from 'astro';
import { getProjects, type Project } from '@/lib/content';

/** Case study HTML for the Reader, rendered at build time from the project's Markdown body. */
export const getStaticPaths = (async () => {
  const projects = await getProjects();
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

export const GET = (({ props }) => {
  const { project } = props as { project: Project };
  return new Response(
    JSON.stringify({
      slug: project.id,
      title: project.data.title,
      html: project.rendered?.html ?? '',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}) satisfies APIRoute;
