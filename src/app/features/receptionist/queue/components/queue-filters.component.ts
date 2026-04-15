import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { QueueFilter } from '../queue.service';

@Component({
  selector: 'app-queue-filters',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-panel inline-flex gap-1 rounded-full p-1">
      @for (f of filters; track f) {
        <button
          class="rounded-full px-4 py-2 text-xs font-bold font-label transition-colors"
          [ngClass]="
            activeFilter === f
              ? 'bg-primary text-white shadow-soft'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          "
          (click)="change.emit(f)"
        >
          {{ label(f) }}
        </button>
      }
    </div>
  `,
})
export class QueueFiltersComponent {
  @Input('activefilter') activeFilter: QueueFilter = 'ALL';
  @Output() change = new EventEmitter<QueueFilter>();
  readonly filters: QueueFilter[] = ['ALL', 'WAITING'];

  label(filter: QueueFilter): string {
    return filter === 'WAITING' ? 'Waiting' : 'All';
  }
}
