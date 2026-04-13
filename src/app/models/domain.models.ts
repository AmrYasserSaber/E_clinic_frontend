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
}

export interface Slot {
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface QueueItem {
  appointmentId: string;
  patientName: string;
  appointmentTime: string;
  checkInTime?: string | null;
  waitingMinutes: number;
  status: AppointmentStatus;
}
