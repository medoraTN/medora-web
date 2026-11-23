import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PATIENT_STATUSES, Patient, PatientStatus } from '../models/patient';
import { PatientApi } from './patient-api';

export interface DashboardReservation {
  id: string;
  patientId: string;
  service: string;
  practitioner: string | null;
  examination: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export interface DashboardSnapshot {
  patients: Patient[];
  patientCounts: Record<PatientStatus, number>;
  todaysReservations: DashboardReservation[];
  upcomingReservations: DashboardReservation[];
  lastUpdatedAt: string;
}

interface ReservationListResponse {
  items: DashboardReservation[];
}

@Injectable({ providedIn: 'root' })
export class Dashboard {
  private readonly pageSize = 100;

  constructor(
    private readonly http: HttpClient,
    private readonly patientApi: PatientApi,
  ) {}

  load(): Observable<DashboardSnapshot> {
    return forkJoin({
      firstPage: this.patientApi.list({ page: 1, pageSize: this.pageSize }),
      reservations: this.http.get<ReservationListResponse>(`${API_BASE_URL}/reservations`),
    }).pipe(
      switchMap(({ firstPage, reservations }) => {
        const pageRequests = Array.from(
          { length: Math.max(0, firstPage.pagination.totalPages - 1) },
          (_, index) => this.patientApi.list({ page: index + 2, pageSize: this.pageSize }),
        );
        return (pageRequests.length ? forkJoin(pageRequests) : of([])).pipe(
          map((additionalPages) => ({
            patients: [...firstPage.items, ...additionalPages.flatMap((page) => page.items)],
            reservations: reservations.items,
          })),
        );
      }),
      map(({ patients, reservations }) => this.createSnapshot(patients, reservations)),
    );
  }

  private createSnapshot(
    patients: Patient[],
    reservations: DashboardReservation[],
  ): DashboardSnapshot {
    const patientCounts = Object.fromEntries(
      PATIENT_STATUSES.map((status) => [
        status,
        patients.filter((patient) => patient.status === status).length,
      ]),
    ) as Record<PatientStatus, number>;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(`${today}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStart = tomorrow.getTime();
    const activeStatuses = new Set(['PENDING', 'CONFIRMED']);
    const sortedReservations = [...reservations].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    return {
      patients: [...patients].sort(
        (a, b) => a.urgencyLevel - b.urgencyLevel || a.createdAt.localeCompare(b.createdAt),
      ),
      patientCounts,
      todaysReservations: sortedReservations.filter(
        (reservation) => reservation.scheduledAt.slice(0, 10) === today,
      ),
      upcomingReservations: sortedReservations.filter(
        (reservation) =>
          new Date(reservation.scheduledAt).getTime() >= tomorrowStart &&
          activeStatuses.has(reservation.status),
      ),
      lastUpdatedAt: now.toISOString(),
    };
  }
}
