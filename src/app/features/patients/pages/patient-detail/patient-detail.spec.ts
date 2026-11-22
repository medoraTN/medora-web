import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { Patient } from '../../../../core/models/patient';
import { authInterceptor } from '../../../../core/interceptors/auth-interceptor';
import { PatientDetail } from './patient-detail';

describe('PatientDetail', () => {
  let fixture: ComponentFixture<PatientDetail>;
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

  async function createComponent(role = 'MEDICAL'): Promise<void> {
    localStorage.clear();
    localStorage.setItem('medora.auth.token', 'test-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: 'user-1',
        email: 'staff@example.com',
        firstName: 'Sam',
        lastName: 'Staff',
        role,
      }),
    );
    await TestBed.configureTestingModule({
      imports: [PatientDetail],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: patient.id })) },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PatientDetail);
  }

  afterEach(() => http?.verify());

  it('loads and displays the patient details', async () => {
    await createComponent();
    fixture.detectChanges();
    const request = http.expectOne(`${API_BASE_URL}/patients/patient-1`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ patient });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex Patient');
    expect(fixture.nativeElement.textContent).toContain('D-1001');
    expect(fixture.nativeElement.textContent).toContain('Fever');
    expect(fixture.nativeElement.textContent).toContain('En attente');
  });

  it('updates the status with the selected allowed transition', async () => {
    await createComponent();
    fixture.detectChanges();
    http.expectOne(`${API_BASE_URL}/patients/patient-1`).flush({ patient });
    fixture.detectChanges();

    fixture.componentInstance.selectedStatus.set('IN_PROGRESS');
    fixture.componentInstance.updateStatus();
    const request = http.expectOne(`${API_BASE_URL}/patients/patient-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'IN_PROGRESS' });
    request.flush({ patient: { ...patient, status: 'IN_PROGRESS' } });
    fixture.detectChanges();

    expect(fixture.componentInstance.patient()?.status).toBe('IN_PROGRESS');
    expect(fixture.nativeElement.textContent).toContain('En cours de prise en charge');
  });

  it('does not offer status changes to an administrative staff role', async () => {
    await createComponent('ADMIN_STAFF');
    fixture.detectChanges();
    http.expectOne(`${API_BASE_URL}/patients/patient-1`).flush({ patient });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Votre rôle ne permet pas');
  });

  it('shows a not-found state when the patient ID does not exist', async () => {
    await createComponent();
    fixture.detectChanges();
    http
      .expectOne(`${API_BASE_URL}/patients/patient-1`)
      .flush(
        { error: { code: 'NOT_FOUND', message: 'Patient not found' } },
        { status: 404, statusText: 'Not Found' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dossier introuvable');
  });
});
