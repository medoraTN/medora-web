import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage } from '../../../../core/interceptors/error-interceptor';
import { PatientApi } from '../../../../core/services/patient-api';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-patient-form',
  styleUrl: './patient-form.css',
  templateUrl: './patient-form.html',
})
export class PatientForm {
  private readonly api = inject(PatientApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly ready = signal(!this.id);
  protected readonly fields = [
    { name: 'recordNumber', label: 'Numéro de dossier', type: 'text', max: 50 },
    { name: 'firstName', label: 'Prénom', type: 'text', max: 200 },
    { name: 'lastName', label: 'Nom', type: 'text', max: 200 },
    { name: 'dateOfBirth', label: 'Date de naissance', type: 'date', max: null },
    { name: 'sex', label: 'Sexe', type: 'text', max: 200 },
    { name: 'phone', label: 'Téléphone', type: 'tel', max: 40 },
    { name: 'residence', label: 'Adresse ou zone de résidence', type: 'text', max: 200 },
    { name: 'arrivalReason', label: 'Motif d’arrivée', type: 'text', max: 200 },
    { name: 'priority', label: 'Priorité', type: 'text', max: 200 },
  ] as const;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    recordNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    sex: ['', Validators.required],
    phone: ['', Validators.required],
    residence: ['', Validators.required],
    arrivalReason: ['', Validators.required],
    priority: ['', Validators.required],
    comments: [''],
  });

  constructor() {
    if (this.id) this.load();
  }

  protected load() {
    if (!this.id || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api.find(this.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (patient) => {
        this.form.patchValue({ ...patient, dateOfBirth: patient.dateOfBirth.slice(0, 10), comments: patient.comments ?? '' });
        this.ready.set(true);
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  protected save() {
    if (!this.ready() || this.form.invalid || this.saving()) return;
    const values = this.form.getRawValue();
    const input = { ...values, comments: values.comments.trim() || null };
    this.error.set('');
    this.saving.set(true);
    const request = this.id ? this.api.update(this.id, input) : this.api.create(input);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (patient) => void this.router.navigate(['/patients', patient.id]),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
