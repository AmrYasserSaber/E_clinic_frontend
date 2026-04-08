import { Component, inject } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="User Management" subtitle="Manage roles and active states." />
    <div class="card-surface overflow-x-auto p-4">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-slate-500">
            <th class="pb-2">Name</th>
            <th class="pb-2">Email</th>
            <th class="pb-2">Role</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users; track user['id']) {
            <tr class="border-t border-slate-100">
              <td class="py-2">{{ user['full_name'] ?? user['name'] }}</td>
              <td class="py-2">{{ user['email'] }}</td>
              <td class="py-2">{{ user['role'] }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class UserManagementPage {
  private readonly adminService = inject(AdminService);
  protected users: Record<string, unknown>[] = [];

  constructor() {
    this.adminService.users().subscribe((rows) => (this.users = rows));
  }
}
