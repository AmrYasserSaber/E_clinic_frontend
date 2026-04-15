import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-text-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label
      class="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
      >{{ label() }}</label
    >
    <input
      class="input-ui"
      [type]="type()"
      [placeholder]="placeholder()"
      [formControl]="control()"
    />
  `,
})
export class FormTextFieldComponent {
  readonly label = input.required<string>();
  readonly type = input('text');
  readonly placeholder = input('');
  readonly control = input.required<FormControl>();
}
