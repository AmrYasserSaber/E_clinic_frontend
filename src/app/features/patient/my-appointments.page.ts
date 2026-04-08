import { Component, inject } from '@angular/core';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/domain.models';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent, PageHeaderComponent, EmptyStateComponent],
  template: `
    <app-page-header title="My Appointments" subtitle="Upcoming and historical visits." />
    @if (appointments.length === 0) {
      <app-empty-state title="No appointments yet" message="Book your first appointment to get started." />
    } @else {
      <div class="space-y-3">
        @for (appt of appointments; track appt.id) {
          <article class="card-surface p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ appt.doctor.fullName }}</p>
                <p class="text-sm text-slate-500">{{ appt.date }} at {{ appt.time }}</p>
              </div>
              <app-status-badge [status]="appt.status" />
            </div>
            <p class="mt-2 text-sm text-slate-600">{{ appt.reason }}</p>
          </article>
        }
      </div>
    }
  `
})
export class MyAppointmentsPage {
  private readonly service = inject(AppointmentsService);
  protected appointments: Appointment[] = [];

  constructor() {
    this.service.list().subscribe((rows) => (this.appointments = rows));
  }
}
