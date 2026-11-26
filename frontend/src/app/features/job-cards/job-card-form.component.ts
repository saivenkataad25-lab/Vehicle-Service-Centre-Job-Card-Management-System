import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiFailure, Booking, Customer, JobCard, Technician, Vehicle } from '../../core/models';
import { EmptyStateComponent, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent, formatMoney as formatMoneyValue } from '../../shared/ui';

@Component({
  selector: 'app-job-card-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EmptyStateComponent, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/job-cards">Job cards</a> / New</p>
      <app-page-header title="Create job card" description="Convert a confirmed booking into a workshop job." />

      @if (error()) {
        <app-error-message [message]="error()" />
      }

      @if (eligibleBookings().length) {
        <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="form-grid">
            <app-form-field label="Booking" id="job-booking" [required]="true" [error]="errorFor('bookingId')">
              <select id="job-booking" class="input" formControlName="bookingId" [attr.aria-describedby]="'job-booking-help'" [attr.aria-invalid]="isInvalid('bookingId')">
                <option [ngValue]="0">Select booking</option>
                @for (booking of eligibleBookings(); track booking.id) {
                  <option [ngValue]="booking.id">{{ booking.bookingNumber }} ({{ booking.registrationNumber }})</option>
                }
              </select>
            </app-form-field>
            <app-form-field label="Technician" id="job-technician" [error]="errorFor('technicianId')">
              <select id="job-technician" class="input" formControlName="technicianId" [attr.aria-describedby]="'job-technician-help'" [attr.aria-invalid]="isInvalid('technicianId')">
                <option [ngValue]="0">Unassigned</option>
                @for (technician of availableTechnicians(); track technician.id) {
                  <option [ngValue]="technician.id">{{ technician.fullName }} ({{ technician.skillArea }})</option>
                }
              </select>
            </app-form-field>
            <app-form-field label="Opened date" id="job-opened" [required]="true" [error]="errorFor('openedDate')">
              <input id="job-opened" class="input" type="date" formControlName="openedDate" [attr.aria-describedby]="'job-opened-help'" [attr.aria-invalid]="isInvalid('openedDate')">
            </app-form-field>
            <app-form-field label="Promised date" id="job-promised" [required]="true" [error]="errorFor('promisedDate')">
              <input id="job-promised" class="input" type="date" formControlName="promisedDate" [attr.aria-describedby]="'job-promised-help'" [attr.aria-invalid]="isInvalid('promisedDate')">
            </app-form-field>
          </div>

          @if (selectedBooking(); as booking) {
            <div class="detail-item">
              <span class="detail-label">Vehicle and owner</span>
              <span>{{ booking.registrationNumber }} ({{ booking.vehicleDescription }}), {{ ownerName() }}</span>
            </div>
          }

          <div class="section-heading">
            <h2>Service tasks</h2>
            <button class="btn btn-secondary" type="button" (click)="addTask()">Add task</button>
          </div>

          <div formArrayName="serviceTasks" class="stack">
            @for (task of tasks.controls; let i = $index; track i) {
              <div [formGroupName]="i" class="task-row">
                <app-form-field [label]="'Task ' + (i + 1) + ' name'" [id]="'task-name-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.taskName')">
                  <input [id]="'task-name-' + i" class="input" formControlName="taskName">
                </app-form-field>
                <app-form-field [label]="'Description'" [id]="'task-description-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.description')">
                  <input [id]="'task-description-' + i" class="input" formControlName="description">
                </app-form-field>
                <app-form-field [label]="'Hours'" [id]="'task-hours-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.estimatedHours')">
                  <input [id]="'task-hours-' + i" class="input" type="number" step="0.25" formControlName="estimatedHours">
                </app-form-field>
                <app-form-field [label]="'Rate'" [id]="'task-rate-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.hourlyRate')">
                  <input [id]="'task-rate-' + i" class="input" type="number" step="0.01" formControlName="hourlyRate">
                </app-form-field>
                @if (tasks.controls.length > 1) {
                  <button class="btn btn-text" type="button" (click)="removeTask(i)">Remove task</button>
                }
              </div>
            }
          </div>

          <div class="detail-item">
            <span class="detail-label">Labour estimate</span>
            <span class="num">{{ formatMoney(estimate()) }}</span>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">Create job card</button>
            <a class="btn btn-secondary" routerLink="/bookings">Cancel</a>
          </div>
        </form>
      } @else if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else {
        <app-empty-state message="No eligible bookings" detail="Confirm a booking before creating its job card." actionLabel="View bookings" actionLink="/bookings" />
      }
    </div>
  `
})
export class JobCardFormComponent implements OnInit {
  readonly formatMoney = formatMoneyValue;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder);
  readonly bookings = signal<Booking[]>([]);
  readonly jobCards = signal<JobCard[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly failure = signal<ApiFailure | null>(null);

  readonly form = this.builder.nonNullable.group({
    bookingId: [0, [Validators.required, Validators.min(1)]],
    technicianId: [0],
    openedDate: [this.today(), [Validators.required]],
    promisedDate: [this.inDays(7), [Validators.required]],
    serviceTasks: this.builder.nonNullable.array([this.taskGroup()])
  });

  get tasks(): FormArray {
    return this.form.controls.serviceTasks;
  }

  ngOnInit(): void {
    forkJoin({
      bookings: this.api.bookings({}),
      jobCards: this.api.jobCards({}),
      vehicles: this.api.vehicles({}),
      customers: this.api.customers(),
      technicians: this.api.technicians({})
    }).subscribe({
      next: (result) => {
        this.bookings.set(result.bookings);
        this.jobCards.set(result.jobCards);
        this.vehicles.set(result.vehicles);
        this.customers.set(result.customers);
        this.technicians.set(result.technicians);
        const requested = Number(this.route.snapshot.queryParamMap.get('bookingId') ?? 0);
        if (requested) {
          this.form.patchValue({ bookingId: requested });
        }
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  eligibleBookings(): Booking[] {
    return this.bookings().filter((booking) =>
      booking.bookingStatus === 'CONFIRMED' && !this.jobCards().some((card) => card.bookingId === booking.id));
  }

  availableTechnicians(): Technician[] {
    return this.technicians().filter((technician) => technician.availabilityStatus === 'AVAILABLE');
  }

  selectedBooking(): Booking | undefined {
    return this.bookings().find((booking) => booking.id === this.form.controls.bookingId.value);
  }

  ownerName(): string {
    const booking = this.selectedBooking();
    const vehicle = this.vehicles().find((item) => item.id === booking?.vehicleId);
    return this.customers().find((item) => item.id === vehicle?.customerId)?.fullName ?? 'Not set';
  }

  estimate(): number {
    return this.tasks.controls.reduce((total, control) => {
      const value = control.getRawValue() as { estimatedHours: number; hourlyRate: number };
      return total + Number(value.estimatedHours || 0) * Number(value.hourlyRate || 0);
    }, 0);
  }

  addTask(): void {
    this.tasks.push(this.taskGroup());
  }

  removeTask(index: number): void {
    if (this.tasks.controls.length > 1) {
      this.tasks.removeAt(index);
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
    return control.hasError('required') ? 'This field is required.' : 'Check this value.';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      bookingId: value.bookingId,
      technicianId: value.technicianId || null,
      openedDate: value.openedDate,
      promisedDate: value.promisedDate,
      serviceTasks: value.serviceTasks.map((task) => ({ ...task, amount: 0 }))
    };
    this.submitting.set(true);
    this.error.set('');
    this.failure.set(null);
    this.api.createJobCard(body).subscribe({
      next: (card) => this.router.navigate(['/job-cards', card.id]),
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }

  private taskGroup() {
    return this.builder.nonNullable.group({
      taskName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      estimatedHours: [0, [Validators.required, Validators.min(0)]],
      hourlyRate: [0, [Validators.required, Validators.min(0)]]
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
}
