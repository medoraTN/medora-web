import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientApi } from '../../../../core/services/patient-api';
import { ReservationApi } from '../../../../core/services/reservation-api';
import { Auth } from '../../../../core/services/auth';
import { ReservationForm } from './reservation-form';

describe('ReservationForm', () => {
  let fixture: ComponentFixture<ReservationForm>;
  let component: ReservationForm;
  let patientApi: { list: ReturnType<typeof vi.fn> };
  let reservationApi: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    patientApi = { list: vi.fn().mockReturnValue(of({ items: [], pagination: {} })) };
    reservationApi = {
      list: vi.fn().mockReturnValue(of({ items: [] })),
      create: vi.fn().mockReturnValue(of({ reservation: {} })),
      update: vi.fn().mockReturnValue(of({ reservation: {} })),
    };
    await TestBed.configureTestingModule({
      imports: [ReservationForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: PatientApi, useValue: patientApi },
        { provide: ReservationApi, useValue: reservationApi },
        { provide: Auth, useValue: { user: () => ({ role: 'ADMIN_STAFF' }) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReservationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads patients for the reservation selector', () => {
    expect(patientApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 100 });
    expect(component).toBeTruthy();
  });

  it('does not send an invalid reservation', () => {
    component.save();
    expect(reservationApi.create).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Vérifiez les champs');
  });

  it('creates a valid future reservation and returns to the list', () => {
    component.patientId = 'patient-1';
    component.service = 'Imagerie';
    component.scheduledDate = '2030-06-01';
    component.scheduledTime = '11:30';
    component.durationMinutes = 45;

    component.save();

    expect(reservationApi.create).toHaveBeenCalledWith({
      patientId: 'patient-1',
      service: 'Imagerie',
      practitioner: null,
      examination: null,
      scheduledAt: new Date('2030-06-01T11:30').toISOString(),
      durationMinutes: 45,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/reservations']);
  });

  it('shows the API validation message when save fails', () => {
    reservationApi.create.mockReturnValue(
      throwError(() => ({ error: { error: { message: 'Date invalide.' } } })),
    );
    component.patientId = 'patient-1';
    component.service = 'Imagerie';
    component.scheduledDate = '2030-06-01';
    component.scheduledTime = '11:30';
    component.save();
    expect(component.errorMessage()).toBe('Date invalide.');
  });
});
