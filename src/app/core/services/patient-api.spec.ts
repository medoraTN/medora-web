import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { Patient } from '../models/patient';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { PatientApi } from './patient-api';

describe('PatientApi', () => {
  let service: PatientApi;
  let http: HttpTestingController;

  const patient: Patient = {
    id: 'patient-1',
    recordNumber: 'D-1001',
    firstName: 'Alex',
    lastName: 'Patient',
    dateOfBirth: '1990-05-17T00:00:00.000Z',
    sex: 'UNKNOWN',
    phone: '+33123456789',
    address: null,
    arrivalReason: 'Fever',
    urgencyLevel: 2,
    status: 'WAITING',
    internalNotes: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('medora.auth.token', 'test-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: 'user-1',
        email: 'doctor@example.com',
        firstName: 'Alex',
        lastName: 'Doctor',
        role: 'MEDICAL',
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PatientApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the documented page, search, and status query parameters', () => {
    let result: Patient[] | undefined;
    service
      .list({ page: 2, pageSize: 20, search: '  D-1001  ', status: 'WAITING' })
      .subscribe((response) => (result = response.items));

    const request = http.expectOne(
      `${API_BASE_URL}/patients?page=2&pageSize=20&search=D-1001&status=WAITING`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({
      items: [patient],
      pagination: { page: 2, pageSize: 20, total: 21, totalPages: 2 },
    });

    expect(result).toEqual([patient]);
  });

  it('loads a patient by encoded ID', () => {
    let result: Patient | undefined;
    service.getById('patient/with space').subscribe((response) => (result = response.patient));

    const request = http.expectOne(`${API_BASE_URL}/patients/patient%2Fwith%20space`);
    expect(request.request.method).toBe('GET');
    request.flush({ patient });

    expect(result).toEqual(patient);
  });

  it('updates status using the exact status-only payload', () => {
    let result: Patient | undefined;
    service.updateStatus('patient-1', 'IN_PROGRESS').subscribe((response) => {
      result = response.patient;
    });

    const request = http.expectOne(`${API_BASE_URL}/patients/patient-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'IN_PROGRESS' });
    request.flush({ patient: { ...patient, status: 'IN_PROGRESS' } });

    expect(result?.status).toBe('IN_PROGRESS');
  });
});
