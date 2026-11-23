import { expect, test } from '@playwright/test';

const apiUrl = 'http://localhost:3000/api';
const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

const staff = {
  id: 'user-1',
  email: 'medical@medora.test',
  firstName: 'Sam',
  lastName: 'Staff',
  role: 'MEDICAL',
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

test.beforeEach(async ({ page }) => {
  let currentPatient = { ...patient };

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
        body: JSON.stringify({ token: 'patient-e2e-token', user: staff }),
      });
      return;
    }

    if (path === '/auth/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ user: staff }),
      });
      return;
    }

    if (path === '/patients' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          items: [currentPatient],
          pagination: {
            page: Number(url.searchParams.get('page') ?? 1),
            pageSize: 20,
            total: 1,
            totalPages: 1,
          },
        }),
      });
      return;
    }

    if (path === `/patients/${patient.id}` && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ patient: currentPatient }),
      });
      return;
    }

    if (path === `/patients/${patient.id}/status` && request.method() === 'PATCH') {
      currentPatient = { ...currentPatient, status: request.postDataJSON().status };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ patient: currentPatient }),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders, body: 'Not found' });
  });

  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(staff.email);
  await page.getByLabel('Mot de passe').fill('correct-password');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/patients');
  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
});

test('searches the patient list by identifier', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.getByLabel('Rechercher un patient').fill('patient-1');
  await page.getByRole('button', { name: 'Rechercher' }).click();

  await expect(page.getByText('Alex Patient')).toBeVisible();
  expect(
    requests.some((request) => new URL(request).searchParams.get('search') === 'patient-1'),
  ).toBe(true);
});

test('opens a patient, updates an allowed status, and shows the new status', async ({ page }) => {
  await page.getByText('Alex Patient').click();
  await expect(page).toHaveURL('/patients/patient-1');
  await expect(page.getByRole('heading', { name: 'Alex Patient' })).toBeVisible();
  await page.getByLabel('Mettre à jour le statut').selectOption('IN_PROGRESS');
  await page.getByRole('button', { name: 'Enregistrer le statut' }).click();

  await expect(page.getByText('En cours de prise en charge').first()).toBeVisible();
});
