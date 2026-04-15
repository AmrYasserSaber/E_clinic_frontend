import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="relative min-h-[calc(100vh-8rem)]">
      <section class="min-w-0">
        <router-outlet />
      </section>
    </div>
  `,
})
export class ReceptionistLayoutComponent {}
