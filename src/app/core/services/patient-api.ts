import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  PatientListResponse,
  PatientQuery,
  PatientResponse,
  PatientStatus,
} from '../models/patient';

@Injectable({ providedIn: 'root' })
export class PatientApi {
  constructor(private readonly http: HttpClient) {}

  list(query: PatientQuery = {}): Observable<PatientListResponse> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.status) params = params.set('status', query.status);

    return this.http.get<PatientListResponse>(`${API_BASE_URL}/patients`, { params });
  }

  getById(id: string): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${API_BASE_URL}/patients/${encodeURIComponent(id)}`);
  }

  updateStatus(id: string, status: PatientStatus): Observable<PatientResponse> {
    return this.http.patch<PatientResponse>(
      `${API_BASE_URL}/patients/${encodeURIComponent(id)}/status`,
      { status },
    );
  }
}
