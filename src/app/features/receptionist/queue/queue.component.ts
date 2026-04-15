import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { BehaviorSubject, EMPTY, combineLatest, interval, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { QueueFilter, QueueItem, QueueService } from './queue.service';
import { QueueFiltersComponent } from './components/queue-filters.component';
import { QueueListComponent } from './components/queue-list.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';

interface QueueVm {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  filter: QueueFilter;
  list: QueueItem[];
  waitingCount: number;
}

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [AsyncPipe, DatePipe, PageHeaderComponent, QueueFiltersComponent, QueueListComponent],
  templateUrl: './queue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueComponent {
  private readonly queueService = inject(QueueService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loading$ = new BehaviorSubject<boolean>(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly queue$ = new BehaviorSubject<QueueItem[]>([]);
  private readonly filter$ = new BehaviorSubject<QueueFilter>('ALL');
  private readonly updatedAt$ = new BehaviorSubject<Date | null>(null);
  protected readonly noShowTarget = signal<QueueItem | null>(null);

  readonly vm$ = combineLatest({
    loading: this.loading$,
    error: this.error$,
    all: this.queue$,
    filter: this.filter$,
    lastUpdated: this.updatedAt$,
  }).pipe(
    map((state) => {
      const filtered = this.applyFilter(state.all, state.filter);
      return {
        loading: state.loading,
        error: state.error,
        lastUpdated: state.lastUpdated,
        filter: state.filter,
        list: filtered,
        waitingCount: state.all.filter((x) => x.status === 'CHECKED_IN').length,
      } as QueueVm;
    }),
  );

  constructor() {
    this.startPolling();
  }

  onFilterChange(filter: QueueFilter): void {
    this.filter$.next(filter);
  }

  onCheckIn(id: number): void {
    const previous = this.queue$.value;
    const optimistic = this.sortQueue(
      previous.map((x) =>
        x.id === id
          ? {
              ...x,
              status: 'CHECKED_IN',
              check_in_time: new Date().toISOString(),
            }
          : x,
      ),
    );

    this.queue$.next(optimistic);

    this.queueService
      .checkIn(id)
      .pipe(
        catchError(() => {
          this.queue$.next(previous);
          this.error$.next('Check-in failed.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onNoShow(id: number): void {
    const target = this.queue$.value.find((x) => x.id === id) ?? null;
    this.noShowTarget.set(target);
  }

  protected closeNoShowDialog(): void {
    this.noShowTarget.set(null);
  }

  protected confirmNoShow(): void {
    const target = this.noShowTarget();
    if (!target) return;
    const id = target.id;
    this.noShowTarget.set(null);

    const previous = this.queue$.value;
    this.queue$.next(previous.filter((x) => x.id !== id));

    this.queueService
      .markNoShow(id)
      .pipe(
        catchError(() => {
          this.queue$.next(previous);
          this.error$.next(
            'No-show update failed. Only checked-in appointments can be marked no-show.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private startPolling(): void {
    interval(30000)
      .pipe(
        startWith(0),
        tap(() => {
          this.loading$.next(true);
          this.error$.next(null);
        }),
        switchMap(() =>
          this.queueService.getQueue(this.today()).pipe(
            catchError(() => {
              this.error$.next('Unable to fetch queue.');
              return of([]);
            }),
            finalize(() => this.loading$.next(false)),
          ),
        ),
        map((rows) => this.sortQueue(rows)),
        tap((rows) => {
          this.queue$.next(rows);
          this.updatedAt$.next(new Date());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private sortQueue(items: QueueItem[]): QueueItem[] {
    const rank = (s: QueueItem['status']) => {
      if (s === 'CHECKED_IN') return 0;
      if (s === 'CONFIRMED') return 1;
      return 2;
    };

    return [...items].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return a.appointment_time.localeCompare(b.appointment_time);
    });
  }

  private applyFilter(items: QueueItem[], filter: QueueFilter): QueueItem[] {
    if (filter === 'WAITING') return items.filter((x) => x.status === 'CHECKED_IN');
    return items;
  }
}
