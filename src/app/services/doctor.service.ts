import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class DoctorService {
  constructor(private readonly http: HttpClient) {}

  getQueue(date?: string): Observable<unknown> {
    void date;
    return throwError(() => new Error('Not implemented yet.'));
  }

  getSchedule(): Observable<unknown> {
    return throwError(() => new Error('Not implemented yet.'));
  }

  confirmAppointment(id: number): Observable<unknown> {
    void id;
    return throwError(() => new Error('Not implemented yet.'));
  }

  declineAppointment(id: number, reason?: string): Observable<unknown> {
    void id;
    void reason;
    return throwError(() => new Error('Not implemented yet.'));
  }

  noShowAppointment(id: number): Observable<unknown> {
    void id;
    return throwError(() => new Error('Not implemented yet.'));
  }

  fileConsultation(id: number, data: ConsultationPayload): Observable<unknown> {
    void id;
    void data;
    return throwError(() => new Error('Not implemented yet.'));
  }
}
