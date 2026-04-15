import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DoctorAppointment, DoctorScheduleDay, DoctorService } from '../../services/doctor.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { SkeletonBlockComponent } from '../../shared/ui/skeleton-block.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent, SkeletonBlockComponent, StatusBadgeComponent],
  template: `
    <app-page-header
      title="Doctor Schedule"
      subtitle="Your upcoming patients and assigned slots by date."
    />

    <section class="card-surface mb-5 p-5">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-(--color-on-surface)">Upcoming 7 Days</h2>
        <p class="text-xs text-on-surface-variant">From {{ todayIso }} to {{ datePlusSevenIso }}</p>
      </div>

      @if (upcomingError()) {
        <p
          class="ghost-outline mb-3 rounded-2xl bg-error/8 px-3 py-2 text-sm font-medium text-error"
        >
          {{ upcomingError() }}
        </p>
      }

      @if (loadingUpcoming()) {
        <p class="text-sm text-on-surface-variant">Loading appointments...</p>
      } @else if (upcoming().length === 0) {
        <app-empty-state
          title="No upcoming appointments"
          message="There are no appointments in the next seven days."
        />
      } @else {
        <div class="space-y-3">
          @for (appt of upcoming(); track appt.id) {
            <article class="rounded-3xl bg-surface-container-low p-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-(--color-on-surface)">
                    {{ patientName(appt) }}
                  </p>
                  <p class="text-xs text-on-surface-variant">
                    {{ appt.appointment_date }} at {{ appt.appointment_time }}
                  </p>
                </div>
                <app-status-badge [status]="appt.status" />
              </div>
            </article>
          }
        </div>
      }
    </section>

    @if (loading()) {
      <div class="space-y-4">
        <app-skeleton-block [height]="56" />
        <app-skeleton-block [height]="56" />
        <app-skeleton-block [height]="56" />
      </div>
    } @else if (error()) {
      <section class="card-surface space-y-3 p-5">
        <p class="ghost-outline rounded-2xl bg-error/8 px-3 py-2 text-sm font-medium text-error">
          {{ error() }}
        </p>
        <button class="btn-primary" type="button" (click)="loadSchedule()">Retry</button>
      </section>
    } @else if (scheduleDays().length > 0) {
      <div class="space-y-5">
        @for (day of scheduleDays(); track day.date) {
          <section class="card-surface p-5">
            <h2 class="mb-3 text-base font-semibold text-(--color-on-surface)">
              {{ formatDate(day.date) }}
            </h2>

            <div class="space-y-2">
              @for (slot of day.slots; track slot.id) {
                <article
                  class="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-surface-container-low p-3"
                >
                  <div>
                    <p class="text-sm font-semibold text-(--color-on-surface)">
                      {{ slot.start_time }} - {{ slot.end_time }}
                    </p>
                    <p class="text-xs text-on-surface-variant">
                      Duration: {{ slot.duration_minutes }} min
                    </p>
                  </div>

                  <span
                    class="glass-panel rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
                    [class]="slot.is_available ? 'text-secondary' : 'text-on-surface-variant'"
                  >
                    {{ slot.is_available ? 'Available' : 'Booked' }}
                  </span>
                </article>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class DoctorScheduleComponent {
  private readonly doctorService = inject(DoctorService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly scheduleDays = signal<DoctorScheduleDay[]>([]);
  protected readonly upcoming = signal<DoctorAppointment[]>([]);
  protected readonly loadingUpcoming = signal(true);
  protected readonly upcomingError = signal('');

  protected readonly todayIso = this.toDateOnly(new Date());
  protected readonly datePlusSevenIso = this.toDateOnly(this.addDays(new Date(), 7));

  constructor() {
    this.loadSchedule();
    this.loadUpcomingAppointments();
  }

  protected loadSchedule(): void {
    this.loading.set(true);
    this.error.set('');

    this.doctorService
      .getSchedule()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.scheduleDays.set(response.items ?? []);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(this.extractErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  protected patientName(appt: DoctorAppointment): string {
    const first = appt.patient_info?.first_name ?? '';
    const last = appt.patient_info?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown patient';
  }

  private loadUpcomingAppointments(): void {
    this.loadingUpcoming.set(true);
    this.upcomingError.set('');
    this.doctorService
      .getAppointments({
        date_from: this.todayIso,
        date_to: this.datePlusSevenIso,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.upcoming.set(this.filterUpcomingFromNowPlusThirty(rows));
          this.loadingUpcoming.set(false);
        },
        error: (err: unknown) => {
          this.upcomingError.set(this.extractErrorMessage(err));
          this.loadingUpcoming.set(false);
        },
      });
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Failed to load schedule. Please try again.';
  }

  private addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  }

  private toDateOnly(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private filterUpcomingFromNowPlusThirty(rows: DoctorAppointment[]): DoctorAppointment[] {
    const threshold = new Date(Date.now() + 30 * 60 * 1000);
    return rows.filter((row) => {
      const appointmentDateTime = this.toAppointmentDateTime(row);
      if (!appointmentDateTime) {
        return true;
      }
      return appointmentDateTime.getTime() >= threshold.getTime();
    });
  }

  private toAppointmentDateTime(row: DoctorAppointment): Date | null {
    const [year, month, day] = row.appointment_date.split('-').map((n) => Number(n));
    const [hour, minute] = row.appointment_time.split(':').map((n) => Number(n));
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute)
    ) {
      return null;
    }
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }
}
