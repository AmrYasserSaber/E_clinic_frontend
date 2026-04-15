import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { catchError, finalize, interval, of, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AppointmentStatus } from '../../models/domain.models';
import {
  DoctorAppointment,
  DoctorQueueResponse,
  DoctorQueueItem,
  DoctorService,
} from '../../services/doctor.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ToastService } from '../../core/toast/toast.service';
import { ConsultationModalComponent } from './consultation-modal.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConsultationModalComponent,
  ],
  template: `
    <app-page-header
      title="Doctor Dashboard"
      subtitle="Live queue updates every 30 seconds with upcoming appointments."
    />

    <section class="card-surface mb-6 p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-(--color-on-surface)">Today at a glance</h2>
          <p class="mt-1 text-xs text-on-surface-variant">
            Queue date:
            <span class="font-semibold text-(--color-on-surface)">{{ queueDate() }}</span>
            · Upcoming window:
            <span class="font-semibold text-(--color-on-surface)">
              {{ todayIso }} → {{ datePlusSevenIso }}
            </span>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a class="btn-secondary" routerLink="/doctor/queue">Open Queue</a>
          <a class="btn-secondary" routerLink="/doctor/schedule">Schedule</a>
          <a class="btn-secondary" routerLink="/doctor/consultations">Consultations</a>
          <button
            class="btn-primary"
            type="button"
            [disabled]="loadingQueue()"
            (click)="refreshQueue()"
          >
            Refresh now
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-3xl bg-surface-container-low p-4">
          <p class="text-xs font-semibold text-on-surface-variant">Checked-in</p>
          <p class="mt-2 text-2xl font-bold text-(--color-on-surface)">{{ checkedInCount() }}</p>
          <p class="mt-1 text-xs text-on-surface-variant">Patients waiting now</p>
        </div>
        <div class="rounded-3xl bg-surface-container-low p-4">
          <p class="text-xs font-semibold text-on-surface-variant">Confirmed</p>
          <p class="mt-2 text-2xl font-bold text-(--color-on-surface)">{{ confirmedCount() }}</p>
          <p class="mt-1 text-xs text-on-surface-variant">Arriving later today</p>
        </div>
        <div class="rounded-3xl bg-surface-container-low p-4">
          <p class="text-xs font-semibold text-on-surface-variant">Upcoming</p>
          <p class="mt-2 text-2xl font-bold text-(--color-on-surface)">{{ upcomingCount() }}</p>
          <p class="mt-1 text-xs text-on-surface-variant">Next 7 days</p>
        </div>
        <div class="rounded-3xl bg-surface-container-low p-4">
          <p class="text-xs font-semibold text-on-surface-variant">Next patient</p>
          <p class="mt-2 truncate text-sm font-semibold text-(--color-on-surface)">
            {{ nextPatientLabel() }}
          </p>
          <p class="mt-1 text-xs text-on-surface-variant">
            {{ nextPatientMeta() }}
          </p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-3">
      <section class="lg:col-span-2 card-surface p-5">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-(--color-on-surface)">Today's Queue</h2>
            <p class="text-xs text-on-surface-variant">
              Ordered by check-in then appointment time.
            </p>
          </div>
          <span
            class="glass-panel rounded-full px-3 py-1 text-xs font-semibold text-(--color-primary)"
          >
            Auto-refresh 30s
          </span>
        </div>

        @if (queueError()) {
          <p
            class="ghost-outline mb-3 rounded-2xl bg-error/8 px-3 py-2 text-sm font-medium text-error"
          >
            {{ queueError() }}
          </p>
        }

        @if (loadingQueue()) {
          <div class="space-y-3">
            @for (s of skeletonRows; track s) {
              <div class="rounded-3xl bg-surface-container-low p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="h-4 w-40 rounded bg-black/10"></div>
                    <div class="mt-2 h-3 w-64 rounded bg-black/8"></div>
                  </div>
                  <div class="h-7 w-24 rounded-full bg-black/10"></div>
                </div>
              </div>
            }
          </div>
        } @else if (queue().length === 0) {
          <app-empty-state
            title="Queue is currently empty"
            message="No confirmed or checked-in patients found for today."
          />
        } @else {
          <div class="space-y-3">
            @for (item of queue(); track item.id; let i = $index) {
              <article
                class="rounded-3xl p-4"
                [class.bg-surface-container-low]="item.status !== 'CHECKED_IN'"
                [class.bg-(--color-primary)]="item.status === 'CHECKED_IN'"
                [class.text-white]="item.status === 'CHECKED_IN'"
              >
                <div class="flex flex-col gap-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="rounded-full px-2.5 py-1 text-xs font-semibold"
                          [class.bg-black/5]="item.status !== 'CHECKED_IN'"
                          [class.text-(--color-on-surface-variant)]="item.status !== 'CHECKED_IN'"
                          [class.bg-white/10]="item.status === 'CHECKED_IN'"
                          [class.text-white]="item.status === 'CHECKED_IN'"
                        >
                          Queue #{{ i + 1 }}
                        </span>
                        <app-status-badge
                          [status]="item.status"
                          [isInverted]="item.status === 'CHECKED_IN'"
                        />
                      </div>
                      <p
                        class="mt-2 truncate text-base font-semibold"
                        [class.text-white]="item.status === 'CHECKED_IN'"
                        [class.text-(--color-on-surface)]="item.status !== 'CHECKED_IN'"
                      >
                        {{ item.patient_full_name }}
                      </p>
                      <p
                        class="text-xs"
                        [class.text-white/85]="item.status === 'CHECKED_IN'"
                        [class.text-on-surface-variant]="item.status !== 'CHECKED_IN'"
                      >
                        Check-in: {{ formatCheckInTime(item.check_in_time) }} · Waiting:
                        {{ waitingLabel(item.waiting_time_minutes) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2">
                    @if (item.status === 'REQUESTED') {
                      <button
                        class="btn-primary"
                        type="button"
                        [disabled]="isActionBusy(item.id)"
                        (click)="confirm(item)"
                      >
                        Confirm
                      </button>
                      <button
                        class="btn-secondary bg-error/8! text-error! hover:bg-error/12!"
                        type="button"
                        [disabled]="isActionBusy(item.id)"
                        (click)="openDeclineDialog(item)"
                      >
                        Decline
                      </button>
                    }

                    @if (item.status === 'CHECKED_IN') {
                      <button
                        class="btn-secondary bg-white! text-(--color-primary)!"
                        type="button"
                        [disabled]="isActionBusy(item.id)"
                        (click)="openConsultationModal(item)"
                      >
                        Complete Consultation
                      </button>
                      <button
                        class="btn-secondary bg-white/10! text-white! hover:bg-white/15!"
                        type="button"
                        [disabled]="isActionBusy(item.id)"
                        (click)="openNoShowDialog(item)"
                      >
                        No-Show
                      </button>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <section class="card-surface p-5">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-(--color-on-surface)">Upcoming 7 Days</h2>
          <p class="text-xs text-on-surface-variant">
            From {{ todayIso }} to {{ datePlusSevenIso }}
          </p>
        </div>

        @if (upcomingError()) {
          <p
            class="ghost-outline mb-3 rounded-2xl bg-error/8 px-3 py-2 text-sm font-medium text-error"
          >
            {{ upcomingError() }}
          </p>
        }

        @if (loadingUpcoming()) {
          <div class="space-y-3">
            @for (s of skeletonRows; track s) {
              <div class="rounded-3xl bg-surface-container-low p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="h-4 w-44 rounded bg-black/10"></div>
                    <div class="mt-2 h-3 w-36 rounded bg-black/8"></div>
                  </div>
                  <div class="h-7 w-24 rounded-full bg-black/10"></div>
                </div>
              </div>
            }
          </div>
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
    </div>

    @if (declineTarget()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
        <div class="card-surface w-full max-w-md p-5">
          <h3 class="text-base font-semibold text-(--color-on-surface)">Decline Appointment</h3>
          <p class="mt-1 text-sm text-on-surface-variant">Reason is optional.</p>

          <textarea
            class="input-ui mt-3 min-h-24"
            [formControl]="declineReason"
            placeholder="Optional decline reason"
          ></textarea>

          <div class="mt-4 flex justify-end gap-2">
            <button class="btn-secondary" type="button" (click)="closeDeclineDialog()">
              Cancel
            </button>
            <button
              class="btn-primary"
              type="button"
              [disabled]="isActionBusy(declineTarget()!.id)"
              (click)="submitDecline()"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    }

    @if (noShowTarget()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
        <div class="card-surface w-full max-w-md p-5">
          <h3 class="text-base font-semibold text-(--color-on-surface)">Mark No-Show</h3>
          <p class="mt-1 text-sm text-on-surface-variant">
            Are you sure you want to mark {{ noShowTarget()!.patient_full_name }} as no-show?
          </p>

          <div class="mt-4 flex justify-end gap-2">
            <button class="btn-secondary" type="button" (click)="closeNoShowDialog()">
              Cancel
            </button>
            <button
              class="btn-primary"
              type="button"
              [disabled]="isActionBusy(noShowTarget()!.id)"
              (click)="submitNoShow()"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    }

    @if (consultationTarget()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
        <app-consultation-modal
          [appointmentId]="consultationTarget()!.id"
          [patientName]="consultationTarget()!.patient_full_name"
          (closed)="closeConsultationModal()"
          (success)="handleConsultationSuccess($event)"
        />
      </div>
    }
  `,
})
export class DoctorDashboardComponent {
  private readonly doctorService = inject(DoctorService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly queue = signal<DoctorQueueItem[]>([]);
  protected readonly upcoming = signal<DoctorAppointment[]>([]);
  protected readonly queueDate = signal('today');
  protected readonly loadingQueue = signal(true);
  protected readonly loadingUpcoming = signal(true);
  protected readonly queueError = signal('');
  protected readonly upcomingError = signal('');
  protected readonly declineTarget = signal<DoctorQueueItem | null>(null);
  protected readonly noShowTarget = signal<DoctorQueueItem | null>(null);
  protected readonly consultationTarget = signal<DoctorQueueItem | null>(null);
  protected readonly declineReason = new FormControl('', { nonNullable: true });
  protected readonly actionBusyIds = signal<Set<number>>(new Set<number>());

  protected readonly todayIso = this.toDateOnly(new Date());
  protected readonly datePlusSevenIso = this.toDateOnly(this.addDays(new Date(), 7));
  protected readonly skeletonRows = [0, 1, 2] as const;

  protected readonly checkedInCount = computed(
    () => this.queue().filter((r) => r.status === 'CHECKED_IN').length,
  );
  protected readonly confirmedCount = computed(
    () => this.queue().filter((r) => r.status === 'CONFIRMED').length,
  );
  protected readonly upcomingCount = computed(() => this.upcoming().length);
  protected readonly nextPatientLabel = computed(() => {
    const firstCheckedIn = this.queue().find((r) => r.status === 'CHECKED_IN');
    if (firstCheckedIn) return firstCheckedIn.patient_full_name;
    const firstConfirmed = this.queue().find((r) => r.status === 'CONFIRMED');
    if (firstConfirmed) return firstConfirmed.patient_full_name;
    return 'No one in queue';
  });
  protected readonly nextPatientMeta = computed(() => {
    const firstCheckedIn = this.queue().find((r) => r.status === 'CHECKED_IN');
    if (firstCheckedIn) return `Waiting: ${this.waitingLabel(firstCheckedIn.waiting_time_minutes)}`;
    const firstConfirmed = this.queue().find((r) => r.status === 'CONFIRMED');
    if (firstConfirmed) return `Time: ${firstConfirmed.appointment_time || 'N/A'}`;
    return 'You are all caught up.';
  });

  constructor() {
    this.startQueuePolling();
    this.loadUpcomingAppointments();
  }

  protected refreshQueue(): void {
    if (this.loadingQueue()) {
      return;
    }
    this.loadingQueue.set(true);
    this.queueError.set('');
    this.doctorService
      .getQueue()
      .pipe(
        finalize(() => this.loadingQueue.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.queueDate.set(response.date || this.todayIso);
          this.queue.set(response.items || []);
        },
        error: (err: unknown) => {
          this.queueError.set(this.extractErrorMessage(err));
        },
      });
  }

