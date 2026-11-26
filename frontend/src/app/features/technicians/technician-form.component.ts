import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ApiFailure } from '../../core/models';
import { ErrorMessageComponent, FormFieldComponent, PageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-technician-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/technicians">Technicians</a> / {{ editing() ? 'Edit' : 'New' }}</p>
      <app-page-header [title]="editing() ? 'Edit technician' : 'Add technician'" description="Assignment details and current availability." />

      @if (error()) {
        <app-error-message [message]="error()" />
      }

      <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <app-form-field label="Technician code" id="technician-code" [required]="true" [error]="errorFor('technicianCode')">
            <input id="technician-code" class="input" formControlName="technicianCode" [attr.aria-describedby]="'technician-code-help'" [attr.aria-invalid]="isInvalid('technicianCode')">
          </app-form-field>
          <app-form-field label="Full name" id="technician-name" [required]="true" [error]="errorFor('fullName')">
            <input id="technician-name" class="input" formControlName="fullName" [attr.aria-describedby]="'technician-name-help'" [attr.aria-invalid]="isInvalid('fullName')">
          </app-form-field>
          <app-form-field label="Skill area" id="technician-skill" [required]="true" [error]="errorFor('skillArea')">
            <input id="technician-skill" class="input" formControlName="skillArea" [attr.aria-describedby]="'technician-skill-help'" [attr.aria-invalid]="isInvalid('skillArea')">
          </app-form-field>
          <app-form-field label="Phone" id="technician-phone" [required]="true" [error]="errorFor('phone')">
            <input id="technician-phone" class="input" type="tel" formControlName="phone" [attr.aria-describedby]="'technician-phone-help'" [attr.aria-invalid]="isInvalid('phone')">
          </app-form-field>
          <app-form-field label="Availability" id="technician-availability" [required]="true" [error]="errorFor('availabilityStatus')">
            <select id="technician-availability" class="input" formControlName="availabilityStatus" [attr.aria-describedby]="'technician-availability-help'" [attr.aria-invalid]="isInvalid('availabilityStatus')">
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </app-form-field>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">Save technician</button>
          <a class="btn btn-secondary" routerLink="/technicians">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class TechnicianFormComponent implements OnInit {
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
    technicianCode: ['', [Validators.required, Validators.maxLength(30)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    skillArea: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
    availabilityStatus: ['AVAILABLE', [Validators.required]]
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId) {
      this.id = Number(rawId);
      this.editing.set(true);
      this.api.technician(this.id).subscribe({
        next: (technician) => this.form.patchValue(technician),
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
    if (name === 'phone' && (control.hasError('minlength') || control.hasError('maxlength'))) {
      return 'Phone must be exactly 10 characters.';
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
    const request = this.id === null ? this.api.createTechnician(body) : this.api.updateTechnician(this.id, body);
    request.subscribe({
      next: (technician) => this.router.navigate(['/technicians', technician.id]),
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }
}
