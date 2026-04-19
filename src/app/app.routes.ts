import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rootLandingGuard } from './core/guards/root-landing.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { ChangePasswordPage } from './features/system/change-password.page';
import { ForbiddenPage } from './features/system/forbidden.page';
import { NotFoundPage } from './features/system/not-found.page';
import { SettingsPage } from './features/system/settings.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootLandingGuard],
    loadComponent: () => import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  { path: 'welcome', redirectTo: '', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'patient',
        canActivate: [authGuard],
        data: { roles: ['patient'] },
        loadChildren: () =>
          import('./features/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
      },
      {
        path: 'doctor',
        canActivate: [authGuard],
        data: { roles: ['doctor'] },
        loadChildren: () => import('./features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
      },
      {
        path: 'receptionist',
        canActivate: [authGuard],
        data: { roles: ['receptionist'] },
        loadChildren: () =>
          import('./features/receptionist/receptionist.routes').then((m) => m.RECEPTIONIST_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      { path: 'settings', component: SettingsPage },
      { path: 'account/change-password', component: ChangePasswordPage },
      { path: 'forbidden', component: ForbiddenPage },
      { path: '', pathMatch: 'full', redirectTo: 'patient/dashboard' },
    ],
  },
  { path: 'forbidden', component: ForbiddenPage },
  { path: '**', component: NotFoundPage },
];
