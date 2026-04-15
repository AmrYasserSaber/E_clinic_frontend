import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth/auth.store';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header
      class="mb-5 flex items-center justify-between gap-3 rounded-3xl bg-surface-container-lowest p-3 shadow-soft"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="truncate font-headline text-lg font-semibold tracking-tight text-(--color-on-surface)"
        >
          MediFlow
        </span>
        <span
          class="glass-panel rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          {{ auth.role() }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        @if (auth.role() === 'patient' || auth.role() === 'doctor') {
          <a
            [routerLink]="auth.role() === 'doctor' ? '/doctor/profile' : '/patient/profile'"
            class="glass-panel inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-(--color-on-surface)"
            aria-label="Open profile"
          >
            {{ initials() }}
          </a>
        }
        <button class="btn-secondary" type="button" (click)="openSignOutDialog()">Sign out</button>
      </div>
    </header>

    @if (isSignOutDialogOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div class="card-surface w-full max-w-md p-5">
          <h3 class="text-base font-semibold text-(--color-on-surface)">Sign out</h3>
          <p class="mt-1 text-sm text-on-surface-variant">Are you sure you want to sign out?</p>

          <div class="mt-4 flex justify-end gap-2">
            <button class="btn-secondary" type="button" (click)="closeSignOutDialog()">
              Cancel
            </button>
            <button class="btn-primary" type="button" (click)="confirmSignOut()">Sign out</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AppTopbarComponent {
  protected readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly isSignOutDialogOpen = signal(false);

  protected initials(): string {
    const fullName: string | undefined = this.auth.user()?.fullName;
    if (!fullName) return 'U';
    const parts: string[] = fullName
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const first: string = parts[0]?.[0] ?? 'U';
    const last: string = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return `${first}${last}`.toUpperCase();
  }

  protected openSignOutDialog(): void {
    this.isSignOutDialogOpen.set(true);
  }

  protected closeSignOutDialog(): void {
    this.isSignOutDialogOpen.set(false);
  }

  protected confirmSignOut(): void {
    this.isSignOutDialogOpen.set(false);
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
    });
  }
}
