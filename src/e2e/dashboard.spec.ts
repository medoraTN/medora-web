import { expect, test } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api';
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

const staff = {
  id: 'supervisor-1',
  email: 'supervisor@medora.test',
  firstName: 'Sam',
  lastName: 'Supervisor',
  role: 'SUPERVISOR',
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
  urgencyLevel: 1,
  status: 'WAITING',
  internalNotes: null,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(`${today}T00:00:00.000Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

test.beforeEach(async ({ page }) => {
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
    } else if (path === '/auth/login' && request.method() === 'POST') {
      await respond({ token: 'dashboard-e2e-token', user: staff });
    } else if (path === '/auth/me' && request.method() === 'GET') {
      await respond({ user: staff });
    } else if (path === '/patients' && request.method() === 'GET') {
      await respond({
        items: [patient],
        pagination: {
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      });
    } else if (path === `/patients/${patient.id}` && request.method() === 'GET') {
      await respond({ patient });
    } else if (path === '/reservations' && request.method() === 'GET') {
      await respond({
        items: [
          {
            id: 'reservation-today',
            patientId: patient.id,
            service: 'Consultation',
            practitioner: 'Dr Exemple',
            examination: null,
            scheduledAt: `${today}T12:00:00.000Z`,
            durationMinutes: 30,
            status: 'PENDING',
          },
          {
            id: 'reservation-upcoming',
            patientId: patient.id,
            service: 'Imagerie',
            practitioner: null,
            examination: 'Radiographie',
            scheduledAt: `${tomorrow.toISOString().slice(0, 10)}T09:00:00.000Z`,
            durationMinutes: 30,
            status: 'CONFIRMED',
          },
        ],
      });
    } else {
      await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
    }
  });

  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(staff.email);
  await page.getByLabel('Mot de passe').fill('correct-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/patients');
});

test('shows patient counts, reservations, and a quick link to the patient record', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Tableau de bord' }).click();

  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  await expect(page.locator('.status-waiting .status-count')).toHaveText('1');
  await expect(page.getByText('Rendez-vous du jour')).toBeVisible();
  await expect(page.getByText('Prochains rendez-vous')).toBeVisible();
  await expect(page.getByText('Consultation')).toBeVisible();
  await expect(page.getByText('Imagerie')).toBeVisible();

  await page.getByRole('link', { name: 'Ouvrir le dossier de Alex Patient' }).click();
  await expect(page).toHaveURL('/patients/patient-1');
  await expect(page.getByRole('heading', { name: 'Alex Patient' })).toBeVisible();
});

test('allows a manual refresh of dashboard data', async ({ page }) => {
  let dashboardPatientRequests = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === '/api/patients' &&
      url.searchParams.get('pageSize') === '100' &&
      request.method() === 'GET'
    ) {
      dashboardPatientRequests += 1;
    }
  });
  await page.goto('/dashboard');
  await expect(page.locator('.status-waiting .status-count')).toHaveText('1');
  const beforeRefresh = dashboardPatientRequests;
  const refreshRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/patients' && url.searchParams.get('pageSize') === '100';
  });
  await page.getByRole('button', { name: 'Actualiser' }).click();
  await refreshRequest;
  expect(dashboardPatientRequests).toBe(beforeRefresh + 1);
});
