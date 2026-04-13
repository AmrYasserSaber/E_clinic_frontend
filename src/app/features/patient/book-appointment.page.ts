import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../core/toast/toast.service';
import { SlotsService } from '../../services/slots.service';
import { AppointmentsService } from '../../services/appointments.service';
import { DoctorAvailability, Slot } from '../../models/domain.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

type CalendarDay = {
  iso: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
};

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Book Appointment" subtitle="Choose a doctor, date, and slot from live availability." />

    @if (!selectedDoctor) {
      <section class="card-surface mb-4 p-4">
        <p class="mb-2 text-sm font-medium text-slate-600">Find your specialist</p>
        <input
          #searchInput
          class="input-ui"
          placeholder="Search doctors or specialty"
          (input)="searchTerm = searchInput.value"
        />
      </section>

      @if (isLoadingDoctors) {
        <div class="card-surface p-4 text-sm text-slate-600">Loading doctors...</div>
      } @else {
        <section class="grid gap-4">
          @for (doctor of filteredDoctors; track doctor.id) {
            <button class="card-surface p-4 text-left transition hover:bg-cyan-50" (click)="selectDoctor(doctor)">
              <div class="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p class="text-lg font-bold text-slate-900">{{ doctor.name }}</p>
                  <p class="text-sm font-medium text-cyan-700">{{ doctor.specialty || 'General Practitioner' }}</p>
                </div>
                <span
                  class="rounded-full px-2 py-1 text-xs font-semibold"
                  [class.bg-emerald-100]="doctor.status === 'AVAILABLE'"
                  [class.text-emerald-700]="doctor.status === 'AVAILABLE'"
                  [class.bg-amber-100]="doctor.status === 'BUSY'"
                  [class.text-amber-700]="doctor.status === 'BUSY'"
                  [class.bg-slate-200]="doctor.status === 'AWAY'"
                  [class.text-slate-600]="doctor.status === 'AWAY'"
                >
                  {{ statusLabel(doctor.status) }}
                </span>
              </div>
              <p class="text-xs text-slate-500">Tap to select date and time.</p>
            </button>
          }

          @if (!filteredDoctors.length) {
            <div class="card-surface p-4 text-sm text-slate-600">No doctors match your search.</div>
          }
        </section>
      }
    } @else {
      <section class="mb-4 flex items-center gap-3">
        <button class="btn-secondary" type="button" (click)="backToDoctors()">Back</button>
        <div class="card-surface flex-1 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ selectedDoctor.specialty || 'General Practitioner' }}
          </p>
          <p class="text-lg font-bold text-slate-900">{{ selectedDoctor.name }}</p>
        </div>
      </section>

      <section class="card-surface mb-4 p-4">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Select Date</h3>
          <div class="flex items-center gap-2">
            <button class="btn-secondary" type="button" (click)="changeMonth(-1)">Prev</button>
            <button class="btn-secondary" type="button" (click)="changeMonth(1)">Next</button>
          </div>
        </div>
        <p class="mb-4 text-sm font-semibold text-cyan-800">{{ monthLabel }}</p>

        <div class="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold tracking-wide text-slate-400">
          @for (label of weekdays; track label) {
            <span>{{ label }}</span>
          }
        </div>
        <div class="grid grid-cols-7 gap-2">
          @for (day of calendarDays; track day.iso) {
            <button
              type="button"
              class="rounded-lg px-2 py-2 text-sm transition"
              [disabled]="day.isPast"
              [class.opacity-35]="!day.isCurrentMonth"
              [class.cursor-not-allowed]="day.isPast"
              [class.bg-slate-100]="!isSelectedDate(day.iso)"
              [class.text-slate-500]="day.isPast"
              [class.bg-primary]="isSelectedDate(day.iso)"
              [class.text-white]="isSelectedDate(day.iso)"
              (click)="selectDate(day)"
            >
              {{ day.dayOfMonth }}
            </button>
          }
        </div>
      </section>

      <section class="card-surface mb-24 p-4">
        <h3 class="mb-4 text-lg font-bold text-slate-900">Available Slots</h3>
        @if (isLoadingSlots) {
          <p class="text-sm text-slate-600">Loading slots...</p>
        } @else {
          <div class="mb-5">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Morning</p>
            <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
              @for (slot of morningSlots; track slot.startTime) {
                <button
                  type="button"
                  class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition"
                  [class.bg-primary]="selectedSlot?.startTime === slot.startTime"
                  [class.text-white]="selectedSlot?.startTime === slot.startTime"
                  (click)="selectedSlot = slot"
                >
                  {{ displayTime(slot.startTime) }}
                </button>
              }
              @if (!morningSlots.length) {
                <p class="col-span-2 text-sm text-slate-500 md:col-span-3">No morning slots.</p>
              }
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Afternoon</p>
            <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
              @for (slot of afternoonSlots; track slot.startTime) {
                <button
                  type="button"
                  class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition"
                  [class.bg-primary]="selectedSlot?.startTime === slot.startTime"
                  [class.text-white]="selectedSlot?.startTime === slot.startTime"
                  (click)="selectedSlot = slot"
                >
                  {{ displayTime(slot.startTime) }}
                </button>
              }
              @if (!afternoonSlots.length) {
                <p class="col-span-2 text-sm text-slate-500 md:col-span-3">No afternoon slots.</p>
              }
            </div>
          </div>
        }
      </section>
    }

    @if (selectedDoctor && selectedSlot && selectedDate) {
      <section class="glass-panel fixed inset-x-0 bottom-0 border-t border-slate-200 p-4">
        <div class="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Selection</p>
            <p class="text-sm font-bold text-slate-900">{{ humanDate(selectedDate) }} - {{ displayTime(selectedSlot.startTime) }}</p>
          </div>
          <button class="btn-primary" type="button" [disabled]="isBooking" (click)="bookSelectedSlot()">
            {{ isBooking ? 'Booking...' : 'Book Appointment' }}
          </button>
        </div>
      </section>
    }
  `,
})
export class BookAppointmentPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly slotsService = inject(SlotsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  protected readonly today = this.stripTime(new Date());

  protected doctors: DoctorAvailability[] = [];
  protected searchTerm = '';
  protected selectedDoctor: DoctorAvailability | null = null;
  protected selectedDate = '';
  protected selectedSlot: Slot | null = null;
  protected slots: Slot[] = [];
  protected viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

  protected isLoadingDoctors = false;
  protected isLoadingSlots = false;
  protected isBooking = false;

  ngOnInit(): void {
    this.loadDoctors();
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
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.viewMonth);
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
    return this.slots.filter((slot) => this.slotHour(slot) < 12);
  }

  protected get afternoonSlots(): Slot[] {
    return this.slots.filter((slot) => this.slotHour(slot) >= 12);
  }

  protected selectDoctor(doctor: DoctorAvailability): void {
    this.selectedDoctor = doctor;
    this.viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.selectedDate = this.toIsoDate(this.today);
    this.selectedSlot = null;
    this.loadSlots();
  }

  protected backToDoctors(): void {
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

    this.isBooking = true;
    this.appointmentsService
      .book({
        doctor_id: this.selectedDoctor.id,
        date: this.selectedDate,
        time: this.selectedSlot.startTime,
        reason: 'Consultation',
      })
      .pipe(finalize(() => (this.isBooking = false)))
      .subscribe({
        next: () => {
          this.toast.success('Appointment booked successfully.');
          this.router.navigate(['/patient/appointments']);
        },
        error: (error: HttpErrorResponse) => {
          this.toast.error(this.extractErrorMessage(error), 'Booking failed');
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
