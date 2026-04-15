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
    <div class="mx-auto w-full max-w-6xl space-y-8 pb-10 pt-2">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h1 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            {{ greetingPhrase() }}, {{ greetingName() }}
          </h1>
          <p class="text-sm font-medium text-on-surface-variant">
            @if (nextAppointment && isToday(nextAppointment.date)) {
              You have an appointment today.
            } @else if (nextAppointment) {
              Your next visit is coming up.
            } @else {
              Book a visit when you are ready, we will keep everything organized here.
            }
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

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div class="lg:col-span-7 space-y-6">
          <section class="space-y-3">
            <div class="flex items-end justify-between px-1">
              <h2 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Upcoming
              </h2>
              <a
                routerLink="/patient/appointments"
                class="text-xs font-bold text-(--color-primary) no-underline hover:underline"
              >
                View schedule
              </a>
            </div>

            @if (isLoading) {
              <div class="card-surface rounded-4xl p-8 text-sm text-on-surface-variant">
                Loading your schedule...
              </div>
            } @else if (nextAppointment) {
              <div class="card-surface rounded-4xl p-6 sm:p-8">
                <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex min-w-0 items-start gap-4">
                    <div
                      class="glass-panel flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-(--color-primary)"
                    >
                      {{ initials(nextAppointment.doctor.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <span
                        class="glass-panel inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary"
                      >
                        {{ nextAppointment.doctor.specialty.trim() || 'Physician' }}
                      </span>
                      <h3 class="mt-1 truncate font-headline text-xl font-bold text-on-surface">
                        {{ nextAppointment.doctor.fullName }}
                      </h3>
                      <p class="text-sm text-on-surface-variant">MediFlow Clinic</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <a
                      routerLink="/patient/appointments"
                      class="btn-secondary inline-flex items-center gap-2 no-underline"
                    >
                      <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                        >open_in_new</span
                      >
                      Details
                    </a>
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex items-center gap-3 rounded-3xl bg-surface-container-low p-4">
                    <div class="glass-panel grid h-10 w-10 place-items-center rounded-2xl">
                      <span
                        class="material-symbols-outlined text-(--color-primary)"
                        aria-hidden="true"
                        >calendar_today</span
                      >
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant"
                      >
                        Date
                      </p>
                      <p class="truncate text-sm font-semibold text-on-surface">
                        {{ formatDisplayDate(nextAppointment.date) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 rounded-3xl bg-surface-container-low p-4">
                    <div class="glass-panel grid h-10 w-10 place-items-center rounded-2xl">
                      <span
                        class="material-symbols-outlined text-(--color-primary)"
                        aria-hidden="true"
                        >schedule</span
                      >
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant"
                      >
                        Time
                      </p>
                      <p class="truncate text-sm font-semibold text-on-surface">
                        {{ formatDisplayTime(nextAppointment.time) }}
                      </p>
                    </div>
                  </div>
                </div>

                @if (nextAppointment.reason.trim()) {
                  <div
                    class="mt-5 rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface-variant"
                  >
                    {{ nextAppointment.reason }}
                  </div>
                }
              </div>
            } @else {
              <div class="card-surface rounded-4xl p-8">
                <div
                  class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p class="font-headline text-lg font-bold text-on-surface">
                      No upcoming appointment
                    </p>
                    <p class="mt-1 text-sm text-on-surface-variant">
                      Pick a doctor and time that work for you.
                    </p>
                  </div>
                  <a routerLink="/patient/book" class="btn-primary inline-flex no-underline">
                    Book appointment
                  </a>
                </div>
              </div>
            }
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h2 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Visit history
              </h2>
              <a
                routerLink="/patient/consultations"
                class="text-xs font-bold text-(--color-primary) no-underline hover:underline"
              >
                See all
              </a>
            </div>

            @if (!historyPreview.length && !isLoading) {
              <div class="card-surface rounded-4xl p-8 text-center text-sm text-on-surface-variant">
                Past visits will appear here after your appointments.
              </div>
            } @else if (historyPreview.length) {
              <div class="card-surface rounded-4xl p-3 sm:p-4">
                <div class="space-y-2">
                  @for (appt of historyPreview; track appt.id; let i = $index) {
                    <a
                      routerLink="/patient/consultations"
                      class="group flex items-center justify-between gap-4 rounded-3xl bg-surface-container-low p-4 no-underline transition hover:bg-surface-container"
                    >
                      <div class="flex min-w-0 items-center gap-4">
                        <div
                          class="glass-panel grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                        >
                          <span
                            class="material-symbols-outlined text-(--color-primary)"
                            aria-hidden="true"
                            >{{ historyIcon(i) }}</span
                          >
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-bold text-on-surface">
                            {{ historyTitle(appt) }}
                          </p>
                          <p class="text-[11px] font-medium text-on-surface-variant">
                            {{ formatDisplayDate(appt.date) }} · {{ shortDoctor(appt) }}
                          </p>
                        </div>
                      </div>
                      <span
                        class="glass-panel shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tighter"
                        [class]="historyStatusClass(appt.status)"
                      >
                        {{ historyStatusLabel(appt.status) }}
                      </span>
                    </a>
                  }
                </div>
              </div>
            }
          </section>
        </div>

        <aside class="lg:col-span-5 space-y-6">
          <section class="space-y-3">
            <h2 class="px-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Quick actions
            </h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <a
                routerLink="/patient/book"
                class="card-surface group flex items-center gap-4 rounded-4xl p-4 no-underline transition hover:-translate-y-0.5"
              >
                <div class="glass-panel grid h-12 w-12 place-items-center rounded-3xl">
                  <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
                    >add_circle</span
                  >
                </div>
                <div class="min-w-0">
                  <div class="font-headline text-sm font-bold text-on-surface">
                    Book appointment
                  </div>
                  <div class="text-xs font-medium text-on-surface-variant">
                    Find a doctor and pick a time.
                  </div>
                </div>
                <span
                  class="material-symbols-outlined ml-auto text-on-surface-variant"
                  aria-hidden="true"
                  >chevron_right</span
                >
              </a>
              <a
                routerLink="/patient/appointments"
                class="card-surface group flex items-center gap-4 rounded-4xl p-4 no-underline transition hover:-translate-y-0.5"
              >
                <div class="glass-panel grid h-12 w-12 place-items-center rounded-3xl">
                  <span class="material-symbols-outlined text-secondary" aria-hidden="true"
                    >list_alt</span
                  >
                </div>
                <div class="min-w-0">
                  <div class="font-headline text-sm font-bold text-on-surface">Appointments</div>
                  <div class="text-xs font-medium text-on-surface-variant">
                    See status and upcoming visits.
                  </div>
                </div>
                <span
                  class="material-symbols-outlined ml-auto text-on-surface-variant"
                  aria-hidden="true"
                  >chevron_right</span
                >
              </a>
              <a
                routerLink="/patient/profile"
                class="card-surface group flex items-center gap-4 rounded-4xl p-4 no-underline transition hover:-translate-y-0.5"
              >
                <div class="glass-panel grid h-12 w-12 place-items-center rounded-3xl">
                  <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
                    >person</span
                  >
                </div>
                <div class="min-w-0">
                  <div class="font-headline text-sm font-bold text-on-surface">Profile</div>
                  <div class="text-xs font-medium text-on-surface-variant">
                    Update your personal details.
                  </div>
                </div>
                <span
                  class="material-symbols-outlined ml-auto text-on-surface-variant"
                  aria-hidden="true"
                  >chevron_right</span
                >
              </a>
              <a
                routerLink="/patient/consultations"
                class="card-surface group flex items-center gap-4 rounded-4xl p-4 no-underline transition hover:-translate-y-0.5"
              >
                <div class="glass-panel grid h-12 w-12 place-items-center rounded-3xl">
                  <span class="material-symbols-outlined text-secondary" aria-hidden="true"
                    >clinical_notes</span
                  >
                </div>
                <div class="min-w-0">
                  <div class="font-headline text-sm font-bold text-on-surface">Consultations</div>
                  <div class="text-xs font-medium text-on-surface-variant">
                    Review notes and prescriptions.
                  </div>
                </div>
                <span
                  class="material-symbols-outlined ml-auto text-on-surface-variant"
                  aria-hidden="true"
                  >chevron_right</span
                >
              </a>
            </div>
          </section>
        </aside>
      </div>
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
        this.toast.error(
          typeof err.error?.detail === 'string' ? err.error.detail : 'Could not load appointments.',
        );
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
    if (status === 'COMPLETED') return 'bg-secondary/10 text-secondary';
    if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-error/10 text-error';
    return 'bg-surface-container-low text-on-surface-variant';
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
    if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NO_SHOW')
      return false;
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
