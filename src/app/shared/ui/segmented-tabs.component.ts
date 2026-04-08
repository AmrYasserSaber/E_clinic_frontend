import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  template: `
    <div class="inline-flex rounded-full bg-slate-100 p-1">
      @for (item of items(); track item) {
        <button
          class="rounded-full px-4 py-1.5 text-sm"
          [class.bg-white]="item === active()"
          [class.shadow]="item === active()"
          [class.text-slate-800]="item === active()"
          [class.text-slate-500]="item !== active()"
          (click)="changed.emit(item)"
        >
          {{ item }}
        </button>
      }
    </div>
  `
})
export class SegmentedTabsComponent {
  readonly items = input.required<string[]>();
  readonly active = input.required<string>();
  readonly changed = output<string>();
}
