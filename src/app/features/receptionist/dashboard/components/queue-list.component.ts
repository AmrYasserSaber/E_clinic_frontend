import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { QueueItem } from '../dashboard.service';
import { TimeFormatPipe } from '../pipes/time-format.pipe';
import { WaitingDurationPipe } from '../pipes/waiting-duration.pipe';

@Component({
  selector: 'app-queue-list',
  standalone: true,
  imports: [NgClass, TimeFormatPipe, WaitingDurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lg:col-span-12 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-extrabold text-on-surface font-headline tracking-tight">
          Today's Queue
        </h2>
      </div>

      @if (loading) {
        <div class="bg-surface-container-lowest p-5 rounded-xl neumorphic-lift animate-pulse">
          Loading queue...
        </div>
      } @else if (error) {
        <div class="bg-error-container text-on-error-container p-4 rounded-xl">{{ error }}</div>
      } @else if (!items.length) {
        <div
          class="bg-surface-container-lowest p-5 rounded-xl neumorphic-lift text-on-surface-variant"
        >
          No queue for selected filters.
        </div>
      } @else {
        <div class="space-y-4">
          @for (item of items; track trackByQueue($index, item)) {
            <div
              class="group flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl neumorphic-lift border-l-4 transition-all hover:-translate-y-1"
              [ngClass]="item.status === 'CHECKED_IN' ? 'border-primary' : 'border-secondary'"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center font-headline font-bold text-lg"
                  [ngClass]="
                    item.status === 'CHECKED_IN'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary'
                  "
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

              <div class="flex items-center gap-4">
                <span
                  class="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase"
                  [ngClass]="
                    item.status === 'CHECKED_IN'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-secondary/10 text-secondary'
                  "
                >
                  {{ item.status === 'CHECKED_IN' ? 'Checked-in' : 'Confirmed' }}
                </span>
                @if (item.status !== 'CHECKED_IN') {
                  <button
                    (click)="checkIn.emit(item.id)"
                    class="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90"
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

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() ?? '')
      .join('');
  }
}
