import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { JobCard } from '../../core/models';
import { DataTableComponent, ErrorMessageComponent, PageHeaderComponent, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, DataTableComponent, ErrorMessageComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header title="Completed jobs" description="Completed and delivered workshop jobs">
        <a actions class="btn btn-secondary" routerLink="/job-cards">All job cards</a>
      </app-page-header>

      <div class="toolbar">
        <div class="filter">
          <label for="report-from">Opened from</label>
          <input id="report-from" class="input" type="date" (change)="onFromDate($event)">
        </div>
        <div class="filter">
          <label for="report-to">Opened to</label>
          <input id="report-to" class="input" type="date" (change)="onToDate($event)">
        </div>
        <div class="filter">
          <label for="report-status">Status</label>
          <select id="report-status" class="input" (change)="onStatus($event)">
            <option value="">All completed</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-secondary" type="button" (click)="clearFilters()">Clear filters</button>
        </div>
      </div>

      @if (error()) {
        <app-error-message [message]="error()" [canRetry]="true" (retry)="load()" />
      }

      <app-data-table
        [columns]="columns"
        [rows]="rows()"
        [loading]="loading()"
        emptyMessage="No completed jobs in this date range"
        emptyDetail="Adjust the dates or complete a job card to see it here."
      />
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly all = signal<JobCard[]>([]);
  readonly rows = signal<JobCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly status = signal('');

  readonly columns: TableColumn[] = [
    { key: 'jobCardNumber', label: 'Job card', type: 'link', linkKey: 'id', linkPrefix: '/job-cards' },
    { key: 'bookingNumber', label: 'Booking' },
    { key: 'openedDate', label: 'Opened', type: 'date' },
    { key: 'promisedDate', label: 'Promised', type: 'date' },
    { key: 'technicianName', label: 'Technician' },
    { key: 'jobStatus', label: 'Status', type: 'badge' },
    { key: 'labourEstimate', label: 'Estimate', type: 'money' }
  ];

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.fromDate.set(query.get('from') ?? '');
    this.toDate.set(query.get('to') ?? '');
    this.status.set(query.get('status') ?? '');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.completedReport().subscribe({
      next: (cards) => {
        this.all.set(cards);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  onFromDate(event: Event): void {
    this.fromDate.set((event.target as HTMLInputElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onToDate(event: Event): void {
    this.toDate.set((event.target as HTMLInputElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.syncQuery();
    this.applyFilters();
  }

  clearFilters(): void {
    this.fromDate.set('');
    this.toDate.set('');
    this.status.set('');
    this.syncQuery();
    this.applyFilters();
  }

  private syncQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: this.fromDate() || null,
        to: this.toDate() || null,
        status: this.status() || null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private applyFilters(): void {
    const from = this.fromDate();
    const to = this.toDate();
    const status = this.status();
    this.rows.set(this.all().filter((card) =>
      (!from || card.openedDate >= from) &&
      (!to || card.openedDate <= to) &&
      (!status || card.jobStatus === status)
    ));
  }
}
