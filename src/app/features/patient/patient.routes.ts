import { Routes } from '@angular/router';
import { PatientDashboardPage } from './patient-dashboard.page';
import { MyAppointmentsPage } from './my-appointments.page';
import { BookAppointmentPage } from './book-appointment.page';

export const PATIENT_ROUTES: Routes = [
  { path: 'dashboard', component: PatientDashboardPage },
  { path: 'appointments', component: MyAppointmentsPage },
  { path: 'book', component: BookAppointmentPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
];
