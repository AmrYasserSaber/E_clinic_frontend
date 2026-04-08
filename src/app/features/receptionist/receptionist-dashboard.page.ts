import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, SectionCardComponent],
  template: `
    <app-page-header title="Reception Desk" subtitle="Manage queue and doctor schedules." />
    <div class="grid gap-4 md:grid-cols-2">
      <app-section-card>
        <p class="font-semibold">Queue management</p>
        <a class="btn-primary mt-2 inline-block" routerLink="/receptionist/queue">Open Queue</a>
      </app-section-card>
      <app-section-card>
        <p class="font-semibold">Schedule management</p>
        <a class="btn-secondary mt-2 inline-block" routerLink="/receptionist/schedule">Configure</a>
      </app-section-card>
    </div>
  `
})
export class ReceptionistDashboardPage {}
