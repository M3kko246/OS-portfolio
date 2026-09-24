# Portfolio OS

Personal portfolio built as a playable pixel operating system. The full brief is `PROMPT.md`; this
file records conventions, commands and decisions so every session starts aligned.

## Working rules

- Talk to the user in Italian. Code, file names, identifiers, comments and commits in English.
  Visible UI text from typed dictionaries: `it` is the source, `en` must have every key.
- One stage at a time (PROMPT.md §5). A stage ends with `pnpm verify` + `pnpm test:e2e`, a short
  report and one Conventional Commit.
- Never invent personal data: use `[DA COMPILARE]` and list it in `CONTENT_TODO.md`.
- No `TODO` in code without a matching entry in `CONTENT_TODO.md` or in the stage report.
- Check installed versions against official docs before writing APIs from memory.

## Commands

| Command                       | What it does                                           |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm dev`                    | Dev server (CSP is not applied in dev)                 |
| `pnpm build` / `pnpm preview` | Static build / serve it on port 4321                   |
| `pnpm verify`                 | astro check, ESLint, Prettier check, Vitest, build     |
| `pnpm test:e2e`               | Playwright + axe against `pnpm preview`                |
| `pnpm lighthouse`             | Lighthouse with the brief's thresholds (after build)   |
| `pnpm tokens`                 | Regenerate `src/styles/tokens.css` from `src/design`   |
| `pnpm fonts`                  | Subset fonts from `art/fonts` into `src/assets/fonts`  |
| `pnpm sprites`                | Redraw sprites, cursor, night light, Cestino drafts    |
| `pnpm wallpapers`             | Render the 4 wallpapers from the game world (Chromium) |

## Structure

- `src/design/` is the single source of color and scale: `palette.ts` (16 colors), `themes.ts`
  (semantic tokens per theme, allowed contrast pairs), `pixel.ts` (`--u`), `color.ts` (OKLab,
  WCAG contrast, nearest palette color), `tokens.ts` (renders tokens.css).
- `src/styles/tokens.css` is generated: never edit it by hand. `global.css` maps tokens to
  Tailwind with `@theme inline` and clears Tailwind's default colors, radii and shadows, so only
  system tokens exist as utilities.
- `art/` holds sources that are never served as they are (fonts, sprites, brand).
- `tests/` Vitest, `e2e/` Playwright.
- `src/os/` is the React island (`client:only`), mounted by `src/pages/index.astro` under the
  static boot screen:
  - `kernel/`: pure logic and stores. `geometry.ts` (art-pixel rects, snapping, resize),
    `windows.ts` (window manager store, invariants tested), `icons.ts` (desktop grid),
    `url.ts` (deep links), `vfs.ts` (virtual file system shared by Explorer, Terminal, Esegui),
    `settings.ts` / `session.ts` (persisted, versioned, safe storage), `shell.ts` (menus and
    dialogs), `launcher.ts` (open/close with opener tracking for animation and focus return),
    `layers.ts` (every z-index, emitted as `--z-*` in tokens.css).
  - `shell/`: Boot, Desktop, Window(Layer), Taskbar, Menus, RunDialog, Dialogs, AppFrame.
  - `apps/`: `registry.ts` (manifests, lazy components created at module level),
    one folder per app.
  - `ui/`: primitives (Glyph, Sprite, BrandMark), Menu, Skeleton. `lib/`: pixel scale, motion,
    i18n hook, announcer, zoom rectangles.

## Decisions

- Versions (checked 2026-09-24): Astro 7.3.5, React 19.3.0, Tailwind 4.3.3, Vitest 5.0.1,
  ESLint 10.11.0, pnpm 12.6.0, Node 24 LTS. Exact versions in package.json.
- TypeScript pinned to 6.0.3: typescript-eslint 8.70 needs <6.1 and @astrojs/check needs ^5||^6.
- ESLint 10: `eslint-plugin-jsx-a11y-x` and `@eslint-react/eslint-plugin` replace jsx-a11y and
  eslint-plugin-react, which stop at ESLint 9.
- React stays on 19.3.x until React Three Fiber accepts 19.4 (its peer range is `<19.4`).
- Astro 7: import `z` from `astro/zod` (Zod 4). Markdown goes through Sätteri. `compressHTML` is
  `'jsx'`, so write spaces between inline elements explicitly (`{' '}`).
- CSP: `security.csp` emits a `<meta>` with script and style hashes. Never put `style="..."`
  attributes in static markup; directives a meta cannot carry go in hosting headers.
  Markdown code uses Prism (classes) because Shiki writes inline styles.
- Fonts via Astro's Fonts API (local provider): Departure Mono is preloaded, Atkinson Hyperlegible
  Next is the variable reading font. Subsets exclude en and em dashes on purpose.
- Contrast fixes to the brief's tokens: `text-muted-on-face` (dark: `paper`), `link` is `sea`
  only inside light wells, errors are `on-danger` text on `danger`. A test checks every text pair
  against the verified table of PROMPT.md §4.3.
- `--u` has a CSS fallback from resolution media queries so static pages are crisp before JS;
  the OS refines it at runtime from the exact devicePixelRatio.
- Sprites will be generated into `src/assets/sprites/` (hashed, immutable cache), not `public/`.
- No Motion library for now: stepped animations use CSS `steps()` and the Web Animations API.
- Hosting proposal: Cloudflare (to be confirmed); the adapter is added when the contact endpoint
  arrives.
- pnpm 12 blocks dependency build scripts: approved ones live in `pnpm-workspace.yaml`
  (`allowBuilds`).
- Astro 7 allows one `astro preview` per project: stop strays with `pnpm astro preview stop`.
- Lighthouse: `scripts/lighthouse.ts` runs Lighthouse 13 over Playwright's Chromium (CDP) with the
  thresholds of PROMPT.md §1.3. @lhci/cli was dropped: it bundles Lighthouse 12 and its Chrome
  launcher fails to clean up on Windows.
- Content: `testimonials.json` is validated with Zod in `src/lib/content.ts`, not a collection
  (the file loader warns on an empty file). Photos: `photos.json` + `scripts/check-photos.ts`,
  run before every build.
- Placeholders: `scripts/make-placeholders.ts` draws covers and photos in the palette and writes
  the placeholder CV. Every placeholder text contains `[DA COMPILARE]`.
- Static pages share `src/styles/reading.css`. Surfaces that are dark in every theme (boot
  screen) use the generated `.theme-dark` class.
- Social images: `src/lib/og.ts` (Satori + resvg) with the static font subsets in
  `src/assets/fonts/og`. Favicons are endpoints generated from the brand grid.
- `SITE_URL` sets `site` (canonical URLs, sitemap, social images); defaults to example.com.
- OS geometry is in art pixels (integers); CSS px = art px × `--u`. Windows render in creation
  order (stable DOM, focus and iframes survive) and stack by their index in `order`.
- Gestures (window drag/resize, icon drag, marquee) write styles through refs in rAF and commit
  to the store on pointerup: no React state per pointer move.
- Desktop icons are 32x32 sprites drawn by `scripts/build-sprites.ts` (pnpm sprites), shown at
  32u with `image-rendering: pixelated`. UI glyphs come only from pixelarticons (12u).
- Stepped motion: WAAPI/CSS `steps()`, 40 ms per step; `data-motion="reduced"` on the root turns
  every animation off (system preference or Settings).
- Budget: `pnpm budgets` measures the initial JS of `/` (gzip, static imports followed).
- Hosting: Cloudflare Workers via `@astrojs/cloudflare` (`prerenderEnvironment: 'node'` because
  build-time pages use fs, sharp and Satori; `imageService: 'compile'` for build-time images).
  Build output is `dist/client` (static) + `dist/server`; `astro preview` runs workerd.
  `build.format: 'file'` serves `/classica` without trailing-slash redirects.
- `/api/contact` is the only on-demand route: Zod validation shared with the client rules in
  `src/lib/contact.ts`, honeypot + minimum fill time, rate limiting through the
  `CONTACT_LIMITER` binding (wrangler.jsonc), Resend with secrets from `astro:env`.
- Data endpoints for the OS: `/data/projects/[slug].json` (case study HTML from
  `entry.rendered.html`) and `/data/photos.json` (tiny, medium, full variants).
- Vitest uses a plain config (not getViteConfig): the adapter would run tests in workerd.
- Each app imports its own CSS (`explorer.css`, `photos.css`, shared `apps.css`).
- Carriera (`src/game`): pure logic in `logic/` (layout, walkable SDFs, Dijkstra routes, camera
  math, input), tested in Node. `engine.ts` is the imperative per-frame core (outside React: the
  React Compiler rules forbid mutating state in frame callbacks); components only call
  `engine.step` and read `engine.player`. Porto and next-island features live in `PORTO` /
  `NEXT` (layout.ts) so meshes, obstacles and interaction spots share coordinates.
- Pipeline: RenderPixelatedPass → OutputPass → PaletteQuantizePass (OKLab nearest colour,
  Bayer dither on game pixels). GLSL in `fx/glsl.ts` is shared with
  `tests/game/quantize.browser.test.ts`, which runs it in real WebGL (Vitest browser mode).
- The game bundle is lazy: `/career-manifest.json` (Vite plugin in astro.config) lists its
  chunks so the loader shows real download progress. `?debug=perf` shows fps and draw calls.
- Headless Chromium needs `--enable-unsafe-swiftshader` for WebGL (Playwright and Vitest).
- R3F logs a "THREE.Clock deprecated" warning with three r186: it comes from the library.
- Terminale: `apps/terminal/shell.ts` is a pure function (line, state, VFS) -> lines, effects,
  state; the component renders lines and applies effects. `cat` reads `text` on VFS files;
  path lookup forgives case. Tab completes only on a non-empty line, so Tab still leaves.
- Achievements (`kernel/achievements.ts`): five, each with one cosmetic (hat, terminal theme,
  wallpaper). Unlocks persist in the session store; toasts are transient. Visit, night and
  island checks start after boot (`watchAchievements`).
- Sounds (`lib/sound.ts`): ZzFX parameters; `zzfx` creates its AudioContext on import, so it
  is imported dynamically on the first sound, only with sounds on and sticky user activation.
- Wallpapers: `pnpm wallpapers` runs `astro dev` (the `/dev/wallpaper` route is injected only
  in dev) and renders the world from afar in headless Chromium, reading the drawing buffer
  (screenshots shift colours). Output: 4 PNGs (exact palette, uniform sea border) and
  `wallpapers.json` (layout key, sea colours, night-light positions). `index.astro` fails the
  build when the layout key no longer matches the projects. The desktop draws the image on a
  480x270 canvas scaled by CSS: whole-number scale, lights on exact art pixels, and a canvas is
  never the LCP element (an <img> wallpaper pushed LCP on / to 3.9 s).
- Reduced motion freezes water and windmill: wallpaper renders are byte-identical run to run.
- Handheld mode (`src/os/handheld`): `kernel/mode.ts` decides (Settings `mode`, or auto below
  768 px). Same window store and apps; the top window shows full screen. Each open app pushes a
  history entry (`useBackButton`), so the phone's Back closes it; closing from inside calls
  history.back() and ignores its own popstate. In handheld mode the desktop URL sync is off.
- Touch in Carriera: `hud/Touch.tsx` writes an analog `input.stick` (dead zone, clamp) read by
  `engine.step`; the knob moves through a ref. Pinch zoom lives on the container. Touch UI shows
  on coarse pointers, in handheld mode, or after the first touch.
- Languages: Italian at the root, English under `/en` with English path names
  (`/en/classic`, `/en/projects/[slug]`); `src/lib/paths.ts` is the one map of pages and data
  URLs, shared by pages and OS. Page bodies live in `src/components/pages/*` with a `lang` prop;
  files in `src/pages` only pick the language. `Base.astro` writes hreflang (it, en, x-default),
  og:locale and a clean canonical (the build sees `.html` because of `build.format: 'file'`).
- Content translations (`src/lib/localize.ts`): `src/content/projects/en/<same file>.md` for
  projects (every field optional, the body is the English case study), `en` objects in the
  profile, experience.json and photos.json. Missing English falls back to Italian and the page
  marks that block `lang="it"`.
- The OS page embeds both indexes (`buildOsIndex` in `src/lib/os-index.ts`). The URL picks the
  language on load; switching it in the system moves the address between `/` and `/en` and
  updates `<html lang>`. VFS names follow the language (`vfsNames`); Explorer and Terminal
  fall back to a valid folder after a switch.
- Deep links for per-project apps carry the project: `?app=reader&progetto=<slug>`,
  `?app=demo&progetto=<slug>`; without it they are not opened (no empty windows, no 404 fetch).
- `.text-read*` classes set the reading face too: reading sizes never render in Departure Mono.
- `session: false` in astro.config: the adapter would otherwise bind a SESSION KV namespace.
  `pnpm site:check` / `pnpm site:deploy` wrap `wrangler deploy` (the adapter writes the deploy
  config into dist/server); CI runs the dry-run. Deploying needs the owner's account.
- Final check of PROMPT.md §6 with evidence: `CONTROLLO_FINALE.md`; `e2e/sweep.spec.ts` covers
  every app in both themes, served security headers and pixel font sizes at five scales.
