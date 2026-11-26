import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Booking, Customer, JobCard, Technician, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-job-card-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective],
  template: `
    <div class="page">
      <app-page-header title="Job cards" description="Workshop queue, assignments and promised dates">
        <a actions class="btn btn-primary" routerLink="/bookings">Convert a booking</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="job-status">Job status</label>
          <select id="job-status" class="input" (change)="onStatus($event)">
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="ON_HOLD">On hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
        <div class="filter">
          <label for="job-technician">Technician</label>
          <select id="job-technician" class="input" (change)="onTechnician($event)">
            <option value="0">All technicians</option>
            @for (technician of technicians(); track technician.id) {
              <option [value]="technician.id">{{ technician.fullName }}</option>
            }
          </select>
        </div>
        <div class="filter">
          <label for="job-date">Promised date</label>
          <input id="job-date" class="input" type="date" (change)="onDate($event)">
        </div>
        <div class="filter">
          <label for="job-overdue">Overdue</label>
          <select id="job-overdue" class="input" (change)="onOverdue($event)">
            <option value="">All jobs</option>
            <option value="true">Overdue only</option>
          </select>
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
        emptyMessage="No job cards found"
        emptyDetail="Adjust the filters or convert an eligible booking."
        emptyActionLabel="View bookings"
        emptyActionLink="/bookings"
      >
        <ng-template appRowActions let-row>
          <a class="btn btn-text" [routerLink]="['/job-cards', $any(row).id]">View</a>
          @if ($any(row).jobStatus !== 'COMPLETED' && $any(row).jobStatus !== 'DELIVERED') {
            <button class="btn btn-text" type="button" (click)="requestDelete($any(row))">Delete</button>
          } @else {
            <span class="muted">Protected record</span>
          }
        </ng-template>
      </app-data-table>

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class JobCardListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly allRows = signal<Record<string, unknown>[]>([]);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  readonly status = signal('');
  readonly technicianId = signal(0);
  readonly promisedDate = signal('');
  readonly overdue = signal(false);
  private pendingDelete: number | null = null;

  readonly columns: TableColumn[] = [
    { key: 'jobCardNumber', label: 'Job card no.', type: 'link', linkKey: 'id', linkPrefix: '/job-cards' },
    { key: 'registrationNumber', label: 'Vehicle' },
    { key: 'customerName', label: 'Customer' },
    { key: 'technicianName', label: 'Technician' },
    { key: 'openedDate', label: 'Opened date', type: 'date' },
    { key: 'promisedDate', label: 'Promised date', type: 'promisedDate' },
    { key: 'labourEstimate', label: 'Labour estimate', type: 'money' },
    { key: 'jobStatus', label: 'Status', type: 'badge' }
  ];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.status.set(params.get('status') ?? '');
    this.technicianId.set(Number(params.get('technicianId') ?? 0));
    this.promisedDate.set(params.get('promisedDate') ?? '');
    this.overdue.set(params.get('overdue') === 'true');
    this.load();
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onTechnician(event: Event): void {
    this.technicianId.set(Number((event.target as HTMLSelectElement).value));
    this.syncQuery();
    this.applyFilters();
  }

  onDate(event: Event): void {
    this.promisedDate.set((event.target as HTMLInputElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onOverdue(event: Event): void {
    this.overdue.set((event.target as HTMLSelectElement).value === 'true');
    this.syncQuery();
    this.applyFilters();
  }

  clearFilters(): void {
    this.status.set('');
    this.technicianId.set(0);
    this.promisedDate.set('');
    this.overdue.set(false);
    this.syncQuery();
    this.applyFilters();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      jobCards: this.api.jobCards({}),
      bookings: this.api.bookings({}),
      vehicles: this.api.vehicles({}),
      customers: this.api.customers(),
      technicians: this.api.technicians({})
    }).subscribe({
      next: (result) => {
        this.technicians.set(result.technicians);
        this.allRows.set(result.jobCards.map((card) => {
          const booking = result.bookings.find((item) => item.id === card.bookingId);
          const vehicle = result.vehicles.find((item) => item.id === booking?.vehicleId);
          const customer = result.customers.find((item) => item.id === vehicle?.customerId);
          return {
            ...card,
            registrationNumber: vehicle?.registrationNumber ?? 'Not set',
            customerName: customer?.fullName ?? 'Not set'
          };
        }));
        this.applyFilters();
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(card: JobCard): void {
    this.pendingDelete = card.id;
    this.dialog?.open('Delete this job card?', `${card.jobCardNumber} will be removed and the booking restored.`, 'Delete job card');
  }

  confirmDelete(): void {
    if (this.pendingDelete === null) {
      return;
    }
    this.api.deleteJobCard(this.pendingDelete).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.success.set('Job card deleted.');
        this.load();
      },
      error: (failure: unknown) => {
        this.pendingDelete = null;
        this.error.set(this.api.fail(failure).message);
      }
    });
  }

  private applyFilters(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.rows.set(this.allRows().filter((row) => {
      const status = String(row['jobStatus'] ?? '');
      const technician = String(row['technicianId'] ?? '');
      const promised = String(row['promisedDate'] ?? '');
      const isOverdue = promised < today && status !== 'COMPLETED' && status !== 'DELIVERED';
      return (!this.status() || status === this.status())
        && (!this.technicianId() || technician === String(this.technicianId()))
        && (!this.promisedDate() || promised === this.promisedDate())
        && (!this.overdue() || isOverdue);
    }));
  }

  private syncQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.status() || null,
        technicianId: this.technicianId() || null,
        promisedDate: this.promisedDate() || null,
        overdue: this.overdue() ? 'true' : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
