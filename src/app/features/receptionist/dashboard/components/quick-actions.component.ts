import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
      <a
        class="btn-secondary inline-flex items-center justify-center gap-2"
        routerLink="/receptionist/requests"
      >
        <span class="material-symbols-outlined text-[18px]">inbox</span>
        Requests
      </a>
      <a
        class="btn-primary inline-flex items-center justify-center gap-2"
        routerLink="/receptionist/queue"
      >
        <span class="material-symbols-outlined text-[18px]">queue</span>
        Open queue
      </a>
      <a
        class="btn-secondary inline-flex items-center justify-center gap-2"
        routerLink="/receptionist/schedule"
      >
        <span class="material-symbols-outlined text-[18px]">calendar_month</span>
        Schedule
      </a>
      <button
        type="button"
        class="btn-secondary inline-flex items-center justify-center gap-2"
        (click)="refresh.emit()"
      >
        <span class="material-symbols-outlined text-[18px]">refresh</span>
        Refresh
      </button>
    </div>
  `,
})
export class QuickActionsComponent {
  /** Emits when the user requests a dashboard refresh. */
  @Output() readonly refresh = new EventEmitter<void>();
}
