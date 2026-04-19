import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { UserRole } from '../../models/domain.models';

function dashboardUrlForRole(role: UserRole | null): string {
  switch (role) {
    case 'doctor':
      return '/doctor/dashboard';
    case 'receptionist':
      return '/receptionist/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/patient/dashboard';
  }
}

/**
 * Shows the public landing page for guests; sends signed-in users to their role dashboard.
 */
export const rootLandingGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree([dashboardUrlForRole(auth.role())]);
};
