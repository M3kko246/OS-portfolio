import { paths } from '@/lib/paths';
import { settingsStore } from '@/os/kernel/settings';
import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useOsIndex } from '@/os/context';
import { appIds, type AppId } from '@/os/apps/ids';
import type { Glyph as GlyphComponent } from '@/os/apps/manifest';
import { manifests } from '@/os/apps/registry';
import { downloadCv, openApp } from '@/os/kernel/launcher';
import { shellStore, useShell } from '@/os/kernel/shell';
import { useT, type Translate } from '@/os/lib/i18n';
import { cx, Glyph } from '@/os/ui/primitives';
import { Download } from 'pixelarticons/react/Download';
import { ExternalLink } from 'pixelarticons/react/ExternalLink';
import { Folder } from 'pixelarticons/react/Folder';
import { Image } from 'pixelarticons/react/Image';
import { Mail } from 'pixelarticons/react/Mail';
import { Power } from 'pixelarticons/react/Power';
import { useModal } from './Dialogs';
import type { OsIndex } from '@/os/types';

interface Entry {
  id: string;
  label: string;
  kind: string;
  glyph: GlyphComponent;
  run: () => void;
}

/** Lowercase without accents, so "citta" finds "città". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const SEARCHABLE_APPS: AppId[] = appIds.filter((id) => !['project', 'reader', 'demo'].includes(id));

function buildEntries(index: OsIndex, t: Translate): Entry[] {
  return [
    ...SEARCHABLE_APPS.map((id) => ({
      id: `app:${id}`,
      label: t(manifests[id].titleKey),
      kind: t('run.kind.app'),
      glyph: manifests[id].glyph,
      run: () => {
        openApp(id);
      },
    })),
    ...index.projects.map((p) => ({
      id: `project:${p.slug}`,
      label: p.title,
      kind: t('run.kind.project'),
      glyph: Folder,
      run: () => {
        openApp('project', { slug: p.slug });
      },
    })),
    ...index.albums.map((a) => ({
      id: `album:${a.id}`,
      label: a.title,
      kind: t('run.kind.album'),
      glyph: Image,
      run: () => {
        openApp('photos', { album: a.id });
      },
    })),
    {
      id: 'cmd:cv',
      label: t('action.downloadCv'),
      kind: t('run.kind.command'),
      glyph: Download,
      run: downloadCv,
    },
    {
      id: 'cmd:contact',
      label: t('action.contactMe'),
      kind: t('run.kind.command'),
      glyph: Mail,
      run: () => {
        openApp('mail');
      },
    },
    {
      id: 'cmd:classic',
      label: t('nav.classic'),
      kind: t('run.kind.command'),
      glyph: ExternalLink,
      run: () => {
        window.location.assign(paths.classic(settingsStore.getState().lang));
      },
    },
    {
      id: 'cmd:shutdown',
      label: t('start.shutdown'),
      kind: t('run.kind.command'),
      glyph: Power,
      run: () => {
        shellStore.getState().setShutdown(true);
      },
    },
  ];
}

export function search(entries: Entry[], query: string): Entry[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;
  return entries
    .filter((e) => {
      const haystack = normalize(`${e.label} ${e.kind}`);
      return words.every((w) => haystack.includes(w));
    })
    .sort((a, b) => {
      const first = words[0] ?? '';
      return (
        Number(!normalize(a.label).startsWith(first)) -
        Number(!normalize(b.label).startsWith(first))
      );
    });
}

const closeRun = () => {
  shellStore.getState().setRunOpen(false);
};

export function RunDialog() {
  const t = useT();
  const index = useOsIndex();
  const open = useShell((s) => s.runOpen);
  const ref = useModal(open, closeRun);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const entries = useMemo(() => buildEntries(index, t), [index, t]);
  const results = useMemo(() => search(entries, query), [entries, query]);
  const current = results[Math.min(active, results.length - 1)];

  const run = (entry: Entry | undefined) => {
    if (!entry) return;
    closeRun();
    setQuery('');
    setActive(0);
    entry.run();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(
        (i) =>
          (Math.min(i, results.length - 1) + step + results.length) % Math.max(1, results.length),
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(current);
    }
  };

  return (
    <dialog ref={ref} className="os-dialog run-dialog px-shell" aria-labelledby="run-title">
      <p className="window-titlebar dialog-titlebar">
        <span id="run-title" className="window-title">
          {t('run.title')}
        </span>
      </p>
      <div className="dialog-body run-body">
        <label className="field-label" htmlFor="run-input">
          {t('run.label')}
        </label>
        <input
          id="run-input"
          className="px-field"
          type="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? `run-${current.id}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul id={listId} role="listbox" aria-label={t('run.results')} className="run-results">
          {results.map((entry) => (
            // Keyboard selection goes through the combobox input (aria-activedescendant).
            // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
            <li
              key={entry.id}
              id={`run-${entry.id}`}
              role="option"
              aria-selected={entry === current}
              className={cx('run-result', entry === current && 'is-active')}
              onPointerDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                run(entry);
              }}
            >
              <Glyph icon={entry.glyph} />
              <span className="run-label">{entry.label}</span>
              <span className="run-kind">{entry.kind}</span>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p className="run-empty">{t('run.empty', { query })}</p>}
        <p className="run-hint">{t('run.hint')}</p>
      </div>
    </dialog>
  );
}
