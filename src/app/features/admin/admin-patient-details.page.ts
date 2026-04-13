import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AdminService, PatientRow } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { AdminNavComponent } from './admin-nav.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, RouterLink, AdminNavComponent],
  template: `
    <app-page-header title="Patient Details" subtitle="Read-only patient profile details." />
    <app-admin-nav />
    <a class="mb-3 inline-block text-sm text-cyan-700 underline" routerLink="/admin/patients">Back to patients</a>
    <div class="card-surface p-4">
      @if (errorText) {
        <p class="text-sm text-rose-600">{{ errorText }}</p>
      } @else if (isLoading) {
        <p class="text-sm text-slate-500">Loading patient details...</p>
      } @else if (!patient) {
        <p class="text-sm text-slate-500">No patient details found.</p>
      } @else {
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs uppercase text-slate-500">Name</p>
            <p class="text-sm">{{ patient.first_name }} {{ patient.last_name }}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Email</p>
            <p class="text-sm">{{ patient.email }}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Phone</p>
            <p class="text-sm">{{ patient.phone_number ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Date of birth</p>
            <p class="text-sm">{{ patient.date_of_birth ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase text-slate-500">Active</p>
            <p class="text-sm">{{ patient.is_active ? 'Yes' : 'No' }}</p>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminPatientDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected patient: PatientRow | null = null;
  protected errorText: string | null = null;
  protected isLoading = true;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.errorText = 'Invalid patient id.';
      this.isLoading = false;
      return;
    }

    this.adminService.patientDetails(id)
      .pipe(
        timeout(7000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (patient) => {
          this.patient = patient;
          this.errorText = null;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.errorText = this.readError(error, 'Loading patient details took too long. Please try again.');
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
