import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BehaviorSubject, EMPTY, combineLatest, interval, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DashboardService, DoctorAvailability, QueueItem } from './dashboard.service';
import { DashboardSummaryComponent } from './components/dashboard-summary.component';
import { DoctorAvailabilityComponent } from './components/doctor-availability.component';
import { QueueListComponent } from './components/queue-list.component';

interface DashboardVm {
  queueItems: QueueItem[];
  totalAppointments: number;
  doctors: DoctorAvailability[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Component({
  standalone: true,
  selector: 'app-receptionist-dashboard',
  imports: [
    AsyncPipe,
    DatePipe,
    DashboardSummaryComponent,
    DoctorAvailabilityComponent,
    QueueListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styles: [
    `
      .neumorphic-lift {
        box-shadow:
          -5px -5px 15px rgba(255, 255, 255, 0.8),
          8px 8px 20px rgba(0, 180, 216, 0.08);
      }
      .neumorphic-inset {
        box-shadow:
          inset -2px -2px 6px rgba(255, 255, 255, 0.8),
          inset 2px 2px 6px rgba(0, 180, 216, 0.06);
      }
      .cyan-gradient {
        background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly queueItemsSubject = new BehaviorSubject<QueueItem[]>([]);
  private readonly doctorsSubject = new BehaviorSubject<DoctorAvailability[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly lastUpdatedSubject = new BehaviorSubject<Date | null>(null);

  readonly vm$ = combineLatest({
    queueItems: this.queueItemsSubject.asObservable(),
    doctors: this.doctorsSubject.asObservable(),
    loading: this.loadingSubject.asObservable(),
    error: this.errorSubject.asObservable(),
    lastUpdated: this.lastUpdatedSubject.asObservable(),
  }).pipe(
    map(
      (state) =>
        ({
          ...state,
          totalAppointments: state.queueItems.length,
        }) as DashboardVm,
    ),
  );

  constructor() {
    this.startQueuePolling();
    this.loadDoctorAvailability();
  }

  onCheckIn(appointmentId: number): void {
    const previous = this.queueItemsSubject.value;
    const nowIso = new Date().toISOString();

    const optimistic = previous
      .map((item) =>
        item.id === appointmentId
          ? {
              ...item,
              status: 'CHECKED_IN' as const,
              check_in_time: nowIso,
              waiting_minutes: 0,
            }
          : item,
      )
      .sort(this.queueSort);

    this.queueItemsSubject.next(optimistic);

    this.service
      .checkIn(appointmentId)
      .pipe(
        catchError(() => {
          this.queueItemsSubject.next(previous);
          this.errorSubject.next('Failed to check-in patient.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private startQueuePolling(): void {
    interval(30000)
      .pipe(
        startWith(0),
        tap(() => {
          this.loadingSubject.next(true);
          this.errorSubject.next(null);
        }),
        switchMap(() =>
          this.service.getQueue(this.todayIso()).pipe(
            catchError(() => {
              this.errorSubject.next('Unable to load queue data.');
              return EMPTY;
            }),
            finalize(() => this.loadingSubject.next(false)),
          ),
        ),
        tap((items) => {
          this.queueItemsSubject.next(items.sort(this.queueSort));
          this.lastUpdatedSubject.next(new Date());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadDoctorAvailability(): void {
    this.service
      .getDoctorAvailability()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => this.doctorsSubject.next(rows));
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private readonly queueSort = (a: QueueItem, b: QueueItem): number => {
    const rank = (status: QueueItem['status']) => (status === 'CHECKED_IN' ? 0 : 1);
    const statusDiff = rank(a.status) - rank(b.status);
    if (statusDiff !== 0) return statusDiff;

    if (a.status === 'CHECKED_IN' && b.status === 'CHECKED_IN') {
      return (a.check_in_time ?? '').localeCompare(b.check_in_time ?? '');
    }

    return a.appointment_time.localeCompare(b.appointment_time);
  };
}
