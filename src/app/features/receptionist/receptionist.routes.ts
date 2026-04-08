import { Routes } from '@angular/router';
import { ReceptionistDashboardPage } from './receptionist-dashboard.page';
import { QueueManagementPage } from './queue-management.page';
import { ScheduleManagementPage } from './schedule-management.page';

export const RECEPTIONIST_ROUTES: Routes = [
  { path: 'dashboard', component: ReceptionistDashboardPage },
  { path: 'queue', component: QueueManagementPage },
  { path: 'schedule', component: ScheduleManagementPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
