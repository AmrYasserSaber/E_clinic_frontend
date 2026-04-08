import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="card-surface flex flex-col items-center gap-2 p-8 text-center">
      <p class="text-lg font-medium text-slate-800">{{ title() }}</p>
      <p class="max-w-md text-sm text-slate-600">{{ message() }}</p>
      <ng-content />
    </div>
  `
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
