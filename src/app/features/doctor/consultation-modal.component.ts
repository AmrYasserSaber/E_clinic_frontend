import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ConsultationPayload,
  DoctorAppointment,
  DoctorService,
} from '../../services/doctor.service';

type PrescriptionFormGroup = FormGroup<{
  drug: FormControl<string>;
  dose: FormControl<string>;
  duration: FormControl<string>;
  instructions: FormControl<string>;
}>;

@Component({
  selector: 'app-consultation-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="card-surface w-full max-w-5xl overflow-hidden rounded-4xl">
      <header
        class="border-b border-black/5 bg-linear-to-r from-(--color-primary)/12 to-(--color-secondary-fixed)/50 p-5 md:p-6"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Consultation
            </p>
            <h2 class="mt-1 text-2xl font-semibold text-(--color-on-surface)">
              Complete Consultation
            </h2>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span
                class="glass-panel rounded-full px-3 py-1 text-xs font-semibold text-(--color-primary)"
              >
                Appointment #{{ appointmentId() }}
              </span>
              @if (patientName()) {
                <span
                  class="glass-panel max-w-full truncate rounded-full px-3 py-1 text-xs font-semibold text-(--color-on-surface)"
                >
                  {{ patientName() }}
                </span>
              }
              <span
                class="glass-panel rounded-full px-3 py-1 text-xs font-semibold text-on-surface-variant"
              >
                * Required
              </span>
            </div>
          </div>
          @if (showClose()) {
            <button type="button" class="btn-secondary bg-white/60!" (click)="closed.emit()">
              Close
            </button>
          }
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex max-h-[80vh] flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          <div class="grid gap-6 lg:grid-cols-2">
            <section class="space-y-4">
              <div class="rounded-4xl bg-transparent p-4 border border-black/5">
                <label
                  class="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                >
                  Diagnosis <span class="text-error">*</span>
                </label>
                <textarea
                  class="input-ui min-h-28 resize-none"
                  formControlName="diagnosis"
                  placeholder="Primary diagnosis"
                ></textarea>

                @if (form.controls.diagnosis.touched && form.controls.diagnosis.invalid) {
                  <p class="mt-2 text-xs font-semibold text-error">Diagnosis is required.</p>
                } @else {
                  <p class="mt-2 text-xs font-medium text-on-surface-variant">
                    Keep it short and specific.
                  </p>
                }
              </div>

              <div class="rounded-4xl bg-transparent p-4 border border-black/5">
                <label
                  class="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                >
                  Clinical Notes <span class="text-error">*</span>
                </label>
                <textarea
                  class="input-ui min-h-44 resize-none"
                  formControlName="notes"
                  placeholder="History, examination, assessment, plan…"
                ></textarea>
                @if (form.controls.notes.touched && form.controls.notes.invalid) {
                  <p class="mt-2 text-xs font-semibold text-error">Clinical notes are required.</p>
                } @else {
                  <p class="mt-2 text-xs font-medium text-on-surface-variant">
                    Use bullet points for clarity.
                  </p>
                }
              </div>

              <div class="rounded-4xl bg-transparent p-4 border border-black/5">
                <div class="flex items-start justify-between gap-3">
                  <label
                    class="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                  >
                    Requested Tests
                  </label>
                  <span
                    class="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-on-surface-variant"
                  >
                    Optional
                  </span>
                </div>

                <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    class="input-ui flex-1"
                    [formControl]="testDraft"
                    placeholder="e.g. CBC"
                    (keydown.enter)="$event.preventDefault(); addRequestedTest()"
                  />
                  <button class="btn-secondary" type="button" (click)="addRequestedTest()">
                    Add
                  </button>
                </div>

                @if (requestedTests.length > 0) {
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (testCtrl of requestedTests.controls; track $index; let i = $index) {
                      <span
                        class="glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-(--color-primary)"
                      >
                        {{ testCtrl.value }}
                        <button
                          type="button"
                          class="rounded-full px-1 text-(--color-primary) hover:bg-black/5"
                          aria-label="Remove test"
                          (click)="removeRequestedTest(i)"
                        >
                          ×
                        </button>
                      </span>
                    }
                  </div>
                } @else {
                  <p class="mt-3 text-xs font-medium text-on-surface-variant">
                    Add only tests that impact your plan.
                  </p>
                }
              </div>
            </section>

            <section class="space-y-4">
              <div class="rounded-4xl bg-surface-container-low p-4">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <label
                      class="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      Prescription
                    </label>
                    <p class="mt-1 text-xs text-on-surface-variant">
                      Add medications if needed (drug, dose, duration are required).
                    </p>
                  </div>
                  <button class="btn-primary" type="button" (click)="addPrescriptionRow()">
                    Add Medication
                  </button>
                </div>

                @if (prescriptions.length === 0) {
                  <div class="mt-4 rounded-4xl bg-surface-container-lowest p-4">
                    <p class="text-sm font-semibold text-(--color-on-surface)">
                      No medications added
                    </p>
                    <p class="mt-1 text-xs font-medium text-on-surface-variant">
                      You can still complete the consultation without a prescription.
                    </p>
                  </div>
                }

                <div class="mt-4 space-y-3">
                  @for (item of prescriptions.controls; track $index; let i = $index) {
                    <div [formGroup]="item" class="rounded-4xl bg-surface-container-lowest p-4">
                      <div class="mb-3 flex items-center justify-between gap-2">
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-(--color-on-surface)">
                            Medication #{{ i + 1 }}
                          </p>
                          <p class="mt-0.5 text-xs font-medium text-on-surface-variant">
                            Fill required fields marked *
                          </p>
                        </div>
                        <button
                          class="btn-secondary bg-error/8! text-error! hover:bg-error/12!"
                          type="button"
                          (click)="removePrescriptionRow(i)"
                        >
                          Remove
                        </button>
                      </div>

                      <div class="grid gap-2 md:grid-cols-2">
                        <input class="input-ui" formControlName="drug" placeholder="Drug *" />
                        <input class="input-ui" formControlName="dose" placeholder="Dose *" />
                        <input
                          class="input-ui"
                          formControlName="duration"
                          placeholder="Duration *"
                        />
                        <input
                          class="input-ui"
                          formControlName="instructions"
                          placeholder="Instructions (optional)"
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>
          </div>

          @if (submitError()) {
            <p
              class="mt-5 ghost-outline rounded-2xl bg-error/8 px-3 py-2 text-sm font-medium text-error"
            >
              {{ submitError() }}
            </p>
          }
        </div>

        <footer class="border-t border-black/5 bg-surface-container-low p-4 md:p-5">
          <div
            class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <p class="text-xs font-semibold text-on-surface-variant">
              Review required fields before submitting.
            </p>
            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              @if (showClose()) {
                <button class="btn-secondary" type="button" (click)="closed.emit()">Cancel</button>
              }
              <button class="btn-primary" type="submit" [disabled]="isSubmitDisabled()">
                {{ submitting() ? 'Submitting…' : 'Complete Consultation' }}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </section>
  `,
})
export class ConsultationModalComponent {
  private readonly doctorService = inject(DoctorService);

  readonly appointmentId = input.required<number>();
  readonly patientName = input<string>('');
  readonly showClose = input(true);

  readonly closed = output<void>();
  readonly success = output<DoctorAppointment>();

  protected readonly testDraft = new FormControl('', { nonNullable: true });
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');

  protected readonly form = new FormGroup({
    diagnosis: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    requested_tests: new FormArray<FormControl<string>>([]),
    prescription_items: new FormArray<PrescriptionFormGroup>([]),
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  protected readonly isSubmitDisabled = computed(() => {
    const status = this.formStatus();
    const value = this.formValue();
    return (
      this.submitting() || status === 'INVALID' || !value.diagnosis?.trim() || !value.notes?.trim()
    );
  });

  protected get requestedTests(): FormArray<FormControl<string>> {
    return this.form.controls.requested_tests;
  }

  protected get prescriptions(): FormArray<PrescriptionFormGroup> {
    return this.form.controls.prescription_items;
  }

  protected addRequestedTest(): void {
    const value = this.testDraft.value.trim();
    if (!value) {
      return;
    }
    this.requestedTests.push(new FormControl(value, { nonNullable: true }));
    this.testDraft.setValue('');
  }

  protected removeRequestedTest(index: number): void {
    this.requestedTests.removeAt(index);
  }

  protected addPrescriptionRow(): void {
    this.prescriptions.push(this.createPrescriptionRow());
  }

  protected removePrescriptionRow(index: number): void {
    this.prescriptions.removeAt(index);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: ConsultationPayload = {
      diagnosis: this.form.controls.diagnosis.value.trim(),
      notes: this.form.controls.notes.value.trim(),
      requested_tests: this.requestedTests.controls
        .map((ctrl) => ctrl.value.trim())
        .filter((item) => item.length > 0),
      prescription_items: this.prescriptions.controls.map((group) => ({
        drug: group.controls.drug.value.trim(),
        dose: group.controls.dose.value.trim(),
        duration: group.controls.duration.value.trim(),
        instructions: group.controls.instructions.value.trim(),
      })),
    };

    this.submitting.set(true);
    this.submitError.set('');

    this.doctorService
      .fileConsultation(this.appointmentId(), payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (updated) => {
          this.success.emit(updated);
          this.closed.emit();
        },
        error: (err: unknown) => {
          this.submitError.set(this.extractErrorMessage(err));
        },
      });
  }

  private createPrescriptionRow(): PrescriptionFormGroup {
    return new FormGroup({
      drug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dose: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      duration: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      instructions: new FormControl('', { nonNullable: true }),
    });
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    return 'Failed to complete consultation. Please try again.';
  }
}
