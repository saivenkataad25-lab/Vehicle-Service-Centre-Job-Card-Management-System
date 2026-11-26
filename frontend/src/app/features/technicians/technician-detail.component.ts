import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { JobCard, Technician } from '../../core/models';
import { ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent, TableColumn } from '../../shared/ui';

@Component({
  selector: 'app-technician-detail',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, DataTableComponent, ErrorMessageComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <p class="breadcrumb"><a routerLink="/technicians">Technicians</a> / {{ technician()?.technicianCode ?? 'Details' }}</p>
      <app-page-header [title]="technician()?.fullName ?? 'Technician details'" description="Skills, contact details and assigned work">
        <span actions class="page-actions">
          <a class="btn btn-secondary" routerLink="/technicians">Back</a>
          @if (technician(); as current) {
            <a class="btn btn-secondary" [routerLink]="['/technicians', current.id, 'edit']">Edit</a>
            <button class="btn btn-danger" type="button" (click)="requestDelete(current)">Delete</button>
          }
        </span>
      </app-page-header>

      @if (error()) {
        <app-error-message [message]="error()" />
      } @else if (loading()) {
        <div class="card"><div class="skeleton-row"></div></div>
      } @else if (technician(); as current) {
        <section class="card">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Technician code</span><span>{{ current.technicianCode }}</span></div>
            <div class="detail-item"><span class="detail-label">Skill area</span><span>{{ current.skillArea }}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span>{{ current.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">Availability</span><span>{{ current.availabilityStatus }}</span></div>
          </div>
        </section>

        <section class="card">
          <div class="section-heading"><h2>Assigned job cards</h2></div>
          <app-data-table [columns]="columns" [rows]="jobCards()" emptyMessage="No assigned job cards" emptyDetail="Assign this technician when creating or updating a job card." />
        </section>
      }

      <app-confirm-dialog #dialog (confirmed)="confirmDelete()" />
    </div>
  `
})
export class TechnicianDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  @ViewChild('dialog') private dialog?: ConfirmDialogComponent;
  readonly technician = signal<Technician | null>(null);
  readonly jobCards = signal<JobCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private id = 0;

  readonly columns: TableColumn[] = [
    { key: 'jobCardNumber', label: 'Job card', type: 'link', linkKey: 'id', linkPrefix: '/job-cards' },
    { key: 'jobStatus', label: 'Status', type: 'badge' },
    { key: 'promisedDate', label: 'Promised date', type: 'promisedDate' },
    { key: 'labourEstimate', label: 'Estimate', type: 'money' }
  ];

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ technician: this.api.technician(this.id), jobCards: this.api.jobCards({ technicianId: this.id }) }).subscribe({
      next: (result) => {
        this.technician.set(result.technician);
        this.jobCards.set(result.jobCards);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.api.fail(failure).message);
        this.loading.set(false);
      }
    });
  }

  requestDelete(technician: Technician): void {
    this.dialog?.open('Delete this technician?', `${technician.fullName} will be removed if no job cards are assigned.`, 'Delete technician');
  }

  confirmDelete(): void {
    this.api.deleteTechnician(this.id).subscribe({
      next: () => this.router.navigate(['/technicians']),
      error: (failure: unknown) => this.error.set(this.api.fail(failure).message)
    });
  }
}
