import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment } from '../models/domain.models';

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
    return this.http.get<Appointment[]>('/api/appointments/', { params: httpParams });
  }

  book(payload: Record<string, unknown>): Observable<Appointment> {
    return this.http.post<Appointment>('/api/appointments/', payload);
  }

  cancel(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/cancel/`, {});
  }

  reschedule(id: string, payload: Record<string, unknown>): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/reschedule/`, payload);
  }

  confirm(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/confirm/`, {});
  }

  decline(id: string, reason?: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/decline/`, { reason });
  }

  checkIn(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/check-in/`, {});
  }

  noShow(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`/api/appointments/${id}/no-show/`, {});
  }
}
