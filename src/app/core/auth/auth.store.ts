import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, AuthUser, UserRole } from '../../models/domain.models';

const TOKEN_KEY = 'mediflow_token';
const USER_KEY = 'mediflow_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly role = computed(() => this.userState()?.role ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  setSession(response: AuthResponse): void {
    this.tokenState.set(response.token);
    this.userState.set(response.user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  setRole(role: UserRole): void {
    const current = this.userState();
    if (!current) return;
    const updated = { ...current, role };
    this.userState.set(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  clear(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(TOKEN_KEY);
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
