import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type QueueStatus = 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW';
export type QueueFilter = 'ALL' | 'WAITING';

export interface QueueItem {
  id: number;
  patient_name: string;
  doctor_name: string;
  appointment_time: string;
  check_in_time?: string;
  status: QueueStatus;
}

interface QueueApiItem {
  appointment_id: number;
  patient_name: string;
  doctor_name?: string;
  time: string;
  check_in_time?: string | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  constructor(private readonly http: HttpClient) {}

  getQueue(date: string, doctorId?: number): Observable<QueueItem[]> {
    let params = new HttpParams().set('date', date);
    if (doctorId) params = params.set('doctor_id', String(doctorId));

    return this.http
      .get<QueueApiItem[]>('/api/queue/', { params })
      .pipe(map((rows) => rows.map((x) => this.mapQueueItem(x))));
  }

  checkIn(id: number): Observable<void> {
    return this.http.patch<void>(`/api/appointments/${id}/check-in/`, {});
  }

  markNoShow(id: number): Observable<void> {
    return this.http.patch<void>(`/api/appointments/${id}/no-show/`, {});
  }

  private mapQueueItem(item: QueueApiItem): QueueItem {
    const normalized = String(item.status || '').toUpperCase();
    const status: QueueStatus =
      normalized === 'CHECKED_IN'
        ? 'CHECKED_IN'
        : normalized === 'IN_PROGRESS'
          ? 'IN_PROGRESS'
          : normalized === 'COMPLETED'
            ? 'COMPLETED'
            : normalized === 'NO_SHOW'
              ? 'NO_SHOW'
              : 'CONFIRMED';

    return {
      id: item.appointment_id,
      patient_name: item.patient_name,
      doctor_name: item.doctor_name ?? 'Assigned Doctor',
      appointment_time: item.time,
      check_in_time: item.check_in_time ?? undefined,
      status,
    };
  }
}
