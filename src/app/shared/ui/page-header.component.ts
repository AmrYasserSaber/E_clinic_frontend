import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="mb-6 flex items-end justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-wider text-slate-500">{{ eyebrow() }}</p>
        <h1 class="text-2xl font-semibold text-slate-900">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-slate-600">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </header>
  `
})
export class PageHeaderComponent {
  readonly eyebrow = input('MediFlow');
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
