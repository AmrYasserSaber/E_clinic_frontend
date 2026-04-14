import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-doctor-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-soft">
      <a
        class="btn-secondary"
        routerLink="/doctor/dashboard"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Dashboard
      </a>
      <a
        class="btn-secondary"
        routerLink="/doctor/queue"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Queue
      </a>
      <a
        class="btn-secondary"
        routerLink="/doctor/schedule"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Schedule
      </a>
      <a
        class="btn-secondary"
        routerLink="/doctor/consultations"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Consultations
      </a>
      <a
        class="btn-secondary"
        routerLink="/doctor/profile"
        routerLinkActive="!bg-cyan-600 !text-white"
      >
        Profile
      </a>
    </nav>
  `,
})
export class DoctorNavComponent {}
