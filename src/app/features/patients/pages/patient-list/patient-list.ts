import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import {
  PATIENT_STATUS_LABELS,
  PATIENT_STATUSES,
  Patient,
  PatientPagination,
  PatientStatus,
} from '../../../../core/models/patient';
import { PatientApi } from '../../../../core/services/patient-api';

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-patient-list',
  styleUrl: './patient-list.css',
  templateUrl: './patient-list.html',
})
export class PatientList {
  private readonly patientApi = inject(PatientApi);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private requestNumber = 0;

  readonly user = this.auth.user;
  readonly patients = signal<Patient[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly statuses = PATIENT_STATUSES;
  readonly statusLabels = PATIENT_STATUS_LABELS;
  readonly pagination = signal<PatientPagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  searchTerm = '';
  selectedStatus: PatientStatus | '' = '';

  constructor() {
    this.loadPatients();
  }

  loadPatients(page = 1): void {
    const requestNumber = ++this.requestNumber;
    const search = this.searchTerm.trim();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.patientApi
      .list({
        page,
        pageSize: this.pagination().pageSize,
        ...(search ? { search } : {}),
        ...(this.selectedStatus ? { status: this.selectedStatus } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestNumber !== this.requestNumber) return;
          this.patients.set(response.items);
          this.pagination.set(response.pagination);
          this.isLoading.set(false);
        },
        error: () => {
          if (requestNumber !== this.requestNumber) return;
          this.errorMessage.set('Impossible de charger les patients. Réessayez dans un instant.');
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.loadPatients(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.loadPatients(1);
  }

  statusLabel(status: PatientStatus): string {
    return PATIENT_STATUS_LABELS[status];
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
