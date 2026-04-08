import { Component, inject } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, SectionCardComponent],
  template: `
    <app-page-header title="Admin Dashboard" subtitle="Clinic analytics and export controls." />
    <div class="grid gap-4 md:grid-cols-3">
      <app-section-card>
        <p class="text-sm text-slate-500">Total appointments</p>
        <p class="text-2xl font-semibold">{{ analytics['total_appointments'] ?? '—' }}</p>
      </app-section-card>
      <app-section-card>
        <p class="text-sm text-slate-500">No-show rate</p>
        <p class="text-2xl font-semibold">{{ analytics['no_show_rate'] ?? '—' }}</p>
      </app-section-card>
      <app-section-card>
        <button class="btn-primary" (click)="exportCsv()">Export CSV</button>
      </app-section-card>
    </div>
  `
})
export class AdminDashboardPage {
  private readonly adminService = inject(AdminService);
  protected analytics: Record<string, unknown> = {};

  constructor() {
    this.adminService.analytics().subscribe((data) => (this.analytics = data));
  }

  exportCsv(): void {
    this.adminService.exportCsv().subscribe();
  }
}
