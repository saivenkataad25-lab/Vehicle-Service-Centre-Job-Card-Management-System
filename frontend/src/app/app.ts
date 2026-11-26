import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GlobalSearchComponent } from './core/layout/global-search.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './app.html'
})
export class App {
  readonly menuOpen = signal(false);
  readonly navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/customers', label: 'Customers' },
    { path: '/vehicles', label: 'Vehicles' },
    { path: '/bookings', label: 'Bookings' },
    { path: '/job-cards', label: 'Job cards' },
    { path: '/technicians', label: 'Technicians' },
    { path: '/reports', label: 'Reports' }
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
