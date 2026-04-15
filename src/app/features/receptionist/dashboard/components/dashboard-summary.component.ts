import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
        <div class="card-surface flex h-36 flex-col justify-between rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">Appointments today</span>
            <div class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-(--color-primary)">event_note</span>
            </div>
          </div>
          <div>
            <h3 class="font-headline text-4xl font-extrabold text-on-surface">
              {{ totalAppointments }}
            </h3>
            <p class="mt-1 text-xs font-semibold text-secondary">Live from queue</p>
          </div>
        </div>

        <div class="card-surface flex h-36 flex-col justify-between rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">Confirmed</span>
            <div class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-(--color-primary)">verified</span>
            </div>
          </div>
          <div>
            <h3 class="font-headline text-4xl font-extrabold text-on-surface">
              {{ confirmedAppointments }}
            </h3>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Expected arrivals</p>
          </div>
        </div>

        <div class="card-surface flex h-36 flex-col justify-between rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">Checked-in</span>
            <div class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-secondary">how_to_reg</span>
            </div>
          </div>
          <div>
            <h3 class="font-headline text-4xl font-extrabold text-on-surface">
              {{ checkedInAppointments }}
            </h3>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Ready for queue</p>
          </div>
        </div>

        <div class="card-surface flex h-36 flex-col justify-between rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">Avg wait</span>
            <div class="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-(--color-primary)">timer</span>
            </div>
          </div>
          <div>
            <h3 class="font-headline text-4xl font-extrabold text-on-surface">
              {{ averageWaitingMinutes }}
            </h3>
            <p class="mt-1 text-xs font-semibold text-on-surface-variant">Minutes</p>
          </div>
        </div>
      </div>

      <div class="card-surface rounded-3xl p-6 lg:col-span-7">
        <div class="mb-4 flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-on-surface-variant">Doctor availability</span>
          <span class="glass-panel rounded-full px-3 py-1 text-xs font-bold text-secondary">
            LIVE STATUS
          </span>
        </div>
        <ng-content />
      </div>
    </section>
  `,
})
export class DashboardSummaryComponent {
  @Input({ required: true }) totalAppointments = 0;
  @Input({ required: true }) confirmedAppointments = 0;
  @Input({ required: true }) checkedInAppointments = 0;
  @Input({ required: true }) averageWaitingMinutes = 0;
}
