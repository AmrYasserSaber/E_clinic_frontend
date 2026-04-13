import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface QueueItem {
  id: number;
  patient_name: string;
  appointment_time: string;
  check_in_time?: string | null;
  status: 'CONFIRMED' | 'CHECKED_IN';
  waiting_minutes: number;
}

export interface DoctorAvailability {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'AWAY';
}

interface QueueApiItem {
  appointment_id: number;
  patient_name: string;
  time: string;
  check_in_time?: string | null;
  status: string;
  waiting_time?: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getQueue(date: string, doctorId?: number): Observable<QueueItem[]> {
    let params = new HttpParams().set('date', date);
    if (doctorId !== undefined) {
      params = params.set('doctor_id', String(doctorId));
    }

    return this.http
      .get<QueueApiItem[]>('/api/queue/', { params })
      .pipe(map((rows) => rows.map((item) => this.mapQueueItem(item))));
  }

  getDoctorAvailability(): Observable<DoctorAvailability[]> {
    return this.http.get<DoctorAvailability[]>('/api/doctors/availability/').pipe(
      catchError((error) => {
        console.error('[DashboardService] Failed to load doctor availability', error);
        return throwError(() => error);
      }),
    );
  }

  checkIn(appointmentId: number): Observable<void> {
    return this.http.patch<void>(`/api/appointments/${appointmentId}/check-in/`, {});
  }

  private mapQueueItem(item: QueueApiItem): QueueItem {
    const normalized = String(item.status || '').toUpperCase();
    return {
      id: item.appointment_id,
      patient_name: item.patient_name,
      appointment_time: item.time,
      check_in_time: item.check_in_time ?? null,
      status: normalized === 'CHECKED_IN' ? 'CHECKED_IN' : 'CONFIRMED',
      waiting_minutes: item.waiting_time ?? 0,
    };
  }
}
