import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Technician } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-technician-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, RowActionsDirective],
  template: `
    <div class="page">
      <app-page-header title="Technicians" description="Skills and availability for job assignments">
        <a actions class="btn btn-primary" routerLink="/technicians/new">Add technician</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="technician-search">Search technicians</label>
          <input id="technician-search" class="input" type="search" placeholder="Name, code or skill" (input)="onSearch($event)">
        </div>
        <div class="filter">
          <label for="technician-availability">Availability</label>
          <select id="technician-availability" class="input" (change)="onAvailability($event)">
            <option value="">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
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
        emptyMessage="No technicians found"
        emptyDetail="Add a technician before assigning work."
        emptyActionLabel="Add technician"
        emptyActionLink="/technicians/new"
      >
        <ng-template appRowActions let-row>
          <a class="btn btn-text" [routerLink]="['/technicians', $any(row).id]">View</a>
          <a class="btn btn-text" [routerLink]="['/technicians', $any(row).id, 'edit']">Edit</a>
          <button class="btn btn-text" type="button" (click)="requestDelete($any(row))">Delete</button>
        </ng-template>
      </app-data-table>

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class TechnicianListComponent implements OnInit {
  private readonly api = inject(ApiService);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly rows = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  private readonly search = signal('');
  private readonly availability = signal('');
  private pendingDelete: number | null = null;

  readonly columns: TableColumn[] = [
    { key: 'technicianCode', label: 'Technician code', type: 'link', linkKey: 'id', linkPrefix: '/technicians' },
    { key: 'fullName', label: 'Full name' },
    { key: 'skillArea', label: 'Skill area' },
    { key: 'phone', label: 'Phone' },
    { key: 'availabilityStatus', label: 'Availability', type: 'badge' }
  ];

  ngOnInit(): void {
    this.load();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.load();
  }

  onAvailability(event: Event): void {
    this.availability.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.technicians({ search: this.search(), availabilityStatus: this.availability() }).subscribe({
      next: (technicians) => {
        this.rows.set(technicians);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(technician: Technician): void {
    this.pendingDelete = technician.id;
    this.dialog?.open('Delete this technician?', `${technician.fullName} will be removed if no job cards are assigned.`, 'Delete technician');
  }

  confirmDelete(): void {
    if (this.pendingDelete === null) {
      return;
    }
    this.api.deleteTechnician(this.pendingDelete).subscribe({
      next: () => {
        this.pendingDelete = null;
        this.success.set('Technician deleted.');
        this.load();
      },
      error: (failure: unknown) => {
        this.pendingDelete = null;
        this.error.set(this.api.fail(failure).message);
      }
    });
  }
}
