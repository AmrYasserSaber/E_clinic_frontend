import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DoctorScheduleDay, DoctorService } from '../../services/doctor.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { SkeletonBlockComponent } from '../../shared/ui/skeleton-block.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent, SkeletonBlockComponent],
  template: `
    <app-page-header
      title="Doctor Schedule"
      subtitle="Read-only view of your assigned slots by date."
    />

    @if (loading()) {
      <div class="space-y-4">
        <app-skeleton-block [height]="56" />
        <app-skeleton-block [height]="56" />
        <app-skeleton-block [height]="56" />
      </div>
    } @else if (error()) {
      <section class="card-surface space-y-3 p-5">
        <p class="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</p>
        <button class="btn-primary" type="button" (click)="loadSchedule()">Retry</button>
      </section>
    } @else if (scheduleDays().length === 0) {
      <app-empty-state
        title="No schedule slots found"
        message="Contact receptionist to manage your schedule."
      />
    } @else {
      <div class="space-y-5">
        @for (day of scheduleDays(); track day.date) {
          <section class="card-surface p-5">
            <h2 class="mb-3 text-base font-semibold text-slate-900">{{ formatDate(day.date) }}</h2>

            <div class="space-y-2">
              @for (slot of day.slots; track slot.id) {
                <article class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">
                      {{ slot.start_time }} - {{ slot.end_time }}
                    </p>
                    <p class="text-xs text-slate-500">Duration: {{ slot.duration_minutes }} min</p>
                  </div>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [class]="slot.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
                  >
                    {{ slot.is_available ? 'Available' : 'Booked' }}
                  </span>
                </article>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class DoctorScheduleComponent {
  private readonly doctorService = inject(DoctorService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly scheduleDays = signal<DoctorScheduleDay[]>([]);

  constructor() {
    this.loadSchedule();
  }

  protected loadSchedule(): void {
    this.loading.set(true);
    this.error.set('');

    this.doctorService
      .getSchedule()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.scheduleDays.set(response.items ?? []);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(this.extractErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Failed to load schedule. Please try again.';
  }
}
