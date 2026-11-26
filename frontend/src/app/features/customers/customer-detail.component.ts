import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Customer, Vehicle } from '../../core/models';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, TableColumn } from '../../shared/ui';


@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/customers">Customers</a> / {{ customer()?.customerCode ?? 'Details' }}</p>
      <app-page-header [title]="customer()?.fullName ?? 'Customer details'" description="Contact information and registered vehicles">
        <span actions class="page-actions">
          <a class="btn btn-secondary" routerLink="/customers">Back</a>
          @if (customer(); as current) {
            <a class="btn btn-secondary" [routerLink]="['/customers', current.id, 'edit']">Edit</a>
            <a class="btn btn-primary" [routerLink]="['/vehicles/new']" [queryParams]="{ customerId: current.id }">Add vehicle</a>
            <button class="btn btn-danger" type="button" (click)="requestDelete(current)">Delete</button>
          }
        </span>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" />
      } @else if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else if (customer(); as current) {
        <section class="card">
          <h2>Contact details</h2>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Customer code</span><span>{{ current.customerCode }}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span>{{ current.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span>{{ current.email }}</span></div>
            <div class="detail-item"><span class="detail-label">Address</span><span>{{ current.address }}</span></div>
          </div>
        </section>

        <section class="card">
          <div class="section-heading">
            <h2>Registered vehicles</h2>
            <a class="btn btn-text" [routerLink]="['/vehicles/new']" [queryParams]="{ customerId: current.id }">Add vehicle</a>
          </div>
          <app-data-table [columns]="columns" [rows]="vehicles()" emptyMessage="No vehicles registered" emptyDetail="Add a vehicle for this customer." />
        </section>
      }

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class CustomerDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly customer = signal<Customer | null>(null);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private id = 0;

  readonly columns: TableColumn[] = [
    { key: 'registrationNumber', label: 'Registration', type: 'link', linkKey: 'id', linkPrefix: '/vehicles' },
    { key: 'make', label: 'Make' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'odometerReading', label: 'Odometer', type: 'number' }
  ];

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ customer: this.api.customer(this.id), vehicles: this.api.vehicles({ customerId: this.id }) }).subscribe({
      next: (result) => {
        this.customer.set(result.customer);
        this.vehicles.set(result.vehicles);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(customer: Customer): void {
    this.dialog?.open('Delete this customer?', `${customer.fullName} will be removed if no vehicles are linked.`, 'Delete customer');
  }

  confirmDelete(): void {
    this.api.deleteCustomer(this.id).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }
}
