import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DoctorAppointment, DoctorService } from '../../services/doctor.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonBlockComponent } from '../../shared/ui/skeleton-block.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent, SkeletonBlockComponent, StatusBadgeComponent],
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
                  <button class="btn-secondary" type="button" (click)="toggleDetails(item.id)">
                    {{ expandedConsultationId() === item.id ? 'Hide' : 'View' }}
                  </button>
                </div>
              </div>

              @if (expandedConsultationId() === item.id) {
                <div class="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Diagnosis
                  </p>
                  <p class="text-sm text-slate-700">
                    {{ item.consultation_summary?.diagnosis || 'No diagnosis recorded.' }}
                  </p>

                  @if (item.consultation_summary?.notes?.trim()) {
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                    </p>
                    <p class="whitespace-pre-wrap text-sm text-slate-700">
                      {{ item.consultation_summary?.notes }}
                    </p>
                  }

                  @if ((item.consultation_summary?.requested_tests?.length ?? 0) > 0) {
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested tests
                    </p>
                    <ul class="list-disc pl-5 text-sm text-slate-700">
                      @for (test of item.consultation_summary!.requested_tests; track test) {
                        <li>{{ test }}</li>
                      }
                    </ul>
                  }
                </div>
              }
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
  protected readonly expandedConsultationId = signal<number | null>(null);

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

  protected toggleDetails(id: number): void {
    this.expandedConsultationId.update((current) => (current === id ? null : id));
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Failed to load consultations. Please try again.';
  }
}
