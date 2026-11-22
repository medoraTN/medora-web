import { expect, test } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api';
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

const user = {
  id: 'user-1',
  email: 'staff@medora.test',
  firstName: 'Sam',
  lastName: 'Staff',
  role: 'MEDICAL',
};

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('signs in and opens the protected patient workspace', async ({ page }) => {
  await page.route(`${apiUrl}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api', '');

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
    } else if (path === '/auth/login' && request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ token: 'e2e-token', user }),
      });
    } else if (path === '/auth/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user }),
      });
    } else if (path === '/patients' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          items: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),
      });
    } else {
      await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
    }
  });

  await page.getByLabel('Adresse e-mail').fill(user.email);
  await page.getByLabel('Mot de passe').fill('correct-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL('/patients');
  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('medora.auth.token')))
    .toBe('e2e-token');
});

test('shows a helpful message when the connection fails', async ({ page }) => {
  await page.route(`${apiUrl}/auth/login`, (route) => route.abort());

  await page.getByLabel('Adresse e-mail').fill(user.email);
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
