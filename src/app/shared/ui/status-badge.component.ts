import { Component, computed, input } from '@angular/core';
import { AppointmentStatus } from '../../models/domain.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="rounded-full px-2 py-1 text-xs font-medium" [class]="classes()">{{ status() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();
  readonly classes = computed(() => {
    switch (this.status()) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'bg-rose-100 text-rose-700';
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  });
}
