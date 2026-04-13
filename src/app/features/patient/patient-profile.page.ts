import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { mapUserMeToAuthUser } from '../../core/auth/auth.mapper';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../core/toast/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-lg space-y-6 pb-8 pt-2">
      <div class="flex items-center gap-3">
        <a routerLink="/patient/dashboard" class="btn-secondary no-underline">Back</a>
        <div>
          <h1 class="font-headline text-2xl font-extrabold tracking-tight text-slate-900">Your profile</h1>
          <p class="text-sm text-slate-500">Update how we reach you and your name on records.</p>
        </div>
      </div>

      @if (loadError) {
        <div class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{{ loadError }}</div>
      } @else if (isLoading) {
        <div class="card-surface p-6 text-sm text-slate-500">Loading profile...</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="card-surface space-y-4 p-6">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input class="input-ui bg-slate-50" type="email" [value]="email" disabled />
            <p class="mt-1 text-xs text-slate-400">Email cannot be changed here.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">First name</label>
              <input class="input-ui" formControlName="first_name" autocomplete="given-name" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Last name</label>
              <input class="input-ui" formControlName="last_name" autocomplete="family-name" />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <input class="input-ui" formControlName="phone_number" autocomplete="tel" />
            <p class="mt-1 text-xs text-slate-400">Egyptian mobile: 01[0|1|2|5] + 8 digits.</p>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Date of birth</label>
            <input class="input-ui" type="date" formControlName="date_of_birth" />
          </div>

          <div class="flex flex-wrap gap-3 pt-2">
            <button class="btn-primary" type="submit" [disabled]="form.invalid || isSaving">
              {{ isSaving ? 'Saving...' : 'Save changes' }}
            </button>
            <a routerLink="/patient/dashboard" class="btn-secondary inline-block no-underline">Cancel</a>
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
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected email = '';
  protected isLoading = true;
  protected isSaving = false;
  protected loadError: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone_number: ['', Validators.required],
    date_of_birth: ['', Validators.required],
  });

  ngOnInit(): void {
    this.auth.getPatientMeApi().subscribe({
      next: (api) => {
        this.email = api.email;
        this.form.patchValue({
          first_name: api.first_name,
          last_name: api.last_name,
          phone_number: api.phone_number,
          date_of_birth: api.date_of_birth,
        });
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = this.extractLoadError(err);
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving = true;
    const v = this.form.getRawValue();
    this.auth
      .patchPatientMe({
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        phone_number: v.phone_number.trim(),
        date_of_birth: v.date_of_birth,
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (api) => {
          const user = mapUserMeToAuthUser(api);
          if (user) this.authStore.setUser(user);
          this.toast.success('Profile updated.');
          void this.router.navigateByUrl('/patient/dashboard');
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
      for (const key of ['first_name', 'last_name', 'phone_number', 'date_of_birth', 'non_field_errors']) {
        const val = record[key];
        if (Array.isArray(val)) parts.push(...val.map((x) => String(x)));
        else if (typeof val === 'string') parts.push(val);
      }
      if (parts.length) return parts.join(' ');
    }
    if (typeof err.error?.detail === 'string') return err.error.detail;
    return 'Could not save. Check your details.';
  }
}
