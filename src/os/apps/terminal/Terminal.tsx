import './terminal.css';
import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { AppId } from '@/os/apps/ids';
import type { AppProps } from '@/os/apps/manifest';
import { manifests } from '@/os/apps/registry';
import { useOsIndex } from '@/os/context';
import { unlockAchievement } from '@/os/kernel/achievements';
import { closeWindow, openApp, openExternal } from '@/os/kernel/launcher';
import { settingsStore, useSettings } from '@/os/kernel/settings';
import { buildVfs, pathString } from '@/os/kernel/vfs';
import { windowStore } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { playSound } from '@/os/lib/sound';
import { cx } from '@/os/ui/primitives';
import {
  complete,
  execute,
  initialShell,
  promptFor,
  type Effect,
  type Line,
  type Segment,
  type ShellContext,
  type ShellState,
} from './shell';

const MAX_LINES = 400;
const NAMED_APPS: AppId[] = [
  'welcome',
  'career',
  'explorer',
  'photos',
  'about',
  'cv',
  'mail',
  'terminal',
  'settings',
  'trash',
];

interface Row extends Line {
  id: number;
}

export default function Terminal({ windowId }: AppProps) {
  const t = useT();
  const index = useOsIndex();
  const lang = useSettings((s) => s.lang);
  const theme = useSettings((s) => s.theme);
  const skin = useSettings((s) => s.terminalTheme);
  const inputId = useId();
  const root = useMemo(() => buildVfs(index), [index]);
  const nextIdRef = useRef(1);
  const [rows, setRows] = useState<Row[]>(() => [
    { id: 0, tone: 'out', segments: [{ text: t('term.welcome', { os: index.profile.osName }) }] },
  ]);
  const [shell, setShell] = useState<ShellState>(initialShell);
  const [value, setValue] = useState('');
  // Position while browsing the history with the arrows; null means a fresh line.
  const [browsing, setBrowsing] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context = (): ShellContext => ({
    root,
    index,
    t,
    appNames: Object.fromEntries(NAMED_APPS.map((id) => [id, t(manifests[id].titleKey)])),
    now: new Date(),
    lang,
    system: {
      screen: `${String(window.screen.width)}x${String(window.screen.height)}`,
      theme: t(`settings.theme.${theme}`),
    },
  });

  useLayoutEffect(() => {
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [rows]);

  const print = (lines: Line[]) => {
    setRows((current) => {
      const added = lines.map((line) => ({ ...line, id: nextIdRef.current++ }));
      return [...current, ...added].slice(-MAX_LINES);
    });
  };

  const echo = (text: string): Line => ({
    tone: 'echo',
    segments: [{ text: `${promptFor(shell)} ${text}` }],
  });

  const apply = (effect: Effect) => {
    switch (effect.type) {
      case 'open':
        openApp(effect.intent.appId, effect.intent.params);
        break;
      case 'href':
        if (effect.url.startsWith('mailto:')) window.location.assign(effect.url);
        else openExternal(effect.url);
        break;
      case 'clear':
        setRows([]);
        break;
      case 'exit': {
        const win = windowStore.getState().windows[windowId];
        if (win) closeWindow(win);
        break;
      }
      case 'theme':
        settingsStore.getState().set('theme', effect.value);
        break;
      case 'lang':
        settingsStore.getState().set('lang', effect.value);
        break;
    }
  };

  const run = (input: string) => {
    const result = execute(input, shell, context());
    const cleared = result.effects.some((e) => e.type === 'clear');
    if (!cleared) print([echo(input), ...result.lines]);
    setShell(result.state);
    for (const effect of result.effects) apply(effect);
    if (input.trim() !== '') unlockAchievement('curious');
    if (result.lines.some((l) => l.tone === 'error')) playSound('error');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const { history } = shell;
    if (event.key === 'Tab' && !event.shiftKey && value.trim() !== '') {
      // Completion only while typing: on an empty line Tab still moves focus out.
      event.preventDefault();
      const result = complete(value, shell, context());
      setValue(result.input);
      if (result.options.length > 0) {
        print([echo(value), { tone: 'out', segments: [{ text: result.options.join('  ') }] }]);
      }
    } else if (event.key === 'ArrowUp' && history.length > 0) {
      event.preventDefault();
      const at = browsing === null ? history.length - 1 : Math.max(0, browsing - 1);
      setBrowsing(at);
      setValue(history[at] ?? '');
    } else if (event.key === 'ArrowDown' && browsing !== null) {
      event.preventDefault();
      const at = browsing + 1;
      setBrowsing(at >= history.length ? null : at);
      setValue(history[at] ?? '');
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      setRows([]);
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      const input = event.currentTarget;
      // With a selection Ctrl+C copies, as everywhere else.
      if (input.selectionStart !== input.selectionEnd) return;
      event.preventDefault();
      print([echo(`${value}^C`)]);
      setValue('');
      setBrowsing(null);
    }
  };

  const onSegment = (segment: Segment) => {
    if (segment.run !== undefined) run(segment.run);
    else if (segment.open) openApp(segment.open.appId, segment.open.params);
    else if (segment.href) apply({ type: 'href', url: segment.href });
    inputRef.current?.focus();
  };

  return (
    <div className={cx('app-terminal font-pixel', `terminal-${skin}`)}>
      {/* A click on the output, unless it selects text, puts the caret back on the line. */}
      {/* eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-static-element-interactions */}
      <div
        className="terminal-screen"
        onClick={(event) => {
          if (event.target === event.currentTarget && !window.getSelection()?.toString()) {
            inputRef.current?.focus();
          }
        }}
      >
        <div ref={outputRef} className="terminal-output" role="log" aria-label={t('term.output')}>
          {rows.map((row) => (
            <p key={row.id} className={cx('terminal-line', `is-${row.tone}`, row.pre && 'is-pre')}>
              {row.segments.map((segment, i) =>
                segment.open || segment.href || segment.run !== undefined ? (
                  <button
                    // Output never reorders: the position is a stable key.
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={i}
                    type="button"
                    className="terminal-link"
                    onClick={() => {
                      onSegment(segment);
                    }}
                  >
                    {segment.text}
                  </button>
                ) : (
                  // eslint-disable-next-line @eslint-react/no-array-index-key
                  <span key={i}>{segment.text}</span>
                ),
              )}
            </p>
          ))}
        </div>
        <form
          className="terminal-form"
          onSubmit={(event) => {
            event.preventDefault();
            run(value);
            setValue('');
            setBrowsing(null);
          }}
        >
          <label htmlFor={inputId} className="terminal-prompt">
            <span aria-hidden="true">{promptFor(shell)}</span>
            <span className="sr-only">{t('term.input', { path: pathString(shell.cwd) })}</span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            className="terminal-input"
            value={value}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={onKeyDown}
          />
        </form>
      </div>
    </div>
  );
}
