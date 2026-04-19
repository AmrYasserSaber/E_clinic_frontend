import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../core/toast/toast.service';
import { Appointment, AppointmentStatus } from '../../models/domain.models';
import { AppointmentsService } from '../../services/appointments.service';

type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto w-full max-w-6xl space-y-6 pb-10 pt-2">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h2 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            My Appointments
          </h2>
          <p class="text-sm font-medium text-on-surface-variant">
            Manage your health schedule and upcoming clinical visits.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a
            routerLink="/patient/book"
            class="btn-primary inline-flex items-center gap-2 no-underline"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span>
            Book appointment
          </a>
        </div>
      </header>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          class="grid w-full grid-cols-3 gap-1 rounded-3xl bg-surface-container-low p-1.5 sm:w-auto"
        >
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-center transition hover:bg-surface-container-lowest active:scale-[0.99]"
              [class.bg-surface-container-lowest]="activeTab === tab.id"
              [class.shadow-soft]="activeTab === tab.id"
              [class.text-(--color-primary)]="activeTab === tab.id"
              [class.text-on-surface-variant]="activeTab !== tab.id"
              (click)="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          }
        </div>
        <div class="text-xs font-semibold text-on-surface-variant">
          {{ filteredAppointments.length }} result{{ filteredAppointments.length === 1 ? '' : 's' }}
        </div>
      </div>

      @if (isLoading) {
        <div class="card-surface rounded-4xl p-8 text-center text-sm text-on-surface-variant">
          Loading appointments...
        </div>
      } @else if (!filteredAppointments.length) {
        <div class="card-surface rounded-4xl p-10 text-center">
          <div
            class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-surface-container-low"
          >
            <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
              >event</span
            >
          </div>
          <p class="font-headline text-lg font-bold text-on-surface">No appointments here yet</p>
          <p class="mt-1 text-sm font-medium text-on-surface-variant">
            Book a visit to see it listed under this tab.
          </p>
          <a
            routerLink="/patient/book"
            class="btn-primary mt-5 inline-flex items-center gap-2 no-underline"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Book appointment
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 pb-24 lg:grid-cols-2">
          @for (appt of filteredAppointments; track appt.id) {
            <article
              class="card-surface overflow-hidden rounded-4xl transition hover:-translate-y-0.5"
            >
              <div class="p-6 sm:p-7">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-start gap-4">
                    <div
                      class="glass-panel grid h-14 w-14 shrink-0 place-items-center rounded-3xl text-base font-bold text-(--color-primary)"
                    >
                      {{ initials(appt.doctor.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <h3 class="truncate font-headline text-lg font-bold text-on-surface">
                        {{ appt.doctor.fullName }}
                      </h3>
                      <p class="truncate text-sm font-medium text-on-surface-variant">
                        {{ appt.doctor.specialty.trim() ? appt.doctor.specialty : 'Physician' }}
                      </p>
                    </div>
                  </div>
                  <span
                    class="glass-panel shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest"
                    [class]="statusPillClass(appt.status)"
                  >
                    {{ statusLabel(appt.status) }}
                  </span>
                </div>

                <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div class="flex items-center gap-3 rounded-3xl bg-surface-container-low p-4">
                    <div class="glass-panel grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
                      <span
                        class="material-symbols-outlined text-(--color-primary)"
                        aria-hidden="true"
                        >calendar_today</span
                      >
                    </div>
                    <div class="min-w-0">
                      <span
                        class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
                        >Date</span
                      >
                      <div class="truncate text-sm font-bold text-on-surface">
                        {{ formatDisplayDate(appt.date) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 rounded-3xl bg-surface-container-low p-4">
                    <div class="glass-panel grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
                      <span
                        class="material-symbols-outlined text-(--color-primary)"
                        aria-hidden="true"
                        >schedule</span
                      >
                    </div>
                    <div class="min-w-0">
                      <span
                        class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
                        >Time</span
                      >
                      <div class="truncate text-sm font-bold text-on-surface">
                        {{ formatDisplayTime(appt.time) }}
                      </div>
                    </div>
                  </div>
                </div>

                @if (appt.reason.trim()) {
                  <div
                    class="mt-4 rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface-variant"
                  >
                    {{ appt.reason }}
                  </div>
                }

                <div class="mt-5 flex flex-wrap items-center gap-3">
                  @if (canReschedule(appt) || canCancel(appt)) {
                    @if (canReschedule(appt)) {
                      <a
                        [routerLink]="['/patient/book']"
                        [queryParams]="{ rescheduleId: appt.id }"
                        class="min-w-0 flex-1 rounded-3xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-(--color-primary) no-underline transition hover:bg-primary/15 active:scale-[0.99]"
                      >
                        Reschedule
                      </a>
                    }
                    @if (canCancel(appt)) {
                      <button
                        type="button"
                        class="min-w-0 flex-1 rounded-3xl bg-error/10 px-4 py-3 text-sm font-bold text-error transition hover:bg-error/15 active:scale-[0.99] disabled:opacity-60"
                        [disabled]="cancellingId === appt.id"
                        (click)="cancelAppointment(appt)"
                      >
                        {{ cancellingId === appt.id ? 'Cancelling...' : 'Cancel' }}
                      </button>
                    }
                  } @else {
                    <span class="min-w-0 flex-1 text-sm text-on-surface-variant"
                      >No actions for this visit.</span
                    >
                  }
                  <div class="ml-auto flex items-center">
                    <div
                      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br from-(--color-primary) to-(--color-primary-container) text-white shadow-soft"
                      [attr.title]="
                        appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN'
                          ? 'Confirmed visit'
                          : 'Appointment'
                      "
                    >
                      <span class="material-symbols-outlined">event_available</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          }

          <a
            routerLink="/patient/book"
            class="card-surface lg:col-span-2 flex w-full flex-col items-center justify-center rounded-4xl bg-surface-container-low p-10 text-center no-underline transition hover:bg-surface-container-high"
          >
            <div class="glass-panel mb-4 grid h-14 w-14 place-items-center rounded-3xl">
              <span class="material-symbols-outlined text-3xl text-(--color-primary)">add</span>
            </div>
            <p class="mb-1 font-headline text-base font-bold text-on-surface">
              Schedule a new checkup
            </p>
            <p class="max-w-[220px] text-xs font-medium text-on-surface-variant">
              Keep your health in check by booking your next visit today.
            </p>
          </a>
        </div>
      }
    </div>
  `,
})
export class MyAppointmentsPage implements OnInit {
  private readonly service = inject(AppointmentsService);
  private readonly toast = inject(ToastService);

  protected readonly tabs: { id: AppointmentTab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  protected activeTab: AppointmentTab = 'upcoming';
  protected appointments: Appointment[] = [];
  protected isLoading = false;
  protected cancellingId: string | null = null;

  ngOnInit(): void {
    this.loadAppointments();
  }

  protected get filteredAppointments(): Appointment[] {
    const rows = this.appointments.filter((a) => {
      if (this.activeTab === 'cancelled') return a.status === 'CANCELLED';
      if (a.status === 'CANCELLED') return false;
      const past = this.isPastAppointment(a);
      return this.activeTab === 'past' ? past : !past;
    });
    return this.sortForTab(rows);
  }

  protected cancelAppointment(appt: Appointment): void {
    this.cancellingId = appt.id;
    this.service
      .cancel(appt.id)
      .pipe(finalize(() => (this.cancellingId = null)))
      .subscribe({
        next: () => {
          this.toast.success('Appointment cancelled.');
          this.loadAppointments();
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(this.extractError(err), 'Cancel failed');
        },
      });
  }

  protected canReschedule(appt: Appointment): boolean {
    return appt.status === 'REQUESTED' || appt.status === 'CONFIRMED';
  }

  protected canCancel(appt: Appointment): boolean {
    return appt.status === 'REQUESTED' || appt.status === 'CONFIRMED';
  }

  protected statusLabel(status: AppointmentStatus): string {
    switch (status) {
      case 'REQUESTED':
        return 'Requested';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CHECKED_IN':
        return 'Checked in';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_SHOW':
        return 'No show';
      default:
        return status;
    }
  }

  protected statusPillClass(status: AppointmentStatus): string {
    switch (status) {
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return 'text-(--color-primary)';
      case 'REQUESTED':
        return 'text-(--color-on-surface-variant)';
      case 'COMPLETED':
        return 'text-(--color-secondary)';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'text-(--color-error)';
      default:
        return 'text-(--color-on-surface-variant)';
    }
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

  protected initials(name: string): string {
    const parts = name
      .replace(/^Dr\.\s*/i, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const a = parts[0]?.[0] ?? '?';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '');
    return (a + b).toUpperCase();
  }

  private loadAppointments(): void {
    this.isLoading = true;
    this.service.list().subscribe({
      next: (rows) => {
        this.appointments = rows;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toast.error(this.extractError(err), 'Could not load appointments');
        this.appointments = [];
      },
    });
  }

  private isPastAppointment(a: Appointment): boolean {
    const today = this.stripTime(new Date());
    const d = this.parseLocalDate(a.date);
    if (d < today) return true;
    return a.status === 'COMPLETED' || a.status === 'NO_SHOW';
  }

  private parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map((n) => Number(n));
    return new Date(y, (m || 1) - 1, d || 1);
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sortForTab(rows: Appointment[]): Appointment[] {
    const mult = this.activeTab === 'upcoming' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return mult * byDate;
      return mult * a.time.localeCompare(b.time);
    });
  }

  private extractError(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    return 'Please try again.';
  }
}
