import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ManagedUser,
  USER_ROLE_LABELS,
  USER_ROLES,
  UserPagination,
  UserRole,
} from '../../../../core/models/user';
import { Auth } from '../../../../core/services/auth';
import { UserApi } from '../../../../core/services/user-api';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList {
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private requestNumber = 0;

  readonly user = this.auth.user;
  readonly users = signal<ManagedUser[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showCreateForm = signal(false);
  readonly passwordResetUserId = signal('');
  readonly actingUserId = signal('');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly roles = USER_ROLES;
  readonly roleLabels = USER_ROLE_LABELS;
  readonly pagination = signal<UserPagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  searchTerm = '';
  selectedRole: UserRole | '' = '';
  selectedStatus: 'true' | 'false' | '' = '';

  createEmail = '';
  createFirstName = '';
  createLastName = '';
  createRole: UserRole = 'MEDICAL';
  createPassword = '';

  resetPasswordValue = '';

  constructor() {
    this.loadUsers();
  }

  loadUsers(page = 1): void {
    const requestNumber = ++this.requestNumber;
    const search = this.searchTerm.trim();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userApi
      .list({
        page,
        pageSize: this.pagination().pageSize,
        ...(search ? { search } : {}),
        ...(this.selectedRole ? { role: this.selectedRole } : {}),
        ...(this.selectedStatus === 'true'
          ? { isActive: true }
          : this.selectedStatus === 'false'
            ? { isActive: false }
            : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestNumber !== this.requestNumber) return;
          this.users.set(response.items);
          this.pagination.set(response.pagination);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestNumber !== this.requestNumber) return;
          this.isLoading.set(false);
          this.errorMessage.set(this.describeError(error, 'Impossible de charger les utilisateurs.'));
        },
      });
  }

  applyFilters(): void {
    this.loadUsers(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.loadUsers(1);
  }

  roleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role];
  }

  isCurrentUser(managed: ManagedUser): boolean {
    return managed.id === this.user()?.id;
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.createEmail = '';
    this.createFirstName = '';
    this.createLastName = '';
    this.createRole = 'MEDICAL';
    this.createPassword = '';
  }

  createUser(): void {
    if (this.isSaving()) return;

    const email = this.createEmail.trim();
    const firstName = this.createFirstName.trim();
    const lastName = this.createLastName.trim();
    const password = this.createPassword;

    if (!email || !firstName || !lastName) {
      this.errorMessage.set('Renseignez le prénom, le nom et l’adresse e-mail.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      this.errorMessage.set(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.userApi
      .create({ email, firstName, lastName, role: this.createRole, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeCreateForm();
          this.successMessage.set('Utilisateur créé.');
          this.loadUsers(1);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.errorMessage.set(
            this.describeError(error, 'Impossible de créer cet utilisateur. Réessayez.'),
          );
        },
      });
  }

  changeRole(managed: ManagedUser, role: UserRole): void {
    if (this.isCurrentUser(managed) || managed.role === role || this.actingUserId()) return;

    const previousRole = managed.role;
    this.replaceUser({ ...managed, role });
    this.actingUserId.set(managed.id);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.userApi
      .updateRole(managed.id, role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actingUserId.set('');
          this.replaceUser(response.user);
          this.successMessage.set('Rôle mis à jour.');
        },
        error: (error: HttpErrorResponse) => {
          this.actingUserId.set('');
          this.replaceUser({ ...managed, role: previousRole });
          this.errorMessage.set(this.describeError(error, 'Impossible de modifier le rôle.'));
        },
      });
  }

  toggleStatus(managed: ManagedUser): void {
    if (this.isCurrentUser(managed) || this.actingUserId()) return;

    const nextActive = !managed.isActive;
    const confirmed = globalThis.confirm(
      nextActive
        ? `Réactiver le compte de ${managed.firstName} ${managed.lastName} ?`
        : `Désactiver le compte de ${managed.firstName} ${managed.lastName} ?`,
    );
    if (!confirmed) return;

    this.actingUserId.set(managed.id);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.userApi
      .updateStatus(managed.id, nextActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actingUserId.set('');
          this.replaceUser(response.user);
          this.successMessage.set(nextActive ? 'Compte réactivé.' : 'Compte désactivé.');
        },
        error: (error: HttpErrorResponse) => {
          this.actingUserId.set('');
          this.errorMessage.set(
            this.describeError(error, 'Impossible de modifier le statut du compte.'),
          );
        },
      });
  }

  openPasswordReset(managed: ManagedUser): void {
    this.passwordResetUserId.set(managed.id);
    this.resetPasswordValue = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  cancelPasswordReset(): void {
    this.passwordResetUserId.set('');
    this.resetPasswordValue = '';
  }

  submitPasswordReset(managed: ManagedUser): void {
    if (this.actingUserId() || this.passwordResetUserId() !== managed.id) return;

    if (this.resetPasswordValue.length < MIN_PASSWORD_LENGTH) {
      this.errorMessage.set(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    this.actingUserId.set(managed.id);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.userApi
      .resetPassword(managed.id, this.resetPasswordValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actingUserId.set('');
          this.cancelPasswordReset();
          this.successMessage.set(
            'Mot de passe réinitialisé. Communiquez-le de façon sécurisée à l’utilisateur.',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.actingUserId.set('');
          this.errorMessage.set(
            this.describeError(error, 'Impossible de réinitialiser le mot de passe.'),
          );
        },
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private replaceUser(updated: ManagedUser): void {
    this.users.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
  }

  private describeError(error: HttpErrorResponse, fallback: string): string {
    const payload = error.error as { error?: { code?: string; message?: string } } | null;
    const code = payload?.error?.code;
    const message = payload?.error?.message;

    if (code === 'SELF_MODIFICATION_FORBIDDEN') {
      return 'Vous ne pouvez pas désactiver ou rétrograder votre propre compte.';
    }
    if (code === 'LAST_ADMIN_REQUIRED') {
      return 'Il doit rester au moins un administrateur actif.';
    }
    if (code === 'CONFLICT' || error.status === 409) {
      return message || 'Cette adresse e-mail est déjà utilisée.';
    }
    if (error.status === 403) {
      return 'Accès refusé. Seuls les administrateurs peuvent gérer les utilisateurs.';
    }
    if (error.status === 401) return 'Session expirée. Reconnectez-vous.';
    return message || fallback;
  }
}
