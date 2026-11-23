import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateUserRequest,
  UserListResponse,
  UserQuery,
  UserResponse,
  UserRole,
} from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserApi {
  constructor(private readonly http: HttpClient) {}

  list(query: UserQuery = {}): Observable<UserListResponse> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.role) params = params.set('role', query.role);
    if (query.isActive !== undefined) params = params.set('isActive', String(query.isActive));

    return this.http.get<UserListResponse>(`${API_BASE_URL}/users`, { params });
  }

  create(payload: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API_BASE_URL}/users`, {
      email: payload.email.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      role: payload.role,
      password: payload.password,
    });
  }

  updateRole(id: string, role: UserRole): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${API_BASE_URL}/users/${encodeURIComponent(id)}/role`, {
      role,
    });
  }

  updateStatus(id: string, isActive: boolean): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${API_BASE_URL}/users/${encodeURIComponent(id)}/status`,
      { isActive },
    );
  }

  resetPassword(id: string, newPassword: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${API_BASE_URL}/users/${encodeURIComponent(id)}/password-reset`,
      { newPassword },
    );
  }
}
