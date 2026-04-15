import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { QueueItem } from '../dashboard.service';
import { TimeFormatPipe } from '../pipes/time-format.pipe';
import { WaitingDurationPipe } from '../pipes/waiting-duration.pipe';

@Component({
  selector: 'app-queue-list',
  standalone: true,
  imports: [TimeFormatPipe, WaitingDurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lg:col-span-12 space-y-6 mt-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-extrabold text-on-surface font-headline tracking-tight">
            Today’s queue
          </h2>
          <p class="mt-1 text-sm text-on-surface-variant">
            Quick check-in actions for confirmed patients.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-on-surface-variant"
          >
            <span class="material-symbols-outlined text-[16px] text-(--color-primary)">groups</span>
            {{ items.length }} total
          </span>
          <span
            class="glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-on-surface-variant"
          >
            <span class="material-symbols-outlined text-[16px] text-secondary">how_to_reg</span>
            {{ checkedInCount(items) }} checked-in
          </span>
        </div>
      </header>

      @if (loading) {
        <div class="card-surface rounded-3xl p-6">
          <div class="animate-pulse space-y-3">
            <div class="h-4 w-48 rounded-full bg-surface-container-highest/60"></div>
            <div class="h-3 w-80 rounded-full bg-surface-container-highest/40"></div>
            <div class="mt-4 grid gap-3">
              <div class="h-16 rounded-3xl bg-surface-container-highest/30"></div>
              <div class="h-16 rounded-3xl bg-surface-container-highest/30"></div>
            </div>
          </div>
        </div>
      } @else if (error) {
        <div class="ghost-outline bg-error/8 text-error p-4 rounded-2xl">{{ error }}</div>
      } @else if (!items.length) {
        <div class="card-surface rounded-3xl p-8 text-center">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-surface-container-low text-(--color-primary)"
          >
            <span class="material-symbols-outlined">event_available</span>
          </div>
          <p class="font-semibold text-on-surface">No queue items yet</p>
          <p class="mt-1 text-sm text-on-surface-variant">
            Confirmed appointments will appear here when available.
          </p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (item of items; track trackByQueue($index, item)) {
            <div
              class="card-surface group flex flex-col gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-4">
                <div
                  class="glass-panel flex h-12 w-12 items-center justify-center rounded-3xl font-headline text-lg font-bold text-(--color-primary)"
                >
                  {{ initials(item.patient_name) }}
                </div>
                <div>
                  <h4 class="font-bold text-on-surface">{{ item.patient_name }}</h4>
                  <p class="text-xs text-on-surface-variant flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">schedule</span>
                    {{ item.appointment_time | timeFormat }} • Waiting
                    {{ item.waiting_minutes | waitingDuration }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 sm:gap-4">
                <span
                  class="glass-panel rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase"
                  [class]="statusClass(item.status)"
                >
                  {{ item.status === 'CHECKED_IN' ? 'Checked-in' : 'Confirmed' }}
                </span>
                @if (item.status !== 'CHECKED_IN') {
                  <button
                    (click)="checkIn.emit(item.id)"
                    class="btn-primary px-4 py-2 text-xs"
                    title="Check-in patient"
                  >
                    Check-In
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class QueueListComponent {
  @Input() items: QueueItem[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() checkIn = new EventEmitter<number>();

  trackByQueue = (_: number, item: QueueItem) => item.id;

  checkedInCount(items: readonly QueueItem[]): number {
    return items.filter((item) => item.status === 'CHECKED_IN').length;
  }

  statusClass(status: QueueItem['status']): string {
    return status === 'CHECKED_IN' ? 'text-secondary' : 'text-(--color-primary)';
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() ?? '')
      .join('');
  }
}
