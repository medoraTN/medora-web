import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { apiBase } from '../config/api.config';
import type { Patient, PatientDetail, PatientFields, PatientPage, PatientStatus } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${apiBase}/patients`;

  list(search: string, page: number) {
    return this.http.get<PatientPage>(this.url, { params: { search, page } });
  }

  find(id: string) {
    return this.http.get<PatientDetail>(`${this.url}/${encodeURIComponent(id)}`);
  }

  create(fields: PatientFields) {
    return this.http.post<Patient>(this.url, fields);
  }

  update(id: string, fields: PatientFields) {
    return this.http.patch<Patient>(`${this.url}/${encodeURIComponent(id)}`, fields);
  }

  changeStatus(id: string, status: PatientStatus) {
    return this.http.patch<Patient>(`${this.url}/${encodeURIComponent(id)}/status`, { status });
  }
}
