import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  analytics(filters: Record<string, string> = {}): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>('/api/analytics/', {
      params: new HttpParams({ fromObject: filters })
    });
  }

  users(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>('/api/users/');
  }

  exportCsv(filters: Record<string, string> = {}): Observable<Blob> {
    return this.http.get('/api/appointments/export/', {
      params: new HttpParams({ fromObject: { ...filters, format: 'csv' } }),
      responseType: 'blob'
    });
  }
}
