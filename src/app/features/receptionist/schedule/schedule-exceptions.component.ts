import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, EMPTY, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AddScheduleExceptionPayload, DoctorOption, ScheduleException } from './models';
import { ScheduleService } from './schedule.service';

@Component({
  standalone: true,
  selector: 'app-schedule-exceptions',
  imports: [AsyncPipe, ReactiveFormsModule, DatePipe, NgClass],
  templateUrl: './schedule-exceptions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .neumorphic-inset {
        box-shadow:
          inset 4px 4px 8px rgba(0, 0, 0, 0.04),
          inset -4px -4px 8px rgba(255, 255, 255, 0.8);
      }
      .neumorphic-card {
        box-shadow:
          4px 4px 12px rgba(0, 0, 0, 0.06),
          -4px -4px 12px rgba(255, 255, 255, 0.8);
      }
    `,
  ],
})
export class ScheduleExceptionsComponent {
  private readonly service = inject(ScheduleService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly doctors$ = new BehaviorSubject<DoctorOption[]>([]);
  private readonly selectedDoctor$ = new BehaviorSubject<number | null>(null);
  private readonly exceptions$ = new BehaviorSubject<ScheduleException[]>([]);
  private readonly loading$ = new BehaviorSubject<boolean>(true);
  private readonly saving$ = new BehaviorSubject<boolean>(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  readonly showModal$ = new BehaviorSubject<boolean>(false);

  readonly exceptionForm = this.fb.group({
    exception_type: this.fb.control<'DAY_OFF' | 'CUSTOM_WORKING_DAY'>('DAY_OFF', {
      nonNullable: true,
    }),
    start_date: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    end_date: this.fb.control('', { nonNullable: true }),
    custom_start_time: this.fb.control('', { nonNullable: true }),
    custom_end_time: this.fb.control('', { nonNullable: true }),
    reason: this.fb.control('', { nonNullable: true }),
  });

  readonly vm$ = combineLatest({
    doctors: this.doctors$,
    selectedDoctor: this.selectedDoctor$,
    exceptions: this.exceptions$,
    loading: this.loading$,
    saving: this.saving$,
    error: this.error$,
    showModal: this.showModal$,
  });

  constructor() {
    this.loadDoctors();

    this.selectedDoctor$
      .pipe(
        switchMap((doctorId) => {
          if (!doctorId) return of([] as ScheduleException[]);
          this.loading$.next(true);
          this.error$.next(null);
          return this.service.getExceptions(doctorId).pipe(
            catchError(() => {
              this.error$.next('Failed to load exceptions.');
              return of([] as ScheduleException[]);
            }),
            finalize(() => this.loading$.next(false)),
          );
        }),
        tap((rows) => this.exceptions$.next(rows)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onDoctorChange(doctorId: string): void {
    this.selectedDoctor$.next(Number(doctorId));
  }

  openModal(): void {
    this.showModal$.next(true);
  }

  closeModal(): void {
    this.showModal$.next(false);
    this.exceptionForm.reset({
      exception_type: 'DAY_OFF',
      start_date: '',
      end_date: '',
      custom_start_time: '',
      custom_end_time: '',
      reason: '',
    });
  }

  saveException(): void {
    const doctorId = this.selectedDoctor$.value;
    if (!doctorId || this.exceptionForm.invalid) return;

    const value = this.exceptionForm.getRawValue();

    if (value.exception_type === 'CUSTOM_WORKING_DAY') {
      if (
        !value.custom_start_time ||
        !value.custom_end_time ||
        value.custom_end_time <= value.custom_start_time
      ) {
        this.error$.next('Custom working day requires valid start/end times.');
        return;
      }
    }

    const payload: AddScheduleExceptionPayload = {
      exception_type: value.exception_type,
      start_date: value.start_date,
      end_date: value.end_date || null,
      custom_start_time:
        value.exception_type === 'CUSTOM_WORKING_DAY' ? value.custom_start_time || null : null,
      custom_end_time:
        value.exception_type === 'CUSTOM_WORKING_DAY' ? value.custom_end_time || null : null,
      reason: value.reason || '',
    };

    this.saving$.next(true);
    this.service
      .addException(doctorId, payload)
      .pipe(
        tap((created) => {
          this.exceptions$.next([created, ...this.exceptions$.value]);
          this.closeModal();
        }),
        catchError(() => {
          this.error$.next('Failed to create exception.');
          return EMPTY;
        }),
        finalize(() => this.saving$.next(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  deleteException(exceptionId: number): void {
    const doctorId = this.selectedDoctor$.value;
    if (!doctorId) return;
    if (!window.confirm('Delete this exception?')) return;

    const prev = this.exceptions$.value;
    this.exceptions$.next(prev.filter((x) => x.id !== exceptionId));

    this.service
      .deleteException(doctorId, exceptionId)
      .pipe(
        catchError(() => {
          this.exceptions$.next(prev);
          this.error$.next('Failed to delete exception.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  dayClass(dayIso: string, exceptions: ScheduleException[]): string {
    const item = exceptions.find(
      (e) => e.start_date <= dayIso && (e.end_date ?? e.start_date) >= dayIso,
    );
    if (!item) return 'bg-surface-container-low';
    return item.exception_type === 'DAY_OFF'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
  }

  monthDays(): string[] {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const days: string[] = [];
    for (let d = new Date(first); d < next; d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  private loadDoctors(): void {
    this.loading$.next(true);
    this.service
      .getDoctors()
      .pipe(
        tap((rows) => {
          this.doctors$.next(rows);
          if (rows.length) this.selectedDoctor$.next(rows[0].id);
        }),
        catchError(() => {
          this.error$.next('Failed to load doctors.');
          return of([] as DoctorOption[]);
        }),
        finalize(() => this.loading$.next(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
