# Portfolio OS

Personal portfolio built as a playable pixel operating system. The full brief is `PROMPT.md`; this
file records conventions, commands and decisions so every session starts aligned.

## Working rules

- Talk to the user in Italian. Code, file names, identifiers, comments and commits in English.
  Visible UI text in Italian, from typed dictionaries (English comes in T7).
- One stage at a time (PROMPT.md §5). A stage ends with `pnpm verify` + `pnpm test:e2e`, a short
  report and one Conventional Commit.
- Never invent personal data: use `[DA COMPILARE]` and list it in `CONTENT_TODO.md`.
- No `TODO` in code without a matching entry in `CONTENT_TODO.md` or in the stage report.
- Check installed versions against official docs before writing APIs from memory.

## Commands

| Command                       | What it does                                          |
| ----------------------------- | ----------------------------------------------------- |
| `pnpm dev`                    | Dev server (CSP is not applied in dev)                |
| `pnpm build` / `pnpm preview` | Static build / serve it on port 4321                  |
| `pnpm verify`                 | astro check, ESLint, Prettier check, Vitest, build    |
| `pnpm test:e2e`               | Playwright + axe against `pnpm preview`               |
| `pnpm lighthouse`             | Lighthouse with the brief's thresholds (after build)  |
| `pnpm tokens`                 | Regenerate `src/styles/tokens.css` from `src/design`  |
| `pnpm fonts`                  | Subset fonts from `art/fonts` into `src/assets/fonts` |

## Structure

- `src/design/` is the single source of color and scale: `palette.ts` (16 colors), `themes.ts`
  (semantic tokens per theme, allowed contrast pairs), `pixel.ts` (`--u`), `color.ts` (OKLab,
  WCAG contrast, nearest palette color), `tokens.ts` (renders tokens.css).
- `src/styles/tokens.css` is generated: never edit it by hand. `global.css` maps tokens to
  Tailwind with `@theme inline` and clears Tailwind's default colors, radii and shadows, so only
  system tokens exist as utilities.
- `art/` holds sources that are never served as they are (fonts, sprites, brand).
- `tests/` Vitest, `e2e/` Playwright.

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
