import './explorer.css';
import { ArrowLeft } from 'pixelarticons/react/ArrowLeft';
import { ArrowUp } from 'pixelarticons/react/ArrowUp';
import { File } from 'pixelarticons/react/File';
import { FileText } from 'pixelarticons/react/FileText';
import { Folder } from 'pixelarticons/react/Folder';
import { Image } from 'pixelarticons/react/Image';
import { Link } from 'pixelarticons/react/Link';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { MessageKey } from '@/i18n';
import { useOsIndex } from '@/os/context';
import type { AppProps, Glyph as GlyphComponent, SpriteId } from '@/os/apps/manifest';
import { openApp, openExternal } from '@/os/kernel/launcher';
import { buildVfs, nodeAt, vfsNames, type NodeIcon, type VNode } from '@/os/kernel/vfs';
import { useT } from '@/os/lib/i18n';
import { EmptyState, ErrorState } from '@/os/ui/States';
import { cx, Glyph, Sprite } from '@/os/ui/primitives';

type View = 'icons' | 'list' | 'details';
type Sort = 'year' | 'name';

const SPRITES: Record<NodeIcon, SpriteId> = {
  folder: 'folder',
  readme: 'readme',
  pdf: 'pdf',
  photos: 'photos',
  link: 'terminal',
  shortcut: 'readme',
  app: 'readme',
  document: 'readme',
};

// Small views use 12u glyphs: sprites are only shown at whole multiples of their 32 px.
const GLYPHS: Record<NodeIcon, GlyphComponent> = {
  folder: Folder,
  readme: FileText,
  pdf: File,
  photos: Image,
  link: Link,
  shortcut: Link,
  app: FileText,
  document: FileText,
};

function placesFor(lang: keyof typeof vfsNames) {
  const names = vfsNames[lang];
  return [
    { path: [], label: 'explorer.home', glyph: Folder },
    { path: [names.projects], label: 'app.explorer', glyph: Folder },
    { path: [names.photos], label: 'app.photos', glyph: Image },
  ] satisfies { path: string[]; label: MessageKey; glyph: typeof Folder }[];
}

