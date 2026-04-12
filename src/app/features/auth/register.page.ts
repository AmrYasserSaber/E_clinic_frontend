import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../core/toast/toast.service';
import { UserRole } from '../../models/domain.models';

type SignupRole = 'patient' | 'doctor' | 'receptionist';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  const chosen = new Date(value as string);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(chosen.getTime()) || chosen >= today) {
    return { pastDate: true };
  }
  return null;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="bg-background font-body text-on-surface flex min-h-dvh flex-col">
      <main class="relative flex grow items-center justify-center overflow-hidden p-4 md:p-6">
        <div
          class="bg-primary-container/10 absolute top-[-10%] left-[-5%] h-72 w-72 rounded-full blur-[120px]"
        ></div>
        <div
          class="bg-secondary-container/15 absolute right-[-5%] bottom-[-10%] h-72 w-72 rounded-full blur-[120px]"
        ></div>
        <div class="relative z-10 w-full max-w-xl">
          <div class="mb-5 text-center">
            <div
              class="bg-surface-container-lowest neumorphic-card mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
            >
              <span class="material-symbols-outlined text-primary text-2xl">person_add</span>
            </div>
            <h1
              class="font-headline text-primary mb-2 text-2xl font-extrabold tracking-tight md:text-3xl"
            >
              Request access
            </h1>
            <p class="text-on-surface-variant text-sm font-medium">
              Create your MediFlow account. Staff roles need admin approval before you can sign in.
            </p>
          </div>
          <div class="bg-surface-container-lowest neumorphic-card rounded-3xl p-6 md:p-8">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
              <div class="space-y-2">
                <span class="text-secondary ml-1 block text-sm font-semibold">Account type</span>
                <div
                  class="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  role="group"
                  aria-label="Account type"
                >
                  @for (option of roleOptions; track option.value) {
                    <label
                      class="border-outline-variant/20 has-[input:checked]:border-primary/40 has-[input:checked]:bg-primary/5 bg-surface-container-low neumorphic-inset flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition-all"
                    >
                      <input
                        type="radio"
                        formControlName="role"
                        [value]="option.value"
                        class="text-primary h-4 w-4 shrink-0 border-outline-variant"
                      />
                      <span class="text-on-surface text-sm font-semibold">{{ option.label }}</span>
                    </label>
                  }
                </div>
                <p class="text-on-surface-variant ml-1 text-xs font-medium">
                  Patients can sign in immediately. Doctors and receptionists receive access after
                  approval.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label
                    class="text-secondary ml-1 block text-sm font-semibold"
                    for="reg-first-name"
                  >
                    First name
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                    >
                      person
                    </span>
                    <input
                      id="reg-first-name"
                      formControlName="first_name"
                      type="text"
                      autocomplete="given-name"
                      placeholder="e.g. Alex"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <label
                    class="text-secondary ml-1 block text-sm font-semibold"
                    for="reg-last-name"
                  >
                    Last name
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                    >
                      badge
                    </span>
                    <input
                      id="reg-last-name"
                      formControlName="last_name"
                      type="text"
                      autocomplete="family-name"
                      placeholder="e.g. Rivera"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                    />
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-secondary ml-1 block text-sm font-semibold" for="reg-email"
                  >Email</label
                >
                <div class="relative">
                  <span
                    class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                  >
                    mail
                  </span>
                  <input
                    id="reg-email"
                    formControlName="email"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-secondary ml-1 block text-sm font-semibold" for="reg-phone">
                    Phone number
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                    >
                      phone
                    </span>
                    <input
                      id="reg-phone"
                      formControlName="phone_number"
                      type="tel"
                      autocomplete="tel"
                      placeholder="+20 100 123 4567"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-secondary ml-1 block text-sm font-semibold" for="reg-dob">
                    Date of birth
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                    >
                      calendar_month
                    </span>
                    <input
                      id="reg-dob"
                      formControlName="date_of_birth"
                      type="date"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                    />
                  </div>
                  @if (
                    form.controls.date_of_birth.errors?.['pastDate'] &&
                    form.controls.date_of_birth.touched
                  ) {
                    <p class="text-error ml-1 text-xs font-medium">Must be a date in the past.</p>
                  }
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-secondary ml-1 block text-sm font-semibold" for="reg-password">
                  Password
                </label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                  >
                    lock
                  </span>
                  <input
                    id="reg-password"
                    formControlName="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="At least 6 characters"
                    class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-11 pl-11 transition-all focus:ring-2"
                  />
                  <button
                    type="button"
                    (click)="togglePassword()"
                    class="text-outline-variant hover:text-primary absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">{{
                      showPassword() ? 'visibility_off' : 'visibility'
                    }}</span>
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-secondary ml-1 block text-sm font-semibold" for="reg-confirm">
                  Confirm password
                </label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                  >
                    lock_reset
                  </span>
                  <input
                    id="reg-confirm"
                    formControlName="confirm_password"
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="Repeat password"
                    class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-11 pl-11 transition-all focus:ring-2"
                  />
                  <button
                    type="button"
                    (click)="toggleConfirmPassword()"
                    class="text-outline-variant hover:text-primary absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                    [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">{{
                      showConfirmPassword() ? 'visibility_off' : 'visibility'
                    }}</span>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                [disabled]="loading() || form.invalid"
                class="from-primary to-primary-container flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r px-5 py-3 font-bold text-white shadow-[0_8px_20px_rgba(0,100,121,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,100,121,0.3)] active:scale-95 group disabled:pointer-events-none disabled:opacity-60"
              >
                <span>{{ loading() ? 'Creating account...' : 'Create account' }}</span>
                @if (!loading()) {
                  <span
                    class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                  >
                    arrow_forward
                  </span>
                }
              </button>
            </form>
            <div class="border-outline-variant/10 mt-6 border-t pt-6 text-center">
              <p class="text-on-surface-variant text-sm font-medium">
                Already registered?
                <a
                  routerLink="/auth/login"
                  class="text-secondary hover:text-primary ml-1 font-bold transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
          <div class="mt-8 grid grid-cols-3 gap-4 opacity-60">
            <div
              class="h-px self-center bg-linear-to-r from-transparent via-outline-variant/30 to-transparent"
            ></div>
            <div
              class="text-outline-variant text-center text-[10px] font-bold tracking-[0.2em] uppercase"
            >
              Trusted Clinical Security
            </div>
            <div
              class="h-px self-center bg-linear-to-r from-transparent via-outline-variant/30 to-transparent"
            ></div>
          </div>
        </div>
      </main>
      <footer class="text-outline-variant p-4 text-center text-xs font-medium tracking-wide md:p-6">
        © 2026 MediFlow Digital Systems. All rights reserved. Secure Health Portal.
      </footer>
    </div>
  `,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly roleOptions: { value: SignupRole; label: string }[] = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
  ];

  protected readonly form = new FormGroup({
    role: new FormControl<SignupRole>('patient', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    first_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    last_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone_number: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date_of_birth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, pastDateValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirm_password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirm_password) {
      this.toast.warning('Passwords do not match.', 'Check your password');
      return;
    }
    this.loading.set(true);
    this.authService
      .register({
        first_name: raw.first_name.trim(),
        last_name: raw.last_name.trim(),
        email: raw.email.trim(),
        password: raw.password,
        phone_number: raw.phone_number.trim(),
        date_of_birth: raw.date_of_birth,
        role: raw.role,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const session = this.authService.mapSignupToSession(response);
          if (session) {
            this.authStore.setSession(session);
            void this.router.navigateByUrl(this.targetByRole(session.user.role));
          } else {
            void this.router.navigate(['/auth/login'], { queryParams: { registered: 'pending' } });
          }
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.toast.error(AuthService.signupErrorMessage(err), 'Registration failed');
        },
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
