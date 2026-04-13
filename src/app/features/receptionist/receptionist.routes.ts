import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { QueueComponent } from './queue/queue.component';
import { ReceptionistLayoutComponent } from './receptionist-layout.component';
import { AppointmentRequestsComponent } from './requests/appointment-requests.component';
import { ScheduleConfigurationComponent } from './schedule/schedule-configuration.component';
import { ScheduleExceptionsComponent } from './schedule/schedule-exceptions.component';

export const RECEPTIONIST_ROUTES: Routes = [
  {
    path: '',
    component: ReceptionistLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'requests', component: AppointmentRequestsComponent },
      { path: 'queue', component: QueueComponent },
      { path: 'schedule', component: ScheduleConfigurationComponent },
      { path: 'exceptions', component: ScheduleExceptionsComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
