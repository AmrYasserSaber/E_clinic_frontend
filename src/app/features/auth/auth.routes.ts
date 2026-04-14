import { Routes } from '@angular/router';
import { GoogleCompletePage } from './google-complete.page';
import { LoginPage } from './login.page';
import { RegisterPage } from './register.page';
import { SetPasswordOtpPage } from './set-password-otp.page';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'set-password-otp', component: SetPasswordOtpPage },
  { path: 'google/complete', component: GoogleCompletePage },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
