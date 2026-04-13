import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-soft">
      <a
        class="btn-secondary"
        routerLink="/admin/dashboard"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Dashboard
      </a>
      <a class="btn-secondary" routerLink="/admin/users" routerLinkActive="!bg-cyan-600 !text-white">Users</a>
      <a
        class="btn-secondary"
        routerLink="/admin/analytics"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Analytics
      </a>
      <a class="btn-secondary" routerLink="/admin/export" routerLinkActive="!bg-cyan-600 !text-white">Export</a>
      <a
        class="btn-secondary"
        routerLink="/admin/patients"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Patients
      </a>
    </nav>
  `
})
export class AdminNavComponent {}
