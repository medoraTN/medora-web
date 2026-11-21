import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { errorMessage } from '../../../../core/interceptors/error-interceptor';
import { type PatientPage, patientStatuses } from '../../../../core/models/patient.model';
import { Auth } from '../../../../core/services/auth';
import { PatientApi } from '../../../../core/services/patient-api';

type ListState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: PatientPage }
  | { kind: 'error'; message: string };

@Component({
  imports: [RouterLink],
  selector: 'app-patient-list',
  styleUrl: './patient-list.css',
  templateUrl: './patient-list.html',
})
export class PatientList {
  protected readonly auth = inject(Auth);
  protected readonly statuses = patientStatuses;
  private readonly api = inject(PatientApi);
  protected readonly query = signal({ search: '', page: 1 });
  protected readonly state = toSignal(toObservable(this.query).pipe(
    switchMap(({ search, page }) => this.api.list(search, page).pipe(
      map((data): ListState => ({ kind: 'ready', data })),
      catchError((error: unknown) => of<ListState>({ kind: 'error', message: errorMessage(error) })),
      startWith<ListState>({ kind: 'loading' }),
    )),
  ), { initialValue: { kind: 'loading' } as const });

  protected search(event: Event, value: string) {
    event.preventDefault();
    this.query.set({ search: value.trim(), page: 1 });
  }

  protected goTo(page: number) {
    this.query.update((query) => ({ ...query, page }));
  }
}
