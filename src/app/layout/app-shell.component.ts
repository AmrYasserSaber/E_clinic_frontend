import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppTopbarComponent } from './app-topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, AppTopbarComponent],
  template: `
    <div class="min-h-screen bg-[var(--mf-bg)] p-4 md:p-6">
      <app-topbar />
      <main class="mx-auto max-w-6xl">
        <router-outlet />
      </main>
    </div>
  `
})
export class AppShellComponent {}
