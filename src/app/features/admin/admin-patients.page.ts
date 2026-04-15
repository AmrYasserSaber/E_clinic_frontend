import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, PatientRow } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, RouterLink],
  template: `
    <app-page-header title="Patients" subtitle="Browse and inspect patient records." />
    <div
      class="mb-4 grid gap-3 rounded-3xl bg-surface-container-lowest p-4 shadow-soft md:grid-cols-4"
    >
      <input class="input-ui" placeholder="Search by name/email" [(ngModel)]="search" />
      <button class="btn-secondary md:col-span-1" (click)="applySearch()">Apply</button>
    </div>

    <div class="card-surface overflow-x-auto p-4">
      @if (isLoading && patients.length === 0) {
        <p class="mb-3 text-sm text-on-surface-variant">Loading patients...</p>
      } @else if (showRefreshing) {
        <p class="mb-3 text-xs text-(--color-primary)">Refreshing patients...</p>
      }
      @if (errorText) {
        <p class="mb-3 text-sm text-error">{{ errorText }}</p>
      }
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-on-surface-variant">
            <th class="pb-2">Name</th>
            <th class="pb-2">Email</th>
            <th class="pb-2">Phone</th>
            <th class="pb-2">Active</th>
            <th class="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (patient of visiblePatients; track patient.id) {
            <tr class="border-t border-outline-variant/15">
              <td class="py-2">{{ patient.first_name }} {{ patient.last_name }}</td>
              <td class="py-2">{{ patient.email }}</td>
              <td class="py-2">{{ patient.phone_number ?? '—' }}</td>
              <td class="py-2">{{ patient.is_active ? 'Yes' : 'No' }}</td>
              <td class="py-2">
                <a
                  class="text-(--color-primary) underline"
                  [routerLink]="['/admin/patients', patient.id]"
                  >View details</a
                >
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div class="mt-3 flex items-center justify-between text-sm">
        <p class="text-on-surface-variant">
          Showing {{ visiblePatients.length }} of {{ totalCount }} patients
        </p>
        <div class="flex gap-2">
          <button class="btn-secondary" [disabled]="page <= 1" (click)="changePage(page - 1)">
            Previous
          </button>
          <button class="btn-secondary" [disabled]="!hasNextPage" (click)="changePage(page + 1)">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdminPatientsPage {
  private static readonly PATIENTS_CACHE_KEY = 'mf_admin_patients_cache_v1';
  private static readonly PATIENTS_CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);
  private requestVersion = 0;
  private refreshIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

  protected patients: PatientRow[] = [];
  protected visiblePatients: PatientRow[] = [];
  protected search = '';
  protected page = 1;
  protected readonly pageSize = 10;
  protected totalCount = 0;
  protected hasNextPage = false;
  protected errorText: string | null = null;
  protected isLoading = false;
  protected showRefreshing = false;

  constructor() {
    this.restoreCachedPatients();
    this.fetchPatients();
  }

  protected changePage(nextPage: number): void {
    this.page = nextPage;
    this.fetchPatients();
  }

  protected applySearch(): void {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      this.visiblePatients = this.patients;
    } else {
      this.visiblePatients = this.patients.filter((item) => {
        const name = `${item.first_name} ${item.last_name}`.toLowerCase();
        return name.includes(term) || item.email.toLowerCase().includes(term);
      });
    }
    this.cdr.markForCheck();
  }

  private fetchPatients(): void {
    const currentRequestVersion = ++this.requestVersion;
    this.isLoading = true;
    this.showRefreshing = false;
    if (this.refreshIndicatorTimer) {
      clearTimeout(this.refreshIndicatorTimer);
      this.refreshIndicatorTimer = null;
    }
    if (this.patients.length > 0) {
      this.refreshIndicatorTimer = setTimeout(() => {
        if (this.isLoading && currentRequestVersion === this.requestVersion) {
          this.showRefreshing = true;
          this.cdr.markForCheck();
        }
      }, 300);
    }

    this.adminService
      .patients({
        page: String(this.page),
        page_size: String(this.pageSize),
      })
      .subscribe({
        next: (response) => {
          if (currentRequestVersion !== this.requestVersion) return;
          this.errorText = null;
          const payload = response as unknown;
          const items = Array.isArray(payload)
            ? payload
            : ((payload as { results?: PatientRow[] }).results ?? []);
          const count = Array.isArray(payload)
            ? items.length
            : ((payload as { count?: number }).count ?? items.length);
          const next = Array.isArray(payload)
            ? null
            : ((payload as { next?: string | null }).next ?? null);

          this.patients = items;
          this.totalCount = count;
          this.hasNextPage = Boolean(next);
          this.applySearch();
          this.saveCachedPatients();
          this.finishLoading();
        },
        error: (error: unknown) => {
          if (currentRequestVersion !== this.requestVersion) return;
          this.errorText = this.readError(error, 'Unable to load patients.');
          this.finishLoading();
        },
      });
  }

  private finishLoading(): void {
    this.isLoading = false;
    this.showRefreshing = false;
    if (this.refreshIndicatorTimer) {
      clearTimeout(this.refreshIndicatorTimer);
      this.refreshIndicatorTimer = null;
    }
    this.cdr.markForCheck();
  }

  private saveCachedPatients(): void {
    try {
      localStorage.setItem(
        AdminPatientsPage.PATIENTS_CACHE_KEY,
        JSON.stringify({
          page: this.page,
          pageSize: this.pageSize,
          search: this.search.trim().toLowerCase(),
          cachedAt: Date.now(),
          payload: {
            patients: this.patients,
            totalCount: this.totalCount,
            hasNextPage: this.hasNextPage,
          },
        }),
      );
    } catch {
      // Ignore cache failures.
    }
  }

  private restoreCachedPatients(): void {
    const raw = localStorage.getItem(AdminPatientsPage.PATIENTS_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        page?: number;
        pageSize?: number;
        search?: string;
        cachedAt?: number;
        payload?: { patients?: PatientRow[]; totalCount?: number; hasNextPage?: boolean };
      };
      const isExpired =
        typeof parsed.cachedAt !== 'number' ||
        Date.now() - parsed.cachedAt > AdminPatientsPage.PATIENTS_CACHE_TTL_MS;
      const cacheMatchesPage = parsed.page === this.page && parsed.pageSize === this.pageSize;
      if (isExpired || !cacheMatchesPage || !parsed.payload) {
        localStorage.removeItem(AdminPatientsPage.PATIENTS_CACHE_KEY);
        return;
      }
      this.patients = Array.isArray(parsed.payload.patients) ? parsed.payload.patients : [];
      this.totalCount =
        typeof parsed.payload.totalCount === 'number'
          ? parsed.payload.totalCount
          : this.patients.length;
      this.hasNextPage = Boolean(parsed.payload.hasNextPage);
      this.visiblePatients = this.patients;
    } catch {
      localStorage.removeItem(AdminPatientsPage.PATIENTS_CACHE_KEY);
    }
  }

  private readError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return fallback;
  }
}
