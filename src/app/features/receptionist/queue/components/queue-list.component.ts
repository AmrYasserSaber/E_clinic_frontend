import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { QueueItem } from '../queue.service';
import { QueueItemComponent } from './queue-item.component';

@Component({
  selector: 'app-queue-list',
  standalone: true,
  imports: [QueueItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      @for (patient of items; track trackByItem($index, patient)) {
        <app-queue-item
          [item]="patient"
          [waitingLabel]="waitingTime(patient)"
          (checkIn)="checkIn.emit($event)"
          (noShow)="noShow.emit($event)"
        />
      }
    </div>
  `,
})
export class QueueListComponent {
  @Input({ required: true }) items: QueueItem[] = [];
  @Output() checkIn = new EventEmitter<number>();
  @Output() noShow = new EventEmitter<number>();

  trackByItem = (_: number, item: QueueItem) => item.id;

  waitingTime(item: QueueItem): string {
    const now = new Date();
    if (item.check_in_time) {
      const diff = Math.max(
        0,
        Math.floor((now.getTime() - new Date(item.check_in_time).getTime()) / 60000),
      );
      return `Waiting ${diff}m`;
    }

    const [h, m] = item.appointment_time.split(':').map((x) => Number(x));
    const appt = new Date(now);
    appt.setHours(h || 0, m || 0, 0, 0);
    const diff = Math.max(0, Math.floor((now.getTime() - appt.getTime()) / 60000));
    return `ETA +${diff}m`;
  }
}
