import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { Auth } from '../services/auth';

describe('authInterceptor', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds a bearer token to protected requests', () => {
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
    const client = TestBed.inject(HttpClient);

    client.get('/api/patients').subscribe();

    expect(http.expectOne('/api/patients').request.headers.get('Authorization')).toBe(
      'Bearer jwt-token',
    );
    TestBed.inject(Auth).logout();
  });

  it('does not attach a token to the public login endpoint', () => {
    const client = TestBed.inject(HttpClient);

    client.post('/api/auth/login', {}).subscribe();

    expect(http.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
  });
});
