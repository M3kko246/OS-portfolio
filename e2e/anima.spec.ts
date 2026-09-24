import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test, skipBoot } from './fixtures';

/** Local time is fixed, so time-of-day wallpapers and the night achievement are predictable. */
async function boot(page: Page, path: string, hour = 12) {
  await page.clock.setFixedTime(new Date(2026, 8, 24, hour, 0));
  await page.goto(path);
  await skipBoot(page);
}

test('the Terminale runs commands, completes with Tab and unlocks Curioso once', async ({
  page,
  consoleErrors,
}) => {
  await boot(page, '/?app=terminal');
  const terminal = page.getByRole('dialog', { name: 'Terminale' });
  const input = terminal.getByRole('textbox', { name: /Comando/ });
  const output = terminal.getByRole('log');

  await input.fill('hel');
  await input.press('Tab');
  await expect(input).toHaveValue('help ');
  await input.press('Enter');
  await expect(output).toContainText('Comandi disponibili:');
  await expect(page.getByRole('status').filter({ hasText: 'Traguardo: Curioso' })).toBeVisible();

  await input.fill('ls');
  await input.press('Enter');
  await output.getByRole('button', { name: 'progetti/' }).click();
  await expect(output.getByRole('button', { name: 'progetto-1/' })).toBeVisible();

  await input.fill('cd progetti');
  await input.press('Enter');
  await expect(terminal.getByRole('textbox', { name: /~\/progetti/ })).toBeVisible();
  await input.press('ArrowUp');
  await expect(input).toHaveValue('cd progetti');

  await input.fill('pippo');
  await input.press('Enter');
  await expect(output).toContainText('pippo: comando sconosciuto');
  await expectNoSeriousA11yIssues(page);

  // The achievement survives a reload and is not announced again.
  await page.reload();
  await skipBoot(page);
  await page.goto('/?app=settings');
  await skipBoot(page);
  const settings = page.getByRole('dialog', { name: 'Impostazioni' });
  await expect(settings.getByRole('heading', { name: 'Traguardi 1/5' })).toBeVisible();
  await expect(settings.getByRole('radio', { name: /Ambra/ })).toBeEnabled();
  await expect(settings.getByRole('radio', { name: /Carta/ })).toBeDisabled();
  await expect(page.getByText('Traguardo: Curioso')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('the Cestino shows its drafts and politely refuses to be emptied', async ({ page }) => {
  await boot(page, '/?app=trash');
  const trash = page.getByRole('dialog', { name: 'Cestino' });
  await expect(page.getByRole('status').filter({ hasText: 'Archeologo' })).toBeVisible();
  await trash.getByRole('button', { name: 'idee_scartate.txt' }).click();
  await expect(trash.locator('pre')).toContainText('Ombre morbide');

  await trash.getByRole('button', { name: 'Svuota cestino' }).click();
  const refusal = page.getByRole('dialog', { name: 'Svuota cestino' });
  await expect(refusal).toContainText('preferisce di no');
  await refusal.getByRole('button', { name: 'Va bene' }).click();
  await expect(refusal).toBeHidden();
  await expect(trash.getByRole('button', { name: /logo_v1_definitivo/ })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});

test('the wallpaper follows the time of day and lights the visited islands at night', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'os:session',
      JSON.stringify({
        state: {
          achievements: [],
          visitedIslands: ['progetto-1', 'progetto-3'],
          iconPositions: {},
          showWelcome: false,
          visits: 0,
        },
        version: 1,
      }),
    );
  });
  await boot(page, '/', 12);
  const wallpaper = page.locator('.wallpaper-canvas');
  await expect(wallpaper).toHaveAttribute('data-wallpaper', 'day');
  await expect(wallpaper).toHaveAttribute('data-lights', '0');

  await boot(page, '/', 22);
  await expect(wallpaper).toHaveAttribute('data-wallpaper', 'night');
  await expect(wallpaper).toHaveAttribute('data-lights', '2');
  await expect(page.getByRole('status').filter({ hasText: 'Nottambulo' })).toBeVisible();
});

test('Spegni leaves only the way back, Riaccendi restores the desktop', async ({
  page,
  consoleErrors,
}) => {
  await boot(page, '/');
  // Sounds on: ZzFX loads on the first sound, after a gesture, without errors.
  await page.getByRole('button', { name: 'Suoni spenti' }).click();
  await expect(page.getByRole('button', { name: 'Suoni attivi' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Avvio' }).click();
  await page.getByRole('menuitem', { name: 'Spegni' }).click();
  await expect(page.getByText('Ora puoi chiudere la scheda in sicurezza.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Riaccendi' })).toBeFocused();
  // The session behind is inert: nothing there can take focus.
  await expect(page.locator('.os-session')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Avvio' }).focus();
  await expect(page.getByRole('button', { name: 'Riaccendi' })).toBeFocused();

  await page.getByRole('button', { name: 'Riaccendi' }).click();
  await expect(page.getByRole('button', { name: 'Avvio' })).toBeFocused();
  expect(consoleErrors).toEqual([]);
});
