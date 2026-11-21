import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;
  let requests: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(Auth);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('keeps the JWT in memory and maps patient permissions', () => {
    service.login('demo@example.invalid', 'test password').subscribe();
    const req = requests.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'test-token', user: { id: 'id', role: 'ADMIN_STAFF' } });

    expect(service.token()).toBe('test-token');
    expect(service.canEditPatient()).toBe(true);
    expect(service.canChangeStatus()).toBe(false);
    service.logout();
    expect(service.token()).toBeUndefined();
    expect(service.canEditPatient()).toBe(false);
  });
});
