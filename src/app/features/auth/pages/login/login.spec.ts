import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the sign-in form with accessible labels', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Bon retour parmi nous');
    expect(element.querySelector('label[for="email"]')).toBeTruthy();
    expect(element.querySelector('label[for="password"]')).toBeTruthy();
    expect((element.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('submits credentials and navigates after successful login', async () => {
    fixture.componentInstance.email = 'doctor@example.com';
    fixture.componentInstance.password = 'secret';
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.submit();
    const request = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(request.request.body).toEqual({ email: 'doctor@example.com', password: 'secret' });
    request.flush({
      token: 'jwt-token',
      user: {
        id: 'user-1',
        email: 'doctor@example.com',
        firstName: 'Alex',
        lastName: 'Doctor',
        role: 'MEDICAL',
      },
    });
    await fixture.whenStable();

    expect(localStorage.getItem('medora.auth.token')).toBe('jwt-token');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows a clear message when credentials are rejected', () => {
    fixture.componentInstance.email = 'doctor@example.com';
    fixture.componentInstance.password = 'wrong';
    fixture.componentInstance.submit();
    http
      .expectOne(`${API_BASE_URL}/auth/login`)
      .flush(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Adresse e-mail ou mot de passe incorrect.',
    );
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });
});
