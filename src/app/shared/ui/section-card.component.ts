import { Component } from '@angular/core';

@Component({
  selector: 'app-section-card',
  standalone: true,
  template: `<section class="card-surface p-4"><ng-content /></section>`
})
export class SectionCardComponent {}
