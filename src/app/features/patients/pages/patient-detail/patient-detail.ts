import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage } from '../../../../core/interceptors/error-interceptor';
import { type PatientDetail as PatientRecord, type PatientStatus, patientStatuses, statusOptions } from '../../../../core/models/patient.model';
import { Auth } from '../../../../core/services/auth';
import { PatientApi } from '../../../../core/services/patient-api';

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-patient-detail',
  styleUrl: './patient-detail.css',
  templateUrl: './patient-detail.html',
})
export class PatientDetail {
  private readonly api = inject(PatientApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(Auth);
  protected readonly labels = patientStatuses;
  protected readonly statuses = statusOptions;
  protected readonly patient = signal<PatientRecord | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected selected: PatientStatus = 'WAITING';

  constructor() {
    this.load();
  }

  protected load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.error.set('');
    this.api.find(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.selected = patient.status;
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  protected updateStatus(patient: PatientRecord) {
    if (this.selected === patient.status || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.changeStatus(patient.id, this.selected).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        this.patient.set(null);
        this.load();
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
