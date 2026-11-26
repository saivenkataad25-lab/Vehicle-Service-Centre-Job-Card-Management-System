import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Booking, Customer, DashboardSummary, JobCard, StatusCount, Vehicle } from '../../core/models';
import { DataTableComponent, ErrorMessageComponent, PageHeaderComponent, StatusBadgeComponent, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="page">
      <app-page-header title="Workshop dashboard" description="Overview of bookings and workshop jobs">
        <a actions class="btn btn-primary" routerLink="/bookings/new">New booking</a>
        <a actions class="btn btn-secondary" routerLink="/customers/new">Register customer</a>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" [canRetry]="true" (retry)="load()" />
      } @else if (loading()) {
        <div class="stat-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="stat"><div class="skeleton-row"></div></div>
          }
        </div>
      } @else {
        <div class="stat-grid">
          <a class="stat stat-link" routerLink="/job-cards">
            <span class="stat-label">Job cards</span>
            <span class="stat-value num">{{ summary()?.jobCards ?? 0 }}</span>
          </a>
          <a class="stat stat-link" routerLink="/job-cards" [queryParams]="{ status: 'OPEN' }">
            <span class="stat-label">Open jobs</span>
            <span class="stat-value num">{{ countFor('OPEN') }}</span>
          </a>
          <a class="stat stat-link" routerLink="/job-cards" [queryParams]="{ status: 'IN_PROGRESS' }">
            <span class="stat-label">In progress</span>
            <span class="stat-value num">{{ countFor('IN_PROGRESS') }}</span>
          </a>
          <a class="stat stat-link" routerLink="/job-cards" [queryParams]="{ overdue: true }">
            <span class="stat-label">Overdue jobs</span>
            <span class="stat-value num">{{ summary()?.overdueJobs ?? 0 }}</span>
          </a>
        </div>

        <div class="split">
          <section class="card">
            <div class="section-heading">
              <h2>Current workshop jobs</h2>
              <a class="btn btn-text" routerLink="/job-cards">View all</a>
            </div>
            <app-data-table
              [columns]="jobColumns"
              [rows]="currentJobs()"
              emptyMessage="No active workshop jobs"
              emptyDetail="Create a booking, then convert it into a job card."
              emptyActionLabel="New booking"
              emptyActionLink="/bookings/new"
            />
          </section>

          <section class="card">
            <h2>Workload by status</h2>
            <div class="detail-list">
              @for (item of counts(); track item.status) {
                <div class="detail-item">
                  <app-status-badge [status]="item.status" />
                  <span class="num">{{ item.count }}</span>
                </div>
              }
            </div>
          </section>
        </div>

        <section class="card">
          <div class="section-heading">
            <h2>Recent bookings</h2>
            <a class="btn btn-text" routerLink="/bookings">View all</a>
          </div>
          <app-data-table
            [columns]="bookingColumns"
            [rows]="recentBookings()"
            emptyMessage="No bookings yet"
            emptyDetail="Register a customer and vehicle, then create a booking."
          />
        </section>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly counts = signal<StatusCount[]>([]);
  readonly delayed = signal<JobCard[]>([]);
  readonly upcoming = signal<JobCard[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly jobColumns: TableColumn[] = [
    { key: 'jobCardNumber', label: 'Job card', type: 'link', linkKey: 'id', linkPrefix: '/job-cards' },
    { key: 'registrationNumber', label: 'Vehicle' },
    { key: 'customerName', label: 'Customer' },
    { key: 'technicianName', label: 'Technician' },
    { key: 'jobStatus', label: 'Status', type: 'badge' },
    { key: 'promisedDate', label: 'Promised date', type: 'promisedDate' }
  ];

  readonly bookingColumns: TableColumn[] = [
    { key: 'bookingNumber', label: 'Booking', type: 'link', linkKey: 'id', linkPrefix: '/bookings' },
    { key: 'registrationNumber', label: 'Vehicle' },
    { key: 'vehicleDescription', label: 'Description' },
    { key: 'preferredDate', label: 'Preferred date', type: 'date' },
    { key: 'bookingStatus', label: 'Status', type: 'badge' }
  ];

  readonly currentJobs = signal<Record<string, unknown>[]>([]);
  readonly recentBookings = signal<Booking[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      summary: this.api.dashboardSummary(),
      counts: this.api.jobStatusCounts(),
      delayed: this.api.delayedJobs(),
      upcoming: this.api.upcomingJobs(),
      bookings: this.api.bookings({}),
      vehicles: this.api.vehicles({}),
      customers: this.api.customers()
    }).subscribe({
      next: (result) => {
        this.summary.set(result.summary);
        this.counts.set(result.counts);
        this.delayed.set(result.delayed);
        this.upcoming.set(result.upcoming);
        this.bookings.set(result.bookings);
        this.vehicles.set(result.vehicles);
        this.customers.set(result.customers);
        this.currentJobs.set([...result.delayed, ...result.upcoming].slice(0, 8).map((card) => this.toJobRow(card)));
        this.recentBookings.set([...result.bookings].sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)).slice(0, 5));
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  countFor(status: string): number {
    return this.counts().find((item) => item.status === status)?.count ?? 0;
  }

  private toJobRow(card: JobCard): Record<string, unknown> {
    const booking = this.bookings().find((item) => item.id === card.bookingId);
    const vehicle = this.vehicles().find((item) => item.id === booking?.vehicleId);
    const customer = this.customers().find((item) => item.id === vehicle?.customerId);
    return {
      ...card,
      registrationNumber: vehicle?.registrationNumber ?? 'Not set',
      customerName: customer?.fullName ?? 'Not set'
    };
  }
}
