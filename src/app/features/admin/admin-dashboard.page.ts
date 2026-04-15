import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, RouterLink, SectionCardComponent],
  template: `
    <main class="min-h-screen space-y-8 bg-background p-6 font-body text-on-surface md:p-10">
      <div
        class="sticky top-0 z-10 -mx-6 bg-background/90 px-6 pt-6 backdrop-blur md:-mx-10 md:px-10 md:pt-10"
      >
        <app-page-header title="Admin Dashboard" subtitle="Clinic analytics and export controls.">
          <div class="flex flex-col items-end gap-2">
            <div class="flex flex-wrap items-center justify-end gap-2">
              <span
                class="glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-on-surface-variant"
              >
                <span class="material-symbols-outlined text-[16px] text-(--color-primary)"
                  >update</span
                >
                Updated: {{ lastUpdated ? (lastUpdated | date: 'shortTime') : '--' }}
              </span>
              <button
                class="btn-secondary inline-flex items-center gap-2"
                type="button"
                (click)="refresh()"
              >
                <span class="material-symbols-outlined text-[18px]">refresh</span>
                Refresh
              </button>
              <button
                class="btn-primary inline-flex items-center gap-2"
                type="button"
                (click)="exportCsv()"
              >
                <span class="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>
            </div>
          </div>
        </app-page-header>
      </div>

      @if (loadError) {
        <div class="ghost-outline rounded-2xl bg-error/8 p-4 text-error">
          {{ loadError }}
        </div>
      }

      @if (isLoading && analyticsKeyCount() === 0) {
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          @for (row of skeletonCards; track row) {
            <div class="card-surface rounded-3xl p-6">
              <div class="animate-pulse space-y-3">
                <div class="h-4 w-40 rounded-full bg-surface-container-highest/60"></div>
                <div class="h-8 w-24 rounded-2xl bg-surface-container-highest/40"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <section class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="card-surface rounded-3xl p-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-on-surface-variant">Total appointments</p>
              <span class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
                <span class="material-symbols-outlined text-(--color-primary)">event_note</span>
              </span>
            </div>
            <p class="mt-4 font-headline text-4xl font-extrabold text-on-surface">
              {{ metricValue(['total_all_time', 'total_appointments', 'total']) }}
            </p>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">All time</p>
          </div>

          <div class="card-surface rounded-3xl p-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-on-surface-variant">This week</p>
              <span class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
                <span class="material-symbols-outlined text-(--color-primary)"
                  >calendar_view_week</span
                >
              </span>
            </div>
            <p class="mt-4 font-headline text-4xl font-extrabold text-on-surface">
              {{ metricValue(['total_this_week', 'appointments_this_week']) }}
            </p>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Appointments</p>
          </div>

          <div class="card-surface rounded-3xl p-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-on-surface-variant">This month</p>
              <span class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
                <span class="material-symbols-outlined text-(--color-primary)">calendar_month</span>
              </span>
            </div>
            <p class="mt-4 font-headline text-4xl font-extrabold text-on-surface">
              {{ metricValue(['total_this_month', 'appointments_this_month']) }}
            </p>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Appointments</p>
          </div>

          <div class="card-surface rounded-3xl p-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-on-surface-variant">No-show rate</p>
              <span class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
                <span class="material-symbols-outlined text-secondary">trending_down</span>
              </span>
            </div>
            <p class="mt-4 font-headline text-4xl font-extrabold text-on-surface">
              {{ noShowRateDisplay() }}
            </p>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Rate</p>
          </div>
        </section>
      }

      <section class="grid gap-4 md:grid-cols-3">
        <app-section-card>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-on-surface">Analytics</p>
              <p class="mt-1 text-sm text-on-surface-variant">Charts and clinic performance.</p>
            </div>
            <a class="btn-secondary shrink-0" routerLink="/admin/analytics">Open</a>
          </div>
        </app-section-card>
        <app-section-card>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-on-surface">Patients</p>
              <p class="mt-1 text-sm text-on-surface-variant">Browse patient records.</p>
            </div>
            <a class="btn-secondary shrink-0" routerLink="/admin/patients">Open</a>
          </div>
        </app-section-card>
        <app-section-card>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-on-surface">Export</p>
              <p class="mt-1 text-sm text-on-surface-variant">Download reports as CSV.</p>
            </div>
            <a class="btn-secondary shrink-0" routerLink="/admin/export">Open</a>
          </div>
        </app-section-card>
      </section>
    </main>
  `,
})
export class AdminDashboardPage {
  private static readonly ANALYTICS_CACHE_KEY = 'mf_admin_analytics_cache';
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected analytics: Record<string, unknown> = {};
  protected loadError: string | null = null;
  protected isLoading = false;
  protected lastUpdated: Date | null = null;
  protected readonly skeletonCards = Array.from({ length: 4 }, (_, idx) => idx);

  constructor() {
    this.restoreCachedAnalytics();
    this.loadAnalytics();
  }

  refresh(): void {
    this.loadAnalytics();
  }

  protected analyticsKeyCount(): number {
    return Object.keys(this.analytics).length;
  }

  exportCsv(): void {
    this.adminService.exportCsv().subscribe(({ blob, filename }) => {
      const file = new Blob([blob], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    });
  }

  protected metricValue(keys: string[]): string {
    for (const key of keys) {
      const value = this.analytics[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }

    const summary = this.analytics['summary'];
    if (summary && typeof summary === 'object') {
      for (const key of keys) {
        const value = (summary as Record<string, unknown>)[key];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
    }

    return '—';
  }

  protected noShowRateDisplay(): string {
    const value = this.metricValue(['no_show_rate', 'noshow_rate']);
    if (value === '—') {
      return '—%';
    }
    return value.endsWith('%') ? value : `${value}%`;
  }

  private loadAnalytics(): void {
    this.isLoading = true;
    this.adminService
      .analytics()
      .pipe(timeout(7000))
      .subscribe({
        next: (data) => {
          this.loadError = null;
          this.analytics = data;
          sessionStorage.setItem(AdminDashboardPage.ANALYTICS_CACHE_KEY, JSON.stringify(data));
          this.lastUpdated = new Date();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.loadError =
            error instanceof HttpErrorResponse && typeof error.error?.detail === 'string'
              ? error.error.detail
              : 'Analytics is taking too long to load. Try again in a moment.';
          this.isLoading = false;
          if (Object.keys(this.analytics).length === 0) {
            this.analytics = {};
          }
          if (!this.lastUpdated) {
            this.lastUpdated = new Date();
          }
          this.cdr.markForCheck();
        },
      });
  }

  private restoreCachedAnalytics(): void {
    const raw = sessionStorage.getItem(AdminDashboardPage.ANALYTICS_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        this.analytics = parsed;
        this.lastUpdated = new Date();
      }
    } catch {
      sessionStorage.removeItem(AdminDashboardPage.ANALYTICS_CACHE_KEY);
    }
  }
}
