import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { User } from '../models/user';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('redirects anonymous users to login and preserves the requested URL', () => {
    const target = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/patients/42' } as RouterStateSnapshot),
    );

    expect(target).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(target as UrlTree)).toBe(
      '/login?returnUrl=%2Fpatients%2F42',
    );
    http.expectNone(`${API_BASE_URL}/auth/me`);
  });

  it('validates a saved token with the current-user endpoint before allowing access', () => {
    localStorage.setItem('medora.auth.token', 'jwt-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: '1',
        email: 'user@example.com',
        firstName: 'A',
        lastName: 'B',
        role: 'ADMIN',
      }),
    );
    let result: boolean | UrlTree | undefined;
    const target = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/patients' } as RouterStateSnapshot),
    );
    (target as Observable<boolean | UrlTree>).subscribe((value) => (result = value));

    const request = http.expectOne(`${API_BASE_URL}/auth/me`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({
      user: {
        id: '1',
        email: 'user@example.com',
        firstName: 'A',
        lastName: 'B',
        role: 'ADMIN',
      } satisfies User,
    });

    expect(result).toBe(true);
  });

  it('clears an expired session and redirects back to login', () => {
    localStorage.setItem('medora.auth.token', 'expired-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: '1',
        email: 'user@example.com',
        firstName: 'A',
        lastName: 'B',
        role: 'ADMIN',
      }),
    );
    let result: boolean | UrlTree | undefined;
    const target = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/patients' } as RouterStateSnapshot),
    );
    (target as Observable<boolean | UrlTree>).subscribe((value) => (result = value));
    http
      .expectOne(`${API_BASE_URL}/auth/me`)
      .flush(
        { error: { code: 'UNAUTHENTICATED', message: 'Unauthenticated' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fpatients',
    );
    expect(localStorage.getItem('medora.auth.token')).toBeNull();
  });
});
