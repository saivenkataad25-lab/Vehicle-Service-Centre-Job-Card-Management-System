# API Contract

Base path: `/api`

All dates are ISO date strings (`YYYY-MM-DD`). Timestamps in status history and the job card `completedAt` / `deliveredAt` fields are ISO local date-times (`YYYY-MM-DDTHH:mm:ss`). Monetary values are JSON numbers serialized from Java `BigDecimal`.

## Standard error response
```json
{
  "timestamp": "2026-11-26T10:15:30",
  "status": 409,
  "message": "Vehicle registration number already exists",
  "fieldErrors": {
    "registrationNumber": "must be unique"
  }
}
```

`fieldErrors` is empty when no field-specific error applies.

## Customers

### GET /api/customers
Query: `search` optional.

Response: array of `CustomerResponse`.

### GET /api/customers/{id}
Response: `CustomerResponse`.

### POST /api/customers
Request: `CustomerRequest`. Returns `201 Created` with `CustomerResponse`.

### PUT /api/customers/{id}
Request: `CustomerRequest`. Returns `200 OK` with `CustomerResponse`.

### DELETE /api/customers/{id}
Returns `204 No Content`. Returns `409 Conflict` when linked vehicles exist.

Validation: `phone` must be exactly 10 digits.

```json
CustomerRequest {
  "customerCode": "CUST-0004",
  "fullName": "Diana Njoroge",
  "phone": "0712345004",
  "email": "diana@example.com",
  "address": "9 Lake Road, Nairobi"
}

CustomerResponse {
  "id": 1,
  "customerCode": "CUST-0004",
  "fullName": "Diana Njoroge",
  "phone": "0712345004",
  "email": "diana@example.com",
  "address": "9 Lake Road, Nairobi"
}
```

## Vehicles

### GET /api/vehicles
Queries: `customerId`, `search` optional.

### GET /api/vehicles/{id}
Response: `VehicleResponse`.

### POST /api/vehicles
Request: `VehicleRequest`. Returns `201 Created`.

### PUT /api/vehicles/{id}
Request: `VehicleRequest`. Returns `200 OK`.

### DELETE /api/vehicles/{id}
Returns `204 No Content`. Returns `409 Conflict` when linked bookings exist.

```json
VehicleRequest {
  "registrationNumber": "KAF-111A",
  "make": "Toyota",
  "model": "Vitz",
  "year": 2022,
  "fuelType": "PETROL",
  "customerId": 1,
  "odometerReading": 12000
}

VehicleResponse {
  "id": 1,
  "registrationNumber": "KAF-111A",
  "make": "Toyota",
  "model": "Vitz",
  "year": 2022,
  "fuelType": "PETROL",
  "customerId": 1,
  "customerName": "Amina Yusuf",
  "odometerReading": 12000
}
```

## Technicians

### GET /api/technicians
Queries: `search`, `availabilityStatus` optional.

### GET /api/technicians/{id}
Response: `TechnicianResponse`.

### POST /api/technicians
Request: `TechnicianRequest`. Returns `201 Created`.

### PUT /api/technicians/{id}
Request: `TechnicianRequest`. Returns `200 OK`.

### DELETE /api/technicians/{id}
Returns `204 No Content`. Returns `409 Conflict` when assigned to any job card.

Validation: `phone` must be exactly 10 digits.

```json
TechnicianRequest {
  "technicianCode": "TECH-004",
  "fullName": "Peter Kamau",
  "skillArea": "Tyres and alignment",
  "phone": "0722001004",
  "availabilityStatus": "AVAILABLE"
}

TechnicianResponse {
  "id": 4,
  "technicianCode": "TECH-004",
  "fullName": "Peter Kamau",
  "skillArea": "Tyres and alignment",
  "phone": "0722001004",
  "availabilityStatus": "AVAILABLE"
}
```

## Service bookings

### GET /api/service-bookings
Queries: `vehicleId`, `status` optional.

### GET /api/service-bookings/{id}
Response: `BookingResponse`.

### POST /api/service-bookings
Request: `BookingRequest`. Returns `201 Created`.

Allowed initial statuses: `PENDING`, `CONFIRMED`.

### PUT /api/service-bookings/{id}
Request: `BookingRequest`. Returns `200 OK`.

Backend rules:
- `preferredDate` cannot be earlier than `bookingDate`.
- Status cannot be set directly to `CONVERTED`.
- A `CONVERTED` booking cannot be edited except by the job-card workflow.
- A `CANCELLED` booking cannot be changed to another status.

### DELETE /api/service-bookings/{id}
Returns `204 No Content`. Returns `409 Conflict` when a job card exists.

### POST /api/service-bookings/{id}/cancel
Returns `200 OK` with `BookingResponse`. Only `PENDING` or `CONFIRMED` bookings can be cancelled.

```json
BookingRequest {
  "bookingNumber": "BK-2026-0008",
  "vehicleId": 1,
  "bookingDate": "2026-11-26",
  "preferredDate": "2026-12-01",
  "complaint": "Routine service",
  "bookingStatus": "CONFIRMED"
}

BookingResponse {
  "id": 8,
  "bookingNumber": "BK-2026-0008",
  "vehicleId": 1,
  "registrationNumber": "KAA-123A",
  "vehicleDescription": "Toyota Corolla",
  "bookingDate": "2026-11-26",
  "preferredDate": "2026-12-01",
  "complaint": "Routine service",
  "bookingStatus": "CONFIRMED"
}
```

