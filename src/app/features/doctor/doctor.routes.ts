import { Routes } from '@angular/router';
import { ConsultationEmrPage } from './consultation-emr.page';
import { DoctorDashboardComponent } from './doctor-dashboard.component';
import { DoctorScheduleComponent } from './doctor-schedule.component';
import { DoctorQueueComponent } from './doctor-queue.component';

export const DOCTOR_ROUTES: Routes = [
  { path: 'dashboard', component: DoctorDashboardComponent },
  { path: 'schedule', component: DoctorScheduleComponent },
  { path: 'queue', component: DoctorQueueComponent },
  { path: 'consultation', component: ConsultationEmrPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
