import { brandAscii } from '@/design/brand';
import type { Lang, MessageKey } from '@/i18n';
import type { AppId } from '@/os/apps/ids';
import type { Intent } from '@/os/kernel/url';
import { nodeAt, pathString, resolvePath, type FolderNode, type VNode } from '@/os/kernel/vfs';
import type { OsIndex } from '@/os/types';

/**
 * The terminal as a pure function (PROMPT.md §3.8): a command line, the shell state and the
 * file system in; output lines, effects and the next state out. The component only renders
 * lines and carries out effects, so every command is testable without a browser.
 */

/** A piece of output. With `open`, `href` or `run` it is clickable. */
export interface Segment {
  text: string;
  open?: Intent;
  href?: string;
  /** A terminal command to run, e.g. listing a folder. */
  run?: string;
}

export interface Line {
  tone: 'out' | 'error' | 'echo';
  segments: Segment[];
  /** Keep spacing and never wrap (ASCII art, tables). */
  pre?: boolean;
}

export type Effect =
  | { type: 'open'; intent: Intent }
  | { type: 'href'; url: string }
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'theme'; value: 'auto' | 'light' | 'dark' }
  | { type: 'lang'; value: Lang };

export interface ShellState {
  cwd: string[];
  history: string[];
}

export interface ShellContext {
  root: FolderNode;
  index: Pick<OsIndex, 'profile' | 'projects'>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** Visible app names in the current language, for `open`. */
  appNames: Partial<Record<AppId, string>>;
  now: Date;
  lang: Lang;
  /** Facts only the browser knows, for `info`. */
  system: { screen: string; theme: string };
}

export interface Result {
  lines: Line[];
  effects: Effect[];
  state: ShellState;
}

export const COMMANDS = [
  'help',
  'whoami',
  'ls',
  'cd',
  'pwd',
  'cat',
  'open',
  'progetti',
  'cv',
  'contatti',
  'info',
  'theme',
  'lang',
  'history',
  'clear',
  'date',
  'echo',
  'exit',
  'sudo',
] as const;

export type Command = (typeof COMMANDS)[number];