export default function Explorer({ params }: AppProps) {
  const t = useT();
  const index = useOsIndex();
  const root = useMemo(() => buildVfs(index), [index]);
  const [path, setPath] = useState<string[]>(() =>
    (params.path ?? vfsNames[index.lang].projects).split('/').filter(Boolean),
  );
  const [history, setHistory] = useState<string[][]>([]);
  // Folder names follow the language: switching it starts again from the projects.
  const [pathLang, setPathLang] = useState(index.lang);
  if (pathLang !== index.lang) {
    setPathLang(index.lang);
    setPath([vfsNames[index.lang].projects]);
    setHistory([]);
  }
  const places = placesFor(index.lang);
  const [view, setView] = useState<View>('icons');
  const [sort, setSort] = useState<Sort>('year');
  const [selected, setSelected] = useState<string | null>(null);
  const itemsRef = useRef(new Map<string, HTMLElement>());

  const folder = nodeAt(root, path);
  const years = useMemo(() => new Map(index.projects.map((p) => [p.slug, p.year])), [index]);
  const items = useMemo(() => {
    if (folder?.kind !== 'folder') return [];
    return [...folder.children].sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : (years.get(b.name) ?? 0) - (years.get(a.name) ?? 0) || a.name.localeCompare(b.name),
    );
  }, [folder, sort, years]);

  const go = (next: string[]) => {
    setHistory((h) => [...h, path]);
    setPath(next);
    setSelected(null);
  };

  const isProject = (node: VNode) =>
    node.kind === 'folder' &&
    node.action !== undefined &&
    'open' in node.action &&
    node.action.open.appId === 'project';

  const activate = (node: VNode, from: Element | null) => {
    // A project folder opens its card; other folders are browsed.
    if (node.kind === 'folder' && !isProject(node) && node.children.length > 0) {
      go([...path, node.name]);
      return;
    }
    if (!node.action) return;
    if ('href' in node.action) openExternal(node.action.href);
    else openApp(node.action.open.appId, node.action.open.params, from);
  };

  const kindLabel = (node: VNode) =>
    isProject(node)
      ? t('explorer.kind.project')
      : node.kind === 'folder'
        ? t('explorer.kind.folder')
        : node.kind === 'shortcut'
          ? t('explorer.kind.shortcut')
          : t('explorer.kind.file');

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const i = items.findIndex((n) => n.name === selected);
    const step =
      view === 'icons'
        ? { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }
        : { ArrowDown: 1, ArrowUp: -1 };
    const delta = (step as Record<string, number>)[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const next = items[Math.min(items.length - 1, Math.max(0, i < 0 ? 0 : i + delta))];
      if (next) {
        setSelected(next.name);
        itemsRef.current.get(next.name)?.focus();
      }
    } else if (event.key === 'Enter' && i >= 0) {
      event.preventDefault();
      const node = items[i];
      if (node) activate(node, itemsRef.current.get(node.name) ?? null);
    } else if (event.key === 'Backspace' && path.length > 0) {
      event.preventDefault();
      go(path.slice(0, -1));
    }
  };

  const selectedNode = items.find((n) => n.name === selected);
  const focusable = selected ?? items[0]?.name;

  return (
    <div className="app-explorer">
      <div className="explorer-toolbar" role="toolbar" aria-label={t('explorer.view')}>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('explorer.back')}
          disabled={history.length === 0}
          onClick={() => {
            const previous = history.at(-1);
            if (!previous) return;
            setHistory((h) => h.slice(0, -1));
            setPath(previous);
            setSelected(null);
          }}
        >
          <Glyph icon={ArrowLeft} />
        </button>
        <button
          type="button"
          className="px-btn icon-btn"
          aria-label={t('explorer.up')}
          disabled={path.length === 0}
          onClick={() => {
            go(path.slice(0, -1));
          }}
        >
          <Glyph icon={ArrowUp} />
        </button>
        <label className="explorer-address">
          <span className="sr-only">{t('explorer.address')}</span>
          <input className="px-field" readOnly value={['~', ...path].join('/')} />
        </label>
        {selectedNode && isProject(selectedNode) && (
          <button
            type="button"
            className="px-btn"
            onClick={() => {
              go([...path, selectedNode.name]);
            }}
          >
            {t('explorer.browse')}
          </button>
        )}
        <label className="explorer-select">
          {t('explorer.view')}
          <select
            className="px-field"
            value={view}
            onChange={(e) => {
              setView(e.target.value as View);
            }}
          >
            <option value="icons">{t('explorer.view.icons')}</option>
            <option value="list">{t('explorer.view.list')}</option>
            <option value="details">{t('explorer.view.details')}</option>
          </select>
        </label>
        <label className="explorer-select">
          {t('explorer.sort')}
          <select
            className="px-field"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort);
            }}
          >
            <option value="year">{t('explorer.sort.year')}</option>
            <option value="name">{t('explorer.sort.name')}</option>
          </select>
        </label>
      </div>

      <div className="explorer-main">
        <nav className="explorer-places" aria-label={t('explorer.places')}>
          <ul>
            {places.map((place) => (
              <li key={place.label}>
                <button
                  type="button"
                  className={cx('place', place.path.join('/') === path.join('/') && 'is-current')}
                  aria-current={place.path.join('/') === path.join('/') ? 'location' : undefined}
                  onClick={() => {
                    go(place.path);
                  }}
                >
                  <Glyph icon={place.glyph} />
                  {t(place.label)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="explorer-content">
          {folder?.kind !== 'folder' ? (
            <ErrorState message={t('explorer.notFound')}>
              <button
                type="button"
                className="px-btn"
                onClick={() => {
                  go([]);
                }}
              >
                {t('explorer.home')}
              </button>
            </ErrorState>
          ) : items.length === 0 ? (
            <EmptyState message={t('explorer.empty')} />
          ) : (
            <>
              {view === 'details' && (
                <div className="explorer-header" aria-hidden="true">
                  <span>{t('explorer.col.name')}</span>
                  <span>{t('explorer.col.year')}</span>
                  <span>{t('explorer.col.kind')}</span>
                </div>
              )}
              <ul
                role="listbox"
                aria-label={['~', ...path].join('/')}
                className={`explorer-items view-${view}`}
                onKeyDown={onKeyDown}
              >
                {items.map((node) => (
                  // Keyboard selection and Enter are handled by the listbox (onKeyDown above).
                  // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
                  <li
                    key={node.name}
                    ref={(el) => {
                      if (el) itemsRef.current.set(node.name, el);
                      else itemsRef.current.delete(node.name);
                    }}
                    role="option"
                    aria-selected={selected === node.name}
                    tabIndex={focusable === node.name ? 0 : -1}
                    className="explorer-item"
                    onClick={() => {
                      setSelected(node.name);
                    }}
                    onDoubleClick={(e) => {
                      activate(node, e.currentTarget);
                    }}
                    onFocus={() => {
                      setSelected(node.name);
                    }}
                  >
                    {view === 'icons' ? (
                      <Sprite id={SPRITES[node.icon]} />
                    ) : (
                      <Glyph icon={GLYPHS[node.icon]} />
                    )}
                    <span className="explorer-name">
                      {index.projects.find((p) => p.slug === node.name)?.title ?? node.name}
                    </span>
                    {view === 'details' && (
                      <>
                        <span className="explorer-col">{years.get(node.name) ?? ''}</span>
                        <span className="explorer-col">{kindLabel(node)}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <p className="explorer-status">{t('explorer.items', { count: items.length })}</p>
    </div>
  );
}
