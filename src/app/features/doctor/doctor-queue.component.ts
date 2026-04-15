import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, interval, of, startWith, switchMap } from 'rxjs';
import { AppointmentStatus } from '../../models/domain.models';
import {
  DoctorAppointment,
  DoctorQueueItem,
  DoctorQueueResponse,
  DoctorService,
} from '../../services/doctor.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { ToastService } from '../../core/toast/toast.service';
import { ConsultationModalComponent } from './consultation-modal.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConsultationModalComponent,
  ],
  template: `
    <app-page-header
      title="Doctor Queue"
      subtitle="Live queue view for confirmed and checked-in patients."
    />

    <section class="card-surface p-5">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-(--color-on-surface)">Today's Queue</h2>
          <p class="text-xs text-on-surface-variant">Date: {{ queueDate() }}</p>
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
        <p class="text-sm text-on-surface-variant">Loading queue...</p>
      } @else if (queue().length === 0) {
        <app-empty-state
          title="Queue is currently empty"
          message="No confirmed or checked-in patients found for today."
        />
      } @else {
        <div class="space-y-3">
          @for (item of queue(); track item.id; let i = $index) {
            <article class="card-surface rounded-3xl p-4">
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div class="space-y-1">
                  <p class="font-semibold text-(--color-on-surface)">
                    {{ item.patient_full_name }}
                  </p>
                  <p class="text-xs text-on-surface-variant">
                    Queue #{{ i + 1 }} · Check-in: {{ formatCheckInTime(item.check_in_time) }} ·
                    Waiting: {{ waitingLabel(item.waiting_time_minutes) }}
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <app-status-badge [status]="item.status" />

                  @if (item.status === 'REQUESTED') {
                    <button
                      class="btn-secondary"
                      type="button"
                      [disabled]="isActionBusy(item.id)"
                      (click)="confirm(item)"
                    >
                      Confirm
                    </button>
                    <button
                      class="btn-secondary"
                      type="button"
                      [disabled]="isActionBusy(item.id)"
                      (click)="openDeclineDialog(item)"
                    >
                      Decline
                    </button>
                  }

                  @if (item.status === 'CHECKED_IN') {
                    <button
                      class="btn-primary"
                      type="button"
                      [disabled]="isActionBusy(item.id)"
                      (click)="openConsultationModal(item)"
                    >
                      Complete Consultation
                    </button>
                    <button
                      class="btn-secondary"
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
export class DoctorQueueComponent {
  private readonly doctorService = inject(DoctorService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly queue = signal<DoctorQueueItem[]>([]);
  protected readonly queueDate = signal('today');
  protected readonly loadingQueue = signal(true);
  protected readonly queueError = signal('');
  protected readonly declineTarget = signal<DoctorQueueItem | null>(null);
  protected readonly noShowTarget = signal<DoctorQueueItem | null>(null);
  protected readonly consultationTarget = signal<DoctorQueueItem | null>(null);
  protected readonly declineReason = new FormControl('', { nonNullable: true });
  protected readonly actionBusyIds = signal<Set<number>>(new Set<number>());

  constructor() {
    this.startQueuePolling();
  }

  protected confirm(item: DoctorQueueItem): void {
    if (this.isActionBusy(item.id)) return;
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
    if (!item || this.isActionBusy(item.id)) return;

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

  protected submitNoShow(): void {
    const item = this.noShowTarget();
    if (!item || this.isActionBusy(item.id)) return;

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
        },
        error: (err: unknown) => {
          this.toast.error(this.extractErrorMessage(err), 'No-show failed');
        },
      });
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
  }

  protected isActionBusy(id: number): boolean {
    return this.actionBusyIds().has(id);
  }

  protected waitingLabel(value: number | null): string {
    return value === null ? 'N/A' : `${value} min`;
  }

  protected formatCheckInTime(value: string | null): string {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private startQueuePolling(): void {
    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.doctorService.getQueue().pipe(
            catchError((err: unknown) => {
              this.queueError.set(this.extractErrorMessage(err));
              return of<DoctorQueueResponse>({ date: '', items: [] });
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.queueDate.set(response.date || 'today');
        this.queue.set(response.items || []);
        this.loadingQueue.set(false);
      });
  }

  private patchQueueStatus(id: number, status: AppointmentStatus): void {
    this.queue.update((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
  }

  private setActionBusy(id: number, isBusy: boolean): void {
    this.actionBusyIds.update((current) => {
      const next = new Set(current);
      if (isBusy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    return 'Request failed. Please try again.';
  }
}
