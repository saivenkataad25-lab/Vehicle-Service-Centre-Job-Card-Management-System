import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Booking, JobCard, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective],
  template: `
    <div class="page">
      <app-page-header title="Service bookings" description="Bookings awaiting conversion into workshop jobs">
        <a actions class="btn btn-primary" routerLink="/bookings/new">New booking</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="booking-status">Booking status</label>
          <select id="booking-status" class="input" (change)="onStatus($event)">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CONVERTED">Converted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div class="filter">
          <label for="booking-date">Preferred date</label>
          <input id="booking-date" class="input" type="date" (change)="onDate($event)">
        </div>
        <div class="filter">
          <label for="booking-registration">Registration</label>
          <input id="booking-registration" class="input" type="search" placeholder="Vehicle registration" (input)="onRegistration($event)">
        </div>
        <div class="filter-actions">
          <button class="btn btn-secondary" type="button" (click)="clearFilters()">Clear filters</button>
        </div>
      </div>

      @if (success()) {
        <p class="success-banner" role="status">{{ success() }}</p>
      }
      @if (error()) {
        <app-error-message [message]="error()" [canRetry]="true" (retry)="load()" />
      }

      <app-data-table
        [columns]="columns"
        [rows]="rows()"
        [loading]="loading()"
        emptyMessage="No bookings found"
        emptyDetail="Adjust the filters or create a booking."
        emptyActionLabel="New booking"
        emptyActionLink="/bookings/new"
      >
        <ng-template appRowActions let-row>
          <a class="btn btn-text" [routerLink]="['/bookings', $any(row).id]">View</a>
          @if (!$any(row).hasJobCard && $any(row).bookingStatus !== 'CONVERTED') {
            <a class="btn btn-text" [routerLink]="['/bookings', $any(row).id, 'edit']">Edit</a>
          }
          @if (($any(row).bookingStatus === 'PENDING' || $any(row).bookingStatus === 'CONFIRMED') && !$any(row).hasJobCard) {
            <button class="btn btn-text" type="button" (click)="cancel($any(row))">Cancel</button>
            <button class="btn btn-text" type="button" (click)="requestDelete($any(row))">Delete</button>
          }
        </ng-template>
      </app-data-table>

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class BookingListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly allBookings = signal<Booking[]>([]);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  readonly status = signal('');
  readonly preferredDate = signal('');
  readonly registration = signal('');
  private pendingDelete: number | null = null;

  readonly columns: TableColumn[] = [
    { key: 'bookingNumber', label: 'Booking no.', type: 'link', linkKey: 'id', linkPrefix: '/bookings' },
    { key: 'registrationNumber', label: 'Vehicle' },
    { key: 'vehicleDescription', label: 'Description' },
    { key: 'bookingDate', label: 'Booking date', type: 'date' },
    { key: 'preferredDate', label: 'Preferred date', type: 'date' },
    { key: 'bookingStatus', label: 'Status', type: 'badge' }
  ];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.status.set(params.get('status') ?? '');
    this.preferredDate.set(params.get('preferredDate') ?? '');
    this.registration.set(params.get('registration') ?? '');
    this.load();
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onDate(event: Event): void {
    this.preferredDate.set((event.target as HTMLInputElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onRegistration(event: Event): void {
    this.registration.set((event.target as HTMLInputElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  clearFilters(): void {
    this.status.set('');
    this.preferredDate.set('');
    this.registration.set('');
    this.syncQuery();
    this.applyFilters();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ bookings: this.api.bookings({}), jobCards: this.api.jobCards({}) }).subscribe({
      next: ({ bookings, jobCards }) => {
        this.allBookings.set(bookings);
        this.applyFilters(jobCards);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  cancel(booking: Booking): void {
    this.api.cancelBooking(booking.id).subscribe({
      next: () => {
        this.success.set(`${booking.bookingNumber} cancelled.`);
        this.load();
      },
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }

  requestDelete(booking: Booking): void {
    this.pendingDelete = booking.id;
    this.dialog?.open('Delete this booking?', `${booking.bookingNumber} will be removed if no job card exists.`, 'Delete booking');
  }

  confirmDelete(): void {
    if (this.pendingDelete === null) {
      return;
    }
    this.api.deleteBooking(this.pendingDelete).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.success.set('Booking deleted.');
        this.load();
      },
      error: (failure: unknown) => {
        this.pendingDelete = null;
        this.error.set(this.api.fail(failure).message);
      }
    });
  }

  private applyFilters(jobCards?: JobCard[]): void {
    const cards = jobCards ?? [];
    const needle = this.registration().toLowerCase();
    this.rows.set(this.allBookings()
      .filter((booking) => !this.status() || booking.bookingStatus === this.status())
      .filter((booking) => !this.preferredDate() || booking.preferredDate === this.preferredDate())
      .filter((booking) => !needle || booking.registrationNumber.toLowerCase().includes(needle))
      .map((booking) => ({ ...booking, hasJobCard: cards.some((card) => card.bookingId === booking.id) })));
  }

  private syncQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.status() || null,
        preferredDate: this.preferredDate() || null,
        registration: this.registration() || null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
