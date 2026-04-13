import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConsultationModalComponent } from './consultation-modal.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ToastService } from '../../core/toast/toast.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent, ConsultationModalComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Consultation EMR" subtitle="Record diagnosis, notes, prescriptions and tests." />

    @if (appointmentId() === null) {
      <app-empty-state
        title="No appointment selected"
        message="Open this page with ?appointmentId=123 or launch consultation from the queue."
      />
    } @else {
      <app-consultation-modal
        [appointmentId]="appointmentId()!"
        [showClose]="false"
        (success)="handleSuccess()"
      />
    }
  `
})
export class ConsultationEmrPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly appointmentId = signal<number | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const raw = params.get('appointmentId');
      const parsed = raw ? Number(raw) : NaN;
      this.appointmentId.set(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    });
  }

  protected handleSuccess(): void {
    this.toast.success('Consultation completed successfully.');
    void this.router.navigate(['/doctor/dashboard']);
  }
}
