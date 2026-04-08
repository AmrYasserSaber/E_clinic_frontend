import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Settings" subtitle="Manage notifications, account and accessibility options." />
    <div class="card-surface space-y-3 p-4">
      <label class="flex items-center justify-between">
        <span>Email reminders</span>
        <input type="checkbox" checked />
      </label>
      <label class="flex items-center justify-between">
        <span>SMS reminders</span>
        <input type="checkbox" />
      </label>
    </div>
  `
})
export class SettingsPage {}
