import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { UserRole } from '../../models/domain.models';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] ?? []) as UserRole[];

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  const currentRole = auth.role();
  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
