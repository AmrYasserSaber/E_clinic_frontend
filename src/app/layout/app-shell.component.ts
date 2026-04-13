import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppTopbarComponent } from './app-topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, AppTopbarComponent],
  template: `
    <div class="min-h-screen bg-(--mf-bg) p-4 md:p-6">
      <app-topbar />
      <main [class]="router.url.startsWith('/receptionist') ? 'max-w-none' : 'mx-auto max-w-6xl'">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppShellComponent {
  constructor(public readonly router: Router) {}
}
