import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { LoginResponse } from '../models/user';
import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;
  let http: HttpTestingController;
  const user = {
    id: 'user-1',
    email: 'doctor@example.com',
    firstName: 'Alex',
    lastName: 'Doctor',
    role: 'MEDICAL' as const,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Auth);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the credentials, stores the session, and exposes the signed-in user', () => {
    let result: LoginResponse | undefined;
    service.login(' doctor@example.com ', 'secret').subscribe((response) => (result = response));

    const request = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'doctor@example.com', password: 'secret' });
    request.flush({ token: 'jwt-token', user });

    expect(result?.user).toEqual(user);
    expect(service.getToken()).toBe('jwt-token');
    expect(service.user()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears the saved session on logout', () => {
    localStorage.setItem('medora.auth.token', 'jwt-token');
    localStorage.setItem('medora.auth.user', JSON.stringify(user));
    service = TestBed.inject(Auth);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('discards a malformed saved user', () => {
    localStorage.setItem('medora.auth.token', 'jwt-token');
    localStorage.setItem('medora.auth.user', '{invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const restoredService = TestBed.inject(Auth);

    expect(restoredService.user()).toBeNull();
    expect(restoredService.getToken()).toBeNull();
  });
});
