import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-text-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label class="mb-1 block text-sm font-medium text-slate-700">{{ label() }}</label>
    <input
      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
      [type]="type()"
      [placeholder]="placeholder()"
      [formControl]="control()"
    />
  `
})
export class FormTextFieldComponent {
  readonly label = input.required<string>();
  readonly type = input('text');
  readonly placeholder = input('');
  readonly control = input.required<FormControl>();
}
