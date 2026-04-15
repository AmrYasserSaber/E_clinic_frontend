import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, combineLatest, interval, merge, of } from 'rxjs';
import { catchError, finalize, map, skip, startWith, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface AppointmentApiRow {
  id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  patient_info?: { first_name?: string; last_name?: string; email?: string };
  doctor_info?: { first_name?: string; last_name?: string };
}

interface RequestRow {
  id: number;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
}

@Component({
  selector: 'app-appointment-requests',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pt-24 px-6 w-full space-y-6 min-h-screen">
      @if (vm$ | async; as vm) {
        <div class="flex items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-on-surface">Appointment Requests</h1>
            <p class="text-on-surface-variant">Review patient requests and confirm them.</p>
          </div>
          <button
            class="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-sm font-semibold"
            (click)="reloadNow()"
            [disabled]="vm.loading"
          >
            Refresh
          </button>
        </div>

        @if (vm.toast) {
          <div class="rounded-xl bg-primary text-white px-4 py-3">{{ vm.toast }}</div>
        }

        @if (vm.error) {
          <div class="rounded-xl bg-error-container text-on-error-container px-4 py-3">
            {{ vm.error }}
          </div>
        }

        @if (vm.loading) {
          <div class="rounded-2xl bg-surface-container-lowest p-6">Loading requests...</div>
        } @else if (!vm.items.length) {
          <div class="rounded-2xl bg-surface-container-lowest p-6 text-on-surface-variant">
            No pending appointment requests.
          </div>
        } @else {
          <div class="space-y-4">
            @for (item of vm.items; track item.id) {
              <article class="card-surface rounded-3xl p-5">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div class="space-y-1">
                    <h3 class="text-lg font-bold text-on-surface">{{ item.patientName }}</h3>
                    <p class="text-sm text-on-surface-variant">
                      {{ item.patientEmail || 'No email' }}
                    </p>
                    <p class="text-sm text-on-surface-variant">
                      {{ item.date | date: 'fullDate' }} • {{ item.time }}
                    </p>
                    <p class="text-sm font-semibold text-primary">Doctor: {{ item.doctorName }}</p>
                    <p class="text-sm text-on-surface">Reason: {{ item.reason || '—' }}</p>
                  </div>
                  <button
                    class="btn-primary"
                    (click)="confirm(item.id)"
                    [disabled]="vm.confirmingIds.has(item.id)"
                  >
                    {{ vm.confirmingIds.has(item.id) ? 'Confirming...' : 'Confirm Request' }}
                  </button>
                </div>
              </article>
            }
          </div>
        }
      }
    </main>
  `,
})
export class AppointmentRequestsComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loading$ = new BehaviorSubject<boolean>(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly items$ = new BehaviorSubject<RequestRow[]>([]);
  private readonly toast$ = new BehaviorSubject<string | null>(null);
  private readonly confirmingIds$ = new BehaviorSubject<Set<number>>(new Set<number>());
  private readonly refreshTick$ = new BehaviorSubject<number>(0);

  readonly vm$ = combineLatest({
    loading: this.loading$,
    error: this.error$,
    items: this.items$,
    toast: this.toast$,
    confirmingIds: this.confirmingIds$,
  });

  constructor() {
    merge(interval(30000), this.refreshTick$.pipe(skip(1)))
      .pipe(
        startWith(0),
        tap(() => {
          this.loading$.next(true);
          this.error$.next(null);
        }),
        switchMap(() =>
          this.fetchRequests().pipe(
            tap((rows) => this.items$.next(rows)),
            catchError((error) => {
              console.error('[AppointmentRequests] Failed to load appointment requests', error);
              this.error$.next('Failed to load appointment requests.');
              return of(this.items$.value);
            }),
            finalize(() => this.loading$.next(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  reloadNow(): void {
    this.refreshTick$.next(Date.now());
  }

  confirm(id: number): void {
    const set = new Set(this.confirmingIds$.value);
    set.add(id);
    this.confirmingIds$.next(set);

    this.http
      .patch(`/api/appointments/${id}/confirm/`, {})
      .pipe(
        tap(() => {
          this.items$.next(this.items$.value.filter((x) => x.id !== id));
          this.toast$.next('Appointment confirmed successfully.');
          setTimeout(() => this.toast$.next(null), 2500);
        }),
        catchError(() => {
          this.error$.next('Failed to confirm appointment.');
          return EMPTY;
        }),
        finalize(() => {
          const nextSet = new Set(this.confirmingIds$.value);
          nextSet.delete(id);
          this.confirmingIds$.next(nextSet);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private fetchRequests() {
    const today = new Date().toISOString().slice(0, 10);
    const params = new HttpParams().set('status', 'REQUESTED').set('date_from', today);

    return this.http.get<AppointmentApiRow[]>('/api/appointments/', { params }).pipe(
      map((rows) =>
        rows.map((row) => ({
          id: row.id,
          patientName:
            `${row.patient_info?.first_name ?? ''} ${row.patient_info?.last_name ?? ''}`.trim(),
          patientEmail: row.patient_info?.email ?? '',
          doctorName:
            `${row.doctor_info?.first_name ?? ''} ${row.doctor_info?.last_name ?? ''}`.trim() ||
            'Assigned Doctor',
          date: row.appointment_date,
          time: (row.appointment_time ?? '').slice(0, 5),
          reason: row.reason ?? '',
        })),
      ),
    );
  }
}
