import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMeApi } from '../../models/auth-api.models';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 pb-8 pt-2">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1
            class="font-headline text-2xl font-extrabold tracking-tight text-(--color-on-surface)"
          >
            Doctor Profile
          </h1>
          <p class="text-sm font-medium text-on-surface-variant">
            Your account details and contact information.
          </p>
        </div>
        <a routerLink="/account/change-password" class="btn-secondary no-underline"
          >Change password</a
        >
      </div>

      @if (loading()) {
        <div class="card-surface p-6 text-sm text-on-surface-variant">Loading profile...</div>
      } @else if (error()) {
        <div class="ghost-outline bg-error/8 rounded-2xl p-4 text-sm font-medium text-error">
          {{ error() }}
        </div>
      } @else if (profile()) {
        <section class="card-surface p-6">
          <div class="mb-5 flex items-center gap-4">
            <div
              class="glass-panel grid h-14 w-14 place-items-center rounded-full text-xl font-bold text-(--color-primary)"
            >
              {{ initials(profile()!) }}
            </div>
            <div>
              <h2 class="text-lg font-semibold text-(--color-on-surface)">
                {{ fullName(profile()!) }}
              </h2>
              <p class="text-sm font-medium text-on-surface-variant">Doctor</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article class="rounded-3xl bg-surface-container-low p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Email
              </p>
              <p class="mt-1 text-sm font-semibold text-(--color-on-surface)">
                {{ profile()!.email }}
              </p>
            </article>

            <article class="rounded-3xl bg-surface-container-low p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Phone
              </p>
              <p class="mt-1 text-sm font-semibold text-(--color-on-surface)">
                {{ profile()!.phone_number || 'N/A' }}
              </p>
            </article>

            <article class="rounded-3xl bg-surface-container-low p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Date of Birth
              </p>
              <p class="mt-1 text-sm font-semibold text-(--color-on-surface)">
                {{ profile()!.date_of_birth || 'N/A' }}
              </p>
            </article>

            <article class="rounded-3xl bg-surface-container-low p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Groups
              </p>
              <p class="mt-1 text-sm font-semibold text-(--color-on-surface)">
                {{ profile()!.groups.join(', ') || 'N/A' }}
              </p>
            </article>
          </div>
        </section>
      }
    </div>
  `,
})
export class DoctorProfilePage implements OnInit {
  private readonly authService = inject(AuthService);

  protected readonly profile = signal<UserMeApi | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.authService.getUserMeApi().subscribe({
      next: (response) => {
        this.profile.set(response);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.extractError(err));
        this.loading.set(false);
      },
    });
  }

  protected fullName(profile: UserMeApi): string {
    return `${profile.first_name} ${profile.last_name}`.trim() || profile.email;
  }

  protected initials(profile: UserMeApi): string {
    const first = profile.first_name?.trim().charAt(0) ?? '';
    const last = profile.last_name?.trim().charAt(0) ?? '';
    const value = `${first}${last}`.toUpperCase();
    return value || 'DR';
  }

  private extractError(error: HttpErrorResponse): string {
    if (typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return 'Could not load profile.';
  }
}
