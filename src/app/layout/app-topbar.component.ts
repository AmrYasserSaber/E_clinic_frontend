import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth/auth.store';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="mb-4 flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft">
      <a routerLink="/" class="text-lg font-semibold text-cyan-800">MediFlow</a>
      <div class="flex items-center gap-2">
        @if (auth.role() === 'patient') {
          <a routerLink="/patient/profile" class="btn-secondary no-underline">Profile</a>
        }
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs uppercase text-cyan-700">{{
          auth.role()
        }}</span>
        <button class="btn-secondary" (click)="logout()">Sign out</button>
      </div>
    </header>
  `,
})
export class AppTopbarComponent {
  protected readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
    });
  }
}
