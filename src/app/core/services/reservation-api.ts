import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateReservationPayload,
  ReservationListResponse,
  ReservationQuery,
  ReservationResponse,
  UpdateReservationPayload,
} from '../models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationApi {
  constructor(private readonly http: HttpClient) {}

  list(query: ReservationQuery = {}): Observable<ReservationListResponse> {
    let params = new HttpParams();
    if (query.date) params = params.set('date', query.date);
    if (query.status) params = params.set('status', query.status);
    if (query.patientId) params = params.set('patientId', query.patientId);
    return this.http.get<ReservationListResponse>(`${API_BASE_URL}/reservations`, { params });
  }

  create(payload: CreateReservationPayload): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${API_BASE_URL}/reservations`, payload);
  }

  update(id: string, payload: UpdateReservationPayload): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${API_BASE_URL}/reservations/${encodeURIComponent(id)}`,
      payload,
    );
  }

  cancel(id: string): Observable<ReservationResponse> {
    return this.http.delete<ReservationResponse>(
      `${API_BASE_URL}/reservations/${encodeURIComponent(id)}`,
    );
  }
}
