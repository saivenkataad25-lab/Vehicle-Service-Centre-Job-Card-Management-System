import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Booking, JobCard, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/vehicles">Vehicles</a> / {{ vehicle()?.registrationNumber ?? 'Details' }}</p>
      <app-page-header [title]="vehicle()?.registrationNumber ?? 'Vehicle details'" description="Vehicle record, owner and service history">
        <span actions class="page-actions">
          <a class="btn btn-secondary" routerLink="/vehicles">Back</a>
          @if (vehicle(); as current) {
            <a class="btn btn-secondary" [routerLink]="['/vehicles', current.id, 'edit']">Edit</a>
            <a class="btn btn-primary" [routerLink]="['/bookings/new']" [queryParams]="{ vehicleId: current.id }">New booking</a>
            <button class="btn btn-danger" type="button" (click)="requestDelete(current)">Delete</button>
          }
        </span>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" />
      } @else if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else if (vehicle(); as current) {
        <section class="card">
          <h2>Vehicle details</h2>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Make and model</span><span>{{ current.make }} {{ current.model }}</span></div>
            <div class="detail-item"><span class="detail-label">Year</span><span>{{ current.year }}</span></div>
            <div class="detail-item"><span class="detail-label">Fuel type</span><span>{{ current.fuelType }}</span></div>
            <div class="detail-item"><span class="detail-label">Odometer</span><span class="num">{{ current.odometerReading }}</span></div>
            <div class="detail-item">
              <span class="detail-label">Owner</span>
              <a [routerLink]="['/customers', current.customerId]">{{ current.customerName }}</a>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-heading"><h2>Booking history</h2></div>
          <app-data-table [columns]="bookingColumns" [rows]="bookings()" emptyMessage="No bookings for this vehicle" emptyDetail="Create a booking to start a service record." />
        </section>

        <section class="card">
          <div class="section-heading"><h2>Related job cards</h2></div>
          <app-data-table [columns]="jobColumns" [rows]="jobCards()" emptyMessage="No job cards for this vehicle" emptyDetail="Convert an eligible booking into a job card." />
        </section>
      }

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class VehicleDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly vehicle = signal<Vehicle | null>(null);
  readonly bookings = signal<Booking[]>([]);
  readonly jobCards = signal<JobCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private id = 0;

  readonly bookingColumns: TableColumn[] = [
    { key: 'bookingNumber', label: 'Booking', type: 'link', linkKey: 'id', linkPrefix: '/bookings' },
    { key: 'bookingDate', label: 'Booking date', type: 'date' },
    { key: 'preferredDate', label: 'Preferred date', type: 'date' },
    { key: 'bookingStatus', label: 'Status', type: 'badge' }
  ];

  readonly jobColumns: TableColumn[] = [
    { key: 'jobCardNumber', label: 'Job card', type: 'link', linkKey: 'id', linkPrefix: '/job-cards' },
    { key: 'jobStatus', label: 'Status', type: 'badge' },
    { key: 'promisedDate', label: 'Promised date', type: 'promisedDate' },
    { key: 'labourEstimate', label: 'Estimate', type: 'money' }
  ];

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      vehicle: this.api.vehicle(this.id),
      bookings: this.api.bookings({ vehicleId: this.id }),
      jobCards: this.api.jobCards({})
    }).subscribe({
      next: (result) => {
        this.vehicle.set(result.vehicle);
        this.bookings.set(result.bookings);
        const bookingIds = new Set(result.bookings.map((booking) => booking.id));
        this.jobCards.set(result.jobCards.filter((card) => bookingIds.has(card.bookingId)));
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(vehicle: Vehicle): void {
    this.dialog?.open('Delete this vehicle?', `${vehicle.registrationNumber} will be removed if no bookings are linked.`, 'Delete vehicle');
  }

  confirmDelete(): void {
    this.api.deleteVehicle(this.id).subscribe({
      next: () => this.router.navigate(['/vehicles']),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }
}
