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
}

export type VNode = FolderNode | FileNode;

const open = (appId: AppId, params: Record<string, string> = {}) => ({ open: { appId, params } });

/**
 * The virtual file system, generated from the content. Explorer, Terminal and Esegui all read
 * this one tree.
 */
export function buildVfs(index: OsIndex): FolderNode {
  const projects: FolderNode[] = [...index.projects]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const children: VNode[] = [
        {
          kind: 'file',
          name: 'Leggimi.md',
          icon: 'readme',
          action: open('reader', { slug: p.slug }),
        },
      ];
      if (p.demo.kind !== 'none') {
        children.push({
          kind: 'shortcut',
          name: 'demo.lnk',
          icon: 'shortcut',
          action: open('demo', { slug: p.slug }),
        });
      }
      if (p.gallery.length > 0) {
        children.push({
          kind: 'folder',
          name: 'foto',
          icon: 'photos',
          children: [],
          action: open('photos', { project: p.slug }),
        });
      }
      if (p.links.repo) {
        children.push({
          kind: 'shortcut',
          name: 'codice.url',
          icon: 'link',
          action: { href: p.links.repo },
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
      { kind: 'file', name: 'Leggimi.txt', icon: 'readme', action: open('welcome') },
      { kind: 'file', name: 'CV.pdf', icon: 'pdf', action: open('cv') },
      {
        kind: 'folder',
        name: 'progetti',
        icon: 'folder',
        children: projects,
        action: open('explorer'),
      },
      { kind: 'folder', name: 'foto', icon: 'photos', children: albums, action: open('photos') },
    ],
  };
}

/** Resolves `path` from `cwd` (both as segment lists below `~`). Returns null if missing. */
export function resolvePath(
  root: FolderNode,
  cwd: readonly string[],
  path: string,
): string[] | null {
  const segments = path.startsWith('~') ? [] : [...cwd];
  for (const part of path.replace(/^~\/?/, '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  return nodeAt(root, segments) ? segments : null;
}

export function nodeAt(root: FolderNode, segments: readonly string[]): VNode | null {
  let node: VNode = root;
  for (const name of segments) {
    if (node.kind !== 'folder') return null;
    const next: VNode | undefined = node.children.find((c) => c.name === name);
    if (!next) return null;
    node = next;
  }
  return node;
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
