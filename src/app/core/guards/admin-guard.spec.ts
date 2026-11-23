import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { User } from '../models/user';
import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
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

  it('redirects anonymous users to login', () => {
    const target = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/users' } as RouterStateSnapshot),
    );

    expect(target).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(target as UrlTree)).toBe(
      '/login?returnUrl=%2Fusers',
    );
    http.expectNone(`${API_BASE_URL}/auth/me`);
  });

  it('allows an ADMIN account', () => {
    localStorage.setItem('medora.auth.token', 'jwt-token');
    let result: boolean | UrlTree | undefined;
    const target = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/users' } as RouterStateSnapshot),
    );
    (target as Observable<boolean | UrlTree>).subscribe((value) => (result = value));

    http.expectOne(`${API_BASE_URL}/auth/me`).flush({
      user: {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Ada',
        lastName: 'Admin',
        role: 'ADMIN',
      } satisfies User,
    });

    expect(result).toBe(true);
  });

  it('sends non-admin users to the patients workspace', () => {
    localStorage.setItem('medora.auth.token', 'jwt-token');
    let result: boolean | UrlTree | undefined;
    const target = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/users' } as RouterStateSnapshot),
    );
    (target as Observable<boolean | UrlTree>).subscribe((value) => (result = value));

    http.expectOne(`${API_BASE_URL}/auth/me`).flush({
      user: {
        id: '2',
        email: 'nurse@example.com',
        firstName: 'Nora',
        lastName: 'Nurse',
        role: 'MEDICAL',
      } satisfies User,
    });

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/patients');
  });
});
