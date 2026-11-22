import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (!auth.getToken()) return loginUrl;

  return auth.getCurrentUser().pipe(
    map(() => true),
    catchError(() => of(loginUrl)),
  );
};
