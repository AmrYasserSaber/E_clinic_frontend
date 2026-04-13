import { Routes } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard.page';
import { AdminExportPage } from './admin-export.page';
import { AdminPatientsPage } from './admin-patients.page';
import { AdminPatientDetailsPage } from './admin-patient-details.page';
import { AdminAnalyticsPage } from './admin-analytics.page';
import { UserManagementPage } from './user-management.page';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', component: AdminDashboardPage },
  { path: 'analytics', component: AdminAnalyticsPage },
  { path: 'users', component: UserManagementPage },
  { path: 'export', component: AdminExportPage },
  { path: 'patients', component: AdminPatientsPage },
  { path: 'patients/:id', component: AdminPatientDetailsPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
