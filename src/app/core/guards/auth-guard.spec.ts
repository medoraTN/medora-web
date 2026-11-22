import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('redirects anonymous users to login and preserves the requested URL', () => {
    const target = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/patients/42' } as RouterStateSnapshot),
    );
    const router = TestBed.inject(Router);

    expect(router.serializeUrl(target as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fpatients%2F42',
    );
  });

  it('allows a user with a saved token and profile', () => {
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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });

    const target = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/patients' } as RouterStateSnapshot),
    );

    expect(target).toBe(true);
  });
});
