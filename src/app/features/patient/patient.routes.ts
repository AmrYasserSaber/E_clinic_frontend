import { Routes } from '@angular/router';
import { PatientDashboardPage } from './patient-dashboard.page';
import { MyAppointmentsPage } from './my-appointments.page';
import { BookAppointmentPage } from './book-appointment.page';
import { PatientProfilePage } from './patient-profile.page';
import { ConsultationsHistoryPage } from './consultations-history.page';

export const PATIENT_ROUTES: Routes = [
  { path: 'dashboard', component: PatientDashboardPage },
  { path: 'appointments', component: MyAppointmentsPage },
  { path: 'consultations', component: ConsultationsHistoryPage },
  { path: 'book', component: BookAppointmentPage },
  { path: 'profile', component: PatientProfilePage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
