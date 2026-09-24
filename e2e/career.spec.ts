import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test } from './fixtures';

async function boot(page: Page, path: string) {
  await page.goto(path);
  await page.keyboard.press('Shift');
  await expect(page.locator('#boot')).toBeHidden();
}

test.describe('Carriera', () => {
  // Reduced motion: the Map teleports instead of walking, so the test does not wait on a walk.
  test.use({ reducedMotion: 'reduce' });

  test('mounts the world and the Map takes the player to an island', async ({
    page,
    consoleErrors,
  }) => {
    await boot(page, '/?app=career');
    const game = page.getByRole('application', { name: /Mondo di Carriera/ });
    await expect(game.locator('canvas')).toBeVisible({ timeout: 20_000 });
    await expect(game.getByText(/Isole visitate \d\/6/)).toBeVisible();

    await game.getByRole('button', { name: 'Mappa' }).click();
    const map = game.getByRole('region', { name: 'Mappa delle isole' });
    await map.getByRole('button', { name: /progetto 4/ }).click();
    await expect(game.getByText(/Premi E per aprire Titolo del progetto 4/)).toBeVisible();

    await game.getByRole('button', { name: 'Mappa' }).click();
    await expect(
      game
        .getByRole('region', { name: 'Mappa delle isole' })
        .getByRole('button', { name: /progetto 4.*Sei qui/ }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    // E opens the project sheet, whose actions open system windows.
    await game.focus();
    await page.keyboard.press('KeyE');
    const sheet = game.getByRole('region', { name: /progetto 4/ });
    await expect(sheet.getByRole('button', { name: 'Leggi il caso studio' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Leggi il caso studio' }).click();
    await expect(
      page.getByRole('dialog', { name: /Leggimi\.md, Titolo del progetto 4/ }),
    ).toBeVisible();
    await expectNoSeriousA11yIssues(page);
    expect(consoleErrors).toEqual([]);
  });

  test('"Visita l\'isola" opens the game on that island', async ({ page }) => {
    await boot(page, '/?app=career&isola=progetto-6');
    const game = page.getByRole('application', { name: /Mondo di Carriera/ });
    await expect(game.getByText(/Premi E per aprire Titolo del progetto 6/)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('five openings and closings do not leak memory', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const heap = async () => {
      await cdp.send('HeapProfiler.collectGarbage');
      const { usedSize } = await cdp.send('Runtime.getHeapUsage');
      return usedSize;
    };
    await boot(page, '/?app=terminal');
    let baseline = 0;
    for (let round = 0; round < 5; round++) {
      await page.getByRole('option', { name: 'Carriera' }).dblclick();
      const game = page.getByRole('application', { name: /Mondo di Carriera/ });
      await expect(game.locator('canvas')).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(500);
      await game.getByRole('button', { name: 'Esci', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Carriera' })).toHaveCount(0);
      if (round === 0) baseline = await heap();
    }
    const growth = (await heap()) - baseline;
    expect(growth, `heap grew by ${Math.round(growth / 1024)} KB`).toBeLessThan(6 * 1024 * 1024);
  });

  test('without WebGL it points to the Projects folder', async ({ page }) => {
    await page.addInitScript(() => {
      const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')
        ?.value as (this: HTMLCanvasElement, ...args: unknown[]) => RenderingContext | null;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl2' || type === 'webgl') return null;
        return original.call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await boot(page, '/?app=career');
    const window = page.getByRole('dialog', { name: 'Carriera' });
    await expect(window.getByText(/non riesce a mostrare la grafica 3D/)).toBeVisible();
    await window.getByRole('button', { name: 'Apri Progetti' }).click();
    await expect(page.getByRole('dialog', { name: 'Progetti' })).toBeVisible();
  });
});
