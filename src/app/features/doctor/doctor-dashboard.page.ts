import { Component, inject } from '@angular/core';
import { QueueService } from '../../services/queue.service';
import { QueueItem } from '../../models/domain.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, StatusBadgeComponent],
  template: `
    <app-page-header title="Doctor Dashboard" subtitle="Today's queue and next appointments." />
    <div class="space-y-3">
      @for (item of queue; track item.appointmentId) {
        <div class="card-surface flex items-center justify-between p-4">
          <div>
            <p class="font-semibold">{{ item.patientName }}</p>
            <p class="text-sm text-slate-500">Waiting: {{ item.waitingMinutes }} min</p>
          </div>
          <app-status-badge [status]="item.status" />
        </div>
      }
    </div>
  `
})
export class DoctorDashboardPage {
  private readonly queueService = inject(QueueService);
  protected queue: QueueItem[] = [];

  constructor() {
    this.queueService.doctorQueue().subscribe((rows) => (this.queue = rows));
  }
}
