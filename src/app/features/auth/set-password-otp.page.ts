import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
        <div class="relative z-10 w-full max-w-md">
          <div class="mb-8 text-center">
            <div
              class="bg-surface-container-lowest neumorphic-card mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
            >
              <span class="material-symbols-outlined text-primary text-2xl">passkey</span>
            </div>
            <h1 class="font-headline text-primary mb-2 text-3xl font-extrabold tracking-tight">
              Set Your Password
            </h1>
            <p class="text-on-surface-variant font-medium">
              Enter the 6-digit code sent to your email along with your new password.
            </p>
          </div>

          @if (success()) {
            <div
              class="bg-surface-container-lowest neumorphic-card rounded-3xl p-6 text-center md:p-8"
            >
              <div
                class="bg-primary/10 mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
              >
                <span class="material-symbols-outlined text-primary text-3xl">check_circle</span>
              </div>
              <h2 class="font-headline text-on-surface mb-2 text-xl font-bold">Password Set</h2>
              <p class="text-on-surface-variant mb-6 text-sm font-medium">
                Your password has been set successfully. You can now sign in.
              </p>
              <a
                routerLink="/auth/login"
                class="from-primary to-primary-container inline-flex items-center gap-2 rounded-2xl bg-linear-to-r px-6 py-3 font-bold text-white shadow-[0_8px_20px_rgba(0,100,121,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,100,121,0.3)] active:scale-95"
              >
                <span>Go to Login</span>
                <span class="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
          } @else {
            @if (errorBanner()) {
              <div
                class="border-error/25 bg-error/8 mb-4 flex gap-3 rounded-2xl border px-4 py-3"
                role="alert"
              >
                <span
                  class="material-symbols-outlined text-error mt-0.5 shrink-0 text-xl"
                  aria-hidden="true"
                  >error</span
                >
                <p class="text-on-surface text-sm font-medium">{{ errorBanner() }}</p>
              </div>
            }
            <div class="bg-surface-container-lowest neumorphic-card rounded-3xl p-6 md:p-8">
              <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
                <div class="space-y-2">
                  <label
                    class="text-secondary ml-1 block text-sm font-semibold"
                    for="otp-email"
                  >
                    Email Address
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                      >mail</span
                    >
                    <input
                      #emailInput
                      id="otp-email"
                      formControlName="email"
                      type="email"
                      autocomplete="email"
                      placeholder="name@example.com"
                      [attr.aria-invalid]="fieldInvalid('email')"
                      [attr.aria-describedby]="fieldError('email') ? 'otp-email-err' : null"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 transition-all focus:ring-2"
                    />
                  </div>
                  @if (fieldError('email'); as err) {
                    <p id="otp-email-err" class="text-error ml-1 text-xs font-medium">{{ err }}</p>
                  }
                </div>

                <div class="space-y-2">
                  <label class="text-secondary ml-1 block text-sm font-semibold" for="otp-code">
                    OTP Code
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                      >pin</span
                    >
                    <input
                      id="otp-code"
                      formControlName="otp"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="one-time-code"
                      placeholder="000000"
                      [attr.aria-invalid]="fieldInvalid('otp')"
                      [attr.aria-describedby]="fieldError('otp') ? 'otp-code-err' : null"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-4 pl-11 font-mono tracking-[0.3em] transition-all focus:ring-2"
                    />
                  </div>
                  @if (fieldError('otp'); as err) {
                    <p id="otp-code-err" class="text-error ml-1 text-xs font-medium">{{ err }}</p>
                  }
                </div>

                <div class="space-y-2">
                  <label
                    class="text-secondary ml-1 block text-sm font-semibold"
                    for="otp-new-password"
                  >
                    New Password
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                      >lock</span
                    >
                    <input
                      id="otp-new-password"
                      formControlName="new_password"
                      [type]="showPassword() ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="At least 8 characters"
                      [attr.aria-invalid]="fieldInvalid('new_password')"
                      [attr.aria-describedby]="fieldError('new_password') ? 'otp-pw-err' : 'otp-pw-hint'"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-11 pl-11 transition-all focus:ring-2"
                    />
                    <button
                      type="button"
                      (click)="showPassword.update(v => !v)"
                      class="text-outline-variant hover:text-primary absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                      [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                    >
                      <span class="material-symbols-outlined">{{
                        showPassword() ? 'visibility_off' : 'visibility'
                      }}</span>
                    </button>
                  </div>
                  <p id="otp-pw-hint" class="text-on-surface-variant ml-1 text-xs font-medium">
                    Must be at least 8 characters with a mix of letters and numbers.
                  </p>
                  @if (fieldError('new_password'); as err) {
                    <p id="otp-pw-err" class="text-error ml-1 text-xs font-medium">{{ err }}</p>
                  }
                </div>

                <div class="space-y-2">
                  <label
                    class="text-secondary ml-1 block text-sm font-semibold"
                    for="otp-confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div class="relative">
                    <span
                      class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                      >lock_reset</span
                    >
                    <input
                      id="otp-confirm-password"
                      formControlName="confirm_password"
                      [type]="showConfirm() ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Repeat password"
                      [attr.aria-invalid]="fieldInvalid('confirm_password')"
                      [attr.aria-describedby]="fieldError('confirm_password') ? 'otp-confirm-err' : null"
                      class="placeholder:text-outline-variant/60 focus:ring-primary/20 bg-surface-container-low neumorphic-inset w-full rounded-2xl border-none py-3 pr-11 pl-11 transition-all focus:ring-2"
                    />
                    <button
                      type="button"
                      (click)="showConfirm.update(v => !v)"
                      class="text-outline-variant hover:text-primary absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                      [attr.aria-label]="showConfirm() ? 'Hide password' : 'Show password'"
                    >
                      <span class="material-symbols-outlined">{{
                        showConfirm() ? 'visibility_off' : 'visibility'
                      }}</span>
                    </button>
                  </div>
                  @if (fieldError('confirm_password'); as err) {
                    <p id="otp-confirm-err" class="text-error ml-1 text-xs font-medium">{{ err }}</p>
                  }
                </div>

                <button
                  type="submit"
                  [disabled]="loading() || form.invalid"
                  class="from-primary to-primary-container flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r px-5 py-3 font-bold text-white shadow-[0_8px_20px_rgba(0,100,121,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,100,121,0.3)] active:scale-95 group disabled:pointer-events-none disabled:opacity-60"
                >
                  <span>{{ loading() ? 'Setting password...' : 'Set Password' }}</span>
                  @if (!loading()) {
                    <span
                      class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                      >arrow_forward</span
                    >
                  }
                </button>
              </form>
              <div class="border-outline-variant/10 mt-8 border-t pt-6 text-center">
                <p class="text-on-surface-variant text-sm font-medium">
                  Already set your password?
                  <a
                    routerLink="/auth/login"
                    class="text-secondary hover:text-primary ml-1 font-bold transition-colors"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          }

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
export class SetPasswordOtpPage {
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly success = signal(false);
  protected readonly errorBanner = signal('');
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  @ViewChild('emailInput') private emailInputRef?: ElementRef<HTMLInputElement>;

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    otp: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
    new_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirm_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected fieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return (ctrl?.invalid && ctrl?.touched) || !!this.serverFieldErrors()[name];
  }

  protected fieldError(name: string): string | null {
    const server = this.serverFieldErrors()[name];
    if (server) return server;

    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;

    if (ctrl.errors['required']) return 'This field is required.';
    if (ctrl.errors['email']) return 'Enter a valid email address.';
    if (ctrl.errors['pattern'] && name === 'otp') return 'OTP must be exactly 6 digits.';
    if (ctrl.errors['minlength']) {
      const min = ctrl.errors['minlength'].requiredLength as number;
      return `Must be at least ${min} characters.`;
    }
    return null;
  }

  submit(): void {
    this.serverFieldErrors.set({});
    this.errorBanner.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.new_password !== raw.confirm_password) {
      this.serverFieldErrors.set({ confirm_password: 'Passwords do not match.' });
      return;
    }

    this.loading.set(true);
    this.authService
      .setPasswordWithOtp({
        email: raw.email.trim(),
        otp: raw.otp.trim(),
        new_password: raw.new_password,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.success.set(true);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          const parsed = AuthService.parseDrfErrors(err, 'Unable to set password. Please try again.');
          this.serverFieldErrors.set(parsed.fieldErrors);
          this.errorBanner.set(parsed.message);
        },
      });
  }

  private focusFirstInvalid(): void {
    for (const key of Object.keys(this.form.controls)) {
      const ctrl = this.form.get(key);
      if (ctrl?.invalid) {
        const el = document.getElementById(`otp-${key === 'new_password' ? 'new-password' : key === 'confirm_password' ? 'confirm-password' : key}`);
        el?.focus();
        break;
      }
    }
  }
}
