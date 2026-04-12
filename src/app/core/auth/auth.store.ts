import { Injectable, computed, signal } from '@angular/core';
import { AuthSessionPayload, AuthUser, UserRole } from '../../models/domain.models';

const ACCESS_KEY = 'mediflow_token';
const REFRESH_KEY = 'mediflow_refresh';
const USER_KEY = 'mediflow_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly accessState = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private readonly refreshState = signal<string | null>(localStorage.getItem(REFRESH_KEY));
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly accessToken = computed(() => this.accessState());
  readonly refreshToken = computed(() => this.refreshState());
  readonly user = computed(() => this.userState());
  readonly role = computed(() => this.userState()?.role ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.accessState()));

  setSession(payload: AuthSessionPayload): void {
    this.accessState.set(payload.accessToken);
    this.refreshState.set(payload.refreshToken);
    this.userState.set(payload.user);
    localStorage.setItem(ACCESS_KEY, payload.accessToken);
    localStorage.setItem(REFRESH_KEY, payload.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  updateAccessToken(accessToken: string, refreshToken?: string): void {
    this.accessState.set(accessToken);
    localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken !== undefined) {
      this.refreshState.set(refreshToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  }

  setUser(user: AuthUser): void {
    this.userState.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setRole(role: UserRole): void {
    const current = this.userState();
    if (!current) return;
    const updated = { ...current, role };
    this.userState.set(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  clear(): void {
    this.accessState.set(null);
    this.refreshState.set(null);
    this.userState.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
