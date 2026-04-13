import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

export type AdminRole = 'admin' | 'doctor' | 'receptionist' | 'patient';
export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AdminUserRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  specialty: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  is_approved: boolean;
  role: AdminRole | null;
};

export type PatientRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  is_active: boolean;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type AdminUserFilters = {
  search?: string;
  role?: AdminRole | '';
  is_active?: 'true' | 'false' | '';
  page?: string;
  page_size?: string;
};

export type AnalyticsFilters = {
  date_from?: string;
  date_to?: string;
  doctor_id?: string;
};

export type AnalyticsSummary = {
  total_all_time: number;
  total_this_week: number;
  total_this_month: number;
  status_breakdown: Record<string, number>;
  no_show_rate: number;
};

export type AnalyticsPeakHours = {
  items: Array<{ hour: number; count: number }>;
};

export type AnalyticsByDoctor = {
  items: Array<{
    doctor_id: number;
    doctor_name: string;
    doctor_email: string;
    total: number;
    completed: number;
    cancelled: number;
    no_show: number;
    requested: number;
    confirmed: number;
    checked_in: number;
    no_show_rate: number;
  }>;
};

export type AnalyticsNoShowRate = {
  group_by: string;
  items: Array<{
    period: string;
    total: number;
    no_show: number;
    no_show_rate: number;
  }>;
};

export type ExportCsvFilters = {
  date_from?: string;
  date_to?: string;
  doctor_id?: string;
  status?: string[];
};

export type CsvExportResponse = {
  blob: Blob;
  filename: string;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  analytics(filters: AnalyticsFilters = {}): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>('/api/analytics/', {
      params: this.buildParams(filters)
    });
  }

  analyticsPeakHours(filters: AnalyticsFilters = {}): Observable<AnalyticsPeakHours> {
    return this.http.get<AnalyticsPeakHours>('/api/analytics/peak-hours/', {
      params: this.buildParams(filters)
    });
  }

  analyticsByDoctor(filters: AnalyticsFilters = {}): Observable<AnalyticsByDoctor> {
    return this.http.get<AnalyticsByDoctor>('/api/analytics/by-doctor/', {
      params: this.buildParams(filters)
    });
  }

  analyticsNoShowRate(
    filters: AnalyticsFilters & { group_by?: 'day' | 'week' } = {}
  ): Observable<AnalyticsNoShowRate> {
    return this.http.get<AnalyticsNoShowRate>('/api/analytics/no-show-rate/', {
      params: this.buildParams(filters)
    });
  }

  users(filters: AdminUserFilters = {}): Observable<PaginatedResponse<AdminUserRow>> {
    return this.http.get<PaginatedResponse<AdminUserRow>>('/api/users/', {
      params: this.buildParams(filters)
    });
  }

  createUser(payload: Record<string, unknown>): Observable<AdminUserRow> {
    return this.http.post<AdminUserRow>('/api/users/', payload);
  }

  updateUser(id: number, payload: Record<string, unknown>): Observable<AdminUserRow> {
    return this.http.patch<AdminUserRow>(`/api/users/${id}/`, payload);
  }

  deactivateUser(id: number): Observable<{ detail: string }> {
    return this.http.patch<{ detail: string }>(`/api/users/${id}/deactivate/`, {});
  }

  patients(filters: { page?: string; page_size?: string } = {}): Observable<PaginatedResponse<PatientRow>> {
    return this.http.get<PaginatedResponse<PatientRow>>('/api/patients/', {
      params: this.buildParams(filters)
    });
  }

  patientDetails(id: number): Observable<PatientRow> {
    return this.http.get<PatientRow>(`/api/patients/${id}/`);
  }

  exportCsv(filters: ExportCsvFilters = {}): Observable<CsvExportResponse> {
    let params = this.buildParams({
      date_from: filters.date_from,
      date_to: filters.date_to,
      doctor_id: filters.doctor_id
    });

    for (const status of filters.status ?? []) {
      if (status) {
        params = params.append('status', status);
      }
    }

    return this.downloadCsv('/api/appointments/export/', params).pipe(
      catchError((error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 404) {
          return this.downloadCsv('/api/reports/appointments/export/', params);
        }
        return throwError(() => error);
      })
    );
  }

  private buildParams(values: Record<string, string | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private downloadCsv(url: string, params: HttpParams): Observable<CsvExportResponse> {
    return this.http.get(url, {
      params,
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map((response) => {
        const disposition = response.headers.get('content-disposition') ?? '';
        const fileNameMatch = disposition.match(/filename="([^"]+)"/i);
        return {
          blob: response.body ?? new Blob(),
          filename: fileNameMatch?.[1] ?? `appointments_${new Date().toISOString().slice(0, 10)}.csv`
        };
      })
    );
  }
}
