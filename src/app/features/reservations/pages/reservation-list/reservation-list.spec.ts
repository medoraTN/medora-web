import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientApi } from '../../../../core/services/patient-api';
import { ReservationApi } from '../../../../core/services/reservation-api';
import { Auth } from '../../../../core/services/auth';
import { ReservationList } from './reservation-list';

describe('ReservationList', () => {
  let fixture: ComponentFixture<ReservationList>;
  let component: ReservationList;
  let patientApi: { list: ReturnType<typeof vi.fn> };
  let reservationApi: {
    list: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  const reservation = {
    id: 'reservation-1',
    patientId: 'patient-1',
    service: 'Imagerie',
    practitioner: null,
    examination: 'Radiographie',
    scheduledAt: '2030-06-01T09:00:00.000Z',
    durationMinutes: 30,
    status: 'PENDING' as const,
    createdAt: '2030-01-01T10:00:00.000Z',
    updatedAt: '2030-01-01T10:00:00.000Z',
  };
  const patient = {
    id: 'patient-1',
    recordNumber: 'D-1001',
    firstName: 'Alex',
    lastName: 'Patient',
  };

  beforeEach(async () => {
    patientApi = { list: vi.fn().mockReturnValue(of({ items: [patient], pagination: {} })) };
    reservationApi = {
      list: vi.fn().mockReturnValue(of({ items: [reservation] })),
      cancel: vi.fn().mockReturnValue(of({ reservation: { ...reservation, status: 'CANCELLED' } })),
    };
    await TestBed.configureTestingModule({
      imports: [ReservationList],
      providers: [
        provideRouter([]),
        { provide: PatientApi, useValue: patientApi },
        { provide: ReservationApi, useValue: reservationApi },
        { provide: Auth, useValue: { user: () => ({ role: 'ADMIN_STAFF' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReservationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the selected day and patient names', () => {
    expect(reservationApi.list).toHaveBeenCalledWith({ date: component.selectedDate });
    expect(component.patientName('patient-1')).toBe('Alex Patient');
    expect(component.reservations()).toEqual([reservation]);
  });

  it('applies day and status filters', () => {
    component.selectedDate = '2030-06-01';
    component.selectedStatus = 'PENDING';
    component.loadReservations();
    expect(reservationApi.list).toHaveBeenLastCalledWith({ date: '2030-06-01', status: 'PENDING' });
  });

  it('requires confirmation before cancelling and leaves reservation unchanged on decline', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    component.cancelReservation(reservation);
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(reservationApi.cancel).not.toHaveBeenCalled();
  });

  it('cancels after confirmation and shows success feedback', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    component.cancelReservation(reservation);
    expect(reservationApi.cancel).toHaveBeenCalledWith('reservation-1');
    expect(component.successMessage()).toBe('La réservation a été annulée.');
  });

  it('shows a useful error when the list request fails', () => {
    reservationApi.list.mockReturnValue(throwError(() => new Error('offline')));
    component.loadReservations();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toContain('Impossible de charger les réservations');
  });
});
