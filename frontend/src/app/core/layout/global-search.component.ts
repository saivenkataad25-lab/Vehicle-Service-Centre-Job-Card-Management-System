import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, Subject, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { Booking, Customer, JobCard, Vehicle } from '../models';

interface SearchItem {
  kind: string;
  label: string;
  meta: string;
  path: string;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="global-search">
      <input
        class="search-input"
        type="search"
        placeholder="Search records"
        aria-label="Search customers, vehicles and job cards"
        [attr.aria-expanded]="open()"
        (input)="onInput($event)"
        (focus)="open.set(true)"
        (keydown.escape)="onEscape()"
      >
      @if (open()) {
        <div class="search-results" role="listbox">
          @if (loading()) {
            <p class="search-empty">Searching records</p>
          } @else if (!results().length) {
            <p class="search-empty">Type at least two characters to search.</p>
          } @else {
            @for (item of results(); track item.path) {
              <a class="search-result" role="option" [routerLink]="item.path" (click)="select()">
                <span>{{ item.kind }}</span>
                <strong>{{ item.label }}</strong>
                <span>{{ item.meta }}</span>
              </a>
            }
          }
        </div>
      }
    </div>
  `
})
export class GlobalSearchComponent {
  private readonly api = inject(ApiService);
  private readonly term$ = new Subject<string>();
  readonly results = signal<SearchItem[]>([]);
  readonly loading = signal(false);
  readonly open = signal(false);

  constructor() {
    this.term$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((term) => {
        const query = term.trim();
        if (query.length < 2) {
          this.loading.set(false);
          return of([] as SearchItem[]);
        }
        this.loading.set(true);
        return forkJoin({
          customers: this.api.customers(query).pipe(catchError(() => of([] as Customer[]))),
          vehicles: this.api.vehicles({ search: query }).pipe(catchError(() => of([] as Vehicle[]))),
          bookings: this.api.bookings({}).pipe(catchError(() => of([] as Booking[]))),
          jobCards: this.api.jobCards({}).pipe(catchError(() => of([] as JobCard[])))
        }).pipe(
          map(({ customers, vehicles, bookings, jobCards }) => this.buildItems(query, customers, vehicles, bookings, jobCards)),
          finalize(() => this.loading.set(false))
        );
      })
    ).subscribe((items) => this.results.set(items));
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.open.set(true);
    this.term$.next(value);
  }

  onEscape(): void {
    this.open.set(false);
    this.results.set([]);
  }

  select(): void {
    this.open.set(false);
    this.results.set([]);
  }

  private buildItems(query: string, customers: Customer[], vehicles: Vehicle[], bookings: Booking[], jobCards: JobCard[]): SearchItem[] {
    const needle = query.toLowerCase();
    const customerItems: SearchItem[] = customers.slice(0, 3).map((customer) => ({
      kind: 'Customer',
      label: customer.fullName,
      meta: customer.customerCode,
      path: `/customers/${customer.id}`
    }));
    const vehicleItems: SearchItem[] = vehicles.slice(0, 3).map((vehicle) => ({
      kind: 'Vehicle',
      label: vehicle.registrationNumber,
      meta: `${vehicle.make} ${vehicle.model}`,
      path: `/vehicles/${vehicle.id}`
    }));
    const bookingItems: SearchItem[] = bookings
      .filter((booking) => booking.bookingNumber.toLowerCase().includes(needle) || booking.registrationNumber.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((booking) => ({
        kind: 'Booking',
        label: booking.bookingNumber,
        meta: booking.registrationNumber,
        path: `/bookings/${booking.id}`
      }));
    const jobItems: SearchItem[] = jobCards
      .filter((card) => card.jobCardNumber.toLowerCase().includes(needle) || card.bookingNumber.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((card) => ({
        kind: 'Job card',
        label: card.jobCardNumber,
        meta: card.bookingNumber,
        path: `/job-cards/${card.id}`
      }));
    return [...customerItems, ...vehicleItems, ...bookingItems, ...jobItems];
  }
}
