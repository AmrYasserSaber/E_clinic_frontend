import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { QueueItem } from '../queue.service';

@Component({
  selector: 'app-queue-item',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-surface-container-lowest soft-neumorphic rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6 group"
      [ngClass]="{
        'border border-transparent hover:border-primary/10 hover:-translate-y-0.5 transition-transform duration-300':
          item.status !== 'COMPLETED',
        'opacity-75 grayscale-[0.5] bg-surface-container-low': item.status === 'COMPLETED',
      }"
    >
      <div class="flex items-center gap-5 flex-1">
        <div
          class="h-16 w-16 rounded-xl overflow-hidden shadow-sm relative bg-primary/10 flex items-center justify-center text-primary font-bold"
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
              {{ item.appointment_time }}</span
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
              class="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all"
              (click)="checkIn.emit(item.id)"
            >
              Check-in
            </button>
          }
          @if (item.status === 'CHECKED_IN') {
            <button
              class="p-2.5 rounded-xl text-error hover:bg-error-container/20 transition-colors"
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
    if (status === 'CONFIRMED') return 'WAITING';
    return status;
  }

  statusClass(status: QueueItem['status']): string {
    if (status === 'CHECKED_IN') return 'bg-primary-container text-primary-fixed-variant';
    if (status === 'IN_PROGRESS') return 'bg-cyan-50 text-cyan-700';
    if (status === 'COMPLETED') return 'bg-slate-100 text-slate-600';
    if (status === 'NO_SHOW') return 'bg-error-container text-on-error-container';
    return 'bg-primary-container text-primary-fixed-variant';
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