  protected confirm(item: DoctorQueueItem): void {
    if (this.isActionBusy(item.id)) {
      return;
    }
    this.setActionBusy(item.id, true);
    this.doctorService
      .confirmAppointment(item.id)
      .pipe(
        finalize(() => this.setActionBusy(item.id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.patchQueueStatus(updated.id, updated.status);
          this.toast.success('Appointment confirmed successfully.');
          this.loadUpcomingAppointments();
        },
        error: (err: unknown) => {
          this.toast.error(this.extractErrorMessage(err), 'Confirm failed');
        },
      });
  }

  protected openDeclineDialog(item: DoctorQueueItem): void {
    this.declineReason.setValue('');
    this.declineTarget.set(item);
  }

  protected closeDeclineDialog(): void {
    this.declineTarget.set(null);
    this.declineReason.setValue('');
  }

  protected submitDecline(): void {
    const item = this.declineTarget();
    if (!item || this.isActionBusy(item.id)) {
      return;
    }
    this.setActionBusy(item.id, true);
    this.doctorService
      .declineAppointment(item.id, this.declineReason.value.trim() || undefined)
      .pipe(
        finalize(() => this.setActionBusy(item.id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.patchQueueStatus(updated.id, updated.status);
          this.closeDeclineDialog();
          this.toast.success('Appointment declined.');
          this.loadUpcomingAppointments();
        },
        error: (err: unknown) => {
          this.toast.error(this.extractErrorMessage(err), 'Decline failed');
        },
      });
  }

