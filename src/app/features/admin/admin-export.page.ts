import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AppointmentStatus } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { AdminNavComponent } from './admin-nav.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, AdminNavComponent],
  template: `
    <app-page-header title="Export" subtitle="Download reports as CSV." />
    <app-admin-nav />
    <div class="card-surface p-4">
      <div class="grid gap-3 md:grid-cols-4">
        <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="date" [(ngModel)]="filters.date_from" />
        <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" type="date" [(ngModel)]="filters.date_to" />
        <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Doctor ID (optional)" [(ngModel)]="filters.doctor_id" />
      </div>

      <div class="mt-4">
        <p class="mb-2 text-sm font-medium text-slate-700">Statuses</p>
        <div class="flex flex-wrap gap-2">
          @for (status of statuses; track status) {
            <label class="inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-xs">
              <input type="checkbox" [checked]="selectedStatusSet.has(status)" (change)="toggleStatus(status)" />
              {{ status }}
            </label>
          }
        </div>
      </div>

      @if (errorText) {
        <p class="mt-3 text-sm text-rose-600">{{ errorText }}</p>
      }
      @if (successText) {
        <p class="mt-3 text-sm text-emerald-600">{{ successText }}</p>
      }

      <div class="mt-4">
        <button class="btn-primary" (click)="download()" [disabled]="downloading">
          {{ downloading ? 'Exporting...' : 'Export CSV' }}
        </button>
      </div>
    </div>
  `
})
export class AdminExportPage {
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected filters: { date_from?: string; date_to?: string; doctor_id?: string } = {};
  protected readonly statuses: AppointmentStatus[] = [
    'REQUESTED',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
  ];
  protected readonly selectedStatusSet = new Set<AppointmentStatus>();
  protected downloading = false;
  protected errorText: string | null = null;
  protected successText: string | null = null;

  protected toggleStatus(status: AppointmentStatus): void {
    if (this.selectedStatusSet.has(status)) {
      this.selectedStatusSet.delete(status);
    } else {
      this.selectedStatusSet.add(status);
    }
    this.cdr.markForCheck();
  }

  protected download(): void {
    this.downloading = true;
    this.errorText = null;
    this.successText = null;
    this.cdr.markForCheck();

    this.adminService.exportCsv({
      ...this.filters,
      status: Array.from(this.selectedStatusSet)
    }).subscribe({
      next: ({ blob, filename }) => {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
        this.successText = `Downloaded ${filename}`;
        this.downloading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorText = this.readError(error, 'Export failed.');
        this.downloading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return fallback;
  }
}
