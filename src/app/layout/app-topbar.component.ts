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
      <div class="flex items-center gap-3">
        <a routerLink="/" class="text-lg font-semibold text-cyan-800">MediFlow</a>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs uppercase text-cyan-700">{{
          auth.role()
        }}</span>
      </div>
      <div class="flex items-center gap-3">
        @if (auth.role() === 'patient' || auth.role() === 'doctor') {
          <a
            [routerLink]="auth.role() === 'doctor' ? '/doctor/profile' : '/patient/profile'"
            class="flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-cyan-200/80 transition hover:ring-cyan-400"
            aria-label="Open profile"
          >
            <img
              src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
              alt=""
              width="40"
              height="40"
              class="h-full w-full object-cover"
            />
          </a>
        }
        <button class="btn-secondary" type="button" (click)="logout()">Sign out</button>
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
