import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('token page works in both themes without errors or serious a11y issues', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Token di sistema');

  for (const [label, theme] of [
    ['Giorno', 'light'],
    ['Notte', 'dark'],
  ] as const) {
    await page.getByRole('radio', { name: label }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  }

  expect(errors).toEqual([]);
});
