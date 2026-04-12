import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

function skipsAttachBearer(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/api/auth/login/') ||
    u.includes('/api/auth/signup/') ||
    u.includes('/api/auth/refresh/')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (skipsAttachBearer(req.url)) {
    return next(req);
  }
  const token = inject(AuthStore).accessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
