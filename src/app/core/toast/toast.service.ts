import { Injectable, signal } from '@angular/core';
import { Toast, ToastShowOptions } from './toast.types';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly list = signal<Toast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Active toasts (newest last). */
  readonly toasts = this.list.asReadonly();

  show(options: ToastShowOptions): string {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message: options.message,
      title: options.title,
      variant: options.variant ?? 'info',
      durationMs: options.durationMs ?? 5000,
    };
    this.list.update((current) => [...current, toast]);
    if (toast.durationMs > 0) {
      const handle = setTimeout(() => this.dismiss(id), toast.durationMs);
      this.timers.set(id, handle);
    }
    return id;
  }

  success(message: string, title?: string): string {
    return this.show({ message, title, variant: 'success' });
  }

  error(message: string, title?: string): string {
    return this.show({ message, title, variant: 'error', durationMs: 8000 });
  }

  warning(message: string, title?: string): string {
    return this.show({ message, title, variant: 'warning', durationMs: 6000 });
  }

  info(message: string, title?: string): string {
    return this.show({ message, title, variant: 'info' });
  }

  dismiss(id: string): void {
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
    this.list.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const handle of this.timers.values()) {
      clearTimeout(handle);
    }
    this.timers.clear();
    this.list.set([]);
  }
}
