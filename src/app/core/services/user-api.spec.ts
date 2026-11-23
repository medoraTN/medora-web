import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { ManagedUser } from '../models/user';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { UserApi } from './user-api';

describe('UserApi', () => {
  let service: UserApi;
  let http: HttpTestingController;

  const managedUser: ManagedUser = {
    id: 'user-2',
    email: 'nurse@medora.test',
    firstName: 'Nora',
    lastName: 'Nurse',
    role: 'MEDICAL',
    isActive: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('medora.auth.token', 'admin-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists users with documented filters', () => {
    let total: number | undefined;
    service
      .list({ page: 1, pageSize: 20, search: '  nora  ', role: 'MEDICAL', isActive: true })
      .subscribe((response) => (total = response.pagination.total));

    const request = http.expectOne(
      (req) =>
        req.url === `${API_BASE_URL}/users` &&
        req.params.get('search') === 'nora' &&
        req.params.get('role') === 'MEDICAL' &&
        req.params.get('isActive') === 'true',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [managedUser],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(total).toBe(1);
  });

  it('creates a user and updates role, status, and password', () => {
    service
      .create({
        email: 'nurse@medora.test',
        firstName: 'Nora',
        lastName: 'Nurse',
        role: 'MEDICAL',
        password: 'SecretPass1',
      })
      .subscribe();
    const create = http.expectOne(`${API_BASE_URL}/users`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toMatchObject({ email: 'nurse@medora.test', role: 'MEDICAL' });
    create.flush({ user: managedUser });

    service.updateRole('user-2', 'ADMIN_STAFF').subscribe();
    const role = http.expectOne(`${API_BASE_URL}/users/user-2/role`);
    expect(role.request.body).toEqual({ role: 'ADMIN_STAFF' });
    role.flush({ user: { ...managedUser, role: 'ADMIN_STAFF' } });

    service.updateStatus('user-2', false).subscribe();
    const status = http.expectOne(`${API_BASE_URL}/users/user-2/status`);
    expect(status.request.body).toEqual({ isActive: false });
    status.flush({ user: { ...managedUser, isActive: false } });

    service.resetPassword('user-2', 'NewPassword1').subscribe();
    const reset = http.expectOne(`${API_BASE_URL}/users/user-2/password-reset`);
    expect(reset.request.body).toEqual({ newPassword: 'NewPassword1' });
    reset.flush({ user: managedUser });
  });
});
