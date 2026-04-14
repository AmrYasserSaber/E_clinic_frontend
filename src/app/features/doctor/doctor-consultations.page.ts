import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DoctorAppointment, DoctorService } from '../../services/doctor.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonBlockComponent } from '../../shared/ui/skeleton-block.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    SkeletonBlockComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-page-header
      title="My Consultations"
      subtitle="Review all completed consultations for your patients."
    />

    @if (loading()) {
      <div class="space-y-3">
        <app-skeleton-block [height]="70" />
        <app-skeleton-block [height]="70" />
        <app-skeleton-block [height]="70" />
      </div>
    } @else if (error()) {
      <section class="card-surface space-y-3 p-5">
        <p class="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</p>
        <button class="btn-primary" type="button" (click)="loadConsultations()">Retry</button>
      </section>
    } @else if (consultations().length === 0) {
      <app-empty-state
        title="No consultations found"
        message="Completed consultations will appear here once you finish appointments."
      />
    } @else {
      <section class="card-surface p-5">
        <div class="space-y-3">
          @for (item of consultations(); track item.id) {
            <article class="rounded-xl border border-slate-100 bg-white p-4 shadow-soft">
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div class="space-y-1">
                  <p class="font-semibold text-slate-900">{{ patientName(item) }}</p>
                  <p class="text-xs text-slate-500">
                    Appointment #{{ item.id }} · {{ item.appointment_date }} at
                    {{ item.appointment_time }}
                  </p>
                  @if (item.reason) {
                    <p class="text-sm text-slate-600">Reason: {{ item.reason }}</p>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <app-status-badge [status]="item.status" />
                  <a
                    class="btn-secondary no-underline"
                    [routerLink]="'/doctor/consultation'"
                    [queryParams]="{ appointmentId: item.id }"
                  >
                    Open EMR
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
})
export class DoctorConsultationsPage {
  private readonly doctorService = inject(DoctorService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly consultations = signal<DoctorAppointment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.loadConsultations();
  }

  protected loadConsultations(): void {
    this.loading.set(true);
    this.error.set('');

    this.doctorService
      .getAppointments({ status: 'COMPLETED' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.consultations.set(rows ?? []);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(this.extractErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected patientName(appt: DoctorAppointment): string {
    const first = appt.patient_info?.first_name ?? '';
    const last = appt.patient_info?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown patient';
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Failed to load consultations. Please try again.';
  }
}
