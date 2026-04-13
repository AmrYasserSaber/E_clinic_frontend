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
    <div class="mb-8 pt-2">
      <h2 class="font-headline text-3xl font-extrabold tracking-tight text-slate-900">My Appointments</h2>
      <p class="mt-2 text-sm font-medium text-slate-500">Manage your health schedule and upcoming clinical visits.</p>
    </div>

    <div class="mb-8 flex rounded-2xl bg-slate-200/50 p-1.5">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          class="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
          [class.bg-white]="activeTab === tab.id"
          [class.font-bold]="activeTab === tab.id"
          [class.text-primary]="activeTab === tab.id"
          [class.shadow-sm]="activeTab === tab.id"
          [class.border]="activeTab === tab.id"
          [class.border-slate-200/30]="activeTab === tab.id"
          [class.text-slate-500]="activeTab !== tab.id"
          [class.hover:text-slate-800]="activeTab !== tab.id"
          (click)="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      }
    </div>

    @if (isLoading) {
      <div class="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-[0_10px_25px_-5px_rgba(0,100,121,0.08)]">
        Loading appointments...
      </div>
    } @else if (!filteredAppointments.length) {
      <div class="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
        <p class="font-bold text-slate-900">No appointments here yet</p>
        <p class="mt-1 text-sm text-slate-500">Book a visit to see it listed under this tab.</p>
        <a routerLink="/patient/book" class="btn-primary mt-4 inline-block no-underline">Book appointment</a>
      </div>
    } @else {
      <div class="space-y-6 pb-28">
        @for (appt of filteredAppointments; track appt.id) {
          <article
            class="overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5"
            style="box-shadow: 0 10px 25px -5px rgba(0, 100, 121, 0.08), 0 8px 10px -6px rgba(0, 100, 121, 0.05);"
          >
            <div class="p-6">
              <div class="mb-6 flex items-start justify-between gap-3">
                <div class="flex gap-4">
                  <div
                    class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary-container/15 text-lg font-bold text-primary"
                  >
                    {{ initials(appt.doctor.fullName) }}
                  </div>
                  <div>
                    <h3 class="font-headline text-lg font-bold text-slate-900">{{ appt.doctor.fullName }}</h3>
                    <p class="text-sm font-medium text-slate-500">
                      {{ appt.doctor.specialty.trim() ? appt.doctor.specialty : 'Physician' }}
                    </p>
                  </div>
                </div>
                <span
                  class="rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest"
                  [class]="statusPillClass(appt.status)"
                >
                  {{ statusLabel(appt.status) }}
                </span>
              </div>

              <div class="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"
                  >
                    <span class="material-symbols-outlined text-lg">calendar_today</span>
                  </div>
                  <div class="flex min-w-0 flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</span>
                    <span class="text-sm font-bold text-slate-900">{{ formatDisplayDate(appt.date) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"
                  >
                    <span class="material-symbols-outlined text-lg">schedule</span>
                  </div>
                  <div class="flex min-w-0 flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time</span>
                    <span class="text-sm font-bold text-slate-900">{{ formatDisplayTime(appt.time) }}</span>
                  </div>
                </div>
              </div>

              @if (appt.reason.trim()) {
                <p class="mb-4 text-sm text-slate-600">{{ appt.reason }}</p>
              }

              <div class="flex gap-3">
                @if (canReschedule(appt) || canCancel(appt)) {
                  @if (canReschedule(appt)) {
                    <a
                      [routerLink]="['/patient/book']"
                      [queryParams]="{ rescheduleId: appt.id }"
                      class="min-w-0 flex-1 rounded-xl bg-slate-100 py-3 text-center text-sm font-bold text-slate-900 no-underline transition hover:bg-slate-200"
                    >
                      Reschedule
                    </a>
                  }
                  @if (canCancel(appt)) {
                    <button
                      type="button"
                      class="min-w-0 flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                      [disabled]="cancellingId === appt.id"
                      (click)="cancelAppointment(appt)"
                    >
                      {{ cancellingId === appt.id ? 'Cancelling...' : 'Cancel' }}
                    </button>
                  }
                } @else {
                  <span class="min-w-0 flex-1 text-sm text-slate-400">No actions for this visit.</span>
                }
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#006479] to-[#0098b8] text-white shadow-lg shadow-primary/25"
                  [attr.title]="appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN' ? 'Confirmed visit' : 'Appointment'"
                >
                  <span class="material-symbols-outlined">event_available</span>
                </div>
              </div>
            </div>
          </article>
        }

        <a
          routerLink="/patient/book"
          class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center no-underline transition hover:bg-primary/10"
        >
          <div
            class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition group-hover:scale-110"
          >
            <span class="material-symbols-outlined text-3xl text-primary">add</span>
          </div>
          <p class="mb-1 text-base font-bold text-slate-900">Schedule a new checkup</p>
          <p class="max-w-[220px] text-xs font-medium text-slate-500">
            Keep your health in check by booking your next visit today.
          </p>
        </a>
      </div>
    }
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
        return 'Pending';
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
        return 'border-primary/20 bg-primary/10 text-primary';
      case 'REQUESTED':
        return 'border-amber-200 bg-amber-100 text-amber-800';
      case 'COMPLETED':
        return 'border-emerald-200 bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'border-rose-200 bg-rose-100 text-rose-800';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }
  }

  protected formatDisplayDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map((n) => Number(n));
    const date = new Date(y, (m || 1) - 1, d || 1);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
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
    const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '?';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
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
