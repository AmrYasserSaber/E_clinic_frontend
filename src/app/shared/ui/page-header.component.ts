import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="mb-6 flex items-end justify-between gap-3">
      <div>
        <h1 class="font-headline text-3xl font-semibold tracking-tight text-(--color-on-surface)">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="mt-1 max-w-2xl text-sm text-on-surface-variant">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
