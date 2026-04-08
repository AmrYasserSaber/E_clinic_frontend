import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto mt-12 max-w-lg card-surface p-6">
      <h1 class="text-2xl font-semibold text-slate-900">Create patient account</h1>
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <input class="input-ui" placeholder="First name" formControlName="first_name" />
        <input class="input-ui" placeholder="Last name" formControlName="last_name" />
        <input class="input-ui md:col-span-2" placeholder="Email" type="email" formControlName="email" />
        <input class="input-ui" placeholder="Password" type="password" formControlName="password" />
        <input class="input-ui" placeholder="Confirm password" type="password" formControlName="confirm_password" />
        <input class="input-ui" placeholder="Date of birth" type="date" formControlName="date_of_birth" />
        <input class="input-ui" placeholder="Phone" formControlName="phone" />
        <button class="btn-primary md:col-span-2" [disabled]="loading">{{ loading ? 'Creating...' : 'Create account' }}</button>
      </form>
      <a class="mt-3 inline-block text-sm text-cyan-700" routerLink="/auth/login">Back to login</a>
    </div>
  `
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected loading = false;

  protected readonly form = new FormGroup({
    first_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    last_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirm_password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date_of_birth: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl('/auth/login');
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
