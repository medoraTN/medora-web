import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../services/auth';

/** Restricts a route to an authenticated ADMIN account. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  const patientsUrl = router.createUrlTree(['/patients']);

  if (!auth.getToken()) return loginUrl;

  return auth.getCurrentUser().pipe(
    map((user) => (user.role === 'ADMIN' ? true : patientsUrl)),
    catchError(() => of(loginUrl)),
  );
};
