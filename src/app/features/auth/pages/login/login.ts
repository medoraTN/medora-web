import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage } from '../../../../core/interceptors/error-interceptor';
import { Auth } from '../../../../core/services/auth';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal('');

  protected submit() {
    if (this.form.invalid || this.pending()) return;
    const { email, password } = this.form.getRawValue();
    this.pending.set(true);
    this.error.set('');
    this.auth.login(email, password).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigate(['/patients']),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
