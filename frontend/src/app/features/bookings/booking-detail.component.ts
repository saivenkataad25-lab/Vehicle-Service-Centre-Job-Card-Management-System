import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Booking, Customer, JobCard, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, ErrorMessageComponent, PageHeaderComponent, StatusBadgeComponent, formatDate as formatDateValue } from '../../shared/ui';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, ErrorMessageComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/bookings">Bookings</a> / {{ booking()?.bookingNumber ?? 'Details' }}</p>
      <app-page-header [title]="booking()?.bookingNumber ?? 'Booking details'" description="Booking information and job card conversion">
        <span actions class="page-actions">
          <a class="btn btn-secondary" routerLink="/bookings">Back</a>
          @if (booking(); as current) {
            @if (current.bookingStatus !== 'CONVERTED') {
              <a class="btn btn-secondary" [routerLink]="['/bookings', current.id, 'edit']">Edit</a>
            }
            @if (current.bookingStatus === 'PENDING' || current.bookingStatus === 'CONFIRMED') {
              <button class="btn btn-secondary" type="button" (click)="cancelBooking()">Cancel booking</button>
            }
            @if (!jobCard()) {
              @if (current.bookingStatus === 'CONFIRMED') {
                <a class="btn btn-primary" [routerLink]="['/job-cards/new']" [queryParams]="{ bookingId: current.id }">Create job card</a>
              }
            } @else {
              <a class="btn btn-primary" [routerLink]="['/job-cards', jobCard()!.id]">View job card</a>
            }
            @if (!jobCard()) {
              <button class="btn btn-danger" type="button" (click)="requestDelete(current)">Delete</button>
            }
          }
        </span>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" />
      } @else if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else if (booking(); as current) {
        <section class="card">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Status</span><app-status-badge [status]="current.bookingStatus" /></div>
            <div class="detail-item"><span class="detail-label">Vehicle</span><span>{{ current.registrationNumber }}</span></div>
            <div class="detail-item"><span class="detail-label">Description</span><span>{{ current.vehicleDescription }}</span></div>
            @if (ownerName()) {
              <div class="detail-item"><span class="detail-label">Customer</span><span>{{ ownerName() }}</span></div>
            }
            <div class="detail-item"><span class="detail-label">Booking date</span><span>{{ formatDate(current.bookingDate) }}</span></div>
            <div class="detail-item"><span class="detail-label">Preferred date</span><span>{{ formatDate(current.preferredDate) }}</span></div>
          </div>
          <div class="detail-item">
            <span class="detail-label">Customer complaint</span>
            <span>{{ current.complaint }}</span>
          </div>
        </section>
      }

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class BookingDetailComponent implements OnInit {
  readonly formatDate = formatDateValue;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly booking = signal<Booking | null>(null);
  readonly jobCard = signal<JobCard | null>(null);
  readonly ownerName = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      booking: this.api.booking(this.id),
      jobCards: this.api.jobCards({}),
      vehicles: this.api.vehicles({}),
      customers: this.api.customers()
    }).subscribe({
      next: (result) => {
        this.booking.set(result.booking);
        this.jobCard.set(result.jobCards.find((card) => card.bookingId === this.id) ?? null);
        const vehicle = result.vehicles.find((item) => item.id === result.booking.vehicleId);
        const owner = result.customers.find((item) => item.id === vehicle?.customerId);
        this.ownerName.set(owner?.fullName ?? '');
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  cancelBooking(): void {
    this.api.cancelBooking(this.id).subscribe({
      next: () => this.load(),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }

  requestDelete(booking: Booking): void {
    this.dialog?.open('Delete this booking?', `${booking.bookingNumber} will be removed if no job card exists.`, 'Delete booking');
  }

  confirmDelete(): void {
    this.api.deleteBooking(this.id).subscribe({
      next: () => this.router.navigate(['/bookings']),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }
}
