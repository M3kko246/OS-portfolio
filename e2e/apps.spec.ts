import type { Page } from '@playwright/test';
import { expect, expectNoSeriousA11yIssues, test } from './fixtures';

async function boot(page: Page, path = '/') {
  await page.goto(path);
  await page.keyboard.press('Shift');
  await expect(page.locator('#boot')).toBeHidden();
}

test('Progetti opens a project card, and the card opens its case study', async ({
  page,
  consoleErrors,
}) => {
  await boot(page, '/?app=explorer');
  const explorer = page.getByRole('dialog', { name: 'Progetti' });
  const items = explorer.getByRole('listbox');
  await expect(items.getByRole('option')).toHaveCount(6);
  await items.getByRole('option', { name: /progetto 5/ }).dblclick();

  const card = page.getByRole('dialog', { name: /progetto 5/ });
  await expect(card.getByRole('heading', { level: 3 })).toContainText('progetto 5');
  await card.getByRole('button', { name: 'Leggi il caso studio' }).click();

  const reader = page.getByRole('dialog', { name: /Leggimi\.md/ });
  await expect(reader.getByRole('heading', { name: 'Contesto' })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  expect(consoleErrors).toEqual([]);
});

test('Foto browses an album and steps through photos from the keyboard', async ({ page }) => {
  await boot(page, '/?app=photos');
  const photos = page.getByRole('dialog', { name: 'Foto' });
  await photos.getByRole('button', { name: /Album segnaposto/ }).click();
  await photos.getByRole('button', { name: /mulino/ }).click();
  await expect(photos.getByText('2 di 3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(photos.getByText('3 di 3')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(photos.getByRole('button', { name: 'Tutti gli album' })).toBeVisible();
});

test('Chi sono switches tabs with the arrow keys', async ({ page }) => {
  await boot(page, '/?app=about');
  const about = page.getByRole('dialog', { name: 'Chi sono' });
  await about.getByRole('tab', { name: 'Generale' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(about.getByRole('tab', { name: 'Competenze' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(about.getByRole('tabpanel')).toContainText('Area di competenza');
  await page.keyboard.press('ArrowRight');
  await expect(about.getByRole('tabpanel')).toContainText('Formazione');
});

test.describe('Contatti', () => {
  test('explains empty fields next to each one', async ({ page }) => {
    await boot(page, '/?app=mail');
    const mail = page.getByRole('dialog', { name: 'Contatti' });
    await mail.getByRole('button', { name: 'Invia' }).click();
    await expect(mail.getByText('Scrivi il tuo nome.')).toBeVisible();
    await expect(mail.getByText('Scrivi la tua email.')).toBeVisible();
    await expect(mail.getByText('Scrivi il messaggio.')).toBeVisible();
    await expect(mail.getByLabel('Nome')).toBeFocused();
  });

  test('confirms a sent message', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ json: { ok: true } }));
    await boot(page, '/?app=mail');
    const mail = page.getByRole('dialog', { name: 'Contatti' });
    await mail.getByLabel('Nome').fill('Ada');
    await mail.getByLabel('Email', { exact: true }).fill('ada@example.org');
    await mail.getByLabel('Messaggio').fill('Vorrei parlare di un progetto.');
    await mail.getByRole('button', { name: 'Invia' }).click();
    await expect(mail.getByRole('heading', { name: 'Messaggio inviato' })).toBeVisible();
  });

  test('offers an alternative when sending fails', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({ status: 503, json: { ok: false, reason: 'unavailable' } }),
    );
    await boot(page, '/?app=mail');
    const mail = page.getByRole('dialog', { name: 'Contatti' });
    await mail.getByLabel('Nome').fill('Ada');
    await mail.getByLabel('Email', { exact: true }).fill('ada@example.org');
    await mail.getByLabel('Messaggio').fill('Vorrei parlare di un progetto.');
    await mail.getByRole('button', { name: 'Invia' }).click();
    const alert = mail.getByRole('alert');
    await expect(alert).toContainText("L'invio dal sito non è ancora attivo.");
    await expect(alert.getByRole('link', { name: 'Apri il programma di posta' })).toHaveAttribute(
      'href',
      /^mailto:/,
    );
  });

  test('the real endpoint validates and refuses without configuration', async ({ request }) => {
    const invalid = await request.post('/api/contact', {
      data: { name: '', email: 'x', message: '', website: '', elapsed: 9000 },
    });
    expect(invalid.status()).toBe(422);
    const valid = await request.post('/api/contact', {
      data: {
        name: 'Ada',
        email: 'ada@example.org',
        message: 'Messaggio di prova',
        website: '',
        elapsed: 9000,
      },
    });
    expect([503, 200]).toContain(valid.status());
  });
});

test('Impostazioni switch the theme and remember it', async ({ page }) => {
  await boot(page, '/?app=settings');
  const settings = page.getByRole('dialog', { name: 'Impostazioni' });
  await settings.getByRole('radio', { name: 'Notte', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoSeriousA11yIssues(page);
  await boot(page, '/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('CV shows the PDF with a download button', async ({ page }) => {
  await boot(page, '/?app=cv');
  const cv = page.getByRole('dialog', { name: 'CV.pdf' });
  await expect(cv.getByRole('link', { name: 'Scarica CV' })).toHaveAttribute('href', '/cv/CV.pdf');
  await expect(cv.locator('iframe[title="CV in PDF"]')).toBeAttached();
});
