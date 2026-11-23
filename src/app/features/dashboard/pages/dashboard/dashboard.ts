import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, exhaustMap, merge, of, Subject, tap, timer } from 'rxjs';
import {
  PATIENT_STATUS_LABELS,
  PATIENT_STATUSES,
  Patient,
  PatientStatus,
} from '../../../../core/models/patient';
import {
  Dashboard as DashboardApi,
  DashboardReservation,
  DashboardSnapshot,
} from '../../../../core/services/dashboard';
import { Auth } from '../../../../core/services/auth';

const RESERVATION_STATUS_LABELS: Record<DashboardReservation['status'], string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
};

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardApi = inject(DashboardApi);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshRequested = new Subject<void>();

  readonly user = this.auth.user;
  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');
  readonly statuses = PATIENT_STATUSES;
  readonly statusLabels = PATIENT_STATUS_LABELS;
  readonly snapshot = signal<DashboardSnapshot | null>(null);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly errorMessage = signal('');
  readonly priorityPatients = computed(() => this.snapshot()?.patients.slice(0, 8) ?? []);
  readonly todaysReservations = computed(() => this.snapshot()?.todaysReservations ?? []);
  readonly upcomingReservations = computed(() => this.snapshot()?.upcomingReservations ?? []);

  constructor() {
    merge(of(void 0), timer(30_000, 30_000), this.refreshRequested)
      .pipe(
        exhaustMap(() => {
          this.isRefreshing.set(true);
          this.isLoading.set(this.snapshot() === null);
          this.errorMessage.set('');
          return this.dashboardApi.load().pipe(
            tap((snapshot) => {
              this.snapshot.set(snapshot);
              this.isLoading.set(false);
              this.isRefreshing.set(false);
            }),
            catchError(() => {
              this.errorMessage.set('Impossible d’actualiser le tableau de bord. Réessayez.');
              this.isLoading.set(false);
              this.isRefreshing.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  refresh(): void {
    this.refreshRequested.next();
  }

  count(status: PatientStatus): number {
    return this.snapshot()?.patientCounts[status] ?? 0;
  }

  patientName(patientId: string): string {
    const patient = this.snapshot()?.patients.find((item) => item.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient indisponible';
  }

  reservationStatusLabel(status: DashboardReservation['status']): string {
    return RESERVATION_STATUS_LABELS[status];
  }

  patientAriaLabel(patient: Patient): string {
    return `Ouvrir le dossier de ${patient.firstName} ${patient.lastName}`;
  }

  statusLabel(status: PatientStatus): string {
    return PATIENT_STATUS_LABELS[status];
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
