import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto mt-20 max-w-xl card-surface p-8 text-center">
      <p class="text-5xl font-bold text-cyan-800">403</p>
      <p class="mt-2 text-lg font-semibold">Access denied</p>
      <a routerLink="/" class="btn-secondary mt-4 inline-block">Go Home</a>
    </div>
  `
})
export class ForbiddenPage {}
