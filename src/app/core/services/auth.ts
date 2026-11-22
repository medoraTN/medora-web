import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LoginResponse, User } from '../models/user';

const TOKEN_KEY = 'medora.auth.token';
const USER_KEY = 'medora.auth.user';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly currentUser = signal<User | null>(this.readUser());
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null && !!this.getToken());

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email: email.trim(), password })
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          this.currentUser.set(response.user);
        }),
      );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  private readUser(): User | null {
    const value = localStorage.getItem(USER_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }
}
