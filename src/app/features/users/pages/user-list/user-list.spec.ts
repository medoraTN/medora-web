import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { ManagedUser } from '../../../../core/models/user';
import { authInterceptor } from '../../../../core/interceptors/auth-interceptor';
import { UserList } from './user-list';

describe('UserList', () => {
  let fixture: ComponentFixture<UserList>;
  let http: HttpTestingController;

  const admin: ManagedUser = {
    id: 'user-1',
    email: 'admin@medora.test',
    firstName: 'Ada',
    lastName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  const nurse: ManagedUser = {
    id: 'user-2',
    email: 'nurse@medora.test',
    firstName: 'Nora',
    lastName: 'Nurse',
    role: 'MEDICAL',
    isActive: true,
    createdAt: '2026-01-02T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
  };

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('medora.auth.token', 'admin-token');
    localStorage.setItem(
      'medora.auth.user',
      JSON.stringify({
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      }),
    );
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserList);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushList(items: ManagedUser[] = [admin, nurse]): void {
    http.expectOne(`${API_BASE_URL}/users?page=1&pageSize=20`).flush({
      items,
      pagination: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
    });
    fixture.detectChanges();
  }

  it('loads and renders the user directory', () => {
    fixture.detectChanges();
    flushList();

    expect(fixture.nativeElement.textContent).toContain('Ada Admin');
    expect(fixture.nativeElement.textContent).toContain('nurse@medora.test');
    expect(fixture.nativeElement.textContent).toContain('Personnel médical');
    expect(fixture.nativeElement.textContent).toContain('Actif');
  });

  it('applies search, role and status filters from page one', () => {
    fixture.detectChanges();
    flushList();
    fixture.componentInstance.searchTerm = ' nora ';
    fixture.componentInstance.selectedRole = 'MEDICAL';
    fixture.componentInstance.selectedStatus = 'true';

    fixture.componentInstance.applyFilters();

    const request = http.expectOne(
      `${API_BASE_URL}/users?page=1&pageSize=20&search=nora&role=MEDICAL&isActive=true`,
    );
    request.flush({
      items: [nurse],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nora Nurse');
  });

  it('creates a user and shows a clear conflict message for duplicate emails', () => {
    fixture.detectChanges();
    flushList();
    fixture.componentInstance.openCreateForm();
    fixture.componentInstance.createFirstName = 'Sam';
    fixture.componentInstance.createLastName = 'Staff';
    fixture.componentInstance.createEmail = 'nurse@medora.test';
    fixture.componentInstance.createRole = 'ADMIN_STAFF';
    fixture.componentInstance.createPassword = 'SecretPass1';
    fixture.detectChanges();

    fixture.componentInstance.createUser();
    const create = http.expectOne(`${API_BASE_URL}/users`);
    expect(create.request.body).toMatchObject({
      email: 'nurse@medora.test',
      role: 'ADMIN_STAFF',
      password: 'SecretPass1',
    });
    create.flush(
      { error: { code: 'CONFLICT', message: 'Un utilisateur existe déjà avec cette adresse e-mail.' } },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Un utilisateur existe déjà avec cette adresse e-mail.',
    );
  });

  it('prevents client-side creation when the password is too short', () => {
    fixture.detectChanges();
    flushList();
    fixture.componentInstance.openCreateForm();
    fixture.componentInstance.createFirstName = 'Sam';
    fixture.componentInstance.createLastName = 'Staff';
    fixture.componentInstance.createEmail = 'sam@medora.test';
    fixture.componentInstance.createPassword = 'short';
    fixture.componentInstance.createUser();
    http.expectNone(`${API_BASE_URL}/users`);
    expect(fixture.componentInstance.errorMessage()).toContain('8 caractères');
  });

  it('updates role and status for another account, not the signed-in admin', () => {
    fixture.detectChanges();
    flushList();
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    fixture.componentInstance.changeRole(nurse, 'SUPERVISOR');
    const role = http.expectOne(`${API_BASE_URL}/users/user-2/role`);
    expect(role.request.body).toEqual({ role: 'SUPERVISOR' });
    const promoted = { ...nurse, role: 'SUPERVISOR' as const };
    role.flush({ user: promoted });

    const listedNurse = fixture.componentInstance.users().find((item) => item.id === 'user-2')!;
    fixture.componentInstance.toggleStatus(listedNurse);
    const status = http.expectOne(`${API_BASE_URL}/users/user-2/status`);
    expect(status.request.body).toEqual({ isActive: false });
    status.flush({ user: { ...promoted, isActive: false } });
    fixture.detectChanges();

    expect(fixture.componentInstance.users().find((item) => item.id === 'user-2')).toMatchObject({
      role: 'SUPERVISOR',
      isActive: false,
    });

    fixture.componentInstance.toggleStatus(admin);
    http.expectNone(`${API_BASE_URL}/users/user-1/status`);
  });

  it('resets a password after validating the minimum length', () => {
    fixture.detectChanges();
    flushList();
    fixture.componentInstance.openPasswordReset(nurse);
    fixture.componentInstance.resetPasswordValue = 'NewPassword1';
    fixture.componentInstance.submitPasswordReset(nurse);

    const reset = http.expectOne(`${API_BASE_URL}/users/user-2/password-reset`);
    expect(reset.request.body).toEqual({ newPassword: 'NewPassword1' });
    reset.flush({ user: nurse });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mot de passe réinitialisé');
  });
});
