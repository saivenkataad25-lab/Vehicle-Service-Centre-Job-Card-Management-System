import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Customer, Vehicle } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective],
  template: `
    <div class="page">
      <app-page-header title="Customers" description="Contact records for vehicle owners">
        <a actions class="btn btn-primary" routerLink="/customers/new">Add customer</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="customer-search">Search customers</label>
          <input id="customer-search" class="input" type="search" placeholder="Name, phone or code" (input)="onSearch($event)">
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
        emptyMessage="No customers found"
        emptyDetail="Add a customer before registering vehicles."
        emptyActionLabel="Add customer"
        emptyActionLink="/customers/new"
      >
        <ng-template appRowActions let-row>
          <a class="btn btn-text" [routerLink]="['/customers', $any(row).id]">View</a>
          <a class="btn btn-text" [routerLink]="['/customers', $any(row).id, 'edit']">Edit</a>
          <button class="btn btn-text" type="button" (click)="requestDelete($any(row))">Delete</button>
        </ng-template>
      </app-data-table>

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  private readonly api = inject(ApiService);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  private readonly search = signal('');
  private pendingDelete: number | null = null;

  readonly columns: TableColumn[] = [
    { key: 'customerCode', label: 'Customer code', type: 'link', linkKey: 'id', linkPrefix: '/customers' },
    { key: 'fullName', label: 'Full name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'vehicleCount', label: 'Vehicles', type: 'number' }
  ];

  ngOnInit(): void {
    this.load();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ customers: this.api.customers(this.search()), vehicles: this.api.vehicles({}) }).subscribe({
      next: ({ customers, vehicles }) => {
        this.rows.set(customers.map((customer) => ({
          ...customer,
          vehicleCount: vehicles.filter((vehicle) => vehicle.customerId === customer.id).length
        })));
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(customer: Customer): void {
    this.pendingDelete = customer.id;
    this.dialog?.open('Delete this customer?', `${customer.fullName} will be removed if no vehicles are linked.`, 'Delete customer');
  }

  confirmDelete(): void {
    if (this.pendingDelete === null) {
      return;
    }
    this.api.deleteCustomer(this.pendingDelete).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.success.set('Customer deleted.');
        this.load();
      },
      error: (failure: unknown) => {
        this.pendingDelete = null;
        this.error.set(this.api.fail(failure).message);
      }
    });
  }
}
