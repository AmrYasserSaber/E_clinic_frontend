import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Consultation EMR" subtitle="Record diagnosis, notes, prescriptions and tests." />
    <form [formGroup]="form" class="card-surface space-y-3 p-4">
      <textarea class="input-ui min-h-24" placeholder="Diagnosis" formControlName="diagnosis"></textarea>
      <textarea class="input-ui min-h-24" placeholder="Clinical notes" formControlName="notes"></textarea>
      <textarea class="input-ui min-h-20" placeholder="Requested tests" formControlName="tests_requested"></textarea>
      <button class="btn-primary" [disabled]="form.invalid">Submit Consultation</button>
    </form>
  `
})
export class ConsultationEmrPage {
  protected readonly form = new FormGroup({
    diagnosis: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tests_requested: new FormControl('', { nonNullable: true }),
    prescription_items: new FormArray([])
  });
}
