import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PATIENT_SEX_LABELS,
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TRANSITIONS,
  Patient,
  PatientSex,
  PatientStatus,
} from '../../../../core/models/patient';
import { Auth } from '../../../../core/services/auth';
import { PatientApi } from '../../../../core/services/patient-api';

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-patient-detail',
  styleUrl: './patient-detail.css',
  templateUrl: './patient-detail.html',
})
export class PatientDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientApi = inject(PatientApi);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private requestNumber = 0;

  readonly user = this.auth.user;
  readonly patient = signal<Patient | null>(null);
  readonly isLoading = signal(true);
  readonly isSavingStatus = signal(false);
  readonly errorMessage = signal('');
  readonly isNotFound = signal(false);
  readonly selectedStatus = signal<PatientStatus | ''>('');
  readonly canRefresh = signal(false);
  readonly statusOptions = computed(() => {
    const current = this.patient()?.status;
    const role = this.auth.user()?.role;
    if (!current || (role !== 'ADMIN' && role !== 'MEDICAL')) return [];
    return PATIENT_STATUS_TRANSITIONS[current];
  });

  private patientId = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.patientId = params.get('id') ?? '';
      this.loadPatient();
    });
  }

  loadPatient(): void {
    if (!this.patientId) {
      this.isLoading.set(false);
      this.isNotFound.set(true);
      return;
    }

    const requestNumber = ++this.requestNumber;
    this.isLoading.set(true);
    this.isNotFound.set(false);
    this.errorMessage.set('');
    this.canRefresh.set(false);

    this.patientApi
      .getById(this.patientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestNumber !== this.requestNumber) return;
          this.patient.set(response.patient);
          this.selectedStatus.set('');
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestNumber !== this.requestNumber) return;
          this.isLoading.set(false);
          if (error.status === 404) this.isNotFound.set(true);
          else
            this.errorMessage.set('Impossible de charger ce dossier. Réessayez dans un instant.');
        },
      });
  }

  updateStatus(): void {
    const status = this.selectedStatus();
    if (!status || this.isSavingStatus() || !this.patient()) return;

    this.isSavingStatus.set(true);
    this.errorMessage.set('');
    this.patientApi
      .updateStatus(this.patientId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.patient.set(response.patient);
          this.selectedStatus.set('');
          this.isSavingStatus.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isSavingStatus.set(false);
          if (error.status === 409) {
            this.canRefresh.set(true);
            this.errorMessage.set(
              'Ce changement de statut n’est plus disponible. Actualisez le dossier et réessayez.',
            );
          } else if (error.status === 403) {
            this.errorMessage.set('Votre rôle ne permet pas de modifier le statut du patient.');
          } else {
            this.errorMessage.set('Le statut n’a pas pu être modifié. Réessayez dans un instant.');
          }
        },
      });
  }

  statusLabel(status: PatientStatus): string {
    return PATIENT_STATUS_LABELS[status];
  }

  sexLabel(sex: PatientSex): string {
    return PATIENT_SEX_LABELS[sex];
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
