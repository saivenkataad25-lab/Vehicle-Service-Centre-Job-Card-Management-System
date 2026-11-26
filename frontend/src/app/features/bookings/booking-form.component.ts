import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiFailure, Booking, Vehicle } from '../../core/models';
import { ErrorMessageComponent, FormFieldComponent, PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/bookings">Bookings</a> / {{ editing() ? 'Edit' : 'New' }}</p>
      <app-page-header [title]="editing() ? 'Edit booking' : 'New booking'" description="Select a vehicle and set the expected service date." />

      @if (error()) {
        <app-error-message [message]="error()" />
      }

      <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <app-form-field label="Booking number" id="booking-number" [required]="true" [error]="errorFor('bookingNumber')">
            <input id="booking-number" class="input" formControlName="bookingNumber" [attr.aria-describedby]="'booking-number-help'" [attr.aria-invalid]="isInvalid('bookingNumber')">
          </app-form-field>
          <app-form-field label="Vehicle" id="booking-vehicle" [required]="true" [error]="errorFor('vehicleId')">
            <select id="booking-vehicle" class="input" formControlName="vehicleId" [attr.aria-describedby]="'booking-vehicle-help'" [attr.aria-invalid]="isInvalid('vehicleId')">
              <option [ngValue]="0">Select vehicle</option>
              @for (vehicle of vehicles(); track vehicle.id) {
                <option [ngValue]="vehicle.id">{{ vehicle.registrationNumber }} ({{ vehicle.make }} {{ vehicle.model }})</option>
              }
            </select>
          </app-form-field>
          <app-form-field label="Booking date" id="booking-date" [required]="true" [error]="errorFor('bookingDate')">
            <input id="booking-date" class="input" type="date" formControlName="bookingDate" [attr.aria-describedby]="'booking-date-help'" [attr.aria-invalid]="isInvalid('bookingDate')">
          </app-form-field>
          <app-form-field label="Preferred service date" id="booking-preferred" [required]="true" [error]="errorFor('preferredDate')">
            <input id="booking-preferred" class="input" type="date" formControlName="preferredDate" [attr.aria-describedby]="'booking-preferred-help'" [attr.aria-invalid]="isInvalid('preferredDate')">
          </app-form-field>
          <app-form-field label="Booking status" id="booking-status" [required]="true" [error]="errorFor('bookingStatus')">
            <select id="booking-status" class="input" formControlName="bookingStatus" [attr.aria-describedby]="'booking-status-help'" [attr.aria-invalid]="isInvalid('bookingStatus')">
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
            </select>
          </app-form-field>
        </div>
        <div class="form-grid one">
          <app-form-field label="Customer complaint" id="booking-complaint" [required]="true" [error]="errorFor('complaint')">
            <textarea id="booking-complaint" class="input" formControlName="complaint" [attr.aria-describedby]="'booking-complaint-help'" [attr.aria-invalid]="isInvalid('complaint')"></textarea>
          </app-form-field>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="submitting() || locked()" [attr.aria-busy]="submitting()">Save booking</button>
          <a class="btn btn-secondary" routerLink="/bookings">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class BookingFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly editing = signal(false);
  readonly submitting = signal(false);
  readonly locked = signal(false);
  readonly error = signal('');
  readonly failure = signal<ApiFailure | null>(null);
  private id: number | null = null;

  readonly form = this.builder.nonNullable.group({
    bookingNumber: ['', [Validators.required, Validators.maxLength(30)]],
    vehicleId: [0, [Validators.required, Validators.min(1)]],
    bookingDate: [this.today(), [Validators.required]],
    preferredDate: [this.inDays(7), [Validators.required]],
    complaint: ['', [Validators.required, Validators.maxLength(1000)]],
    bookingStatus: ['CONFIRMED', [Validators.required]]
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const presetVehicle = Number(this.route.snapshot.queryParamMap.get('vehicleId') ?? 0);
    forkJoin({ vehicles: this.api.vehicles({}), bookings: this.api.bookings({}) }).subscribe({
      next: ({ vehicles, bookings }) => {
        this.vehicles.set(vehicles);
        if (!rawId) {
          this.form.patchValue({ bookingNumber: this.nextNumber(bookings) });
          if (presetVehicle) {
            this.form.patchValue({ vehicleId: presetVehicle });
          }
          return;
        }
        this.id = Number(rawId);
        this.editing.set(true);
        this.api.booking(this.id).subscribe({
          next: (booking) => {
            if (booking.bookingStatus === 'CONVERTED') {
              this.locked.set(true);
              this.error.set('A converted booking cannot be edited.');
            }
            this.form.patchValue({
              bookingNumber: booking.bookingNumber,
              vehicleId: booking.vehicleId,
              bookingDate: booking.bookingDate,
              preferredDate: booking.preferredDate,
              complaint: booking.complaint,
              bookingStatus: booking.bookingStatus
            });
          },
          error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
        });
      },
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }

  isInvalid(name: string): boolean {
    const control = this.form.get(name);
    return Boolean(control && control.touched && control.invalid);
  }

  errorFor(name: string): string {
    const serverError = this.failure()?.fieldErrors[name];
    if (serverError) {
      return serverError;
    }
    const control = this.form.get(name);
    if (!control || !control.touched || !control.invalid) {
      return '';
    }
    return control.hasError('required') ? 'This field is required.' : 'Check this value.';
  }

  save(): void {
    if (this.form.invalid || this.locked()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.failure.set(null);
    const body = this.form.getRawValue();
    const request = this.id === null ? this.api.createBooking(body) : this.api.updateBooking(this.id, body);
    request.subscribe({
      next: (booking) => this.router.navigate(['/bookings', booking.id]),
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private inDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private nextNumber(bookings: Booking[]): string {
    const year = new Date().getFullYear();
    const prefix = `BK-${year}-`;
    let next = bookings.length + 1;
    while (bookings.some((booking) => booking.bookingNumber === `${prefix}${String(next).padStart(4, '0')}`)) {
      next += 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
}
