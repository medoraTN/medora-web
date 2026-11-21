import { HttpClient } from '@angular/common/http';
import { inject, Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { apiBase } from '../config/api.config';

export type Role = 'ADMIN' | 'MEDICAL' | 'ADMIN_STAFF' | 'SUPERVISOR';

interface Session {
  token: string;
  user: { id: string; role: Role };
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(null);
  readonly token = computed(() => this.session()?.token);
  readonly user = computed(() => this.session()?.user);
  readonly canEditPatient = computed(() => this.user() !== undefined && this.user()?.role !== 'SUPERVISOR');
  readonly canChangeStatus = computed(() => this.user()?.role === 'ADMIN' || this.user()?.role === 'MEDICAL');

  login(email: string, password: string) {
    return this.http.post<Session>(`${apiBase}/auth/login`, { email, password }).pipe(
      tap((session) => this.session.set(session)),
    );
  }

  logout() {
    this.session.set(null);
  }
}
