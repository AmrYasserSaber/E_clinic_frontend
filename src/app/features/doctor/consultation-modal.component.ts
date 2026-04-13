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
    <section class="card-surface w-full max-w-4xl p-6 md:p-8">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">Complete Consultation</h2>
          <p class="text-sm text-slate-600">
            Appointment #{{ appointmentId() }}
            @if (patientName()) {
              · {{ patientName() }}
            }
          </p>
        </div>

        @if (showClose()) {
          <button type="button" class="btn-secondary" (click)="closed.emit()">Close</button>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Diagnosis *</label>
              <textarea
                class="input-ui min-h-28"
                formControlName="diagnosis"
                placeholder="Enter diagnosis"
              ></textarea>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Clinical Notes *</label>
              <textarea
                class="input-ui min-h-36"
                formControlName="notes"
                placeholder="Enter clinical notes"
              ></textarea>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Requested Tests</label>
              <div class="flex gap-2">
                <input
                  class="input-ui"
                  [formControl]="testDraft"
                  placeholder="e.g. CBC"
                  (keydown.enter)="$event.preventDefault(); addRequestedTest()"
                />
                <button class="btn-secondary" type="button" (click)="addRequestedTest()">Add</button>
              </div>

              @if (requestedTests.length > 0) {
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (testCtrl of requestedTests.controls; track $index; let i = $index) {
                    <span
                      class="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
                    >
                      {{ testCtrl.value }}
                      <button type="button" (click)="removeRequestedTest(i)">×</button>
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-semibold text-slate-700">Prescription Items</label>
              <button class="btn-secondary" type="button" (click)="addPrescriptionRow()">
                Add Medication
              </button>
            </div>

            @if (prescriptions.length === 0) {
              <p class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                No prescription items added.
              </p>
            }

            <div class="space-y-3">
              @for (item of prescriptions.controls; track $index; let i = $index) {
                <div [formGroup]="item" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div class="grid gap-2 md:grid-cols-2">
                    <input class="input-ui" formControlName="drug" placeholder="Drug *" />
                    <input class="input-ui" formControlName="dose" placeholder="Dose *" />
                    <input class="input-ui" formControlName="duration" placeholder="Duration *" />
                    <input
                      class="input-ui"
                      formControlName="instructions"
                      placeholder="Instructions (optional)"
                    />
                  </div>
                  <div class="mt-2 flex justify-end">
                    <button class="btn-secondary" type="button" (click)="removePrescriptionRow(i)">
                      Remove
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        @if (submitError()) {
          <p class="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ submitError() }}</p>
        }

        <div class="flex justify-end gap-2">
          @if (showClose()) {
            <button class="btn-secondary" type="button" (click)="closed.emit()">Cancel</button>
          }
          <button class="btn-primary" type="submit" [disabled]="isSubmitDisabled()">
            {{ submitting() ? 'Submitting...' : 'Complete Consultation' }}
          </button>
        </div>
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

  protected readonly isSubmitDisabled = computed(
    () => {
      const status = this.formStatus();
      const value = this.formValue();
      return (
        this.submitting() ||
        status === 'INVALID' ||
        !value.diagnosis?.trim() ||
        !value.notes?.trim()
      );
    },
  );

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
