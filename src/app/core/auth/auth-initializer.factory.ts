import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { UserMeApi } from '../../models/auth-api.models';
import { mapUserMeToAuthUser } from './auth.mapper';
import { AuthStore } from './auth.store';

export function authAppInitializerFactory(): () => Promise<void> {
  const store = inject(AuthStore);
  const http = inject(HttpClient);
  return () => {
    if (!store.accessToken()) {
      return Promise.resolve();
    }
    return firstValueFrom(
      http.get<UserMeApi>('/api/auth/me/').pipe(
        map((api) => mapUserMeToAuthUser(api)),
        tap((user) => {
          if (user) {
            store.setUser(user);
          } else {
            store.clear();
          }
        }),
        catchError(() => {
          store.clear();
          return of(undefined);
        }),
      ),
    ).then(() => undefined);
  };
}
