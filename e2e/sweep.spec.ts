import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test, skipBoot } from './fixtures';

/**
 * Final check (PROMPT.md §6): every app, opened from its deep link in both themes, with no
 * serious axe violation and no console error, CSP violations included.
 */
const apps = [
  ['welcome', 'Benvenuto'],
  ['explorer', 'Progetti'],
  ['photos', 'Foto'],
  ['about', 'Chi sono'],
  ['cv', 'CV.pdf'],
  ['mail', 'Contatti'],
  ['terminal', 'Terminale'],
  ['settings', 'Impostazioni'],
  ['trash', 'Cestino'],
] as const;

/** Apps that show one project open from links that carry it. */
const perProject = [
  ['?app=reader&progetto=progetto-1', /^Leggimi\.md, /],
  ['?app=demo&progetto=progetto-1', /progetto 1/],
] as const;

async function open(page: Page, search: string) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'os:session',
      JSON.stringify({
        state: {
          achievements: [],
          visitedIslands: [],
          iconPositions: {},
          showWelcome: false,
          visits: 0,
        },
        version: 1,
      }),
    );
  });
  await page.clock.setFixedTime(new Date(2026, 8, 24, 12, 0));
  await page.goto(`/${search}`);
  await skipBoot(page);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const [id, title] of apps) {
      test(`${title} has no serious a11y issue and no console error`, async ({
        page,
        consoleErrors,
      }) => {
        await open(page, `?app=${id}`);
        const window = page.getByRole('dialog', { name: title, exact: true });
        await expect(window).toBeVisible();
        // Data finished loading: no skeleton left in the window.
        await expect(window.locator('.skeleton')).toHaveCount(0);
        await expectNoSeriousA11yIssues(page);
        expect(consoleErrors).toEqual([]);
      });
    }

    for (const [search, name] of perProject) {
      test(`${search} opens its project and passes the same checks`, async ({
        page,
        consoleErrors,
      }) => {
        await open(page, search);
        const window = page.getByRole('dialog', { name });
        await expect(window).toBeVisible();
        await expect(window.locator('.skeleton')).toHaveCount(0);
        await expectNoSeriousA11yIssues(page);
        expect(consoleErrors).toEqual([]);
      });
    }

    test('a project card and its case study pass the same checks', async ({
      page,
      consoleErrors,
    }) => {
      await open(page, '?progetto=progetto-1');
      const card = page.getByRole('dialog', { name: /progetto 1/ });
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Leggi il caso studio' }).click();
      const reader = page.getByRole('dialog', { name: /Leggimi\.md/ });
      await expect(reader.getByRole('heading', { name: 'Contesto' })).toBeVisible();
      await expectNoSeriousA11yIssues(page);
      expect(consoleErrors).toEqual([]);
    });
  });
}

test('static pages carry the security headers', async ({ request }) => {
  for (const path of ['/', '/classica', '/en/classic']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'");
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  }
});

for (const deviceScaleFactor of [1, 1.25, 1.5, 2, 3]) {
  test.describe(`scale ${String(deviceScaleFactor)}`, () => {
    test.use({ deviceScaleFactor });

    test('Departure Mono only appears at multiples of 11 device pixels', async ({ page }) => {
      const sizes: number[] = [];
      for (const search of [
        '?app=terminal',
        '?app=settings',
        '?app=trash',
        '?progetto=progetto-1',
      ]) {
        await open(page, search);
        await expect(page.getByRole('dialog').first()).toBeVisible();
        sizes.push(
          ...(await page.evaluate(() => {
            const found = new Set<number>();
            for (const el of document.querySelectorAll<HTMLElement>('body *')) {
              const style = getComputedStyle(el);
              if (!style.fontFamily.includes('Departure Mono') || !el.textContent.trim()) continue;
              found.add(parseFloat(style.fontSize) * window.devicePixelRatio);
            }
            return [...found];
          })),
        );
      }
      expect(sizes.length).toBeGreaterThan(0);
      for (const size of sizes) expect(Math.round(size * 100) % 1100).toBe(0);
    });
  });
}
