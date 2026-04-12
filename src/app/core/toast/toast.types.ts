export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly title?: string;
  readonly variant: ToastVariant;
  /** 0 = stay until dismissed */
  readonly durationMs: number;
}

export interface ToastShowOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  /** Default 5000; use 0 to require manual dismiss */
  durationMs?: number;
}