/** Apps that need parameters (a project, a document) cannot be opened by name. */
const OPENABLE: AppId[] = [
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

const THEMES: Record<string, 'auto' | 'light' | 'dark'> = {
  giorno: 'light',
  day: 'light',
  notte: 'dark',
  night: 'dark',
  auto: 'auto',
};

export const initialShell: ShellState = { cwd: [], history: [] };

const out = (...segments: (Segment | string)[]): Line => ({
  tone: 'out',
  segments: segments.map((s) => (typeof s === 'string' ? { text: s } : s)),
});
const error = (text: string): Line => ({ tone: 'error', segments: [{ text }] });
const pre = (text: string): Line => ({ tone: 'out', segments: [{ text }], pre: true });

/** Splits on spaces; single or double quotes keep spaces inside one argument. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of input.matchAll(pattern)) tokens.push(match[1] ?? match[2] ?? match[3] ?? '');
  return tokens;
}

function isCommand(name: string): name is Command {
  return (COMMANDS as readonly string[]).includes(name);
}

/** A clickable name: files open like a double click, folders list their content. */
function entry(node: VNode, segments: readonly string[]): Segment {
  if (node.kind === 'folder') return { text: `${node.name}/`, run: `ls ${pathString(segments)}` };
  if (!node.action) return { text: node.name };
  return 'open' in node.action
    ? { text: node.name, open: node.action.open }
    : { text: node.name, href: node.action.href };
}

function listing(folder: FolderNode, segments: readonly string[]): Line {
  const items = folder.children.flatMap((child, i) => {
    const item = entry(child, [...segments, child.name]);
    return i === 0 ? [item] : [{ text: '  ' }, item];
  });
  return { tone: 'out', segments: items };
}

function findApp(name: string, ctx: ShellContext): AppId | undefined {
  const wanted = name.toLowerCase();
  return OPENABLE.find((id) => id === wanted || ctx.appNames[id]?.toLowerCase() === wanted);
}

function help(ctx: ShellContext): Line[] {
  const usages = COMMANDS.map((cmd) => {
    const key = `term.usage.${cmd}` as const;
    return ctx.t(key);
  });
  const width = Math.max(...usages.map((u) => u.length)) + 2;
  return [
    out(ctx.t('term.help.intro')),
    ...COMMANDS.map((cmd, i) =>
      pre(`${(usages[i] ?? cmd).padEnd(width)}${ctx.t(`term.help.${cmd}`)}`),
    ),
    out(ctx.t('term.help.keys')),
  ];
}

function info(ctx: ShellContext): Line[] {
  const { profile, projects } = ctx.index;
  const fields: [string, string][] = [
    [ctx.t('term.info.os'), profile.osName],
    [ctx.t('term.info.role'), profile.role],
    [ctx.t('term.info.languages'), profile.languages.map((l) => l.name).join(', ')],
    [ctx.t('term.info.availability'), profile.availability.label],
    [ctx.t('term.info.projects'), String(projects.length)],
    [ctx.t('term.info.email'), profile.email],
    [ctx.t('term.info.screen'), ctx.system.screen],
    [ctx.t('term.info.theme'), ctx.system.theme],
  ];
  const art = brandAscii().split('\n');
  const title = `${profile.firstName}@${profile.osName}`;
  const right = [title, '='.repeat(title.length), ...fields.map(([k, v]) => `${k}: ${v}`)];
  const rows = Math.max(art.length, right.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++)
    lines.push(`${(art[i] ?? '').padEnd(18)}${right[i] ?? ''}`.trimEnd());
  return [pre(lines.join('\n'))];
}

export function execute(input: string, state: ShellState, ctx: ShellContext): Result {
  const line = input.trim();
  const history =
    line === '' || state.history.at(-1) === line ? state.history : [...state.history, line];
  const next: ShellState = { ...state, history };
  const done = (lines: Line[], effects: Effect[] = [], cwd = state.cwd): Result => ({
    lines,
    effects,
    state: { ...next, cwd },
  });
  if (line === '') return done([]);

  const [name = '', ...args] = tokenize(line);
  const command = name.toLowerCase();
  const arg = args.join(' ');
  const { t } = ctx;

  if (!isCommand(command)) return done([error(t('term.notFound', { cmd: name }))]);

  switch (command) {
    case 'help':
      return done(help(ctx));

    case 'whoami':
      return done([
        out(t('term.whoami.guest')),
        out(t('term.whoami.owner', { name: ctx.index.profile.name, role: ctx.index.profile.role })),
      ]);

    case 'pwd':
      return done([out(pathString(state.cwd))]);

    case 'ls': {
      const segments = resolvePath(ctx.root, state.cwd, arg || '.');
      const node = segments ? nodeAt(ctx.root, segments) : null;
      if (!segments || !node) return done([error(t('term.missing', { cmd: 'ls', path: arg }))]);
      if (node.kind !== 'folder') return done([out(entry(node, segments))]);
      if (node.children.length === 0) {
        // Albums have no files in the tree: their photos open in Foto.
        const action = node.action;
        return done([
          action && 'open' in action
            ? out(t('term.openHint'), { text: node.name, open: action.open })
            : out(t('term.empty')),
        ]);
      }
      return done([listing(node, segments)]);
    }

    case 'cd': {
      const segments = resolvePath(ctx.root, state.cwd, arg || '~');
      const node = segments ? nodeAt(ctx.root, segments) : null;
      if (!segments || !node) return done([error(t('term.missing', { cmd: 'cd', path: arg }))]);
      if (node.kind !== 'folder') return done([error(t('term.notFolder', { path: node.name }))]);
      return done([], [], segments);
    }

    case 'cat': {
      if (!arg) return done([error(t('term.usage', { usage: t('term.usage.cat') }))]);
      const segments = resolvePath(ctx.root, state.cwd, arg);
      const node = segments ? nodeAt(ctx.root, segments) : null;
      if (!segments || !node) return done([error(t('term.missing', { cmd: 'cat', path: arg }))]);
      if (node.kind === 'folder') return done([error(t('term.isFolder', { path: node.name }))]);
      if (node.text === undefined)
        return done([error(t('term.binary', { path: node.name })), out(entry(node, segments))]);
      return done(node.text.split('\n').map((text) => out(text)));
    }

    case 'open': {
      if (!arg) return done([error(t('term.usage', { usage: t('term.usage.open') }))]);
      const segments = resolvePath(ctx.root, state.cwd, arg);
      const node = segments ? nodeAt(ctx.root, segments) : null;
      if (node?.action) {
        const effect: Effect =
          'open' in node.action
            ? { type: 'open', intent: node.action.open }
            : { type: 'href', url: node.action.href };
        return done([out(t('term.opening', { name: node.name }))], [effect]);
      }
      const app = findApp(arg, ctx);
      if (app) {
        return done(
          [out(t('term.opening', { name: ctx.appNames[app] ?? app }))],
          [{ type: 'open', intent: { appId: app, params: {} } }],
        );
      }
      const project = ctx.index.projects.find((p) => p.slug === arg.toLowerCase());
      if (project) {
        return done(
          [out(t('term.opening', { name: project.title }))],
          [{ type: 'open', intent: { appId: 'project', params: { slug: project.slug } } }],
        );
      }
      return done([error(t('term.cannotOpen', { path: arg }))]);
    }

    case 'progetti': {
      const projects = [...ctx.index.projects].sort((a, b) => a.order - b.order);
      if (projects.length === 0) return done([out(t('term.empty'))]);
      return done([
        ...projects.map((p) =>
          out(`${String(p.year)}  `, {
            text: p.title,
            open: { appId: 'project', params: { slug: p.slug } },
          }),
        ),
        out(t('term.projectsHint')),
      ]);
    }

    case 'cv':
      return done(
        [out(t('term.opening', { name: 'CV.pdf' }))],
        [{ type: 'open', intent: { appId: 'cv', params: {} } }],
      );

    case 'contatti': {
      const { profile } = ctx.index;
      return done([
        out(`${t('term.info.email')}: `, { text: profile.email, href: `mailto:${profile.email}` }),
        ...profile.socials.map((s) => out(`${s.label}: `, { text: s.url, href: s.url })),
        out(t('term.contactHint'), {
          text: ctx.appNames.mail ?? 'mail',
          open: { appId: 'mail', params: {} },
        }),
      ]);
    }

    case 'info':
      return done(info(ctx));

    case 'theme': {
      const value = THEMES[arg.toLowerCase()];
      if (!value) return done([error(t('term.usage', { usage: t('term.usage.theme') }))]);
      return done(
        [out(t('term.themeSet', { theme: arg.toLowerCase() }))],
        [{ type: 'theme', value }],
      );
    }

    case 'lang': {
      const value = arg.toLowerCase();
      if (value !== 'it' && value !== 'en')
        return done([error(t('term.usage', { usage: t('term.usage.lang') }))]);
      return done([out(t('term.langSet', { lang: value }))], [{ type: 'lang', value }]);
    }

    case 'history':
      return done(
        history.length === 0
          ? []
          : [pre(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'))],
      );

    case 'clear':
      return done([], [{ type: 'clear' }]);

    case 'date':
      return done([
        out(
          ctx.now.toLocaleString(ctx.lang === 'it' ? 'it-IT' : 'en-GB', {
            dateStyle: 'full',
            timeStyle: 'short',
          }),
        ),
      ]);

    case 'echo':
      return done([out(args.join(' '))]);

    case 'exit':
      return done([], [{ type: 'exit' }]);

    case 'sudo':
      return done([error(t('term.sudo'))]);
  }
}

export interface Completion {
  input: string;
  /** Candidates to show when the word is ambiguous. */
  options: string[];
}

function commonPrefix(words: readonly string[]): string {
  const [first = '', ...rest] = words;
  let end = first.length;
  for (const w of rest) {
    let i = 0;
    while (i < end && i < w.length && w[i]?.toLowerCase() === first[i]?.toLowerCase()) i++;
    end = i;
  }
  return first.slice(0, end);
}

function pathCandidates(word: string, state: ShellState, ctx: ShellContext, onlyFolders: boolean) {
  const slash = word.lastIndexOf('/');
  const dir = slash >= 0 ? word.slice(0, slash + 1) : '';
  const partial = (slash >= 0 ? word.slice(slash + 1) : word).toLowerCase();
  const segments = resolvePath(ctx.root, state.cwd, dir || '.');
  const folder = segments ? nodeAt(ctx.root, segments) : null;
  if (folder?.kind !== 'folder') return [];
  return folder.children
    .filter(
      (c) => (!onlyFolders || c.kind === 'folder') && c.name.toLowerCase().startsWith(partial),
    )
    .map((c) => `${dir}${c.name}${c.kind === 'folder' ? '/' : ''}`);
}

/** Tab completion on command names, paths and fixed arguments. */
export function complete(input: string, state: ShellState, ctx: ShellContext): Completion {
  const start = input.search(/\S+$/);
  const word = start >= 0 ? input.slice(start) : '';
  const before = start >= 0 ? input.slice(0, start) : input;
  const [command] = tokenize(before);

  let candidates: string[];
  if (command === undefined) {
    candidates = COMMANDS.filter((c) => c.startsWith(word.toLowerCase()));
  } else if (command === 'theme') {
    candidates = ['giorno', 'notte', 'auto'].filter((c) => c.startsWith(word.toLowerCase()));
  } else if (command === 'lang') {
    candidates = ['it', 'en'].filter((c) => c.startsWith(word.toLowerCase()));
  } else if (['ls', 'cd', 'cat', 'open'].includes(command)) {
    candidates = pathCandidates(word, state, ctx, command === 'cd');
    if (command === 'open' && !word.includes('/')) {
      const apps = OPENABLE.map((id) => ctx.appNames[id]?.toLowerCase() ?? id).filter(
        (n) => !n.includes(' ') && n.startsWith(word.toLowerCase()),
      );
      candidates = [...new Set([...candidates, ...apps])];
    }
  } else candidates = [];

  if (candidates.length === 0) return { input, options: [] };
  if (candidates.length === 1) {
    const only = candidates[0] ?? '';
    return { input: `${before}${only}${only.endsWith('/') ? '' : ' '}`, options: [] };
  }
  const prefix = commonPrefix(candidates);
  return {
    input: prefix.length > word.length ? `${before}${prefix}` : input,
    options: candidates,
  };
}

/** `~/progetti $ ` */
export function promptFor(state: ShellState): string {
  return `${pathString(state.cwd)} $`;
}
