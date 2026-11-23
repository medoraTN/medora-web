import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Patient } from '../../../../core/models/patient';
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  Reservation,
  ReservationStatus,
} from '../../../../core/models/reservation';
import { PatientApi } from '../../../../core/services/patient-api';
import { ReservationApi } from '../../../../core/services/reservation-api';
import { Auth } from '../../../../core/services/auth';

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-reservation-list',
  styleUrl: './reservation-list.css',
  templateUrl: './reservation-list.html',
})
export class ReservationList {
  private readonly patientApi = inject(PatientApi);
  private readonly reservationApi = inject(ReservationApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);
  private requestNumber = 0;

  readonly canManage = computed(() =>
    ['ADMIN', 'ADMIN_STAFF', 'MEDICAL'].includes(this.auth.user()?.role ?? ''),
  );
  readonly reservations = signal<Reservation[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly statuses = RESERVATION_STATUSES;
  readonly statusLabels = RESERVATION_STATUS_LABELS;
  readonly isLoading = signal(true);
  readonly cancellingId = signal('');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  selectedDate = new Date().toISOString().slice(0, 10);
  selectedStatus: ReservationStatus | '' = '';

  constructor() {
    this.loadReservations();
  }

  loadReservations(): void {
    const requestNumber = ++this.requestNumber;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    forkJoin({
      reservations: this.reservationApi.list({
        ...(this.selectedDate ? { date: this.selectedDate } : {}),
        ...(this.selectedStatus ? { status: this.selectedStatus } : {}),
      }),
      patients: this.patientApi.list({ page: 1, pageSize: 100 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ reservations, patients }) => {
          if (requestNumber !== this.requestNumber) return;
          this.reservations.set(
            [...reservations.items].sort(
              (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
            ),
          );
          this.patients.set(patients.items);
          this.isLoading.set(false);
        },
        error: () => {
          if (requestNumber !== this.requestNumber) return;
          this.errorMessage.set(
            'Impossible de charger les réservations. Réessayez dans un instant.',
          );
          this.isLoading.set(false);
        },
      });
  }

  clearDate(): void {
    this.selectedDate = '';
    this.loadReservations();
  }

  statusLabel(status: ReservationStatus): string {
    return RESERVATION_STATUS_LABELS[status];
  }

  patientName(patientId: string): string {
    const patient = this.patients().find((item) => item.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient indisponible';
  }

  canEdit(reservation: Reservation): boolean {
    return (
      this.canManage() && (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED')
    );
  }

  cancelReservation(reservation: Reservation): void {
    if (!this.canEdit(reservation) || this.cancellingId()) return;
    const confirmed = globalThis.confirm(
      `Annuler la réservation de ${this.patientName(reservation.patientId)} pour ${reservation.service} ?`,
    );
    if (!confirmed) return;

    this.errorMessage.set('');
    this.successMessage.set('');
    this.cancellingId.set(reservation.id);
    this.reservationApi
      .cancel(reservation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancellingId.set('');
          this.loadReservations();
          this.successMessage.set('La réservation a été annulée.');
        },
        error: () => {
          this.cancellingId.set('');
          this.errorMessage.set('Impossible d’annuler cette réservation. Réessayez.');
        },
      });
  }

  createReservation(): void {
    void this.router.navigate(['/reservations/new']);
  }
}
