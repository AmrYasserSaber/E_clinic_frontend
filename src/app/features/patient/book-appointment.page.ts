import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotsService } from '../../services/slots.service';
import { AppointmentsService } from '../../services/appointments.service';
import { Slot } from '../../models/domain.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Book Appointment" subtitle="Select doctor, date, and slot based on live availability." />
    <form [formGroup]="filters" (ngSubmit)="loadSlots()" class="card-surface mb-4 grid gap-3 p-4 md:grid-cols-4">
      <input class="input-ui" placeholder="Doctor ID" formControlName="doctorId" type="number" />
      <input class="input-ui" placeholder="Date" formControlName="date" type="date" />
      <button class="btn-secondary md:col-span-2">Find Slots</button>
    </form>
    <div class="grid gap-3 md:grid-cols-4">
      @for (slot of slots; track slot.startTime) {
        <button class="card-surface p-3 text-left hover:bg-cyan-50" (click)="book(slot)">
          <p class="font-semibold">{{ slot.startTime }}</p>
          <p class="text-xs text-slate-500">{{ slot.endTime }}</p>
        </button>
      }
    </div>
  `
})
export class BookAppointmentPage {
  private readonly slotsService = inject(SlotsService);
  private readonly appointmentsService = inject(AppointmentsService);
  protected slots: Slot[] = [];

  protected readonly filters = new FormGroup({
    doctorId: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  loadSlots(): void {
    if (this.filters.invalid) return;
    const { doctorId, date } = this.filters.getRawValue();
    this.slotsService.list(Number(doctorId), date).subscribe((rows) => (this.slots = rows));
  }

  book(slot: Slot): void {
    this.appointmentsService
      .book({
        doctor_id: slot.doctorId,
        date: slot.date,
        time: slot.startTime,
        reason: 'Consultation'
      })
      .subscribe();
  }
}
