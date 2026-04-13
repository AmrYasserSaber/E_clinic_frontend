import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="relative min-h-[calc(100vh-8rem)]">
      <aside
        class="hidden md:flex md:fixed md:left-6 md:top-24 md:bottom-6 md:w-64 flex-col rounded-3xl bg-surface-container-lowest p-4 neumorphic-card"
      >
        <div class="mb-4 px-3 py-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-primary">MediFlow Clinic</h2>
          <p class="mt-1 text-xs font-semibold text-slate-500">Receptionist Panel</p>
        </div>

        <nav class="flex flex-col gap-2" aria-label="Receptionist pages">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.link"
            routerLinkActive="bg-white text-primary shadow-sm"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-all duration-200 hover:translate-x-1 hover:text-primary"
          >
            <span class="text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>
      </aside>

      <section class="min-w-0 md:ml-72 md:pl-4">
        <router-outlet />
      </section>
    </div>
  `,
})
export class ReceptionistLayoutComponent {
  readonly navItems = [
    { label: 'Dashboard', link: '/receptionist/dashboard', icon: '◫' },
    { label: 'Requests', link: '/receptionist/requests', icon: '◩' },
    { label: 'Queue', link: '/receptionist/queue', icon: '◉' },
    { label: 'Schedule', link: '/receptionist/schedule', icon: '◷' },
    { label: 'Exceptions', link: '/receptionist/exceptions', icon: '◬' },
  ];
}
