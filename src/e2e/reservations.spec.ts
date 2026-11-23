import { expect, test } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api';
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

const staff = {
  id: 'staff-1',
  email: 'staff@medora.test',
  firstName: 'Sam',
  lastName: 'Staff',
  role: 'ADMIN_STAFF',
};

const patient = {
  id: 'patient-1',
  recordNumber: 'D-1001',
  firstName: 'Alex',
  lastName: 'Patient',
  dateOfBirth: '1990-05-17T00:00:00.000Z',
  sex: 'UNKNOWN',
  phone: '+33123456789',
  address: null,
  arrivalReason: 'Fièvre',
  urgencyLevel: 2,
  status: 'WAITING',
  internalNotes: null,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

function futureLocalDate(daysAhead = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test.beforeEach(async ({ page }) => {
  let reservations: Array<Record<string, unknown>> = [
    {
      id: 'reservation-1',
      patientId: patient.id,
      service: 'Imagerie',
      practitioner: 'Dr Exemple',
      examination: 'Radiographie',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 30,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await page.route(`${apiUrl}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const respond = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (path === '/auth/login' && request.method() === 'POST') {
      await respond({ token: 'reservation-e2e-token', user: staff });
      return;
    }
    if (path === '/auth/me' && request.method() === 'GET') {
      await respond({ user: staff });
      return;
    }
    if (path === '/patients' && request.method() === 'GET') {
      await respond({
        items: [patient],
        pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
      });
      return;
    }
    if (path === '/reservations' && request.method() === 'GET') {
      await respond({ items: reservations });
      return;
    }
    if (path === '/reservations' && request.method() === 'POST') {
      const created = {
        id: 'reservation-created',
        ...request.postDataJSON(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reservations = [created, ...reservations];
      await respond({ reservation: created }, 201);
      return;
    }
    if (path.startsWith('/reservations/') && request.method() === 'PATCH') {
      const id = path.split('/').at(-1);
      reservations = reservations.map((item) =>
        item.id === id
          ? { ...item, ...request.postDataJSON(), updatedAt: new Date().toISOString() }
          : item,
      );
      await respond({ reservation: reservations.find((item) => item.id === id) });
      return;
    }
    if (path.startsWith('/reservations/') && request.method() === 'DELETE') {
      const id = path.split('/').at(-1);
      reservations = reservations.map((item) =>
        item.id === id
          ? { ...item, status: 'CANCELLED', updatedAt: new Date().toISOString() }
          : item,
      );
      await respond({ reservation: reservations.find((item) => item.id === id) });
      return;
    }
    await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
  });

  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(staff.email);
  await page.getByLabel('Mot de passe').fill('correct-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/patients');
});

test('creates a reservation for a selected patient', async ({ page }) => {
  await page.goto('/reservations/new');
  await expect(page.getByRole('heading', { name: 'Nouvelle réservation' })).toBeVisible();
  await page.locator('#patient').selectOption(patient.id);
  await page.getByLabel(/Type de prestation/).fill('Consultation');
  await page.getByLabel('Examen Facultatif').fill('Contrôle');
  await page.getByLabel('Praticien Facultatif').fill('Dr Exemple');
  await page.locator('#date').fill(futureLocalDate());
  await page.locator('#time').fill('11:30');
  await page.locator('#duration').fill('45');

  const createRequest = page.waitForRequest(
    (request) => request.url() === `${apiUrl}/reservations` && request.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Créer la réservation' }).click();
  const request = await createRequest;
  expect(request.postDataJSON()).toMatchObject({
    patientId: patient.id,
    service: 'Consultation',
    practitioner: 'Dr Exemple',
    examination: 'Contrôle',
    durationMinutes: 45,
  });
  await expect(page).toHaveURL('/reservations');
});

test('edits a reservation', async ({ page }) => {
  await page.goto('/reservations');
  await expect(page.getByText('Imagerie')).toBeVisible();
  await page.getByRole('link', { name: 'Modifier' }).click();
  await expect(page.getByRole('heading', { name: 'Modifier la réservation' })).toBeVisible();
  await page.locator('#service').fill('Consultation spécialisée');
  const updateRequest = page.waitForRequest(
    (request) =>
      request.url() === `${apiUrl}/reservations/reservation-1` && request.method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
  expect((await updateRequest).postDataJSON()).toMatchObject({
    service: 'Consultation spécialisée',
  });
  await expect(page).toHaveURL('/reservations');
});

test('asks for confirmation before cancelling a reservation', async ({ page }) => {
  await page.goto('/reservations');
  await expect(page.getByText('Imagerie')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  const cancelRequest = page.waitForRequest(
    (request) =>
      request.url() === `${apiUrl}/reservations/reservation-1` && request.method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Annuler' }).click();
  await cancelRequest;
  await expect(page.locator('.status-badge').getByText('Annulée')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Annuler' })).toHaveCount(0);
});
