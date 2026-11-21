import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PatientApi } from './patient-api';

describe('PatientApi', () => {
  let service: PatientApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PatientApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
