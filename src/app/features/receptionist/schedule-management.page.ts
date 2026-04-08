import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Schedule Management" subtitle="Set doctor availability and session rules." />
    <form [formGroup]="form" class="card-surface grid gap-3 p-4 md:grid-cols-2">
      <input class="input-ui" formControlName="doctorId" placeholder="Doctor ID" type="number" />
      <select class="input-ui" formControlName="day">
        <option value="0">Monday</option>
        <option value="1">Tuesday</option>
        <option value="2">Wednesday</option>
        <option value="3">Thursday</option>
        <option value="4">Friday</option>
        <option value="5">Saturday</option>
        <option value="6">Sunday</option>
      </select>
      <input class="input-ui" formControlName="start" type="time" />
      <input class="input-ui" formControlName="end" type="time" />
      <button class="btn-primary md:col-span-2">Save Schedule</button>
    </form>
  `
})
export class ScheduleManagementPage {
  protected readonly form = new FormGroup({
    doctorId: new FormControl(0, { nonNullable: true }),
    day: new FormControl('0', { nonNullable: true }),
    start: new FormControl('09:00', { nonNullable: true }),
    end: new FormControl('17:00', { nonNullable: true })
  });
}
