import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { AuthService } from '../../services/auth.service';

export const AUTH_RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

function skipsAuthErrorHandling(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/api/auth/login/') ||
    u.includes('/api/auth/signup/') ||
    u.includes('/api/auth/refresh/')
  );
}

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (skipsAuthErrorHandling(req.url)) {
        return throwError(() => err);
      }
      if (req.context.get(AUTH_RETRY_AFTER_REFRESH)) {
        return throwError(() => err);
      }
      const authService = inject(AuthService);
      const store = inject(AuthStore);
      const router = inject(Router);
      return authService.ensureAccessTokenRefreshed().pipe(
        switchMap((access) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${access}` },
              context: req.context.set(AUTH_RETRY_AFTER_REFRESH, true),
            }),
          ),
        ),
        catchError((refreshErr: unknown) => {
          store.clear();
          void router.navigateByUrl('/auth/login');
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
