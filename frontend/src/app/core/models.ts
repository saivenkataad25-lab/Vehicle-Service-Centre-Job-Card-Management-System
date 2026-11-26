export interface Customer {
  id: number;
  customerCode: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export interface Vehicle {
  id: number;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  customerId: number;
  customerName: string;
  odometerReading: number;
}

export interface Technician {
  id: number;
  technicianCode: string;
  fullName: string;
  skillArea: string;
  phone: string;
  availabilityStatus: string;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  vehicleId: number;
  registrationNumber: string;
  vehicleDescription: string;
  bookingDate: string;
  preferredDate: string;
  complaint: string;
  bookingStatus: string;
}

export interface ServiceTask {
  taskName: string;
  description: string;
  estimatedHours: number;
  hourlyRate: number;
  amount: number;
}

export interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  note: string;
}

export interface JobCard {
  id: number;
  jobCardNumber: string;
  bookingId: number;
  bookingNumber: string;
  technicianId: number | null;
  technicianName: string | null;
  openedDate: string;
  promisedDate: string;
  labourEstimate: number;
  jobStatus: string;
  completionNotes: string | null;
  serviceTasks: ServiceTask[];
  statusHistory: StatusHistoryEntry[];
}

export interface DashboardSummary {
  customers: number;
  vehicles: number;
  bookings: number;
  jobCards: number;
  overdueJobs: number;
  upcomingJobs: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface ApiFailure {
  message: string;
  fieldErrors: Record<string, string>;
  status: number;
}
