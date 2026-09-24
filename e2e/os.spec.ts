import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test, skipBoot } from './fixtures';

/** Skips the boot screen and waits for the desktop to be interactive. */
async function boot(page: Page, path = '/') {
  await page.goto(path);
  await skipBoot(page);
}

test('boot is skippable and opens Welcome on the first visit', async ({ page, consoleErrors }) => {
  await boot(page);
  const welcome = page.getByRole('dialog', { name: 'Benvenuto' });
  await expect(welcome).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Avvia Carriera' })).toBeVisible();
  await expect(page).toHaveURL(/\?app=welcome$/);
  await expectNoSeriousA11yIssues(page);
  expect(consoleErrors).toEqual([]);
});

test('icons open apps with a double click and with the keyboard', async ({ page }) => {
  await boot(page);
  await page.getByRole('option', { name: 'Chi sono' }).dblclick();
  await expect(page.getByRole('dialog', { name: 'Chi sono' })).toBeVisible();
  await expect(page).toHaveURL(/\?app=about$/);

  const readme = page.getByRole('option', { name: 'Leggimi.txt' });
  await readme.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option', { name: 'Carriera' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Progetti' })).toBeVisible();
  // A singleton opens once: a second double click focuses the same window.
  await page.getByRole('option', { name: 'Chi sono' }).dblclick();
  await expect(page.getByRole('dialog', { name: 'Chi sono' })).toHaveCount(1);
});

test('deep links open the right window', async ({ page }) => {
  await boot(page, '/?progetto=progetto-2');
  await expect(page.getByRole('dialog', { name: /progetto 2/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Benvenuto' })).toHaveCount(0);

  await boot(page, '/?app=terminal');
  await expect(page.getByRole('dialog', { name: 'Terminale' })).toBeVisible();
});

test('windows drag, snap to the left half and maximize', async ({ page }) => {
  await boot(page, '/?app=about');
  const win = page.getByRole('dialog', { name: 'Chi sono' });
  await expect(win).toBeVisible();
  const title = win.locator('.window-titlebar');
  const before = await win.boundingBox();
  if (!before) throw new Error('no window box');

  await title.hover({ position: { x: 80, y: 8 } });
  await page.mouse.down();
  await page.mouse.move(before.x + 280, before.y + 160, { steps: 8 });
  await page.mouse.up();
  const moved = await win.boundingBox();
  expect(moved?.x).toBeGreaterThan(before.x + 150);

  await title.hover({ position: { x: 80, y: 8 } });
  await page.mouse.down();
  await page.mouse.move(0, 300, { steps: 10 });
  await page.mouse.up();
  const viewport = page.viewportSize();
  const snapped = await win.boundingBox();
  expect(snapped?.x).toBe(0);
  expect(Math.abs((snapped?.width ?? 0) - (viewport?.width ?? 0) / 2)).toBeLessThan(4);

  await title.dblclick({ position: { x: 80, y: 8 } });
  const maximized = await win.boundingBox();
  expect(Math.abs((maximized?.width ?? 0) - (viewport?.width ?? 0))).toBeLessThan(4);
  await expect(win.getByRole('button', { name: 'Ripristina' })).toBeVisible();
});

test('windows resize from a corner handle', async ({ page }) => {
  await boot(page, '/?app=about');
  const win = page.getByRole('dialog', { name: 'Chi sono' });
  const before = await win.boundingBox();
  if (!before) throw new Error('no window box');
  await page.mouse.move(before.x + before.width - 2, before.y + before.height - 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width + 120, before.y + before.height + 60, { steps: 6 });
  await page.mouse.up();
  const after = await win.boundingBox();
  expect(after?.width).toBeGreaterThan(before.width + 100);
  expect(after?.height).toBeGreaterThan(before.height + 40);
});

test('desktop icons snap to the grid and keep their place after a reload', async ({ page }) => {
  await boot(page, '/?app=terminal');
  const icon = page.getByRole('option', { name: 'Terminale' });
  const box = await icon.boundingBox();
  if (!box) throw new Error('no icon box');
  await page.mouse.move(box.x + box.width / 2, box.y + 16);
  await page.mouse.down();
  await page.mouse.move(box.x + 500, box.y - 200, { steps: 8 });
  await page.mouse.up();
  const dropped = await icon.boundingBox();
  expect(dropped?.x).toBeGreaterThan(box.x + 300);

  await boot(page, '/?app=terminal');
  const restored = await page.getByRole('option', { name: 'Terminale' }).boundingBox();
  expect(restored?.x).toBe(dropped?.x);
  expect(restored?.y).toBe(dropped?.y);
});

test('Esegui finds a project and the taskbar closes windows back to the desktop', async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.press('Control+k');
  const run = page.getByRole('dialog', { name: 'Esegui' });
  await expect(run).toBeVisible();
  await page.keyboard.type('progetto 4');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: /progetto 4/ })).toBeVisible();
  await expect(page).toHaveURL(/\?progetto=progetto-4$/);

  const project = page.getByRole('dialog', { name: /progetto 4/ });
  await project.getByRole('button', { name: 'Chiudi' }).click();
  await expect(project).toHaveCount(0);
});

test('Start menu works from the keyboard and Spegni can be undone', async ({ page }) => {
  await boot(page);
  const start = page.getByRole('button', { name: 'Avvio' });
  await start.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Menu Avvio' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(start).toBeFocused();

  await start.click();
  await page.getByRole('menuitem', { name: 'Spegni' }).click();
  await expect(page.getByText('Ora puoi chiudere la scheda in sicurezza.')).toBeVisible();
  await page.getByRole('button', { name: 'Riaccendi' }).click();
  await expect(page.getByText('Ora puoi chiudere la scheda in sicurezza.')).toHaveCount(0);
});

test('the desktop context menu opens with the keyboard', async ({ page }) => {
  await boot(page, '/?app=terminal');
  await page.getByRole('option', { name: 'Foto' }).click();
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'Menu del desktop' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Disponi icone' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});
