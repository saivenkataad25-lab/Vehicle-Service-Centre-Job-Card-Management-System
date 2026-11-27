import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiFailure, Booking, Customer, JobCard, Technician, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent, StatusBadgeComponent, formatDate as formatDateValue, formatDateTime as formatDateTimeValue, formatMoney as formatMoneyValue } from '../../shared/ui';
import { dateOrderValidator } from '../../shared/validators';

interface StatusAction {
  status: string;
  label: string;
}

@Component({
  selector: 'app-job-card-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialogComponent, ErrorMessageComponent, FormFieldComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/job-cards">Job cards</a> / {{ jobCard()?.jobCardNumber ?? 'Details' }}</p>
      <app-page-header [title]="jobCard()?.jobCardNumber ?? 'Job card details'" description="Service tasks, assignment and controlled status changes">
        <span actions class="page-actions">
          <a class="btn btn-secondary" routerLink="/job-cards">Back</a>
          @if (jobCard(); as current) {
            @if (!isTerminal(current.jobStatus)) {
              <button class="btn btn-danger" type="button" (click)="requestDelete(current)">Delete</button>
            }
          }
        </span>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" />
      }
      @if (success()) {
        <p class="success-banner" role="status">{{ success() }}</p>
      }

      @if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else if (jobCard(); as card) {
        <form class="stack" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="split">
            <section class="card">
              <h2>Job summary</h2>
              <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Booking</span><a [routerLink]="['/bookings', card.bookingId]">{{ card.bookingNumber }}</a></div>
                <div class="detail-item"><span class="detail-label">Vehicle</span><span>{{ registrationNumber() }}</span></div>
                <div class="detail-item"><span class="detail-label">Customer</span><span>{{ ownerName() }}</span></div>
                <div class="detail-item"><span class="detail-label">Odometer</span><span class="num">{{ odometer() }}</span></div>
              </div>

              <div class="section-heading"><h2>Assignment and dates</h2></div>
              <div class="form-grid">
                <app-form-field label="Technician" id="detail-technician" [error]="errorFor('technicianId')">
                  <select id="detail-technician" class="input" formControlName="technicianId" [attr.aria-describedby]="'detail-technician-help'" [attr.aria-invalid]="isInvalid('technicianId')">
                    <option [ngValue]="0">Unassigned</option>
                    @for (technician of availableTechnicians(); track technician.id) {
                      <option [ngValue]="technician.id">{{ technician.fullName }} ({{ technician.availabilityStatus }})</option>
                    }
                  </select>
                </app-form-field>
                <app-form-field label="Opened date" id="detail-opened" [required]="true" [error]="errorFor('openedDate')">
                  <input id="detail-opened" class="input" type="date" formControlName="openedDate" [attr.aria-describedby]="'detail-opened-help'" [attr.aria-invalid]="isInvalid('openedDate')">
                </app-form-field>
                <app-form-field label="Promised date" id="detail-promised" [required]="true" [error]="errorFor('promisedDate')">
                  <input id="detail-promised" class="input" type="date" formControlName="promisedDate" [attr.aria-describedby]="'detail-promised-help'" [attr.aria-invalid]="isInvalid('promisedDate')">
                </app-form-field>
              </div>

              <div class="section-heading">
                <h2>Service tasks</h2>
                <button class="btn btn-secondary" type="button" (click)="addTask()">Add task</button>
              </div>
              <div formArrayName="serviceTasks" class="stack">
                @for (task of tasks.controls; let i = $index; track i) {
                  <div [formGroupName]="i" class="task-row">
                    <app-form-field [label]="'Task ' + (i + 1) + ' name'" [id]="'detail-task-name-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.taskName')">
                      <input [id]="'detail-task-name-' + i" class="input" formControlName="taskName">
                    </app-form-field>
                    <app-form-field label="Description" [id]="'detail-task-description-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.description')">
                      <input [id]="'detail-task-description-' + i" class="input" formControlName="description">
                    </app-form-field>
                    <app-form-field label="Hours" [id]="'detail-task-hours-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.estimatedHours')">
                      <input [id]="'detail-task-hours-' + i" class="input" type="number" step="0.25" formControlName="estimatedHours">
                    </app-form-field>
                    <app-form-field label="Rate" [id]="'detail-task-rate-' + i" [required]="true" [error]="errorFor('serviceTasks.' + i + '.hourlyRate')">
                      <input [id]="'detail-task-rate-' + i" class="input" type="number" step="0.01" formControlName="hourlyRate">
                    </app-form-field>
                    @if (tasks.controls.length > 1) {
                      <button class="btn btn-text" type="button" (click)="removeTask(i)">Remove task</button>
                    }
                  </div>
                }
              </div>

              <div class="detail-item">
                <span class="detail-label">Recalculated labour estimate</span>
                <span class="num">{{ formatMoney(estimate()) }}</span>
              </div>

              <app-form-field label="Completion notes" id="detail-notes" [error]="errorFor('completionNotes')">
                <textarea id="detail-notes" class="input" formControlName="completionNotes" [attr.aria-describedby]="'detail-notes-help'" [attr.aria-invalid]="isInvalid('completionNotes')"></textarea>
              </app-form-field>
            </section>

            <section class="card">
              <h2>Status</h2>
              <app-status-badge [status]="card.jobStatus" />
              <div class="detail-item"><span class="detail-label">Saved labour estimate</span><span class="num">{{ formatMoney(card.labourEstimate) }}</span></div>
              <div class="detail-item"><span class="detail-label">Assigned technician</span><span>{{ card.technicianName ?? 'Unassigned' }}</span></div>
              <div class="detail-item"><span class="detail-label">Promised date</span><span>{{ formatDate(card.promisedDate) }}</span></div>

              <div class="section-heading"><h2>Change status</h2></div>
              <div class="stack">
                @for (action of transitions(); track action.status) {
                  <button class="btn btn-secondary" type="button" (click)="transition(action.status)">{{ action.label }}</button>
                }
                @if (!transitions().length) {
                  <p class="muted">No further status changes are available.</p>
                }
              </div>

              <div class="section-heading"><h2>Status history</h2></div>
              <div class="history-list">
                @for (entry of card.statusHistory; track entry.changedAt) {
                  <div class="history-item">
                    <app-status-badge [status]="entry.toStatus" />
                    <p>{{ entry.note }}</p>
                    <span class="history-time">{{ formatDateTime(entry.changedAt) }}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">Save changes</button>
          </div>
        </form>
      }

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class JobCardDetailComponent implements OnInit {
  readonly formatDate = formatDateValue;
  readonly formatDateTime = formatDateTimeValue;
  readonly formatMoney = formatMoneyValue;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly builder = inject(FormBuilder);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly jobCard = signal<JobCard | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly vehicle = signal<Vehicle | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly technicians = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly failure = signal<ApiFailure | null>(null);
  private id = 0;

  readonly form = this.builder.nonNullable.group({
    technicianId: [0],
    openedDate: ['', [Validators.required]],
    promisedDate: ['', [Validators.required]],
    jobStatus: ['OPEN', [Validators.required]],
    completionNotes: [''],
    serviceTasks: this.builder.nonNullable.array([this.taskGroup()])
  }, { validators: [dateOrderValidator] });

  get tasks(): FormArray {
    return this.form.controls.serviceTasks;
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      card: this.api.jobCard(this.id),
      bookings: this.api.bookings({}),
      vehicles: this.api.vehicles({}),
      customers: this.api.customers(),
      technicians: this.api.technicians({})
    }).subscribe({
      next: (result) => {
        this.jobCard.set(result.card);
        this.booking.set(result.bookings.find((item) => item.id === result.card.bookingId) ?? null);
        this.vehicle.set(result.vehicles.find((item) => item.id === this.booking()?.vehicleId) ?? null);
        this.customer.set(result.customers.find((item) => item.id === this.vehicle()?.customerId) ?? null);
        this.technicians.set(result.technicians);
        this.form.patchValue({
          technicianId: result.card.technicianId ?? 0,
          openedDate: result.card.openedDate,
          promisedDate: result.card.promisedDate,
          jobStatus: result.card.jobStatus,
          completionNotes: result.card.completionNotes ?? ''
        });
        this.rebuildTasks(result.card);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  registrationNumber(): string {
    return this.vehicle()?.registrationNumber ?? 'Not set';
  }

  ownerName(): string {
    return this.customer()?.fullName ?? 'Not set';
  }

  odometer(): number | string {
    return this.vehicle()?.odometerReading ?? 'Not set';
  }

  availableTechnicians(): Technician[] {
    const currentId = this.jobCard()?.technicianId;
    return this.technicians().filter((technician) =>
      technician.availabilityStatus === 'AVAILABLE' || technician.id === currentId);
  }

  transitions(): StatusAction[] {
    const status = this.form.controls.jobStatus.value;
    if (status === 'OPEN') {
      return [
        { status: 'IN_PROGRESS', label: 'Start work' },
        { status: 'ON_HOLD', label: 'Put on hold' }
      ];
    }
    if (status === 'IN_PROGRESS') {
      return [
        { status: 'COMPLETED', label: 'Complete work' },
        { status: 'ON_HOLD', label: 'Put on hold' }
      ];
    }
    if (status === 'ON_HOLD') {
      return [{ status: 'IN_PROGRESS', label: 'Resume work' }];
    }
    if (status === 'COMPLETED') {
      return [{ status: 'DELIVERED', label: 'Mark delivered' }];
    }
    return [];
  }

  isTerminal(status: string): boolean {
    return status === 'COMPLETED' || status === 'DELIVERED';
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

  transition(status: string): void {
    this.save(status);
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
    if (name === 'promisedDate' && this.form.hasError('dateOrder')) {
      return 'Promised date cannot be earlier than opened date.';
    }
    const control = this.form.get(name);
    if (!control || !control.touched || !control.invalid) {
      return '';
    }
    return control.hasError('required') ? 'This field is required.' : 'Check this value.';
  }

  save(nextStatus?: string): void {
    this.success.set('');
    const value = this.form.getRawValue();
    const status = nextStatus ?? value.jobStatus;
    if (status === 'COMPLETED' && !value.completionNotes.trim()) {
      this.error.set('Completion notes are required before work can be marked completed.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.failure.set(null);
    const body = {
      technicianId: value.technicianId || null,
      openedDate: value.openedDate,
      promisedDate: value.promisedDate,
      jobStatus: status,
      completionNotes: value.completionNotes.trim() ? value.completionNotes : null,
      serviceTasks: value.serviceTasks.map((task) => ({ ...task, amount: 0 }))
    };
    this.api.updateJobCard(this.id, body).subscribe({
      next: (card) => {
        this.jobCard.set(card);
        this.form.controls.jobStatus.setValue(card.jobStatus);
        this.submitting.set(false);
        this.success.set('Job card saved.');
      },
      error: (failure: unknown) => {
        const parsed = this.api.fail(failure);
        this.failure.set(parsed);
        this.error.set(parsed.message);
        this.submitting.set(false);
      }
    });
  }

  requestDelete(card: JobCard): void {
    this.dialog?.open('Delete this job card?', `${card.jobCardNumber} will be removed and the booking restored.`, 'Delete job card');
  }

  confirmDelete(): void {
    this.api.deleteJobCard(this.id).subscribe({
      next: () => this.router.navigate(['/job-cards']),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }

  private rebuildTasks(card: JobCard): void {
    this.tasks.clear();
    if (card.serviceTasks.length === 0) {
      this.tasks.push(this.taskGroup());
      return;
    }
    card.serviceTasks.forEach((task) => {
      this.tasks.push(this.builder.nonNullable.group({
        taskName: [task.taskName, [Validators.required, Validators.maxLength(100)]],
        description: [task.description, [Validators.required, Validators.maxLength(500)]],
        estimatedHours: [task.estimatedHours, [Validators.required, Validators.min(0)]],
        hourlyRate: [task.hourlyRate, [Validators.required, Validators.min(0)]]
      }));
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
}
