import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { Reservation } from '../models/reservation';
import { ReservationApi } from './reservation-api';

describe('ReservationApi', () => {
  let service: ReservationApi;
  let http: HttpTestingController;
  const reservation: Reservation = {
    id: 'reservation-1',
    patientId: 'patient-1',
    service: 'Imagerie',
    practitioner: null,
    examination: 'Radiographie',
    scheduledAt: '2030-06-01T09:00:00.000Z',
    durationMinutes: 30,
    status: 'PENDING',
    createdAt: '2030-01-01T10:00:00.000Z',
    updatedAt: '2030-01-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists reservations with the supported date and status filters', () => {
    let result: Reservation[] | undefined;
    service.list({ date: '2030-06-01', status: 'PENDING' }).subscribe(({ items }) => {
      result = items;
    });

    const request = http.expectOne(`${API_BASE_URL}/reservations?date=2030-06-01&status=PENDING`);
    expect(request.request.method).toBe('GET');
    request.flush({ items: [reservation] });
    expect(result).toEqual([reservation]);
  });

  it('creates a reservation with the contract payload', () => {
    const payload = {
      patientId: 'patient-1',
      service: 'Imagerie',
      practitioner: null,
      examination: 'Radiographie',
      scheduledAt: reservation.scheduledAt,
      durationMinutes: 30,
    };
    service.create(payload).subscribe();

    const request = http.expectOne(`${API_BASE_URL}/reservations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ reservation });
  });

  it('updates a reservation by encoded ID', () => {
    service.update('reservation/1', { service: 'Consultation' }).subscribe();

    const request = http.expectOne(`${API_BASE_URL}/reservations/reservation%2F1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ service: 'Consultation' });
    request.flush({ reservation });
  });

  it('soft-cancels a reservation through DELETE', () => {
    service.cancel('reservation-1').subscribe();

    const request = http.expectOne(`${API_BASE_URL}/reservations/reservation-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ reservation: { ...reservation, status: 'CANCELLED' } });
  });
});
