import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { QueueFilter } from '../queue.service';

@Component({
  selector: 'app-queue-filters',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-2">
      @for (f of filters; track f) {
        <button
          class="px-4 py-2 rounded-full text-xs font-bold font-label transition-colors"
          [ngClass]="
            activeFilter === f
              ? 'bg-primary text-white'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          "
          (click)="change.emit(f)"
        >
          {{ f }}
        </button>
      }
    </div>
  `,
})
export class QueueFiltersComponent {
  @Input({ required: true }) activeFilter: QueueFilter = 'ALL';
  @Output() change = new EventEmitter<QueueFilter>();
  readonly filters: QueueFilter[] = ['ALL', 'WAITING'];
}
