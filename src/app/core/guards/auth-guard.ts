import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () =>
  !!inject(Auth).user() || inject(Router).createUrlTree(['/login']);
