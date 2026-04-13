import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminService, AnalyticsByDoctor, AnalyticsFilters, AnalyticsNoShowRate, AnalyticsPeakHours, AnalyticsSummary } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { AdminNavComponent } from './admin-nav.component';

Chart.register(...registerables);

@Component({
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, AdminNavComponent],
  template: `
    <app-page-header title="Analytics" subtitle="Clinic performance analytics." />
    <app-admin-nav />
    <div class="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-soft md:grid-cols-5">
      <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="date" [(ngModel)]="filters.date_from" />
      <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="date" [(ngModel)]="filters.date_to" />
      <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Doctor ID (optional)" [(ngModel)]="filters.doctor_id" />
      <select class="rounded-lg border border-slate-200 px-3 py-2 text-sm" [(ngModel)]="groupBy">
        <option value="day">Day</option>
        <option value="week">Week</option>
      </select>
      <button class="btn-primary" (click)="loadAnalytics()">Apply Filters</button>
    </div>

    @if (isLoading) {
      <p class="mb-3 text-sm text-slate-500">Loading analytics...</p>
    }
    @if (errorText) {
      <p class="mb-3 text-sm text-rose-600">{{ errorText }}</p>
    }

    <div class="grid gap-4 md:grid-cols-4">
      <div class="card-surface p-4">
        <p class="text-xs uppercase text-slate-500">Total all time</p>
        <p class="mt-2 text-2xl font-semibold">{{ metricValue(['total_all_time', 'total_appointments', 'total']) }}</p>
      </div>
      <div class="card-surface p-4">
        <p class="text-xs uppercase text-slate-500">This week</p>
        <p class="mt-2 text-2xl font-semibold">{{ metricValue(['total_this_week', 'appointments_this_week']) }}</p>
      </div>
      <div class="card-surface p-4">
        <p class="text-xs uppercase text-slate-500">This month</p>
        <p class="mt-2 text-2xl font-semibold">{{ metricValue(['total_this_month', 'appointments_this_month']) }}</p>
      </div>
      <div class="card-surface p-4">
        <p class="text-xs uppercase text-slate-500">No-show rate</p>
        <p class="mt-2 text-2xl font-semibold">{{ metricValue(['no_show_rate', 'noshow_rate']) }}%</p>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <div class="card-surface p-4">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Status breakdown</h3>
        <canvas #statusChart></canvas>
      </div>
      <div class="card-surface p-4">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Peak hours</h3>
        <canvas #peakChart></canvas>
      </div>
      <div class="card-surface p-4 lg:col-span-2">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">No-show trend</h3>
        <canvas #trendChart></canvas>
      </div>
    </div>

    <div class="mt-4 card-surface overflow-x-auto p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-700">By doctor</h3>
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-slate-500">
            <th class="pb-2">Doctor</th>
            <th class="pb-2">Total</th>
            <th class="pb-2">Completed</th>
            <th class="pb-2">Cancelled</th>
            <th class="pb-2">No-show</th>
            <th class="pb-2">No-show %</th>
          </tr>
        </thead>
        <tbody>
          @for (row of byDoctorRows; track rowValue(row, ['doctor_id', 'id'], $index + '')) {
            <tr class="border-t border-slate-100">
              <td class="py-2">{{ rowValue(row, ['doctor_name', 'name']) }}</td>
              <td class="py-2">{{ rowValue(row, ['total']) }}</td>
              <td class="py-2">{{ rowValue(row, ['completed']) }}</td>
              <td class="py-2">{{ rowValue(row, ['cancelled']) }}</td>
              <td class="py-2">{{ rowValue(row, ['no_show', 'noShow']) }}</td>
              <td class="py-2">{{ rowValue(row, ['no_show_rate', 'noshow_rate']) }}%</td>
            </tr>
          }
          @if (byDoctorRows.length === 0) {
            <tr class="border-t border-slate-100">
              <td class="py-3 text-slate-500" colspan="6">No doctor statistics available for the selected filters.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class AdminAnalyticsPage implements AfterViewInit, OnDestroy {
  private static readonly ANALYTICS_CACHE_KEY = 'mf_admin_analytics_cache_v1';
  private static readonly ANALYTICS_CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);
  private statusChartInstance: Chart | null = null;
  private peakChartInstance: Chart | null = null;
  private trendChartInstance: Chart | null = null;

  @ViewChild('statusChart') private statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('peakChart') private peakChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') private trendChartRef?: ElementRef<HTMLCanvasElement>;

  protected filters: AnalyticsFilters = {};
  protected groupBy: 'day' | 'week' = 'day';
  protected summary: AnalyticsSummary | null = null;
  protected byDoctor: AnalyticsByDoctor | null = null;
  protected byDoctorRows: Array<Record<string, unknown>> = [];
  protected errorText: string | null = null;
  protected isLoading = false;

  ngAfterViewInit(): void {
    this.restoreCachedAnalytics();
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  protected loadAnalytics(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      summary: this.adminService.analytics(this.filters).pipe(catchError(() => of(null))),
      peak: this.adminService.analyticsPeakHours(this.filters).pipe(catchError(() => of({ items: [] } as AnalyticsPeakHours))),
      byDoctor: this.adminService.analyticsByDoctor(this.filters).pipe(catchError(() => of({ items: [] } as AnalyticsByDoctor))),
      noShow: this.adminService
        .analyticsNoShowRate({ ...this.filters, group_by: this.groupBy })
        .pipe(catchError(() => of({ group_by: this.groupBy, items: [] } as AnalyticsNoShowRate)))
    }).subscribe({
      next: ({ summary, peak, byDoctor, noShow }) => {
        this.summary = summary as AnalyticsSummary | null;
        this.byDoctor = byDoctor;
        this.byDoctorRows = this.normalizeByDoctorRows(byDoctor);
        this.renderCharts((summary ?? { status_breakdown: {} } as AnalyticsSummary), peak, noShow);
        this.isLoading = false;
        this.errorText = summary ? null : 'Some analytics endpoints failed to load.';
        this.saveCachedAnalytics({
          summary: this.summary,
          peak,
          byDoctor,
          noShow,
          byDoctorRows: this.byDoctorRows,
        });
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorText = this.readError(error, 'Unable to load analytics.');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private renderCharts(summary: AnalyticsSummary, peak: AnalyticsPeakHours, noShow: AnalyticsNoShowRate): void {
    this.destroyCharts();

    if (this.statusChartRef) {
      const statusBreakdown = this.readStatusBreakdown(summary);
      const labels = Object.keys(statusBreakdown);
      const values = Object.values(statusBreakdown);
      this.statusChartInstance = new Chart(this.statusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Appointments', data: values }]
        },
        options: { responsive: true }
      });
    }

    if (this.peakChartRef) {
      const peakItems = this.readPeakItems(peak);
      this.peakChartInstance = new Chart(this.peakChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: peakItems.map((item) => String(item.hour)),
          datasets: [{ label: 'Count', data: peakItems.map((item) => item.count) }]
        },
        options: { responsive: true }
      });
    }

    if (this.trendChartRef) {
      const trendItems = this.readNoShowItems(noShow);
      this.trendChartInstance = new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: trendItems.map((item) => String(item['period'])),
          datasets: [{ label: 'No-show rate %', data: trendItems.map((item) => Number(item['no_show_rate'] ?? 0)) }]
        },
        options: { responsive: true }
      });
    }
  }

  protected metricValue(keys: string[]): string {
    const source = (this.summary ?? {}) as Record<string, unknown>;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    const nested = source['summary'];
    if (nested && typeof nested === 'object') {
      const nestedRecord = nested as Record<string, unknown>;
      for (const key of keys) {
        const value = nestedRecord[key];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
    }
    return '—';
  }

  protected rowValue(row: Record<string, unknown>, keys: string[], fallback = '—'): string {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return fallback;
  }

  private normalizeByDoctorRows(source: AnalyticsByDoctor | null): Array<Record<string, unknown>> {
    if (!source) return [];
    const raw = source as unknown as Record<string, unknown>;
    const fromItems = raw['items'];
    if (Array.isArray(fromItems)) return fromItems as Array<Record<string, unknown>>;
    const fromResults = raw['results'];
    if (Array.isArray(fromResults)) return fromResults as Array<Record<string, unknown>>;
    const fromData = raw['data'];
    if (Array.isArray(fromData)) return fromData as Array<Record<string, unknown>>;
    if (Array.isArray(source as unknown)) return source as unknown as Array<Record<string, unknown>>;
    return [];
  }

  private readStatusBreakdown(summary: AnalyticsSummary): Record<string, number> {
    const raw = summary as unknown as Record<string, unknown>;
    const direct = raw['status_breakdown'];
    if (direct && typeof direct === 'object') {
      return direct as Record<string, number>;
    }
    const nested = raw['summary'];
    if (nested && typeof nested === 'object') {
      const nestedBreakdown = (nested as Record<string, unknown>)['status_breakdown'];
      if (nestedBreakdown && typeof nestedBreakdown === 'object') {
        return nestedBreakdown as Record<string, number>;
      }
    }
    return {};
  }

  private readPeakItems(peak: AnalyticsPeakHours): Array<{ hour: number; count: number }> {
    const raw = peak as unknown as Record<string, unknown>;
    const direct = raw['items'];
    if (Array.isArray(direct)) {
      return direct as Array<{ hour: number; count: number }>;
    }
    const results = raw['results'];
    if (Array.isArray(results)) {
      return results as Array<{ hour: number; count: number }>;
    }
    return [];
  }

  private readNoShowItems(noShow: AnalyticsNoShowRate): Array<Record<string, unknown>> {
    const raw = noShow as unknown as Record<string, unknown>;
    const direct = raw['items'];
    if (Array.isArray(direct)) {
      return direct as Array<Record<string, unknown>>;
    }
    const results = raw['results'];
    if (Array.isArray(results)) {
      return results as Array<Record<string, unknown>>;
    }
    return [];
  }

  private destroyCharts(): void {
    this.statusChartInstance?.destroy();
    this.peakChartInstance?.destroy();
    this.trendChartInstance?.destroy();
    this.statusChartInstance = null;
    this.peakChartInstance = null;
    this.trendChartInstance = null;
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return fallback;
  }

  private analyticsQueryKey(): string {
    return JSON.stringify({
      date_from: this.filters.date_from ?? '',
      date_to: this.filters.date_to ?? '',
      doctor_id: this.filters.doctor_id ?? '',
      groupBy: this.groupBy,
    });
  }

  private restoreCachedAnalytics(): void {
    const raw = localStorage.getItem(AdminAnalyticsPage.ANALYTICS_CACHE_KEY);
    if (!raw) return;
    try {
      const cached = JSON.parse(raw) as {
        queryKey: string;
        cachedAt: number;
        payload: {
          summary: AnalyticsSummary | null;
          peak: AnalyticsPeakHours;
          byDoctor: AnalyticsByDoctor;
          noShow: AnalyticsNoShowRate;
          byDoctorRows: Array<Record<string, unknown>>;
        };
      };
      if (!cached || !cached.payload) return;
      if (Date.now() - cached.cachedAt > AdminAnalyticsPage.ANALYTICS_CACHE_TTL_MS) {
        localStorage.removeItem(AdminAnalyticsPage.ANALYTICS_CACHE_KEY);
        return;
      }
      if (cached.queryKey !== this.analyticsQueryKey()) {
        return;
      }
      this.summary = cached.payload.summary;
      this.byDoctor = cached.payload.byDoctor;
      this.byDoctorRows = cached.payload.byDoctorRows ?? [];
      this.renderCharts(
        (cached.payload.summary ?? { status_breakdown: {} } as AnalyticsSummary),
        cached.payload.peak,
        cached.payload.noShow,
      );
    } catch {
      localStorage.removeItem(AdminAnalyticsPage.ANALYTICS_CACHE_KEY);
    }
  }

  private saveCachedAnalytics(payload: {
    summary: AnalyticsSummary | null;
    peak: AnalyticsPeakHours;
    byDoctor: AnalyticsByDoctor;
    noShow: AnalyticsNoShowRate;
    byDoctorRows: Array<Record<string, unknown>>;
  }): void {
    localStorage.setItem(
      AdminAnalyticsPage.ANALYTICS_CACHE_KEY,
      JSON.stringify({
        queryKey: this.analyticsQueryKey(),
        cachedAt: Date.now(),
        payload,
      }),
    );
  }
}
