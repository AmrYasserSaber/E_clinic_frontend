import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../core/toast/toast.service';
import { UserRole } from '../../models/domain.models';

const REMEMBER_EMAIL_KEY = 'mediflow_remember_email';

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
              class="card-surface mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
            >
              <span class="material-symbols-outlined text-primary text-2xl">medical_services</span>
            </div>
            <h1 class="font-headline text-primary mb-2 text-3xl font-extrabold tracking-tight">
              MediFlow
            </h1>
            <p class="text-on-surface-variant font-medium">
              Welcome back to your Digital Sanctuary.
            </p>
          </div>
          @if (signupNotice()) {
            <div
              class="ghost-outline bg-secondary-fixed/30 text-on-secondary-container mb-4 rounded-2xl px-4 py-2.5 text-sm font-medium"
            >
              {{ signupNotice() }}
            </div>
          }
          @if (pendingApprovalNotice()) {
            <div
              class="ghost-outline bg-primary/8 mb-4 flex gap-3 rounded-2xl px-4 py-3"
              role="status"
            >
              <span
                class="material-symbols-outlined text-primary mt-0.5 shrink-0 text-xl"
                aria-hidden="true"
                >schedule</span
              >
              <div class="min-w-0 text-left">
                <p class="text-on-surface font-headline text-sm font-bold tracking-tight">
                  Account under review
                </p>
                <p class="text-on-surface-variant mt-1 text-sm leading-snug font-medium">
                  {{ pendingApprovalNotice() }}
                </p>
                <p class="text-on-surface-variant mt-2 text-xs leading-snug">
                  You will get full access after an administrator approves your profile. If this
                  takes longer than expected, contact your clinic administrator.
                </p>
              </div>
            </div>
          }
          <div class="card-surface rounded-3xl p-6 md:p-8">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
              <div class="space-y-2">
                <label class="text-secondary ml-1 block text-sm font-semibold" for="login-email">
                  Email Address
                </label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                  >
                    mail
                  </span>
                  <input
                    id="login-email"
                    formControlName="email"
                    type="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    class="input-ui pl-11! pr-4! py-3! placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-secondary ml-1 block text-sm font-semibold" for="login-password">
                  Password
                </label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined text-outline-variant pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl"
                  >
                    lock
                  </span>
                  <input
                    id="login-password"
                    formControlName="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    class="input-ui pl-11! pr-11! py-3! placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    (click)="togglePasswordVisibility()"
                    class="text-outline-variant hover:text-primary absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">{{
                      showPassword() ? 'visibility_off' : 'visibility'
                    }}</span>
                  </button>
                </div>
              </div>
              <div class="flex items-center text-sm">
                <label class="group flex cursor-pointer items-center">
                  <div class="relative h-5 w-5 shrink-0">
                    <input
                      type="checkbox"
                      formControlName="rememberMe"
                      class="peer absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <div
                      class="bg-surface-container-low pointer-events-none h-5 w-5 rounded-md transition-all peer-checked:bg-primary/10"
                    ></div>
                    <span
                      class="material-symbols-outlined text-primary pointer-events-none absolute inset-0 flex items-center justify-center scale-0 font-bold transition-transform peer-checked:scale-75"
                    >
                      check
                    </span>
                  </div>
                  <span
                    class="text-on-surface-variant group-hover:text-primary ml-3 font-medium transition-colors"
                  >
                    Remember me
                  </span>
                </label>
              </div>
              <button
                type="submit"
                [disabled]="loading() || form.invalid"
                class="from-primary to-primary-container flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r px-5 py-3 font-bold text-white shadow-[0_8px_20px_rgba(0,100,121,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,100,121,0.3)] active:scale-95 group disabled:pointer-events-none disabled:opacity-60"
              >
                <span>{{ loading() ? 'Signing in...' : 'Login to Sanctuary' }}</span>
                @if (!loading()) {
                  <span
                    class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                  >
                    arrow_forward
                  </span>
                }
              </button>
            </form>
            <div class="mt-5 flex items-center gap-3">
              <div
                class="h-px grow bg-linear-to-r from-transparent via-outline-variant/25 to-transparent"
              ></div>
              <div class="text-outline-variant text-[10px] font-bold tracking-[0.2em] uppercase">
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
              class="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-container-low px-5 py-3 font-bold text-on-surface transition-all hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
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
            <div class="mt-8 space-y-3 text-center">
              <div
                class="mb-5 h-px bg-linear-to-r from-transparent via-outline-variant/20 to-transparent"
              ></div>
              <p class="text-on-surface-variant text-sm font-medium">
                Don't have an account?
                <a
                  routerLink="/auth/register"
                  class="text-secondary hover:text-primary ml-1 font-bold transition-colors"
                >
                  Create new account
                </a>
              </p>
              <p class="text-on-surface-variant text-sm font-medium">
                First time user?
                <a
                  routerLink="/auth/set-password-otp"
                  class="text-secondary hover:text-primary ml-1 font-bold transition-colors"
                >
                  Set password with OTP
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
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly googleLoading = signal(false);
  protected readonly signupNotice = signal('');
  protected readonly pendingApprovalNotice = signal('');
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'pending') {
      this.signupNotice.set('Account created. Pending admin approval before you can sign in.');
    }
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered) {
      this.form.patchValue({ email: remembered, rememberMe: true });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.pendingApprovalNotice.set('');
    const { email, password, rememberMe } = this.form.getRawValue();
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.authStore.setSession(response);
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        this.loading.set(false);
        void this.router.navigateByUrl(this.targetByRole(response.user.role));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (AuthService.isLoginPendingApprovalError(err)) {
          this.pendingApprovalNotice.set(AuthService.loginPendingApprovalDetail(err));
          return;
        }
        this.toast.error(AuthService.loginErrorMessage(err), 'Sign in failed');
      },
    });
  }

  continueWithGoogle(): void {
    this.googleLoading.set(true);
    this.authService.googleStart('login').subscribe({
      next: (authorizationUrl) => {
        window.location.assign(authorizationUrl);
      },
      error: () => {
        this.googleLoading.set(false);
        this.toast.error('Unable to start Google sign-in. Please try again.', 'Google sign-in');
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