## Job cards

### GET /api/job-cards
Queries: `status`, `overdue`, `technicianId` optional.

### GET /api/job-cards/{id}
Response: `JobCardResponse`.

### POST /api/job-cards
Request: `JobCardCreateRequest`. Returns `201 Created`.

Rules:
- Booking must exist and be `CONFIRMED`.
- Only one job card per booking.
- Technician must exist and be `AVAILABLE` when supplied.
- Initial status is always `OPEN`.
- `promisedDate` cannot be earlier than `openedDate`.
- Backend generates `jobCardNumber`.
- Backend calculates all task amounts and `labourEstimate`.

### PUT /api/job-cards/{id}
Request: `JobCardUpdateRequest`. Returns `200 OK`.

Rules:
- Status transitions: `OPEN -> IN_PROGRESS | ON_HOLD`, `IN_PROGRESS -> ON_HOLD | COMPLETED`, `ON_HOLD -> IN_PROGRESS`, `COMPLETED -> DELIVERED`, `DELIVERED -> none`.
- Same-status updates are allowed for non-terminal statuses.
- `COMPLETED` requires non-blank `completionNotes`; a completed card can only transition to `DELIVERED` and cannot otherwise be edited.
- `DELIVERED` cannot be edited.
- `completedAt` is set when a card first becomes `COMPLETED`, and `deliveredAt` when it first becomes `DELIVERED`; both are preserved after completion.
- A job card may have no technician (`technicianId: null`); supplied technicians follow the same availability rule.
- Backend recalculates amounts and estimate.

### DELETE /api/job-cards/{id}
Returns `204 No Content`. Returns `409 Conflict` for `COMPLETED` or `DELIVERED`. On success the linked booking returns to `CONFIRMED`.

```json
JobCardCreateRequest {
  "bookingId": 8,
  "technicianId": 1,
  "openedDate": "2026-11-26",
  "promisedDate": "2026-12-03",
  "serviceTasks": [
    {
      "taskName": "Oil change",
      "description": "Replace engine oil and filter",
      "estimatedHours": 1.5,
      "hourlyRate": 45.00,
      "amount": 0
    }
  ]
}

JobCardUpdateRequest {
  "technicianId": 1,
  "openedDate": "2026-11-26",
  "promisedDate": "2026-12-03",
  "jobStatus": "IN_PROGRESS",
  "completionNotes": null,
  "serviceTasks": [
    {
      "taskName": "Oil change",
      "description": "Replace engine oil and filter",
      "estimatedHours": 1.5,
      "hourlyRate": 45.00,
      "amount": 0
    }
  ]
}

ServiceTask {
  "taskName": "Oil change",
  "description": "Replace engine oil and filter",
  "estimatedHours": 1.5,
  "hourlyRate": 45.00,
  "amount": 67.50
}

StatusHistoryEntry {
  "fromStatus": null,
  "toStatus": "OPEN",
  "changedAt": "2026-11-26T10:15:30",
  "note": "Job card opened"
}

JobCardResponse {
  "id": 1,
  "jobCardNumber": "JC-2026-0008",
  "bookingId": 8,
  "bookingNumber": "BK-2026-0008",
  "technicianId": 1,
  "technicianName": "Daniel Mwangi",
  "openedDate": "2026-11-26",
  "promisedDate": "2026-12-03",
  "labourEstimate": 67.50,
  "jobStatus": "OPEN",
  "completionNotes": null,
  "completedAt": null,
  "deliveredAt": null,
  "serviceTasks": [
    {
      "taskName": "Oil change",
      "description": "Replace engine oil and filter",
      "estimatedHours": 1.5,
      "hourlyRate": 45.00,
      "amount": 67.50
    }
  ],
  "statusHistory": [
    {
      "fromStatus": null,
      "toStatus": "OPEN",
      "changedAt": "2026-11-26T10:15:30",
      "note": "Job card opened"
    }
  ]
}
```

## Dashboard and reports

### GET /api/dashboard/summary
```json
{
  "customers": 3,
  "vehicles": 5,
  "bookings": 7,
  "jobCards": 5,
  "overdueJobs": 1,
  "upcomingJobs": 2
}
```

### GET /api/dashboard/job-status-counts
Returns one entry for every status, including zero counts.

```json
[
  { "status": "OPEN", "count": 1 },
  { "status": "IN_PROGRESS", "count": 1 },
  { "status": "ON_HOLD", "count": 1 },
  { "status": "COMPLETED", "count": 1 },
  { "status": "DELIVERED", "count": 1 }
]
```

### GET /api/dashboard/delayed-jobs
Overdue means `promisedDate < today` and `jobStatus` is not `COMPLETED` or `DELIVERED`.

Response: array of `JobCardResponse`.

### GET /api/dashboard/upcoming-jobs
Upcoming means `promisedDate >= today` and `jobStatus` is not `COMPLETED` or `DELIVERED`, ordered by `promisedDate`.

Response: array of `JobCardResponse`.

### GET /api/reports/completed-job-cards
Response: array of `JobCardResponse` with status `COMPLETED` or `DELIVERED`.

## HTTP status conventions
- `200 OK`: successful read or update.
- `201 Created`: successful create.
- `204 No Content`: successful delete.
- `400 Bad Request`: validation failure.
- `404 Not Found`: missing record.
- `409 Conflict`: duplicate value, invalid state, protected delete, or dependency conflict.
