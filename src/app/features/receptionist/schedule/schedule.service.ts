import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AddScheduleExceptionPayload,
  DoctorOption,
  DoctorScheduleDay,
  ScheduleException,
} from './models';

interface RawScheduleDay {
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_duration_minutes: number;
  buffer_minutes: number;
}

interface RawException {
  id: number;
  start_date: string;
  end_date?: string | null;
  exception_type: string;
  custom_start_time?: string | null;
  custom_end_time?: string | null;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private readonly http: HttpClient) {}

  getDoctors(): Observable<DoctorOption[]> {
    return this.http
      .get<Array<{ id: number; name: string }>>('/api/doctors/availability/')
      .pipe(map((rows) => rows.map((x) => ({ id: x.id, name: x.name, specialty: 'General' }))));
  }

  getDoctorSchedule(doctorId: number): Observable<DoctorScheduleDay[]> {
    return this.http
      .get<RawScheduleDay[]>(`/api/doctors/${doctorId}/schedule/`)
      .pipe(map((rows) => rows.map((x) => this.toScheduleDay(x))));
  }

  updateSchedule(doctorId: number, payload: DoctorScheduleDay[]): Observable<DoctorScheduleDay[]> {
    const body = payload
      .filter((d) => d.is_working_day)
      .map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        session_duration_minutes: d.session_duration_minutes,
        buffer_minutes: d.buffer_minutes,
      }));

    return this.http
      .post<RawScheduleDay[]>(`/api/doctors/${doctorId}/schedule/`, body)
      .pipe(map((rows) => rows.map((x) => this.toScheduleDay(x))));
  }

  updateSingleDay(
    doctorId: number,
    day: number,
    payload: Partial<DoctorScheduleDay>,
  ): Observable<DoctorScheduleDay> {
    const body = {
      start_time: payload.start_time,
      end_time: payload.end_time,
      session_duration_minutes: payload.session_duration_minutes,
      buffer_minutes: payload.buffer_minutes,
    };

    return this.http
      .put<RawScheduleDay>(`/api/doctors/${doctorId}/schedule/${day}/`, body)
      .pipe(map((x) => this.toScheduleDay(x)));
  }

  getExceptions(doctorId: number): Observable<ScheduleException[]> {
    return this.http
      .get<RawException[]>(`/api/doctors/${doctorId}/schedule/exceptions/`)
      .pipe(map((rows) => rows.map((x) => this.toException(x))));
  }

  addException(
    doctorId: number,
    payload: AddScheduleExceptionPayload,
  ): Observable<ScheduleException> {
    const body = {
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      exception_type: payload.exception_type === 'DAY_OFF' ? 'day_off' : 'one_off',
      custom_start_time: payload.custom_start_time ?? null,
      custom_end_time: payload.custom_end_time ?? null,
      reason: payload.reason ?? '',
    };

    return this.http
      .post<RawException>(`/api/doctors/${doctorId}/schedule/exceptions/`, body)
      .pipe(map((x) => this.toException(x)));
  }

  deleteException(doctorId: number, exceptionId: number): Observable<void> {
    return this.http.delete<void>(`/api/doctors/${doctorId}/schedule/exceptions/${exceptionId}/`);
  }

  private toScheduleDay(raw: RawScheduleDay): DoctorScheduleDay {
    return {
      day_of_week: raw.day_of_week,
      is_working_day: true,
      start_time: (raw.start_time ?? '').slice(0, 5),
      end_time: (raw.end_time ?? '').slice(0, 5),
      session_duration_minutes: (raw.session_duration_minutes || 30) as 15 | 30 | 45 | 60,
      buffer_minutes: (raw.buffer_minutes ?? 5) as 0 | 5 | 10 | 15,
    };
  }

  private toException(raw: RawException): ScheduleException {
    return {
      id: raw.id,
      start_date: raw.start_date,
      end_date: raw.end_date ?? null,
      exception_type: raw.exception_type === 'day_off' ? 'DAY_OFF' : 'CUSTOM_WORKING_DAY',
      custom_start_time: raw.custom_start_time ?? null,
      custom_end_time: raw.custom_end_time ?? null,
      reason: raw.reason ?? '',
    };
  }
}
