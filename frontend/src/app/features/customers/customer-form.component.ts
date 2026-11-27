import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ApiFailure } from '../../core/models';
import { ErrorMessageComponent, FormFieldComponent, PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/customers">Customers</a> / {{ editing() ? 'Edit' : 'New' }}</p>
      <app-page-header [title]="editing() ? 'Edit customer' : 'Add customer'" description="Keep contact details current for job updates." />

      @if (error()) {
        <app-error-message [message]="error()" />
      }

      <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <app-form-field label="Customer code" id="customer-code" [required]="true" [error]="errorFor('customerCode')">
            <input id="customer-code" class="input" formControlName="customerCode" [attr.aria-describedby]="'customer-code-help'" [attr.aria-invalid]="isInvalid('customerCode')">
          </app-form-field>
          <app-form-field label="Full name" id="customer-name" [required]="true" [error]="errorFor('fullName')">
            <input id="customer-name" class="input" formControlName="fullName" [attr.aria-describedby]="'customer-name-help'" [attr.aria-invalid]="isInvalid('fullName')">
          </app-form-field>
          <app-form-field label="Phone" id="customer-phone" [required]="true" [error]="errorFor('phone')">
            <input id="customer-phone" class="input" type="tel" formControlName="phone" [attr.aria-describedby]="'customer-phone-help'" [attr.aria-invalid]="isInvalid('phone')">
          </app-form-field>
          <app-form-field label="Email" id="customer-email" [required]="true" [error]="errorFor('email')">
            <input id="customer-email" class="input" type="email" formControlName="email" [attr.aria-describedby]="'customer-email-help'" [attr.aria-invalid]="isInvalid('email')">
          </app-form-field>
          <app-form-field label="Address" id="customer-address" [required]="true" [error]="errorFor('address')">
            <textarea id="customer-address" class="input" formControlName="address" [attr.aria-describedby]="'customer-address-help'" [attr.aria-invalid]="isInvalid('address')"></textarea>
          </app-form-field>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">Save customer</button>
          <a class="btn btn-secondary" routerLink="/customers">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class CustomerFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder);
  readonly editing = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly failure = signal<ApiFailure | null>(null);
  private id: number | null = null;

  readonly form = this.builder.nonNullable.group({
    customerCode: ['', [Validators.required, Validators.maxLength(30)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId) {
      this.id = Number(rawId);
      this.editing.set(true);
      this.api.customer(this.id).subscribe({
        next: (customer) => this.form.patchValue(customer),
        error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
      });
    }
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
    if (control.hasError('required')) {
      return 'This field is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (name === 'phone' && control.hasError('pattern')) {
      return 'Phone must be exactly 10 digits.';
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
    const request = this.id === null ? this.api.createCustomer(body) : this.api.updateCustomer(this.id, body);
    request.subscribe({
      next: (customer) => this.router.navigate(['/customers', customer.id]),
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }
}
