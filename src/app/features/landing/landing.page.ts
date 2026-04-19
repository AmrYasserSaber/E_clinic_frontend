import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-background font-body text-on-surface relative min-h-dvh overflow-x-hidden">
      <div
        class="bg-primary-container/12 mf-float-blob absolute top-[-18%] left-[-12%] h-[min(52vw,28rem)] w-[min(52vw,28rem)] rounded-full blur-[100px]"
        aria-hidden="true"
      ></div>
      <div
        class="bg-secondary-container/18 mf-float-blob-delayed absolute right-[-14%] bottom-[-20%] h-[min(56vw,30rem)] w-[min(56vw,30rem)] rounded-full blur-[110px]"
        aria-hidden="true"
      ></div>
      <div
        class="from-primary/6 via-transparent to-tertiary-container/10 mf-gradient-pan pointer-events-none absolute inset-0 bg-linear-to-br opacity-90"
        aria-hidden="true"
      ></div>
      <header
        class="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6"
      >
        <a routerLink="/" class="group flex items-center gap-3">
          <div
            class="card-surface group-hover:border-primary/20 flex h-12 w-12 items-center justify-center rounded-2xl border border-transparent shadow-soft transition-all duration-300 group-hover:scale-[1.02]"
          >
            <span class="material-symbols-outlined text-primary text-2xl">medical_services</span>
          </div>
          <div class="leading-tight">
            <span class="font-headline text-primary block text-lg font-extrabold tracking-tight"
              >MediFlow</span
            >
            <span class="text-on-surface-variant hidden text-xs font-medium sm:block"
              >Clinic operations, simplified</span
            >
          </div>
        </a>
        <nav class="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Primary">
          <a
            routerLink="/auth/login"
            class="btn-tertiary ring-outline-variant/30 font-headline text-on-surface px-3 py-2 text-sm font-semibold ring-1 ring-inset hover:bg-surface-container-high sm:px-4"
          >
            Sign in
          </a>
          <a
            routerLink="/auth/register"
            class="btn-primary font-headline shadow-soft inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <span>Create account</span>
            <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true"
              >arrow_forward</span
            >
          </a>
        </nav>
      </header>
      <main class="relative z-10">
        <section
          class="mx-auto grid w-full max-w-6xl gap-12 px-4 pt-6 pb-20 md:gap-16 md:px-6 md:pt-10 md:pb-28 lg:grid-cols-12 lg:items-center"
          aria-labelledby="hero-heading"
        >
          <div class="mf-hero-enter space-y-8 lg:col-span-7">
            <p
              class="text-secondary font-headline inline-flex items-center gap-2 rounded-full border border-secondary-container/40 bg-secondary-fixed/25 px-3 py-1.5 text-xs font-bold tracking-wide uppercase"
            >
              <span class="material-symbols-outlined text-secondary text-base" aria-hidden="true"
                >verified</span
              >
              Secure health portal
            </p>
            <h1
              id="hero-heading"
              class="font-headline text-primary text-4xl leading-[1.1] font-extrabold tracking-tight md:text-5xl lg:text-[3.25rem]"
            >
              Care that flows
              <span
                class="from-primary via-surface-tint to-tertiary bg-linear-to-r bg-clip-text text-transparent"
              >
                from queue to cure
              </span>
            </h1>
            <p
              class="text-on-surface-variant max-w-xl text-lg leading-relaxed font-medium md:text-xl"
            >
              Schedule visits, manage the waiting room, and keep every role in sync—built for
              clinics that need clarity without the clutter.
            </p>
            <div class="flex flex-wrap items-center gap-3 md:gap-4">
              <a
                routerLink="/auth/register"
                class="btn-primary font-headline shadow-soft inline-flex items-center gap-2 px-6 py-3 text-[0.95rem]"
              >
                Get started free
                <span class="material-symbols-outlined text-[1.25rem]" aria-hidden="true"
                  >rocket_launch</span
                >
              </a>
              <a
                routerLink="/auth/login"
                class="ghost-outline font-headline bg-surface-container-lowest/60 text-on-secondary-container hover:border-primary/25 inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[0.95rem] font-semibold shadow-sm backdrop-blur-sm transition-colors"
              >
                <span
                  class="material-symbols-outlined text-primary text-[1.25rem]"
                  aria-hidden="true"
                  >login</span
                >
                I have an account
              </a>
            </div>
            <ul
              class="text-on-surface-variant flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"
              aria-label="Highlights"
            >
              <li class="flex items-center gap-2">
                <span class="text-primary material-symbols-outlined text-lg" aria-hidden="true"
                  >groups</span
                >
                Staff, doctors, patients—one workspace
              </li>
              <li class="flex items-center gap-2">
                <span class="text-primary material-symbols-outlined text-lg" aria-hidden="true"
                  >shield_lock</span
                >
                Privacy-minded by design
              </li>
            </ul>
          </div>
          <div class="mf-hero-panel mf-hero-enter-delayed lg:col-span-5">
            <div class="relative">
              <div
                class="card-surface from-primary-container/15 to-surface-container-low ring-primary/12 relative overflow-hidden rounded-[1.75rem] bg-linear-to-br p-6 ring-1 shadow-[0_24px_80px_-20px_rgba(0,39,52,0.35)] md:p-8"
              >
                <div class="mf-shine pointer-events-none absolute inset-0 opacity-40"></div>
                <div class="relative space-y-5">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p
                        class="text-on-surface-variant text-xs font-semibold uppercase tracking-wide"
                      >
                        Today&apos;s pulse
                      </p>
                      <p class="font-headline text-primary mt-1 text-2xl font-bold">Waiting room</p>
                    </div>
                    <span
                      class="material-symbols-outlined text-primary-container bg-primary/12 rounded-xl p-2 text-2xl"
                      aria-hidden="true"
                      >monitor_heart</span
                    >
                  </div>
                  <div class="space-y-3">
                    @for (row of queuePreview; track row.label) {
                      <div
                        class="border-outline-variant/25 hover:border-primary/15 flex items-center justify-between gap-3 rounded-2xl border bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div class="flex items-center gap-3">
                          <span
                            class="font-headline text-primary flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-fixed/40 text-sm font-bold"
                            >{{ row.initial }}</span
                          >
                          <div>
                            <p class="text-on-surface font-headline text-sm font-semibold">
                              {{ row.label }}
                            </p>
                            <p class="text-on-surface-variant text-xs font-medium">
                              {{ row.meta }}
                            </p>
                          </div>
                        </div>
                        <span
                          class="text-secondary font-headline rounded-full bg-secondary-fixed/35 px-2.5 py-1 text-xs font-bold"
                          >{{ row.status }}</span
                        >
                      </div>
                    }
                  </div>
                  <div
                    class="from-primary/8 border-primary/12 flex items-center gap-3 rounded-2xl border bg-linear-to-r to-transparent px-4 py-3"
                  >
                    <span class="material-symbols-outlined text-primary text-xl" aria-hidden="true"
                      >auto_awesome</span
                    >
                    <p class="text-on-surface-variant text-sm font-medium leading-snug">
                      Animations illustrate live coordination—your real dashboards stay in sync the
                      same way.
                    </p>
                  </div>
                </div>
              </div>
              <div
                class="border-primary/15 bg-surface-container-lowest/85 absolute -right-4 -bottom-4 hidden h-24 w-24 rounded-3xl border shadow-lg backdrop-blur-md md:block"
                aria-hidden="true"
              ></div>
              <div
                class="bg-tertiary-container/35 absolute -top-3 -left-3 hidden h-16 w-16 rounded-2xl blur-xl md:block"
                aria-hidden="true"
              ></div>
            </div>
          </div>
        </section>
        <section
          class="border-outline-variant/20 bg-surface-container-low/80 border-y"
          aria-labelledby="features-heading"
        >
          <div class="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div class="mx-auto mb-12 max-w-2xl text-center md:mb-16">
              <h2
                id="features-heading"
                class="font-headline text-primary mb-3 text-2xl font-extrabold tracking-tight md:text-3xl"
              >
                Everything your front desk needs
              </h2>
              <p class="text-on-surface-variant text-base font-medium md:text-lg">
                Queue clarity, schedule discipline, and calm communication—layered into one
                experience your team can adopt in an afternoon.
              </p>
            </div>
            <div class="grid gap-5 md:grid-cols-3 md:gap-6">
              @for (item of featureCards; track item.title; let i = $index) {
                <article
                  class="mf-card-rise card-surface group border-outline-variant/20 hover:border-primary/18 relative rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(0,70,89,0.45)] md:p-7"
                  [style.animation-delay]="staggerMs(i)"
                >
                  <div
                    class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"
                  >
                    <span class="material-symbols-outlined text-2xl" aria-hidden="true">{{
                      item.icon
                    }}</span>
                  </div>
                  <h3 class="font-headline text-on-surface mb-2 text-lg font-bold">
                    {{ item.title }}
                  </h3>
                  <p class="text-on-surface-variant text-sm leading-relaxed font-medium">
                    {{ item.body }}
                  </p>
                </article>
              }
            </div>
          </div>
        </section>
        <section
          class="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
          aria-labelledby="cta-heading"
        >
          <div
            class="from-primary via-surface-tint to-secondary relative overflow-hidden rounded-4xl bg-linear-to-br p-8 text-center shadow-[0_28px_80px_-24px_rgba(0,31,44,0.55)] md:p-12"
          >
            <div class="mf-cta-glow pointer-events-none absolute inset-0" aria-hidden="true"></div>
            <div class="relative">
              <h2
                id="cta-heading"
                class="font-headline mb-3 text-2xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-3xl"
              >
                Ready to streamline your clinic?
              </h2>
              <p
                class="mx-auto mb-8 max-w-lg text-[0.95rem] leading-relaxed font-medium text-white/90 md:text-base"
              >
                Create your account or sign in to pick up where you left off—securely, without
                friction.
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <a
                  routerLink="/auth/register"
                  class="font-headline bg-surface-container-lowest text-primary hover:bg-secondary-fixed inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-colors"
                >
                  Start now
                  <span class="material-symbols-outlined text-lg" aria-hidden="true"
                    >chevron_right</span
                  >
                </a>
                <a
                  routerLink="/auth/login"
                  class="font-headline ring-surface-container-lowest/45 text-on-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold ring-2 ring-inset transition-colors hover:bg-white/10"
                >
                  Sign in
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer class="border-outline-variant/15 relative z-10 border-t py-8 text-center">
        <p class="text-on-surface-variant text-sm font-medium">
          © {{ currentYear }} MediFlow — Secure Health Portal
        </p>
      </footer>
    </div>
  `,
  styles: `
    @keyframes mf-float-blob {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      50% {
        transform: translate(2%, -3%) scale(1.04);
      }
    }
    @keyframes mf-gradient-pan {
      0%,
      100% {
        opacity: 0.85;
      }
      50% {
        opacity: 1;
      }
    }
    @keyframes mf-fade-up {
      from {
        opacity: 0;
        transform: translateY(1.25rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes mf-rise {
      from {
        opacity: 0;
        transform: translateY(1rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes mf-shine {
      0% {
        transform: translateX(-120%) skewX(-12deg);
      }
      100% {
        transform: translateX(120%) skewX(-12deg);
      }
    }
    .mf-float-blob {
      animation: mf-float-blob 22s ease-in-out infinite;
    }
    .mf-float-blob-delayed {
      animation: mf-float-blob 26s ease-in-out infinite reverse;
      animation-delay: -4s;
    }
    .mf-gradient-pan {
      animation: mf-gradient-pan 14s ease-in-out infinite;
    }
    .mf-hero-enter {
      animation: mf-fade-up 0.85s ease-out both;
    }
    .mf-hero-enter-delayed {
      animation: mf-fade-up 0.85s ease-out both;
      animation-delay: 0.12s;
    }
    .mf-card-rise {
      opacity: 0;
      animation: mf-rise 0.7s ease-out forwards;
    }
    .mf-shine {
      background: linear-gradient(
        105deg,
        transparent 40%,
        color-mix(in srgb, var(--color-primary-container) 35%, transparent) 50%,
        transparent 60%
      );
      animation: mf-shine 6s ease-in-out infinite;
    }
    .mf-cta-glow {
      background:
        radial-gradient(
          circle at 20% 20%,
          color-mix(in srgb, white 28%, transparent),
          transparent 45%
        ),
        radial-gradient(
          circle at 80% 70%,
          color-mix(in srgb, var(--color-primary-container) 40%, transparent),
          transparent 42%
        );
    }
    @media (prefers-reduced-motion: reduce) {
      .mf-float-blob,
      .mf-float-blob-delayed,
      .mf-gradient-pan,
      .mf-hero-enter,
      .mf-hero-enter-delayed,
      .mf-card-rise,
      .mf-shine {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `,
})
export class LandingPage {
  protected readonly currentYear = new Date().getFullYear();

  protected staggerMs(index: number): string {
    return `${120 + index * 100}ms`;
  }

  protected readonly queuePreview = [
    { initial: 'A', label: 'Appointment check-in', meta: 'Desk · 2 min ago', status: 'Next' },
    { initial: 'R', label: 'Routine follow-up', meta: 'Room 3 · vitals ready', status: 'Ready' },
    { initial: 'W', label: 'Walk-in triage', meta: 'Nurse notified', status: 'Queued' },
  ] as const;
  protected readonly featureCards = [
    {
      icon: 'calendar_clock',
      title: 'Scheduling that sticks',
      body: 'Slots, exceptions, and last-minute changes stay visible to reception and clinical staff alike.',
    },
    {
      icon: 'bar_chart_4_bars',
      title: 'Queues with context',
      body: 'See who is waiting, who is ready, and what still needs attention—without digging through tabs.',
    },
    {
      icon: 'chat',
      title: 'Clear communication',
      body: 'Patients and teams move through the same source of truth, so updates do not get lost.',
    },
  ] as const;
}
