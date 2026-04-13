import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, EMPTY, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DoctorOption, DoctorScheduleDay } from './models';
import { ScheduleService } from './schedule.service';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type DayGroup = FormGroup<{
  day_of_week: FormControl<number>;
  is_working_day: FormControl<boolean>;
  start_time: FormControl<string>;
  end_time: FormControl<string>;
  session_duration_minutes: FormControl<15 | 30 | 45 | 60>;
  buffer_minutes: FormControl<0 | 5 | 10 | 15>;
}>;

@Component({
  standalone: true,
  selector: 'app-schedule-configuration',
  imports: [AsyncPipe, ReactiveFormsModule, NgClass],
  templateUrl: './schedule-configuration.component.html',
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
      .glass-panel {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
      }
    `,
  ],
})
export class ScheduleConfigurationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ScheduleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dayNames = DAYS;
  readonly durations: Array<15 | 30 | 45 | 60> = [15, 30, 45, 60];
  readonly buffers: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];

  private readonly doctors$ = new BehaviorSubject<DoctorOption[]>([]);
  private readonly loading$ = new BehaviorSubject<boolean>(true);
  private readonly saving$ = new BehaviorSubject<boolean>(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly toast$ = new BehaviorSubject<string | null>(null);

  readonly form = this.fb.group({
    doctorId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    days: this.fb.array<DayGroup>(this.createDefaultDays()),
  });

  readonly vm$ = combineLatest({
    doctors: this.doctors$,
    loading: this.loading$,
    saving: this.saving$,
    error: this.error$,
    toast: this.toast$,
  });

  get daysArray(): FormArray<DayGroup> {
    return this.form.controls.days;
  }

  constructor() {
    this.loadDoctors();

    this.form.controls.doctorId.valueChanges
      .pipe(
        switchMap((doctorId) => {
          if (!doctorId) return of([] as DoctorScheduleDay[]);
          this.loading$.next(true);
          this.error$.next(null);
          return this.service.getDoctorSchedule(doctorId).pipe(
            catchError(() => {
              this.error$.next('Failed to load schedule.');
              return of([] as DoctorScheduleDay[]);
            }),
            finalize(() => this.loading$.next(false)),
          );
        }),
        tap((rows) => this.patchSchedule(rows)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.daysArray.controls.forEach((g) => {
      g.controls.is_working_day.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((on) => this.toggleDayInputs(g, !!on));
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const doctorId = this.form.controls.doctorId.value;
    if (!doctorId) return;

    const invalidRow = this.daysArray.controls.find((g) => this.hasInvalidTime(g));
    if (invalidRow) {
      this.error$.next('End time must be later than start time.');
      return;
    }

    const payload = this.daysArray.getRawValue() as DoctorScheduleDay[];

    this.saving$.next(true);
    this.error$.next(null);

    const request$ = this.service.updateSchedule(doctorId, payload);

    request$
      .pipe(
        tap((savedRows) => {
          this.patchSchedule(savedRows);
          this.toast$.next('Schedule saved successfully.');
          setTimeout(() => this.toast$.next(null), 2500);
        }),
        catchError(() => {
          this.error$.next('Save failed. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.saving$.next(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  cancelChanges(): void {
    const doctorId = this.form.controls.doctorId.value;
    if (!doctorId) return;
    this.loading$.next(true);
    this.service
      .getDoctorSchedule(doctorId)
      .pipe(
        tap((rows) => this.patchSchedule(rows)),
        finalize(() => this.loading$.next(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadDoctors(): void {
    this.loading$.next(true);
    this.service
      .getDoctors()
      .pipe(
        tap((doctors) => {
          this.doctors$.next(doctors);
          if (doctors.length) {
            this.form.controls.doctorId.setValue(doctors[0].id);
          }
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

  private patchSchedule(rows: DoctorScheduleDay[]): void {
    const byDay = new Map(rows.map((r) => [r.day_of_week, r]));

    this.daysArray.controls.forEach((g) => {
      const d = g.controls.day_of_week.value;
      const row = byDay.get(d);
      if (row) {
        g.patchValue(row, { emitEvent: false });
        this.toggleDayInputs(g, true);
      } else {
        g.patchValue(
          {
            is_working_day: false,
            start_time: '09:00',
            end_time: '17:00',
            session_duration_minutes: 30,
            buffer_minutes: 5,
          },
          { emitEvent: false },
        );
        this.toggleDayInputs(g, false);
      }
      g.markAsPristine();
    });
  }

  private hasInvalidTime(group: DayGroup): boolean {
    if (!group.controls.is_working_day.value) return false;
    return group.controls.end_time.value <= group.controls.start_time.value;
  }

  private toggleDayInputs(group: DayGroup, enabled: boolean): void {
    const controls = [
      group.controls.start_time,
      group.controls.end_time,
      group.controls.session_duration_minutes,
      group.controls.buffer_minutes,
    ];

    controls.forEach((c) =>
      enabled ? c.enable({ emitEvent: false }) : c.disable({ emitEvent: false }),
    );
  }

  private createDefaultDays(): DayGroup[] {
    return DAYS.map((_, day) =>
      this.fb.group({
        day_of_week: this.fb.control(day, { nonNullable: true }),
        is_working_day: this.fb.control(true, { nonNullable: true }),
        start_time: this.fb.control('09:00', { nonNullable: true }),
        end_time: this.fb.control('17:00', { nonNullable: true }),
        session_duration_minutes: this.fb.control(30 as 15 | 30 | 45 | 60, { nonNullable: true }),
        buffer_minutes: this.fb.control(5 as 0 | 5 | 10 | 15, { nonNullable: true }),
      }),
    );
  }
}
