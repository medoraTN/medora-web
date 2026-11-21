import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = () =>
  inject(Auth).canEditPatient() || inject(Router).createUrlTree(['/patients']);
