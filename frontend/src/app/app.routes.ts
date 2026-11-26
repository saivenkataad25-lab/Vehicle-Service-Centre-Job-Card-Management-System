import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'customers', loadComponent: () => import('./features/customers/customer-list.component').then((m) => m.CustomerListComponent) },
  { path: 'customers/new', loadComponent: () => import('./features/customers/customer-form.component').then((m) => m.CustomerFormComponent) },
  { path: 'customers/:id/edit', loadComponent: () => import('./features/customers/customer-form.component').then((m) => m.CustomerFormComponent) },
  { path: 'customers/:id', loadComponent: () => import('./features/customers/customer-detail.component').then((m) => m.CustomerDetailComponent) },
  { path: 'vehicles', loadComponent: () => import('./features/vehicles/vehicle-list.component').then((m) => m.VehicleListComponent) },
  { path: 'vehicles/new', loadComponent: () => import('./features/vehicles/vehicle-form.component').then((m) => m.VehicleFormComponent) },
  { path: 'vehicles/:id/edit', loadComponent: () => import('./features/vehicles/vehicle-form.component').then((m) => m.VehicleFormComponent) },
  { path: 'vehicles/:id', loadComponent: () => import('./features/vehicles/vehicle-detail.component').then((m) => m.VehicleDetailComponent) },
  { path: 'bookings', loadComponent: () => import('./features/bookings/booking-list.component').then((m) => m.BookingListComponent) },
  { path: 'bookings/new', loadComponent: () => import('./features/bookings/booking-form.component').then((m) => m.BookingFormComponent) },
  { path: 'bookings/:id/edit', loadComponent: () => import('./features/bookings/booking-form.component').then((m) => m.BookingFormComponent) },
  { path: 'bookings/:id', loadComponent: () => import('./features/bookings/booking-detail.component').then((m) => m.BookingDetailComponent) },
  { path: 'job-cards', loadComponent: () => import('./features/job-cards/job-card-list.component').then((m) => m.JobCardListComponent) },
  { path: 'job-cards/new', loadComponent: () => import('./features/job-cards/job-card-form.component').then((m) => m.JobCardFormComponent) },
  { path: 'job-cards/:id', loadComponent: () => import('./features/job-cards/job-card-detail.component').then((m) => m.JobCardDetailComponent) },
  { path: 'technicians', loadComponent: () => import('./features/technicians/technician-list.component').then((m) => m.TechnicianListComponent) },
  { path: 'technicians/new', loadComponent: () => import('./features/technicians/technician-form.component').then((m) => m.TechnicianFormComponent) },
  { path: 'technicians/:id/edit', loadComponent: () => import('./features/technicians/technician-form.component').then((m) => m.TechnicianFormComponent) },
  { path: 'technicians/:id', loadComponent: () => import('./features/technicians/technician-detail.component').then((m) => m.TechnicianDetailComponent) },
  { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
