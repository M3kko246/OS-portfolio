import { expect, expectNoSeriousA11yIssues, test } from './fixtures';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test('home shows name, role, CV and contact without interaction', async ({
      page,
      consoleErrors,
    }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Scarica CV' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Contattami' })).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Vai alla versione classica' })).toBeFocused();
      await expectNoSeriousA11yIssues(page);
      expect(consoleErrors).toEqual([]);
    });

    test('classic version holds every essential section', async ({ page, consoleErrors }) => {
      await page.goto('/classica');
      for (const name of ['Chi sono', 'Progetti', 'Competenze', 'Percorso', 'Foto', 'Contatti']) {
        await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
      }
      await expect(page.locator('#progetti article')).toHaveCount(6);
      await expect(page.getByRole('link', { name: 'Scarica CV' }).first()).toBeVisible();
      await expectNoSeriousA11yIssues(page);
      expect(consoleErrors).toEqual([]);
    });

    test('project page has the case study, structured data and a way back into the OS', async ({
      page,
      consoleErrors,
    }) => {
      await page.goto('/progetti/progetto-3');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('progetto 3');
      await expect(page.getByRole('heading', { level: 2, name: 'Caso studio' })).toBeVisible();
      await expect(page.getByRole('link', { name: /^Apri / }).first()).toHaveAttribute(
        'href',
        '/?progetto=progetto-3',
      );
      const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
      expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({ '@type': 'CreativeWork' });
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        /\/og\/progetti\/progetto-3\.png$/,
      );
      await expectNoSeriousA11yIssues(page);
      expect(consoleErrors).toEqual([]);
    });
  });
}

test('unknown paths show the system error window', async ({ page }) => {
  const response = await page.goto('/non-esiste');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'File non trovato' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Torna al desktop' })).toHaveAttribute('href', '/');
  await expectNoSeriousA11yIssues(page);
});

test('static files for sharing and crawling exist', async ({ request }) => {
  for (const path of [
    '/og/home.png',
    '/og/progetti/progetto-1.png',
    '/favicon.svg',
    '/favicon-32.png',
    '/robots.txt',
    '/sitemap-index.xml',
    '/cv/CV.pdf',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});
