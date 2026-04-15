import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast/toast.service';
import { Appointment } from '../../models/domain.models';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mb-8 pt-2">
      <h2 class="font-headline text-3xl font-extrabold tracking-tight text-(--color-on-surface)">
        Consultations History
      </h2>
      <p class="mt-2 text-sm font-medium text-on-surface-variant">
        Review diagnoses, notes, requested tests, and prescriptions from your completed visits.
      </p>
    </div>

    @if (isLoading) {
      <div class="card-surface p-6 text-center text-sm text-on-surface-variant">
        Loading consultations...
      </div>
    } @else if (!consultations.length) {
      <div class="card-surface bg-surface-container-low p-8 text-center">
        <p class="font-bold text-(--color-on-surface)">No consultations yet</p>
        <p class="mt-1 text-sm text-on-surface-variant">
          Consultation details will appear after doctor completes your visit.
        </p>
        <a routerLink="/patient/appointments" class="btn-primary mt-4 inline-block no-underline"
          >Go to appointments</a
        >
      </div>
    } @else {
      <div class="space-y-5 pb-10">
        @for (appt of consultations; track appt.id) {
          <article class="card-surface rounded-3xl p-6">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="font-headline text-lg font-bold text-(--color-on-surface)">
                  {{ appt.doctor.fullName }}
                </h3>
                <p class="text-xs text-on-surface-variant">
                  {{ formatDisplayDate(appt.date) }} at {{ formatDisplayTime(appt.time) }} ·
                  Appointment #{{ appt.id }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <a
                  routerLink="/patient/appointments"
                  class="glass-panel rounded-full px-3 py-1 text-xs font-semibold text-(--color-on-surface) no-underline"
                >
                  Completed
                </a>
                <button class="btn-secondary" type="button" (click)="toggleDetails(appt.id)">
                  {{ expandedConsultationId === appt.id ? 'Hide' : 'View' }}
                </button>
              </div>
            </div>

            @if (expandedConsultationId === appt.id) {
              <div class="space-y-4">
                <section class="rounded-3xl bg-surface-container-low p-4">
                  <p
                    class="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  >
                    Diagnosis
                  </p>
                  <p class="text-sm font-medium text-(--color-on-surface)">
                    {{ appt.consultationSummary?.diagnosis || 'No diagnosis recorded.' }}
                  </p>
                </section>

                @if (appt.consultationSummary?.notes?.trim()) {
                  <section class="rounded-3xl bg-surface-container-low p-4">
                    <p
                      class="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    >
                      Doctor Notes
                    </p>
                    <p class="whitespace-pre-wrap text-sm font-medium text-(--color-on-surface)">
                      {{ appt.consultationSummary?.notes }}
                    </p>
                  </section>
                }

                @if ((appt.consultationSummary?.requestedTests?.length ?? 0) > 0) {
                  <section class="rounded-3xl bg-surface-container-low p-4">
                    <p
                      class="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    >
                      Requested Tests
                    </p>
                    <ul
                      class="list-disc space-y-1 pl-5 text-sm font-medium text-(--color-on-surface)"
                    >
                      @for (test of appt.consultationSummary!.requestedTests; track test) {
                        <li>{{ test }}</li>
                      }
                    </ul>
                  </section>
                }

                @if ((appt.consultationSummary?.prescriptionItems?.length ?? 0) > 0) {
                  <section class="rounded-3xl bg-surface-container-low p-4">
                    <p
                      class="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    >
                      Prescriptions
                    </p>
                    <div class="space-y-2">
                      @for (item of appt.consultationSummary!.prescriptionItems; track item.id) {
                        <article class="card-surface rounded-2xl p-3">
                          <p class="text-sm font-semibold text-(--color-on-surface)">
                            {{ item.drug }}
                          </p>
                          <p class="text-xs font-medium text-on-surface-variant">
                            Dose: {{ item.dose }} · Duration: {{ item.duration }}
                          </p>
                          @if (item.instructions?.trim()) {
                            <p class="mt-1 text-xs font-medium text-on-surface-variant">
                              Instructions: {{ item.instructions }}
                            </p>
                          }
                        </article>
                      }
                    </div>
                  </section>
                }
              </div>
            }
          </article>
        }
      </div>
    }
  `,
})
export class ConsultationsHistoryPage implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);

  protected consultations: Appointment[] = [];
  protected isLoading = false;
  protected expandedConsultationId: string | null = null;

  ngOnInit(): void {
    this.loadConsultations();
  }

  protected formatDisplayDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map((n) => Number(n));
    const date = new Date(y, (m || 1) - 1, d || 1);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  protected formatDisplayTime(time: string): string {
    const [hRaw, mRaw] = time.split(':');
    const hour = Number(hRaw || '0');
    const minute = Number(mRaw || '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  protected toggleDetails(id: string): void {
    this.expandedConsultationId = this.expandedConsultationId === id ? null : id;
  }

  private loadConsultations(): void {
    this.isLoading = true;
    this.appointmentsService.list({ status: 'COMPLETED' }).subscribe({
      next: (rows) => {
        this.consultations = rows.filter((item) => !!item.consultationSummary);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toast.error(this.extractError(err), 'Could not load consultations');
        this.consultations = [];
      },
    });
  }

  private extractError(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    return 'Please try again.';
  }
}
