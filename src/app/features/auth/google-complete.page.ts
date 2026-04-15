import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../core/toast/toast.service';
import { UserRole } from '../../models/domain.models';
import { GoogleOAuthIntent } from '../../models/auth-api.models';

type SignupFormValue = {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
};

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
              <span class="material-symbols-outlined text-primary text-2xl">shield</span>
            </div>
            <h1 class="font-headline text-primary mb-2 text-2xl font-extrabold tracking-tight">
              Completing Google sign-in
            </h1>
            <p class="text-on-surface-variant text-sm font-medium">
              We’re securely connecting your Google account.
            </p>
          </div>

          <div class="card-surface rounded-3xl p-6 md:p-8">
            <div class="flex flex-col items-center gap-3 py-6">
              <div
                class="ghost-outline bg-surface-container-low flex w-full items-center gap-3 rounded-2xl px-4 py-3"
              >
                <span class="material-symbols-outlined text-primary shrink-0 text-xl"
                  >progress_activity</span
                >
                <div class="min-w-0">
                  <p class="text-on-surface text-sm font-semibold">Signing you in…</p>
                  <p class="text-on-surface-variant text-xs font-medium">
                    This usually takes a second.
                  </p>
                </div>
              </div>
              <a
                routerLink="/auth/login"
                class="text-secondary hover:text-primary text-sm font-bold transition-colors"
              >
                Back to login
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class GoogleCompletePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly oneTimeCode = computed(() =>
    this.route.snapshot.queryParamMap.get('one_time_code'),
  );
  protected readonly intent = computed(
    () => (this.route.snapshot.queryParamMap.get('intent') ?? 'login') as GoogleOAuthIntent,
  );

  constructor() {
    queueMicrotask(() => this.executeComplete());
  }

  private executeComplete(): void {
    const code = this.oneTimeCode();
    if (!code) {
      this.toast.error('Missing Google completion code. Please try again.', 'Google sign-in');
      void this.router.navigateByUrl('/auth/login');
      return;
    }
    this.loading.set(true);
    const intent = this.intent();
    const payload: Record<string, unknown> =
      intent === 'signup'
        ? { one_time_code: code, intent: 'signup', role: 'patient' }
        : { one_time_code: code, intent: 'login' };
    this.authService.googleComplete(payload).subscribe({
      next: (session) => {
        this.authStore.setSession(session);
        this.loading.set(false);
        void this.router.navigateByUrl(this.targetByRole(session.user.role));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.handleCompleteError(err, '/auth/login');
      },
    });
  }

  private handleCompleteError(err: unknown, fallbackUrl: string): void {
    if (AuthService.isLoginPendingApprovalError(err)) {
      this.toast.error(AuthService.loginPendingApprovalDetail(err), 'Account under review');
      void this.router.navigateByUrl('/auth/login?registered=pending');
      return;
    }
    if (err instanceof HttpErrorResponse && typeof err.error?.detail === 'string') {
      this.toast.error(err.error.detail, 'Google sign-in');
      void this.router.navigateByUrl(fallbackUrl);
      return;
    }
    this.toast.error('Google sign-in failed. Please try again.', 'Google sign-in');
    void this.router.navigateByUrl(fallbackUrl);
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
