import { expect, test } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('signs in and saves the authenticated session', async ({ page }) => {
  await page.route('http://localhost:3000/api/auth/login', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        token: 'e2e-token',
        user: {
          id: 'user-1',
          email: 'staff@medora.test',
          firstName: 'Sam',
          lastName: 'Staff',
          role: 'MEDICAL',
        },
      }),
    });
  });

  await page.getByLabel('Adresse e-mail').fill('staff@medora.test');
  await page.getByLabel('Mot de passe').fill('correct-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL('/');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('medora.auth.token')))
    .toBe('e2e-token');
});

test('shows a helpful message when the connection fails', async ({ page }) => {
  await page.route('http://localhost:3000/api/auth/login', (route) => route.abort());

  await page.getByLabel('Adresse e-mail').fill('staff@medora.test');
  await page.getByLabel('Mot de passe').fill('incorrect-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Connexion impossible. Vérifiez votre connexion puis réessayez.',
  );
});

test('keeps the login form usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Bon retour parmi nous' })).toBeVisible();
  await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
  await expect(page.locator('.welcome-panel')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
