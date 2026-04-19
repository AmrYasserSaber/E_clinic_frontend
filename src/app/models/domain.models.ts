export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

/** Normalized session after login / refresh / signup (frontend shape). */
export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface DoctorSummary {
  id: number;
  fullName: string;
  specialty: string;
}

export interface DoctorAvailability {
  id: number;
  name: string;
  specialty?: string;
  status: 'AVAILABLE' | 'BUSY' | 'AWAY';
}

export interface Appointment {
  id: string;
  doctor: DoctorSummary;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  checkInTime?: string | null;
  consultationSummary?: ConsultationSummary | null;
  rescheduleHistory?: RescheduleHistoryEntry[];
}

export interface RescheduleHistoryEntry {
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  changedBy?: string | null;
  reason?: string | null;
  changedAt?: string | null;
}

export interface ConsultationPrescriptionItem {
  id: number;
  drug: string;
  dose: string;
  duration: string;
  instructions?: string;
}

export interface ConsultationSummary {
  diagnosis: string;
  notes: string;
  requestedTests: string[];
  prescriptionItems: ConsultationPrescriptionItem[];
}

export interface Slot {
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  // returned by the backend to indicate whether the slot is currently free
  is_available?: boolean;
}

export interface QueueItem {
  appointmentId: string;
  patientName: string;
  appointmentTime: string;
  checkInTime?: string | null;
  waitingMinutes: number;
  status: AppointmentStatus;
}
