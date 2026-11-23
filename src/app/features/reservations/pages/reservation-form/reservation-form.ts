import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Patient } from '../../../../core/models/patient';
import { Reservation } from '../../../../core/models/reservation';
import { PatientApi } from '../../../../core/services/patient-api';
import { ReservationApi } from '../../../../core/services/reservation-api';
import { Auth } from '../../../../core/services/auth';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-reservation-form',
  styleUrl: './reservation-form.css',
  templateUrl: './reservation-form.html',
})
export class ReservationForm {
  private readonly patientApi = inject(PatientApi);
  private readonly reservationApi = inject(ReservationApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);

  readonly patients = signal<Patient[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isEditing = signal(false);
  readonly errorMessage = signal('');
  readonly patientError = signal('');
  readonly minDate = this.localDate(new Date());

  patientId = '';
  service = '';
  practitioner = '';
  examination = '';
  scheduledDate = '';
  scheduledTime = '';
  durationMinutes = 30;
  private reservationId = '';

  constructor() {
    this.loadPatients();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reservationId = id;
      this.isEditing.set(true);
      this.loadReservation(id);
    } else {
      this.isLoading.set(false);
    }
  }

  save(): void {
    this.errorMessage.set('');
    if (!['ADMIN', 'ADMIN_STAFF', 'MEDICAL'].includes(this.auth.user()?.role ?? '')) {
      this.errorMessage.set('Votre rôle ne permet pas de gérer les réservations.');
      return;
    }
    if (!this.isValid()) {
      this.errorMessage.set('Vérifiez les champs obligatoires et choisissez une date future.');
      return;
    }

    const scheduledAt = new Date(`${this.scheduledDate}T${this.scheduledTime}`).toISOString();
    const payload = {
      service: this.service.trim(),
      practitioner: this.practitioner.trim() || null,
      examination: this.examination.trim() || null,
      scheduledAt,
      durationMinutes: Number(this.durationMinutes),
    };

    this.isSaving.set(true);
    const request = this.isEditing()
      ? this.reservationApi.update(this.reservationId, payload)
      : this.reservationApi.create({ ...payload, patientId: this.patientId });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        void this.router.navigate(['/reservations']);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.validationMessage(error));
      },
    });
  }

  private loadPatients(): void {
    this.patientApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          this.patients.set(items);
          this.patientError.set('');
        },
        error: () => this.patientError.set('Impossible de charger les patients. Réessayez.'),
      });
  }

  private loadReservation(id: string): void {
    this.reservationApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          const reservation = items.find((item) => item.id === id);
          if (!reservation) {
            this.errorMessage.set('Cette réservation est introuvable.');
            this.isLoading.set(false);
            return;
          }
          this.fillForm(reservation);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger cette réservation. Réessayez.');
          this.isLoading.set(false);
        },
      });
  }

  private fillForm(reservation: Reservation): void {
    const scheduled = new Date(reservation.scheduledAt);
    this.patientId = reservation.patientId;
    this.service = reservation.service;
    this.practitioner = reservation.practitioner ?? '';
    this.examination = reservation.examination ?? '';
    this.scheduledDate = this.localDate(scheduled);
    this.scheduledTime = `${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}`;
    this.durationMinutes = reservation.durationMinutes;
  }

  private localDate(value: Date): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  private isValid(): boolean {
    if (
      !this.service.trim() ||
      !this.scheduledDate ||
      !this.scheduledTime ||
      !Number.isInteger(Number(this.durationMinutes)) ||
      Number(this.durationMinutes) < 1 ||
      (!this.isEditing() && !this.patientId)
    ) {
      return false;
    }
    const scheduled = new Date(`${this.scheduledDate}T${this.scheduledTime}`);
    return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() > Date.now();
  }

  private validationMessage(error: unknown): string {
    const apiMessage = (error as { error?: { error?: { message?: string }; message?: string } })
      ?.error?.error?.message;
    return apiMessage || 'La réservation n’a pas pu être enregistrée. Vérifiez les informations.';
  }
}
