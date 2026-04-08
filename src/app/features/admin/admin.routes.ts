import { Routes } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard.page';
import { UserManagementPage } from './user-management.page';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: AdminDashboardPage },
  { path: 'users', component: UserManagementPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
