import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { apiBase } from '../config/api.config';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).token();
  if (token && req.url.startsWith(`${apiBase}/`) && req.url !== `${apiBase}/auth/login`) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
