import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Vehicle } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective],
  template: `
    <div class="page">
      <app-page-header title="Vehicles" description="Registered vehicles and their owners">
        <a actions class="btn btn-primary" routerLink="/vehicles/new">Add vehicle</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="vehicle-search">Search vehicles</label>
          <input id="vehicle-search" class="input" type="search" placeholder="Registration, make, model or owner" (input)="onSearch($event)">
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
        emptyMessage="No vehicles found"
        emptyDetail="Register a vehicle after adding its owner."
        emptyActionLabel="Add vehicle"
        emptyActionLink="/vehicles/new"
      >
        <ng-template appRowActions let-row>
          <a class="btn btn-text" [routerLink]="['/vehicles', $any(row).id]">View</a>
          <a class="btn btn-text" [routerLink]="['/vehicles', $any(row).id, 'edit']">Edit</a>
          <button class="btn btn-text" type="button" (click)="requestDelete($any(row))">Delete</button>
        </ng-template>
      </app-data-table>

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class VehicleListComponent implements OnInit {
  private readonly api = inject(ApiService);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  private readonly search = signal('');
  private pendingDelete: number | null = null;

  readonly columns: TableColumn[] = [
    { key: 'registrationNumber', label: 'Registration', type: 'link', linkKey: 'id', linkPrefix: '/vehicles' },
    { key: 'makeModel', label: 'Make / model' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'fuelType', label: 'Fuel' },
    { key: 'customerName', label: 'Customer' },
    { key: 'odometerReading', label: 'Odometer', type: 'number' }
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
    this.api.vehicles({ search: this.search() }).subscribe({
      next: (vehicles) => {
        this.rows.set(vehicles.map((vehicle) => ({ ...vehicle, makeModel: `${vehicle.make} ${vehicle.model}` })));
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(vehicle: Vehicle): void {
    this.pendingDelete = vehicle.id;
    this.dialog?.open('Delete this vehicle?', `${vehicle.registrationNumber} will be removed if no bookings are linked.`, 'Delete vehicle');
  }

  confirmDelete(): void {
    if (this.pendingDelete === null) {
      return;
    }
    this.api.deleteVehicle(this.pendingDelete).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.success.set('Vehicle deleted.');
        this.load();
      },
      error: (failure: unknown) => {
        this.pendingDelete = null;
        this.error.set(this.api.fail(failure).message);
      }
    });
  }
}
