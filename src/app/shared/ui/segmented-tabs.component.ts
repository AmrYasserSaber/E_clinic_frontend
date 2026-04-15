import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  template: `
    <div class="inline-flex rounded-full bg-surface-container-low p-1">
      @for (item of items(); track item) {
        <button
          class="rounded-full px-4 py-1.5 text-sm font-semibold transition"
          [class.bg-(--color-surface-container-lowest)]="item === active()"
          [class.shadow-soft]="item === active()"
          [class.text-(--color-on-surface)]="item === active()"
          [class.text-(--color-on-surface-variant)]="item !== active()"
          (click)="changed.emit(item)"
        >
          {{ item }}
        </button>
      }
    </div>
  `,
})
export class SegmentedTabsComponent {
  readonly items = input.required<string[]>();
  readonly active = input.required<string>();
  readonly changed = output<string>();
}
