import { Routes } from '@angular/router';
import { ConsultationEmrPage } from './consultation-emr.page';
import { DoctorConsultationsPage } from './doctor-consultations.page';
import { DoctorDashboardComponent } from './doctor-dashboard.component';
import { DoctorLayoutComponent } from './doctor-layout.component';
import { DoctorProfilePage } from './doctor-profile.page';
import { DoctorScheduleComponent } from './doctor-schedule.component';
import { DoctorQueueComponent } from './doctor-queue.component';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    component: DoctorLayoutComponent,
    children: [
      { path: 'dashboard', component: DoctorDashboardComponent },
      { path: 'schedule', component: DoctorScheduleComponent },
      { path: 'queue', component: DoctorQueueComponent },
      { path: 'consultations', component: DoctorConsultationsPage },
      { path: 'consultation', component: ConsultationEmrPage },
      { path: 'profile', component: DoctorProfilePage },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