  protected openNoShowDialog(item: DoctorQueueItem): void {
    this.noShowTarget.set(item);
  }

  protected closeNoShowDialog(): void {
    this.noShowTarget.set(null);
  }

  protected openConsultationModal(item: DoctorQueueItem): void {
    this.consultationTarget.set(item);
  }

  protected closeConsultationModal(): void {
    this.consultationTarget.set(null);
  }

  protected handleConsultationSuccess(updated: DoctorAppointment): void {
    this.patchQueueStatus(updated.id, updated.status);
    this.closeConsultationModal();
    this.toast.success('Consultation completed.');
    this.loadUpcomingAppointments();
  }

  protected submitNoShow(): void {
    const item = this.noShowTarget();
    if (!item || this.isActionBusy(item.id)) {
      return;
    }
    this.setActionBusy(item.id, true);
    this.doctorService
      .noShowAppointment(item.id)
      .pipe(
        finalize(() => this.setActionBusy(item.id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.patchQueueStatus(updated.id, updated.status);
          this.closeNoShowDialog();
          this.toast.success('Appointment marked as no-show.');
          this.loadUpcomingAppointments();
        },
        error: (err: unknown) => {
          this.toast.error(this.extractErrorMessage(err), 'No-show failed');
        },
      });
  }

  protected isActionBusy(id: number): boolean {
    return this.actionBusyIds().has(id);
  }

  protected waitingLabel(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }
    return `${value} min`;
  }

  protected formatCheckInTime(value: string | null): string {
    if (!value) {
      return 'N/A';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  protected patientName(appt: DoctorAppointment): string {
    const first = appt.patient_info?.first_name ?? '';
    const last = appt.patient_info?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown patient';
  }

  private startQueuePolling(): void {
    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.doctorService.getQueue().pipe(
            catchError((err: unknown) => {
              this.queueError.set(this.extractErrorMessage(err));
              return of<DoctorQueueResponse>({ date: this.todayIso, items: [] });
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.queueDate.set(response.date || this.todayIso);
        this.queue.set(response.items || []);
        this.loadingQueue.set(false);
      });
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

  private patchQueueStatus(id: number, status: AppointmentStatus): void {
    this.queue.update((rows) =>
      rows.map((row) => {
        if (row.id !== id) {
          return row;
        }
        return { ...row, status };
      }),
    );
  }

  private setActionBusy(id: number, isBusy: boolean): void {
    this.actionBusyIds.update((current) => {
      const next = new Set(current);
      if (isBusy) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Request failed. Please try again.';
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
