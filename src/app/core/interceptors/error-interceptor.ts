import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { apiBase } from '../config/api.config';
import { Auth } from '../services/auth';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.token();
  return next(req).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401 && token &&
        auth.token() === token && req.url.startsWith(`${apiBase}/`) &&
        req.url !== `${apiBase}/auth/login`) {
      auth.logout();
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};

export function errorMessage(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Connexion au serveur impossible. Réessayez.';
    if (typeof error.error?.message === 'string') return error.error.message;
  }
  return 'Une erreur est survenue. Réessayez.';
}
