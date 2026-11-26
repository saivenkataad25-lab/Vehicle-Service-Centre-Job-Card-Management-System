import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiFailure, Booking, Customer, DashboardSummary, JobCard, StatusCount, Technician, Vehicle } from './models';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body);
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(`${this.base}${path}`);
  }

  fail(error: unknown): ApiFailure {
    const candidate = error as { status?: number; error?: { message?: string; fieldErrors?: Record<string, string> }; message?: string };
    return {
      status: candidate.status ?? 0,
      message: candidate.error?.message ?? candidate.message ?? 'The request could not be completed.',
      fieldErrors: candidate.error?.fieldErrors ?? {}
    };
  }

  customers(search?: string): Observable<Customer[]> {
    return this.get<Customer[]>('/customers', { search });
  }

  customer(id: number): Observable<Customer> {
    return this.get<Customer>(`/customers/${id}`);
  }

  createCustomer(body: unknown): Observable<Customer> {
    return this.post<Customer>('/customers', body);
  }

  updateCustomer(id: number, body: unknown): Observable<Customer> {
    return this.put<Customer>(`/customers/${id}`, body);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.delete(`/customers/${id}`);
  }

  vehicles(params?: QueryParams): Observable<Vehicle[]> {
    return this.get<Vehicle[]>('/vehicles', params);
  }

  vehicle(id: number): Observable<Vehicle> {
    return this.get<Vehicle>(`/vehicles/${id}`);
  }

  createVehicle(body: unknown): Observable<Vehicle> {
    return this.post<Vehicle>('/vehicles', body);
  }

  updateVehicle(id: number, body: unknown): Observable<Vehicle> {
    return this.put<Vehicle>(`/vehicles/${id}`, body);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.delete(`/vehicles/${id}`);
  }

  technicians(params?: QueryParams): Observable<Technician[]> {
    return this.get<Technician[]>('/technicians', params);
  }

  technician(id: number): Observable<Technician> {
    return this.get<Technician>(`/technicians/${id}`);
  }

  createTechnician(body: unknown): Observable<Technician> {
    return this.post<Technician>('/technicians', body);
  }

  updateTechnician(id: number, body: unknown): Observable<Technician> {
    return this.put<Technician>(`/technicians/${id}`, body);
  }

  deleteTechnician(id: number): Observable<void> {
    return this.delete(`/technicians/${id}`);
  }

  bookings(params?: QueryParams): Observable<Booking[]> {
    return this.get<Booking[]>('/service-bookings', params);
  }

  booking(id: number): Observable<Booking> {
    return this.get<Booking>(`/service-bookings/${id}`);
  }

  createBooking(body: unknown): Observable<Booking> {
    return this.post<Booking>('/service-bookings', body);
  }

  updateBooking(id: number, body: unknown): Observable<Booking> {
    return this.put<Booking>(`/service-bookings/${id}`, body);
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.post<Booking>(`/service-bookings/${id}/cancel`, {});
  }

  deleteBooking(id: number): Observable<void> {
    return this.delete(`/service-bookings/${id}`);
  }

  jobCards(params?: QueryParams): Observable<JobCard[]> {
    return this.get<JobCard[]>('/job-cards', params);
  }

  jobCard(id: number): Observable<JobCard> {
    return this.get<JobCard>(`/job-cards/${id}`);
  }

  createJobCard(body: unknown): Observable<JobCard> {
    return this.post<JobCard>('/job-cards', body);
  }

  updateJobCard(id: number, body: unknown): Observable<JobCard> {
    return this.put<JobCard>(`/job-cards/${id}`, body);
  }

  deleteJobCard(id: number): Observable<void> {
    return this.delete(`/job-cards/${id}`);
  }

  dashboardSummary(): Observable<DashboardSummary> {
    return this.get<DashboardSummary>('/dashboard/summary');
  }

  jobStatusCounts(): Observable<StatusCount[]> {
    return this.get<StatusCount[]>('/dashboard/job-status-counts');
  }

  delayedJobs(): Observable<JobCard[]> {
    return this.get<JobCard[]>('/dashboard/delayed-jobs');
  }

  upcomingJobs(): Observable<JobCard[]> {
    return this.get<JobCard[]>('/dashboard/upcoming-jobs');
  }

  completedReport(): Observable<JobCard[]> {
    return this.get<JobCard[]>('/reports/completed-job-cards');
  }

  private toParams(params?: QueryParams): HttpParams {
    let result = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.set(key, String(value));
      }
    });
    return result;
  }
}
