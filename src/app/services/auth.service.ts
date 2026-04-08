import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, AuthUser } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login/', payload);
  }

  register(payload: Record<string, unknown>): Observable<void> {
    return this.http.post<void>('/api/auth/register/', payload);
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout/', {});
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>('/api/auth/me/');
  }
}
