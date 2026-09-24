import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test } from './fixtures';

async function hreflang(page: Page): Promise<Record<string, string>> {
  const entries = await page
    .locator('link[rel="alternate"][hreflang]')
    .evaluateAll((links) =>
      links.map((l): [string, string] => [
        l.getAttribute('hreflang') ?? '',
        new URL(l.getAttribute('href') ?? '').pathname,
      ]),
    );
  return Object.fromEntries(entries);
}

test('the English home shows name, role, CV and contact, and points to Italian', async ({
  page,
  consoleErrors,
}) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const boot = page.locator('#boot');
  await expect(boot.getByRole('link', { name: 'Download CV' })).toBeVisible();
  await expect(boot.getByRole('link', { name: 'Contact me' })).toBeVisible();
  await expect(boot.getByRole('link', { name: 'Italiano' })).toHaveAttribute('href', '/');
  expect(await hreflang(page)).toEqual({ it: '/', en: '/en', 'x-default': '/' });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/);
  await expectNoSeriousA11yIssues(page);
  expect(consoleErrors).toEqual([]);
});

test('the English classic version has every section and English project links', async ({
  page,
}) => {
  await page.goto('/en/classic');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  for (const name of ['About me', 'Projects', 'Skills', 'Path', 'Photos', 'Contact']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  expect(await hreflang(page)).toEqual({
    it: '/classica',
    en: '/en/classic',
    'x-default': '/classica',
  });
  await page.getByRole('link', { name: /Title of project 1/ }).click();
  await expect(page).toHaveURL(/\/en\/projects\/progetto-1$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Title of project 1');
  await expect(page.getByRole('heading', { level: 2, name: 'Context' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  await page.getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/progetti\/progetto-1$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
});

test('the system speaks English on /en and switching language moves the address', async ({
  page,
}) => {
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
  await page.goto('/en?app=terminal');
  await page.keyboard.press('Shift');
  await expect(page.locator('#boot')).toBeHidden();

  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  const terminal = page.getByRole('dialog', { name: 'Terminal' });
  const input = terminal.getByRole('textbox', { name: /Command/ });
  await input.fill('ls');
  await input.press('Enter');
  await expect(terminal.getByRole('button', { name: 'Readme.txt' })).toBeVisible();
  await expect(terminal.getByRole('button', { name: 'projects/' })).toBeVisible();
  await input.fill('open projects/progetto-2/Readme.md');
  await input.press('Enter');
  const reader = page.getByRole('dialog', { name: /Readme\.md/ });
  await expect(reader.getByRole('heading', { name: 'Context' })).toBeVisible();

  await page.getByRole('button', { name: 'Language: English' }).click();
  await expect(page).toHaveURL(/\/\?app=/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.getByRole('button', { name: 'Avvio' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Leggimi\.md/ })).toBeVisible();

  await page.getByRole('button', { name: 'Lingua: italiano' }).click();
  await expect(page).toHaveURL(/\/en\?app=/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
