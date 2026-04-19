import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../core/toast/toast.service';
import { SlotsService } from '../../services/slots.service';
import { AppointmentsService } from '../../services/appointments.service';
import { DoctorAvailability, Slot, RescheduleHistoryEntry } from '../../models/domain.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { DatePipe } from '@angular/common';

type CalendarDay = {
  iso: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
};

@Component({
  standalone: true,
  imports: [PageHeaderComponent, DatePipe],
  template: `
    <div class="mx-auto w-full max-w-6xl space-y-6 pb-24 pt-2">
      <app-page-header
        [title]="isRescheduleMode ? 'Reschedule Appointment' : 'Book Appointment'"
        [subtitle]="
          isRescheduleMode
            ? 'Pick a new date and time. Your visit stays with the same doctor unless you change availability elsewhere.'
            : 'Choose a doctor, date, and slot from live availability.'
        "
      />

      @if (isLoadingRescheduleInit) {
        <div class="card-surface rounded-4xl p-8 text-sm text-on-surface-variant">
          Loading appointment...
        </div>
      } @else if (!selectedDoctor) {
        <section class="card-surface rounded-4xl p-6 sm:p-8">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="space-y-1">
              <div class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Step 1
              </div>
              <div class="font-headline text-lg font-extrabold text-on-surface">
                Choose a doctor
              </div>
              <div class="text-sm font-medium text-on-surface-variant">
                Search by name or specialty, then pick your preferred provider.
              </div>
            </div>
            <div class="w-full sm:w-[360px]">
              <label
                class="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Search
              </label>
              <div class="relative">
                <span
                  class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 leading-none text-on-surface-variant"
                  aria-hidden="true"
                  >search</span
                >
                <input
                  #searchInput
                  class="input-ui h-12 w-full pl-11!"
                  placeholder="Search doctors or specialty"
                  (input)="searchTerm = searchInput.value"
                />
              </div>
            </div>
          </div>
        </section>

        @if (isRescheduleMode && rescheduleHistory.length) {
          <section class="card-surface rounded-4xl p-6 sm:p-8 lg:col-span-12">
            <div class="space-y-2">
              <div class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Reschedule history
              </div>
              @for (entry of rescheduleHistory; track entry.changedAt) {
                <div class="rounded-3xl bg-surface-container-low p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-bold text-on-surface">
                        {{ entry.oldDate }} {{ entry.oldTime }} → {{ entry.newDate }}
                        {{ entry.newTime }}
                      </div>
                      <div class="text-xs text-on-surface-variant">
                        By: {{ entry.changedBy || 'Unknown' }} ·
                        {{ entry.changedAt | date: 'medium' }}
                      </div>
                      @if (entry.reason) {
                        <div class="mt-2 text-xs text-on-surface-variant">
                          Reason: {{ entry.reason }}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        @if (isLoadingDoctors) {
          <div class="card-surface rounded-4xl p-8 text-sm text-on-surface-variant">
            Loading doctors...
          </div>
        } @else {
          <section class="grid gap-4 lg:grid-cols-2">
            @for (doctor of filteredDoctors; track doctor.id) {
              <button
                class="card-surface group rounded-4xl p-6 text-left transition hover:-translate-y-0.5 hover:bg-surface-container-low"
                (click)="selectDoctor(doctor)"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 items-start gap-4">
                    <div class="glass-panel grid h-12 w-12 shrink-0 place-items-center rounded-3xl">
                      <span
                        class="material-symbols-outlined text-(--color-primary)"
                        aria-hidden="true"
                        >stethoscope</span
                      >
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-headline text-lg font-extrabold text-on-surface">
                        {{ doctor.name }}
                      </p>
                      <p class="truncate text-sm font-semibold text-(--color-primary)">
                        {{ doctor.specialty || 'General Practitioner' }}
                      </p>
                      <p class="mt-2 text-xs font-medium text-on-surface-variant">
                        Tap to select date and time.
                      </p>
                    </div>
                  </div>
                  <span
                    class="glass-panel shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest"
                    [class.text-secondary]="doctor.status === 'AVAILABLE'"
                    [class.text-on-surface-variant]="doctor.status === 'BUSY'"
                    [class.text-on-surface-variant]="doctor.status === 'AWAY'"
                  >
                    {{ statusLabel(doctor.status) }}
                  </span>
                </div>
              </button>
            }

            @if (!filteredDoctors.length) {
              <div
                class="card-surface rounded-4xl p-8 text-sm text-on-surface-variant lg:col-span-2"
              >
                No doctors match your search.
              </div>
            }
          </section>
        }
      } @else {
        <section class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-center gap-3">
            <button
              class="btn-secondary rounded-xl! inline-flex items-center gap-2"
              type="button"
              (click)="backToDoctors()"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >arrow_back</span
              >
              <span>{{ isRescheduleMode ? 'Back to appointments' : 'Back' }}</span>
            </button>
            <div class="card-surface flex items-center gap-4 rounded-4xl p-5">
              <div class="glass-panel grid h-12 w-12 place-items-center rounded-3xl">
                <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
                  >stethoscope</span
                >
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {{ selectedDoctor.specialty || 'General Practitioner' }}
                </p>
                <p class="truncate font-headline text-lg font-extrabold text-on-surface">
                  {{ selectedDoctor.name }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section class="card-surface rounded-4xl p-6 sm:p-8 lg:col-span-7">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="space-y-1">
                <div class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Step 2
                </div>
                <h3 class="font-headline text-lg font-extrabold text-on-surface">Select date</h3>
                <p class="text-sm font-medium text-on-surface-variant">
                  Choose a day from the calendar to load live slots.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn-secondary" type="button" (click)="changeMonth(-1)">Prev</button>
                <button class="btn-secondary" type="button" (click)="changeMonth(1)">Next</button>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between">
              <p class="text-sm font-extrabold text-(--color-primary)">{{ monthLabel }}</p>
              <span class="text-xs font-semibold text-on-surface-variant">
                Selected: {{ humanDate(selectedDate) }}
              </span>
            </div>

            <div
              class="mt-5 grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold tracking-widest text-on-surface-variant"
            >
              @for (label of weekdays; track label) {
                <span>{{ label }}</span>
              }
            </div>
            <div class="mt-2 grid grid-cols-7 gap-2">
              @for (day of calendarDays; track day.iso) {
                <button
                  type="button"
                  class="rounded-2xl px-2 py-2 text-sm font-bold transition active:scale-[0.99]"
                  [disabled]="day.isPast"
                  [class.opacity-35]="!day.isCurrentMonth"
                  [class.cursor-not-allowed]="day.isPast"
                  [class.bg-surface-container-low]="!isSelectedDate(day.iso)"
                  [class.hover:bg-surface-container]="!day.isPast && !isSelectedDate(day.iso)"
                  [class.text-on-surface-variant]="day.isPast"
                  [class.bg-primary]="isSelectedDate(day.iso)"
                  [class.text-white]="isSelectedDate(day.iso)"
                  (click)="selectDate(day)"
                >
                  {{ day.dayOfMonth }}
                </button>
              }
            </div>
          </section>

          <section class="card-surface rounded-4xl p-6 sm:p-8 lg:col-span-5">
            <div class="flex items-end justify-between gap-3">
              <div class="space-y-1">
                <div class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Step 3
                </div>
                <h3 class="font-headline text-lg font-extrabold text-on-surface">Pick a slot</h3>
                <p class="text-sm font-medium text-on-surface-variant">
                  Morning and afternoon availability updates live.
                </p>
              </div>
            </div>

            @if (isLoadingSlots) {
              <div
                class="mt-5 rounded-4xl bg-surface-container-low p-6 text-sm text-on-surface-variant"
              >
                Loading slots...
              </div>
            } @else {
              <div class="mt-5 space-y-5">
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <p
                      class="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant"
                    >
                      Morning
                    </p>
                    <p class="text-xs font-semibold text-on-surface-variant">
                      {{ morningSlots.length }} slot{{ morningSlots.length === 1 ? '' : 's' }}
                    </p>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    @for (slot of morningSlots; track slot.startTime) {
                      <button
                        type="button"
                        class="rounded-3xl bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container active:scale-[0.99]"
                        [class.bg-primary]="selectedSlot?.startTime === slot.startTime"
                        [class.text-white]="selectedSlot?.startTime === slot.startTime"
                        [class.opacity-40]="isSlotPast(slot) || slot.is_available === false"
                        [class.cursor-not-allowed]="isSlotPast(slot) || slot.is_available === false"
                        [disabled]="isSlotPast(slot) || slot.is_available === false"
                        (click)="selectSlot(slot)"
                      >
                        {{ displayTime(slot.startTime) }}
                        @if (slot.is_available === false) {
                          <div class="text-[10px] mt-1 text-on-surface-variant">Booked</div>
                        }
                      </button>
                    }
                    @if (!morningSlots.length) {
                      <div
                        class="col-span-2 rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface-variant"
                      >
                        No morning slots.
                      </div>
                    }
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <p
                      class="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant"
                    >
                      Afternoon
                    </p>
                    <p class="text-xs font-semibold text-on-surface-variant">
                      {{ afternoonSlots.length }} slot{{ afternoonSlots.length === 1 ? '' : 's' }}
                    </p>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    @for (slot of afternoonSlots; track slot.startTime) {
                      <button
                        type="button"
                        class="rounded-3xl bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container active:scale-[0.99]"
                        [class.bg-primary]="selectedSlot?.startTime === slot.startTime"
                        [class.text-white]="selectedSlot?.startTime === slot.startTime"
                        [class.opacity-40]="isSlotPast(slot) || slot.is_available === false"
                        [class.cursor-not-allowed]="isSlotPast(slot) || slot.is_available === false"
                        [disabled]="isSlotPast(slot) || slot.is_available === false"
                        (click)="selectSlot(slot)"
                      >
                        {{ displayTime(slot.startTime) }}
                        @if (slot.is_available === false) {
                          <div class="text-[10px] mt-1 text-on-surface-variant">Booked</div>
                        }
                      </button>
                    }
                    @if (!afternoonSlots.length) {
                      <div
                        class="col-span-2 rounded-3xl bg-surface-container-low p-4 text-sm text-on-surface-variant"
                      >
                        No afternoon slots.
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </section>
        </div>
      }

      @if (selectedDoctor && selectedSlot && selectedDate) {
        <section class="sticky bottom-3">
          <div
            class="glass-panel mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-4xl p-4 shadow-soft"
          >
            <div class="min-w-0">
              <p class="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                Selection
              </p>
              <p class="truncate text-sm font-bold text-on-surface">
                {{ humanDate(selectedDate) }} · {{ displayTime(selectedSlot.startTime) }}
              </p>
            </div>
            <button
              class="btn-primary shrink-0 px-5 py-3"
              type="button"
              [disabled]="isBooking"
              (click)="bookSelectedSlot()"
            >
              {{
                isBooking
                  ? isRescheduleMode
                    ? 'Rescheduling...'
                    : 'Booking...'
                  : isRescheduleMode
                    ? 'Confirm new time'
                    : 'Book Appointment'
              }}
            </button>
          </div>
        </section>
      }
    </div>
  `,
})
export class BookAppointmentPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly slotsService = inject(SlotsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  protected readonly today = this.stripTime(new Date());

  protected doctors: DoctorAvailability[] = [];
  protected searchTerm = '';
  protected isRescheduleMode = false;
  protected rescheduleAppointmentId: string | null = null;
  protected isLoadingRescheduleInit = false;
  protected selectedDoctor: DoctorAvailability | null = null;
  protected rescheduleHistory: RescheduleHistoryEntry[] = [];
  protected selectedDate = '';
  protected selectedSlot: Slot | null = null;
  protected slots: Slot[] = [];
  protected viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

  protected isLoadingDoctors = false;
  protected isLoadingSlots = false;
  protected isBooking = false;

  ngOnInit(): void {
    const rid = this.route.snapshot.queryParamMap.get('rescheduleId');
    if (rid) {
      this.initRescheduleMode(rid);
    } else {
      this.loadDoctors();
    }
  }

  protected get filteredDoctors(): DoctorAvailability[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    if (!keyword) return this.doctors;
    return this.doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(keyword) ||
        (doctor.specialty || '').toLowerCase().includes(keyword),
    );
  }

  protected get monthLabel(): string {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      this.viewMonth,
    );
  }

  protected get calendarDays(): CalendarDay[] {
    const firstOfMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth(), 1);
    const offsetToMonday = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - offsetToMonday);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const normalized = this.stripTime(date);
      return {
        iso: this.toIsoDate(normalized),
        dayOfMonth: normalized.getDate(),
        isCurrentMonth: normalized.getMonth() === this.viewMonth.getMonth(),
        isPast: normalized < this.today,
      };
    });
  }

  protected get morningSlots(): Slot[] {
    return this.slots
      .filter((slot) => this.slotHour(slot) < 12)
      .filter((slot) => slot.is_available !== false);
  }

  protected get afternoonSlots(): Slot[] {
    return this.slots
      .filter((slot) => this.slotHour(slot) >= 12)
      .filter((slot) => slot.is_available !== false);
  }

  protected selectDoctor(doctor: DoctorAvailability): void {
    this.selectedDoctor = doctor;
    this.viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.selectedDate = this.toIsoDate(this.today);
    this.selectedSlot = null;
    this.loadSlots();
  }

  protected backToDoctors(): void {
    if (this.isRescheduleMode) {
      void this.router.navigate(['/patient/appointments']);
      return;
    }
    this.selectedDoctor = null;
    this.selectedDate = '';
    this.selectedSlot = null;
    this.slots = [];
  }

  protected changeMonth(delta: number): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + delta, 1);
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isPast) return;
    const [year, month, dayOfMonth] = day.iso.split('-').map((part) => Number(part));
    const date = new Date(year, (month || 1) - 1, dayOfMonth || 1);
    this.viewMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedDate = day.iso;
    this.selectedSlot = null;
    this.loadSlots();
  }

  protected isSelectedDate(isoDate: string): boolean {
    return this.selectedDate === isoDate;
  }

  protected bookSelectedSlot(): void {
    if (!this.selectedDoctor || !this.selectedSlot || !this.selectedDate) return;

    // Client-side guard: prevent booking/rescheduling into a passed slot
    if (this.isSlotPast(this.selectedSlot)) {
      this.toast.error('Selected slot has already passed. Please choose another time.');
      return;
    }

    this.isBooking = true;
    const req =
      this.isRescheduleMode && this.rescheduleAppointmentId
        ? this.appointmentsService.reschedule(this.rescheduleAppointmentId, {
            doctor_id: this.selectedDoctor.id,
            date: this.selectedDate,
            time: this.selectedSlot.startTime,
            reason: 'Rescheduled by patient',
          })
        : this.appointmentsService.book({
            doctor_id: this.selectedDoctor.id,
            date: this.selectedDate,
            time: this.selectedSlot.startTime,
            reason: 'Consultation',
          });

    req.pipe(finalize(() => (this.isBooking = false))).subscribe({
      next: () => {
        this.toast.success(
          this.isRescheduleMode ? 'Appointment rescheduled.' : 'Appointment booked successfully.',
        );
        void this.router.navigate(['/patient/appointments']);
      },
      error: (error: HttpErrorResponse) => {
        // If backend reports a conflict because the slot was taken concurrently,
        // refresh live availability so the UI stops showing that slot.
        if (error.status === 409) {
          this.toast.error(
            'Selected slot is no longer available. Refreshing availability.',
            this.isRescheduleMode ? 'Reschedule failed' : 'Booking failed',
          );
          this.selectedSlot = null;
          this.loadSlots();
          return;
        }

        this.toast.error(
          this.extractErrorMessage(error),
          this.isRescheduleMode ? 'Reschedule failed' : 'Booking failed',
        );
      },
    });
  }

  protected displayTime(time: string): string {
    const [rawHour, rawMinute] = time.split(':');
    const hour = Number(rawHour || '0');
    const minute = Number(rawMinute || '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  protected humanDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map((part) => Number(part));
    const date = new Date(year, (month || 1) - 1, day || 1);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  protected statusLabel(status: DoctorAvailability['status']): string {
    if (status === 'AVAILABLE') return 'Available';
    if (status === 'BUSY') return 'Busy';
    return 'Away';
  }

  private initRescheduleMode(appointmentId: string): void {
    this.isRescheduleMode = true;
    this.rescheduleAppointmentId = appointmentId;
    this.isLoadingRescheduleInit = true;
    this.appointmentsService
      .get(appointmentId)
      .pipe(finalize(() => (this.isLoadingRescheduleInit = false)))
      .subscribe({
        next: (appt) => {
          if (appt.status !== 'REQUESTED' && appt.status !== 'CONFIRMED') {
            this.toast.error('This appointment cannot be rescheduled.');
            void this.router.navigate(['/patient/appointments']);
            return;
          }
          this.selectedDoctor = {
            id: appt.doctor.id,
            name: appt.doctor.fullName,
            specialty: appt.doctor.specialty?.trim() ? appt.doctor.specialty : undefined,
            status: 'AVAILABLE',
          };
          this.rescheduleHistory = appt.rescheduleHistory ?? [];
          this.selectedDate = appt.date;
          const [y, m, d] = appt.date.split('-').map((part) => Number(part));
          this.viewMonth = new Date(y, (m || 1) - 1, d || 1);
          this.selectedSlot = null;
          this.loadSlots();
        },
        error: (error: HttpErrorResponse) => {
          this.toast.error(this.extractErrorMessage(error), 'Could not load appointment');
          void this.router.navigate(['/patient/appointments']);
        },
      });
  }

  private loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.http
      .get<DoctorAvailability[]>('/api/doctors/availability/')
      .pipe(finalize(() => (this.isLoadingDoctors = false)))
      .subscribe({
        next: (rows) => (this.doctors = rows),
        error: (error: HttpErrorResponse) => {
          this.toast.error(this.extractErrorMessage(error), 'Failed to load doctors');
        },
      });
  }

  private loadSlots(): void {
    if (!this.selectedDoctor || !this.selectedDate) return;
    this.isLoadingSlots = true;
    this.slots = [];
    this.slotsService
      .list(this.selectedDoctor.id, this.selectedDate)
      .pipe(finalize(() => (this.isLoadingSlots = false)))
      .subscribe({
        next: (rows) => {
          this.slots = rows;
        },
        error: (error: HttpErrorResponse) => {
          this.toast.error(this.extractErrorMessage(error), 'Failed to load slots');
        },
      });
  }

  private slotHour(slot: Slot): number {
    return Number(slot.startTime.split(':')[0] || '0');
  }

  protected selectSlot(slot: Slot): void {
    if (this.isSlotPast(slot)) return;
    if (slot.is_available === false) return;
    this.selectedSlot = slot;
  }

  protected isSlotPast(slot: Slot): boolean {
    if (!this.selectedDate) return false;
    const [year, month, day] = this.selectedDate.split('-').map((p) => Number(p));
    const [hourStr, minuteStr] = slot.startTime.split(':');
    const slotDate = new Date(
      year,
      (month || 1) - 1,
      day || 1,
      Number(hourStr || '0'),
      Number(minuteStr || '0'),
    );
    const now = new Date();
    const todayIso = this.toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    if (this.selectedDate !== todayIso) return false;
    return slotDate.getTime() < now.getTime();
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    return 'Please try again.';
  }
}
