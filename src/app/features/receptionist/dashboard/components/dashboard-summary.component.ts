import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="bg-surface-container-lowest rounded-xl p-6 neumorphic-lift flex flex-col justify-between h-44 border-t-4 border-primary"
      >
        <div class="flex items-center justify-between">
          <span class="text-on-surface-variant font-medium text-sm">Total Appointments Today</span>
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">event_note</span>
          </div>
        </div>
        <div>
          <h3 class="text-4xl font-extrabold text-on-surface font-headline">
            {{ totalAppointments }}
          </h3>
          <p class="text-secondary text-xs font-semibold mt-1">Live from queue API</p>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-6 neumorphic-lift md:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <span class="text-on-surface-variant font-medium text-sm"
            >Current Doctor Availability</span
          >
          <span
            class="text-xs bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-bold"
            >LIVE STATUS</span
          >
        </div>
        <ng-content />
      </div>
    </section>
  `,
})
export class DashboardSummaryComponent {
  @Input({ required: true }) totalAppointments = 0;
}
