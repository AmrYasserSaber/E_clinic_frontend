import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Appointment, AppointmentStatus } from '../models/domain.models';

/** Raw row from GET /api/appointments/ (DRF AppointmentSerializer). */
export interface AppointmentApiDto {
  id: number;
  patient?: number;
  doctor?: number;
  slot?: number | null;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
  session_duration_minutes?: number;
  status: string;
  check_in_time?: string | null;
  doctor_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  patient_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private readonly http: HttpClient) {}

  list(params?: Record<string, string | string[]>): Observable<Appointment[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => (httpParams = httpParams.append(key, v)));
        } else {
          httpParams = httpParams.set(key, value);
        }
      });
    }
    return this.http
      .get<AppointmentApiDto[]>('/api/appointments/', { params: httpParams })
      .pipe(map((rows) => rows.map((row) => this.mapAppointment(row))));
  }

  book(payload: Record<string, unknown>): Observable<Appointment> {
    return this.http
      .post<AppointmentApiDto>('/api/appointments/', payload)
      .pipe(map((row) => this.mapAppointment(row)));
  }

  cancel(id: string): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/cancel/`, {})
      .pipe(map((row) => this.mapAppointment(row)));
  }

  reschedule(id: string, payload: Record<string, unknown>): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/reschedule/`, payload)
      .pipe(map((row) => this.mapAppointment(row)));
  }

  confirm(id: string): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/confirm/`, {})
      .pipe(map((row) => this.mapAppointment(row)));
  }

  decline(id: string, reason?: string): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/decline/`, { reason })
      .pipe(map((row) => this.mapAppointment(row)));
  }

  checkIn(id: string): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/check-in/`, {})
      .pipe(map((row) => this.mapAppointment(row)));
  }

  noShow(id: string): Observable<Appointment> {
    return this.http
      .patch<AppointmentApiDto>(`/api/appointments/${id}/no-show/`, {})
      .pipe(map((row) => this.mapAppointment(row)));
  }

  private mapAppointment(row: AppointmentApiDto): Appointment {
    const d = row.doctor_info;
    const nameParts = [d?.first_name, d?.last_name].filter((p) => !!p && String(p).trim());
    const full = nameParts.join(' ').trim();
    const displayName = full ? `Dr. ${full}` : d?.email ?? 'Your doctor';

    return {
      id: String(row.id),
      doctor: {
        id: d?.id ?? row.doctor ?? 0,
        fullName: displayName,
        specialty: '',
      },
      date: row.appointment_date,
      time: row.appointment_time,
      reason: row.reason ?? '',
      status: row.status as AppointmentStatus,
      checkInTime: row.check_in_time ?? null,
    };
  }
}
