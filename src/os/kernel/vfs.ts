import type { AppId } from '@/os/apps/ids';
import type { OsIndex } from '@/os/types';
import type { Intent } from './url';

export type NodeIcon =
  'folder' | 'readme' | 'pdf' | 'photos' | 'link' | 'shortcut' | 'app' | 'document';

interface BaseNode {
  name: string;
  icon: NodeIcon;
  /** What double click, Enter, `open` in the terminal and Esegui do. */
  action?: { open: Intent } | { href: string };
}

export interface FolderNode extends BaseNode {
  kind: 'folder';
  children: VNode[];
}

export interface FileNode extends BaseNode {
  kind: 'file' | 'shortcut';
  /** What `cat` prints. Files without text are binary (CV.pdf). */
  text?: string;
}

export type VNode = FolderNode | FileNode;

const open = (appId: AppId, params: Record<string, string> = {}) => ({ open: { appId, params } });

/** File and folder names in each language: realistic names, never translated half way. */
export const vfsNames = {
  it: {
    readme: 'Leggimi.txt',
    caseStudy: 'Leggimi.md',
    projects: 'progetti',
    photos: 'foto',
    code: 'codice.url',
  },
  en: {
    readme: 'Readme.txt',
    caseStudy: 'Readme.md',
    projects: 'projects',
    photos: 'photos',
    code: 'code.url',
  },
} as const;

/**
 * The virtual file system, generated from the content in the index's language. Explorer,
 * Terminal and Esegui all read this one tree.
 */
export function buildVfs(index: OsIndex): FolderNode {
  const names = vfsNames[index.lang];
  const projects: FolderNode[] = [...index.projects]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const children: VNode[] = [
        {
          kind: 'file',
          name: names.caseStudy,
          icon: 'readme',
          action: open('reader', { slug: p.slug }),
          text: `# ${p.title}\n${p.tagline}\n\n${p.summary}`,
        },
      ];
      if (p.demo.kind !== 'none') {
        children.push({
          kind: 'shortcut',
          name: 'demo.lnk',
          icon: 'shortcut',
          action: open('demo', { slug: p.slug }),
          text: p.demo.url,
        });
      }
      if (p.gallery.length > 0) {
        children.push({
          kind: 'folder',
          name: names.photos,
          icon: 'photos',
          children: [],
          action: open('photos', { project: p.slug }),
        });
      }
      if (p.links.repo) {
        children.push({
          kind: 'shortcut',
          name: names.code,
          icon: 'link',
          action: { href: p.links.repo },
          text: `[InternetShortcut]\nURL=${p.links.repo}`,
        });
      }
      return {
        kind: 'folder',
        name: p.slug,
        icon: 'folder',
        children,
        action: open('project', { slug: p.slug }),
      };
    });

  const albums: FolderNode[] = index.albums.map((album) => ({
    kind: 'folder',
    name: album.id,
    icon: 'photos',
    children: [],
    action: open('photos', { album: album.id }),
  }));

  return {
    kind: 'folder',
    name: '~',
    icon: 'folder',
    children: [
      {
        kind: 'file',
        name: names.readme,
        icon: 'readme',
        action: open('welcome'),
        text: `# ${index.profile.name}\n${index.profile.role}\n\n${index.profile.bioShort}`,
      },
      { kind: 'file', name: 'CV.pdf', icon: 'pdf', action: open('cv') },
      {
        kind: 'folder',
        name: names.projects,
        icon: 'folder',
        children: projects,
        action: open('explorer'),
      },
      {
        kind: 'folder',
        name: names.photos,
        icon: 'photos',
        children: albums,
        action: open('photos'),
      },
    ],
  };
}

/**
 * Resolves `path` from `cwd` (both as segment lists below `~`). Names match without regard to
 * case, like a forgiving shell; the result uses the real names. Returns null if missing.
 */
export function resolvePath(
  root: FolderNode,
  cwd: readonly string[],
  path: string,
): string[] | null {
  const absolute = path.startsWith('~') || path.startsWith('/');
  const wanted = absolute ? [] : [...cwd];
  for (const part of path.replace(/^~?\/?/, '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') wanted.pop();
    else wanted.push(part);
  }
  const segments: string[] = [];
  let node: VNode = root;
  for (const name of wanted) {
    if (node.kind !== 'folder') return null;
    const next = childNamed(node, name);
    if (!next) return null;
    segments.push(next.name);
    node = next;
  }
  return segments;
}

export function childNamed(folder: FolderNode, name: string): VNode | undefined {
  const lower = name.toLowerCase();
  return (
    folder.children.find((c) => c.name === name) ??
    folder.children.find((c) => c.name.toLowerCase() === lower)
  );
}

export function nodeAt(root: FolderNode, segments: readonly string[]): VNode | null {
  let node: VNode = root;
  for (const name of segments) {
    if (node.kind !== 'folder') return null;
    const next = childNamed(node, name);
    if (!next) return null;
    node = next;
  }
  return node;
}

/** `~/progetti/nome` for a list of segments. */
export function pathString(segments: readonly string[]): string {
  return ['~', ...segments].join('/');
}
/** Every node with its path, for search. */
export function walk(root: FolderNode): { path: string; node: VNode }[] {
  const out: { path: string; node: VNode }[] = [];
  const visit = (node: VNode, path: string) => {
    out.push({ path, node });
    if (node.kind === 'folder')
      for (const child of node.children) visit(child, `${path}/${child.name}`);
  };
  visit(root, '~');
  return out;
}
