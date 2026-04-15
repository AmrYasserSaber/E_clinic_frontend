import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppSidebarComponent } from './app-sidebar.component';

type MobileNavState = 'closed' | 'opening' | 'open' | 'closing';

const MOBILE_NAV_ANIMATION_MS = 220;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent],
  template: `
    <div class="h-dvh overflow-hidden bg-(--color-background)">
      <div class="flex h-dvh overflow-hidden">
        <!-- Desktop sidebar -->
        <div class="hidden bg-(--color-primary) lg:block">
          <app-sidebar />
        </div>

        <!-- Mobile drawer sidebar -->
        @if (shouldRenderMobileNav()) {
          <div class="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              class="absolute inset-0 h-full w-full bg-black/35 transition-opacity duration-200"
              [class.opacity-0]="!isMobileNavVisible()"
              [class.opacity-100]="isMobileNavVisible()"
              aria-label="Close navigation"
              (click)="closeMobileNav()"
            ></button>
            <div
              class="absolute left-0 top-0 h-full bg-(--color-primary) shadow-soft transition-transform duration-200 ease-out"
              [class.-translate-x-full]="!isMobileNavVisible()"
              [class.translate-x-0]="isMobileNavVisible()"
            >
              <app-sidebar />
            </div>
          </div>
        }

        <div class="flex min-w-0 flex-1 flex-col bg-(--color-primary) p-3 lg:p-5">
          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-4xl bg-(--color-background)"
          >
            <!-- Mobile top strip (burger) -->
            <div class="flex items-center justify-between gap-3 p-3 lg:hidden">
              <button
                type="button"
                class="glass-panel inline-flex h-11 w-11 items-center justify-center rounded-2xl text-(--color-on-surface)"
                aria-label="Open navigation"
                (click)="openMobileNav()"
              >
                <span class="material-symbols-outlined">menu</span>
              </button>
              <div class="min-w-0 flex items-center gap-3">
                <span
                  class="glass-panel grid h-11 w-11 place-items-center rounded-2xl p-1"
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
                <div class="min-w-0">
                  <div class="truncate font-headline text-sm font-bold text-on-surface">
                    MediFlow
                  </div>
                  <div class="truncate text-xs font-semibold text-on-surface-variant">
                    Clinical Portal
                  </div>
                </div>
              </div>
              <div class="h-11 w-11"></div>
            </div>

            <main class="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
              <div
                class="w-full"
                [class]="
                  router.url.startsWith('/receptionist') ? 'max-w-none' : 'mx-auto max-w-6xl'
                "
              >
                <router-outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly router = inject(Router);
  private readonly mobileNavState = signal<MobileNavState>('closed');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: unknown) => {
      if (event instanceof NavigationEnd) {
        this.closeMobileNav();
      }
    });
  }

  protected openMobileNav(): void {
    if (this.mobileNavState() === 'open' || this.mobileNavState() === 'opening') return;
    this.mobileNavState.set('opening');
    requestAnimationFrame(() => this.mobileNavState.set('open'));
  }

  protected closeMobileNav(): void {
    if (this.mobileNavState() === 'closed' || this.mobileNavState() === 'closing') return;
    this.mobileNavState.set('closing');
    window.setTimeout(() => {
      if (this.mobileNavState() === 'closing') this.mobileNavState.set('closed');
    }, MOBILE_NAV_ANIMATION_MS);
  }

  protected shouldRenderMobileNav(): boolean {
    return this.mobileNavState() !== 'closed';
  }

  protected isMobileNavVisible(): boolean {
    const state: MobileNavState = this.mobileNavState();
    return state === 'open' || state === 'opening';
  }
}
