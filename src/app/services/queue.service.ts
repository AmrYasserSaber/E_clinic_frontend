import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QueueItem } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class QueueService {
  constructor(private readonly http: HttpClient) {}

  doctorQueue(date = 'today'): Observable<QueueItem[]> {
    return this.http.get<QueueItem[]>('/api/doctors/me/queue/', { params: { date } });
  }

  queue(date: string, doctorId?: string): Observable<QueueItem[]> {
    let params = new HttpParams().set('date', date);
    if (doctorId) params = params.set('doctor_id', doctorId);
    return this.http.get<QueueItem[]>('/api/queue/', { params });
  }
}
