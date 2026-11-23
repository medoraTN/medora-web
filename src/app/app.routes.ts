import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'patients',
    canActivate: [authGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/patients/pages/patient-list/patient-list').then((m) => m.PatientList),
  },
  {
    path: 'patients/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/patients/pages/patient-detail/patient-detail').then(
        (m) => m.PatientDetail,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/reservations/pages/reservation-list/reservation-list').then(
        (m) => m.ReservationList,
      ),
  },
  {
    path: 'reservations/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/pages/reservation-form/reservation-form').then(
        (m) => m.ReservationForm,
      ),
  },
  {
    path: 'reservations/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/pages/reservation-form/reservation-form').then(
        (m) => m.ReservationForm,
      ),
  },
  { path: '', redirectTo: 'patients', pathMatch: 'full' },
  { path: '**', redirectTo: 'patients' },
];
