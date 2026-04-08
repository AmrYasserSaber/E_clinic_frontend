import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { UserRole } from '../../models/domain.models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto mt-16 max-w-md card-surface p-6">
      <h1 class="text-2xl font-semibold text-slate-900">Sign in</h1>
      <p class="mb-4 text-sm text-slate-500">Access your MediFlow dashboard.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
        <input class="input-ui" placeholder="Email" formControlName="email" type="email" />
        <input class="input-ui" placeholder="Password" formControlName="password" type="password" />
        <button class="btn-primary w-full" [disabled]="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
      </form>
      <p class="mt-4 text-sm text-slate-600">
        New patient? <a routerLink="/auth/register" class="text-cyan-700">Create account</a>
      </p>
    </div>
  `
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected loading = false;
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authStore.setSession(response);
        this.loading = false;
        void this.router.navigateByUrl(this.targetByRole(response.user.role));
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private targetByRole(role: UserRole): string {
    switch (role) {
      case 'doctor':
        return '/doctor/dashboard';
      case 'receptionist':
        return '/receptionist/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/patient/dashboard';
    }
  }
}
