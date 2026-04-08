import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, SectionCardComponent],
  template: `
    <app-page-header title="Patient Dashboard" subtitle="Track upcoming appointments and next actions." />
    <div class="grid gap-4 md:grid-cols-3">
      <app-section-card>
        <p class="text-sm text-slate-500">Next Appointment</p>
        <p class="text-lg font-semibold">No confirmed appointment</p>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">Quick Actions</p>
        <a class="btn-primary mt-2 inline-block" routerLink="/patient/book">Book Appointment</a>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">Settings</p>
        <a class="btn-secondary mt-2 inline-block" routerLink="/settings">Manage Preferences</a>
      </app-section-card>
    </div>
  `
})
export class PatientDashboardPage {}
