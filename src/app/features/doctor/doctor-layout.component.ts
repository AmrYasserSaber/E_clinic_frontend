import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DoctorNavComponent } from './doctor-nav.component';

@Component({
  standalone: true,
  imports: [RouterOutlet, DoctorNavComponent],
  template: `
    <app-doctor-nav />
    <router-outlet />
  `,
})
export class DoctorLayoutComponent {}
