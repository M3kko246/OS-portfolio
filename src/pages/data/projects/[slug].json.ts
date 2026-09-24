import type { APIRoute, GetStaticPaths } from 'astro';
import { caseStudy } from '@/lib/endpoints';
import { getLocalProjects, type LocalProject } from '@/lib/localize';

export const getStaticPaths = (async () => {
  const projects = await getLocalProjects('it');
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

export const GET = (({ props }) =>
  caseStudy((props as { project: LocalProject }).project)) satisfies APIRoute;
