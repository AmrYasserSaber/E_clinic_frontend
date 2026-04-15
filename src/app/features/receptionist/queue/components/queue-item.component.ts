import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { QueueItem } from '../queue.service';
import { QUEUE_STATUS_UI } from '../../../../shared/ui/queue-status-ui';
import { TimeFormatPipe } from '../../dashboard/pipes/time-format.pipe';

@Component({
  selector: 'app-queue-item',
  standalone: true,
  imports: [NgClass, TimeFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card-surface rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6 group transition-transform hover:-translate-y-0.5"
      [ngClass]="{
        'opacity-75 grayscale-[0.5] bg-surface-container-low': item.status === 'COMPLETED',
      }"
    >
      <div class="flex items-center gap-5 flex-1">
        <div
          class="glass-panel h-16 w-16 rounded-3xl overflow-hidden relative flex items-center justify-center text-(--color-primary) font-bold"
        >
          {{ initials(item.patient_name) }}
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h4
              class="font-bold text-lg font-headline"
              [ngClass]="
                item.status === 'COMPLETED' ? 'text-on-surface-variant' : 'text-on-surface'
              "
            >
              {{ item.patient_name }}
            </h4>
          </div>
          <div class="flex items-center gap-3 text-sm text-on-surface-variant">
            <span class="flex items-center gap-1"
              ><span class="material-symbols-outlined text-sm">schedule</span>
              {{ item.appointment_time | timeFormat }}</span
            >
            <span class="flex items-center gap-1"
              ><span class="material-symbols-outlined text-sm">medical_information</span>
              {{ item.doctor_name }}</span
            >
            <span class="flex items-center gap-1 font-bold text-primary">{{ waitingLabel }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <span
          class="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
          [ngClass]="statusClass(item.status)"
        >
          {{ statusLabel(item.status) }}
        </span>
        <div class="flex gap-2 ml-auto">
          @if (item.status === 'CONFIRMED') {
            <button
              class="btn-primary px-5 py-2.5 rounded-2xl text-sm"
              (click)="checkIn.emit(item.id)"
            >
              Check-in
            </button>
          }
          @if (item.status === 'CHECKED_IN') {
            <button
              class="p-2.5 rounded-2xl text-error hover:bg-error/10 transition-colors"
              (click)="noShow.emit(item.id)"
              title="Mark patient as no-show"
            >
              <span class="material-symbols-outlined">person_off</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class QueueItemComponent {
  @Input({ required: true }) item!: QueueItem;
  @Input({ required: true }) waitingLabel = '';
  @Output() checkIn = new EventEmitter<number>();
  @Output() noShow = new EventEmitter<number>();

  statusLabel(status: QueueItem['status']): string {
    return QUEUE_STATUS_UI[status].label;
  }

  statusClass(status: QueueItem['status']): string {
    return `glass-panel ${QUEUE_STATUS_UI[status].className}`;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x.charAt(0).toUpperCase())
      .join('');
  }
}
