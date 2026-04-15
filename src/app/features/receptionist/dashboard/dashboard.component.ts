import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BehaviorSubject, EMPTY, Subject, combineLatest, interval, merge } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DashboardService, DoctorAvailability, QueueItem } from './dashboard.service';
import { DashboardSummaryComponent } from './components/dashboard-summary.component';
import { DoctorAvailabilityComponent } from './components/doctor-availability.component';
import { QuickActionsComponent } from './components/quick-actions.component';
import { QueueListComponent } from './components/queue-list.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';

interface DashboardVm {
  queueItems: QueueItem[];
  totalAppointments: number;
  checkedInAppointments: number;
  confirmedAppointments: number;
  averageWaitingMinutes: number;
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
    PageHeaderComponent,
    QuickActionsComponent,
    QueueListComponent,
  ],
  templateUrl: './dashboard.component.html',
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
  private readonly manualRefreshSubject = new Subject<void>();

  readonly vm$ = combineLatest({
    queueItems: this.queueItemsSubject.asObservable(),
    doctors: this.doctorsSubject.asObservable(),
    loading: this.loadingSubject.asObservable(),
    error: this.errorSubject.asObservable(),
    lastUpdated: this.lastUpdatedSubject.asObservable(),
  }).pipe(
    map((state): DashboardVm => {
      const totalAppointments: number = state.queueItems.length;
      const checkedInAppointments: number = state.queueItems.filter(
        (item) => item.status === 'CHECKED_IN',
      ).length;
      const confirmedAppointments: number = totalAppointments - checkedInAppointments;
      const waitingValues: number[] = state.queueItems
        .map((item) => item.waiting_minutes)
        .filter((value) => Number.isFinite(value) && value > 0);
      const averageWaitingMinutes: number =
        waitingValues.length > 0
          ? Math.round(waitingValues.reduce((sum, value) => sum + value, 0) / waitingValues.length)
          : 0;
      return {
        ...state,
        totalAppointments,
        checkedInAppointments,
        confirmedAppointments,
        averageWaitingMinutes,
      };
    }),
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

  onRefreshQueue(): void {
    this.manualRefreshSubject.next();
  }

  private startQueuePolling(): void {
    merge(interval(30000).pipe(startWith(0)), this.manualRefreshSubject)
      .pipe(
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
