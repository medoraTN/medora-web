import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patients' },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login) },
  {
    path: 'patients', canActivate: [authGuard], canActivateChild: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/patients/pages/patient-list/patient-list').then(m => m.PatientList) },
      { path: 'new', canActivate: [roleGuard], loadComponent: () => import('./features/patients/pages/patient-form/patient-form').then(m => m.PatientForm) },
      { path: ':id/edit', canActivate: [roleGuard], loadComponent: () => import('./features/patients/pages/patient-form/patient-form').then(m => m.PatientForm) },
      { path: ':id', loadComponent: () => import('./features/patients/pages/patient-detail/patient-detail').then(m => m.PatientDetail) },
    ],
  },
  { path: '**', redirectTo: 'patients' },
];
