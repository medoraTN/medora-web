import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('sign in, create, find, edit and update a patient', async ({ page }) => {
  const email = process.env['MEDORA_E2E_EMAIL'];
  const password = process.env['MEDORA_E2E_PASSWORD'];
  if (!email || !password) throw new Error('Set MEDORA_E2E_EMAIL and MEDORA_E2E_PASSWORD for the test environment.');
  const record = `E2E-${randomUUID()}`;

  await page.goto('/patients');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Adresse email').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByRole('link', { name: 'Nouveau patient' }).click();
  await page.getByLabel('Numéro de dossier').fill(record);
  await page.getByLabel('Prénom').fill('Camille');
  await page.getByLabel('Nom', { exact: true }).fill('Exemple');
  await page.getByLabel('Date de naissance').fill('1990-09-15');
  await page.getByLabel('Sexe').fill('F');
  await page.getByLabel('Téléphone').fill('00000000');
  await page.getByLabel('Adresse ou zone de résidence').fill('Zone fictive');
  await page.getByLabel('Motif d’arrivée').fill('Démonstration');
  await page.getByLabel('Priorité').fill('Normale');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Camille Exemple' })).toBeVisible();

  await page.getByRole('link', { name: 'Modifier le dossier' }).click();
  await page.getByLabel('Prénom').fill('Ari');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Ari Exemple' })).toBeVisible();
  await page.getByLabel('Nouveau statut').selectOption({ label: 'En cours de prise en charge' });
  await page.getByRole('button', { name: 'Mettre à jour' }).click();
  await expect(page.getByText('En attente → En cours de prise en charge')).toBeVisible();

  await page.getByRole('link', { name: 'Retour aux patients' }).click();
  await page.getByLabel('Rechercher un patient').fill(record);
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('row', { name: new RegExp(record) })).toContainText('Ari Exemple');
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
