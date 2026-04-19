import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../core/auth/auth.store';
import { ProfileCompletionStore } from '../core/profile/profile-completion.store';
import { UserRole } from '../models/domain.models';
import { AuthService } from '../services/auth.service';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly isVisible: (role: UserRole | null) => boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/patient/dashboard',
    isVisible: (role) => role === 'patient',
  },
  {
    label: 'Appointments',
    icon: 'event',
    href: '/patient/appointments',
    isVisible: (role) => role === 'patient',
  },
  {
    label: 'Book',
    icon: 'add_circle',
    href: '/patient/book',
    isVisible: (role) => role === 'patient',
  },
  {
    label: 'Consultations',
    icon: 'clinical_notes',
    href: '/patient/consultations',
    isVisible: (role) => role === 'patient',
  },
  {
    label: 'Profile',
    icon: 'account_circle',
    href: '/patient/profile',
    isVisible: (role) => role === 'patient',
  },
  {
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/doctor/dashboard',
    isVisible: (role) => role === 'doctor',
  },
  {
    label: 'Queue',
    icon: 'queue',
    href: '/doctor/queue',
    isVisible: (role) => role === 'doctor',
  },
  {
    label: 'Schedule',
    icon: 'calendar_month',
    href: '/doctor/schedule',
    isVisible: (role) => role === 'doctor',
  },
  {
    label: 'Consultations',
    icon: 'assignment',
    href: '/doctor/consultations',
    isVisible: (role) => role === 'doctor',
  },
  {
    label: 'Profile',
    icon: 'account_circle',
    href: '/doctor/profile',
    isVisible: (role) => role === 'doctor',
  },
  {
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/receptionist/dashboard',
    isVisible: (role) => role === 'receptionist',
  },
  {
    label: 'Requests',
    icon: 'inbox',
    href: '/receptionist/requests',
    isVisible: (role) => role === 'receptionist',
  },
  {
    label: 'Queue',
    icon: 'queue',
    href: '/receptionist/queue',
    isVisible: (role) => role === 'receptionist',
  },
  {
    label: 'Schedule',
    icon: 'calendar_month',
    href: '/receptionist/schedule',
    isVisible: (role) => role === 'receptionist',
  },
  {
    label: 'Exceptions',
    icon: 'event_busy',
    href: '/receptionist/exceptions',
    isVisible: (role) => role === 'receptionist',
  },
  {
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/admin/dashboard',
    isVisible: (role) => role === 'admin',
  },
  {
    label: 'Analytics',
    icon: 'analytics',
    href: '/admin/analytics',
    isVisible: (role) => role === 'admin',
  },
  {
    label: 'Users',
    icon: 'group',
    href: '/admin/users',
    isVisible: (role) => role === 'admin',
  },
  {
    label: 'Export',
    icon: 'download',
    href: '/admin/export',
    isVisible: (role) => role === 'admin',
  },
  {
    label: 'Patients',
    icon: 'person_search',
    href: '/admin/patients',
    isVisible: (role) => role === 'admin',
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex h-full w-[280px] flex-col px-4 pb-4 pt-5 text-on-primary">
      <div class="mb-6 inline-flex items-center gap-3 rounded-2xl px-3 py-2 text-on-primary">
        <span
          class="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 p-1"
          aria-hidden="true"
        >
          <img
            src="/logo-no-text.png"
            alt=""
            class="h-full w-full object-contain opacity-95"
            decoding="async"
            loading="eager"
          />
        </span>
        <div>
          <div class="font-semibold tracking-tight">MediFlow</div>
          <div class="text-xs text-white/70">Clinical Portal</div>
        </div>
      </div>
      <nav class="flex-1">
        <ul class="space-y-1">
          @for (item of visibleItems(); track item.href) {
            <li>
              <a
                [routerLink]="item.href"
                routerLinkActive="is-active"
                class="nav-item group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <span
                  class="material-symbols-outlined text-[20px] text-white/70 group-hover:text-white"
                >
                  {{ item.icon }}
                </span>
                <span class="min-w-0">
                  <span class="flex items-center gap-2">
                    <span class="truncate font-medium">{{ item.label }}</span>
                    @if (isIncompleteProfileItem(item.href)) {
                      <span class="relative flex h-2.5 w-2.5">
                        <span
                          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-60"
                          aria-hidden="true"
                        ></span>
                        <span
                          class="relative inline-flex h-2.5 w-2.5 rounded-full bg-white/70"
                        ></span>
                      </span>
                    }
                  </span>
                  @if (isIncompleteProfileItem(item.href)) {
                    <span class="mt-0.5 block text-[11px] font-semibold text-white/70">
                      complete your profile
                    </span>
                  }
                </span>
              </a>
            </li>
          }
        </ul>
      </nav>
      <div class="mt-4 space-y-3">
        <div class="rounded-3xl bg-white/10 p-3">
          <div class="flex items-center gap-3">
            <div
              class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-bold tracking-wide text-white"
              aria-hidden="true"
            >
              {{ initials() }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-white">{{ displayName() }}</div>
              <div
                class="mt-1 inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80"
              >
                {{ roleText() }}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="group flex w-full items-center justify-center gap-2 rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.99]"
          (click)="openSignOutDialog()"
        >
          <span class="material-symbols-outlined text-[18px] text-white/80 group-hover:text-white"
            >logout</span
          >
          Sign out
        </button>
      </div>
    </aside>

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
  styles: [
    `
      .nav-item.is-active {
        background: var(--color-background);
        color: var(--color-on-surface);
      }
      .nav-item.is-active .material-symbols-outlined {
        color: var(--color-on-surface);
      }
    `,
  ],
})
export class AppSidebarComponent {
  private readonly auth = inject(AuthStore);
  private readonly profileCompletion = inject(ProfileCompletionStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly isSignOutDialogOpen = signal(false);
  protected readonly displayName = computed(() => this.auth.user()?.fullName ?? 'User');
  protected readonly roleText = computed(() => this.auth.role() ?? 'user');
  protected readonly isPatientProfileIncomplete = computed(() => {
    if (this.auth.role() !== 'patient') return false;
    return !this.profileCompletion.isPatientProfileComplete();
  });
  protected readonly visibleItems = computed(() => {
    const role: UserRole | null = this.auth.role();
    return NAV_ITEMS.filter((item) => item.isVisible(role));
  });

  protected isIncompleteProfileItem(href: string): boolean {
    return href === '/patient/profile' && this.isPatientProfileIncomplete();
  }

  protected initials(): string {
    const fullName: string = this.displayName();
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
