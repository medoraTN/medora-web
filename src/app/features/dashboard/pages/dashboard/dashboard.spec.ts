import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATIENT_STATUSES, Patient } from '../../../../core/models/patient';
import { Dashboard as DashboardApi, DashboardSnapshot } from '../../../../core/services/dashboard';
import { Auth } from '../../../../core/services/auth';
import { Dashboard } from './dashboard';

describe('Dashboard page', () => {
  let fixture: ComponentFixture<Dashboard>;
  let component: Dashboard;
  let dashboardApi: { load: ReturnType<typeof vi.fn> };

  const patient: Patient = {
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
  const reservation = {
    id: 'reservation-1',
    patientId: patient.id,
    service: 'Imagerie',
    practitioner: null,
    examination: 'Radiographie',
    scheduledAt: new Date().toISOString(),
    durationMinutes: 30,
    status: 'PENDING' as const,
  };
  const snapshot: DashboardSnapshot = {
    patients: [patient],
    patientCounts: Object.fromEntries(PATIENT_STATUSES.map((status) => [status, 0])) as Record<
      Patient['status'],
      number
    >,
    todaysReservations: [reservation],
    upcomingReservations: [{ ...reservation, id: 'reservation-2', status: 'CONFIRMED' }],
    lastUpdatedAt: '2026-06-01T09:00:00.000Z',
  };
  snapshot.patientCounts.WAITING = 1;

  beforeEach(async () => {
    dashboardApi = { load: vi.fn().mockReturnValue(of(snapshot)) };
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: DashboardApi, useValue: dashboardApi },
        { provide: Auth, useValue: { user: () => ({ firstName: 'Sam' }), logout: vi.fn() } },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and displays every patient status count', () => {
    expect(dashboardApi.load).toHaveBeenCalledTimes(1);
    expect(component.count('WAITING')).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.status-card')).toHaveLength(
      PATIENT_STATUSES.length,
    );
    expect(fixture.nativeElement.textContent).toContain('Patients par statut');
  });

  it('shows today and upcoming reservations and links to the patient record', () => {
    expect(fixture.nativeElement.textContent).toContain('Rendez-vous du jour');
    expect(fixture.nativeElement.textContent).toContain('Prochains rendez-vous');
    expect(fixture.nativeElement.textContent).toContain('Alex Patient');
    expect(fixture.nativeElement.querySelector('a[href="/patients/patient-1"]')).toBeTruthy();
  });

  it('refreshes immediately when requested', () => {
    fixture.nativeElement.querySelector('.refresh-button').click();
    expect(dashboardApi.load).toHaveBeenCalledTimes(2);
  });

  it('refreshes automatically every 30 seconds', async () => {
    fixture.destroy();
    dashboardApi.load.mockClear();
    vi.useFakeTimers();
    try {
      dashboardApi.load.mockReturnValue(of(snapshot));
      fixture = TestBed.createComponent(Dashboard);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(dashboardApi.load).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(dashboardApi.load).toHaveBeenCalledTimes(2);
    } finally {
      fixture.destroy();
      vi.useRealTimers();
    }
  });

  it('shows a loading state while the initial request is pending', () => {
    const response = new Subject<DashboardSnapshot>();
    dashboardApi.load.mockReturnValue(response);
    fixture.destroy();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Chargement',
    );
    response.next(snapshot);
    response.complete();
    fixture.detectChanges();
    expect(component.snapshot()).toEqual(snapshot);
  });

  it('shows an error and a retry action when loading fails', () => {
    dashboardApi.load.mockReturnValue(throwError(() => new Error('offline')));
    fixture.destroy();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('Impossible d’actualiser');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Réessayer');
  });
});
