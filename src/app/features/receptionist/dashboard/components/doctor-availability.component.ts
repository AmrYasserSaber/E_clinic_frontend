import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { DoctorAvailability } from '../dashboard.service';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      @for (doctor of doctors; track trackByDoctor($index, doctor)) {
        <div
          class="glass-panel shrink-0 flex items-center gap-3 px-4 py-3 rounded-3xl text-(--color-on-surface)"
        >
          <div>
            <p class="text-sm font-bold text-on-surface">{{ doctor.name }}</p>
            <p class="text-[11px] font-bold" [ngClass]="textClass(doctor.status)">
              {{ label(doctor.status) }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class DoctorAvailabilityComponent {
  @Input({ required: true }) doctors: DoctorAvailability[] = [];

  trackByDoctor = (_: number, item: DoctorAvailability) => item.id;

  label(status: DoctorAvailability['status']): string {
    if (status === 'AVAILABLE') return 'Available Now';
    if (status === 'BUSY') return 'In Consultation';
    return 'Away';
  }

  textClass(status: DoctorAvailability['status']): string {
    return status === 'AVAILABLE'
      ? 'text-primary'
      : status === 'BUSY'
        ? 'text-secondary'
        : 'text-on-surface-variant';
  }
}
