import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastVariant } from './toast.types';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-200 flex max-h-screen flex-col items-stretch gap-2 overflow-y-auto p-4 sm:items-end sm:pr-6"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [attr.role]="toast.variant === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.variant === 'error' ? 'assertive' : 'polite'"
          class="toast-surface pointer-events-auto flex w-full max-w-md origin-top animate-toast-in flex-row gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm sm:ml-auto"
          [ngClass]="{
            'border-primary/25 bg-primary/5': toast.variant === 'success',
            'border-error/30 bg-error/8': toast.variant === 'error',
            'border-secondary/25 bg-secondary-fixed/25': toast.variant === 'warning',
            'border-outline-variant/30 bg-surface-container-low/90': toast.variant === 'info',
          }"
        >
          <span
            class="material-symbols-outlined shrink-0 text-[26px] leading-none"
            aria-hidden="true"
          >
            {{ iconFor(toast.variant) }}
          </span>
          <div class="min-w-0 flex-1 pt-0.5">
            @if (toast.title) {
              <p class="font-headline text-on-surface mb-1 text-sm font-bold tracking-tight">
                {{ toast.title }}
              </p>
            }
            <p class="text-on-surface-variant text-sm leading-snug font-medium whitespace-pre-wrap">
              {{ toast.message }}
            </p>
          </div>
          <button
            type="button"
            class="text-on-surface-variant hover:text-primary -m-1 shrink-0 rounded-lg p-1 transition-colors"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <span class="material-symbols-outlined text-xl leading-none">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-0.75rem) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-toast-in {
      animation: toast-in 0.28s ease-out both;
    }
    .toast-surface {
      background: color-mix(in srgb, var(--color-surface-container-lowest) 92%, transparent);
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected iconFor(variant: ToastVariant): string {
    switch (variant) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}
