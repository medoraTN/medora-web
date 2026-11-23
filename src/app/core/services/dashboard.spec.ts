import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { PATIENT_STATUSES, Patient } from '../models/patient';
import { Dashboard } from './dashboard';

describe('Dashboard data service', () => {
  let service: Dashboard;
  let http: HttpTestingController;

  const makePatient = (id: string, status: Patient['status'], urgencyLevel = 3): Patient => ({
    id,
    recordNumber: `D-${id}`,
    firstName: 'Alex',
    lastName: 'Patient',
    dateOfBirth: '1990-05-17T00:00:00.000Z',
    sex: 'UNKNOWN',
    phone: '+33123456789',
    address: null,
    arrivalReason: 'Contrôle',
    urgencyLevel,
    status,
    internalNotes: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Dashboard);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads all patient pages and reservations, counts every status and sorts urgent patients first', () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(`${today}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const futureReservation = {
      id: 'future',
      patientId: 'patient-2',
      service: 'Imagerie',
      practitioner: null,
      examination: null,
      scheduledAt: `${tomorrow.toISOString().slice(0, 10)}T10:00:00.000Z`,
      durationMinutes: 30,
      status: 'CONFIRMED',
    };
    const cancelledFuture = { ...futureReservation, id: 'cancelled', status: 'CANCELLED' as const };
    let result:
      | {
          patients: Patient[];
          patientCounts: Record<Patient['status'], number>;
          todaysReservations: { id: string }[];
          upcomingReservations: { id: string }[];
          lastUpdatedAt: string;
        }
      | undefined;

    service.load().subscribe((snapshot) => (result = snapshot));
    const firstPage = http.expectOne(`${API_BASE_URL}/patients?page=1&pageSize=100`);
    const reservations = http.expectOne(`${API_BASE_URL}/reservations`);
    firstPage.flush({
      items: [makePatient('1', 'WAITING', 3)],
      pagination: { page: 1, pageSize: 100, total: 101, totalPages: 2 },
    });
    reservations.flush({
      items: [
        {
          ...futureReservation,
          id: 'today',
          scheduledAt: `${today}T09:00:00.000Z`,
          status: 'PENDING',
        },
        futureReservation,
        cancelledFuture,
      ],
    });

    const secondPage = http.expectOne(`${API_BASE_URL}/patients?page=2&pageSize=100`);
    secondPage.flush({
      items: [makePatient('2', 'IN_PROGRESS', 1)],
      pagination: { page: 2, pageSize: 100, total: 101, totalPages: 2 },
    });

    expect(result?.patients.map((patient) => patient.id)).toEqual(['2', '1']);
    expect(result?.patientCounts.WAITING).toBe(1);
    expect(result?.patientCounts.IN_PROGRESS).toBe(1);
    expect(Object.keys(result?.patientCounts ?? {})).toHaveLength(PATIENT_STATUSES.length);
    expect(result?.todaysReservations.map((reservation) => reservation.id)).toEqual(['today']);
    expect(result?.upcomingReservations.map((reservation) => reservation.id)).toEqual(['future']);
    expect(result?.lastUpdatedAt).toBeTruthy();
  });
});
