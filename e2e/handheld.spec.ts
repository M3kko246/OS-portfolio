import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, skipBoot, test } from './fixtures';

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

async function boot(page: Page, path = '/', { welcome = false } = {}) {
  if (!welcome) {
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
  }
  await page.clock.setFixedTime(new Date(2026, 8, 24, 12, 0));
  await page.goto(path);
  await skipBoot(page, { tap: true });
}

test('the home screen has a status bar, a four-column grid and the dock', async ({
  page,
  consoleErrors,
}) => {
  await boot(page);
  await expect(page.getByRole('banner', { name: 'Barra di stato' })).toBeVisible();
  const grid = page.getByRole('navigation', { name: 'Applicazioni', exact: true });
  const dock = page.getByRole('navigation', { name: 'Applicazioni principali' });
  await expect(grid.getByRole('button')).toHaveCount(6);
  await expect(dock.getByRole('button')).toHaveText([
    'Carriera',
    'Progetti',
    'Contatti',
    'Chi sono',
  ]);

  // Four columns: the first four icons share a row, the fifth starts the next one.
  const tops = await grid
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
  expect(new Set(tops.slice(0, 4)).size).toBe(1);
  expect(tops[4]).toBeGreaterThan(tops[0] ?? 0);

  // Every touch target is at least 44 x 44 px.
  for (const button of await page.getByRole('button').all()) {
    if (!(await button.isVisible())) continue;
    const box = await button.boundingBox();
    expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }
  await expectNoSeriousA11yIssues(page);
  expect(consoleErrors).toEqual([]);
});

test('apps open full screen and the phone Back button closes them', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Chi sono' }).tap();
  const about = page.getByRole('dialog', { name: 'Chi sono' });
  await expect(about).toBeVisible();
  await expect(page).toHaveURL(/\?app=about$/);
  const box = await about.boundingBox();
  expect(box?.width).toBe(390);

  await page.goBack();
  await expect(about).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Chi sono' })).toBeFocused();

  // Closing from the app's own Indietro drops its history entry too.
  await page.getByRole('button', { name: 'Progetti' }).tap();
  const explorer = page.getByRole('dialog', { name: 'Progetti' });
  await expect(explorer).toBeVisible();
  await explorer.getByRole('button', { name: 'Indietro' }).tap();
  await expect(explorer).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Contatti' }).tap();
  await expect(page.getByRole('dialog', { name: 'Contatti' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Contatti' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Applicazioni principali' })).toBeVisible();
});

test('a deep link opens the app over the home screen, Back returns home', async ({ page }) => {
  await boot(page, '/?app=explorer');
  await expect(page.getByRole('dialog', { name: 'Progetti' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Progetti' })).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('the first visit opens Benvenuto full screen', async ({ page }) => {
  await boot(page, '/', { welcome: true });
  const welcome = page.getByRole('dialog', { name: 'Benvenuto' });
  await expect(welcome).toBeVisible();
  await welcome.getByRole('button', { name: 'Indietro' }).tap();
  await expect(page.getByRole('button', { name: 'Carriera' })).toBeVisible();
});

test('Carriera shows the joystick and the action button, and the joystick walks', async ({
  page,
}) => {
  await boot(page);
  await page.getByRole('button', { name: 'Carriera' }).tap();
  const game = page.getByRole('application');
  await expect(game.locator('canvas')).toBeVisible({ timeout: 30_000 });
  // Next to the controls sign the action button opens it; elsewhere it jumps.
  await expect(game.getByRole('button', { name: 'Apri Cartello dei comandi' })).toBeVisible();
  const hint = game.getByText('Trascina il riquadro');
  await expect(hint).toBeVisible();

  const pad = game.locator('.touch-joystick');
  const box = await pad.boundingBox();
  if (!box) throw new Error('no joystick');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - box.height / 2, { steps: 4 });
  await expect(hint).toBeHidden();
  await page.mouse.up();
});

test('Settings can force the desktop on a phone', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('os:settings', JSON.stringify({ state: { mode: 'desktop' }, version: 3 }));
  });
  await boot(page);
  await expect(page.getByRole('button', { name: 'Avvio' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Applicazioni principali' })).toHaveCount(0);
});
