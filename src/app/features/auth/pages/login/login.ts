import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  submit(): void {
    if (this.isSubmitting()) return;

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const returnUrl =
          requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.status === 401
            ? 'Adresse e-mail ou mot de passe incorrect.'
            : 'Connexion impossible. Vérifiez votre connexion puis réessayez.',
        );
      },
    });
  }
}
