import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Slot } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class SlotsService {
  constructor(private readonly http: HttpClient) {}

  list(doctorId: number, date: string): Observable<Slot[]> {
    const params = new HttpParams().set('doctor_id', doctorId).set('date', date);
    return this.http.get<Slot[]>('/api/slots/', { params });
  }
}
