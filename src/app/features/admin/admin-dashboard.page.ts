import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../shared/ui/section-card.component';
import { AdminNavComponent } from './admin-nav.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, SectionCardComponent, AdminNavComponent],
  template: `
    <app-page-header title="Admin Dashboard" subtitle="Clinic analytics and export controls." />
    <app-admin-nav />
    @if (isLoading) {
      <p class="mb-2 text-sm text-slate-500">Loading analytics...</p>
    }
    @if (loadError) {
      <p class="mb-4 text-sm text-rose-600">{{ loadError }}</p>
    }
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <app-section-card>
        <p class="text-sm text-slate-500">Total appointments (all time)</p>
        <p class="text-2xl font-semibold">{{ metricValue(['total_all_time', 'total_appointments', 'total']) }}</p>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">Appointments this week</p>
        <p class="text-2xl font-semibold">{{ metricValue(['total_this_week', 'appointments_this_week']) }}</p>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">Appointments this month</p>
        <p class="text-2xl font-semibold">{{ metricValue(['total_this_month', 'appointments_this_month']) }}</p>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">No-show rate</p>
        <p class="text-2xl font-semibold">{{ noShowRateDisplay() }}</p>
      </app-section-card>
    </div>
  `
})
export class AdminDashboardPage {
  private static readonly ANALYTICS_CACHE_KEY = 'mf_admin_analytics_cache';
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected analytics: Record<string, unknown> = {};
  protected loadError: string | null = null;
  protected isLoading = false;

  constructor() {
    this.restoreCachedAnalytics();
    this.loadAnalytics();
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
    this.adminService.analytics()
      .pipe(timeout(7000))
      .subscribe({
        next: (data) => {
          this.loadError = null;
          this.analytics = data;
          sessionStorage.setItem(
            AdminDashboardPage.ANALYTICS_CACHE_KEY,
            JSON.stringify(data)
          );
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
          this.cdr.markForCheck();
        }
      });
  }

  private restoreCachedAnalytics(): void {
    const raw = sessionStorage.getItem(AdminDashboardPage.ANALYTICS_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        this.analytics = parsed;
      }
    } catch {
      sessionStorage.removeItem(AdminDashboardPage.ANALYTICS_CACHE_KEY);
    }
  }
}
