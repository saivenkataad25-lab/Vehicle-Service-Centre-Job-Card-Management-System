import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiFailure, Customer } from '../../core/models';
import { ErrorMessageComponent, FormFieldComponent, PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/vehicles">Vehicles</a> / {{ editing() ? 'Edit' : 'New' }}</p>
      <app-page-header [title]="editing() ? 'Edit vehicle' : 'Add vehicle'" description="Registration details and owner assignment." />

      @if (error()) {
        <app-error-message [message]="error()" />
      }

      <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <app-form-field label="Registration number" id="vehicle-registration" [required]="true" [error]="errorFor('registrationNumber')">
            <input id="vehicle-registration" class="input" formControlName="registrationNumber" [attr.aria-describedby]="'vehicle-registration-help'" [attr.aria-invalid]="isInvalid('registrationNumber')">
          </app-form-field>
          <app-form-field label="Customer" id="vehicle-customer" [required]="true" [error]="errorFor('customerId')">
            <select id="vehicle-customer" class="input" formControlName="customerId" [attr.aria-describedby]="'vehicle-customer-help'" [attr.aria-invalid]="isInvalid('customerId')">
              <option [ngValue]="0">Select customer</option>
              @for (customer of customers(); track customer.id) {
                <option [ngValue]="customer.id">{{ customer.fullName }} ({{ customer.customerCode }})</option>
              }
            </select>
          </app-form-field>
          <app-form-field label="Make" id="vehicle-make" [required]="true" [error]="errorFor('make')">
            <input id="vehicle-make" class="input" formControlName="make" [attr.aria-describedby]="'vehicle-make-help'" [attr.aria-invalid]="isInvalid('make')">
          </app-form-field>
          <app-form-field label="Model" id="vehicle-model" [required]="true" [error]="errorFor('model')">
            <input id="vehicle-model" class="input" formControlName="model" [attr.aria-describedby]="'vehicle-model-help'" [attr.aria-invalid]="isInvalid('model')">
          </app-form-field>
          <app-form-field label="Year" id="vehicle-year" [required]="true" [error]="errorFor('year')">
            <input id="vehicle-year" class="input" type="number" formControlName="year" [attr.aria-describedby]="'vehicle-year-help'" [attr.aria-invalid]="isInvalid('year')">
          </app-form-field>
          <app-form-field label="Fuel type" id="vehicle-fuel" [required]="true" [error]="errorFor('fuelType')">
            <select id="vehicle-fuel" class="input" formControlName="fuelType" [attr.aria-describedby]="'vehicle-fuel-help'" [attr.aria-invalid]="isInvalid('fuelType')">
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
            </select>
          </app-form-field>
          <app-form-field label="Odometer reading" id="vehicle-odometer" [required]="true" [error]="errorFor('odometerReading')">
            <input id="vehicle-odometer" class="input" type="number" formControlName="odometerReading" [attr.aria-describedby]="'vehicle-odometer-help'" [attr.aria-invalid]="isInvalid('odometerReading')">
          </app-form-field>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">Save vehicle</button>
          <a class="btn btn-secondary" routerLink="/vehicles">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class VehicleFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder);
  readonly customers = signal<Customer[]>([]);
  readonly editing = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly failure = signal<ApiFailure | null>(null);
  private id: number | null = null;

  readonly form = this.builder.nonNullable.group({
    registrationNumber: ['', [Validators.required, Validators.maxLength(30)]],
    customerId: [0, [Validators.required, Validators.min(1)]],
    make: ['', [Validators.required, Validators.maxLength(60)]],
    model: ['', [Validators.required, Validators.maxLength(60)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
    fuelType: ['PETROL', [Validators.required]],
    odometerReading: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const presetCustomer = Number(this.route.snapshot.queryParamMap.get('customerId') ?? 0);
    forkJoin({ customers: this.api.customers(), vehicle: rawId ? this.api.vehicle(Number(rawId)) : of(null) }).subscribe({
      next: ({ customers, vehicle }) => {
        this.customers.set(customers);
        if (vehicle) {
          this.id = vehicle.id;
          this.editing.set(true);
          this.form.patchValue({
            registrationNumber: vehicle.registrationNumber,
            customerId: vehicle.customerId,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            fuelType: vehicle.fuelType,
            odometerReading: vehicle.odometerReading
          });
        } else if (presetCustomer) {
          this.form.patchValue({ customerId: presetCustomer });
        }
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
    if (control.hasError('required') || control.hasError('min')) {
      return 'Enter a valid value.';
    }
    return 'Check this value.';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.failure.set(null);
    const body = this.form.getRawValue();
    const request = this.id === null ? this.api.createVehicle(body) : this.api.updateVehicle(this.id, body);
    request.subscribe({
      next: (vehicle) => this.router.navigate(['/vehicles', vehicle.id]),
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }
}
