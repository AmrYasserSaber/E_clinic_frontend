import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header
      title="Settings"
      subtitle="Manage notifications, account and accessibility options."
    />
    <div class="mx-auto w-full max-w-4xl space-y-6 pb-10">
      <section class="card-surface rounded-4xl p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="font-headline text-lg font-extrabold tracking-tight text-on-surface">
              Notifications
            </h2>
            <p class="text-sm font-medium text-on-surface-variant">
              Choose how you’d like to receive reminders about upcoming visits.
            </p>
          </div>
          <div class="glass-panel grid h-11 w-11 place-items-center rounded-3xl">
            <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
              >notifications</span
            >
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <label
            class="flex items-center justify-between gap-4 rounded-4xl bg-surface-container-low p-4"
          >
            <span class="min-w-0">
              <span class="block text-sm font-bold text-on-surface">Email reminders</span>
              <span class="mt-0.5 block text-xs font-medium text-on-surface-variant">
                Get a reminder email before your appointment.
              </span>
            </span>
            <input type="checkbox" checked class="h-4 w-4 accent-(--color-primary)" />
          </label>
          <label
            class="flex items-center justify-between gap-4 rounded-4xl bg-surface-container-low p-4"
          >
            <span class="min-w-0">
              <span class="block text-sm font-bold text-on-surface">SMS reminders</span>
              <span class="mt-0.5 block text-xs font-medium text-on-surface-variant">
                Receive a text message reminder.
              </span>
            </span>
            <input type="checkbox" class="h-4 w-4 accent-(--color-primary)" />
          </label>
        </div>
      </section>

      <section class="card-surface rounded-4xl p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="font-headline text-lg font-extrabold tracking-tight text-on-surface">
              Preferences
            </h2>
            <p class="text-sm font-medium text-on-surface-variant">
              Small UI options to make the portal easier to use.
            </p>
          </div>
          <div class="glass-panel grid h-11 w-11 place-items-center rounded-3xl">
            <span class="material-symbols-outlined text-(--color-primary)" aria-hidden="true"
              >tune</span
            >
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <label
            class="flex items-center justify-between gap-4 rounded-4xl bg-surface-container-low p-4"
          >
            <span class="min-w-0">
              <span class="block text-sm font-bold text-on-surface">Reduced motion</span>
              <span class="mt-0.5 block text-xs font-medium text-on-surface-variant">
                Minimize animations and transitions.
              </span>
            </span>
            <input type="checkbox" class="h-4 w-4 accent-(--color-primary)" />
          </label>
        </div>
      </section>
    </div>
  `,
})
export class SettingsPage {}
