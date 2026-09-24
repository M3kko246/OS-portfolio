import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

/** Fails the test on any console error or uncaught exception, CSP violations included. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
    expect(errors, 'console errors').toEqual([]);
  },
});

export { expect };

/** Runs axe and fails on critical or serious violations. */
export async function expectNoSeriousA11yIssues(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

/**
 * Skips the boot screen. The OS hydrates after the page load event, so a key pressed too early
 * lands before its listener exists: press again until the boot screen is gone.
 */
export async function skipBoot(page: Page, { tap = false }: { tap?: boolean } = {}): Promise<void> {
  const boot = page.locator('#boot');
  await expect(async () => {
    if (await boot.isHidden()) return;
    if (tap) await boot.tap();
    else await page.keyboard.press('Shift');
    await expect(boot).toBeHidden({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
}
