import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../core/toast/toast.service';
import { Appointment, AppointmentStatus } from '../../models/domain.models';
import { AppointmentsService } from '../../services/appointments.service';

const HISTORY_ICONS = ['medical_services', 'vaccines', 'lab_research', 'dentistry'] as const;

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-2xl space-y-8 pb-8 pt-2">
      <!-- Greeting -->
      <section class="space-y-1">
        <h1 class="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
          {{ greetingPhrase() }}, {{ greetingName() }}
        </h1>
        <p class="font-medium text-slate-500">
          @if (nextAppointment && isToday(nextAppointment.date)) {
            You have an appointment today.
          } @else if (nextAppointment) {
            Your next visit is coming up.
          } @else {
            Book a visit when you are ready, we will keep everything organized here.
          }
        </p>
      </section>

      <!-- Upcoming -->
      <section class="space-y-4">
        <div class="flex items-end justify-between px-1">
          <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400">Upcoming</h2>
        </div>

        @if (isLoading) {
          <div
            class="rounded-xl border border-white/60 bg-white p-6 text-sm text-slate-500"
            style="box-shadow: 8px 8px 24px rgba(0, 100, 121, 0.06), -5px -5px 15px rgba(255, 255, 255, 0.8);"
          >
            Loading your schedule...
          </div>
        } @else if (nextAppointment) {
          <div
            class="rounded-xl border border-white/60 bg-white p-6"
            style="box-shadow: 8px 8px 24px rgba(0, 100, 121, 0.06), -5px -5px 15px rgba(255, 255, 255, 0.8);"
          >
            <div class="mb-6 flex items-start gap-4">
              <div
                class="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary shadow-sm"
              >
                {{ initials(nextAppointment.doctor.fullName) }}
              </div>
              <div class="min-w-0 flex-1">
                <span
                  class="inline-block rounded-full bg-secondary-fixed/40 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary"
                >
                  {{ nextAppointment.doctor.specialty.trim() || 'Physician' }}
                </span>
                <h3 class="font-headline mt-1 text-xl font-bold text-slate-900">{{ nextAppointment.doctor.fullName }}</h3>
                <p class="text-sm text-slate-500">MediFlow Clinic</p>
              </div>
            </div>

            <div class="mb-6 grid grid-cols-2 gap-4">
              <div class="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                <div class="flex items-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Date</p>
                  <p class="text-sm font-semibold text-slate-900">{{ formatDisplayDate(nextAppointment.date) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                <div class="flex items-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Time</p>
                  <p class="text-sm font-semibold text-slate-900">{{ formatDisplayTime(nextAppointment.time) }}</p>
                </div>
              </div>
            </div>

            @if (nextAppointment.reason.trim()) {
              <p class="mb-4 text-sm text-slate-600">{{ nextAppointment.reason }}</p>
            }

            <a
              href="https://www.google.com/maps/search/?api=1&query=MediFlow+Clinic"
              target="_blank"
              rel="noopener noreferrer"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#006479] to-[#0098b8] py-4 text-center font-bold text-white no-underline shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
            >
              <span class="material-symbols-outlined">near_me</span>
              Get directions
            </a>
          </div>
        } @else {
          <div
            class="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-8 text-center"
            style="box-shadow: 0 0 20px rgba(0, 100, 121, 0.06);"
          >
            <p class="font-bold text-slate-900">No upcoming appointment</p>
            <p class="mt-1 text-sm text-slate-500">Pick a doctor and time that work for you.</p>
            <a routerLink="/patient/book" class="btn-primary mt-4 inline-block no-underline">Book appointment</a>
          </div>
        }
      </section>

      <!-- Quick actions -->
      <section class="space-y-4">
        <h2 class="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Quick actions</h2>
        <div class="grid grid-cols-3 gap-4">
          <a
            routerLink="/patient/book"
            class="flex flex-col items-center gap-3 rounded-xl bg-white p-4 no-underline transition-transform hover:-translate-y-1"
            style="box-shadow: 0 0 20px rgba(0, 100, 121, 0.08);"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span class="material-symbols-outlined">add_circle</span>
            </div>
            <span class="text-center text-[11px] font-bold leading-tight text-slate-800"
              >Book new<br />appt</span
            >
          </a>
          <a
            routerLink="/patient/appointments"
            class="flex flex-col items-center gap-3 rounded-xl bg-white p-4 no-underline transition-transform hover:-translate-y-1"
            style="box-shadow: 0 0 20px rgba(0, 100, 121, 0.08);"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed/50 text-secondary">
              <span class="material-symbols-outlined">list_alt</span>
            </div>
            <span class="text-center text-[11px] font-bold leading-tight text-slate-800"
              >View all<br />appts</span
            >
          </a>
          <button
            type="button"
            class="flex flex-col items-center gap-3 rounded-xl bg-white p-4 transition-transform hover:-translate-y-1"
            style="box-shadow: 0 0 20px rgba(0, 100, 121, 0.08);"
            (click)="onMessageClinic()"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-primary">
              <span class="material-symbols-outlined">chat_bubble</span>
            </div>
            <span class="text-center text-[11px] font-bold leading-tight text-slate-800"
              >Message<br />clinic</span
            >
          </button>
        </div>
      </section>

      <!-- Visit history preview -->
      <section class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400">Visit history</h2>
          <a routerLink="/patient/appointments" class="text-xs font-bold text-primary no-underline hover:underline"
            >See all</a
          >
        </div>

        @if (!historyPreview.length && !isLoading) {
          <div class="rounded-xl bg-surface-container-low p-6 text-center text-sm text-slate-500">
            Past visits will appear here after your appointments.
          </div>
        } @else if (historyPreview.length) {
          <div class="overflow-hidden rounded-xl bg-surface-container-low">
            @for (appt of historyPreview; track appt.id; let i = $index) {
              <div
                class="flex items-center justify-between bg-white p-4"
                [class.mb-0.5]="i < historyPreview.length - 1"
              >
                <div class="flex min-w-0 items-center gap-4">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary"
                  >
                    <span class="material-symbols-outlined text-[22px]">{{ historyIcon(i) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-900">{{ historyTitle(appt) }}</p>
                    <p class="text-[11px] text-slate-500">
                      {{ formatDisplayDate(appt.date) }} · {{ shortDoctor(appt) }}
                    </p>
                  </div>
                </div>
                <span
                  class="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tighter"
                  [class]="historyStatusClass(appt.status)"
                >
                  {{ historyStatusLabel(appt.status) }}
                </span>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class PatientDashboardPage implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  protected appointments: Appointment[] = [];
  protected isLoading = false;

  ngOnInit(): void {
    this.isLoading = true;
    this.appointmentsService.list().subscribe({
      next: (rows) => {
        this.appointments = rows;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toast.error(typeof err.error?.detail === 'string' ? err.error.detail : 'Could not load appointments.');
      },
    });
  }

  protected greetingPhrase(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  protected greetingName(): string {
    const name = this.authStore.user()?.fullName?.trim();
    if (!name) return 'there';
    return name.split(/\s+/)[0] ?? 'there';
  }

  protected get nextAppointment(): Appointment | null {
    const candidates = this.appointments.filter((a) => this.isUpcomingCandidate(a));
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.time.localeCompare(b.time);
    })[0];
  }

  protected get historyPreview(): Appointment[] {
    return [...this.appointments]
      .filter((a) => this.isHistoryPreviewItem(a))
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return b.time.localeCompare(a.time);
      })
      .slice(0, 3);
  }

  protected isToday(isoDate: string): boolean {
    return isoDate === this.todayIso();
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

  protected historyIcon(index: number): string {
    return HISTORY_ICONS[index % HISTORY_ICONS.length];
  }

  protected historyTitle(appt: Appointment): string {
    const r = appt.reason.trim();
    if (r) return r.length > 40 ? r.slice(0, 37) + '…' : r;
    return 'Clinic visit';
  }

  protected shortDoctor(appt: Appointment): string {
    return appt.doctor.fullName.replace(/^Dr\.\s*/i, 'Dr. ');
  }

  protected historyStatusLabel(status: AppointmentStatus): string {
    switch (status) {
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

  protected historyStatusClass(status: AppointmentStatus): string {
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
    if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-red-50 text-red-600';
    return 'bg-slate-100 text-slate-600';
  }

  protected onMessageClinic(): void {
    this.toast.show({
      message: 'Messaging will be available in a future update. For urgent needs, call the clinic.',
      title: 'Message clinic',
      variant: 'info',
    });
  }

  private todayIso(): string {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Past visits for the dashboard list (omit future-dated cancellations). */
  private isHistoryPreviewItem(a: Appointment): boolean {
    const today = this.stripTime(new Date());
    const d = this.parseLocalDate(a.date);
    if (a.status === 'CANCELLED') return d < today;
    if (a.status === 'COMPLETED' || a.status === 'NO_SHOW') return true;
    return d < today;
  }

  private isUpcomingCandidate(a: Appointment): boolean {
    if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NO_SHOW') return false;
    const todayIso = this.todayIso();
    if (a.date > todayIso) return true;
    if (a.date < todayIso) return false;
    return this.timeStringToMinutes(a.time) >= this.currentMinutes();
  }

  private parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map((n) => Number(n));
    return new Date(y, (m || 1) - 1, d || 1);
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private timeStringToMinutes(t: string): number {
    const [h, m] = t.split(':').map((n) => Number(n));
    return (h || 0) * 60 + (m || 0);
  }

  private currentMinutes(): number {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }
}
