import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppointmentStatus } from '../models/domain.models';

export interface ConsultationPrescriptionItemPayload {
  drug: string;
  dose: string;
  duration: string;
  instructions?: string;
}

export interface ConsultationPayload {
  diagnosis: string;
  notes: string;
  requested_tests: string[];
  prescription_items: ConsultationPrescriptionItemPayload[];
}

export interface DoctorQueueItem {
  id: number;
  patient_full_name: string;
  appointment_time: string;
  status: AppointmentStatus;
  check_in_time: string | null;
  waiting_time_minutes: number | null;
}

export interface DoctorQueueResponse {
  date: string;
  items: DoctorQueueItem[];
}

export interface DoctorScheduleSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
}

export interface DoctorScheduleDay {
  date: string;
  slots: DoctorScheduleSlot[];
}

export interface DoctorScheduleResponse {
  items: DoctorScheduleDay[];
}

export interface AppointmentPersonInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface DoctorAppointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: AppointmentStatus;
  check_in_time: string | null;
  patient_info: AppointmentPersonInfo;
  doctor_info: AppointmentPersonInfo;
  consultation_summary?: {
    diagnosis: string;
    notes: string;
    requested_tests: string[];
    prescription_items: Array<{
      id: number;
      drug: string;
      dose: string;
      duration: string;
      instructions?: string;
    }>;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  constructor(private readonly http: HttpClient) {}

  getQueue(date?: string): Observable<DoctorQueueResponse> {
    let params = new HttpParams();
    if (date && date.toLowerCase() !== 'today') {
      params = params.set('date', date);
    }
    return this.http.get<DoctorQueueResponse>('/api/doctors/me/queue/', { params });
  }

  getSchedule(): Observable<DoctorScheduleResponse> {
    return this.http.get<DoctorScheduleResponse>('/api/doctors/me/schedule/');
  }

  getAppointments(filters: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<DoctorAppointment[]> {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    return this.http.get<DoctorAppointment[]>('/api/appointments/', { params });
  }

  confirmAppointment(id: number): Observable<DoctorAppointment> {
    return this.http.patch<DoctorAppointment>(`/api/appointments/${id}/confirm/`, {});
  }

  declineAppointment(id: number, reason?: string): Observable<DoctorAppointment> {
    const payload = reason ? { reason } : {};
    return this.http.patch<DoctorAppointment>(`/api/appointments/${id}/decline/`, payload);
  }

  noShowAppointment(id: number): Observable<DoctorAppointment> {
    return this.http.patch<DoctorAppointment>(`/api/appointments/${id}/no-show/`, {});
  }

  fileConsultation(id: number, data: ConsultationPayload): Observable<DoctorAppointment> {
    return this.http.post<DoctorAppointment>(`/api/appointments/${id}/consultation/`, data);
  }
}
