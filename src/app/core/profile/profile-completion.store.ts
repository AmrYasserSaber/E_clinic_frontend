import { Injectable, computed, signal } from '@angular/core';

const PATIENT_PROFILE_COMPLETE_KEY = 'mediflow_patient_profile_complete';

type ProfileCompletionState = {
  readonly isPatientProfileComplete: boolean;
};

@Injectable({ providedIn: 'root' })
export class ProfileCompletionStore {
  private readonly state = signal<ProfileCompletionState>(this.readState());

  readonly isPatientProfileComplete = computed(() => this.state().isPatientProfileComplete);

  setPatientProfileCompleteness(payload: {
    readonly phoneNumber?: string | null;
    readonly dateOfBirth?: string | null;
  }): void {
    const hasPhoneNumber: boolean = Boolean(payload.phoneNumber?.trim());
    const hasDateOfBirth: boolean = Boolean(payload.dateOfBirth?.trim());
    const isPatientProfileComplete: boolean = hasPhoneNumber && hasDateOfBirth;
    const next: ProfileCompletionState = { isPatientProfileComplete };
    this.state.set(next);
    localStorage.setItem(PATIENT_PROFILE_COMPLETE_KEY, JSON.stringify(next));
  }

  private readState(): ProfileCompletionState {
    const raw = localStorage.getItem(PATIENT_PROFILE_COMPLETE_KEY);
    if (!raw) return { isPatientProfileComplete: true };
    try {
      const parsed = JSON.parse(raw) as { isPatientProfileComplete?: unknown };
      return { isPatientProfileComplete: parsed.isPatientProfileComplete === true };
    } catch {
      return { isPatientProfileComplete: true };
    }
  }
}
