import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Change Password" subtitle="Update your account password." />

    <div class="card-surface mx-auto max-w-lg p-6">
      @if (successMessage()) {
        <div
          class="ghost-outline mb-5 flex items-start gap-3 rounded-2xl bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary"
          role="status"
        >
          <span
            class="material-symbols-outlined mt-0.5 shrink-0 text-lg text-secondary"
            aria-hidden="true"
            >check_circle</span
          >
          <span>{{ successMessage() }}</span>
        </div>
      }

      @if (errorBanner()) {
        <div
          class="ghost-outline mb-5 flex items-start gap-3 rounded-2xl bg-error/8 px-4 py-3 text-sm font-medium text-error"
          role="alert"
        >
          <span
            class="material-symbols-outlined mt-0.5 shrink-0 text-lg text-error"
            aria-hidden="true"
            >error</span
          >
          <span>{{ errorBanner() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
        <div class="space-y-1.5">
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
            for="cp-old-pw"
          >
            Current Password
          </label>
          <div class="relative">
            <input
              id="cp-old-pw"
              formControlName="old_password"
              [type]="showOld() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter current password"
              [attr.aria-invalid]="fieldInvalid('old_password')"
              [attr.aria-describedby]="fieldError('old_password') ? 'cp-old-pw-err' : null"
              class="input-ui pr-10"
            />
            <button
              type="button"
              (click)="showOld.update(v => !v)"
              class="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant hover:text-(--color-on-surface) transition-colors"
              [attr.aria-label]="showOld() ? 'Hide password' : 'Show password'"
            >
              <span class="material-symbols-outlined text-lg">{{
                showOld() ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </div>
          @if (fieldError('old_password'); as err) {
            <p id="cp-old-pw-err" class="text-xs font-medium text-error">{{ err }}</p>
          }
        </div>

        <div class="space-y-1.5">
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
            for="cp-new-pw"
          >
            New Password
          </label>
          <div class="relative">
            <input
              id="cp-new-pw"
              formControlName="new_password"
              [type]="showNew() ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              [attr.aria-invalid]="fieldInvalid('new_password')"
              [attr.aria-describedby]="
                fieldError('new_password') ? 'cp-new-pw-err' : 'cp-new-pw-hint'
              "
              class="input-ui pr-10"
            />
            <button
              type="button"
              (click)="showNew.update(v => !v)"
              class="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant hover:text-(--color-on-surface) transition-colors"
              [attr.aria-label]="showNew() ? 'Hide password' : 'Show password'"
            >
              <span class="material-symbols-outlined text-lg">{{
                showNew() ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </div>
          <p id="cp-new-pw-hint" class="text-xs font-medium text-on-surface-variant">
            Must be at least 8 characters with a mix of letters and numbers.
          </p>
          @if (fieldError('new_password'); as err) {
            <p id="cp-new-pw-err" class="text-xs font-medium text-error">{{ err }}</p>
          }
        </div>

        <div class="space-y-1.5">
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
            for="cp-confirm-pw"
          >
            Confirm New Password
          </label>
          <div class="relative">
            <input
              id="cp-confirm-pw"
              formControlName="confirm_password"
              [type]="showConfirm() ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repeat new password"
              [attr.aria-invalid]="fieldInvalid('confirm_password')"
              [attr.aria-describedby]="fieldError('confirm_password') ? 'cp-confirm-pw-err' : null"
              class="input-ui pr-10"
            />
            <button
              type="button"
              (click)="showConfirm.update(v => !v)"
              class="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant hover:text-(--color-on-surface) transition-colors"
              [attr.aria-label]="showConfirm() ? 'Hide password' : 'Show password'"
            >
              <span class="material-symbols-outlined text-lg">{{
                showConfirm() ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </div>
          @if (fieldError('confirm_password'); as err) {
            <p id="cp-confirm-pw-err" class="text-xs font-medium text-error">{{ err }}</p>
          }
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            [disabled]="loading() || form.invalid"
            class="btn-primary flex items-center gap-2"
          >
            @if (loading()) {
              <span>Saving...</span>
            } @else {
              <span class="material-symbols-outlined text-lg">lock_reset</span>
              <span>Change Password</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ChangePasswordPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorBanner = signal('');
  protected readonly showOld = signal(false);
  protected readonly showNew = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  protected readonly form = new FormGroup({
    old_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
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
    if (ctrl.errors['minlength']) {
      const min = ctrl.errors['minlength'].requiredLength as number;
      return `Must be at least ${min} characters.`;
    }
    return null;
  }

  submit(): void {
    this.serverFieldErrors.set({});
    this.errorBanner.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.new_password !== raw.confirm_password) {
      this.serverFieldErrors.set({ confirm_password: 'Passwords do not match.' });
      return;
    }

    this.loading.set(true);
    this.authService
      .changePassword({
        old_password: raw.old_password,
        new_password: raw.new_password,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.form.reset();
          this.successMessage.set(res.detail ?? 'Password changed successfully.');
          this.toast.success('Password changed successfully.');
        },
        error: (err: unknown) => {
          this.loading.set(false);
          const parsed = AuthService.parseDrfErrors(err, 'Unable to change password.');
          this.serverFieldErrors.set(parsed.fieldErrors);
          this.errorBanner.set(parsed.message);
        },
      });
  }
}
