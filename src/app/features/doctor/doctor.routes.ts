import { Routes } from '@angular/router';
import { DoctorDashboardPage } from './doctor-dashboard.page';
import { ConsultationEmrPage } from './consultation-emr.page';

export const DOCTOR_ROUTES: Routes = [
  { path: 'dashboard', component: DoctorDashboardPage },
  { path: 'consultation', component: ConsultationEmrPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
