import { Component, inject } from '@angular/core';
import { QueueService } from '../../services/queue.service';
import { QueueItem } from '../../models/domain.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Queue Management" subtitle="Checked-in patients appear first." />
    <div class="space-y-2">
      @for (item of queue; track item.appointmentId) {
        <article class="card-surface flex items-center justify-between p-3">
          <div>
            <p class="font-medium">{{ item.patientName }}</p>
            <p class="text-xs text-slate-500">Waiting {{ item.waitingMinutes }} min</p>
          </div>
          <app-status-badge [status]="item.status" />
        </article>
      }
    </div>
  `
})
export class QueueManagementPage {
  private readonly queueService = inject(QueueService);
  protected queue: QueueItem[] = [];

  constructor() {
    this.queueService.queue(new Date().toISOString().slice(0, 10)).subscribe((rows) => (this.queue = rows));
  }
}
