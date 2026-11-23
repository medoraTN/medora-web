import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { Patient } from '../../../../core/models/patient';
import { authInterceptor } from '../../../../core/interceptors/auth-interceptor';
import { PatientList } from './patient-list';

describe('PatientList', () => {
  let fixture: ComponentFixture<PatientList>;
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

  beforeEach(async () => {
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
    await TestBed.configureTestingModule({
      imports: [PatientList],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientList);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and renders patient records from the paginated response', () => {
    fixture.detectChanges();
    const request = http.expectOne(`${API_BASE_URL}/patients?page=1&pageSize=20`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({
      items: [patient],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex Patient');
    expect(fixture.nativeElement.textContent).toContain('D-1001');
    expect(fixture.nativeElement.textContent).toContain('En attente');
  });

  it('applies the search text and status filter from page one', () => {
    fixture.detectChanges();
    http.expectOne(`${API_BASE_URL}/patients?page=1&pageSize=20`).flush({
      items: [patient],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    fixture.componentInstance.searchTerm = ' D-1001 ';
    fixture.componentInstance.selectedStatus = 'WAITING';

    fixture.componentInstance.applyFilters();

    const request = http.expectOne(
      `${API_BASE_URL}/patients?page=1&pageSize=20&search=D-1001&status=WAITING`,
    );
    request.flush({
      items: [patient],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.pagination().total).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Alex Patient');
  });

  it('shows a helpful empty state when no records match', () => {
    fixture.detectChanges();
    http.expectOne(`${API_BASE_URL}/patients?page=1&pageSize=20`).flush({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun patient trouvé');
  });
});
