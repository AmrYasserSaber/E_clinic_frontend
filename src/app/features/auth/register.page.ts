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
import { AuthValidators } from './auth.validators';

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
              class="card-surface mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
            >
              <span class="material-symbols-outlined text-primary text-2xl">person_add</span>
            </div>
            <h1
              class="font-headline text-primary mb-2 text-2xl font-extrabold tracking-tight md:text-3xl"
            >
              Create new account
            </h1>
            <p class="text-on-surface-variant text-sm font-medium">
              Create your MediFlow account. Staff roles need admin approval before you can sign in.
            </p>
          </div>
          <div class="card-surface rounded-3xl p-6 md:p-8">
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
                      class="ghost-outline has-[input:checked]:bg-primary/5 bg-surface-container-low flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
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
                      class="input-ui pl-11 pr-4 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                      class="input-ui pl-11 pr-4 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                    class="input-ui pl-11 pr-4 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                      class="input-ui pl-11 pr-4 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                      class="input-ui pl-11 pr-4 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                    placeholder="At least 8 characters"
                    class="input-ui pl-11 pr-11 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                @if (
                  form.controls.password.touched && form.controls.password.errors?.['minlength']
                ) {
                  <p class="text-error ml-1 text-xs font-medium">
                    Must be at least {{ passwordMinLength }} characters.
                  </p>
                }
                @if (
                  form.controls.password.touched &&
                  form.controls.password.errors?.['passwordCommon']
                ) {
                  <p class="text-error ml-1 text-xs font-medium">Password is too common.</p>
                }
                @if (
                  form.controls.password.touched &&
                  form.controls.password.errors?.['passwordNumeric']
                ) {
                  <p class="text-error ml-1 text-xs font-medium">
                    Password cannot be entirely numeric.
                  </p>
                }
                @if (form.touched && form.errors?.['passwordSimilar']) {
                  <p class="text-error ml-1 text-xs font-medium">
                    Password is too similar to your personal information.
                  </p>
                }
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
                    class="input-ui pl-11 pr-11 py-3 placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
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
                @if (form.controls.confirm_password.touched && form.errors?.['passwordMismatch']) {
                  <p class="text-error ml-1 text-xs font-medium">Passwords do not match.</p>
                }
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
              @if (form.controls.role.value === 'patient') {
                <div class="mt-3 flex items-center gap-3">
                  <div
                    class="h-px grow bg-linear-to-r from-transparent via-outline-variant/25 to-transparent"
                  ></div>
                  <div
                    class="text-outline-variant text-[10px] font-bold tracking-[0.2em] uppercase"
                  >
                    OR
                  </div>
                  <div
                    class="h-px grow bg-linear-to-r from-transparent via-outline-variant/25 to-transparent"
                  ></div>
                </div>
                <button
                  type="button"
                  (click)="continueWithGoogle()"
                  [disabled]="googleLoading()"
                  class="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-container-low px-5 py-3 font-bold text-on-surface transition-all hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                >
                  <svg class="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.675 32.658 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.972 6.053 29.738 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917Z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691 12.88 19.51C14.656 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.972 6.053 29.738 4 24 4c-7.682 0-14.347 4.326-17.694 10.691Z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.127 0 9.698-1.969 13.192-5.192l-6.09-5.158C29.07 35.091 26.65 36 24 36c-5.202 0-9.64-3.319-11.269-7.946l-6.525 5.027C9.505 39.556 16.227 44 24 44Z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a11.96 11.96 0 0 1-4.201 5.65l.002-.001 6.09 5.158C36.712 39.252 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z"
                    />
                  </svg>
                  <span>{{ googleLoading() ? 'Redirecting…' : 'Continue with Google' }}</span>
                </button>
                <p class="text-on-surface-variant mt-2 text-xs font-medium">
                  You’ll finish your patient profile after Google confirms your email.
                </p>
              }
            </form>
            <div class="mt-6 text-center">
              <div
                class="mb-5 h-px bg-linear-to-r from-transparent via-outline-variant/20 to-transparent"
              ></div>
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
  protected readonly googleLoading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly passwordMinLength = AuthValidators.passwordMinLength();

  protected readonly roleOptions: { value: SignupRole; label: string }[] = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
  ];

  protected readonly form = new FormGroup(
    {
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
      phone_number: new FormControl('', { nonNullable: true }),
      date_of_birth: new FormControl('', {
        nonNullable: true,
        validators: [pastDateValidator],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(this.passwordMinLength),
          AuthValidators.passwordNotAllNumeric(),
        ],
      }),
      confirm_password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [AuthValidators.signupPasswordPolicy()] },
  );

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
    this.loading.set(true);
    const phone = raw.phone_number.trim();
    const dob = raw.date_of_birth;
    this.authService
      .register({
        first_name: raw.first_name.trim(),
        last_name: raw.last_name.trim(),
        email: raw.email.trim(),
        password: raw.password,
        ...(phone.length > 0 ? { phone_number: phone } : {}),
        ...(dob ? { date_of_birth: dob } : {}),
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

  continueWithGoogle(): void {
    if (this.form.controls.role.value !== 'patient') return;
    this.googleLoading.set(true);
    this.authService.googleStart('signup').subscribe({
      next: (authorizationUrl) => {
        window.location.assign(authorizationUrl);
      },
      error: () => {
        this.googleLoading.set(false);
        this.toast.error('Unable to start Google signup. Please try again.', 'Google signup');
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
