import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import {
  LoginApiResponse,
  SignupApiResponse,
  TokenRefreshApiResponse,
  UserMeApi,
  isSignupWithTokens,
} from '../models/auth-api.models';
import { AuthSessionPayload, AuthUser } from '../models/domain.models';
import { mapUserMeToAuthUser } from '../core/auth/auth.mapper';
import { AuthStore } from '../core/auth/auth.store';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly httpRaw = new HttpClient(inject(HttpBackend));
  private readonly store = inject(AuthStore);
  private refreshInFlight: Observable<string> | null = null;

  login(payload: { email: string; password: string }): Observable<AuthSessionPayload> {
    return this.http
      .post<LoginApiResponse>('/api/auth/login/', payload)
      .pipe(
        map((response) =>
          this.mapToSession(response.user, response.access_token, response.refresh_token),
        ),
      );
  }

  register(payload: Record<string, unknown>): Observable<SignupApiResponse> {
    return this.http.post<SignupApiResponse>('/api/auth/signup/', payload);
  }

  me(): Observable<AuthUser> {
    return this.http.get<UserMeApi>('/api/auth/me/').pipe(
      map((api) => {
        const user = mapUserMeToAuthUser(api);
        if (!user) {
          throw new Error('Invalid user profile');
        }
        return user;
      }),
    );
  }

  logout(): Observable<void> {
    const access = this.store.accessToken();
    const refresh = this.store.refreshToken();
    if (!access || !refresh) {
      this.store.clear();
      return of(void 0);
    }
    return this.http
      .post('/api/auth/logout/', { refresh_token: refresh }, { observe: 'response' })
      .pipe(
        map((response) => {
          if (response.status === 204) {
            this.store.clear();
          }
          return void 0;
        }),
        catchError(() => {
          this.store.clear();
          return of(void 0);
        }),
      );
  }

  /**
   * Refreshes access token using stored refresh token without running HTTP interceptors.
   * Updates the store on success. Used by the 401 interceptor (single-flight via {@link ensureAccessTokenRefreshed}).
   */
  refreshWithStoredRefresh(): Observable<{ access: string; refresh?: string }> {
    const refresh = this.store.refreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token'));
    }
    const refreshUrl = this.resolveApiUrl('/api/auth/refresh/');
    return this.httpRaw.post<TokenRefreshApiResponse>(refreshUrl, { refresh }).pipe(
      tap((body) => {
        this.store.updateAccessToken(body.access, body.refresh);
      }),
    );
  }

  ensureAccessTokenRefreshed(): Observable<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = this.refreshWithStoredRefresh().pipe(
      map((pair) => pair.access),
      finalize(() => {
        this.refreshInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this.refreshInFlight;
  }

  /**
   * Login returns 403 when credentials are valid but the account cannot receive tokens yet
   * (e.g. doctor/receptionist awaiting admin approval). Not a credential failure.
   */
  static isLoginPendingApprovalError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 403) {
      return false;
    }
    const detail = error.error?.detail;
    if (typeof detail !== 'string') {
      return true;
    }
    const normalized = detail.toLowerCase();
    return normalized.includes('pending') && normalized.includes('approval');
  }

  static loginPendingApprovalDetail(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return 'Your account is pending approval.';
  }

  static loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        const detail = error.error?.detail;
        return typeof detail === 'string' ? detail : 'Your account is pending approval.';
      }
      if (error.status === 400 && error.error && typeof error.error === 'object') {
        const nonField = error.error.non_field_errors;
        if (Array.isArray(nonField) && nonField.length > 0) {
          return String(nonField[0]);
        }
      }
      if (typeof error.error?.detail === 'string') {
        return error.error.detail;
      }
    }
    return 'Sign in failed. Check your credentials.';
  }

  /** Flattens DRF 400 validation payload (`field`: string[] | string) into a short message. */
  static signupErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse) || error.status !== 400) {
      return 'Registration failed. Check your details and try again.';
    }
    const body = error.error;
    if (!body || typeof body !== 'object') {
      return 'Registration failed. Check your details and try again.';
    }
    const record = body as Record<string, unknown>;
    const chunks: string[] = [];
    const pushVal = (val: unknown): void => {
      if (Array.isArray(val)) {
        chunks.push(...val.map((x) => String(x)));
      } else if (typeof val === 'string') {
        chunks.push(val);
      }
    };
    pushVal(record['non_field_errors']);
    const fieldOrder = [
      'email',
      'password',
      'first_name',
      'last_name',
      'phone_number',
      'date_of_birth',
      'role',
    ];
    for (const key of fieldOrder) {
      pushVal(record[key]);
    }
    for (const [key, val] of Object.entries(record)) {
      if (key === 'non_field_errors' || fieldOrder.includes(key)) {
        continue;
      }
      if (key === 'detail') {
        continue;
      }
      pushVal(val);
    }
    if (chunks.length === 0 && typeof record['detail'] === 'string') {
      chunks.push(record['detail']);
    }
    if (chunks.length > 0) {
      return chunks.slice(0, 4).join(' ');
    }
    return 'Registration failed. Check your details and try again.';
  }

  mapSignupToSession(response: SignupApiResponse): AuthSessionPayload | null {
    if (!isSignupWithTokens(response)) {
      return null;
    }
    return this.mapToSession(response.user, response.access_token, response.refresh_token);
  }

  private resolveApiUrl(path: string): string {
    const base = environment.apiBaseUrl;
    if (!base || !path.startsWith('/api')) {
      return path;
    }
    return `${base}${path}`;
  }

  private mapToSession(
    userApi: UserMeApi,
    accessToken: string,
    refreshToken: string,
  ): AuthSessionPayload {
    const user = mapUserMeToAuthUser(userApi);
    if (!user) {
      throw new Error('Invalid user profile');
    }
    return { accessToken, refreshToken, user };
  }
}
