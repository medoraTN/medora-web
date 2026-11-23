import { expect, test } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api';
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

const admin = {
  id: 'user-1',
  email: 'admin@medora.test',
  firstName: 'Ada',
  lastName: 'Admin',
  role: 'ADMIN',
  isActive: true,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

const nurse = {
  id: 'user-2',
  email: 'nurse@medora.test',
  firstName: 'Nora',
  lastName: 'Nurse',
  role: 'MEDICAL',
  isActive: true,
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
};

test('lets an admin list, filter and create users', async ({ page }) => {
  let users = [admin, nurse];

  await page.route(`${apiUrl}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (path === '/auth/login' && request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          token: 'users-e2e-token',
          user: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
          },
        }),
      });
      return;
    }

    if (path === '/auth/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          user: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
          },
        }),
      });
      return;
    }

    if (path === '/users' && request.method() === 'GET') {
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const role = url.searchParams.get('role');
      const isActive = url.searchParams.get('isActive');
      const items = users.filter((item) => {
        const matchesSearch =
          !search ||
          item.email.includes(search) ||
          item.firstName.toLowerCase().includes(search) ||
          item.lastName.toLowerCase().includes(search);
        const matchesRole = !role || item.role === role;
        const matchesStatus =
          isActive === null ||
          isActive === '' ||
          String(item.isActive) === isActive;
        return matchesSearch && matchesRole && matchesStatus;
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          pagination: {
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: 20,
            total: items.length,
            totalPages: 1,
          },
        }),
      });
      return;
    }

    if (path === '/users' && request.method() === 'POST') {
      const body = request.postDataJSON() as {
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        password: string;
      };
      if (users.some((item) => item.email === body.email)) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            error: {
              code: 'CONFLICT',
              message: 'Un utilisateur existe déjà avec cette adresse e-mail.',
            },
          }),
        });
        return;
      }
      const created = {
        id: `user-${users.length + 1}`,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        isActive: true,
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      };
      users = [...users, created];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user: created }),
      });
      return;
    }

    if (path.startsWith('/users/') && path.endsWith('/status') && request.method() === 'PATCH') {
      const id = path.split('/')[2];
      const isActive = Boolean(request.postDataJSON().isActive);
      users = users.map((item) => (item.id === id ? { ...item, isActive } : item));
      const updated = users.find((item) => item.id === id)!;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user: updated }),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
  });

  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(admin.email);
  await page.getByLabel('Mot de passe').fill('AdminPass1');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.goto('/users');
  await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible();
  await expect(page.getByText('Nora Nurse')).toBeVisible();

  await page.getByPlaceholder('Nom ou adresse e-mail').fill('nora');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.getByText('Nora Nurse')).toBeVisible();
  await expect(page.getByText('Ada Admin')).toHaveCount(0);

  await page.getByRole('button', { name: 'Effacer' }).first().click();
  await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
  await page.getByLabel('Prénom').fill('Sam');
  await page.getByLabel('Nom', { exact: true }).fill('Staff');
  await page.getByLabel('E-mail').fill('sam@medora.test');
  await page.getByLabel('Mot de passe initial (min. 8 caractères)').fill('SecretPass1');
  await page.getByRole('button', { name: 'Créer le compte' }).click();

  await expect(page.getByText('Utilisateur créé.')).toBeVisible();
  await expect(page.getByText('Sam Staff')).toBeVisible();
});

test('blocks non-admin users from the users page', async ({ page }) => {
  const medical = {
    id: 'user-3',
    email: 'medical@medora.test',
    firstName: 'Mia',
    lastName: 'Medical',
    role: 'MEDICAL',
  };

  await page.route(`${apiUrl}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api', '');

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (path === '/auth/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user: medical }),
      });
      return;
    }

    if (path === '/patients' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          items: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
  });

  await page.addInitScript(() => {
    localStorage.setItem('medora.auth.token', 'medical-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: 'user-3',
        email: 'medical@medora.test',
        firstName: 'Mia',
        lastName: 'Medical',
        role: 'MEDICAL',
      }),
    );
  });

  await page.goto('/users');
  await expect(page).toHaveURL(/\/patients/);
  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
});
