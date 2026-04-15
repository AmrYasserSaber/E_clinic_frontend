import { Component, computed, input } from '@angular/core';
import { AppointmentStatus } from '../../models/domain.models';
import { QUEUE_STATUS_UI } from './queue-status-ui';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="glass-panel rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide"
      [class]="classes()"
      [attr.title]="helper()"
    >
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  /** When true, renders a high-contrast badge for dark/primary surfaces. */
  readonly isInverted = input<boolean>(false);
  readonly status = input.required<AppointmentStatus>();
  readonly label = computed(() => QUEUE_STATUS_UI[this.status()].label);
  readonly helper = computed(() => QUEUE_STATUS_UI[this.status()].helper);
  readonly classes = computed(() => {
    if (this.isInverted()) {
      return 'bg-white/10 text-white';
    }
    return QUEUE_STATUS_UI[this.status()].className;
  });
}
