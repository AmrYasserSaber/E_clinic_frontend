import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { mapUserMeToAuthUser } from '../../core/auth/auth.mapper';
import { AuthStore } from '../../core/auth/auth.store';
import { ProfileCompletionStore } from '../../core/profile/profile-completion.store';
import { ToastService } from '../../core/toast/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-5xl space-y-6 pb-10 pt-2">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h1 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Update Your Profile
          </h1>
          <p class="text-sm font-medium text-on-surface-variant">
            Update personal identification and contact information.
          </p>
        </div>
        <div
          class="glass-panel grid h-12 w-12 place-items-center rounded-2xl font-headline font-bold text-on-surface"
        >
          {{ initials() }}
        </div>
      </header>

      @if (loadError) {
        <div class="ghost-outline bg-error/8 rounded-2xl p-4 text-sm font-medium text-error">
          {{ loadError }}
        </div>
      } @else if (isLoading) {
        <div class="card-surface rounded-4xl p-8 text-sm text-on-surface-variant">
          Loading profile...
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="card-surface rounded-4xl p-6 sm:p-8">
          <div class="space-y-8">
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="glass-panel grid h-10 w-10 place-items-center rounded-2xl">
                  <span class="material-symbols-outlined text-(--color-primary)">badge</span>
                </div>
                <h2 class="font-headline text-sm font-extrabold tracking-wide text-on-surface">
                  Personal Identity
                </h2>
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div class="min-w-0">
                  <label
                    class="mb-1 block min-h-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >First name</label
                  >
                  <input
                    class="input-ui h-12 w-full"
                    formControlName="first_name"
                    autocomplete="given-name"
                  />
                </div>
                <div class="min-w-0">
                  <label
                    class="mb-1 block min-h-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >Last name</label
                  >
                  <input
                    class="input-ui h-12 w-full"
                    formControlName="last_name"
                    autocomplete="family-name"
                  />
                </div>
                <div class="min-w-0">
                  <label
                    class="mb-1 block min-h-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >Date of birth</label
                  >
                  <div class="relative w-full">
                    <input
                      class="input-ui h-12 w-full pr-10"
                      type="date"
                      formControlName="date_of_birth"
                    />
                    <span
                      class="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant"
                      aria-hidden="true"
                      >calendar_month</span
                    >
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="glass-panel grid h-10 w-10 place-items-center rounded-2xl">
                  <span class="material-symbols-outlined text-(--color-primary)">call</span>
                </div>
                <h2 class="font-headline text-sm font-extrabold tracking-wide text-on-surface">
                  Contact Details
                </h2>
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div class="min-w-0">
                  <label
                    class="mb-1 block min-h-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >Primary phone</label
                  >
                  <input
                    class="input-ui h-12 w-full"
                    formControlName="phone_number"
                    autocomplete="tel"
                  />
                  <p class="mt-1 text-xs text-on-surface-variant">
                    Egyptian mobile: 01[0|1|2|5] + 8 digits.
                  </p>
                </div>
                <div class="min-w-0">
                  <div class="flex min-h-5 items-center justify-between">
                    <label
                      class="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                      >Email address</label
                    >
                    <span
                      class="glass-panel inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold tracking-wide text-on-surface-variant"
                      >Read only</span
                    >
                  </div>
                  <div class="relative w-full">
                    <input
                      class="input-ui h-12 w-full pr-10 bg-surface-container-low"
                      type="email"
                      [value]="email"
                      disabled
                    />
                    <span
                      class="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant"
                      aria-hidden="true"
                      >lock</span
                    >
                  </div>
                  <p class="mt-1 text-xs text-on-surface-variant">
                    Contact IT to update your clinical email.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <a
              routerLink="/patient/dashboard"
              class="btn-tertiary inline-flex justify-center px-6 py-3 font-bold no-underline"
            >
              Cancel
            </a>
            <button
              class="btn-primary inline-flex justify-center px-7 py-3 font-bold"
              type="submit"
              [disabled]="form.invalid || isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class PatientProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly profileCompletion = inject(ProfileCompletionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected email = '';
  protected isLoading = true;
  protected isSaving = false;
  protected loadError: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone_number: [''],
    date_of_birth: [''],
  });

  ngOnInit(): void {
    this.auth.getPatientMeApi().subscribe({
      next: (api) => {
        this.email = api.email;
        const dateOfBirth: string = this.toDateInputValue(api.date_of_birth);
        this.profileCompletion.setPatientProfileCompleteness({
          phoneNumber: api.phone_number,
          dateOfBirth: dateOfBirth,
        });
        this.form.patchValue({
          first_name: api.first_name,
          last_name: api.last_name,
          phone_number: api.phone_number,
          date_of_birth: dateOfBirth,
        });
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = this.extractLoadError(err);
      },
    });
  }

  protected initials(): string {
    const firstName: string = this.form.controls.first_name.value.trim();
    const lastName: string = this.form.controls.last_name.value.trim();
    const first: string = firstName[0] ?? 'U';
    const last: string = lastName[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving = true;
    const v = this.form.getRawValue();
    const phoneNumber: string | null = v.phone_number ? v.phone_number.trim() : null;
    const dateOfBirth: string = v.date_of_birth.trim();
    const payload: Partial<{
      first_name: string;
      last_name: string;
      phone_number: string;
      date_of_birth: string;
    }> = {
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      ...(phoneNumber ? { phone_number: phoneNumber } : {}),
      ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
    };
    this.auth
      .patchPatientMe(payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (api) => {
          const user = mapUserMeToAuthUser(api);
          if (user) this.authStore.setUser(user);
          this.profileCompletion.setPatientProfileCompleteness({
            phoneNumber: api.phone_number,
            dateOfBirth: this.toDateInputValue(api.date_of_birth),
          });
          this.toast.success('Profile updated.');
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.extractSaveError(err), 'Save failed');
        },
      });
  }

  private extractLoadError(err: HttpErrorResponse): string {
    if (typeof err.error?.detail === 'string') return err.error.detail;
    return 'Could not load your profile.';
  }

  private extractSaveError(err: HttpErrorResponse): string {
    const body = err.error;
    if (err.status === 400 && body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const parts: string[] = [];
      for (const key of [
        'first_name',
        'last_name',
        'phone_number',
        'date_of_birth',
        'non_field_errors',
      ]) {
        const val = record[key];
        if (Array.isArray(val)) parts.push(...val.map((x) => String(x)));
        else if (typeof val === 'string') parts.push(val);
      }
      if (parts.length) return parts.join(' ');
    }
    if (typeof err.error?.detail === 'string') return err.error.detail;
    return 'Could not save. Check your details.';
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) return '';
    const trimmed: string = value.trim();
    const isoDateMatch: RegExpMatchArray | null = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoDateMatch) return isoDateMatch[0] ?? '';
    return '';
  }
}
